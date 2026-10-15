/**
 * DykeSense-ZW Application Header & Navigation Bar
 * Features:
 * - Role Switcher (RBAC)
 * - Language Switcher (EN / ChiShona / IsiNdebele)
 * - Offline / Online status indicator & sync queue badge
 * - Mandatory statutory disclaimer banner
 */

import React from 'react';
import {
  Compass,
  Globe2,
  Radio,
  Layers,
  Activity,
  QrCode,
  FileText,
  Truck,
  ShieldCheck,
  Bot,
  CloudOff,
  Cloud,
  RefreshCw,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { UserRole, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSimulatedOffline: boolean;
  onToggleOffline: () => void;
  pendingSyncCount: number;
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  isSimulatedOffline,
  onToggleOffline,
  pendingSyncCount,
  onTriggerSync,
  isSyncing,
}) => {
  const t = getTranslation(language);

  const tabs = [
    { id: 'satellite', label: t.nav.satellite, icon: Layers },
    { id: 'map', label: t.nav.map, icon: Globe2 },
    { id: 'surveyPwa', label: t.nav.surveyPwa, icon: Radio },
    { id: 'inversion', label: t.nav.inversion, icon: Activity },
    { id: 'custody', label: t.nav.custody, icon: QrCode },
    { id: 'targets', label: t.nav.targets, icon: FileText },
    { id: 'hubFleet', label: t.nav.hubFleet, icon: Truck },
    { id: 'auditLedger', label: t.nav.auditLedger, icon: ShieldCheck },
    { id: 'aiAdvisor', label: t.nav.aiAdvisor, icon: Bot },
  ];

  const roleLabels: Record<UserRole, string> = {
    hub_admin: t.roles.hub_admin,
    geologist: t.roles.geologist,
    surveyor: t.roles.surveyor,
    asm_user: t.roles.asm_user,
    lab_tech: t.roles.lab_tech,
    viewer_regulator: t.roles.viewer_regulator,
  };

  return (
    <header className="bg-[#0B2545] text-white border-b border-slate-700/80 sticky top-0 z-50 shadow-md">
      {/* Top Disclaimer Bar */}
      <div className="bg-[#081b33] border-b border-amber-500/30 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 text-amber-300">
        <div className="flex items-center gap-2 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t.disclaimerBar}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-teal-400">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            Great Dyke Survey Hub (Harare / Gweru)
          </span>
          <span className="text-slate-400 hidden sm:inline">Datum: WGS84 / UTM 36S</span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-[#1B998B] flex items-center justify-center text-white shadow-lg ring-1 ring-teal-400/30">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                DykeSense<span className="text-teal-400 font-mono">-ZW</span>
              </h1>
              <span className="bg-teal-900/60 text-teal-300 text-[10px] font-mono px-2 py-0.5 rounded border border-teal-500/40 uppercase">
                Chrome Geophysics
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium hidden md:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Status / Role / Language Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Simulated Offline Toggle */}
          <button
            onClick={onToggleOffline}
            title={isSimulatedOffline ? 'Switch to Online mode' : 'Simulate remote bush location with no cellular signal'}
            className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all ${
              isSimulatedOffline
                ? 'bg-amber-950/70 text-amber-300 border-amber-600/60 shadow-inner'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/50'
            }`}
          >
            {isSimulatedOffline ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Bush Offline</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online (Econet LTE)</span>
              </>
            )}
          </button>

          {/* Sync Button & Badge */}
          {pendingSyncCount > 0 && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing || isSimulatedOffline}
              className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-md border border-amber-500/60 bg-amber-500/20 text-amber-200 transition-all ${
                isSimulatedOffline ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-500/30 cursor-pointer animate-pulse'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingSyncCount} {t.common.pendingSync}</span>
            </button>
          )}

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-[#14325c] border border-slate-600 rounded-md px-2.5 py-1 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-slate-400 text-[11px] hidden lg:inline">{t.common.role}:</span>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="hub_admin" className="bg-[#0B2545]">{roleLabels.hub_admin}</option>
              <option value="geologist" className="bg-[#0B2545]">{roleLabels.geologist}</option>
              <option value="surveyor" className="bg-[#0B2545]">{roleLabels.surveyor}</option>
              <option value="asm_user" className="bg-[#0B2545]">{roleLabels.asm_user}</option>
              <option value="lab_tech" className="bg-[#0B2545]">{roleLabels.lab_tech}</option>
              <option value="viewer_regulator" className="bg-[#0B2545]">{roleLabels.viewer_regulator}</option>
            </select>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[#14325c] border border-slate-600 rounded-md p-0.5 text-xs font-medium">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 rounded ${language === 'en' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('sn')}
              className={`px-2 py-0.5 rounded ${language === 'sn' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              Shona
            </button>
            <button
              onClick={() => onLanguageChange('nd')}
              className={`px-2 py-0.5 rounded ${language === 'nd' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              Ndebele
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="bg-[#0e2c52] border-t border-slate-700/60 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-teal-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
