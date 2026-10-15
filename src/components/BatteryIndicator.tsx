/**
 * DykeSense-ZW: Visual Battery Level Indicator Component
 * Designed for handheld magnetometers (GEM GSM-19 Overhauser / Scintrex) during long-duration grid walks.
 * Alerts surveyors when voltage/battery health threatens reading accuracy or instrument shutdown.
 */

import React, { useState, useEffect } from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  BatteryMedium,
  BatteryLow,
  Zap,
  Sun,
  AlertOctagon,
  RefreshCw,
  Gauge,
  Thermometer,
} from 'lucide-react';

export interface BatteryState {
  levelPercent: number; // 0 - 100
  voltageV: number; // typically 10.8V to 13.2V for 12V LiFePO4 / Sealed Lead Acid packs
  temperatureC: number;
  isCharging: boolean;
  powerSource: 'battery' | 'solar_backpack' | 'hub_charger';
  estimatedHoursRemaining: number;
  estimatedReadingsLeft: number;
}

interface BatteryIndicatorProps {
  initialBattery?: Partial<BatteryState>;
  onBatteryAlert?: (level: number, message: string) => void;
  compact?: boolean;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  initialBattery,
  onBatteryAlert,
  compact = false,
}) => {
  const [battery, setBattery] = useState<BatteryState>({
    levelPercent: initialBattery?.levelPercent ?? 78,
    voltageV: initialBattery?.voltageV ?? 12.4,
    temperatureC: initialBattery?.temperatureC ?? 32.5,
    isCharging: initialBattery?.isCharging ?? false,
    powerSource: initialBattery?.powerSource ?? 'battery',
    estimatedHoursRemaining: 6.2,
    estimatedReadingsLeft: 540,
  });

  const [dismissAlert, setDismissAlert] = useState(false);

  // Recalculate estimates when level changes
  useEffect(() => {
    // 100% ~ 8 hours continuous polling, ~700 readings
    const hours = Number(((battery.levelPercent / 100) * 8.0).toFixed(1));
    const readings = Math.round((battery.levelPercent / 100) * 700);
    // Approximate voltage curve for 12V LiFePO4: 10.8V (0%) to 13.4V (100%)
    const voltage = Number((10.8 + (battery.levelPercent / 100) * 2.5).toFixed(2));

    setBattery((prev) => ({
      ...prev,
      voltageV: voltage,
      estimatedHoursRemaining: hours,
      estimatedReadingsLeft: readings,
    }));

    if (battery.levelPercent <= 20 && !dismissAlert && onBatteryAlert) {
      onBatteryAlert(
        battery.levelPercent,
        `Magnetometer battery at ${battery.levelPercent}%. Sensor bias drift risk during active transect!`
      );
    }
  }, [battery.levelPercent]);

  // Color coding thresholds
  const isCritical = battery.levelPercent <= 20;
  const isLow = battery.levelPercent > 20 && battery.levelPercent <= 45;
  const isGood = battery.levelPercent > 45;

  const getStatusColor = () => {
    if (isCritical) return 'text-rose-400 bg-rose-950/80 border-rose-500/80';
    if (isLow) return 'text-amber-400 bg-amber-950/80 border-amber-500/80';
    return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/80';
  };

  const getProgressColor = () => {
    if (isCritical) return 'bg-rose-500';
    if (isLow) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const simulateDischarge = (amount: number = 8) => {
    setBattery((prev) => ({
      ...prev,
      levelPercent: Math.max(5, prev.levelPercent - amount),
      isCharging: false,
      powerSource: 'battery',
    }));
    setDismissAlert(false);
  };

  const connectSolar = () => {
    setBattery((prev) => ({
      ...prev,
      isCharging: true,
      powerSource: 'solar_backpack',
      levelPercent: Math.min(100, prev.levelPercent + 15),
    }));
  };

  const resetFull = () => {
    setBattery((prev) => ({
      ...prev,
      levelPercent: 95,
      isCharging: false,
      powerSource: 'battery',
    }));
    setDismissAlert(false);
  };

  // Compact badge rendering
  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all ${getStatusColor()} ${
          isCritical ? 'animate-pulse ring-2 ring-rose-500/50' : ''
        }`}
        title={`Battery: ${battery.levelPercent}% (${battery.voltageV}V) • ${battery.estimatedHoursRemaining}h remaining`}
      >
        {battery.isCharging ? (
          <BatteryCharging className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
        ) : isCritical ? (
          <BatteryWarning className="w-3.5 h-3.5 text-rose-400 animate-spin-slow" />
        ) : isLow ? (
          <BatteryMedium className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span className="font-bold">{battery.levelPercent}%</span>
        <span className="text-[10px] opacity-75 hidden sm:inline">({battery.voltageV}V)</span>
      </div>
    );
  }

  // Full Field Gauge HUD
  return (
    <div className="space-y-2">
      {/* Critical Battery Alert Banner */}
      {isCritical && !dismissAlert && (
        <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-200 p-3 rounded-xl shadow-lg flex items-start justify-between gap-3 animate-pulse font-mono text-xs">
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white uppercase font-bold block">
                Warning: Low Magnetometer Battery ({battery.levelPercent}%)
              </strong>
              <span>
                Sensor polarization pulse may suffer amplitude decay. Connect auxiliary battery pack or 20W bush solar panel to avoid data corruption!
              </span>
            </div>
          </div>
          <button
            onClick={() => setDismissAlert(true)}
            className="text-[10px] text-rose-300 hover:text-white px-2 py-1 bg-rose-900 rounded border border-rose-700 shrink-0"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Main Battery Module Card */}
      <div className="bg-[#05111f] border border-slate-700/80 rounded-xl p-3.5 shadow-sm text-xs font-mono space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Magnetometer Power Supply
            </span>
          </div>

          <div className="flex items-center gap-2">
            {battery.isCharging ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                <Sun className="w-3 h-3 text-amber-400 animate-spin" />
                Solar Charging (20W)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                <Zap className="w-3 h-3 text-slate-400" />
                Internal 12V LiFePO4
              </span>
            )}

            <div className={`px-2 py-0.5 rounded border text-xs font-bold ${getStatusColor()}`}>
              {battery.levelPercent}%
            </div>
          </div>
        </div>

        {/* Segmented Visual Battery Bar */}
        <div>
          <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 border border-slate-700 flex overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()} ${
                battery.isCharging ? 'animate-pulse' : ''
              }`}
              style={{ width: `${Math.max(4, battery.levelPercent)}%` }}
            ></div>
          </div>

          {/* Scale markers */}
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1 px-1">
            <span>0% (10.8V Cutoff)</span>
            <span className="text-amber-500">20% Alert</span>
            <span>50%</span>
            <span>100% (13.3V)</span>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
          <div className="bg-[#08182b] p-2 rounded border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Bus Voltage</span>
            <span className="text-white font-bold text-sm">{battery.voltageV} V</span>
          </div>

          <div className="bg-[#08182b] p-2 rounded border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Walk Endurance</span>
            <span className="text-teal-300 font-bold text-sm">~{battery.estimatedHoursRemaining} hrs</span>
          </div>

          <div className="bg-[#08182b] p-2 rounded border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Stations Left</span>
            <span className="text-amber-300 font-bold text-sm">~{battery.estimatedReadingsLeft} pts</span>
          </div>

          <div className="bg-[#08182b] p-2 rounded border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase flex items-center gap-1">
              <Thermometer className="w-2.5 h-2.5 text-slate-400" /> Sensor Temp
            </span>
            <span className="text-slate-200 font-bold text-sm">{battery.temperatureC}°C</span>
          </div>
        </div>

        {/* Field Simulation & Maintenance Actions */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <span className="text-slate-400">Field Power Simulation:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => simulateDischarge(10)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
              title="Simulate 1 hour grid walking discharge (-10%)"
            >
              -10% Walk
            </button>
            <button
              onClick={() => simulateDischarge(35)}
              className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded border border-rose-700 transition-colors"
              title="Simulate low battery alert state"
            >
              Drain to 15% (Test Alert)
            </button>
            <button
              onClick={connectSolar}
              className="px-2 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-600/70 transition-colors flex items-center gap-1"
              title="Plug in 20W backpack solar panel"
            >
              <Sun className="w-3 h-3" />
              +15% Solar Charge
            </button>
            <button
              onClick={resetFull}
              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded border border-emerald-600/70 transition-colors"
              title="Reset battery to fresh 95% pack"
            >
              Reset 95%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
