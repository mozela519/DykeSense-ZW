/**
 * DykeSense-ZW Field Survey Mobile PWA
 * Handheld, offline-first interface for field surveyors on the Great Dyke.
 * Features:
 * - Bluetooth LE / Serial Magnetometer simulation (GSM-19 Overhauser stream)
 * - Manual station entry mode
 * - GPS auto-log simulation
 * - Diurnal correction calculation in real-time
 * - Grid progress visualizer
 * - Local offline queue with sync badge
 */

import React, { useState, useEffect } from 'react';
import {
  Radio,
  MapPin,
  Save,
  CheckCircle,
  Activity,
  Bluetooth,
  Play,
  Square,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
  ShieldCheck,
  Battery,
} from 'lucide-react';
import { SurveyGrid, MagnetometerReading, UserRole, Language } from '../types';
import { applyDiurnalCorrection } from '../services/geophysics';
import { offlineSync } from '../services/offlineStorage';
import { getTranslation } from '../services/i18n';
import { BatteryIndicator } from './BatteryIndicator';

interface FieldSurveyPWAProps {
  activeSurvey: SurveyGrid;
  onUpdateSurvey: (updated: SurveyGrid) => void;
  isSimulatedOffline: boolean;
  onReadingLogged: (newReading: MagnetometerReading) => void;
  language: Language;
  targetCoordinates?: { lat: number; lng: number; label?: string } | null;
  onClearTargetCoordinates?: () => void;
}

