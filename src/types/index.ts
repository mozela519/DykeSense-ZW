/**
 * DykeSense-ZW Core Type Definitions
 * Affordable Chrome Exploration Platform for ASM & Junior Miners (Zimbabwe)
 */

export type UserRole =
  | 'hub_admin'
  | 'geologist'
  | 'surveyor'
  | 'asm_user'
  | 'lab_tech'
  | 'viewer_regulator';

export type Language = 'en' | 'sn' | 'nd';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  organization: string;
  phone: string;
  preferredLanguage: Language;
}

export type AccessStatus = 'cleared' | 'disputed' | 'restricted_sensitive' | 'pending_inspection';

export interface ClaimPolygon {
  id: string;
  claimNumber: string;
  name: string;
  subChamber: 'Musengezi' | 'Darwendale' | 'Sebakwe' | 'Selukwe_Shurugwi' | 'Wedza';
  cooperativeName: string;
  holder: string;
  areaHectares: number;
  accessStatus: AccessStatus;
  sensitiveLocation: boolean;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  coordinates: [number, number][]; // [lat, lng]
  permitExpiry: string;
  commodity: 'Chromite' | 'PGM_Chrome';
}

export interface SatelliteScreeningArea {
  id: string;
  name: string;
  subChamber: string;
  lat: number;
  lng: number;
  ferricIronIndex: number; // 0 - 100 (Sentinel-2 B12/B8 proxy)
  ferrousIronIndex: number; // 0 - 100 (Sentinel-2 B12/B11)
  swirAlteration: number; // 0 - 100 (Serpentinization proxy)
  ndviVegetationIndex: number; // -1.0 to +1.0
  prospectivityScore: number; // 0 - 100
  spectralBands: {
    b2Blue: number;
    b3Green: number;
    b4Red: number;
    b8Nir: number;
    b11Swir1: number;
    b12Swir2: number;
  };
  factors: {
    spectralAnomaly: number;
    structuralLinearity: number;
    historicOccurrences: number;
    terrainAccessibility: number;
  };
  uncertaintyRating: 'Low' | 'Moderate' | 'High';
  recommendation: string;
}

export interface MagnetometerReading {
  id: string;
  surveyId: string;
  lineId: string;
  stationNumber: number;
  lat: number;
  lng: number;
  rawTotalFieldNt: number; // Total Magnetic Field in nanoTesla (nT)
  diurnalBaseNt: number;
  diurnalCorrectedNt: number;
  timestamp: string;
  signalQuality: number; // 0 - 100%
  operator: string;
  synced: boolean;
  isSimulated?: boolean;
}

export interface SurveyGrid {
  id: string;
  claimId: string;
  name: string;
  lineSpacingMeters: number;
  stationSpacingMeters: number;
  totalLines: number;
  baseStationFrequencyMin: number;
  status: 'planning' | 'in_progress' | 'completed' | 'qa_approved';
  operatorId: string;
  operatorName: string;
  startDate: string;
  targetDepthExpectedM: number;
  totalReadingsCount: number;
  readings: MagnetometerReading[];
}

export interface InversionModel {
  id: string;
  surveyId: string;
  anomalyName: string;
  calculatedDepthM: number; // depth to top of chromite body
  depthUncertaintyM: number; // +/- m
  estimatedWidthM: number; // width in meters
  dipDegrees: number; // dip angle in degrees
  strikeDegrees: number; // strike azimuth
  magneticSusceptibilitySI: number; // e.g. 0.045 SI (chromite / serpentinite contrast)
  anomalyAmplitudeNt: number;
  rmsResidualNt: number;
  geologistApproved: boolean;
  approvedBy?: string;
  approvalDate?: string;
  geologistNotes?: string;
  simulatedObservedProfile: { stationDistM: number; observedNt: number; modeledNt: number }[];
}

export type CustodyStatus =
  | 'bag_registered'
  | 'field_sampled'
  | 'hub_received'
  | 'in_transit_lab'
  | 'lab_received'
  | 'assay_complete';

export interface CustodyEvent {
  id: string;
  sampleId: string;
  status: CustodyStatus;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  location: string;
  hashSignature: string; // SHA-256 tamper evidence
  notes: string;
}

export interface LabAssay {
  id: string;
  sampleId: string;
  labName: string;
  assayMethod: 'Portable_XRF_Screening' | 'Certified_ICP_OES_FireAssay';
  cr2o3Percent: number; // Chromic oxide %
  feoPercent: number; // Iron oxide %
  crFeRatio: number; // e.g. 2.8:1
  gradeClassification: 'High-Grade Metallurgical (>2.8:1)' | 'Medium-Grade Chemical' | 'Refractory (<2.0:1)';
  isCertified: boolean;
  certifiedDate?: string;
  certificateNumber?: string;
}

export interface SampleBag {
  id: string; // e.g. "DYKE-SAMP-2026-084"
  claimId: string;
  surveyId?: string;
  anomalyId?: string;
  sampleType: 'Podiform_Chromite' | 'Stratiform_Seam' | 'Eluvial_Float' | 'Host_Serpentinite';
  sampleWeightKg: number;
  lat: number;
  lng: number;
  collectedAt: string;
  samplerName: string;
  qrCodeDataUrl: string;
  custodyHistory: CustodyEvent[];
  assay?: LabAssay;
}

export interface TargetCard {
  id: string;
  targetCode: string; // e.g. "TC-DARW-04"
  claimId: string;
  claimName: string;
  subChamber: string;
  priorityLevel: 'Priority 1 — Trenching Required' | 'Priority 2 — Step-out Survey' | 'Priority 3 — Low Priority';
  plainEnglishSummary: string;
  shonaSummary: string;
  ndebeleSummary: string;
  evidenceFactors: {
    magneticAnomalyNt: number;
    depthEstimateM: string;
    satelliteCorrelation: string;
    accessFeasibility: string;
  };
  disclosedUncertainty: string;
  statutoryCaveat: string;
  geologistSignedOff: boolean;
  geologistName?: string;
  datePublished: string;
}

export interface EquipmentItem {
  id: string;
  model: string;
  serialNumber: string;
  category: 'Overhauser_Magnetometer' | 'Proton_Precession' | 'Differential_GPS' | 'Base_Station';
  status: 'available' | 'booked' | 'maintenance';
  currentHub: string;
  batteryHealthPercent: number;
  lastCalibrationDate: string;
  dailyRateUSD: number;
}

export interface SurveyBooking {
  id: string;
  cooperativeName: string;
  contactPerson: string;
  phone: string;
  claimId: string;
  hectares: number;
  scheduledDate: string;
  equipmentIds: string[];
  totalCostUSD: number;
  totalCostZWG: number; // Zimbabwe Gold (local currency equivalent)
  coopMemberCount: number;
  costPerMemberUSD: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: UserRole;
  details: string;
  previousHash: string;
  currentHash: string;
}
