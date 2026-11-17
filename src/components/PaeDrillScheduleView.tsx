import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Timer,
  X,
} from 'lucide-react';
import {
  DRILL_FISCAL_MONTHS,
  PAE_DRILL_DOCUMENTS,
  PAE_RASE_DOCUMENT,
} from '../data/paeData';
import {
  DrillMonthExecution,
  DrillScheduleDocCode,
  DrillScheduleDocument,
  DrillScheduleItem,
  RaseReport,
} from '../types/pae';
import {
  buildDrillReminderText,
  computeDrillOccurrences,
  DrillOccurrence,
  DrillOccurrenceStatus,
  getCurrentYearMonth,
  getDrillMonthInfo,
} from '../utils/paeDrillReminders';
import { playIndustrialSound } from '../utils/audioAlerts';
import {
  dispatchDesktopNotification,
  requestDesktopNotificationPermission,
} from '../utils/notificationService';
import { PaeDrillPdfModal } from './PaeDrillPdfModal';
import { RaseReportModal } from './RaseReportModal';

interface PaeDrillScheduleViewProps {
  schedule: DrillScheduleItem[];
  onUpdateSchedule: React.Dispatch<React.SetStateAction<DrillScheduleItem[]>>;
  reminderLeadDays: number;
  onChangeReminderLeadDays: (days: number) => void;
  standaloneRaseReports?: RaseReport[];
  onSaveStandaloneRase?: (report: RaseReport) => void;
}

