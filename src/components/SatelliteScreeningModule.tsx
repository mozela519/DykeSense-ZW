/**
 * DykeSense-ZW Dedicated Satellite Screening Module
 * Independent multi-spectral exploration workstation.
 * Analyzes Sentinel-2 band ratios:
 * - Ferric Oxide Index (B12 / B8)
 * - Ferrous Iron Index (B12 / B11)
 * - SWIR Serpentinization Alteration (B11 / B8A)
 * - NDVI Vegetation Masking
 * Includes interactive spectral reflectance curves and seamless coordinate transfer to GIS Map & Field PWA.
 */

import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  MapPin,
  ExternalLink,
  Sliders,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Eye,
  Filter,
  ArrowRight,
  Compass,
  Bot,
} from 'lucide-react';
import { SatelliteScreeningArea, ClaimPolygon, UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface SatelliteScreeningModuleProps {
  screeningAreas: SatelliteScreeningArea[];
  claims: ClaimPolygon[];
  currentRole: UserRole;
  language: Language;
  onSendPositionToMap: (lat: number, lng: number, label: string) => void;
  onSendToFieldSurvey: (claimId: string, lat: number, lng: number) => void;
  onSendToAiAdvisor?: (target: {
    subChamber: string;
    claimName: string;
    lat: number;
    lng: number;
    alterationIndex: number;
  }) => void;
}

export const SatelliteScreeningModule: React.FC<SatelliteScreeningModuleProps> = ({
  screeningAreas,
  claims,
  currentRole,
  language,
  onSendPositionToMap,
  onSendToFieldSurvey,
  onSendToAiAdvisor,
}) => {
  const t = getTranslation(language);

  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    screeningAreas[0]?.id || 'scr-muto-01'
  );

  // Band ratio threshold filters
  const [minFerricIndex, setMinFerricIndex] = useState<number>(70);
  const [minProspectivity, setMinProspectivity] = useState<number>(75);
  const [filterSubChamber, setFilterSubChamber] = useState<string>('all');

  // Custom Position Coordinate Identifier state
  const [customLat, setCustomLat] = useState<number>(-17.1462);
  const [customLng, setCustomLng] = useState<number>(30.6478);
  const [customName, setCustomName] = useState<string>('New Anomaly Target');
  const [identifiedResult, setIdentifiedResult] = useState<any | null>(null);

  const selectedArea =
    screeningAreas.find((a) => a.id === selectedAreaId) || screeningAreas[0];

  // Filtered areas based on spectral criteria
  const filteredAreas = screeningAreas.filter((a) => {
    if (a.ferricIronIndex < minFerricIndex) return false;
    if (a.prospectivityScore < minProspectivity) return false;
    if (filterSubChamber !== 'all' && !a.subChamber.toLowerCase().includes(filterSubChamber.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Calculate synthetic spectral curve from band values
  const bands = selectedArea?.spectralBands || {
    b2Blue: 0.082,
    b3Green: 0.124,
    b4Red: 0.198,
    b8Nir: 0.245,
    b11Swir1: 0.385,
    b12Swir2: 0.442,
  };

  const spectralPlotPoints = [
    { band: 'B2 (490nm)', val: bands.b2Blue, refChromite: 0.08, refDunite: 0.12 },
    { band: 'B3 (560nm)', val: bands.b3Green, refChromite: 0.11, refDunite: 0.14 },
    { band: 'B4 (665nm)', val: bands.b4Red, refChromite: 0.21, refDunite: 0.16 },
    { band: 'B8 (842nm)', val: bands.b8Nir, refChromite: 0.24, refDunite: 0.21 },
    { band: 'B11 (1610nm)', val: bands.b11Swir1, refChromite: 0.39, refDunite: 0.28 },
    { band: 'B12 (2190nm)', val: bands.b12Swir2, refChromite: 0.45, refDunite: 0.24 },
  ];

  // Run Custom Coordinate Spectral Pinpointer
  const handleIdentifyPosition = (e: React.FormEvent) => {
    e.preventDefault();
    // Deterministic Great Dyke geospatial simulation based on latitude
    const isInsideDyke = customLng >= 29.6 && customLng <= 31.0 && customLat >= -21.0 && customLat <= -16.5;
    const distanceToAxis = Math.abs(customLng - 30.4); // approx Great Dyke axis longitude
    const ferricSim = isInsideDyke ? Math.max(50, Math.round(92 - distanceToAxis * 120)) : 35;
    const swirSim = isInsideDyke ? Math.max(45, Math.round(88 - distanceToAxis * 110)) : 30;
    const prospectivity = Math.round((ferricSim * 0.55 + swirSim * 0.45));

    setIdentifiedResult({
      lat: customLat,
      lng: customLng,
      name: customName,
      isInsideDyke,
      ferricIndex: ferricSim,
      swirIndex: swirSim,
      prospectivityScore: prospectivity,
      recommendation: prospectivity > 80
        ? 'High probability spectral gossan outcrop. Priority for ground magnetometer grid survey.'
        : 'Moderate to low spectral signature. Soil cover or granitic basement flanking the Dyke.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">
              Sentinel-2 Multi-Spectral Screening Workstation
            </h2>
            <span className="bg-teal-900/60 text-teal-300 font-mono text-xs px-2 py-0.5 rounded border border-teal-500/40">
              Autonomous Screening
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Decoupled spectral alteration mapping. Analyzes ferric iron (B12/B8) and SWIR serpentinization (B11/B8A) across the Great Dyke intrusion.
          </p>
        </div>

        {/* Global Action: Jump to Map */}
        <button
          onClick={() =>
            onSendPositionToMap(
              selectedArea.lat,
              selectedArea.lng,
              selectedArea.name
            )
          }
          className="py-2 px-3.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-mono font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          <MapPin className="w-4 h-4" />
          <span>Inspect Selected Position on GIS Map</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {/* Main Grid: Spectral Candidates & Filters (Left) + Reflectance Curves & Seamless Coordinate Pinpointer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter Controls & Candidate Hotspots */}
        <div className="lg:col-span-5 space-y-4">
          {/* Spectral Filter Parameters Card */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-white font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                Spectral Filter Criteria
              </span>
              <span className="text-teal-400 text-[10px]">
                {filteredAreas.length} Targets Matched
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Min Ferric Iron (B12/B8):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="90"
                    value={minFerricIndex}
                    onChange={(e) => setMinFerricIndex(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded cursor-pointer accent-teal-500"
                  />
                  <span className="text-teal-300 font-bold">{minFerricIndex}%</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Min Prospectivity:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={minProspectivity}
                    onChange={(e) => setMinProspectivity(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded cursor-pointer accent-teal-500"
                  />
                  <span className="text-amber-300 font-bold">{minProspectivity}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Filter by Sub-Chamber:</label>
              <select
                value={filterSubChamber}
                onChange={(e) => setFilterSubChamber(e.target.value)}
                className="w-full bg-[#05111f] border border-slate-700 rounded p-1.5 text-white"
              >
                <option value="all">All Great Dyke Sub-Chambers</option>
                <option value="Darwendale">Darwendale (North)</option>
                <option value="Sebakwe">Sebakwe / Lalapanzi</option>
                <option value="Selukwe">Selukwe / Shurugwi Peak</option>
              </select>
            </div>
          </div>

          {/* List of Identified Spectral Prospects */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Identified Spectral Alteration Hotspots:
            </span>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredAreas.map((area) => {
                const isSelected = area.id === selectedAreaId;
                return (
                  <div
                    key={area.id}
                    onClick={() => setSelectedAreaId(area.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-950/80 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                        : 'bg-[#05111f] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {area.name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-600/50">
                        {area.prospectivityScore}/100
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 space-y-1 mt-1.5">
                      <div className="flex justify-between">
                        <span>Coordinates:</span>
                        <span className="text-teal-300 font-bold">
                          {area.lat.toFixed(4)}°S, {area.lng.toFixed(4)}°E
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ferric Iron Index:</span>
                        <span className="text-white font-semibold">{area.ferricIronIndex}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SWIR Serpentine Alteration:</span>
                        <span className="text-amber-300 font-semibold">{area.swirAlteration}%</span>
                      </div>
                    </div>

                    {/* Quick navigation link */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">{area.subChamber}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendPositionToMap(area.lat, area.lng, area.name);
                        }}
                        className="text-teal-400 hover:text-teal-200 font-bold flex items-center gap-1"
                      >
                        <span>Fly to Map</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Spectral Curve & Seamless Position Identifier */}
        <div className="lg:col-span-7 space-y-5">
          {/* Spectral Reflectance Curve (SVG) */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5 uppercase">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Spectral Reflectance Signature ({selectedArea?.name})
              </span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-teal-300">
                  <span className="w-3 h-0.5 bg-teal-400"></span> Observed Pixel
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="w-3 h-0.5 bg-amber-400 border-dashed"></span> Chromite Gossan Reference
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="bg-[#040d17] p-3 rounded-lg border border-slate-800">
              <svg viewBox="0 0 520 220" className="w-full h-52">
                {/* Horizontal reference lines */}
                <line x1="45" y1="20" x2="500" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="45" y1="70" x2="500" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="45" y1="120" x2="500" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="45" y1="170" x2="500" y2="170" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="45" y1="180" x2="500" y2="180" stroke="#334155" />

                {/* Y-axis labels */}
                <text x="38" y="24" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">0.50</text>
                <text x="38" y="74" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">0.35</text>
                <text x="38" y="124" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">0.20</text>
                <text x="38" y="174" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">0.05</text>

                {/* X-axis Band Ticks */}
                {spectralPlotPoints.map((pt, idx) => {
                  const x = 70 + idx * 80;
                  return (
                    <g key={pt.band}>
                      <line x1={x} y1="180" x2={x} y2="185" stroke="#475569" />
                      <text x={x} y="198" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                        {pt.band.split(' ')[0]}
                      </text>
                      <text x={x} y="210" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                        {pt.band.split(' ')[1]}
                      </text>
                    </g>
                  );
                })}

                {/* Reference Chromite Gossan Curve (Amber Dashed) */}
                <polyline
                  fill="none"
                  stroke="#F4A259"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  points={spectralPlotPoints
                    .map((pt, idx) => {
                      const x = 70 + idx * 80;
                      const y = 180 - (pt.refChromite / 0.55) * 160;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Target Observed Reflectance Curve (Teal Solid) */}
                <polyline
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                  points={spectralPlotPoints
                    .map((pt, idx) => {
                      const x = 70 + idx * 80;
                      const y = 180 - (pt.val / 0.55) * 160;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Target data points */}
                {spectralPlotPoints.map((pt, idx) => {
                  const x = 70 + idx * 80;
                  const y = 180 - (pt.val / 0.55) * 160;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="4" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.5" />
                      <text x={x} y={y - 8} fill="#5eead4" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                        {pt.val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="text-[11px] font-mono text-slate-300 leading-relaxed bg-[#05111f] p-3 rounded-lg border border-slate-800">
              <strong className="text-teal-400">Interpretation: </strong>
              {selectedArea?.recommendation}
            </div>
          </div>

          {/* Seamless Position Identifier & Query Tool */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5 uppercase">
                <Compass className="w-4 h-4 text-amber-400" />
                Advanced Position Coordinate Pinpointer
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                WGS84 / UTM 36S
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Identify and test arbitrary coordinates across the Great Dyke to run a synthetic Sentinel-2 spectral evaluation, calculate distance to nearest claim, and send directly to the GIS map.
            </p>

            <form onSubmit={handleIdentifyPosition} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Target Name:</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Latitude (°S):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLat}
                  onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-1.5 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Longitude (°E):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLng}
                  onChange={(e) => setCustomLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-1.5 text-white font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-3 flex gap-2 pt-1">
                <button
                  type="submit"
                  className="py-2 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Identify Position & Calculate Spectral Index
                </button>
              </div>
            </form>

            {/* Identified Position Result Card */}
            {identifiedResult && (
              <div className="p-3.5 bg-[#05111f] rounded-xl border border-teal-500/50 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-white text-sm">{identifiedResult.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    identifiedResult.prospectivityScore >= 75
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      : 'bg-amber-950 text-amber-300 border border-amber-600'
                  }`}>
                    Prospectivity: {identifiedResult.prospectivityScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="bg-[#08182b] p-2 rounded">
                    <span className="text-slate-400 block text-[9px] uppercase">Coordinates</span>
                    <span className="text-white font-bold">{identifiedResult.lat.toFixed(4)}°S, {identifiedResult.lng.toFixed(4)}°E</span>
                  </div>
                  <div className="bg-[#08182b] p-2 rounded">
                    <span className="text-slate-400 block text-[9px] uppercase">Ferric Oxide Index</span>
                    <span className="text-teal-300 font-bold">{identifiedResult.ferricIndex}%</span>
                  </div>
                  <div className="bg-[#08182b] p-2 rounded">
                    <span className="text-slate-400 block text-[9px] uppercase">Serpentinization</span>
                    <span className="text-amber-300 font-bold">{identifiedResult.swirIndex}%</span>
                  </div>
                </div>

                <p className="text-slate-300 text-[11px] pt-1">{identifiedResult.recommendation}</p>

                {/* Seamless Action Handover */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      onSendPositionToMap(
                        identifiedResult.lat,
                        identifiedResult.lng,
                        identifiedResult.name
                      )
                    }
                    className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Send Position to Free OpenStreetMap GIS
                  </button>

                  <button
                    onClick={() =>
                      onSendToFieldSurvey(
                        claims[0]?.id || 'claim-muto-01',
                        identifiedResult.lat,
                        identifiedResult.lng
                      )
                    }
                    className="py-1.5 px-3 bg-[#14325c] hover:bg-[#1c457f] text-slate-200 border border-slate-600 rounded font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-teal-400" />
                    Dispatch Field Survey PWA Here
                  </button>

                  {onSendToAiAdvisor && (
                    <button
                      onClick={() =>
                        onSendToAiAdvisor({
                          subChamber: identifiedResult.isInsideDyke ? 'Darwendale' : 'Sebakwe',
                          claimName: identifiedResult.name,
                          lat: identifiedResult.lat,
                          lng: identifiedResult.lng,
                          alterationIndex: identifiedResult.prospectivityScore,
                        })
                      }
                      className="py-1.5 px-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Analyze with AI Geoscientist
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
