import React, { useState } from 'react';
import {
  BellRing,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  ExternalLink,
  Plus,
  Save,
  Factory,
  Package,
  Fuel,
  Building2,
  Clock,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  Camera,
  FileCheck2,
} from 'lucide-react';
import {
  AlarmDivision,
  AlarmInspectionRecord,
  OFFICIAL_ALARM_QUESTIONS,
  AlarmChecklistItem,
  AlarmEvaluation,
} from '../types/alarm';
import { ALARM_UNITS } from '../data/alarmData';
import { ActionPlanItem } from '../types/actionPlan';
import { formatDateBR } from '../utils/formatters';
import { ChecklistSignatureModule, SignatureData } from './ChecklistSignatureModule';
import { SystemInspectionPdfModal, InspectionPdfModalData } from './SystemInspectionPdfModal';
import { ChecklistCompletionModal, ChecklistCompletionData } from './ChecklistCompletionModal';
import { ChecklistMandatoryNotice } from './ChecklistMandatoryNotice';

// Configuração padrão de agendamento semanal para teste do sistema de alarme por polo operacional
export const ALARM_POLE_TEST_SCHEDULE: Record<
  AlarmDivision,
  {
    poleName: string;
    dayOfWeek: string;
    standardTime: string;
    responsibleTeam: string;
    centralTag: string;
    durationMinutes: number;
    coveredDevices: string;
  }
> = {
  INDUSTRIA: {
    poleName: 'Polo Industrial (Complexo Sucroalcooleiro)',
    dayOfWeek: 'Toda Sexta-feira',
    standardTime: '10:00 h',
    responsibleTeam: 'Bombeiro Civil Plantonista + Técnico de Instrumentação',
    centralTag: 'Central Endereçável Notifier NFS-320',
    durationMinutes: 45,
    coveredDevices: '38 Acionadores Manuais, 24 Sirenes Audiovisuais, 65 Detectores de Fumaça nas Caldeiras e Destilaria',
  },
  EMPACOTAMENTO: {
    poleName: 'Polo Empacotamento (Unidade Assari)',
    dayOfWeek: 'Toda Quinta-feira',
    standardTime: '15:00 h',
    responsibleTeam: 'Brigadista Assari + Técnico de SST',
    centralTag: 'Central Endereçável Intelbras CIE 1250',
    durationMinutes: 30,
    coveredDevices: '18 Acionadores, 12 Sirenes, 32 Detectores de Fumaça e Térmicos dos Silos e Linhas de Empacotamento',
  },
  'POSTO DE COMBUSTIVEL': {
    poleName: 'Polo Posto de Combustíveis & Frotas',
    dayOfWeek: 'Toda Terça-feira',
    standardTime: '10:00 h',
    responsibleTeam: 'Bombeiro Civil + Operador de Abastecimento',
    centralTag: 'Central Convencional Intelbras CIC 24L',
    durationMinutes: 20,
    coveredDevices: '6 Botoeiras de Emergência, 4 Sirenes Estroboscópicas e Detectores de Chama das Ilhas',
  },
  'ADM/GMA': {
    poleName: 'Polo Administrativo & Oficinas GMA',
    dayOfWeek: 'Toda Sexta-feira',
    standardTime: '14:00 h',
    responsibleTeam: 'Técnico de SST + Eletricista Predial',
    centralTag: 'Central Endereçável Morley-IAS DXc',
    durationMinutes: 25,
    coveredDevices: '14 Acionadores, 10 Sirenes e Detectores Ópticos no Datacenter / CPD, Ambulatório e Escritórios',
  },
};

interface AlarmSystemViewProps {
  inspections: AlarmInspectionRecord[];
  onSaveInspection: (record: AlarmInspectionRecord, newActionPlans?: ActionPlanItem[]) => void;
  onOpenPdfOriginal?: () => void;
  onOpenPdfArchive?: () => void;
}

