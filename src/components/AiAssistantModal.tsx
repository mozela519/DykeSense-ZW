/**
 * DykeSense-ZW AI Geoscientist Assistant (Gemini 3.8 Flash)
 * Grounded in Great Dyke chromite geophysics corpus.
 * Outputs structured JSON only with trilingual summaries,
 * mandatory uncertainty disclosure, and strict advisory disclaimer.
 */

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  ShieldAlert,
  Award,
  Layers,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
import { StructuredAnomalyOutput } from '../services/geminiServer';
import { UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface AiAssistantProps {
  currentRole: UserRole;
  language: Language;
  onPublishAsTargetCard: (output: StructuredAnomalyOutput) => void;
  prefilledTarget?: {
    subChamber: string;
    claimName: string;
    lat?: number;
    lng?: number;
    alterationIndex?: number;
    depthM?: number;
    widthM?: number;
    dipDeg?: number;
  } | null;
}

export const AiAssistantModal: React.FC<AiAssistantProps> = ({
  currentRole,
  language,
  onPublishAsTargetCard,
  prefilledTarget,
}) => {
  const t = getTranslation(language);

  // Form input parameters for Great Dyke analysis
  const [subChamber, setSubChamber] = useState<string>(prefilledTarget?.subChamber || 'Darwendale');
  const [claimName, setClaimName] = useState<string>(prefilledTarget?.claimName || 'Mutorashanga North Seam 4');
  const [anomalyAmplitudeNt, setAnomalyAmplitudeNt] = useState<number>(342.5);
  const [calculatedDepthM, setCalculatedDepthM] = useState<number>(prefilledTarget?.depthM || 14.0);
  const [depthUncertaintyM, setDepthUncertaintyM] = useState<number>(2.5);
  const [estimatedWidthM, setEstimatedWidthM] = useState<number>(prefilledTarget?.widthM || 4.8);
  const [dipDegrees, setDipDegrees] = useState<number>(prefilledTarget?.dipDeg || 74);
  const [rmsResidualNt, setRmsResidualNt] = useState<number>(18.4);
  const [satelliteAlterationIndex, setSatelliteAlterationIndex] = useState<number>(
    prefilledTarget?.alterationIndex || 86.4
  );

  React.useEffect(() => {
    if (prefilledTarget) {
      if (prefilledTarget.subChamber) setSubChamber(prefilledTarget.subChamber);
      if (prefilledTarget.claimName) setClaimName(prefilledTarget.claimName);
      if (prefilledTarget.alterationIndex !== undefined) setSatelliteAlterationIndex(prefilledTarget.alterationIndex);
      if (prefilledTarget.depthM !== undefined) setCalculatedDepthM(prefilledTarget.depthM);
      if (prefilledTarget.widthM !== undefined) setEstimatedWidthM(prefilledTarget.widthM);
      if (prefilledTarget.dipDeg !== undefined) setDipDegrees(prefilledTarget.dipDeg);
    }
  }, [prefilledTarget]);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StructuredAnomalyOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'sn' | 'nd'>(language);

  const handleRunAiAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subChamber,
          claimName,
          anomalyAmplitudeNt,
          calculatedDepthM,
          depthUncertaintyM,
          estimatedWidthM,
          dipDegrees,
          rmsResidualNt,
          satelliteAlterationIndex,
          requestorRole: currentRole,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status}`);
      }

      const data: StructuredAnomalyOutput = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setErrorMsg(err.message || 'Failed to complete AI interpretation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">
              AI Geoscientist Assistant (Gemini 3.8 Flash)
            </h2>
            <span className="bg-teal-900/60 text-teal-300 font-mono text-[10px] px-2 py-0.5 rounded border border-teal-500/40 uppercase">
              Server-Side Structured JSON
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Grounded in Great Dyke chromitite geophysics and Sentinel-2 spectral indices. Delivers advisory target cards with mandatory uncertainty disclosure.
          </p>
        </div>
      </div>

      {/* Main Grid: Input Parameters Form (Left) + Structured AI Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs */}
        <div className="lg:col-span-5 bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Anomaly & Geophysical Parameters
            </h3>
          </div>

          <form onSubmit={handleRunAiAnalysis} className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Great Dyke Sub-Chamber:</label>
              <select
                value={subChamber}
                onChange={(e) => setSubChamber(e.target.value)}
                className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
              >
                <option value="Darwendale">Darwendale / Hartley (Stratiform Seams 1-11)</option>
                <option value="Selukwe_Shurugwi">Selukwe / Shurugwi (Podiform Lenses)</option>
                <option value="Sebakwe">Sebakwe / Lalapanzi (Boundary Seams)</option>
                <option value="Musengezi">Musengezi (North)</option>
                <option value="Wedza">Wedza (South)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Target Claim Name:</label>
              <input
                type="text"
                value={claimName}
                onChange={(e) => setClaimName(e.target.value)}
                className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Magnetic Anomaly (nT):</label>
                <input
                  type="number"
                  step="0.1"
                  value={anomalyAmplitudeNt}
                  onChange={(e) => setAnomalyAmplitudeNt(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Inverted Depth (m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={calculatedDepthM}
                  onChange={(e) => setCalculatedDepthM(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Depth Uncertainty (±m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={depthUncertaintyM}
                  onChange={(e) => setDepthUncertaintyM(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Estimated Width (m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={estimatedWidthM}
                  onChange={(e) => setEstimatedWidthM(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Dip Angle (°):</label>
                <input
                  type="number"
                  value={dipDegrees}
                  onChange={(e) => setDipDegrees(parseInt(e.target.value) || 70)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sentinel-2 Ferric Index:</label>
                <input
                  type="number"
                  step="0.1"
                  value={satelliteAlterationIndex}
                  onChange={(e) => setSatelliteAlterationIndex(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Structured Geological Interpretation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate AI Geoscientist Interpretation
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 rounded-lg text-xs text-red-300 font-mono">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Structured AI Output View */}
        <div className="lg:col-span-7 bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-400" />
              Structured Advisory Report
            </span>
            {result && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-900/80 text-teal-300 border border-teal-500/40">
                {result.priorityLevel}
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4 text-xs font-mono">
              {/* Classification & Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#05111f] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Lithological Classification</span>
                  <div className="text-white font-bold text-sm mt-0.5">{result.anomalyClassification}</div>
                </div>
                <div className="bg-[#05111f] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Geophysical Confidence</span>
                  <div className="text-emerald-300 font-bold text-sm mt-0.5">{result.confidenceRating} Confidence</div>
                </div>
              </div>

              {/* Action Recommendation */}
              <div className="p-3.5 bg-[#05111f] rounded-xl border border-teal-500/40 space-y-1">
                <span className="text-teal-400 font-bold uppercase tracking-wider block text-[11px]">
                  Recommended Ground Verification Action:
                </span>
                <p className="text-white font-semibold text-xs">{result.recommendedVerificationAction}</p>
                <span className="text-amber-300 block text-[11px] pt-1">
                  Target Depth to Touch: {result.estimatedTrenchDepthM}
                </span>
              </div>

              {/* Trilingual Plain Language Briefings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    Plain Language Translations:
                  </span>
                  <div className="flex items-center gap-1 bg-[#040d17] p-1 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setActiveLangTab('en')}
                      className={`px-2 py-0.5 rounded ${activeLangTab === 'en' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setActiveLangTab('sn')}
                      className={`px-2 py-0.5 rounded ${activeLangTab === 'sn' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      ChiShona
                    </button>
                    <button
                      onClick={() => setActiveLangTab('nd')}
                      className={`px-2 py-0.5 rounded ${activeLangTab === 'nd' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      IsiNdebele
                    </button>
                  </div>
                </div>

                <div className="bg-[#05111f] p-3 rounded-lg border border-slate-800 text-slate-200 leading-relaxed">
                  {activeLangTab === 'en' && <p>{result.plainLanguageSummaryEn}</p>}
                  {activeLangTab === 'sn' && <p>{result.plainLanguageSummarySn}</p>}
                  {activeLangTab === 'nd' && <p>{result.plainLanguageSummaryNd}</p>}
                </div>
              </div>

              {/* Uncertainty Disclosures */}
              <div className="p-3 bg-[#061424] rounded-lg border border-slate-700/60 space-y-1">
                <span className="text-amber-400 font-bold uppercase text-[10px] block">
                  Disclosed Geophysical Uncertainties:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                  {result.uncertaintyDisclosures.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>

              {/* Mandatory Statutory Advisory Statement */}
              <div className="p-2.5 bg-amber-950/40 border border-amber-600/50 rounded-lg text-amber-200 text-[11px]">
                <strong className="block text-amber-300 uppercase mb-0.5">Mandatory Statutory Caveat:</strong>
                {result.statutoryAdvisoryDisclaimer}
              </div>

              {/* Action: Publish as Target Card */}
              <button
                onClick={() => onPublishAsTargetCard(result)}
                className="w-full py-2.5 bg-[#14325c] hover:bg-[#1b437c] text-white font-bold rounded-lg border border-teal-500/50 flex items-center justify-center gap-2 transition-all"
              >
                <Award className="w-4 h-4 text-teal-400" />
                Endorse & Publish to Co-op Target Cards
              </button>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 space-y-3 font-mono">
              <Bot className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs">
                Configure geophysical parameters on the left and click "Generate AI Geoscientist Interpretation".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
