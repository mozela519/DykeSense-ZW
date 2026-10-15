/**
 * DykeSense-ZW: Comprehensive Seed Data for Great Dyke, Zimbabwe
 * Realistic geological settings: Mutorashanga, Darwendale, Sebakwe, and Shurugwi.
 * Clearly labeled as simulated exploration survey data.
 */

import {
  ClaimPolygon,
  SatelliteScreeningArea,
  SurveyGrid,
  MagnetometerReading,
  InversionModel,
  SampleBag,
  TargetCard,
  EquipmentItem,
  SurveyBooking,
  AuditLogEntry,
} from '../types';
import { invertMagneticProfile, calculateDykeMagneticAnomaly } from '../services/geophysics';

export const SEED_CLAIMS: ClaimPolygon[] = [
  {
    id: 'claim-muto-01',
    claimNumber: 'ZW-COMM-2024-MTR-881',
    name: 'Mutorashanga North Chrome Seam 4',
    subChamber: 'Darwendale',
    cooperativeName: 'Kushinga Chromite Mining Syndicate (ASM)',
    holder: 'Kushinga Cooperative (32 members)',
    areaHectares: 48.5,
    accessStatus: 'cleared',
    sensitiveLocation: false,
    minLat: -17.152,
    maxLat: -17.140,
    minLng: 30.640,
    maxLng: 30.655,
    coordinates: [
      [-17.140, 30.640],
      [-17.140, 30.655],
      [-17.152, 30.655],
      [-17.152, 30.640],
    ],
    permitExpiry: '2028-11-30',
    commodity: 'Chromite',
  },
  {
    id: 'claim-darw-02',
    claimNumber: 'ZW-COMM-2023-DRW-419',
    name: 'Darwendale West Serpentinite Block',
    subChamber: 'Darwendale',
    cooperativeName: 'Zvimba Youth Mineral Cooperative',
    holder: 'Zvimba Youth Minerals Ltd',
    areaHectares: 62.0,
    accessStatus: 'cleared',
    sensitiveLocation: false,
    minLat: -17.720,
    maxLat: -17.705,
    minLng: 30.540,
    maxLng: 30.560,
    coordinates: [
      [-17.705, 30.540],
      [-17.705, 30.560],
      [-17.720, 30.560],
      [-17.720, 30.540],
    ],
    permitExpiry: '2027-06-15',
    commodity: 'Chromite',
  },
  {
    id: 'claim-lala-03',
    claimNumber: 'ZW-COMM-2024-LAL-102',
    name: 'Lalapanzi Railway Boundary Seam',
    subChamber: 'Sebakwe',
    cooperativeName: 'Chirumanzu ASM Chrome Miners',
    holder: 'Chirumanzu ASM Consortium',
    areaHectares: 35.4,
    accessStatus: 'pending_inspection',
    sensitiveLocation: false,
    minLat: -19.325,
    maxLat: -19.310,
    minLng: 30.180,
    maxLng: 30.198,
    coordinates: [
      [-19.310, 30.180],
      [-19.310, 30.198],
      [-19.325, 30.198],
      [-19.325, 30.180],
    ],
    permitExpiry: '2026-12-31',
    commodity: 'Chromite',
  },
  {
    id: 'claim-shur-04',
    claimNumber: 'ZW-COMM-2022-SHU-772',
    name: 'Selukwe Peak Podiform Chrome Deposit',
    subChamber: 'Selukwe_Shurugwi',
    cooperativeName: 'Selukwe Chrome Workers Cooperative',
    holder: 'Selukwe Mineral Development Co-op',
    areaHectares: 85.0,
    accessStatus: 'cleared',
    sensitiveLocation: false,
    minLat: -19.670,
    maxLat: -19.650,
    minLng: 29.980,
    maxLng: 30.005,
    coordinates: [
      [-19.650, 29.980],
      [-19.650, 30.005],
      [-19.670, 30.005],
      [-19.670, 29.980],
    ],
    permitExpiry: '2029-04-10',
    commodity: 'Chromite',
  },
  {
    id: 'claim-sens-05',
    claimNumber: 'ZW-COMM-2025-RES-009',
    name: 'Sebakwe Ecological Buffer & Disputed Claim',
    subChamber: 'Sebakwe',
    cooperativeName: 'Undisclosed Syndicate',
    holder: 'State Forest Boundary Contested',
    areaHectares: 110.0,
    accessStatus: 'restricted_sensitive',
    sensitiveLocation: true,
    minLat: -19.100,
    maxLat: -19.080,
    minLng: 30.250,
    maxLng: 30.275,
    coordinates: [
      [-19.080, 30.250],
      [-19.080, 30.275],
      [-19.100, 30.275],
      [-19.100, 30.250],
    ],
    permitExpiry: '2025-01-01',
    commodity: 'Chromite',
  },
];

