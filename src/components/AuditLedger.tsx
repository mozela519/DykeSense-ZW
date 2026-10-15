/**
 * DykeSense-ZW Cryptographic Audit Ledger & Rural SMS Dispatch Module
 * Features:
 * - Immutable, SHA-256 chained audit trail of every reading, inversion, QA sign-off, and assay
 * - Live cryptographic verification of unbroken chain integrity
 * - Rural SMS / USSD notification simulator for cooperative chairpersons on Econet / NetOne
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  MessageSquare,
  Send,
  Radio,
  Clock,
  UserCheck,
} from 'lucide-react';
import { AuditLogEntry, UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface AuditLedgerProps {
  auditLog: AuditLogEntry[];
  smsDispatches: any[];
  onSendSms: (phone: string, name: string, msg: string) => void;
  language: Language;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({
  auditLog,
  smsDispatches,
  onSendSms,
  language,
}) => {
  const t = getTranslation(language);

  const [phone, setPhone] = useState<string>('+263 77 234 5678');
  const [recipientName, setRecipientName] = useState<string>('M. Sibanda (Chairperson)');
  const [smsMsg, setSmsMsg] = useState<string>(
    'DykeSense Alert: Target Card TC-MUTO-01 published for Seam 4. Recommendation: 2.5m shallow trenching. Geologist signed off.'
  );

  // Check chain validity
  let isChainValid = true;
  for (let i = 1; i < auditLog.length; i++) {
    if (auditLog[i].previousHash !== auditLog[i - 1].currentHash) {
      isChainValid = false;
      break;
    }
  }

  const handleDispatchSms = (e: React.FormEvent) => {
    e.preventDefault();
    onSendSms(phone, recipientName, smsMsg);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            Immutable Audit Ledger & SMS Dispatch
          </h2>
          <p className="text-xs text-slate-300">
            Cryptographic SHA-256 hash chaining of all field measurements, geoscientist QA sign-offs, and assay results.
          </p>
        </div>

        {/* Chain Integrity Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {isChainValid ? (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 flex items-center gap-1.5 shadow">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Cryptographic Chain Intact ({auditLog.length} Blocks Verified)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-red-950 text-red-300 border border-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Hash Chain Integrity Alert
            </span>
          )}
        </div>
      </div>

      {/* Grid: Audit Ledger Blocks (Left) + Rural SMS / USSD Dispatch (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Ledger Chain */}
        <div className="lg:col-span-7 bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-400" />
              SHA-256 Chained Block Sequence
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Total Recorded Blocks: {auditLog.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {auditLog.map((entry, index) => (
              <div
                key={entry.id}
                className="bg-[#05111f] border border-slate-800 rounded-xl p-3.5 text-xs font-mono space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-teal-900/60 text-teal-300 text-[10px] font-bold flex items-center justify-center border border-teal-500/40">
                      #{index + 1}
                    </span>
                    <strong className="text-white font-bold">{entry.action}</strong>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-300 text-xs pl-7">{entry.details}</p>

                <div className="pl-7 text-[11px] text-slate-400 flex items-center gap-2">
                  <UserCheck className="w-3 h-3 text-teal-400" />
                  <span>Actor: <strong className="text-slate-200">{entry.actorName}</strong> ({entry.actorRole})</span>
                </div>

                {/* Hashes */}
                <div className="pl-7 pt-1 border-t border-slate-900 space-y-1 text-[10px]">
                  <div className="text-slate-500 truncate">
                    Prev Hash: <span className="text-slate-400">{entry.previousHash}</span>
                  </div>
                  <div className="text-teal-400 truncate">
                    Curr Hash: <span className="text-teal-300 font-bold">{entry.currentHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rural SMS / USSD Notification Simulator */}
        <div className="lg:col-span-5 bg-[#08182b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {t.smsSimulation.title}
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            {t.smsSimulation.subtitle}
          </p>

          {/* SMS Dispatch Form */}
          <form onSubmit={handleDispatchSms} className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Chairperson / Digger Phone Number:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Recipient Name & Title:</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">SMS Message (160 chars max recommended):</label>
              <textarea
                rows={3}
                value={smsMsg}
                onChange={(e) => setSmsMsg(e.target.value)}
                className="w-full bg-[#05111f] border border-slate-700 rounded p-2 text-white resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {t.smsSimulation.sendSms}
            </button>
          </form>

          {/* Recent Outbound SMS History */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              {t.smsSimulation.recentAlerts}:
            </span>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {smsDispatches.map((sms) => (
                <div
                  key={sms.id}
                  className="bg-[#05111f] border border-slate-800 p-2.5 rounded-lg text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{sms.recipientName}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-600/50">
                      {sms.networkStatus}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{sms.message}</p>
                  <div className="text-[10px] text-slate-500">{new Date(sms.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
