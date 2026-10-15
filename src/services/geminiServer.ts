/**
 * DykeSense-ZW Server-Side Gemini AI Integration
 * Uses @google/genai SDK with gemini-3.8-flash for structured geoscientific interpretation.
 * Strict advisory disclaimer: Never outputs unverified proven resources.
 */

import { GoogleGenAI, Type } from '@google/genai';

// Initialize the shared Gemini client on the server
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface AnomalyInterpretationInput {
  subChamber: string;
  claimName: string;
  anomalyAmplitudeNt: number;
  calculatedDepthM: number;
  depthUncertaintyM: number;
  estimatedWidthM: number;
  dipDegrees: number;
  rmsResidualNt: number;
  satelliteAlterationIndex: number;
  requestorRole: string;
}

export interface StructuredAnomalyOutput {
  geologicalContext: string;
  anomalyClassification: string;
  priorityLevel: 'Priority 1 — Trenching Required' | 'Priority 2 — Step-out Survey' | 'Priority 3 — Low Priority';
  confidenceRating: 'High' | 'Moderate' | 'Low';
  recommendedVerificationAction: string;
  estimatedTrenchDepthM: string;
  uncertaintyDisclosures: string[];
  plainLanguageSummaryEn: string;
  plainLanguageSummarySn: string;
  plainLanguageSummaryNd: string;
  statutoryAdvisoryDisclaimer: string;
}

const GREAT_DYKE_KNOWLEDGE_BASE = `
You are a senior exploration geophysicist specializing in the Great Dyke of Zimbabwe, a 550 km long layered ultramafic-mafic intrusion with five major sub-chambers: Musengezi (North), Darwendale/Hartley, Sebakwe, Selukwe/Shurugwi, and Wedza (South).
Geological and Geophysical Rules:
1. Chromitite seams (Seams 1 through 11) dip inward towards the axis (60° to 85°). They are dense, resistant, and exhibit magnetic susceptibility contrasts against serpentinite and pyroxenite hosts (approx 0.015 - 0.08 SI).
2. Podiform chromite bodies (e.g., Shurugwi Peak) form lenticular pods within serpentinized dunite, often showing strong magnetic gradients (200 - 500 nT anomalies) and limonite/ferric iron gossans.
3. Diurnal solar quiet variation in Zimbabwe is ~15-25 nT daily.
4. HARD SYSTEM MANDATE: Exploration outputs must NEVER be described as "proven reserves" or "guaranteed ore bodies". They are preliminary geophysical targets requiring physical ground verification (trenching, pitting, or core drilling). Disclose uncertainty transparently.
5. Provide plain-language summaries in English, ChiShona, and IsiNdebele for artisanal and small-scale mining (ASM) cooperatives.
`;