export const SEED_SCREENING: SatelliteScreeningArea[] = [
  {
    id: 'scr-muto-01',
    name: 'Mutorashanga North Spectral Prospect (Seam 4)',
    subChamber: 'Darwendale (North)',
    lat: -17.1462,
    lng: 30.6478,
    ferricIronIndex: 86.4,
    ferrousIronIndex: 78.2,
    swirAlteration: 89.5,
    ndviVegetationIndex: 0.14, // low vegetation, high outcrop exposure
    prospectivityScore: 91.2,
    spectralBands: {
      b2Blue: 0.082,
      b3Green: 0.124,
      b4Red: 0.198,
      b8Nir: 0.245,
      b11Swir1: 0.385,
      b12Swir2: 0.442,
    },
    factors: {
      spectralAnomaly: 92,
      structuralLinearity: 95,
      historicOccurrences: 88,
      terrainAccessibility: 90,
    },
    uncertaintyRating: 'Low',
    recommendation: 'Top exploration candidate. High ferric iron and serpentine alteration lining along strike of Seam 4.',
  },
  {
    id: 'scr-darw-02',
    name: 'Darwendale West Alteration Corridor',
    subChamber: 'Darwendale (Central)',
    lat: -17.7125,
    lng: 30.5510,
    ferricIronIndex: 72.8,
    ferrousIronIndex: 64.1,
    swirAlteration: 77.0,
    ndviVegetationIndex: 0.22,
    prospectivityScore: 78.5,
    spectralBands: {
      b2Blue: 0.095,
      b3Green: 0.138,
      b4Red: 0.182,
      b8Nir: 0.280,
      b11Swir1: 0.320,
      b12Swir2: 0.355,
    },
    factors: {
      spectralAnomaly: 79,
      structuralLinearity: 82,
      historicOccurrences: 75,
      terrainAccessibility: 78,
    },
    uncertaintyRating: 'Moderate',
    recommendation: 'Promising pyroxenite-serpentinite contact. Secondary soil cover dampens SWIR response; ground mag recommended.',
  },
  {
    id: 'scr-shur-03',
    name: 'Selukwe South Podiform Gossan Cluster',
    subChamber: 'Selukwe (South)',
    lat: -19.6612,
    lng: 29.9935,
    ferricIronIndex: 88.0,
    ferrousIronIndex: 82.5,
    swirAlteration: 84.1,
    ndviVegetationIndex: 0.11,
    prospectivityScore: 87.4,
    spectralBands: {
      b2Blue: 0.076,
      b3Green: 0.118,
      b4Red: 0.215,
      b8Nir: 0.230,
      b11Swir1: 0.410,
      b12Swir2: 0.468,
    },
    factors: {
      spectralAnomaly: 86,
      structuralLinearity: 84,
      historicOccurrences: 95,
      terrainAccessibility: 85,
    },
    uncertaintyRating: 'Low',
    recommendation: 'Historic podiform host rocks showing intense limonitic/ferric gossan signature. Ground verification prioritized.',
  },
  {
    id: 'scr-lala-04',
    name: 'Lalapanzi Railway Structural Contact',
    subChamber: 'Sebakwe',
    lat: -19.3210,
    lng: 30.1895,
    ferricIronIndex: 79.5,
    ferrousIronIndex: 71.0,
    swirAlteration: 81.2,
    ndviVegetationIndex: 0.18,
    prospectivityScore: 83.0,
    spectralBands: {
      b2Blue: 0.088,
      b3Green: 0.130,
      b4Red: 0.190,
      b8Nir: 0.260,
      b11Swir1: 0.360,
      b12Swir2: 0.395,
    },
    factors: {
      spectralAnomaly: 82,
      structuralLinearity: 85,
      historicOccurrences: 80,
      terrainAccessibility: 85,
    },
    uncertaintyRating: 'Moderate',
    recommendation: 'Linear ferric anomaly along boundary shear. Favorable road access for ground magnetometer deployment.',
  },
];

/**
 * Generate 5 grid lines of realistic ground magnetometer data:
 * Simulating a chromite seam crossing the grid at 50m easting (station 10).
 */
