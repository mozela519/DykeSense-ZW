/**
 * DykeSense-ZW QR Chain-of-Custody & Assay Tracking Module
 * Features:
 * - Dynamic QR-code generation for tamper-evident sample bags
 * - Cryptographic custody event timeline with SHA-256 hash signatures
 * - Lab Assay entry (Screening XRF vs Certified ICP-OES / Fire Assay)
 * - Cr:Fe ratio calculation & metallurgical grade labeling
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  FlaskConical,
  Truck,
  FileCheck,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { SampleBag, CustodyStatus, UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface SampleCustodyProps {
  samples: SampleBag[];
  onRegisterSample: (sampleData: any) => void;
  onAddCustodyEvent: (sampleId: string, eventData: any) => void;
  onRecordAssay: (sampleId: string, assayData: any) => void;
  currentRole: UserRole;
  language: Language;
}

export const SampleCustody: React.FC<SampleCustodyProps> = ({
  samples,
  onRegisterSample,
  onAddCustodyEvent,
  onRecordAssay,
  currentRole,
  language,
}) => {
  const t = getTranslation(language);

  const [selectedSampleId, setSelectedSampleId] = useState<string>(
    samples[0]?.id || 'DYKE-SAMP-2026-084'
  );
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});

  // Registration modal form state
  const [showRegModal, setShowRegModal] = useState<boolean>(false);
  const [newBagId, setNewBagId] = useState<string>(
    `DYKE-SAMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [newSampleType, setNewSampleType] = useState<SampleBag['sampleType']>('Stratiform_Seam');
  const [newSampleWeight, setNewSampleWeight] = useState<number>(4.5);
  const [newSamplerName, setNewSamplerName] = useState<string>('K. Sibanda (Field Sampler)');

  // Custody handover state
  const [nextStatus, setNextStatus] = useState<CustodyStatus>('hub_received');
  const [handoverLocation, setHandoverLocation] = useState<string>('Gweru Regional Hub');
  const [handoverNotes, setHandoverNotes] = useState<string>('Bag seal inspected and verified intact.');

  // Lab assay state
  const [assayMethod, setAssayMethod] = useState<'Portable_XRF_Screening' | 'Certified_ICP_OES_FireAssay'>(
    'Certified_ICP_OES_FireAssay'
  );
  const [cr2o3, setCr2o3] = useState<number>(47.2);
  const [feo, setFeo] = useState<number>(16.4);
  const [certNum, setCertNum] = useState<string>(`IMR-CERT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isCertified, setIsCertified] = useState<boolean>(true);

  const selectedSample = samples.find((s) => s.id === selectedSampleId) || samples[0];

  // Generate QR codes for all sample bags
  useEffect(() => {
    samples.forEach(async (sample) => {
      try {
        const qrString = JSON.stringify({
          app: 'DykeSense-ZW',
          sampleId: sample.id,
          claimId: sample.claimId,
          type: sample.sampleType,
          collected: sample.collectedAt,
        });
        const url = await QRCode.toDataURL(qrString, { width: 180, margin: 1 });
        setQrCodeDataUrls((prev) => ({ ...prev, [sample.id]: url }));
      } catch (err) {
        console.error('Error generating QR', err);
      }
    });
  }, [samples]);

  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterSample({
      sampleId: newBagId,
      claimId: 'claim-muto-01',
      sampleType: newSampleType,
      sampleWeightKg: newSampleWeight,
      lat: -17.1454,
      lng: 30.6455,
      samplerName: newSamplerName,
    });
    setShowRegModal(false);
    setSelectedSampleId(newBagId);
  };

  const handleAddCustody = () => {
    onAddCustodyEvent(selectedSample.id, {
      status: nextStatus,
      actorName: currentRole === 'hub_admin' ? 'P. Moyo (Hub Admin)' : 'Field Officer',
      actorRole: currentRole,
      location: handoverLocation,
      notes: handoverNotes,
    });
  };

  const handleSaveAssay = (e: React.FormEvent) => {
    e.preventDefault();
    onRecordAssay(selectedSample.id, {
      labName: 'Institute of Mining Research (IMR) Harare',
      assayMethod,
      cr2o3Percent: cr2o3,
      feoPercent: feo,
      certificateNumber: certNum,
      isCertified,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner & Action Header */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-400" />
            {t.custodyTab.title}
          </h2>
          <p className="text-xs text-slate-300">
            {t.custodyTab.subtitle}
          </p>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="py-2 px-3.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t.custodyTab.scanOrEnter}
        </button>
      </div>

      {/* Main Grid: Sample Explorer & QR Details (Left) + Custody Timeline & Lab Assays (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bag Selector & QR Code Display */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-mono text-slate-400 block mb-2">
              Registered Sample Bags:
            </span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {samples.map((s) => {
                const isSelected = s.id === selectedSampleId;
                const isComplete = s.custodyHistory.some((c) => c.status === 'assay_complete');
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSampleId(s.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-950/80 text-white border-teal-500 shadow'
                        : 'bg-[#05111f] text-slate-300 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{s.id}</div>
                      <div className="text-[10px] text-slate-400">{s.sampleType.replace('_', ' ')} • {s.sampleWeightKg} kg</div>
                    </div>
                    {isComplete ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-600/50">
                        Assayed
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-600/50">
                        In Transit
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QR Code Tamper-Evident Bag Tag */}
          {selectedSample && (
            <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-5 text-center shadow-md">
              <div className="text-[11px] font-mono uppercase tracking-wider text-teal-400 mb-1">
                Tamper-Evident QR Bag Label
              </div>
              <div className="text-base font-bold text-white font-mono">
                {selectedSample.id}
              </div>

              {/* QR Image */}
              <div className="my-3 p-3 bg-white rounded-xl inline-block shadow-inner ring-2 ring-teal-500/30">
                {qrCodeDataUrls[selectedSample.id] ? (
                  <img
                    src={qrCodeDataUrls[selectedSample.id]}
                    alt="Sample QR Code"
                    className="w-36 h-36 mx-auto"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-200 animate-pulse rounded flex items-center justify-center text-xs text-slate-500">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="text-xs font-mono text-slate-300 space-y-1 text-left bg-[#05111f] p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Rock Lithology:</span>
                  <span className="text-white font-semibold">{selectedSample.sampleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bag Weight:</span>
                  <span className="text-white">{selectedSample.sampleWeightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sampler:</span>
                  <span className="text-teal-300">{selectedSample.samplerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GPS Origin:</span>
                  <span className="text-slate-300 text-[11px]">{selectedSample.lat}°, {selectedSample.lng}°</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Custody Timeline & Lab Assay Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* Custody Timeline */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                {t.custodyTab.custodyHistory} — SHA-256 Verifiable
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                {selectedSample?.custodyHistory.length} Recorded Transitions
              </span>
            </div>

            {/* Timeline Events */}
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-700">
              {selectedSample?.custodyHistory.map((event, idx) => (
                <div key={event.id} className="relative flex items-start gap-3 pl-1">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#08182b] z-10 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-[#05111f] border border-slate-800 rounded-lg p-3 text-xs font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-white font-bold uppercase tracking-wider text-[11px]">
                        {event.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-slate-300">
                      <strong>{event.actorName}</strong> ({event.actorRole}) at <em>{event.location}</em>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">{event.notes}</div>

                    {/* SHA-256 Hash signature */}
                    <div className="mt-2 text-[10px] text-teal-400 font-mono flex items-center gap-1 overflow-x-auto bg-[#040d17] p-1 rounded">
                      <ShieldCheck className="w-3 h-3 text-teal-500 shrink-0" />
                      <span>Signature: {event.hashSignature}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Next Custody Event Action */}
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as CustodyStatus)}
                className="bg-[#05111f] border border-slate-700 text-white text-xs font-mono rounded p-2 focus:outline-none"
              >
                <option value="hub_received">Regional Hub Received</option>
                <option value="in_transit_lab">In Transit to Analytical Lab</option>
                <option value="lab_received">Lab Sample Received</option>
              </select>

              <input
                type="text"
                value={handoverLocation}
                onChange={(e) => setHandoverLocation(e.target.value)}
                placeholder="Handover Location..."
                className="bg-[#05111f] border border-slate-700 text-white text-xs font-mono rounded p-2 focus:outline-none"
              />

              <button
                onClick={handleAddCustody}
                className="py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <Truck className="w-3.5 h-3.5" />
                Sign & Transition Custody
              </button>
            </div>
          </div>

          {/* Lab Results Section (Screening vs Certified) */}
          <div className="bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-400" />
                {t.custodyTab.labResults} — Metallurgical Characterization
              </h3>
              {selectedSample?.assay ? (
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                  selectedSample.assay.isCertified
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600/60'
                    : 'bg-amber-950 text-amber-300 border-amber-600/60'
                }`}>
                  {selectedSample.assay.isCertified ? 'Certified Reference Lab' : 'Field Screening XRF Only'}
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-400">Assay Not Yet Logged</span>
              )}
            </div>

            {selectedSample?.assay ? (
              <div className="p-4 bg-[#05111f] rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-[#08182b] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Cr₂O₃ Content</span>
                    <div className="text-xl font-bold text-teal-300">{selectedSample.assay.cr2o3Percent}%</div>
                  </div>
                  <div className="bg-[#08182b] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">FeO Content</span>
                    <div className="text-xl font-bold text-slate-200">{selectedSample.assay.feoPercent}%</div>
                  </div>
                  <div className="bg-[#08182b] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Cr:Fe Ratio</span>
                    <div className="text-xl font-bold text-amber-300">{selectedSample.assay.crFeRatio}:1</div>
                  </div>
                  <div className="bg-[#08182b] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Grade Class</span>
                    <div className="text-xs font-bold text-white mt-1 truncate">
                      {selectedSample.assay.gradeClassification}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap justify-between gap-2">
                  <span>Lab: <strong className="text-white">{selectedSample.assay.labName}</strong></span>
                  <span>Method: <strong className="text-teal-300">{selectedSample.assay.assayMethod}</strong></span>
                  {selectedSample.assay.certificateNumber && (
                    <span>Certificate: <strong className="text-white">{selectedSample.assay.certificateNumber}</strong></span>
                  )}
                </div>
              </div>
            ) : (
              /* Entry Form for Lab Tech */
              <form onSubmit={handleSaveAssay} className="p-4 bg-[#05111f] rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
                <div className="text-slate-300 font-bold mb-2">Record Lab Assay Results:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Cr₂O₃ Percent (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cr2o3}
                      onChange={(e) => setCr2o3(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#08182b] border border-slate-700 rounded p-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">FeO Percent (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={feo}
                      onChange={(e) => setFeo(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#08182b] border border-slate-700 rounded p-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Method:</label>
                    <select
                      value={assayMethod}
                      onChange={(e) => setAssayMethod(e.target.value as any)}
                      className="w-full bg-[#08182b] border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="Certified_ICP_OES_FireAssay">Certified ICP-OES / Fire Assay</option>
                      <option value="Portable_XRF_Screening">Portable XRF Screening</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={isCertified}
                      onChange={(e) => setIsCertified(e.target.checked)}
                      className="rounded bg-slate-800 text-teal-600 focus:ring-0"
                    />
                    <span>Accredited Lab Certificate Attached</span>
                  </label>

                  <button
                    type="submit"
                    className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded shadow transition-all"
                  >
                    Save Lab Assay & Stamp Hash
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Register New Bag Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e243d] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs font-mono">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-teal-400" />
              Register New Sample Bag
            </h3>

            <form onSubmit={handleCreateSample} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Sample Bag ID Tag:</label>
                <input
                  type="text"
                  value={newBagId}
                  onChange={(e) => setNewBagId(e.target.value)}
                  className="w-full bg-[#08182b] border border-slate-700 rounded p-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Lithology / Ore Type:</label>
                <select
                  value={newSampleType}
                  onChange={(e) => setNewSampleType(e.target.value as any)}
                  className="w-full bg-[#08182b] border border-slate-700 rounded p-2 text-white"
                >
                  <option value="Stratiform_Seam">Stratiform Chromite Seam</option>
                  <option value="Podiform_Chromite">Podiform Chromite Lens</option>
                  <option value="Eluvial_Float">Eluvial Chrome Float</option>
                  <option value="Host_Serpentinite">Host Serpentinite Baseline</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sample Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  value={newSampleWeight}
                  onChange={(e) => setNewSampleWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#08182b] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Field Sampler Name:</label>
                <input
                  type="text"
                  value={newSamplerName}
                  onChange={(e) => setNewSamplerName(e.target.value)}
                  className="w-full bg-[#08182b] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-teal-600 text-white rounded font-bold hover:bg-teal-500 shadow"
                >
                  Generate QR & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