export const AlarmSystemView: React.FC<AlarmSystemViewProps> = ({
  inspections,
  onSaveInspection,
  onOpenPdfArchive,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<AlarmDivision>('INDUSTRIA');
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'calendario' | 'historico'>('checklist');

  // Form State for active inspection
  const activeUnit = ALARM_UNITS[selectedDivision];
  const lastInspection = inspections.find((i) => i.division === selectedDivision);

  const [inspectorName, setInspectorName] = useState(lastInspection?.inspectorName || 'Brigada de Emergência / SST');
  const [inspectorRE, setInspectorRE] = useState('RE-48201');
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sectorsCovered, setSectorsCovered] = useState(lastInspection?.sectorsCovered || activeUnit.location);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionTime, setInspectionTime] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );

  // PDF Geral Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalData, setPdfModalData] = useState<InspectionPdfModalData | null>(null);

  // Confirmação de Finalização Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState<ChecklistCompletionData | null>(null);

  // Initialize checklist items (clean or from last inspection)
  const [checklistItems, setChecklistItems] = useState<Record<string, { status: AlarmEvaluation | null; observation: string }>>(() => {
    const initial: Record<string, { status: AlarmEvaluation | null; observation: string }> = {};
    OFFICIAL_ALARM_QUESTIONS.forEach((q) => {
      initial[q.id] = { status: null, observation: '' };
    });
    return initial;
  });

  const [anomaliesOrComments, setAnomaliesOrComments] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const unansweredQuestions = OFFICIAL_ALARM_QUESTIONS.filter((q) => checklistItems[q.id]?.status === null);
  const answeredCount = OFFICIAL_ALARM_QUESTIONS.length - unansweredQuestions.length;
  const allItemsAnswered = unansweredQuestions.length === 0;

  // When switching division
  const handleSelectDivision = (div: AlarmDivision) => {
    setSelectedDivision(div);
    const unit = ALARM_UNITS[div];
    const prev = inspections.find((i) => i.division === div);
    if (prev) {
      setInspectorName(prev.inspectorName);
      setSectorsCovered(prev.sectorsCovered);
    } else {
      setSectorsCovered(unit.location);
    }
    // Reset answers to fresh unfilled form
    const fresh: Record<string, { status: AlarmEvaluation | null; observation: string }> = {};
    OFFICIAL_ALARM_QUESTIONS.forEach((q) => {
      fresh[q.id] = { status: null, observation: '' };
    });
    setChecklistItems(fresh);
    setAnomaliesOrComments('');
    setSavedSuccess(false);
    setHasAttemptedSubmit(false);
    setValidationError(null);
  };

  const handleStatusChange = (questionId: string, status: AlarmEvaluation) => {
    setValidationError(null);
    setChecklistItems((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        status,
      },
    }));
  };

  const handleObservationChange = (questionId: string, text: string) => {
    setChecklistItems((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        observation: text,
      },
    }));
  };

  // Group questions by category
  const categories: Array<'CENTRAL' | 'ACIONADOR MANUAL' | 'SIRENES' | 'DETECTORES DE FUMAÇA'> = [
    'CENTRAL',
    'ACIONADOR MANUAL',
    'SIRENES',
    'DETECTORES DE FUMAÇA',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setValidationError(null);

    // Validação Obrigatória: 100% dos itens preenchidos
    if (unansweredQuestions.length > 0) {
      setValidationError(
        `Bloqueio de Envio: É obrigatório flegar todos os ${OFFICIAL_ALARM_QUESTIONS.length} itens do checklist (C, NC ou N/A). Faltam ${unansweredQuestions.length} item(ns) sem marcação.`
      );
      return;
    }

    if (!signature || !signature.inspectorName.trim() || (!signature.signatureImage && signature.type !== 'digital')) {
      setValidationError('Atenção: A assinatura facial ou digital é obrigatória para salvar o checklist SST.RE-020.');
      return;
    }

    const effectiveInspector = signature.inspectorName.trim() || inspectorName.trim();

    // Check if questions answered
    const itemsList: AlarmChecklistItem[] = OFFICIAL_ALARM_QUESTIONS.map((q) => ({
      id: q.id,
      category: q.category,
      question: q.question,
      status: checklistItems[q.id]?.status || 'C',
      observation: checklistItems[q.id]?.observation || '',
    }));

    const ncItems = itemsList.filter((item) => item.status === 'NC');
    const hasNC = ncItems.length > 0;

    // Generate automatic action plans for all NC items
    const generatedActionPlans: ActionPlanItem[] = ncItems.map((item, idx) => ({
      id: `pa-alm-auto-${Date.now()}-${idx}`,
      system: 'alarmes',
      division: selectedDivision,
      checklistDoc: 'SST.RE-020',
      itemChecked: `${item.category}: ${item.question}`,
      nonConformityDescription:
        (item.observation || '').trim() ||
        `Não conformidade constatada no item "${item.question}" durante inspeção da central de alarmes da unidade ${selectedDivision}.`,
      correctiveAction: 'Programar intervenção técnica corretiva imediata e reteste com laço endereçável.',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 dias
      responsible: 'Gestão SST / Automação e Brigada',
      status: 'em_andamento',
      priority: 'alta',
      createdAt: inspectionDate,
      notes: `Registrado automaticamente via Checklist SST.RE-020 (Inspetor: ${inspectorName}).`,
    }));

    const newInspection: AlarmInspectionRecord = {
      id: `insp-alm-${Date.now()}`,
      division: selectedDivision,
      docNumber: 'SST.RE-020',
      revision: '02',
      docDate: '06/11/2026',
      company: 'uisa',
      inspectorName: inspectorName.trim(),
      sectorsCovered: sectorsCovered.trim(),
      date: inspectionDate,
      time: inspectionTime,
      items: itemsList,
      anomaliesOrComments: anomaliesOrComments.trim(),
      hasNonConformity: hasNC,
      createdAt: new Date().toISOString(),
    };

    onSaveInspection(newInspection, generatedActionPlans);
    setSavedSuccess(true);

    // Confirmação de Finalização do Checklist SST.RE-020
    const proto = `UISA-ALM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;
    const cCount = itemsList.filter((it) => it.status === 'C').length;
    const ncCount = ncItems.length;
    const naCount = itemsList.filter((it) => it.status === 'N/A').length;

    setCompletionData({
      protocol: proto,
      systemName: 'Sistema de Detecção e Alarme de Incêndio',
      docNumber: 'SST.RE-020',
      revision: '02',
      unit: selectedDivision,
      completedAt: `${formatDateBR(inspectionDate)} às ${inspectionTime}`,
      inspectorName: signature?.inspectorName || inspectorName,
      inspectorRE: signature?.registrationNumber || inspectorRE,
      signatureType: signature?.type || 'digital',
      totalItems: itemsList.length,
      conformCount: cCount,
      nonConformCount: ncCount,
      naCount: naCount,
      actionPlansCreated: generatedActionPlans.length,
      notes: anomaliesOrComments,
    });
    setIsCompletionModalOpen(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleOpenGeneralPdf = () => {
    const rows = OFFICIAL_ALARM_QUESTIONS.map((q, idx) => ({
      number: idx + 1,
      categoryOrSection: q.category,
      itemDescription: q.question,
      status: (checklistItems[q.id]?.status || 'C') as any,
      observation: checklistItems[q.id]?.observation || '',
    }));

    setPdfModalData({
      title: `Inspeção do Sistema de Detecção e Alarme de Incêndio - ${selectedDivision}`,
      systemName: 'Sistema de Alarme e Detecção',
      docNumber: 'SST.RE-020',
      revision: '02',
      unit: selectedDivision,
      date: inspectionDate,
      inspectorName: signature?.inspectorName || inspectorName,
      inspectorRole: 'Inspetor / Brigada SST',
      inspectorRE: inspectorRE,
      operatorName: 'Carlos Eduardo Mendes',
      operatorRole: 'Operador de Utilidades / Manutenção',
      operatorRE: 'RE-44129',
      managerName: 'João Bosco Lemos Junior',
      managerRole: 'Gerente Executivo / SESMT',
      managerRE: 'RE-10204',
      referenceStandard: 'ABNT NBR 17240 / IT-19 CBMMT',
      annualReviewStatus: 'SINAL VERDE',
      annualReviewExpiryDate: '06/11/2027',
      notes: anomaliesOrComments || 'Inspeção periódica realizada em conformidade com o procedimento SST.RE-020 Rev 02.',
      rows,
    });
    setIsPdfModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header with Document Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#007960]/20 p-5 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0 shadow-xs">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Inspeção do Sistema de Detecção de Incêndio e Alarme
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#007960] text-white">
                DOC. SST.RE-020
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                REVISÃO: 02
              </span>
              {/* Alerta de Revisão Anual do Documento de Referência */}
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SINAL VERDE: SST.RE-020 Rev 02 (Válido até 06/11/2027)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-800">uisa Bioenergia & Açúcar</span>
              <span className="text-slate-300">•</span>
              <span>Central Endereçável / Convencional, Acionadores Manuais, Sirenes e Detectores de Fumaça</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('checklist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'checklist'
                  ? 'bg-[#007960] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Checklist SST.RE-020
            </button>
            <button
              onClick={() => setActiveSubTab('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'calendario'
                  ? 'bg-[#007960] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário Semanal</span>
            </button>
            <button
              onClick={() => setActiveSubTab('historico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'historico'
                  ? 'bg-[#007960] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Histórico ({inspections.length})
            </button>
          </div>

          <button
            onClick={handleOpenGeneralPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors shadow-xs"
            title="Gerar PDF Geral das inspeções de alarme com opção de download"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Gerar PDF Geral</span>
          </button>
          {onOpenPdfArchive && (
            <button
              onClick={onOpenPdfArchive}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
              title="Armazenamento e Repositório de Checklists de Alarme em PDF"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#007960]" />
              <span>Armazenamento PDF</span>
            </button>
          )}

          <a
            href="/assets/aistudio/SST.RE-020_Inspe__o_Dec_Inc_ndio_e_Alarme_revisado_79dcc30e.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
            title="Visualizar documento oficial SST.RE-020 anexado em PDF"
          >
            <ExternalLink className="w-4 h-4 text-[#007960]" />
            <span>PDF Original SST.RE-020</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* BANNER EM DESTAQUE: CALENDÁRIO OFICIAL DE TESTES SEMANAIS DE ALARME */}
      {activeSubTab === 'checklist' && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border-2 border-[#007960] p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#007960]/20 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#007960] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>CALENDÁRIO OFICIAL DE TESTES SEMANAIS DE ALARMES & SIRENES</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#007960] text-white">
                    SST.RE-020
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
                  Cronograma e parâmetros operacionais de ensaio das centrais, laços, botoeiras e sirenes
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#007960] bg-white px-3 py-1 rounded-lg border border-[#007960]/30 shrink-0 flex items-center gap-1.5 self-start sm:self-center shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Escala Semanal Vigente</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* 1. Indústria */}
            <div
              onClick={() => handleSelectDivision('INDUSTRIA')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedDivision === 'INDUSTRIA'
                  ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                  : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-[#007960]" />
                  INDÚSTRIA
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                  10:00 h
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Toda Sexta-feira às 10:00 h</span>
              </div>
              <p className="text-[10px] text-slate-600">Destilaria, Caldeiras, Moendas (38 acionadores)</p>
              <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                {selectedDivision === 'INDUSTRIA' ? '✓ Central Selecionada' : 'Clique para selecionar →'}
              </span>
            </div>

            {/* 2. Empacotamento */}
            <div
              onClick={() => handleSelectDivision('EMPACOTAMENTO')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedDivision === 'EMPACOTAMENTO'
                  ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                  : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#007960]" />
                  EMPACOTAMENTO
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                  15:00 h
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Toda Quinta-feira às 15:00 h</span>
              </div>
              <p className="text-[10px] text-slate-600">Silos, Armazéns, Assari (18 acionadores)</p>
              <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                {selectedDivision === 'EMPACOTAMENTO' ? '✓ Central Selecionada' : 'Clique para selecionar →'}
              </span>
            </div>

            {/* 3. Posto de Combustível */}
            <div
              onClick={() => handleSelectDivision('POSTO DE COMBUSTIVEL')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedDivision === 'POSTO DE COMBUSTIVEL'
                  ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                  : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-[#007960]" />
                  POSTO DE COMBUSTÍVEL
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                  10:00 h
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Toda Terça-feira às 10:00 h</span>
              </div>
              <p className="text-[10px] text-slate-600">Ilhas de Combustível & Frotas (6 botoeiras)</p>
              <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                {selectedDivision === 'POSTO DE COMBUSTIVEL' ? '✓ Central Selecionada' : 'Clique para selecionar →'}
              </span>
            </div>

            {/* 4. ADM/GMA */}
            <div
              onClick={() => handleSelectDivision('ADM/GMA')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedDivision === 'ADM/GMA'
                  ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                  : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#007960]" />
                  ADM/GMA
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                  14:00 h
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Toda Sexta-feira às 14:00 h</span>
              </div>
              <p className="text-[10px] text-slate-600">Datacenter/CPD, Prédio Central (14 acionadores)</p>
              <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                {selectedDivision === 'ADM/GMA' ? '✓ Central Selecionada' : 'Clique para selecionar →'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4 Division Selector Cards: INDUSTRIA, EMPACOTAMENTO, POSTO DE COMBUSTIVEL, ADM/GMA */}
      {activeSubTab === 'checklist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. INDUSTRIA */}
          <button
            type="button"
            onClick={() => handleSelectDivision('INDUSTRIA')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
              selectedDivision === 'INDUSTRIA'
                ? 'bg-emerald-50/60 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                selectedDivision === 'INDUSTRIA'
                  ? 'bg-[#007960] text-white border-[#007960]'
                  : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
              }`}
            >
              <Factory className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-bold text-xs truncate">INDUSTRIA</h3>
                <span className="text-[10px] font-mono text-[#007960] font-bold">Sexta • 10h</span>
              </div>
              <p className="text-[11px] text-slate-600 truncate">Destilaria, Caldeiras, Moenda</p>
              <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                38 Acionadores • 65 Detectores
              </span>
            </div>
          </button>

          {/* 2. EMPACOTAMENTO */}
          <button
            type="button"
            onClick={() => handleSelectDivision('EMPACOTAMENTO')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
              selectedDivision === 'EMPACOTAMENTO'
                ? 'bg-emerald-50/60 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                selectedDivision === 'EMPACOTAMENTO'
                  ? 'bg-[#007960] text-white border-[#007960]'
                  : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-bold text-xs truncate">EMPACOTAMENTO</h3>
                <span className="text-[10px] font-mono text-[#007960] font-bold">Quinta • 15h</span>
              </div>
              <p className="text-[11px] text-slate-600 truncate">Silos, Linhas de Açúcar, Assari</p>
              <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                18 Acionadores • 32 Detectores
              </span>
            </div>
          </button>

          {/* 3. POSTO DE COMBUSTIVEL */}
          <button
            type="button"
            onClick={() => handleSelectDivision('POSTO DE COMBUSTIVEL')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
              selectedDivision === 'POSTO DE COMBUSTIVEL'
                ? 'bg-emerald-50/60 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                selectedDivision === 'POSTO DE COMBUSTIVEL'
                  ? 'bg-[#007960] text-white border-[#007960]'
                  : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
              }`}
            >
              <Fuel className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-bold text-xs truncate">POSTO DE COMBUSTIVEL</h3>
                <span className="text-[10px] font-mono text-[#007960] font-bold">Terça • 10h</span>
              </div>
              <p className="text-[11px] text-slate-600 truncate">Pistas, Descarga & GMA</p>
              <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                8 Acionadores Ex-d • 10 Detectores
              </span>
            </div>
          </button>

          {/* 4. ADM/GMA */}
          <button
            type="button"
            onClick={() => handleSelectDivision('ADM/GMA')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
              selectedDivision === 'ADM/GMA'
                ? 'bg-emerald-50/60 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                selectedDivision === 'ADM/GMA'
                  ? 'bg-[#007960] text-white border-[#007960]'
                  : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-bold text-xs truncate">ADM/GMA</h3>
                <span className="text-[10px] font-mono text-[#007960] font-bold">Sexta • 14h</span>
              </div>
              <p className="text-[11px] text-slate-600 truncate">Prédio Central, Datacenter, Oficinas</p>
              <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                14 Acionadores • 28 Detectores
              </span>
            </div>
          </button>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-[#007960] text-[#007960] flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Inspeção Registrada com Sucesso!</span>
            <span>Checklist SST.RE-020 arquivado. As eventuais não conformidades geraram planos de ação automáticos no Painel Geral.</span>
          </div>
        </div>
      )}

      {/* Main SubTab Content: Checklist Oficial vs Histórico */}
      {activeSubTab === 'checklist' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Identificação (Conforme SST.RE-020 Pág. 1) */}
          <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#007960]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Cabeçalho de Identificação • {selectedDivision}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Pág: 1 / 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">EMPRESA:</label>
                <input
                  type="text"
                  value="uisa Bioenergia & Açúcar"
                  disabled
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">NOME DO INSPETOR: *</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  required
                  placeholder="Nome do inspetor de segurança"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">SETORES / ÁREA: *</label>
                <input
                  type="text"
                  value={sectorsCovered}
                  onChange={(e) => setSectorsCovered(e.target.value)}
                  required
                  placeholder="Setores cobertos pela central"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">DATA:</label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HORA:</label>
                  <input
                    type="time"
                    value={inspectionTime}
                    onChange={(e) => setInspectionTime(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Table (Doc SST.RE-020) */}
          <ChecklistMandatoryNotice
            totalItems={OFFICIAL_ALARM_QUESTIONS.length}
            answeredItems={answeredCount}
            hasAttemptedSubmit={hasAttemptedSubmit}
            itemLabel="itens do checklist de alarme"
            pendingLabels={unansweredQuestions.map((q) => q.question.slice(0, 36))}
          />

          <div className="bg-white border border-[#007960]/20 rounded-2xl overflow-hidden shadow-xs">
            {/* Table Header */}
            <div className="bg-emerald-50/70 border-b border-[#007960]/20 px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ITEM A SEREM VERIFICADOS ({answeredCount}/{OFFICIAL_ALARM_QUESTIONS.length} flegados)
              </span>
              <div className="flex items-center gap-6 text-xs font-bold text-slate-700">
                <span className="w-10 text-center text-[#007960]">C</span>
                <span className="w-10 text-center text-[#de2726]">NC</span>
                <span className="w-10 text-center text-slate-500">N/A</span>
              </div>
            </div>

            {/* Questions by Category */}
            <div className="divide-y divide-slate-100">
              {categories.map((cat, catIdx) => {
                const questions = OFFICIAL_ALARM_QUESTIONS.filter((q) => q.category === cat);
                return (
                  <div key={cat} className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#007960] text-white flex items-center justify-center text-xs font-bold font-mono">
                        {catIdx + 1}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        {cat}
                      </h4>
                    </div>

                    <div className="space-y-2.5 pl-8">
                      {questions.map((q) => {
                        const cur = checklistItems[q.id] || { status: null, observation: '' };
                        const isNC = cur.status === 'NC';
                        const isMissing = cur.status === null;

                        return (
                          <div
                            key={q.id}
                            className={`p-3 rounded-xl border transition-all ${
                              isNC
                                ? 'bg-red-50/50 border-red-300 ring-1 ring-red-300'
                                : cur.status === 'C'
                                ? 'bg-emerald-50/20 border-emerald-200'
                                : cur.status === 'N/A'
                                ? 'bg-slate-50 border-slate-200'
                                : hasAttemptedSubmit && isMissing
                                ? 'bg-red-50/40 border-red-400 ring-1 ring-red-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-slate-800 leading-snug">
                                  {q.question}
                                </span>
                                {hasAttemptedSubmit && isMissing && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#de2726] border border-red-300 text-[10px] font-bold">
                                    Obrigatório flegar
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-6 shrink-0 self-end sm:self-center">
                                {/* C (Conforme) */}
                                <label className="w-10 flex items-center justify-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`status_${q.id}`}
                                    checked={cur.status === 'C'}
                                    onChange={() => handleStatusChange(q.id, 'C')}
                                    className="w-4 h-4 text-[#007960] focus:ring-[#007960] cursor-pointer"
                                  />
                                </label>

                                {/* NC (Não Conforme) */}
                                <label className="w-10 flex items-center justify-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`status_${q.id}`}
                                    checked={cur.status === 'NC'}
                                    onChange={() => handleStatusChange(q.id, 'NC')}
                                    className="w-4 h-4 text-[#de2726] focus:ring-[#de2726] cursor-pointer"
                                  />
                                </label>

                                {/* N/A (Não se Aplica) */}
                                <label className="w-10 flex items-center justify-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`status_${q.id}`}
                                    checked={cur.status === 'N/A'}
                                    onChange={() => handleStatusChange(q.id, 'N/A')}
                                    className="w-4 h-4 text-slate-500 focus:ring-slate-400 cursor-pointer"
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Campo de Não Conformidade Obrigatório se marcado NC */}
                            {isNC && (
                              <div className="mt-3 pt-3 border-t border-red-200 animate-in fade-in">
                                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#de2726]">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>Não Conformidade Detectada • Gera Plano de Ação Automático</span>
                                </div>
                                <textarea
                                  rows={2}
                                  value={cur.observation}
                                  onChange={(e) => handleObservationChange(q.id, e.target.value)}
                                  placeholder="Descreva detalhadamente o defeito ou não conformidade identificada..."
                                  required
                                  className="w-full bg-white border border-red-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#de2726] focus:ring-1 focus:ring-[#de2726]"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page 2: Anomalias / Comentários & Notas Oficiais */}
          <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ANOMALIAS OU COMENTÁRIOS
              </h3>
              <span className="text-xs text-slate-500 font-mono">Pág: 2 / 2</span>
            </div>

            <textarea
              rows={3}
              value={anomaliesOrComments}
              onChange={(e) => setAnomaliesOrComments(e.target.value)}
              placeholder="Utilize este espaço caso haja observações gerais, anomalias elétricas, testes de fumaça realizados ou necessidades de intervenção preventiva..."
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960]"
            />

            {/* Notas Regulamentares Oficiais do SST.RE-020 */}
            <div className="bg-[#f8faf9] border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Info className="w-4 h-4 text-[#007960]" />
                <span>Legenda: C = Conforme; NC = Não Conforme; N/A = Não se Aplica</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                <li>
                  <strong>Nota 1:</strong> Na identificação de qualquer não conformidade, o responsável pela gestão do sistema deve tomar providências para programar a correção urgente.
                </li>
                <li>
                  <strong>Nota 2:</strong> Anexar relatório fotográfico a este questionário, caso se aplique.
                </li>
              </ul>
            </div>

            {/* Módulo Obrigatório de Assinatura Facial ou Digital */}
            <div className="pt-2 border-t border-slate-200">
              <ChecklistSignatureModule
                signature={signature}
                onChangeSignature={setSignature}
                hasAttemptedSubmit={hasAttemptedSubmit}
              />
            </div>

            <ChecklistMandatoryNotice
              totalItems={OFFICIAL_ALARM_QUESTIONS.length}
              answeredItems={answeredCount}
              hasAttemptedSubmit={hasAttemptedSubmit}
              itemLabel="itens do checklist de alarme"
            />

            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-[#de2726] text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                <span>Unidade em verificação: </span>
                <strong className="text-slate-800">{selectedDivision}</strong>
                <span className="ml-2 font-mono font-bold text-[#007960]">
                  ({answeredCount}/{OFFICIAL_ALARM_QUESTIONS.length} flegados)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs ${
                    allItemsAnswered
                      ? 'bg-[#007960] hover:bg-[#005a47]'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {allItemsAnswered
                      ? 'Salvar Inspeção e Gerar Planos de Ação'
                      : `Flegar todos os itens (${answeredCount}/${OFFICIAL_ALARM_QUESTIONS.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* SubTab: Histórico de Inspeções */}
      {activeSubTab === 'historico' && (
        <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Histórico de Inspeções de Alarme Registradas
            </h3>
            <span className="text-xs font-mono text-slate-500">{inspections.length} registros</span>
          </div>

          <div className="space-y-3">
            {inspections.map((insp) => (
              <div
                key={insp.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-[#007960]/40 transition-colors bg-[#f8faf9]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#007960] text-white">
                      {insp.division}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatDateBR(insp.date)} às {insp.time}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      insp.hasNonConformity
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : 'bg-emerald-50 text-[#007960] border border-emerald-300'
                    }`}
                  >
                    {insp.hasNonConformity ? 'Não Conformidade Registrada' : '100% Conforme'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-slate-400">Inspetor: </span>
                    <span className="font-semibold text-slate-800">{insp.inspectorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Setores: </span>
                    <span className="font-semibold text-slate-800">{insp.sectorsCovered}</span>
                  </div>
                </div>

                {insp.anomaliesOrComments && (
                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                    "{insp.anomaliesOrComments}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab: Calendário Semanal Detalhado */}
      {activeSubTab === 'calendario' && (
        <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#007960]" />
                <span>Calendário Semanal de Testes do Sistema de Alarme & Detecção</span>
              </h3>
              <p className="text-xs text-slate-600">
                Escala semanal oficial de acionamento de laços, centrais e sirenes (SST.RE-020)
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-[#007960] text-white">
              SST.RE-020 Rev 02
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(ALARM_POLE_TEST_SCHEDULE) as AlarmDivision[]).map((div) => {
              const sched = ALARM_POLE_TEST_SCHEDULE[div];
              const isSelected = selectedDivision === div;
              const lastInsp = inspections.find((i) => i.division === div);

              return (
                <div
                  key={div}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/50 border-[#007960] ring-1 ring-[#007960]/30 shadow-xs'
                      : 'bg-[#f8faf9] border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-black text-slate-900">{div}</span>
                      <p className="text-[11px] text-slate-600 font-medium">{sched.poleName}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white shrink-0">
                      {sched.standardTime}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Dia e Horário:</span>
                      <strong className="text-[#007960] font-mono">{sched.dayOfWeek} às {sched.standardTime}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Equipe Responsável:</span>
                      <span className="font-semibold text-slate-800 text-[11px]">{sched.responsibleTeam}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Central / Painel:</span>
                      <span className="font-mono text-slate-700 text-[11px]">{sched.centralTag}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Duração Estimada:</span>
                      <span className="text-slate-700 font-medium">{sched.durationMinutes} minutos</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 mb-3">
                    <span className="font-bold text-slate-700 block mb-0.5">Dispositivos Abrangidos:</span>
                    <span>{sched.coveredDevices}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="text-[10px] text-slate-500">
                      {lastInsp ? (
                        <span>Último teste: <strong className="text-slate-700">{formatDateBR(lastInsp.date)}</strong></span>
                      ) : (
                        <span>Pendente de primeiro registro</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectDivision(div);
                        setActiveSubTab('checklist');
                      }}
                      className="px-3 py-1 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-[11px] font-bold transition-colors shadow-2xs"
                    >
                      Abrir Checklist →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de PDF Geral e Download da Inspeção */}
      <SystemInspectionPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        data={pdfModalData}
      />

      {/* Modal de Confirmação de Finalização do Checklist */}
      <ChecklistCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        data={completionData}
        onViewPdf={handleOpenGeneralPdf}
        onOpenPdfArchive={onOpenPdfArchive}
      />
    </div>
  );
};