export function generateSeedGridReadings(surveyId: string): MagnetometerReading[] {
  const readings: MagnetometerReading[] = [];
  const lineCount = 5;
  const stationsPerLine = 21; // 0m to 100m, 5m spacing
  const baseBackgroundNt = 31200;

  for (let l = 1; l <= lineCount; l++) {
    const lineId = `L0${l}N`;
    const latBase = -17.1450 + (l - 1) * 0.00022; // ~25m line spacing
    const diurnalDrift = Math.sin((l / lineCount) * Math.PI) * 14.0; // Diurnal field variation

    for (let s = 0; s < stationsPerLine; s++) {
      const stationDist = s * 5; // 0, 5, 10, ... 100m
      const lng = 30.6450 + s * 0.000045; // ~5m station spacing
      
      // Calculate dipping chromite dyke anomaly centered around station 50m (s = 10)
      // Chromite body: depth 14m, width 5m, dip 74 deg, susceptibility 0.042 SI
      const anomalyNt = calculateDykeMagneticAnomaly(stationDist, 50, 14, 5, 74, 0.042, baseBackgroundNt);
      
      // Add realistic measurement noise (+/- 3.5 nT)
      const noise = (Math.sin(s * 1.7 + l) * 2.8) + (Math.cos(s * 3.1) * 1.5);
      const rawNt = Number((baseBackgroundNt + diurnalDrift + anomalyNt + noise).toFixed(2));
      const baseStationNt = Number((baseBackgroundNt + diurnalDrift).toFixed(2));
      const correctedNt = Number((rawNt - (baseStationNt - baseBackgroundNt)).toFixed(2));

      readings.push({
        id: `rd-${surveyId}-${lineId}-${s}`,
        surveyId,
        lineId,
        stationNumber: s,
        lat: Number(latBase.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        rawTotalFieldNt: rawNt,
        diurnalBaseNt: baseStationNt,
        diurnalCorrectedNt: correctedNt,
        timestamp: new Date(Date.now() - (lineCount - l) * 3600000 - (stationsPerLine - s) * 60000).toISOString(),
        signalQuality: 98,
        operator: 'T. Mukarati (Registered Surveyor)',
        synced: true,
        isSimulated: true,
      });
    }
  }

  return readings;
}

const seedSurveyId = 'srv-muto-2026-01';
const initialReadings = generateSeedGridReadings(seedSurveyId);

export const SEED_SURVEYS: SurveyGrid[] = [
  {
    id: seedSurveyId,
    claimId: 'claim-muto-01',
    name: 'Mutorashanga Grid A: Seam 4 Traverse',
    lineSpacingMeters: 25.0,
    stationSpacingMeters: 5.0,
    totalLines: 5,
    baseStationFrequencyMin: 30,
    status: 'qa_approved',
    operatorId: 'user-surv-01',
    operatorName: 'T. Mukarati (Cert. Surveyor)',
    startDate: '2026-10-10',
    targetDepthExpectedM: 15.0,
    totalReadingsCount: initialReadings.length,
    readings: initialReadings,
  },
  {
    id: 'srv-darw-2026-02',
    claimId: 'claim-darw-02',
    name: 'Darwendale South Grid B',
    lineSpacingMeters: 25.0,
    stationSpacingMeters: 5.0,
    totalLines: 4,
    baseStationFrequencyMin: 30,
    status: 'in_progress',
    operatorId: 'user-surv-01',
    operatorName: 'T. Mukarati',
    startDate: '2026-10-14',
    targetDepthExpectedM: 20.0,
    totalReadingsCount: 0,
    readings: [],
  },
];

// Profile for Line 03N (centerline)
const line03Readings = initialReadings.filter(r => r.lineId === 'L03N');
const stationsDist = line03Readings.map(r => r.stationNumber * 5);
const observedVals = line03Readings.map(r => r.diurnalCorrectedNt);

const inversionResult = invertMagneticProfile(stationsDist, observedVals, 14.0);

export const SEED_INVERSIONS: InversionModel[] = [
  {
    id: 'inv-muto-01',
    surveyId: seedSurveyId,
    anomalyName: 'Mutorashanga Anomaly Alpha-1',
    calculatedDepthM: inversionResult.calculatedDepthM,
    depthUncertaintyM: inversionResult.depthUncertaintyM,
    estimatedWidthM: inversionResult.estimatedWidthM,
    dipDegrees: inversionResult.dipDegrees,
    strikeDegrees: 184, // Great Dyke N-S general trend
    magneticSusceptibilitySI: inversionResult.magneticSusceptibilitySI,
    anomalyAmplitudeNt: 342.5,
    rmsResidualNt: inversionResult.rmsResidualNt,
    geologistApproved: true,
    approvedBy: 'Dr. F. Ndlovu (Pr.Sci.Nat, Geologist)',
    approvalDate: '2026-10-12',
    geologistNotes: 'Sharp asymmetric total-field anomaly consistent with a steeply east-dipping (74°) stratiform chromite seam. Depth to apex is 14m +/- 2.5m. Recommend shallow backhoe trenching along 50m station coordinate.',
    simulatedObservedProfile: inversionResult.modeledProfile,
  },
];

export const SEED_SAMPLES: SampleBag[] = [
  {
    id: 'DYKE-SAMP-2026-084',
    claimId: 'claim-muto-01',
    surveyId: seedSurveyId,
    anomalyId: 'inv-muto-01',
    sampleType: 'Stratiform_Seam',
    sampleWeightKg: 4.8,
    lat: -17.1454,
    lng: 30.6455,
    collectedAt: '2026-10-12T09:30:00Z',
    samplerName: 'K. Sibanda (Field Sampler)',
    qrCodeDataUrl: '', // generated client-side via qrcode
    custodyHistory: [
      {
        id: 'cust-01',
        sampleId: 'DYKE-SAMP-2026-084',
        status: 'bag_registered',
        timestamp: '2026-10-12T09:00:00Z',
        actorName: 'K. Sibanda',
        actorRole: 'surveyor',
        location: 'Mutorashanga Field Office',
        hashSignature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        notes: 'Tamper-evident QR bag scanned and registered at trench 01.',
      },
      {
        id: 'cust-02',
        sampleId: 'DYKE-SAMP-2026-084',
        status: 'hub_received',
        timestamp: '2026-10-12T14:15:00Z',
        actorName: 'P. Moyo (Hub Admin)',
        actorRole: 'hub_admin',
        location: 'Gweru Regional Exploration Hub',
        hashSignature: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
        notes: 'Sample seal intact. Weight confirmed 4.80 kg. Field XRF screening conducted.',
      },
      {
        id: 'cust-03',
        sampleId: 'DYKE-SAMP-2026-084',
        status: 'in_transit_lab',
        timestamp: '2026-10-13T08:00:00Z',
        actorName: 'Express Minerals Courier',
        actorRole: 'hub_admin',
        location: 'Route: Gweru to Harare Metallurgical Laboratory',
        hashSignature: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        notes: 'Dispatched under manifest ZW-CUST-8841.',
      },
      {
        id: 'cust-04',
        sampleId: 'DYKE-SAMP-2026-084',
        status: 'assay_complete',
        timestamp: '2026-10-14T11:20:00Z',
        actorName: 'Dr. C. Chitiyo (Chief Chemist)',
        actorRole: 'lab_tech',
        location: 'Institute of Mining Research (IMR) Harare',
        hashSignature: 'fc99a4198305c7cfbf9b6ea7d9cc66f916b9d62d3a0429f506e6bf4d9d15d654',
        notes: 'Certified ICP-OES and fire assay completed. Cr2O3 46.8%, Cr:Fe 2.84:1. High-grade metallurgical chrome verified.',
      },
    ],
    assay: {
      id: 'asy-084',
      sampleId: 'DYKE-SAMP-2026-084',
      labName: 'Institute of Mining Research (IMR), Univ of Zimbabwe',
      assayMethod: 'Certified_ICP_OES_FireAssay',
      cr2o3Percent: 46.8,
      feoPercent: 16.5,
      crFeRatio: 2.84,
      gradeClassification: 'High-Grade Metallurgical (>2.8:1)',
      isCertified: true,
      certifiedDate: '2026-10-14',
      certificateNumber: 'IMR-CERT-2026-CH-0482',
    },
  },
  {
    id: 'DYKE-SAMP-2026-085',
    claimId: 'claim-muto-01',
    surveyId: seedSurveyId,
    anomalyId: 'inv-muto-01',
    sampleType: 'Host_Serpentinite',
    sampleWeightKg: 3.2,
    lat: -17.1450,
    lng: 30.6448,
    collectedAt: '2026-10-12T10:15:00Z',
    samplerName: 'K. Sibanda',
    qrCodeDataUrl: '',
    custodyHistory: [
      {
        id: 'cust-10',
        sampleId: 'DYKE-SAMP-2026-085',
        status: 'hub_received',
        timestamp: '2026-10-12T14:15:00Z',
        actorName: 'P. Moyo',
        actorRole: 'hub_admin',
        location: 'Gweru Regional Exploration Hub',
        hashSignature: '3a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123',
        notes: 'Host rock baseline sample. Portable XRF screening only.',
      },
    ],
    assay: {
      id: 'asy-085',
      sampleId: 'DYKE-SAMP-2026-085',
      labName: 'Regional Hub Mobile Lab',
      assayMethod: 'Portable_XRF_Screening',
      cr2o3Percent: 6.2,
      feoPercent: 11.4,
      crFeRatio: 0.54,
      gradeClassification: 'Refractory (<2.0:1)',
      isCertified: false,
    },
  },
];

export const SEED_TARGET_CARDS: TargetCard[] = [
  {
    id: 'tc-muto-01',
    targetCode: 'TC-MUTO-01',
    claimId: 'claim-muto-01',
    claimName: 'Mutorashanga North Chrome Seam 4',
    subChamber: 'Darwendale (North)',
    priorityLevel: 'Priority 1 — Trenching Required',
    plainEnglishSummary: 'High-confidence magnetic anomaly (342 nT peak) indicating a shallow, steeply dipping chromite body at approx 14 meters depth. Satellite alteration confirms strong ferric iron gossan alignment.',
    shonaSummary: 'Pamusoro pemutsara uyu pane dombo rechrome riri pasi nemamita anoda kusvika gumi nemana (14m). Simba remagineti rakakura kwazvo. Zvinokurudzirwa kuti mutange machera mugero (trench) wekutarisa musati maunza michina mikuru.',
    ndebeleSummary: 'Indawo le ibonisa amandla amakhulu kamazibuthe (342 nT) atshengisa umthambo we-chrome otshone phansi ngamamitha angaba litshumi lane (14m). Kufuneka kumbiwe umsele wokuqala wokuhlola ngaphambi kokuthenga imishini emikhulu.',
    evidenceFactors: {
      magneticAnomalyNt: 342.5,
      depthEstimateM: '14.0m ± 2.5m (apex)',
      satelliteCorrelation: 'Ferric Iron Index 86.4%, SWIR Serpentinite 89.5%',
      accessFeasibility: 'Mining permit cleared; cooperative in legal possession.',
    },
    disclosedUncertainty: 'Depth confidence bound is ±2.5 meters. Inversion assumes 2D infinite strike; podiform lenticular thinning may reduce volume.',
    statutoryCaveat: 'Exploration Target only — Not a SAMREC/JORC compliant mineral resource. Physical verification by trenching (minimum 2.5m depth) is mandatory before capital extraction.',
    geologistSignedOff: true,
    geologistName: 'Dr. F. Ndlovu (Pr.Sci.Nat, Fellow GSSA)',
    datePublished: '2026-10-13',
  },
  {
    id: 'tc-darw-02',
    targetCode: 'TC-DARW-02',
    claimId: 'claim-darw-02',
    claimName: 'Darwendale West Serpentinite Block',
    subChamber: 'Darwendale (Central)',
    priorityLevel: 'Priority 2 — Step-out Survey',
    plainEnglishSummary: 'Moderate magnetic anomaly (195 nT). Estimated depth is 24m ± 5m. Recommend completing 2 additional step-out grid lines to constrain dip direction prior to mechanical pitting.',
    shonaSummary: 'Chrome iri pano inoratidza kunge yakati dzikei (anenge mamita makumi maviri nemana 24m). Zviri nani kuwedzera mitsetse miviri yekupima nemagineti musati machera.',
    ndebeleSummary: 'I-chrome le ibonakala itshone kakhulu (amamitha angaba ngamatshumi amabili lane 24m). Kungcono ukuhlola eminye imigqa emibili kamazibuthe ngaphambi kokumba.',
    evidenceFactors: {
      magneticAnomalyNt: 195.0,
      depthEstimateM: '24.0m ± 5.0m',
      satelliteCorrelation: 'Moderate ferric iron; soil overburden present.',
      accessFeasibility: 'Cleared; ASM cooperative active.',
    },
    disclosedUncertainty: 'Substantial depth uncertainty (±5m) due to weathered saprolite magnetic attenuation.',
    statutoryCaveat: 'Advisory exploration indicator only. Proved reserve status requires diamond drilling or shaft sinking.',
    geologistSignedOff: true,
    geologistName: 'Dr. F. Ndlovu (Pr.Sci.Nat)',
    datePublished: '2026-10-14',
  },
];

export const SEED_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'eq-gsm19-01',
    model: 'GEM GSM-19 v7.0 Overhauser Magnetometer',
    serialNumber: 'GEM-OH-88412',
    category: 'Overhauser_Magnetometer',
    status: 'available',
    currentHub: 'Gweru Regional Mining Hub',
    batteryHealthPercent: 94,
    lastCalibrationDate: '2026-09-15',
    dailyRateUSD: 35.0,
  },
  {
    id: 'eq-gsm19-02',
    model: 'GEM GSM-19 Base Station Magnetometer',
    serialNumber: 'GEM-BASE-99120',
    category: 'Base_Station',
    status: 'booked',
    currentHub: 'Mutorashanga Sub-Hub',
    batteryHealthPercent: 88,
    lastCalibrationDate: '2026-08-20',
    dailyRateUSD: 25.0,
  },
  {
    id: 'eq-trimble-01',
    model: 'Trimble R10 GNSS RTK Rover & Base Pack',
    serialNumber: 'TRM-R10-44102',
    category: 'Differential_GPS',
    status: 'available',
    currentHub: 'Gweru Regional Mining Hub',
    batteryHealthPercent: 91,
    lastCalibrationDate: '2026-09-01',
    dailyRateUSD: 40.0,
  },
  {
    id: 'eq-mag3-01',
    model: 'Scintrex MP-3 Proton Precession Magnetometer',
    serialNumber: 'SCN-MP3-1029',
    category: 'Proton_Precession',
    status: 'available',
    currentHub: 'Shurugwi Hub Station',
    batteryHealthPercent: 82,
    lastCalibrationDate: '2026-07-11',
    dailyRateUSD: 20.0,
  },
];

