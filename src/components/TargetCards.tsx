/**
 * DykeSense-ZW Plain-Language Target Cards Module
 * Accessible, jargon-free exploration target cards for ASM co-ops and junior miners.
 * Discloses uncertainty explicitly and prohibits "proven resource" misrepresentation.
 * Trilingual: English, ChiShona, IsiNdebele.
 */

import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Award,
  CheckCircle2,
  Printer,
  Sparkles,
  MapPin,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { TargetCard, UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface TargetCardsProps {
  targetCards: TargetCard[];
  onPublishCard?: (cardData: any) => void;
  currentRole: UserRole;
  language: Language;
}

export const TargetCards: React.FC<TargetCardsProps> = ({
  targetCards,
  currentRole,
  language,
}) => {
  const t = getTranslation(language);

  const [activeLangTab, setActiveLangTab] = useState<'en' | 'sn' | 'nd'>(language);
  const [selectedCardId, setSelectedCardId] = useState<string>(
    targetCards[0]?.id || 'tc-muto-01'
  );

  const activeCard = targetCards.find((c) => c.id === selectedCardId) || targetCards[0];

  const getPriorityBadge = (priority: TargetCard['priorityLevel']) => {
    if (priority.includes('Priority 1')) {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          {priority}
        </span>
      );
    }
    if (priority.includes('Priority 2')) {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/50 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          {priority}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
        {priority}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0e243d] border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            {t.targetsTab.title}
          </h2>
          <p className="text-xs text-slate-300">
            {t.targetsTab.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Print/Export Button */}
          <button
            onClick={handlePrint}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>{t.common.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Statutory Caveat Box */}
      <div className="bg-amber-950/40 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-xs text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold uppercase tracking-wider block font-mono text-amber-300">
            Statutory Caveat & Transparency Rule:
          </strong>
          <span>{t.targetsTab.statutoryNotice}</span>
        </div>
      </div>

      {/* Target Cards Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targetCards.map((card) => {
          const isSelected = card.id === selectedCardId;
          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#0f2a4d] border-teal-500 shadow-lg ring-1 ring-teal-500/50'
                  : 'bg-[#08182b] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono text-teal-400 uppercase">
                    Target Code: {card.targetCode}
                  </span>
                  <h3 className="text-sm font-bold text-white">{card.claimName}</h3>
                </div>
                {getPriorityBadge(card.priorityLevel)}
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                {card.plainEnglishSummary}
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1 text-teal-300">
                  <Award className="w-3.5 h-3.5 text-teal-400" />
                  {card.geologistSignedOff ? 'Geologist Signed' : 'Pending Review'}
                </span>
                <span>Depth: {card.evidenceFactors.depthEstimateM}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Target Card Inspection & Language Translation */}
      {activeCard && (
        <div className="bg-[#08182b] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-500/40">
                  {activeCard.targetCode}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeCard.subChamber} Sub-Chamber
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {activeCard.claimName}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {getPriorityBadge(activeCard.priorityLevel)}
            </div>
          </div>

          {/* Trilingual Plain-Language Explanations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Plain-Language Target Briefing:
              </span>

              {/* Language Switcher Tabs */}
              <div className="flex items-center gap-1 bg-[#040d17] p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveLangTab('en')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeLangTab === 'en'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setActiveLangTab('sn')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeLangTab === 'sn'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ChiShona
                </button>
                <button
                  onClick={() => setActiveLangTab('nd')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeLangTab === 'nd'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  IsiNdebele
                </button>
              </div>
            </div>

            {/* Language Box */}
            <div className="bg-[#05111f] p-4 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-200">
              {activeLangTab === 'en' && <p>{activeCard.plainEnglishSummary}</p>}
              {activeLangTab === 'sn' && (
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-teal-400 font-bold uppercase">
                    ChiShona Chiri Pachena:
                  </div>
                  <p>{activeCard.shonaSummary}</p>
                </div>
              )}
              {activeLangTab === 'nd' && (
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-teal-400 font-bold uppercase">
                    IsiNdebele Esicacileyo:
                  </div>
                  <p>{activeCard.ndebeleSummary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Factors Grid */}
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block mb-2">
              Exploration Evidence Summary:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#05111f] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Magnetic Anomaly</span>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  +{activeCard.evidenceFactors.magneticAnomalyNt} nT
                </div>
                <span className="text-[10px] text-slate-500">Peak intensity</span>
              </div>

              <div className="bg-[#05111f] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Inverted Depth</span>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  {activeCard.evidenceFactors.depthEstimateM}
                </div>
                <span className="text-[10px] text-slate-500">Apex depth</span>
              </div>

              <div className="bg-[#05111f] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Satellite Alteration</span>
                <div className="text-xs font-bold text-amber-300 mt-1 line-clamp-2">
                  {activeCard.evidenceFactors.satelliteCorrelation}
                </div>
              </div>

              <div className="bg-[#05111f] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Tenement Access</span>
                <div className="text-xs font-bold text-emerald-300 mt-1 line-clamp-2">
                  {activeCard.evidenceFactors.accessFeasibility}
                </div>
              </div>
            </div>
          </div>

          {/* Disclosed Uncertainty Box */}
          <div className="p-3.5 bg-[#061424] rounded-xl border border-slate-700/60 text-xs font-mono text-slate-300 space-y-1">
            <span className="text-teal-400 font-bold block uppercase text-[11px]">
              Disclosed Geophysical Uncertainty:
            </span>
            <p>{activeCard.disclosedUncertainty}</p>
          </div>

          {/* Sign-off & Publication Stamp */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>
                Verified by: <strong className="text-white">{activeCard.geologistName}</strong>
              </span>
            </div>
            <span>Published: {activeCard.datePublished}</span>
          </div>
        </div>
      )}
    </div>
  );
};