export const FieldSurveyPWA: React.FC<FieldSurveyPWAProps> = ({
  activeSurvey,
  onUpdateSurvey,
  isSimulatedOffline,
  onReadingLogged,
  language,
  targetCoordinates,
  onClearTargetCoordinates,
}) => {
  const t = getTranslation(language);

  // Survey navigation state
  const [selectedLine, setSelectedLine] = useState<string>('L01N');
  const [currentStation, setCurrentStation] = useState<number>(0);
  const [stationSpacing] = useState<number>(activeSurvey.stationSpacingMeters || 5);

  // Instrument inputs
  const [rawNt, setRawNt] = useState<number>(31210.0);
  const [diurnalBaseNt, setDiurnalBaseNt] = useState<number>(31200.0);
  const [isSimulatingStream, setIsSimulatingStream] = useState<boolean>(false);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number>(1.8);
  const [currentLat, setCurrentLat] = useState<number>(targetCoordinates?.lat ?? -17.1450);
  const [currentLng, setCurrentLng] = useState<number>(targetCoordinates?.lng ?? 30.6450);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);

  // Synchronize target coordinates when sent from screening or map
  useEffect(() => {
    if (targetCoordinates) {
      setCurrentLat(targetCoordinates.lat);
      setCurrentLng(targetCoordinates.lng);
      setCurrentStation(0);
    }
  }, [targetCoordinates]);

  // Compute diurnal corrected value
  const correctedNt = applyDiurnalCorrection(rawNt, diurnalBaseNt, 31200.0);

  // Bluetooth Simulation interval
  useEffect(() => {
    let interval: any = null;
    if (isSimulatingStream) {
      interval = setInterval(() => {
        // Chromite anomaly profile: peaks around station 10 (50m)
        const distFromPeak = Math.abs(currentStation - 10);
        const anomalyPeak = Math.max(0, 320 - distFromPeak * 45);
        const noise = (Math.random() - 0.5) * 4;
        const drift = Math.sin(Date.now() / 60000) * 8;

        const simulatedRaw = Number((31200.0 + drift + anomalyPeak + noise).toFixed(1));
        const simulatedBase = Number((31200.0 + drift).toFixed(1));

        setRawNt(simulatedRaw);
        setDiurnalBaseNt(simulatedBase);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulatingStream, currentStation]);

  // Log single station reading
  const handleLogStation = () => {
    const newReading: MagnetometerReading = {
      id: `rd-${activeSurvey.id}-${selectedLine}-${currentStation}-${Date.now()}`,
      surveyId: activeSurvey.id,
      lineId: selectedLine,
      stationNumber: currentStation,
      lat: Number((currentLat + currentStation * 0.000045).toFixed(6)),
      lng: Number((currentLng + (parseInt(selectedLine.slice(1, 3)) - 1) * 0.00022).toFixed(6)),
      rawTotalFieldNt: rawNt,
      diurnalBaseNt,
      diurnalCorrectedNt: correctedNt,
      timestamp: new Date().toISOString(),
      signalQuality: 98,
      operator: 'T. Mukarati (Registered Surveyor)',
      synced: !isSimulatedOffline,
      isSimulated: true,
    };

    // If offline, save into offline sync queue
    if (isSimulatedOffline) {
      offlineSync.enqueueReading(newReading);
    }

    onReadingLogged(newReading);

    // Auto advance station
    if (autoAdvance && currentStation < 20) {
      setCurrentStation((prev) => prev + 1);
    }
  };

  // Filter readings for current line
  const currentLineReadings = activeSurvey.readings.filter((r) => r.lineId === selectedLine);
  const loggedStationsSet = new Set(currentLineReadings.map((r) => r.stationNumber));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Handheld Instrument Header */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">
              Field Survey PWA — Handheld Mode
            </h2>
            <span className="bg-teal-900/60 text-teal-300 font-mono text-xs px-2 py-0.5 rounded border border-teal-500/40">
              GSM-19 Overhauser Interface
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Offline-first grid logger. Bluetooth serial or manual station input with automated diurnal baseline correction.
          </p>
        </div>

        {/* Stream Toggle / Hardware Simulator & Compact Battery */}
        <div className="flex items-center gap-2.5">
          <BatteryIndicator compact />
          <button
            onClick={() => setIsSimulatingStream(!isSimulatingStream)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
              isSimulatingStream
                ? 'bg-rose-950/80 text-rose-300 border border-rose-600/70 animate-pulse'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            {isSimulatingStream ? t.pwa.stopBle : t.pwa.simulateBle}
          </button>
        </div>
      </div>

      {/* Dispatched Anomaly Target Alert Banner */}
      {targetCoordinates && (
        <div className="bg-teal-950/90 border-2 border-teal-500 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-teal-200 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></span>
            <div>
              <span className="font-bold text-white uppercase text-[11px] block">
                Dispatched Exploration Target: {targetCoordinates.label || 'Satellite/Map Anomaly'}
              </span>
              <span className="text-teal-300 text-[11px]">
                Survey grid origin linked to Lat: {targetCoordinates.lat.toFixed(4)}°S, Lng: {targetCoordinates.lng.toFixed(4)}°E.
              </span>
            </div>
          </div>
          {onClearTargetCoordinates && (
            <button
              onClick={onClearTargetCoordinates}
              className="px-2.5 py-1 bg-teal-900/80 hover:bg-teal-800 text-teal-300 border border-teal-600/60 rounded text-[10px] font-bold transition-colors"
            >
              Reset Target Focus
            </button>
          )}
        </div>
      )}

      {/* Visual Battery Level Indicator & Field Power Telemetry */}
      <BatteryIndicator />

      {/* Main Handheld Display & Station Log Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Digital Gauge / Reading HUD */}
        <div className="md:col-span-6 bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Digital Magnetometer Gauge
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Signal Quality: 98%</span>
              </div>
            </div>

            {/* Big Instrument Display */}
            <div className="bg-[#040d17] border border-slate-800 rounded-xl p-4 text-center my-3 relative overflow-hidden">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                {t.pwa.correctedNt}
              </div>
              <div className="text-4xl font-extrabold font-mono text-teal-300 tracking-tight">
                {correctedNt.toFixed(1)} <span className="text-lg text-teal-500 font-normal">nT</span>
              </div>
              <div className="mt-2 text-xs font-mono text-slate-400 flex items-center justify-center gap-3">
                <span>Raw: <strong className="text-white">{rawNt.toFixed(1)} nT</strong></span>
                <span>•</span>
                <span>Base Drift: <strong className="text-amber-300">{(diurnalBaseNt - 31200).toFixed(1)} nT</strong></span>
              </div>
            </div>

            {/* GPS & Line Position Bar */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#0c223c] p-3 rounded-lg border border-slate-800 mt-4">
              <div>
                <span className="text-slate-400">Line:</span>
                <div className="text-white font-bold text-sm">{selectedLine}</div>
              </div>
              <div>
                <span className="text-slate-400">Station Distance:</span>
                <div className="text-white font-bold text-sm">
                  {currentStation * stationSpacing}m (Stn #{currentStation})
                </div>
              </div>
              <div>
                <span className="text-slate-400">GPS Coord:</span>
                <div className="text-teal-300 text-[11px]">
                  {currentLat.toFixed(5)}°S, {currentLng.toFixed(5)}°E
                </div>
              </div>
              <div>
                <span className="text-slate-400">Accuracy:</span>
                <div className="text-emerald-300 text-[11px]">±{gpsAccuracyMeters}m (RTK Fix)</div>
              </div>
            </div>
          </div>

          {/* Quick Log Button */}
          <div className="mt-5 space-y-2">
            <button
              onClick={handleLogStation}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              {t.pwa.logStationBtn} — Stn #{currentStation} ({currentStation * stationSpacing}m)
            </button>
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-0"
                />
                <span>Auto-advance station index on log</span>
              </label>
              <span>{isSimulatedOffline ? 'Queuing locally' : 'Live cloud sync'}</span>
            </div>
          </div>
        </div>

        {/* Right: Station Selector & Grid Stepper */}
        <div className="md:col-span-6 bg-[#0e243d] border border-slate-700/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              {t.pwa.surveyProgress} — {activeSurvey.name}
            </h3>
            <span className="text-xs font-mono text-teal-300">
              {activeSurvey.readings.length} Total Points Logged
            </span>
          </div>

          {/* Line Selection Tabs */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Select Transect Line:
            </label>
            <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
              {['L01N', 'L02N', 'L03N', 'L04N', 'L05N'].map((line) => {
                const count = activeSurvey.readings.filter((r) => r.lineId === line).length;
                const isSelected = selectedLine === line;
                return (
                  <button
                    key={line}
                    onClick={() => setSelectedLine(line)}
                    className={`py-2 px-1 rounded border text-center transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-400 font-bold shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <div>{line}</div>
                    <div className="text-[10px] text-teal-200 opacity-80">{count}/21</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Station Matrix (0m to 100m, 5m spacing) */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>Station Grid for {selectedLine}:</span>
              <span>{loggedStationsSet.size} of 21 Completed</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 font-mono text-xs max-h-48 overflow-y-auto p-1 bg-[#08182b] rounded-lg border border-slate-800">
              {Array.from({ length: 21 }, (_, idx) => {
                const isLogged = loggedStationsSet.has(idx);
                const isCurrent = currentStation === idx;
                const stReading = currentLineReadings.find((r) => r.stationNumber === idx);

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStation(idx)}
                    title={`Station ${idx} (${idx * 5}m)${
                      stReading ? ` - ${stReading.diurnalCorrectedNt} nT` : ' - Not logged'
                    }`}
                    className={`p-1.5 rounded border text-center flex flex-col items-center justify-center transition-all ${
                      isCurrent
                        ? 'ring-2 ring-amber-400 bg-amber-500/20 text-white font-bold'
                        : isLogged
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold">#{idx}</span>
                    <span className="text-[9px] opacity-75">{idx * 5}m</span>
                    {isLogged && <CheckCircle className="w-2.5 h-2.5 text-emerald-400 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Input Overrides */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-mono text-slate-400 block mb-2">
              Manual Instrument Override (nT):
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Raw Total Field (nT):</label>
                <input
                  type="number"
                  step="0.1"
                  value={rawNt}
                  onChange={(e) => setRawNt(parseFloat(e.target.value) || 31200)}
                  className="w-full bg-[#08182b] border border-slate-700 rounded p-1.5 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Base Station (nT):</label>
                <input
                  type="number"
                  step="0.1"
                  value={diurnalBaseNt}
                  onChange={(e) => setDiurnalBaseNt(parseFloat(e.target.value) || 31200)}
                  className="w-full bg-[#08182b] border border-slate-700 rounded p-1.5 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