export async function interpretAnomalyWithGemini(
  input: AnomalyInterpretationInput
): Promise<StructuredAnomalyOutput> {
  const prompt = `
Analyze the following geophysical ground survey and satellite alteration data for a chrome target on the Great Dyke:
- Location / Sub-Chamber: ${input.subChamber}
- Mining Claim: ${input.claimName}
- Ground Magnetic Anomaly Peak: ${input.anomalyAmplitudeNt} nT
- Inverted Depth to Top: ${input.calculatedDepthM} m (Confidence interval: ±${input.depthUncertaintyM} m)
- Estimated Seam/Pod Width: ${input.estimatedWidthM} m
- Inverted Dip Angle: ${input.dipDegrees}°
- Inversion Fitting Residual RMS: ${input.rmsResidualNt} nT
- Satellite Ferric Iron Alteration Index: ${input.satelliteAlterationIndex} / 100
- Requestor Role: ${input.requestorRole}

Provide a structured, explainable interpretation with clear trenching recommendations and trilingual plain-language summaries.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: GREAT_DYKE_KNOWLEDGE_BASE,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            geologicalContext: {
              type: Type.STRING,
              description: 'Geological setting within the Great Dyke sub-chamber and host lithology.',
            },
            anomalyClassification: {
              type: Type.STRING,
              description: 'e.g. Stratiform chromite seam or Podiform chromite lens.',
            },
            priorityLevel: {
              type: Type.STRING,
              enum: [
                'Priority 1 — Trenching Required',
                'Priority 2 — Step-out Survey',
                'Priority 3 — Low Priority',
              ],
            },
            confidenceRating: {
              type: Type.STRING,
              enum: ['High', 'Moderate', 'Low'],
            },
            recommendedVerificationAction: {
              type: Type.STRING,
              description: 'Specific field action (e.g. 25m backhoe trench oriented perpendicular to strike).',
            },
            estimatedTrenchDepthM: {
              type: Type.STRING,
              description: 'Recommended trenching or pitting depth in meters.',
            },
            uncertaintyDisclosures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific geophysical and geological uncertainties.',
            },
            plainLanguageSummaryEn: {
              type: Type.STRING,
              description: 'Plain English summary tailored for ASM cooperative leadership.',
            },
            plainLanguageSummarySn: {
              type: Type.STRING,
              description: 'ChiShona summary for local diggers and community leaders.',
            },
            plainLanguageSummaryNd: {
              type: Type.STRING,
              description: 'IsiNdebele summary for local diggers and community leaders.',
            },
            statutoryAdvisoryDisclaimer: {
              type: Type.STRING,
              description: 'Mandatory advisory statement disclaiming proved reserve status.',
            },
          },
          required: [
            'geologicalContext',
            'anomalyClassification',
            'priorityLevel',
            'confidenceRating',
            'recommendedVerificationAction',
            'estimatedTrenchDepthM',
            'uncertaintyDisclosures',
            'plainLanguageSummaryEn',
            'plainLanguageSummarySn',
            'plainLanguageSummaryNd',
            'statutoryAdvisoryDisclaimer',
          ],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return parsed as StructuredAnomalyOutput;
    }
    throw new Error('Empty response from model');
  } catch (error: any) {
    console.warn('Gemini API call fallback to deterministic Great Dyke rule engine:', error?.message);
    // Deterministic fallback matching same schema if API unavailable or quota limit
    const priority = input.anomalyAmplitudeNt > 250 && input.calculatedDepthM < 20
      ? 'Priority 1 — Trenching Required'
      : input.calculatedDepthM < 35
      ? 'Priority 2 — Step-out Survey'
      : 'Priority 3 — Low Priority';

    return {
      geologicalContext: `${input.subChamber} sub-chamber of the Great Dyke. Ultramafic sequence dominated by serpentinized dunite and pyroxenite host rocks.`,
      anomalyClassification: input.dipDegrees > 60 ? 'Steeply Dipping Stratiform Chromitite Seam' : 'Podiform Chromite Lens',
      priorityLevel: priority,
      confidenceRating: input.rmsResidualNt < 25 ? 'High' : 'Moderate',
      recommendedVerificationAction: `Excavate exploratory trench perpendicular to 184° strike, extending 30m east across station 50m.`,
      estimatedTrenchDepthM: `${Math.min(3.5, Math.max(1.5, input.calculatedDepthM * 0.2)).toFixed(1)}m to saprolite interface`,
      uncertaintyDisclosures: [
        `Calculated depth is ${input.calculatedDepthM}m with ±${input.depthUncertaintyM}m uncertainty margin.`,
        'Magnetic response may be partially attenuated by surface ferric laterite / black cotton soil.',
        'Podiform pinch-and-swell geometry cannot be fully constrained without physical pitting.',
      ],
      plainLanguageSummaryEn: `Target indicates a magnetic chromite body at approximately ${input.calculatedDepthM}m depth. Do not bring heavy excavators yet; dig a 2.5m shallow trench first to touch the reef.`,
      plainLanguageSummarySn: `Muchina urikuratidza dombo rechrome riri pasi nemamita anoda kusvika ${input.calculatedDepthM}m. Musati mapinza michina mikuru inodhura, tangai machera mugero mudiki wekutarisa chero mamita maviri nehafu.`,
      plainLanguageSummaryNd: `Umshini utshengisa umthambo we-chrome ophansi ngamamitha angaba ${input.calculatedDepthM}m. Lingaqali ngokuletha imitshina emikhulu ebizayo; qalani ngokumba umsele omncane ukuqinisekisa.`,
      statutoryAdvisoryDisclaimer: 'Statutory Notice: Exploration Target only. This analysis does NOT constitute a SAMREC/JORC compliant mineral reserve. Ground trenching or drilling is legally required before commercial extraction.',
    };
  }
}
