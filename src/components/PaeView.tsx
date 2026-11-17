import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Users,
  GitFork,
  FileCheck2,
  MapPin,
  Timer,
  AlertTriangle,
  Radio,
  Printer,
  ChevronRight,
  Flame,
  Award,
  HeartPulse,
  HardHat,
  Compass,
  CheckCircle2,
  XCircle,
  ExternalLink,
  BookOpen,
  FileSpreadsheet,
  Phone,
  UserCheck,
  BellRing,
  FileText,
  Eye,
  Plus,
} from 'lucide-react';
import {
  PAE_METADATA,
  PAE_EMERGENCY_CONTACTS,
  PAE_LEADERSHIP_CONTACTS,
  PAE_BRIGADE_ROSTER,
  PAE_PROTOCOLS,
  PAE_MUSTER_POINTS,
  PAE_DRILL_HISTORY,
  PAE_REGISTRIES_TABLE,
  PAE_DRILL_DOCUMENTS,
  PAE_RASE_DOCUMENT,
  INITIAL_PAE_DRILL_SCHEDULE,
} from '../data/paeData';
import {
  DrillScheduleDocument,
  DrillScheduleItem,
  EmergencyScenarioProtocol,
  RaseReport,
} from '../types/pae';
import { formatDateBR } from '../utils/formatters';
import {
  computeDrillOccurrences,
  getCurrentYearMonth,
  getDrillMonthInfo,
} from '../utils/paeDrillReminders';
import { ContingencyPlansView } from './ContingencyPlansView';
import { PaeScenariosBySeverityView } from './PaeScenariosBySeverityView';
import { PaeDrillScheduleView } from './PaeDrillScheduleView';
import { PaeDrillPdfModal } from './PaeDrillPdfModal';
import { RaseReportModal } from './RaseReportModal';

const STORAGE_KEY_STANDALONE_RASE = 'sge_pae_standalone_rase_uisa_v1';

interface PaeViewProps {
  onOpenPdfArchive?: () => void;
  drillSchedule?: DrillScheduleItem[];
  onUpdateDrillSchedule?: React.Dispatch<React.SetStateAction<DrillScheduleItem[]>>;
  reminderLeadDays?: number;
  onChangeReminderLeadDays?: (days: number) => void;
}

