/**
 * DykeSense-ZW Full-Stack Express Server
 * Serves REST APIs and mounts Vite development middleware on Port 3000
 */

import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import {
  SEED_CLAIMS,
  SEED_SCREENING,
  SEED_SURVEYS,
  SEED_INVERSIONS,
  SEED_SAMPLES,
  SEED_TARGET_CARDS,
  SEED_EQUIPMENT,
  SEED_BOOKINGS,
  SEED_AUDIT_LOG,
} from './src/data/seedData.ts';
import { invertMagneticProfile } from './src/services/geophysics.ts';
import { interpretAnomalyWithGemini } from './src/services/geminiServer.ts';
import {
  ClaimPolygon,
  MagnetometerReading,
  InversionModel,
  SampleBag,
  CustodyEvent,
  LabAssay,
  TargetCard,
  SurveyBooking,
  AuditLogEntry,
  UserRole,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '20mb' }));

// In-Memory Database State (initialized with seed data)
const db = {
  claims: [...SEED_CLAIMS],
  screening: [...SEED_SCREENING],
  surveys: [...SEED_SURVEYS],
  inversions: [...SEED_INVERSIONS],
  samples: [...SEED_SAMPLES],
  targetCards: [...SEED_TARGET_CARDS],
  equipment: [...SEED_EQUIPMENT],
  bookings: [...SEED_BOOKINGS],
  auditLog: [...SEED_AUDIT_LOG],
  smsDispatches: [
    {
      id: 'sms-001',
      recipientPhone: '+263 77 234 5678',
      recipientName: 'M. Sibanda (Kushinga Chairperson)',
      message: 'DykeSense Alert: Target Card TC-MUTO-01 published for Seam 4. Recommendation: Shallow trenching 14m apex target. Geologist signed off.',
      timestamp: '2026-10-13T10:45:00Z',
      networkStatus: 'DELIVERED_ECONET',
    },
    {
      id: 'sms-002',
      recipientPhone: '+263 71 889 1234',
      recipientName: 'J. Ndoro (Zvimba Co-op Secretary)',
      message: 'DykeSense Alert: Hub Booking bk-2026-101 confirmed. Equipment: GSM-19 Magnetometer available for pickup at Gweru Hub.',
      timestamp: '2026-10-14T09:10:00Z',
      networkStatus: 'DELIVERED_NETONE',
    },
  ],
};

// SHA-256 Hash Helper for Audit Ledger and Custody Events
function generateHash(previousHash: string, data: any): string {
  const content = previousHash + JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function appendAuditLog(
  action: string,
  actorName: string,
  actorRole: UserRole,
  details: string
): AuditLogEntry {
  const lastEntry = db.auditLog[db.auditLog.length - 1];
  const prevHash = lastEntry ? lastEntry.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();
  const currentHash = generateHash(prevHash, { action, actorName, details, timestamp });

  const newLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    timestamp,
    action,
    actorName,
    actorRole,
    details,
    previousHash: prevHash,
    currentHash,
  };
  db.auditLog.push(newLog);
  return newLog;
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DykeSense-ZW Exploration Engine',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
  });
});

// Mining Claims (Role-filtered: Sensitive coordinates masked for unauthorized viewers)
app.get('/api/claims', (req, res) => {
  const userRole = (req.query.role as UserRole) || 'asm_user';
  const allowedFullCoords = ['geologist', 'hub_admin', 'viewer_regulator'].includes(userRole);

  const filtered = db.claims.map((claim) => {
    if (claim.sensitiveLocation && !allowedFullCoords) {
      return {
        ...claim,
        holder: 'CONFIDENTIAL STATE BUFFER',
        coordinates: claim.coordinates.map(() => [0, 0] as [number, number]),
        maskedForRole: true,
      };
    }
    return claim;
  });

  res.json(filtered);
});

// Satellite Screening Areas
app.get('/api/screening', (req, res) => {
  res.json(db.screening);
});

