/**
 * DykeSense-ZW Shared Equipment Hub & Co-op Booking Calculator
 * Affordable access to professional geophysics gear (GSM-19, Differential GPS).
 * Features per-hectare pricing with cooperative cost-splitting calculation.
 */

import React, { useState } from 'react';
import {
  Truck,
  Calculator,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  BatteryCharging,
  DollarSign,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { EquipmentItem, SurveyBooking, ClaimPolygon, UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface HubBookingProps {
  equipment: EquipmentItem[];
  bookings: SurveyBooking[];
  claims: ClaimPolygon[];
  onCreateBooking: (bookingData: any) => void;
  currentRole: UserRole;
  language: Language;
}

export const HubBooking: React.FC<HubBookingProps> = ({
  equipment,
  bookings,
  claims,
  onCreateBooking,
  currentRole,
  language,
}) => {
  const t = getTranslation(language);

  // Calculator Form State
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.id || 'claim-muto-01');
  const [coopName, setCoopName] = useState<string>('Kushinga Chromite Mining Syndicate');
  const [contactName, setContactName] = useState<string>('M. Sibanda (Chairperson)');
  const [contactPhone, setContactPhone] = useState<string>('+263 77 234 5678');
  const [hectares, setHectares] = useState<number>(20);
  const [coopMembers, setCoopMembers] = useState<number>(12);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([
    equipment[0]?.id || 'eq-gsm19-01',
  ]);
  const [scheduledDate, setScheduledDate] = useState<string>('2026-10-22');

  // Pricing math: $7.50 per hectare + $35 daily equipment base rate
  const totalCostUSD = Number((hectares * 7.50 + 35.0).toFixed(2));
  const totalCostZWG = Number((totalCostUSD * 28.0).toFixed(2));
  const costPerMinerUSD = Number((totalCostUSD / Math.max(1, coopMembers)).toFixed(2));

  const handleToggleEquipment = (id: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBooking({
      cooperativeName: coopName,
      contactPerson: contactName,
      phone: contactPhone,
      claimId: selectedClaimId,
      hectares,
      scheduledDate,
      equipmentIds: selectedEquipmentIds,
      coopMemberCount: coopMembers,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-400" />
            {t.bookingTab.title}
          </h2>
          <p className="text-xs text-slate-300">
            {t.bookingTab.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-teal-300 bg-[#08182b] px-3 py-1.5 rounded-lg border border-slate-700">
          <span>Active Hub: Gweru Regional Geophysics Center</span>
        </div>
      </div>

      {/* Main Grid: Cost Calculator (Left) + Equipment Fleet & Active Bookings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cost Sharing Calculator */}
        <div className="lg:col-span-5 bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calculator className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {t.bookingTab.calcTitle}
            </h3>
          </div>

          <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Select Claim / Tenement:</label>
              <select
                value={selectedClaimId}
                onChange={(e) => setSelectedClaimId(e.target.value)}
                className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
              >
                {claims.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.areaHectares} ha)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">{t.bookingTab.hectaresToSurvey}:</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={hectares}
                  onChange={(e) => setHectares(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{t.bookingTab.coopMembers}:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={coopMembers}
                  onChange={(e) => setCoopMembers(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white font-bold"
                  required
                />
              </div>
            </div>

            {/* Price Output Breakdown Card */}
            <div className="bg-[#05111f] p-4 rounded-xl border border-teal-500/40 text-center space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-teal-400 font-bold block">
                Cost Per Cooperative Member:
              </span>
              <div className="text-3xl font-extrabold text-amber-300 font-mono tracking-tight">
                ${costPerMinerUSD} <span className="text-xs font-normal text-slate-300">USD / miner</span>
              </div>
              <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between font-mono">
                <span>Total Survey: <strong className="text-white">${totalCostUSD} USD</strong></span>
                <span>ZWG Equiv: <strong className="text-teal-300">{totalCostZWG} ZWG</strong></span>
              </div>
            </div>

            {/* Cooperative Contacts */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-slate-400 block mb-1">ASM Cooperative Name:</label>
                <input
                  type="text"
                  value={coopName}
                  onChange={(e) => setCoopName(e.target.value)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Contact Leader:</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone (SMS Alert):</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Requested Start Date:</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {t.bookingTab.bookEquipment}
            </button>
          </form>
        </div>

        {/* Equipment Fleet & Existing Bookings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Equipment Fleet */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-400" />
              {t.bookingTab.equipmentFleet}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {equipment.map((item) => {
                const isSelected = selectedEquipmentIds.includes(item.id);
                const isAvailable = item.status === 'available';

                return (
                  <div
                    key={item.id}
                    onClick={() => isAvailable && handleToggleEquipment(item.id)}
                    className={`p-3 rounded-xl border transition-all ${
                      isAvailable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                    } ${
                      isSelected
                        ? 'bg-teal-950/80 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-[#05111f] border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-bold text-white line-clamp-1">{item.model}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isAvailable
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                          : 'bg-amber-950 text-amber-300 border border-amber-600/50'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <div>SN: <strong className="text-slate-300">{item.serialNumber}</strong></div>
                      <div>Hub: {item.currentHub}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <BatteryCharging className="w-3.5 h-3.5" /> {item.batteryHealthPercent}%
                        </span>
                        <span className="font-bold text-amber-300">${item.dailyRateUSD}/day</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bookings Table */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              Active Cooperative Survey Bookings
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg bg-[#05111f] border border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{b.cooperativeName}</span>
                      <span className="text-[10px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-600/50">
                        {b.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Contact: {b.contactPerson} ({b.phone}) • Scheduled: {b.scheduledDate}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-amber-300 font-bold">${b.costPerMemberUSD}/miner</div>
                    <div className="text-[10px] text-slate-400">
                      {b.hectares} ha • {b.coopMemberCount} miners
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