export const PaeView: React.FC<PaeViewProps> = ({
  onOpenPdfArchive,
  drillSchedule: externalSchedule,
  onUpdateDrillSchedule: externalSetSchedule,
  reminderLeadDays: externalLeadDays,
  onChangeReminderLeadDays: externalSetLeadDays,
}) => {
  const [activeTab, setActiveTab] = useState<
    'cenarios_gravidade' | 'contatos' | 'contingencia' | 'lideranca' | 'organograma' | 'fluxograma' | 'protocolos' | 'pontos_encontro' | 'simulados' | 'registros'
  >('cenarios_gravidade');

  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyScenarioProtocol>(
    PAE_PROTOCOLS[0]
  );

  // Local fallback if not controlled by App.tsx
  const [internalSchedule, setInternalSchedule] = useState<DrillScheduleItem[]>(
    INITIAL_PAE_DRILL_SCHEDULE
  );
  const [internalLeadDays, setInternalLeadDays] = useState<number>(30);
  const [headerPdfModalDoc, setHeaderPdfModalDoc] = useState<DrillScheduleDocument | null>(null);
  const [isQuickRaseOpen, setIsQuickRaseOpen] = useState(false);

  const [standaloneRaseReports, setStandaloneRaseReports] = useState<RaseReport[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STANDALONE_RASE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STANDALONE_RASE, JSON.stringify(standaloneRaseReports));
    } catch {
      // ignore
    }
  }, [standaloneRaseReports]);

  const handleSaveStandaloneRase = (report: RaseReport) => {
    setStandaloneRaseReports((prev) => {
      const idx = prev.findIndex((r) => r.id === report.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = report;
        return copy;
      }
      return [report, ...prev];
    });
  };

  const drillSchedule = externalSchedule ?? internalSchedule;
  const setDrillSchedule = externalSetSchedule ?? setInternalSchedule;
  const reminderLeadDays = externalLeadDays ?? internalLeadDays;
  const setReminderLeadDays = externalSetLeadDays ?? setInternalLeadDays;

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const currentMonthInfo = useMemo(
    () => getDrillMonthInfo(currentYearMonth),
    [currentYearMonth]
  );
  const drillOccurrences = useMemo(
    () => computeDrillOccurrences(drillSchedule, reminderLeadDays),
    [drillSchedule, reminderLeadDays]
  );
  const activeDrillReminders = useMemo(
    () =>
      drillOccurrences.filter(
        (o) =>
          (o.status === 'este_mes' || o.status === 'proximo' || o.status === 'pendente') &&
          !o.execution?.reminderMuted
      ),
    [drillOccurrences]
  );
  const thisMonthDrills = useMemo(
    () => activeDrillReminders.filter((o) => o.status === 'este_mes'),
    [activeDrillReminders]
  );

  const handlePrintPae = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#007960]/20 p-5 rounded-2xl shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007960] to-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                PAE — Plano de Atendimento a Emergência
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                NR-23 & CBMMT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30">
                BRIGADA ATIVA 24H
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                REVISÃO 2026
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Diretrizes estratégicas de comando, acionamento rápido, brigada de incêndio e evacuação geral
            </p>

            {/* ALERTA DE REVISÃO ANUAL DO PDF DE REFERÊNCIA COM SINAL VERDE */}
            <div className="pt-1 flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300"></span>
                <span>SINAL VERDE: Revisão Anual do Documento SST.NP-022 Rev 09 Vigente (08/04/2026 • Próxima Revisão: 08/04/2027)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Document Link */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={PAE_METADATA.pdfAssetPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#007960] hover:bg-[#00604c] text-white text-xs font-bold shadow-xs transition-colors"
            title="Abrir documento oficial do PAE em PDF (SST.NP-022 Rev 09)"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Norma SST.NP-022 (PDF)</span>
          </a>

          {[...PAE_DRILL_DOCUMENTS, PAE_RASE_DOCUMENT].map((doc) => (
            <button
              key={doc.code}
              type="button"
              onClick={() => setHeaderPdfModalDoc(doc)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#007960] text-xs font-bold border border-[#007960]/30 transition-colors shadow-2xs"
              title={doc.title}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{doc.code} (PDF)</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsQuickRaseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors shadow-2xs"
            title="Preencher RASE (SST.RE-085) obrigatório para simulado executado"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Preencher RASE (SST.RE-085)</span>
          </button>

          <button
            onClick={handlePrintPae}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir Cartilha PAE</span>
          </button>

          {onOpenPdfArchive && (
            <button
              onClick={onOpenPdfArchive}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
              title="Armazenamento e Repositório de Relatórios e Auditorias do PAE em PDF"
            >
              <FileCheck2 className="w-4 h-4 text-[#007960]" />
              <span>Armazenamento PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Lembrete de Simulados PAE (SST.RE-105 & SST.RE-104) */}
      {activeDrillReminders.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <strong className="text-amber-950 text-sm">
                  Lembrete de Simulados PAE — {currentMonthInfo.fullLabel}
                </strong>
                <span className="font-mono text-amber-800 tabular-nums font-semibold">
                  {thisMonthDrills.length} previsto(s) este mês
                  <span aria-hidden="true"> · </span>
                  {activeDrillReminders.length} alerta(s) ativo(s)
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {thisMonthDrills.length > 0
                  ? thisMonthDrills
                      .slice(0, 3)
                      .map((d) => `${d.item.scenario} (${d.item.area} · ${d.item.docCode})`)
                      .join(' · ')
                  : `${activeDrillReminders[0].item.scenario} (${activeDrillReminders[0].item.area} · ${activeDrillReminders[0].monthInfo.shortLabel})`}
                {thisMonthDrills.length > 3 ? ` · +${thisMonthDrills.length - 3} outro(s)` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('simulados')}
              className="px-3.5 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors min-h-[40px]"
            >
              Abrir Cronograma & Lembretes
            </button>
          </div>
        </div>
      )}

      {/* PAE Sub-navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('cenarios_gravidade')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'cenarios_gravidade'
              ? 'bg-[#007960] text-white shadow-xs ring-2 ring-[#007960]/30'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-white'
          }`}
          title="Todos os cenários previstos nos planos de contingência do mais grave ao menos grave"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Cenários de Contingência (Por Gravidade)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'cenarios_gravidade' ? 'bg-white/20 text-white' : 'bg-red-50 text-[#de2726]'
            }`}
          >
            Mais Grave ao Menos Grave
          </span>
        </button>

        <button
          onClick={() => setActiveTab('contatos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'contatos'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Telefones Úteis Oficiais</span>
        </button>

        <button
          onClick={() => setActiveTab('contingencia')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'contingencia'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Planos de Contingência (3 Áreas)</span>
        </button>

        <button
          onClick={() => setActiveTab('lideranca')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'lideranca'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Liderança da Empresa ({PAE_LEADERSHIP_CONTACTS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('organograma')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'organograma'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Brigada & Organograma ({PAE_BRIGADE_ROSTER.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fluxograma')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'fluxograma'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Fluxograma & Níveis de Emergência</span>
        </button>

        <button
          onClick={() => setActiveTab('protocolos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'protocolos'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Protocolos por Cenário</span>
        </button>

        <button
          onClick={() => setActiveTab('pontos_encontro')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'pontos_encontro'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Pontos de Encontro (PEE)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulados')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'simulados'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Simulados & Cronograma</span>
          {activeDrillReminders.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums ${
                activeTab === 'simulados'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeDrillReminders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('registros')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'registros'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tabela 8: Registros & Anexos</span>
        </button>
      </div>

      {/* 0. Cenários de Contingência Destacados por Gravidade (Do Mais Grave ao Menos Grave) */}
      {activeTab === 'cenarios_gravidade' && (
        <PaeScenariosBySeverityView
          onSelectPlan={(planId) => {
            setActiveTab('contingencia');
          }}
        />
      )}

      {/* 1. Contatos de Emergência */}
      {activeTab === 'contatos' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-600 text-white font-bold animate-pulse">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-950 text-sm">
                  Canal de Emergência Imediato: Rádio VHF CANAL 01 (154.570 MHz)
                </h3>
                <p className="text-xs text-red-800">
                  Acione imediatamente em caso de princípio de incêndio, vazamento grave ou acidente com vítimas.
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-red-700 block font-semibold">Ramal de Emergência</span>
              <span className="text-2xl font-black text-red-700 tracking-widest">3737</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAE_EMERGENCY_CONTACTS.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  contact.isUrgentDirect
                    ? 'bg-white border-red-200 shadow-xs'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                        {contact.area}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{contact.role}</h4>
                      <p className="text-xs text-slate-600 font-medium">{contact.name}</p>
                    </div>
                    {contact.isUrgentDirect && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase">
                        Direto 24h
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs bg-[#f8faf9] p-2.5 rounded-lg border border-slate-200 font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Rádio VHF:</span>
                      <span className="font-mono text-[#007960] font-bold">{contact.radioChannel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Ramal Interno:</span>
                      <span className="font-mono text-slate-900 font-bold">{contact.internalExtension}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Telefone / Celular:</span>
                      <span className="font-mono text-[#007960] font-bold">{contact.externalPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planos de Contingência Setoriais (Indústria, Empacotamento, ADM/Agrícola) */}
      {activeTab === 'contingencia' && <ContingencyPlansView />}

      {/* 2. Lista Oficial de Liderança da Empresa (SST.NP-022 Item 5.2) */}
      {activeTab === 'lideranca' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#007960]" />
                  <span>Lista Oficial de Contatos da Liderança da Empresa</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Em conformidade com a Norma SST.NP-022 (Item 5.2). Acionamento obrigatório em emergências de Nível 2 e 3.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                Cadeia de Notificação
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PAE_LEADERSHIP_CONTACTS.map((leader) => (
                <div
                  key={leader.id}
                  className="bg-white border border-slate-200 hover:border-[#007960]/40 p-4 rounded-xl transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{leader.name}</h4>
                        <p className="text-xs text-[#007960] font-bold">{leader.role}</p>
                      </div>
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007960] border border-[#007960]/30">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs bg-[#f8faf9] p-2.5 rounded-lg border border-slate-200 mt-3 font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Celular Direto:</span>
                        <a
                          href={`tel:${leader.mobile.replace(/\D/g, '')}`}
                          className="text-slate-900 hover:text-[#007960] font-bold transition-colors"
                        >
                          {leader.mobile}
                        </a>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Telefone / Ramal:</span>
                        <span className="text-slate-800 font-semibold">{leader.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Organograma da Brigada */}
      {activeTab === 'organograma' && (
        <div className="space-y-4 font-sans">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#007960]" />
                <span>Estrutura de Comando da Brigada de Incêndio UISA</span>
              </h3>
              <p className="text-xs text-slate-600">
                Equipe treinada e capacitada em conformidade com a Norma Regulamentadora NR-23, NBR 14276 e Instrução Técnica CBMMT
              </p>
            </div>

            {/* Normative Notes (Notas 1, 2 e 3 do Item 5.1 SST.NP-022) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-red-50/70 border border-red-200 p-3 rounded-xl text-xs">
                <span className="font-bold text-[#de2726] block mb-1">Nota 1 — Operador da Destilaria</span>
                <p className="text-slate-700">
                  Deverá haver pelo menos 01 brigadista exclusivo na área de Destilaria por turno com atribuição prioritária de fechamento imediato das válvulas dos tanques e linhas de etanol.
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs">
                <span className="font-bold text-amber-800 block mb-1">Nota 2 — Eletricista de Turno</span>
                <p className="text-slate-700">
                  Em qualquer chamado de emergência, o eletricista brigadista de plantão deve proceder com a desenergização do setor atingido antes do início das operações com água.
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-[#007960]/30 p-3 rounded-xl text-xs">
                <span className="font-bold text-[#007960] block mb-1">Nota 3 — Operador de Bombas</span>
                <p className="text-slate-700">
                  O operador designado da Casa de Bombas deve checar de imediato a partida automática da motobomba diesel e manter os 7.0 a 8.5 kgf/cm² na rede geral de combate a incêndio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PAE_BRIGADE_ROSTER.map((member) => (
                <div
                  key={member.id}
                  className="bg-[#f8faf9] border border-slate-200 p-3.5 rounded-xl space-y-2 hover:border-[#007960]/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        member.role === 'comandante'
                          ? 'bg-red-50 text-[#de2726] border border-red-200'
                          : member.role === 'subcomandante'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : member.role === 'socorrista'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : member.role === 'lider_setor'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {member.role.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 capitalize">
                      {member.shift.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{member.name}</h4>
                    <span className="text-[11px] text-[#007960] font-mono block font-semibold">
                      {member.radioCallsign}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>Setor / Unidade:</span>
                      <span className="text-slate-900 font-medium capitalize">{(member.sector || (member as any).unit || '').replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Certificação:</span>
                      <span className="text-[#007960] font-mono font-semibold">
                        {formatDateBR(member.trainingCertificationDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contato:</span>
                      <span className="text-slate-800 font-mono font-medium">{member.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Fluxograma de Acionamento */}
      {activeTab === 'fluxograma' && (
        <div className="space-y-4 font-sans">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#007960]" />
              <span>Níveis de Emergência & Fluxo Operacional de Resposta</span>
            </h3>

            {/* 3 Níveis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    NÍVEL 1
                  </span>
                  <span className="text-xs text-blue-700 font-bold">EMERGÊNCIA LOCAL</span>
                </div>
                <p className="text-xs text-slate-700">
                  Princípio de fogo restrito ou vazamento controlado que pode ser combatido pela equipe local ou brigadistas do setor com extintores portáteis.
                </p>
                <div className="text-[11px] text-slate-600 pt-2 border-t border-blue-200/60">
                  <span className="text-blue-800 font-semibold block">Ação:</span>
                  Combate inicial com extintor; notificação verbal ao supervisor de turno.
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    NÍVEL 2
                  </span>
                  <span className="text-xs text-amber-800 font-bold">EMERGÊNCIA SETORIAL</span>
                </div>
                <p className="text-xs text-slate-700">
                  Ocorrência de médio porte que ultrapassa a capacidade inicial e requer acionamento geral da Brigada de Incêndio, pressurização de hidrantes ou ambulatório.
                </p>
                <div className="text-[11px] text-slate-600 pt-2 border-t border-amber-200/60">
                  <span className="text-amber-800 font-semibold block">Ação:</span>
                  Sirene setorial, evacuação parcial e armação de linhas de hidrante.
                </div>
              </div>

              <div className="bg-red-50/60 border border-red-300 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#de2726] text-white">
                    NÍVEL 3
                  </span>
                  <span className="text-xs text-[#de2726] font-bold">EMERGÊNCIA GERAL</span>
                </div>
                <p className="text-xs text-slate-700">
                  Sinistro de grande porte (tanques de etanol, caldeiras, grande queima de canavial) com risco à vida, paralisação fabril e necessidade de apoio externo.
                </p>
                <div className="text-[11px] text-slate-600 pt-2 border-t border-red-200">
                  <span className="text-[#de2726] font-semibold block">Ação:</span>
                  Evacuação total da planta para os PEEs e acionamento imediato do Corpo de Bombeiros Militar (193).
                </div>
              </div>
            </div>

            {/* Passo a Passo do Fluxograma */}
            <div className="border border-slate-200 rounded-xl p-4 bg-[#f8faf9] space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Sequência de Decisão & Acionamento (ICS / SCI)
              </h4>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-[#de2726] font-bold block">PASSO 1: DETECÇÃO</span>
                  <p className="text-slate-700 mt-1 font-medium">
                    Colaborador identifica o evento e aciona o Rádio Canal 01 ou Botoeira de Alarme.
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 hidden sm:block shrink-0" />

                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-amber-700 font-bold block">PASSO 2: CAE & TRIAGEM</span>
                  <p className="text-slate-700 mt-1 font-medium">
                    CAE dispara alerta para Comandante da Brigada e ativa monitoramento das bombas.
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 hidden sm:block shrink-0" />

                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-blue-700 font-bold block">PASSO 3: COMBATE & EVACUAÇÃO</span>
                  <p className="text-slate-700 mt-1 font-medium">
                    Brigadistas assumem posições táticas; líderes conduzem colaboradores aos PEEs.
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 hidden sm:block shrink-0" />

                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-[#007960] font-bold block">PASSO 4: RESCALDO</span>
                  <p className="text-slate-700 mt-1 font-medium">
                    Extinção confirmada, contagem nominal final (headcount) e emissão de laudo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Protocolos por Cenário */}
      {activeTab === 'protocolos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Selecione o Protocolo Operacional:
            </h3>
            {PAE_PROTOCOLS.map((proto) => (
              <div
                key={proto.id}
                onClick={() => setSelectedProtocol(proto)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all shadow-2xs ${
                  selectedProtocol.id === proto.id
                    ? 'bg-emerald-50/80 border-[#007960] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#007960] font-bold">{proto.code}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-red-50 text-[#de2726] border border-red-200">
                    {proto.riskRating}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">{proto.title}</h4>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#007960] block mb-1">
                  {selectedProtocol.code} • PROTOCOLO CRÍTICO DE AÇÃO
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedProtocol.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono block">Isolamento Mínimo</span>
                <span className="font-mono text-sm font-bold text-[#de2726] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {selectedProtocol.isolationPerimeterMeters} Metros
                </span>
              </div>
            </div>

            {/* Ações Imediatas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#007960] uppercase tracking-wider">
                Ações Imediatas (Primeiros 5 Minutos):
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {selectedProtocol.immediateActions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 bg-[#f8faf9] p-2 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#007960] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tática da Brigada & EPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#f8faf9] p-3 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-mono text-[#007960] uppercase font-bold block">
                  Tática da Brigada de Incêndio
                </span>
                <p className="text-xs text-slate-700">{selectedProtocol.tacticalNotes}</p>
              </div>

              <div className="bg-[#f8faf9] p-3 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-mono text-cyan-800 uppercase font-bold block">
                  EPIs & Equipamentos Obrigatórios
                </span>
                <ul className="text-xs text-slate-700 space-y-1">
                  {selectedProtocol.requiredPPE.map((ppe, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007960]" />
                      <span>{ppe}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Pontos de Encontro (PEE) */}
      {activeTab === 'pontos_encontro' && (
        <div className="space-y-4 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAE_MUSTER_POINTS.map((pee) => (
              <div
                key={pee.id}
                className="bg-white border border-slate-200 p-5 rounded-xl shadow-2xs space-y-3 hover:border-[#007960]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                    {pee.code}
                  </span>
                  <span className="text-xs text-slate-600 font-mono">
                    Capacidade: <strong className="text-slate-900">{pee.capacityPeople} pessoas</strong>
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{pee.name}</h4>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#007960] shrink-0" />
                    <span>{pee.location}</span>
                  </p>
                </div>

                <div className="bg-[#f8faf9] p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="text-slate-600">
                    <span>Setores Atendidos: </span>
                    <span className="text-slate-900 font-semibold">{pee.associatedSectors.join(', ')}</span>
                  </div>
                  <div className="text-slate-600">
                    <span>Líder Responsável: </span>
                    <span className="text-amber-800 font-semibold">{pee.leaderResponsible}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span className={pee.equippedWithFirstAidKit ? 'text-[#007960] font-semibold' : 'text-slate-400'}>
                      {pee.equippedWithFirstAidKit ? '✓ Kit Primeiros Socorros' : '✗ Sem Kit'}
                    </span>
                    <span className={pee.equippedWithMegaphone ? 'text-[#007960] font-semibold' : 'text-slate-400'}>
                      {pee.equippedWithMegaphone ? '✓ Megafone Presente' : '✗ Sem Megafone'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">{pee.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Simulados, Cronogramas Oficiais (SST.RE-105 / SST.RE-104) & Lembretes */}
      {activeTab === 'simulados' && (
        <div className="space-y-6 font-sans">
          <PaeDrillScheduleView
            schedule={drillSchedule}
            onUpdateSchedule={setDrillSchedule}
            reminderLeadDays={reminderLeadDays}
            onChangeReminderLeadDays={setReminderLeadDays}
            standaloneRaseReports={standaloneRaseReports}
            onSaveStandaloneRase={handleSaveStandaloneRase}
          />

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#007960]" />
                  <span>Histórico de Simulados Práticos de Emergência e Evacuação</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Conformidade anual obrigatória com avaliação de tempos de resposta e planos de melhoria
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {PAE_DRILL_HISTORY.map((drill) => (
                <div
                  key={drill.id}
                  className="bg-[#f8faf9] border border-slate-200 p-4 rounded-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#007960] font-bold block">
                        {formatDateBR(drill.date)} • {drill.sector}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{drill.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-white px-3 py-1 rounded border border-slate-200 text-center shadow-2xs">
                        <span className="text-[10px] text-slate-500 block">Tempo Resposta</span>
                        <span className="font-mono font-bold text-amber-700 text-xs">
                          {drill.actualResponseTimeMinutes} min (meta: {drill.targetResponseTimeMinutes}m)
                        </span>
                      </div>
                      <div className="bg-white px-3 py-1 rounded border border-[#007960]/30 text-center shadow-2xs">
                        <span className="text-[10px] text-slate-500 block">Nota Geral</span>
                        <span className="font-mono font-bold text-[#007960] text-sm">
                          {drill.ratingScore.toFixed(1)} / 10
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700">{drill.scenario}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                      <span className="font-bold text-amber-800 block mb-1">Gaps Identificados:</span>
                      <ul className="space-y-1 text-slate-700">
                        {drill.identifiedGaps.map((gap, i) => (
                          <li key={i}>• {gap}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-[#007960]/20">
                      <span className="font-bold text-[#007960] block mb-1">Ações Corretivas:</span>
                      <ul className="space-y-1 text-slate-700">
                        {drill.actionPlans.map((act, i) => (
                          <li key={i}>• {act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 pt-1 flex justify-between">
                    <span>Efetivo Total Evacuado: <strong className="text-slate-900">{drill.evacuatedHeadcount} pessoas</strong></span>
                    <span>Líderes do Simulado: <strong className="text-slate-900">{drill.brigadeLeader}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Tabela 8: Registros & Anexos Oficiais (SST.NP-022) */}
      {activeTab === 'registros' && (
        <div className="space-y-4 font-sans">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#007960]" />
                  <span>Tabela 8 — Registros, Formulários & Anexos do PAE</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Documentação oficial corporativa regida pela Norma de Procedimento SST.NP-022 Rev 09 (08/04/2026)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30">
                  {PAE_REGISTRIES_TABLE.length} Registros Auditáveis
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600 bg-[#f8faf9]">
                    <th className="py-3 px-3">Código / Formulário</th>
                    <th className="py-3 px-3">Equipamento / Registro</th>
                    <th className="py-3 px-3">Tipo de Inspeção</th>
                    <th className="py-3 px-3">Periodicidade</th>
                    <th className="py-3 px-3">Classificação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PAE_REGISTRIES_TABLE.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-red-50 text-[#de2726] border border-red-200">
                          {reg.formCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {reg.equipmentOrRecord}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {reg.inspectionType}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {reg.periodicity}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              reg.documentType === 'anexo'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : reg.documentType === 'laudo'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-[#007960] border border-[#007960]/30'
                            }`}
                          >
                            {reg.documentType}
                          </span>
                          {reg.assetPath && (
                            <button
                              type="button"
                              onClick={() => {
                                const found = [...PAE_DRILL_DOCUMENTS, PAE_RASE_DOCUMENT].find(
                                  (d) => d.code === reg.formCode
                                );
                                if (found) setHeaderPdfModalDoc(found);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#007960] hover:bg-[#005a47] text-white text-[10px] font-sans font-semibold transition-colors"
                              title={`Visualizar ${reg.formCode} em PDF`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#f8faf9] border border-slate-200 p-3.5 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Auditoria e controle de conformidade integrada: <strong>uisa</strong> Agroindustrial</span>
              <a
                href={PAE_METADATA.pdfAssetPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#007960] hover:underline font-semibold"
              >
                <span>Acessar PDF original da Norma SST.NP-022</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Obrigatório RASE SST.RE-085 via Cabeçalho PAE */}
      <RaseReportModal
        isOpen={isQuickRaseOpen}
        onClose={() => setIsQuickRaseOpen(false)}
        onSave={(report) => {
          handleSaveStandaloneRase(report);
          setIsQuickRaseOpen(false);
          setActiveTab('simulados');
        }}
        onViewBlankPdf={() => setHeaderPdfModalDoc(PAE_RASE_DOCUMENT)}
      />

      {/* Modal PDF Viewer para Cronogramas SST.RE-105, SST.RE-104 e RASE SST.RE-085 */}
      <PaeDrillPdfModal
        isOpen={Boolean(headerPdfModalDoc)}
        document={headerPdfModalDoc}
        onSelectDocument={setHeaderPdfModalDoc}
        onClose={() => setHeaderPdfModalDoc(null)}
      />
    </div>
  );
};