// Surveys
app.get('/api/surveys', (req, res) => {
  // Return summary without heavy readings payload
  const list = db.surveys.map((s) => ({
    id: s.id,
    claimId: s.claimId,
    name: s.name,
    lineSpacingMeters: s.lineSpacingMeters,
    stationSpacingMeters: s.stationSpacingMeters,
    totalLines: s.totalLines,
    status: s.status,
    operatorName: s.operatorName,
    startDate: s.startDate,
    readingsCount: s.readings.length,
  }));
  res.json(list);
});

app.get('/api/surveys/:id', (req, res) => {
  const survey = db.surveys.find((s) => s.id === req.params.id);
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  res.json(survey);
});

// Sync batch from mobile PWA
app.post('/api/surveys/sync-batch', (req, res) => {
  const { readings } = req.body;
  if (!Array.isArray(readings) || readings.length === 0) {
    return res.status(400).json({ error: 'No readings provided' });
  }

  let count = 0;
  for (const r of readings as MagnetometerReading[]) {
    const survey = db.surveys.find((s) => s.id === r.surveyId);
    if (survey) {
      const existingIdx = survey.readings.findIndex((existing) => existing.id === r.id);
      if (existingIdx >= 0) {
        survey.readings[existingIdx] = { ...r, synced: true };
      } else {
        survey.readings.push({ ...r, synced: true });
      }
      count++;
    }
  }

  appendAuditLog(
    'OFFLINE_BATCH_SYNC',
    readings[0]?.operator || 'Field Surveyor',
    'surveyor',
    `Synchronized ${count} magnetometer readings from field cache into survey ${readings[0]?.surveyId}.`
  );

  res.json({ success: true, syncedCount: count });
});

// 2D Profile Inversion Endpoint
app.post('/api/process/invert', (req, res) => {
  const { surveyId, lineId, initialDepthEstM } = req.body;
  const survey = db.surveys.find((s) => s.id === surveyId);
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  const lineReadings = survey.readings.filter((r) => !lineId || r.lineId === lineId);
  if (lineReadings.length < 5) {
    return res.status(400).json({ error: 'Insufficient station data to invert profile (minimum 5 stations required)' });
  }

  const stations = lineReadings.map((r) => r.stationNumber * survey.stationSpacingMeters);
  const observed = lineReadings.map((r) => r.diurnalCorrectedNt);

  const result = invertMagneticProfile(stations, observed, initialDepthEstM || 15.0);

  const newInversion: InversionModel = {
    id: `inv-${Date.now()}`,
    surveyId: survey.id,
    anomalyName: `${survey.name} Profile (${lineId || 'Composite'})`,
    calculatedDepthM: result.calculatedDepthM,
    depthUncertaintyM: result.depthUncertaintyM,
    estimatedWidthM: result.estimatedWidthM,
    dipDegrees: result.dipDegrees,
    strikeDegrees: 184,
    magneticSusceptibilitySI: result.magneticSusceptibilitySI,
    anomalyAmplitudeNt: Math.round(Math.max(...observed) - Math.min(...observed)),
    rmsResidualNt: result.rmsResidualNt,
    geologistApproved: false,
    simulatedObservedProfile: result.modeledProfile,
  };

  db.inversions.push(newInversion);

  appendAuditLog(
    'INVERSION_CALCULATED',
    'Geophysics Engine',
    'geologist',
    `2D Dyke Inversion calculated for survey ${survey.id}: Depth ${result.calculatedDepthM}m ± ${result.depthUncertaintyM}m, RMS ${result.rmsResidualNt} nT.`
  );

  res.json(newInversion);
});

// Geologist Sign-Off on Inversion
app.post('/api/inversions/:id/approve', (req, res) => {
  const { geologistName, geologistNotes } = req.body;
  const inv = db.inversions.find((i) => i.id === req.params.id);
  if (!inv) {
    return res.status(404).json({ error: 'Inversion model not found' });
  }

  inv.geologistApproved = true;
  inv.approvedBy = geologistName || 'Dr. F. Ndlovu (Pr.Sci.Nat)';
  inv.approvalDate = new Date().toISOString();
  inv.geologistNotes = geologistNotes || 'Profile fit validated against Great Dyke ultramafic stratigraphic package. Trenching recommended.';

  const approvedBy = inv.approvedBy || 'Dr. F. Ndlovu (Pr.Sci.Nat)';
  appendAuditLog(
    'GEOLOGIST_APPROVAL',
    approvedBy,
    'geologist',
    `QA/QC Approval granted on inversion ${inv.id} (${inv.anomalyName}). Mandatory trenching notice enforced.`
  );

  res.json(inv);
});