export const PaeDrillScheduleView: React.FC<PaeDrillScheduleViewProps> = ({
  schedule,
  onUpdateSchedule,
  reminderLeadDays,
  onChangeReminderLeadDays,
  standaloneRaseReports = [],
  onSaveStandaloneRase,
}) => {
  const [docFilter, setDocFilter] = useState<'todos' | DrillScheduleDocCode>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'alertas' | DrillOccurrenceStatus>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  // Embedded PDF viewer state
  const [pdfModalDoc, setPdfModalDoc] = useState<DrillScheduleDocument | null>(null);

  // Mandatory RASE completion modal state (for scheduled occurrences or standalone)
  const [completingOcc, setCompletingOcc] = useState<DrillOccurrence | null>(null);
  const [editingStandaloneRase, setEditingStandaloneRase] = useState<RaseReport | null>(null);
  const [isNewStandaloneRaseOpen, setIsNewStandaloneRaseOpen] = useState(false);

  // Inline scheduling state
  const [editingScheduleKey, setEditingScheduleKey] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('09:00');

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const currentMonthInfo = useMemo(() => getDrillMonthInfo(currentYearMonth), [currentYearMonth]);

  const occurrences = useMemo(
    () => computeDrillOccurrences(schedule, reminderLeadDays),
    [schedule, reminderLeadDays]
  );

  // Active reminder lists
  const thisMonthReminders = useMemo(
    () => occurrences.filter((o) => o.status === 'este_mes' && !o.execution?.reminderMuted),
    [occurrences]
  );
  const overdueReminders = useMemo(
    () => occurrences.filter((o) => o.status === 'pendente' && !o.execution?.reminderMuted),
    [occurrences]
  );
  const upcomingReminders = useMemo(
    () => occurrences.filter((o) => o.status === 'proximo' && !o.execution?.reminderMuted),
    [occurrences]
  );
  const completedCount = useMemo(
    () => occurrences.filter((o) => o.status === 'realizado').length,
    [occurrences]
  );

  // Filtered reminders in reminder panel
  const reminderTabItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return occurrences.filter((occ) => {
      if (docFilter !== 'todos' && occ.item.docCode !== docFilter) return false;
      if (
        q &&
        !occ.item.scenario.toLowerCase().includes(q) &&
        !occ.item.area.toLowerCase().includes(q) &&
        !occ.monthInfo.fullLabel.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter === 'alertas') {
        return (
          (occ.status === 'este_mes' || occ.status === 'proximo' || occ.status === 'pendente') &&
          !occ.execution?.reminderMuted
        );
      }
      if (statusFilter !== 'todos') {
        return occ.status === statusFilter;
      }
      return occ.status === 'este_mes' || occ.status === 'proximo' || occ.status === 'pendente';
    });
  }, [occurrences, docFilter, searchQuery, statusFilter]);

  // Filtered matrix items
  const filteredMatrixItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return schedule.filter((item) => {
      if (docFilter !== 'todos' && item.docCode !== docFilter) return false;
      if (
        q &&
        !item.scenario.toLowerCase().includes(q) &&
        !item.area.toLowerCase().includes(q) &&
        !item.responsible.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter === 'todos') return true;
      const itemOccurrences = occurrences.filter((o) => o.item.id === item.id);
      if (statusFilter === 'alertas') {
        return itemOccurrences.some(
          (o) => o.status === 'este_mes' || o.status === 'proximo' || o.status === 'pendente'
        );
      }
      return itemOccurrences.some((o) => o.status === statusFilter);
    });
  }, [schedule, occurrences, docFilter, searchQuery, statusFilter]);

  const updateMonthExecution = (
    itemId: string,
    monthKey: string,
    patch: Partial<DrillMonthExecution>
  ) => {
    onUpdateSchedule((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentExec = item.executions?.[monthKey] || { completed: false };
        return {
          ...item,
          executions: {
            ...(item.executions || {}),
            [monthKey]: {
              ...currentExec,
              ...patch,
            },
          },
        };
      })
    );
  };

  const openCompleteModal = (occ: DrillOccurrence) => {
    setCompletingOcc(occ);
  };

  const handleSaveOccurrenceRase = (report: RaseReport) => {
    if (!completingOcc) return;
    updateMonthExecution(completingOcc.item.id, completingOcc.monthKey, {
      completed: true,
      completedDate: report.date,
      participantsCount: report.participantsCount,
      responseTimeMinutes: report.responseTimeMinutes,
      notes: report.criticalEffectivenessAnalysis,
      raseReport: report,
    });
    playIndustrialSound('success');
    setCompletingOcc(null);
  };

  const handleRevertComplete = (itemId: string, monthKey: string) => {
    updateMonthExecution(itemId, monthKey, {
      completed: false,
      completedDate: undefined,
    });
    playIndustrialSound('ping');
  };

  const allCompletedRaseReports = useMemo(() => {
    const fromSchedule: { report: RaseReport; sourceLabel: string; occ?: DrillOccurrence }[] = [];
    occurrences.forEach((o) => {
      if (o.execution?.completed && o.execution.raseReport) {
        fromSchedule.push({
          report: o.execution.raseReport,
          sourceLabel: `${o.item.docCode} · ${o.monthInfo.shortLabel}`,
          occ: o,
        });
      }
    });
    const standaloneWrapped = standaloneRaseReports.map((r) => ({
      report: r,
      sourceLabel: 'Registro Avulso SST.RE-085',
      occ: undefined,
    }));
    return [...standaloneWrapped, ...fromSchedule].sort((a, b) =>
      b.report.date.localeCompare(a.report.date)
    );
  }, [occurrences, standaloneRaseReports]);

  const handleStartScheduleDate = (occ: DrillOccurrence) => {
    setEditingScheduleKey(occ.occurrenceKey);
    setSchedDate(occ.execution?.plannedDate || `${occ.monthKey}-20`);
    setSchedTime(occ.execution?.plannedTime || '09:00');
  };

  const handleSaveScheduleDate = (occ: DrillOccurrence) => {
    if (!schedDate) return;
    updateMonthExecution(occ.item.id, occ.monthKey, {
      plannedDate: schedDate,
      plannedTime: schedTime || '09:00',
    });
    setEditingScheduleKey(null);
    playIndustrialSound('success');
  };

  const handleCopyReminder = async (occ: DrillOccurrence) => {
    const text = buildDrillReminderText(occ);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(occ.occurrenceKey);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Fallback
    }
  };

  const handleTriggerBrowserReminders = async () => {
    playIndustrialSound('warning');
    const activeList = [...thisMonthReminders, ...upcomingReminders];
    const granted = await requestDesktopNotificationPermission();

    if (activeList.length === 0) {
      setPushFeedback('Nenhum simulado pendente para alertar neste momento.');
      setTimeout(() => setPushFeedback(null), 3500);
      return;
    }

    const summaryBody = activeList
      .slice(0, 3)
      .map((o) => `• ${o.item.scenario} (${o.item.area} — ${o.monthInfo.shortLabel})`)
      .join('\n');

    if (granted || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) {
      dispatchDesktopNotification(
        `Lembrete de Simulados PAE UISA (${activeList.length} previsto${activeList.length > 1 ? 's' : ''})`,
        summaryBody,
        'pae-drill-reminder'
      );
      setPushFeedback(`Notificação enviada para ${activeList.length} simulado(s) previstos.`);
    } else {
      setPushFeedback(
        `Alerta sonoro disparado (${activeList.length} simulado(s) em ${currentMonthInfo.shortLabel} e próximos ${reminderLeadDays} dias). Ative notificações no navegador para avisos em segundo plano.`
      );
    }
    setTimeout(() => setPushFeedback(null), 4500);
  };

  const renderStatusLabel = (status: DrillOccurrenceStatus, muted?: boolean) => {
    if (muted) {
      return <span className="text-slate-500 font-semibold">Silenciado</span>;
    }
    switch (status) {
      case 'realizado':
        return <span className="text-[#007960] font-bold">Realizado</span>;
      case 'este_mes':
        return <span className="text-amber-700 font-bold">Previsto este mês</span>;
      case 'pendente':
        return <span className="text-[#de2726] font-bold">Pendente / Atrasado</span>;
      case 'proximo':
        return <span className="text-blue-700 font-bold">Próximo ({reminderLeadDays}d)</span>;
      default:
        return <span className="text-slate-600 font-semibold">Programado</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Arquivos Oficiais Anexados (SST.RE-105 & SST.RE-104) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#007960]" />
              <span>Documentos Oficiais de Cronograma de Simulados (Safra 2026/2027)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Planilhas oficiais integradas ao PAE com rastreamento de Previsto × Realizado e lembretes automáticos.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 tabular-nums shrink-0">
            {completedCount} de {occurrences.length} execuções concluídas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {PAE_DRILL_DOCUMENTS.map((doc) => {
            const docCount = schedule.filter((s) => s.docCode === doc.code).length;
            const docMonthAlerts = occurrences.filter(
              (o) =>
                o.item.docCode === doc.code &&
                (o.status === 'este_mes' || o.status === 'pendente') &&
                !o.execution?.reminderMuted
            ).length;

            return (
              <div
                key={doc.code}
                className="border border-slate-200 rounded-xl p-4 bg-[#f8faf9] flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                    <span>
                      <strong className="text-[#007960]">{doc.code}</strong>
                      <span aria-hidden="true"> · </span>
                      <span>Rev. {doc.revision}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{doc.date}</span>
                    </span>
                    <span className="tabular-nums text-slate-700 font-semibold">
                      {docCount} cenários
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>

                  <p className="text-xs text-slate-600">
                    {doc.subtitle} · Pág. {doc.pages}
                    {docMonthAlerts > 0 && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="text-amber-700 font-semibold tabular-nums">
                          {docMonthAlerts} lembrete(s) ativo(s)
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPdfModalDoc(doc)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-semibold transition-colors min-h-[40px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar PDF</span>
                  </button>

                  <a
                    href={doc.pdfAssetPath}
                    download={`${doc.code}_Cronograma_Simulados.pdf`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors min-h-[40px]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#007960]" />
                    <span>Baixar</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setDocFilter(doc.code)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 text-[#007960] border border-[#007960]/30 text-xs font-semibold transition-colors min-h-[40px]"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filtrar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* 3rd Card: Formulário Obrigatório RASE (SST.RE-085) */}
          <div className="border border-[#007960]/30 rounded-xl p-4 bg-emerald-50/50 flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                <span>
                  <strong className="text-[#007960]">{PAE_RASE_DOCUMENT.code}</strong>
                  <span aria-hidden="true"> · </span>
                  <span>Rev. {PAE_RASE_DOCUMENT.revision}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{PAE_RASE_DOCUMENT.date}</span>
                </span>
                <span className="tabular-nums text-[#007960] font-bold">
                  {allCompletedRaseReports.length} emitido(s)
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">{PAE_RASE_DOCUMENT.title}</h4>

              <p className="text-xs text-slate-600">
                Preenchimento <strong>obrigatório</strong> para todo simulado executado · Pág. {PAE_RASE_DOCUMENT.pages}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsNewStandaloneRaseOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-semibold transition-colors min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Preencher RASE</span>
              </button>

              <button
                type="button"
                onClick={() => setPdfModalDoc(PAE_RASE_DOCUMENT)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors min-h-[40px]"
              >
                <Eye className="w-3.5 h-3.5 text-[#007960]" />
                <span>Ver Anexo</span>
              </button>

              <a
                href={PAE_RASE_DOCUMENT.pdfAssetPath}
                download="SST.RE-085_RASE_Relatorio_Analise_Emergencia.pdf"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors min-h-[40px]"
              >
                <Download className="w-3.5 h-3.5 text-[#007960]" />
                <span>Baixar</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Central de Lembretes de Simulados */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#007960]" />
              <span>Central de Lembretes de Simulados ({currentMonthInfo.fullLabel})</span>
            </h3>
            <p className="text-xs text-slate-600 tabular-nums">
              <strong className="text-amber-700">{thisMonthReminders.length}</strong> previstos neste mês
              <span aria-hidden="true"> · </span>
              <strong className="text-[#de2726]">{overdueReminders.length}</strong> pendentes de meses anteriores
              <span aria-hidden="true"> · </span>
              <strong className="text-blue-700">{upcomingReminders.length}</strong> próximos ({reminderLeadDays} dias)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 bg-[#f8faf9] border border-slate-200 rounded-lg px-3 py-1.5 min-h-[40px]">
              <Clock className="w-3.5 h-3.5 text-[#007960]" />
              <span className="whitespace-nowrap">Antecedência:</span>
              <select
                value={reminderLeadDays}
                onChange={(e) => onChangeReminderLeadDays(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
                <option value={45}>45 dias</option>
                <option value={60}>60 dias</option>
              </select>
            </label>

            <button
              type="button"
              onClick={handleTriggerBrowserReminders}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-semibold transition-colors min-h-[40px]"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Disparar Lembrete</span>
            </button>
          </div>
        </div>

        {pushFeedback && (
          <div className="bg-emerald-50 border border-[#007960]/30 text-[#007960] text-xs font-medium px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2">
            <span>{pushFeedback}</span>
            <button
              type="button"
              onClick={() => setPushFeedback(null)}
              className="p-1 hover:bg-emerald-100 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setDocFilter('todos')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                docFilter === 'todos' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({schedule.length})
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('SST.RE-105')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                docFilter === 'SST.RE-105' ? 'bg-white text-[#007960] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SST.RE-105 · Indústria/Empac. (13)
            </button>
            <button
              type="button"
              onClick={() => setDocFilter('SST.RE-104')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                docFilter === 'SST.RE-104' ? 'bg-white text-[#007960] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SST.RE-104 · GMA/Posto/ADM/Agríc. (11)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
              {(
                [
                  { id: 'todos', label: 'Alertas Ativos' },
                  { id: 'este_mes', label: currentMonthInfo.shortLabel },
                  { id: 'proximo', label: 'Próximos' },
                  { id: 'pendente', label: 'Pendentes' },
                  { id: 'realizado', label: 'Realizados' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[34px] ${
                    statusFilter === st.id
                      ? 'bg-white text-[#007960] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cenário ou área..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007960] min-h-[38px]"
              />
            </div>
          </div>
        </div>

        {/* Active Reminder Cards */}
        <div className="space-y-2.5">
          {reminderTabItems.length === 0 ? (
            <div className="p-6 text-center bg-[#f8faf9] border border-slate-200 rounded-xl text-xs text-slate-600">
              <CheckCircle2 className="w-7 h-7 text-[#007960] mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Nenhum lembrete encontrado para este filtro.</p>
              <p className="mt-0.5 text-slate-500">
                Consulte a matriz completa abaixo para visualizar todo o cronograma 2026/2027.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reminderTabItems.map((occ) => {
                const isEditingDate = editingScheduleKey === occ.occurrenceKey;
                const isCompleted = occ.status === 'realizado';
                const isMuted = Boolean(occ.execution?.reminderMuted);

                return (
                  <div
                    key={occ.occurrenceKey}
                    className={`border rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-50/40 border-[#007960]/30'
                        : occ.status === 'este_mes'
                        ? 'bg-amber-50/40 border-amber-300'
                        : occ.status === 'pendente'
                        ? 'bg-red-50/40 border-red-200'
                        : 'bg-[#f8faf9] border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-mono text-slate-600">
                          <strong className="text-slate-900">{occ.item.docCode}</strong>
                          <span aria-hidden="true"> · </span>
                          <span>{occ.monthInfo.fullLabel}</span>
                        </span>
                        <span className="text-[11px] tabular-nums">
                          {renderStatusLabel(occ.status, isMuted)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {occ.item.scenario}
                      </h4>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Área: <strong className="text-slate-800">{occ.item.area}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>{occ.item.responsible}</span>
                      </div>

                      {occ.execution?.plannedDate && !isCompleted && (
                        <p className="text-xs text-[#007960] font-mono font-semibold tabular-nums pt-0.5">
                          Data marcada: {occ.execution.plannedDate.split('-').reverse().join('/')}
                          {occ.execution.plannedTime ? ` às ${occ.execution.plannedTime}` : ''}
                          {' '}({occ.daysUntilTarget === 0 ? 'Hoje' : occ.daysUntilTarget > 0 ? `em ${occ.daysUntilTarget}d` : `${Math.abs(occ.daysUntilTarget)}d em atraso`})
                        </p>
                      )}

                      {isCompleted && occ.execution?.completedDate && (
                        <p className="text-xs text-[#007960] font-mono font-semibold tabular-nums pt-0.5">
                          Executado em {occ.execution.completedDate.split('-').reverse().join('/')}
                          {occ.execution.participantsCount ? ` · ${occ.execution.participantsCount} participantes` : ''}
                          {occ.execution.responseTimeMinutes ? ` · ${occ.execution.responseTimeMinutes} min` : ''}
                        </p>
                      )}
                    </div>

                    {isEditingDate ? (
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={schedDate}
                            onChange={(e) => setSchedDate(e.target.value)}
                            className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white text-slate-900 min-h-[38px]"
                          />
                          <input
                            type="time"
                            value={schedTime}
                            onChange={(e) => setSchedTime(e.target.value)}
                            className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white text-slate-900 min-h-[38px]"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingScheduleKey(null)}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 min-h-[36px]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveScheduleDate(occ)}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#007960] text-white hover:bg-[#005a47] min-h-[36px]"
                          >
                            Salvar Data
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/70">
                        {!isCompleted ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openCompleteModal(occ)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-semibold transition-colors min-h-[40px]"
                              title="Preencher RASE SST.RE-085 obrigatório para concluir simulado"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Concluir & Preencher RASE</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartScheduleDate(occ)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors min-h-[40px]"
                            >
                              <Calendar className="w-3.5 h-3.5 text-[#007960]" />
                              <span>{occ.execution?.plannedDate ? 'Alterar Data' : 'Agendar Dia'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyReminder(occ)}
                              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors min-h-[40px]"
                              title="Copiar convocação para WhatsApp ou E-mail"
                            >
                              {copiedId === occ.occurrenceKey ? (
                                <Check className="w-3.5 h-3.5 text-[#007960]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedId === occ.occurrenceKey ? 'Copiado' : 'Convocar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateMonthExecution(occ.item.id, occ.monthKey, {
                                  reminderMuted: !isMuted,
                                })
                              }
                              className="ml-auto p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                              title={isMuted ? 'Reativar lembrete' : 'Silenciar lembrete'}
                            >
                              {isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openCompleteModal(occ)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#007960]/30 text-[#007960] hover:bg-emerald-50 text-xs font-bold min-h-[36px]"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Ver / Imprimir RASE SST.RE-085</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevertComplete(occ.item.id, occ.monthKey)}
                              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors min-h-[36px]"
                            >
                              Reabrir
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Matriz Completa 2026/2027 (Fiel às Planilhas SST.RE-105 e SST.RE-104) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#007960]" />
              <span>Matriz Cronograma de Simulados — Ano 2026/2027</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Clique em qualquer célula marcada com <strong className="text-slate-900">X</strong> na linha Previsto para agendar dia ou registrar realização.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 tabular-nums">
            Exibindo {filteredMatrixItems.length} cenários
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8faf9] border-b border-slate-200 text-[11px] font-mono text-slate-600">
                <th className="py-2.5 px-3 min-w-[200px]">Cenário de Emergência</th>
                <th className="py-2.5 px-2.5 min-w-[140px]">Área / Doc</th>
                <th className="py-2.5 px-2.5 min-w-[95px]">Prev. / Real.</th>
                {DRILL_FISCAL_MONTHS.map((m) => {
                  const isCurrent = m.key === currentYearMonth;
                  return (
                    <th
                      key={m.key}
                      title={m.fullLabel}
                      className={`py-2 px-1.5 text-center w-9 tabular-nums ${
                        isCurrent
                          ? 'bg-amber-100/80 text-amber-900 font-bold border-x border-amber-300'
                          : ''
                      }`}
                    >
                      <span className="block">{m.letter}</span>
                      <span className="block text-[9px] font-normal text-slate-500">
                        {m.shortLabel.slice(0, 3)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMatrixItems.map((item) => (
                <React.Fragment key={item.id}>
                  {/* Row 1: Previsto */}
                  <tr className="hover:bg-slate-50/70">
                    <td rowSpan={2} className="py-2.5 px-3 align-middle border-r border-slate-100">
                      <span className="font-bold text-slate-900 block leading-snug">
                        {item.scenario}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {item.responsible}
                      </span>
                    </td>
                    <td rowSpan={2} className="py-2.5 px-2.5 align-middle border-r border-slate-100">
                      <span className="font-semibold text-slate-800 block">{item.area}</span>
                      <span className="text-[11px] font-mono text-[#007960] font-bold">
                        {item.docCode}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-[11px] font-semibold text-slate-700 bg-slate-50/60 border-b border-slate-100">
                      Previsto
                    </td>
                    {DRILL_FISCAL_MONTHS.map((m) => {
                      const isPlanned = item.plannedMonths.includes(m.key);
                      const isCurrent = m.key === currentYearMonth;
                      const exec = item.executions?.[m.key];
                      const occ: DrillOccurrence | null = isPlanned
                        ? occurrences.find((o) => o.occurrenceKey === `${item.id}__${m.key}`) || null
                        : null;

                      return (
                        <td
                          key={m.key}
                          className={`py-1.5 px-1 text-center border-b border-slate-100 tabular-nums ${
                            isCurrent ? 'bg-amber-50/50 border-x border-amber-200' : 'bg-slate-50/30'
                          }`}
                        >
                          {isPlanned && occ ? (
                            <button
                              type="button"
                              onClick={() => openCompleteModal(occ)}
                              title={`${item.scenario} · Previsto ${m.fullLabel}${
                                exec?.plannedDate ? ` (Agendado: ${exec.plannedDate})` : ''
                              } — Clique para registrar realização`}
                              className={`w-7 h-7 rounded-md font-mono font-bold text-xs inline-flex items-center justify-center transition-colors ${
                                exec?.completed
                                  ? 'bg-emerald-100 text-[#007960]'
                                  : isCurrent
                                  ? 'bg-amber-200/80 text-amber-950 hover:bg-amber-300'
                                  : m.key < currentYearMonth
                                  ? 'bg-red-100 text-[#de2726] hover:bg-red-200'
                                  : 'bg-slate-200 text-slate-900 hover:bg-[#007960] hover:text-white'
                              }`}
                            >
                              X
                            </button>
                          ) : (
                            <span className="text-slate-300">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 2: Realizado */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-2.5 text-[11px] font-semibold text-[#007960]">
                      Realizado
                    </td>
                    {DRILL_FISCAL_MONTHS.map((m) => {
                      const isPlanned = item.plannedMonths.includes(m.key);
                      const isCurrent = m.key === currentYearMonth;
                      const exec = item.executions?.[m.key];
                      const occ = isPlanned
                        ? occurrences.find((o) => o.occurrenceKey === `${item.id}__${m.key}`) || null
                        : null;

                      return (
                        <td
                          key={m.key}
                          className={`py-1.5 px-1 text-center ${
                            isCurrent ? 'bg-amber-50/30 border-x border-amber-200' : ''
                          }`}
                        >
                          {exec?.completed ? (
                            <button
                              type="button"
                              onClick={() => occ && openCompleteModal(occ)}
                              title={`Realizado em ${exec.completedDate || m.fullLabel}`}
                              className="w-7 h-7 rounded-md bg-[#007960] text-white inline-flex items-center justify-center font-bold text-xs"
                            >
                              ✓
                            </button>
                          ) : isPlanned && occ ? (
                            <button
                              type="button"
                              onClick={() => openCompleteModal(occ)}
                              title="Registrar realização"
                              className="w-7 h-7 rounded-md border border-dashed border-slate-300 hover:border-[#007960] text-slate-400 hover:text-[#007960] inline-flex items-center justify-center text-[10px]"
                            >
                              —
                            </button>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (< lg) */}
        <div className="lg:hidden space-y-3">
          {filteredMatrixItems.map((item) => {
            const itemOccs = occurrences.filter((o) => o.item.id === item.id);
            return (
              <div
                key={item.id}
                className="border border-slate-200 rounded-xl p-3.5 bg-[#f8faf9] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                  <strong className="text-[#007960]">{item.docCode}</strong>
                  <span>{item.area}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.scenario}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{item.responsible}</p>
                </div>

                <div className="space-y-2 pt-1">
                  {itemOccs.map((occ) => (
                    <div
                      key={occ.occurrenceKey}
                      className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">
                          Previsto: {occ.monthInfo.fullLabel}
                        </span>
                        <span className="text-[11px]">{renderStatusLabel(occ.status, occ.execution?.reminderMuted)}</span>
                      </div>

                      {occ.execution?.completed ? (
                        <button
                          type="button"
                          onClick={() => openCompleteModal(occ)}
                          className="px-3 py-2 rounded-lg bg-emerald-100 text-[#007960] text-xs font-bold min-h-[40px]"
                        >
                          RASE ✓
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCompleteModal(occ)}
                          className="px-3 py-2 rounded-lg bg-[#007960] text-white text-xs font-semibold min-h-[40px]"
                        >
                          Preencher RASE
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Repositório de Formulários RASE Preenchidos (SST.RE-085) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#007960]" />
              <span>Relatórios RASE Preenchidos (Doc. SST.RE-085)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Todo simulado executado exige preenchimento obrigatório do RASE para análise crítica de eficácia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsNewStandaloneRaseOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-semibold transition-colors min-h-[40px] self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo RASE (SST.RE-085)</span>
          </button>
        </div>

        {allCompletedRaseReports.length === 0 ? (
          <div className="p-6 text-center bg-[#f8faf9] border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
            <FileCheck2 className="w-7 h-7 text-[#007960] mx-auto opacity-80" />
            <p className="font-semibold text-slate-800">
              Nenhum RASE (SST.RE-085) preenchido até o momento.
            </p>
            <p className="text-slate-500">
              Clique em <strong>Concluir & Preencher RASE</strong> em qualquer simulado do cronograma ou em <strong>Novo RASE</strong> para registrar um simulado executado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allCompletedRaseReports.map(({ report, sourceLabel, occ }) => (
              <div
                key={report.id}
                className="border border-slate-200 rounded-xl p-4 bg-[#f8faf9] flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                    <span className="font-bold text-[#007960]">{sourceLabel}</span>
                    <span>
                      {report.date.split('-').reverse().join('/')} · {report.time}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{report.drillExercise}</h4>
                  <p className="text-xs text-slate-600">
                    Local: <strong className="text-slate-800">{report.location}</strong>
                    <span aria-hidden="true"> · </span>
                    <span>{report.sstParticipants.length} integrante(s) SST assinado(s)</span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      {report.isClassifiedAreaNoElectronics
                        ? 'Área classificada (foto dispensada)'
                        : `${report.photoAttachments.length} foto(s)`}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (occ) {
                        setCompletingOcc(occ);
                      } else {
                        setEditingStandaloneRase(report);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-semibold min-h-[38px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Abrir / Imprimir RASE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Obrigatório RASE SST.RE-085 ao concluir item do cronograma */}
      <RaseReportModal
        isOpen={Boolean(completingOcc)}
        onClose={() => setCompletingOcc(null)}
        initialReport={completingOcc?.execution?.raseReport || null}
        defaultExerciseTitle={completingOcc ? completingOcc.item.scenario : ''}
        defaultLocation={completingOcc ? completingOcc.item.area : ''}
        defaultDate={
          completingOcc?.execution?.completedDate ||
          completingOcc?.execution?.plannedDate ||
          new Date().toISOString().split('T')[0]
        }
        defaultTime={completingOcc?.execution?.plannedTime || '09:00'}
        scheduleItemId={completingOcc?.item.id}
        scheduleMonthKey={completingOcc?.monthKey}
        onSave={handleSaveOccurrenceRase}
        onRevertCompletion={
          completingOcc?.execution?.completed
            ? () => {
                handleRevertComplete(completingOcc.item.id, completingOcc.monthKey);
                setCompletingOcc(null);
              }
            : undefined
        }
        onViewBlankPdf={() => setPdfModalDoc(PAE_RASE_DOCUMENT)}
      />

      {/* Modal Obrigatório RASE SST.RE-085 Avulso / Novo */}
      <RaseReportModal
        isOpen={isNewStandaloneRaseOpen || Boolean(editingStandaloneRase)}
        onClose={() => {
          setIsNewStandaloneRaseOpen(false);
          setEditingStandaloneRase(null);
        }}
        initialReport={editingStandaloneRase}
        onSave={(report) => {
          onSaveStandaloneRase?.(report);
          playIndustrialSound('success');
          setIsNewStandaloneRaseOpen(false);
          setEditingStandaloneRase(null);
        }}
        onViewBlankPdf={() => setPdfModalDoc(PAE_RASE_DOCUMENT)}
      />

      {/* Embedded PDF Modal */}
      <PaeDrillPdfModal
        isOpen={Boolean(pdfModalDoc)}
        document={pdfModalDoc}
        onSelectDocument={setPdfModalDoc}
        onClose={() => setPdfModalDoc(null)}
      />
    </div>
  );
};
