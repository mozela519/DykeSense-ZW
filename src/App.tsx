/**
 * DykeSense-ZW Main Application Entry
 * Affordable Chrome Exploration Platform for ASM & Junior Miners (Zimbabwe)
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SatelliteScreeningModule } from './components/SatelliteScreeningModule';
import { DesktopScreeningMap } from './components/DesktopScreeningMap';
import { FieldSurveyPWA } from './components/FieldSurveyPWA';
import { GeophysicsInversion } from './components/GeophysicsInversion';
import { SampleCustody } from './components/SampleCustody';
import { TargetCards } from './components/TargetCards';
import { HubBooking } from './components/HubBooking';
import { AuditLedger } from './components/AuditLedger';
import { AiAssistantModal } from './components/AiAssistantModal';

import {
  UserRole,
  Language,
  ClaimPolygon,
  SatelliteScreeningArea,
  SurveyGrid,
  InversionModel,
  SampleBag,
  TargetCard,
  EquipmentItem,
  SurveyBooking,
  AuditLogEntry,
  MagnetometerReading,
} from './types';
import {
  SEED_CLAIMS,
  SEED_SCREENING,
  SEED_SURVEYS,
  SEED_INVERSIONS,
  SEED_SAMPLES,
  SEED_TARGET_CARDS,
  SEED_EQUIPMENT,
  SEED_BOOKINGS,
  SEED_AUDIT_LOG,
} from './data/seedData';
import { offlineSync } from './services/offlineStorage';
import { StructuredAnomalyOutput } from './services/geminiServer';

export default function App() {
  // App-level state
  const [currentRole, setCurrentRole] = useState<UserRole>('geologist');
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>('satellite');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [targetHighlight, setTargetHighlight] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [fieldSurveyInitialCoords, setFieldSurveyInitialCoords] = useState<{
    lat: number;
    lng: number;
    label?: string;
  } | null>(null);
  const [prefilledTargetForAi, setPrefilledTargetForAi] = useState<{
    subChamber: string;
    claimName: string;
    lat?: number;
    lng?: number;
    alterationIndex?: number;
    depthM?: number;
    widthM?: number;
    dipDeg?: number;
  } | null>(null);

  // Domain data state
  const [claims, setClaims] = useState<ClaimPolygon[]>(SEED_CLAIMS);
  const [screeningAreas, setScreeningAreas] = useState<SatelliteScreeningArea[]>(SEED_SCREENING);
  const [surveys, setSurveys] = useState<SurveyGrid[]>(SEED_SURVEYS);
  const [activeSurveyId, setActiveSurveyId] = useState<string>(SEED_SURVEYS[0].id);
  const [inversions, setInversions] = useState<InversionModel[]>(SEED_INVERSIONS);
  const [samples, setSamples] = useState<SampleBag[]>(SEED_SAMPLES);
  const [targetCards, setTargetCards] = useState<TargetCard[]>(SEED_TARGET_CARDS);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(SEED_EQUIPMENT);
  const [bookings, setBookings] = useState<SurveyBooking[]>(SEED_BOOKINGS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(SEED_AUDIT_LOG);
  const [smsDispatches, setSmsDispatches] = useState<any[]>([]);

  // Update pending sync count from offline storage
  const updatePendingCount = () => {
    const queue = offlineSync.getQueuedReadings();
    setPendingSyncCount(queue.length);
  };

  useEffect(() => {
    updatePendingCount();
    fetchInitialData();
  }, [currentRole]);

  const fetchInitialData = async () => {
    try {
      const [claimsRes, screeningRes, surveysRes, samplesRes, cardsRes, equipRes, bkRes, auditRes, smsRes] =
        await Promise.all([
          fetch(`/api/claims?role=${currentRole}`),
          fetch('/api/screening'),
          fetch('/api/surveys'),
          fetch('/api/samples'),
          fetch('/api/target-cards'),
          fetch('/api/equipment'),
          fetch('/api/bookings'),
          fetch('/api/audit-log'),
          fetch('/api/sms'),
        ]);

      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (screeningRes.ok) setScreeningAreas(await screeningRes.json());
      if (samplesRes.ok) setSamples(await samplesRes.json());
      if (cardsRes.ok) setTargetCards(await cardsRes.json());
      if (equipRes.ok) setEquipment(await equipRes.json());
      if (bkRes.ok) setBookings(await bkRes.json());
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        if (auditData.entries) setAuditLog(auditData.entries);
      }
      if (smsRes.ok) setSmsDispatches(await smsRes.json());

      // Fetch active survey with full readings
      const surveyDetailRes = await fetch(`/api/surveys/${activeSurveyId}`);
      if (surveyDetailRes.ok) {
        const fullSurvey = await surveyDetailRes.json();
        setSurveys((prev) =>
          prev.map((s) => (s.id === fullSurvey.id ? fullSurvey : s))
        );
      }
    } catch (err) {
      console.warn('Network unreachable or dev server booting; utilizing local seed memory state', err);
    }
  };

  // Trigger Offline Queue Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const result = await offlineSync.syncPendingQueue();
      if (result.success) {
        updatePendingCount();
        fetchInitialData();
      }
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReadingLogged = (reading: MagnetometerReading) => {
    // Add to active survey readings
    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id === reading.surveyId) {
          return {
            ...s,
            readings: [...s.readings, reading],
            totalReadingsCount: s.readings.length + 1,
          };
        }
        return s;
      })
    );
    updatePendingCount();
  };

  const handleApproveInversion = async (inversionId: string, notes: string) => {
    try {
      const res = await fetch(`/api/inversions/${inversionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geologistName: 'Dr. F. Ndlovu (Pr.Sci.Nat, Geologist)',
          geologistNotes: notes,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInversions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        fetchInitialData();
      }
    } catch (e) {
      console.error('Approval failed', e);
    }
  };

  const handleRegisterSample = async (sampleData: any) => {
    try {
      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
      });
      if (res.ok) {
        const newSample = await res.json();
        setSamples((prev) => [newSample, ...prev]);
        fetchInitialData();
      }
    } catch (e) {
      console.error('Failed to register sample', e);
    }
  };

  const handleAddCustodyEvent = async (sampleId: string, eventData: any) => {
    try {
      const res = await fetch(`/api/samples/${sampleId}/custody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        const updated = await res.json();
        setSamples((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        fetchInitialData();
      }
    } catch (e) {
      console.error('Failed to add custody event', e);
    }
  };

  const handleRecordAssay = async (sampleId: string, assayData: any) => {
    try {
      const res = await fetch(`/api/samples/${sampleId}/assay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assayData),
      });
      if (res.ok) {
        const updated = await res.json();
        setSamples((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        fetchInitialData();
      }
    } catch (e) {
      console.error('Failed to record assay', e);
    }
  };

  const handleCreateBooking = async (bookingData: any) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        const newBooking = await res.json();
        setBookings((prev) => [newBooking, ...prev]);
        fetchInitialData();
      }
    } catch (e) {
      console.error('Failed to create booking', e);
    }
  };

  const handleSendSms = async (phone: string, name: string, msg: string) => {
    try {
      const res = await fetch('/api/sms/send-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: phone,
          recipientName: name,
          message: msg,
        }),
      });
      if (res.ok) {
        const dispatch = await res.json();
        setSmsDispatches((prev) => [dispatch, ...prev]);
        fetchInitialData();
      }
    } catch (e) {
      console.error('Failed to send SMS', e);
    }
  };

  const handlePublishFromAi = async (output: StructuredAnomalyOutput) => {
    try {
      const res = await fetch('/api/target-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claims[0]?.id || 'claim-muto-01',
          priorityLevel: output.priorityLevel,
          plainEnglishSummary: output.plainLanguageSummaryEn,
          shonaSummary: output.plainLanguageSummarySn,
          ndebeleSummary: output.plainLanguageSummaryNd,
          evidenceFactors: {
            magneticAnomalyNt: 342.5,
            depthEstimateM: `${output.estimatedTrenchDepthM} target`,
            satelliteCorrelation: output.geologicalContext,
            accessFeasibility: 'Permit cleared',
          },
          disclosedUncertainty: output.uncertaintyDisclosures.join(' '),
          geologistName: 'Dr. F. Ndlovu (Pr.Sci.Nat, Geologist)',
        }),
      });

      if (res.ok) {
        const newCard = await res.json();
        setTargetCards((prev) => [newCard, ...prev]);
        setActiveTab('targets');
        fetchInitialData();
      }
    } catch (e) {
      console.error('Failed to publish target card', e);
    }
  };

  const activeSurvey = surveys.find((s) => s.id === activeSurveyId) || surveys[0];

  return (
    <div className="min-h-screen bg-[#071629] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        language={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSimulatedOffline={isSimulatedOffline}
        onToggleOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
      />

      {/* Main Module Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {(activeTab === 'satellite' || activeTab === 'screening') && (
          <SatelliteScreeningModule
            screeningAreas={screeningAreas}
            claims={claims}
            currentRole={currentRole}
            language={language}
            onSendPositionToMap={(lat, lng, label) => {
              setTargetHighlight({ lat, lng, label });
              setActiveTab('map');
            }}
            onSendToFieldSurvey={(claimId, lat, lng) => {
              setFieldSurveyInitialCoords({
                lat,
                lng,
                label: 'Dispatched from Sentinel-2 Multi-Spectral Screening',
              });
              setActiveTab('surveyPwa');
            }}
            onSendToAiAdvisor={(target) => {
              setPrefilledTargetForAi(target);
              setActiveTab('aiAdvisor');
            }}
          />
        )}

        {activeTab === 'map' && (
          <DesktopScreeningMap
            claims={claims}
            screeningAreas={screeningAreas}
            currentRole={currentRole}
            language={language}
            targetHighlight={targetHighlight}
            onClearTargetHighlight={() => setTargetHighlight(null)}
            onSelectClaimForSurvey={(claimId, lat, lng, label) => {
              if (lat !== undefined && lng !== undefined) {
                setFieldSurveyInitialCoords({
                  lat,
                  lng,
                  label: label || 'Dispatched from OpenStreetMap Exploration GIS',
                });
              }
              setActiveTab('surveyPwa');
            }}
            onOpenBookingForClaim={(claimId) => {
              setActiveTab('hubFleet');
            }}
            onSendToAiAdvisor={(target) => {
              setPrefilledTargetForAi(target);
              setActiveTab('aiAdvisor');
            }}
            onSendToSatelliteScreening={(lat, lng) => {
              setActiveTab('satellite');
            }}
          />
        )}

        {activeTab === 'surveyPwa' && (
          <FieldSurveyPWA
            activeSurvey={activeSurvey}
            onUpdateSurvey={(updated) => {
              setSurveys((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            }}
            isSimulatedOffline={isSimulatedOffline}
            onReadingLogged={handleReadingLogged}
            language={language}
            targetCoordinates={fieldSurveyInitialCoords}
            onClearTargetCoordinates={() => setFieldSurveyInitialCoords(null)}
          />
        )}

        {activeTab === 'inversion' && (
          <GeophysicsInversion
            survey={activeSurvey}
            inversions={inversions}
            onApproveInversion={handleApproveInversion}
            currentRole={currentRole}
            language={language}
          />
        )}

        {activeTab === 'custody' && (
          <SampleCustody
            samples={samples}
            onRegisterSample={handleRegisterSample}
            onAddCustodyEvent={handleAddCustodyEvent}
            onRecordAssay={handleRecordAssay}
            currentRole={currentRole}
            language={language}
          />
        )}

        {activeTab === 'targets' && (
          <TargetCards
            targetCards={targetCards}
            currentRole={currentRole}
            language={language}
          />
        )}

        {activeTab === 'hubFleet' && (
          <HubBooking
            equipment={equipment}
            bookings={bookings}
            claims={claims}
            onCreateBooking={handleCreateBooking}
            currentRole={currentRole}
            language={language}
          />
        )}

        {activeTab === 'auditLedger' && (
          <AuditLedger
            auditLog={auditLog}
            smsDispatches={smsDispatches}
            onSendSms={handleSendSms}
            language={language}
          />
        )}

        {activeTab === 'aiAdvisor' && (
          <AiAssistantModal
            currentRole={currentRole}
            language={language}
            onPublishAsTargetCard={handlePublishFromAi}
            prefilledTarget={prefilledTargetForAi}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#05111f] border-t border-slate-800 py-4 px-6 text-xs text-slate-400 font-mono flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>DykeSense-ZW v2.4.0 — Great Dyke Affordable Chromite Geophysics</span>
        </div>
        <div>
          <span>Design Tokens: Navy #0B2545 • Teal #1B998B • Amber #F4A259</span>
        </div>
        <div className="text-[11px] text-amber-400/90">
          Advisory Geophysics Targets Only. Ground Trenching Verification Legally Required.
        </div>
      </footer>
    </div>
  );
}