// Samples & QR Chain-of-Custody
app.get('/api/samples', (req, res) => {
  res.json(db.samples);
});

app.post('/api/samples', (req, res) => {
  const { sampleId, claimId, surveyId, anomalyId, sampleType, sampleWeightKg, lat, lng, samplerName } = req.body;
  if (!sampleId || !claimId) {
    return res.status(400).json({ error: 'Sample ID and Claim ID are required' });
  }

  const initialCustody: CustodyEvent = {
    id: `cust-${Date.now()}`,
    sampleId,
    status: 'bag_registered',
    timestamp: new Date().toISOString(),
    actorName: samplerName || 'Field Sampler',
    actorRole: 'surveyor',
    location: 'Field Pit / Trench',
    hashSignature: generateHash('0000000000000000000000000000000000000000000000000000000000000000', {
      sampleId,
      claimId,
      sampleType,
      sampleWeightKg,
    }),
    notes: 'QR-coded bag registered and sealed at field location.',
  };

  const newSample: SampleBag = {
    id: sampleId,
    claimId,
    surveyId,
    anomalyId,
    sampleType: sampleType || 'Stratiform_Seam',
    sampleWeightKg: sampleWeightKg || 3.5,
    lat: lat || -17.145,
    lng: lng || 30.645,
    collectedAt: new Date().toISOString(),
    samplerName: samplerName || 'Field Sampler',
    qrCodeDataUrl: '',
    custodyHistory: [initialCustody],
  };

  db.samples.unshift(newSample);

  appendAuditLog(
    'SAMPLE_REGISTERED',
    newSample.samplerName,
    'surveyor',
    `Sample ${newSample.id} (${newSample.sampleType}, ${newSample.sampleWeightKg}kg) registered on claim ${claimId}.`
  );

  res.json(newSample);
});

// Add Custody Transition
app.post('/api/samples/:id/custody', (req, res) => {
  const { status, actorName, actorRole, location, notes } = req.body;
  const sample = db.samples.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Sample not found' });
  }

  const prevEvent = sample.custodyHistory[sample.custodyHistory.length - 1];
  const prevHash = prevEvent ? prevEvent.hashSignature : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();
  const hashSignature = generateHash(prevHash, { sampleId: sample.id, status, actorName, location, timestamp });

  const event: CustodyEvent = {
    id: `cust-${Date.now()}`,
    sampleId: sample.id,
    status,
    timestamp,
    actorName: actorName || 'Hub Admin',
    actorRole: actorRole || 'hub_admin',
    location: location || 'Regional Mineral Hub',
    hashSignature,
    notes: notes || 'Custody transition recorded.',
  };

  sample.custodyHistory.push(event);

  appendAuditLog(
    'CUSTODY_HANDOVER',
    event.actorName,
    event.actorRole,
    `Sample ${sample.id} transitioned to state: ${event.status} at ${event.location}. Hash: ${event.hashSignature.slice(0, 12)}...`
  );

  res.json(sample);
});

