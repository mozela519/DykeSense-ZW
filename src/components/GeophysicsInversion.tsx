/**
 * DykeSense-ZW Geophysical Processing & 2D Dyke Inversion Module
 * Calculates depth to top (m), dyke width (m), dip (°), susceptibility (SI),
 * with confidence bounds and Geologist QA/QC sign-off stamp.
 */

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Filter,
  Layers,
  Award,
  Sparkles,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { InversionModel, SurveyGrid, UserRole, Language } from '../types';
import { filterSpikes, invertMagneticProfile, calculateDykeMagneticAnomaly } from '../services/geophysics';
import { getTranslation } from '../services/i18n';

interface GeophysicsInversionProps {
  survey: SurveyGrid;
  inversions: InversionModel[];
  onApproveInversion: (inversionId: string, notes: string) => void;
  currentRole: UserRole;
  language: Language;
}

export const GeophysicsInversion: React.FC<GeophysicsInversionProps> = ({
  survey,
  inversions,
  onApproveInversion,
  currentRole,
  language,
}) => {
  const t = getTranslation(language);

  const [selectedInversionId, setSelectedInversionId] = useState<string>(
    inversions[0]?.id || 'inv-muto-01'
  );
  const [useSpikeFilter, setUseSpikeFilter] = useState<boolean>(true);
  const [initialDepthEst, setInitialDepthEst] = useState<number>(14.0);
  const [geologistNotes, setGeologistNotes] = useState<string>(
    'Asymmetric bipolar anomaly confirms steeply dipping stratiform chromitite seam. Recommend shallow trenching.'
  );

  const currentInversion =
    inversions.find((i) => i.id === selectedInversionId) || inversions[0];

  // Interactive 2D Forward Modeling state
  const [modelDepthM, setModelDepthM] = useState<number>(currentInversion?.calculatedDepthM || 14.0);
  const [modelWidthM, setModelWidthM] = useState<number>(currentInversion?.estimatedWidthM || 4.8);
  const [modelDipDeg, setModelDipDeg] = useState<number>(currentInversion?.dipDegrees || 74);
  const [modelSuscSI, setModelSuscSI] = useState<number>(currentInversion?.magneticSusceptibilitySI || 0.042);
  const [isInteractiveMode, setIsInteractiveMode] = useState<boolean>(true);

  // Sync state when selected inversion changes
  React.useEffect(() => {
    if (currentInversion) {
      setModelDepthM(currentInversion.calculatedDepthM);
      setModelWidthM(currentInversion.estimatedWidthM);
      setModelDipDeg(currentInversion.dipDegrees);
      setModelSuscSI(currentInversion.magneticSusceptibilitySI);
    }
  }, [selectedInversionId]);

  // Dynamically calculate forward profile
  const profileData = React.useMemo(() => {
    const baseProfile = currentInversion?.simulatedObservedProfile || [];
    if (!isInteractiveMode) return baseProfile;

    return baseProfile.map((pt) => {
      const deltaT = calculateDykeMagneticAnomaly(
        pt.stationDistM,
        50, // dyke axis at 50m station
        modelDepthM,
        modelWidthM,
        modelDipDeg,
        modelSuscSI,
        31200
      );
      return {
        ...pt,
        modeledNt: Number((31200 + deltaT).toFixed(1)),
      };
    });
  }, [currentInversion, isInteractiveMode, modelDepthM, modelWidthM, modelDipDeg, modelSuscSI]);

  // Calculate live RMS error
  const liveRms = React.useMemo(() => {
    if (profileData.length === 0) return 0;
    let sumSq = 0;
    profileData.forEach((p) => {
      const diff = p.observedNt - p.modeledNt;
      sumSq += diff * diff;
    });
    return Number(Math.sqrt(sumSq / profileData.length).toFixed(1));
  }, [profileData]);

  const maxObs = Math.max(...profileData.map((p) => Math.max(p.observedNt, p.modeledNt)), 31500);
  const minObs = Math.min(...profileData.map((p) => Math.min(p.observedNt, p.modeledNt)), 31100);
  const range = maxObs - minObs || 1;

  const isGeologist = ['geologist', 'hub_admin'].includes(currentRole);

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            {t.inversionTab.title}
          </h2>
          <p className="text-xs text-slate-300">
            {t.inversionTab.subtitle}
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedInversionId}
            onChange={(e) => setSelectedInversionId(e.target.value)}
            className="bg-[#08182b] border border-slate-700 text-teal-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {inversions.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.anomalyName} ({inv.calculatedDepthM}m)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive 2D Forward Modeling Sandbox Bar */}
      <div className="bg-[#0e243d] border border-teal-500/50 rounded-xl p-4 shadow-md space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-white text-sm">Interactive 2D Dipping Dyke Forward Sandbox</span>
            <span className="bg-teal-950 text-teal-300 border border-teal-600/60 px-2 py-0.5 rounded text-[10px]">
              Talwani & Grant Formulation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setModelDepthM(currentInversion.calculatedDepthM);
                setModelWidthM(currentInversion.estimatedWidthM);
                setModelDipDeg(currentInversion.dipDegrees);
                setModelSuscSI(currentInversion.magneticSusceptibilitySI);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] transition-colors"
            >
              Reset to Auto-Inversion
            </button>
            <span className="text-[11px] text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/50">
              Live Residual RMS: {liveRms} nT
            </span>
          </div>
        </div>

        {/* 4 Interactive Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="bg-[#08182b] p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Depth to Top (h):</span>
              <span className="text-teal-300 font-bold">{modelDepthM} m</span>
            </div>
            <input
              type="range"
              min="4"
              max="45"
              step="0.5"
              value={modelDepthM}
              onChange={(e) => setModelDepthM(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>4m (Trenchable)</span>
              <span>45m (Deep Drill)</span>
            </div>
          </div>

          <div className="bg-[#08182b] p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Dyke / Seam Width (w):</span>
              <span className="text-teal-300 font-bold">{modelWidthM} m</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.2"
              value={modelWidthM}
              onChange={(e) => setModelWidthM(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1m (Narrow Seam)</span>
              <span>15m (Thick Pod)</span>
            </div>
          </div>

          <div className="bg-[#08182b] p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Dip Angle (θ):</span>
              <span className="text-teal-300 font-bold">{modelDipDeg}° East</span>
            </div>
            <input
              type="range"
              min="45"
              max="90"
              step="1"
              value={modelDipDeg}
              onChange={(e) => setModelDipDeg(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>45° Moderate</span>
              <span>90° Vertical</span>
            </div>
          </div>

          <div className="bg-[#08182b] p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Susceptibility (k):</span>
              <span className="text-teal-300 font-bold">{modelSuscSI} SI</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.09"
              step="0.002"
              value={modelSuscSI}
              onChange={(e) => setModelSuscSI(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.01 SI (Disseminated)</span>
              <span>0.09 SI (Massive)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualizer: 2D Magnetic Profile & Subsurface Dyke Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Curves (SVG) */}
        <div className="lg:col-span-7 bg-[#08182b] border border-slate-700/80 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-mono text-white font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Observed vs Dynamic Forward Model (Transect L03N)
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-0.5 bg-amber-400"></span> Observed nT
              </span>
              <span className="flex items-center gap-1.5 text-teal-300 font-bold">
                <span className="w-3 h-0.5 bg-teal-400"></span> Modeled 2D Dyke ({modelDepthM}m)
              </span>
            </div>
          </div>

          {/* SVG Profile Chart */}
          <div className="bg-[#040d17] p-2 rounded-lg border border-slate-800 relative">
            <svg viewBox="0 0 500 240" className="w-full h-56">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="200" x2="480" y2="200" stroke="#334155" />

              {/* Y-axis Labels */}
              <text x="35" y="24" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                {Math.round(maxObs)}
              </text>
              <text x="35" y="124" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                {Math.round((maxObs + minObs) / 2)}
              </text>
              <text x="35" y="204" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                {Math.round(minObs)}
              </text>

              {/* Station X-axis Ticks */}
              {[0, 25, 50, 75, 100].map((dist) => {
                const x = 40 + (dist / 100) * 440;
                return (
                  <g key={dist}>
                    <line x1={x} y1="200" x2={x} y2="205" stroke="#475569" />
                    <text x={x} y="218" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      {dist}m
                    </text>
                  </g>
                );
              })}

              {/* Observed Points Curve (Amber) */}
              {profileData.length > 0 && (
                <polyline
                  fill="none"
                  stroke="#F4A259"
                  strokeWidth="2"
                  points={profileData
                    .map((p) => {
                      const x = 40 + (p.stationDistM / 100) * 440;
                      const y = 200 - ((p.observedNt - minObs) / range) * 170;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Modeled Smooth Dyke Curve (Teal) */}
              {profileData.length > 0 && (
                <polyline
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  points={profileData
                    .map((p) => {
                      const x = 40 + (p.stationDistM / 100) * 440;
                      const y = 200 - ((p.modeledNt - minObs) / range) * 170;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Peak Annotation */}
              <circle cx="260" cy="45" r="4" fill="#F4A259" />
              <text x="260" y="35" fill="#F4A259" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
                Apex (342 nT)
              </text>
            </svg>
          </div>
        </div>

        {/* Subsurface Geological Cross-Section Visualizer */}
        <div className="lg:col-span-5 bg-[#08182b] border border-slate-700/80 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-white text-xs font-bold flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-teal-400" />
                Live Subsurface Dyke Cross-Section
              </span>
              <span className="text-[10px] font-mono text-teal-300">Depth: {modelDepthM}m • Width: {modelWidthM}m</span>
            </div>

            {/* Subsurface Cross Section SVG with Dynamic Dyke Polygon */}
            {(() => {
              const topY = Math.min(135, Math.max(45, 30 + modelDepthM * 2.8));
              const widthPx = Math.max(8, modelWidthM * 3.8);
              const dipRad = (modelDipDeg * Math.PI) / 180;
              const bottomY = 185;
              const deltaY = bottomY - topY;
              const shiftX = Math.max(0, deltaY / Math.tan(dipRad));
              const topX1 = 150 - widthPx / 2;
              const topX2 = 150 + widthPx / 2;
              const bottomX1 = Math.min(275, topX1 + shiftX);
              const bottomX2 = Math.min(295, topX2 + shiftX);
              const polyPoints = `${topX1.toFixed(1)},${topY.toFixed(1)} ${topX2.toFixed(1)},${topY.toFixed(1)} ${bottomX2.toFixed(1)},${bottomY} ${bottomX1.toFixed(1)},${bottomY}`;

              return (
                <div className="bg-[#05111f] rounded-lg border border-slate-800 p-2">
                  <svg viewBox="0 0 320 200" className="w-full h-44">
                    {/* Surface line */}
                    <line x1="20" y1="30" x2="300" y2="30" stroke="#10b981" strokeWidth="2.5" />
                    <text x="25" y="24" fill="#10b981" fontSize="9" fontFamily="JetBrains Mono">
                      Ground Surface (0m)
                    </text>

                    {/* Weathered Saprolite Horizon */}
                    <rect x="20" y="30" width="280" height="18" fill="#78350f" fillOpacity="0.25" />
                    <text x="25" y="43" fill="#b45309" fontSize="8" fontFamily="JetBrains Mono">
                      Lateritic Saprolite Cover (~4m)
                    </text>

                    {/* Host Serpentinite / Dunite */}
                    <rect x="20" y="48" width="280" height="137" fill="#0b2440" />
                    <text x="25" y="65" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                      Host: Serpentinized Dunite Package
                    </text>

                    {/* Dynamic Dipping Chromite Body Polygon */}
                    <polygon
                      points={polyPoints}
                      fill="#F4A259"
                      fillOpacity="0.88"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    {/* Depth Indicator Arrow */}
                    <line x1="130" y1="30" x2="130" y2={topY} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                    <polygon points={`127,${topY - 5} 130,${topY} 133,${topY - 5}`} fill="#38bdf8" />
                    <text x="75" y={Math.max(45, (30 + topY) / 2)} fill="#38bdf8" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      h = {modelDepthM}m
                    </text>

                    {/* Dip Angle Label */}
                    <text x={Math.min(270, bottomX2 - 10)} y="150" fill="#ffffff" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      Dip: {modelDipDeg}° E
                    </text>
                    <text x={topX1 + 5} y={topY + 22} fill="#000000" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                      Chrome
                    </text>
                  </svg>
                </div>
              );
            })()}
          </div>

          {/* Geologist Sign-Off Box */}
          <div className="mt-3 p-3 rounded-lg bg-[#0c223c] border border-teal-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-400" />
                {t.inversionTab.geologistSignOff}
              </span>
              {currentInversion.geologistApproved ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-600/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {t.inversionTab.signOffConfirmed}
                </span>
              ) : (
                <span className="text-[10px] text-amber-300 font-mono">
                  Pending Geologist Review
                </span>
              )}
            </div>

            {currentInversion.geologistApproved ? (
              <div className="text-xs text-slate-300 space-y-1 font-mono">
                <div>Signed by: <strong className="text-white">{currentInversion.approvedBy}</strong></div>
                <div>Date: {currentInversion.approvalDate?.split('T')[0]}</div>
                <div className="text-[11px] text-teal-200 mt-1 italic">
                  "{currentInversion.geologistNotes}"
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-amber-200/90">
                  {t.inversionTab.requireSignOffWarning}
                </p>
                {isGeologist ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={geologistNotes}
                      onChange={(e) => setGeologistNotes(e.target.value)}
                      placeholder="Enter geoscientist QA notes and trenching instructions..."
                      className="w-full bg-[#08182b] border border-slate-700 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                    />
                    <button
                      onClick={() => onApproveInversion(currentInversion.id, geologistNotes)}
                      className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Approve & Publish Geologist Sign-Off
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    (Switch role to "Chartered Geologist" to execute QA/QC sign-off)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