export const SEED_BOOKINGS: SurveyBooking[] = [
  {
    id: 'bk-2026-101',
    cooperativeName: 'Kushinga Chromite Mining Syndicate',
    contactPerson: 'M. Sibanda (Chairperson)',
    phone: '+263 77 234 5678',
    claimId: 'claim-muto-01',
    hectares: 25.0,
    scheduledDate: '2026-10-18',
    equipmentIds: ['eq-gsm19-01', 'eq-trimble-01'],
    totalCostUSD: 187.50,
    totalCostZWG: 5250.0, // approx ZWG rate
    coopMemberCount: 15,
    costPerMemberUSD: 12.50,
    status: 'confirmed',
  },
];

export const SEED_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-10T08:00:00Z',
    action: 'SURVEY_INITIALIZED',
    actorName: 'T. Mukarati',
    actorRole: 'surveyor',
    details: 'Survey srv-muto-2026-01 initialized on Claim ZW-COMM-2024-MTR-881 with 5 grid lines.',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-12T16:00:00Z',
    action: 'INVERSION_COMPUTED',
    actorName: 'Geophysics Engine v2.1',
    actorRole: 'geologist',
    details: 'Talwani 2D dipping dyke inversion computed for Anomaly Alpha-1: calculated depth 14.0m, RMS residual 18.4 nT.',
    previousHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    currentHash: '9b7f58b73a4b648e718b53e8d2e8251f28b4931a2938a9bc681023a10e82c184',
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-13T10:30:00Z',
    action: 'GEOLOGIST_QA_APPROVAL',
    actorName: 'Dr. F. Ndlovu',
    actorRole: 'geologist',
    details: 'Geologist sign-off granted on Inversion inv-muto-01 and Target Card TC-MUTO-01. Mandatory trenching caveat endorsed.',
    previousHash: '9b7f58b73a4b648e718b53e8d2e8251f28b4931a2938a9bc681023a10e82c184',
    currentHash: 'e28bb1874f67645f7396791bf97cc3e81190ee0d8d011fb91219ee9449f25091',
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-14T11:45:00Z',
    action: 'ASSAY_CERTIFIED',
    actorName: 'Dr. C. Chitiyo (IMR)',
    actorRole: 'lab_tech',
    details: 'Certified assay registered for Sample DYKE-SAMP-2026-084: Cr2O3 46.8%, Cr:Fe 2.84:1. Certificate IMR-CERT-2026-CH-0482.',
    previousHash: 'e28bb1874f67645f7396791bf97cc3e81190ee0d8d011fb91219ee9449f25091',
    currentHash: 'b17e4e09f2508197171e84a511ff3e0b24017fca170668b55695ab20bfae4fc0',
  },
];