// Register Lab Assay (Screening vs Certified)
app.post('/api/samples/:id/assay', (req, res) => {
  const { labName, assayMethod, cr2o3Percent, feoPercent, certificateNumber, isCertified } = req.body;
  const sample = db.samples.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Sample not found' });
  }

  const cr = Number(cr2o3Percent) || 42.0;
  const fe = Number(feoPercent) || 15.0;
  const ratio = Number((cr / fe).toFixed(2));

  let grade: LabAssay['gradeClassification'] = 'Medium-Grade Chemical';
  if (ratio >= 2.8 && cr >= 45) {
    grade = 'High-Grade Metallurgical (>2.8:1)';
  } else if (ratio < 2.0 || cr < 38) {
    grade = 'Refractory (<2.0:1)';
  }

  const assay: LabAssay = {
    id: `asy-${Date.now()}`,
    sampleId: sample.id,
    labName: labName || 'Institute of Mining Research (IMR)',
    assayMethod: assayMethod || 'Certified_ICP_OES_FireAssay',
    cr2o3Percent: cr,
    feoPercent: fe,
    crFeRatio: ratio,
    gradeClassification: grade,
    isCertified: Boolean(isCertified),
    certifiedDate: isCertified ? new Date().toISOString().split('T')[0] : undefined,
    certificateNumber: certificateNumber || (isCertified ? `IMR-CERT-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
  };

  sample.assay = assay;

  // Add assay custody event
  const prevEvent = sample.custodyHistory[sample.custodyHistory.length - 1];
  const prevHash = prevEvent ? prevEvent.hashSignature : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();
  const hashSignature = generateHash(prevHash, { assayId: assay.id, cr2o3: cr, crFeRatio: ratio });

  sample.custodyHistory.push({
    id: `cust-${Date.now()}`,
    sampleId: sample.id,
    status: 'assay_complete',
    timestamp,
    actorName: assay.labName,
    actorRole: 'lab_tech',
    location: 'Analytical Laboratory',
    hashSignature,
    notes: `Assay logged: Cr2O3 ${cr}%, Cr:Fe ${ratio}:1 (${assay.gradeClassification}) [${assay.assayMethod}].`,
  });

  appendAuditLog(
    'LAB_ASSAY_RECORDED',
    assay.labName,
    'lab_tech',
    `Assay logged for sample ${sample.id}: Cr2O3 ${cr}%, Cr:Fe ${ratio}:1. Certified: ${assay.isCertified}`
  );

  res.json(sample);
});

// Target Cards
app.get('/api/target-cards', (req, res) => {
  res.json(db.targetCards);
});

app.post('/api/target-cards', (req, res) => {
  const {
    claimId,
    targetCode,
    priorityLevel,
    plainEnglishSummary,
    shonaSummary,
    ndebeleSummary,
    evidenceFactors,
    disclosedUncertainty,
    geologistName,
  } = req.body;

  const claim = db.claims.find((c) => c.id === claimId);
  const newCard: TargetCard = {
    id: `tc-${Date.now()}`,
    targetCode: targetCode || `TC-ZW-${Math.floor(100 + Math.random() * 900)}`,
    claimId: claimId || 'claim-muto-01',
    claimName: claim ? claim.name : 'Mutorashanga Chrome Seam',
    subChamber: claim ? claim.subChamber : 'Darwendale',
    priorityLevel: priorityLevel || 'Priority 1 — Trenching Required',
    plainEnglishSummary,
    shonaSummary,
    ndebeleSummary,
    evidenceFactors: evidenceFactors || {
      magneticAnomalyNt: 310,
      depthEstimateM: '15.0m ± 3m',
      satelliteCorrelation: 'High Ferric Iron',
      accessFeasibility: 'Permit cleared',
    },
    disclosedUncertainty: disclosedUncertainty || 'Depth uncertainty ±3m. Strike continuity not proven beyond surveyed transect.',
    statutoryCaveat: 'Exploration Target only — Not a SAMREC/JORC compliant resource. Physical verification by trenching or pitting is mandatory before extraction.',
    geologistSignedOff: true,
    geologistName: geologistName || 'Dr. F. Ndlovu (Pr.Sci.Nat)',
    datePublished: new Date().toISOString().split('T')[0],
  };

  db.targetCards.unshift(newCard);

  appendAuditLog(
    'TARGET_CARD_PUBLISHED',
    newCard.geologistName || 'Geologist',
    'geologist',
    `Target Card ${newCard.targetCode} published for claim ${newCard.claimName}. Priority: ${newCard.priorityLevel}.`
  );

  res.json(newCard);
});

// Shared Equipment Fleet & Bookings
app.get('/api/equipment', (req, res) => {
  res.json(db.equipment);
});

app.get('/api/bookings', (req, res) => {
  res.json(db.bookings);
});

app.post('/api/bookings', (req, res) => {
  const {
    cooperativeName,
    contactPerson,
    phone,
    claimId,
    hectares,
    scheduledDate,
    equipmentIds,
    coopMemberCount,
  } = req.body;

  const ha = Number(hectares) || 10;
  const members = Number(coopMemberCount) || 5;

  // Rate formula: $7.50 per hectare + $35/day equipment base
  const totalUSD = Number((ha * 7.50 + 35.0).toFixed(2));
  const totalZWG = Number((totalUSD * 28.0).toFixed(2)); // approx Zimbabwe Gold exchange
  const perMember = Number((totalUSD / members).toFixed(2));

  const booking: SurveyBooking = {
    id: `bk-${Date.now()}`,
    cooperativeName: cooperativeName || 'Harare ASM Syndicate',
    contactPerson: contactPerson || 'Syndicate Leader',
    phone: phone || '+263 77 000 0000',
    claimId: claimId || 'claim-muto-01',
    hectares: ha,
    scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
    equipmentIds: equipmentIds || ['eq-gsm19-01'],
    totalCostUSD: totalUSD,
    totalCostZWG: totalZWG,
    coopMemberCount: members,
    costPerMemberUSD: perMember,
    status: 'confirmed',
  };

  db.bookings.unshift(booking);

  appendAuditLog(
    'EQUIPMENT_BOOKING_CREATED',
    booking.contactPerson,
    'asm_user',
    `Booking ${booking.id} confirmed for ${booking.cooperativeName}: ${ha} ha at $${totalUSD} USD ($${perMember}/member).`
  );

  res.json(booking);
});

// Cryptographic Audit Ledger
app.get('/api/audit-log', (req, res) => {
  // Return ledger entries with chain verification status
  let isValid = true;
  for (let i = 1; i < db.auditLog.length; i++) {
    const prev = db.auditLog[i - 1];
    const curr = db.auditLog[i];
    if (curr.previousHash !== prev.currentHash) {
      isValid = false;
      break;
    }
  }

  res.json({
    chainLength: db.auditLog.length,
    isCryptographicallyIntact: isValid,
    entries: db.auditLog,
  });
});

// AI Geoscientist Assistant (Calls Gemini 3.8 Flash with structured schema)
app.post('/api/ai/interpret', async (req, res) => {
  try {
    const input = req.body;
    const result = await interpretAnomalyWithGemini({
      subChamber: input.subChamber || 'Darwendale',
      claimName: input.claimName || 'Mutorashanga North Seam 4',
      anomalyAmplitudeNt: Number(input.anomalyAmplitudeNt) || 340,
      calculatedDepthM: Number(input.calculatedDepthM) || 14.0,
      depthUncertaintyM: Number(input.depthUncertaintyM) || 2.5,
      estimatedWidthM: Number(input.estimatedWidthM) || 5.0,
      dipDegrees: Number(input.dipDegrees) || 74,
      rmsResidualNt: Number(input.rmsResidualNt) || 18.0,
      satelliteAlterationIndex: Number(input.satelliteAlterationIndex) || 86,
      requestorRole: input.requestorRole || 'geologist',
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI interpretation failed' });
  }
});

// SMS Dispatch Simulator for Rural ASM (Econet / NetOne)
app.get('/api/sms', (req, res) => {
  res.json(db.smsDispatches);
});

app.post('/api/sms/send-simulation', (req, res) => {
  const { recipientPhone, recipientName, message } = req.body;
  const dispatch = {
    id: `sms-${Date.now()}`,
    recipientPhone: recipientPhone || '+263 77 123 4567',
    recipientName: recipientName || 'Cooperative Executive',
    message: message || 'DykeSense Alert: Survey completed and processed.',
    timestamp: new Date().toISOString(),
    networkStatus: Math.random() > 0.5 ? 'DELIVERED_ECONET' : 'DELIVERED_NETONE',
  };

  db.smsDispatches.unshift(dispatch);

  appendAuditLog(
    'SMS_ALERT_DISPATCHED',
    'SMS Gateway',
    'hub_admin',
    `SMS dispatched to ${dispatch.recipientPhone} (${dispatch.recipientName}). Status: ${dispatch.networkStatus}.`
  );

  res.json(dispatch);
});

// -------------------------------------------------------------
// VITE DEV SERVER INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(` DykeSense-ZW Platform running on http://localhost:${PORT}`);
    console.log(` Geological AI, Satellite Screening & Field PWA Active`);
    console.log(`======================================================\n`);
  });
}

startServer();
