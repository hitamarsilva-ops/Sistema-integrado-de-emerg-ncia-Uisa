import React, { useState } from 'react';
import {
  Truck,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Check,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Camera,
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  Flame,
  Droplets,
  Radio,
  FileCheck2,
} from 'lucide-react';
import {
  SST_RE_109_METADATA,
  FIRE_TRUCK_CHECKLIST_ITEMS,
  INITIAL_FIRE_TRUCKS,
  INITIAL_TRUCK_INSPECTIONS,
} from '../data/truckData';
import { FireTruck, FireTruckInspectionRecord } from '../types/truck';
import { ActionPlanItem } from '../types/actionPlan';
import { ChecklistSignatureModule, SignatureData } from './ChecklistSignatureModule';
import { formatDateBR } from '../utils/formatters';
import { ChecklistCompletionModal, ChecklistCompletionData } from './ChecklistCompletionModal';
import { ChecklistMandatoryNotice } from './ChecklistMandatoryNotice';

interface FireTruckViewProps {
  onAddActionPlan?: (plan: ActionPlanItem) => void;
  onOpenPdfArchive?: () => void;
}

export const FireTruckView: React.FC<FireTruckViewProps> = ({ onAddActionPlan, onOpenPdfArchive }) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'frota' | 'historico'>('checklist');
  const [trucks] = useState<FireTruck[]>(INITIAL_FIRE_TRUCKS);
  const [inspections, setInspections] = useState<FireTruckInspectionRecord[]>(INITIAL_TRUCK_INSPECTIONS);
  const [selectedTruckId, setSelectedTruckId] = useState<string>(INITIAL_FIRE_TRUCKS[0].id);

  // Form state (todos os campos editáveis)
  const selectedTruck = trucks.find((t) => t.id === selectedTruckId) || trucks[0];
  const [company, setCompany] = useState(selectedTruck.company);
  const [truckPrefix, setTruckPrefix] = useState(selectedTruck.prefix);
  const [truckPlate, setTruckPlate] = useState(selectedTruck.plate);
  const [sector, setSector] = useState(selectedTruck.sector);
  const [front, setFront] = useState(selectedTruck.front);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [inspectorName, setInspectorName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [inspectorRegistration, setInspectorRegistration] = useState('');
  const [driverRegistration, setDriverRegistration] = useState('');

  // Editable checklist items list
  const [checklistItems, setChecklistItems] = useState(() =>
    FIRE_TRUCK_CHECKLIST_ITEMS.map((it) => ({ ...it }))
  );

  // Answers per item number
  const [answers, setAnswers] = useState<
    Record<number, { status: 'C' | 'NC' | 'N/A' | null; observation: string }>
  >(() => {
    const init: Record<number, { status: 'C' | 'NC' | 'N/A' | null; observation: string }> = {};
    FIRE_TRUCK_CHECKLIST_ITEMS.forEach((it) => {
      init[it.number] = { status: null, observation: '' };
    });
    return init;
  });

  const [generalObservations, setGeneralObservations] = useState('');
  const [inspectorSignature, setInspectorSignature] = useState<SignatureData | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Confirmação de Finalização Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState<ChecklistCompletionData | null>(null);

  // Check if ALL items are filled (Conforme, Não Conforme ou Não Aplicável)
  const unansweredItems = checklistItems.filter(
    (it) => answers[it.number]?.status === null || answers[it.number]?.status === undefined
  );
  const allItemsAnswered = unansweredItems.length === 0;
  const answeredCount = checklistItems.length - unansweredItems.length;

  const handleSelectTruck = (truckId: string) => {
    setSelectedTruckId(truckId);
    const tr = trucks.find((t) => t.id === truckId);
    if (tr) {
      setCompany(tr.company);
      setTruckPrefix(tr.prefix);
      setTruckPlate(tr.plate);
      setSector(tr.sector);
      setFront(tr.front);
    }
  };

  const handleEditItemQuestion = (num: number, question: string) => {
    setChecklistItems((prev) =>
      prev.map((it) => (it.number === num ? { ...it, question } : it))
    );
  };

  const handleAddCustomChecklistItem = () => {
    const nextNum = checklistItems.reduce((max, it) => Math.max(max, it.number), 0) + 1;
    setChecklistItems((prev) => [
      ...prev,
      {
        number: nextNum,
        category: 'veiculo_estrutural',
        question: '',
      },
    ]);
    setAnswers((prev) => ({
      ...prev,
      [nextNum]: { status: null, observation: '' },
    }));
  };

  const handleSetAnswerStatus = (num: number, status: 'C' | 'NC' | 'N/A') => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [num]: {
        ...prev[num],
        status,
      },
    }));
  };

  const handleSetAnswerObservation = (num: number, obs: string) => {
    setAnswers((prev) => ({
      ...prev,
      [num]: {
        ...prev[num],
        observation: obs,
      },
    }));
  };

  const handleSaveChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setValidationError(null);

    if (!allItemsAnswered) {
      setValidationError(
        `Bloqueio de Envio: É obrigatório flegar todos os ${checklistItems.length} itens do checklist (C, NC ou N/A). Faltam ${unansweredItems.length} item(ns): ${unansweredItems
          .slice(0, 6)
          .map((it) => `Item ${it.number}`)
          .join(', ')}${unansweredItems.length > 6 ? '...' : ''}.`
      );
      return;
    }

    const emptyQuestion = checklistItems.find((it) => !it.question.trim());
    if (emptyQuestion) {
      setValidationError(`Atenção: Preencha a descrição do item ${emptyQuestion.number} antes de finalizar.`);
      return;
    }

    if (!inspectorSignature) {
      setValidationError('Atenção: A assinatura facial ou digital do inspetor é obrigatória para finalizar o checklist!');
      return;
    }

    const effectivePrefix = truckPrefix.trim() || 'CAMINHÃO BOMBEIRO';
    const effectivePlate = truckPlate.trim() || '-';

    // Generate action plans for NC
    const ncItems = checklistItems.filter((it) => answers[it.number]?.status === 'NC');
    if (onAddActionPlan && ncItems.length > 0) {
      ncItems.forEach((it) => {
        const itemAns = answers[it.number];
        const newPlan: ActionPlanItem = {
          id: `pa-truck-${Date.now()}-${it.number}`,
          system: 'caminhao_pipa',
          division: 'INDUSTRIA',
          checklistDoc: SST_RE_109_METADATA.documentCode,
          itemChecked: `Caminhão ${effectivePrefix}: Item ${it.number} - ${it.question}`,
          nonConformityDescription:
            itemAns.observation.trim() || `Não conformidade constatada no item ${it.number} (${it.question}) durante checklist do veículo ${effectivePlate}.`,
          correctiveAction: 'Avaliação técnica imediata pela oficina automotiva e adequação do item antes do próximo deslocamento.',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          responsible: 'Oficina Automotiva & Brigada de Emergência',
          status: 'em_andamento',
          priority: 'alta',
          createdAt: new Date().toISOString().split('T')[0],
        };
        onAddActionPlan(newPlan);
      });
    }

    const newRecord: FireTruckInspectionRecord = {
      id: `insp-cb-${Date.now()}`,
      truckId: selectedTruck.id,
      truckPrefix: effectivePrefix,
      plate: effectivePlate,
      company,
      sector,
      front,
      date,
      time,
      inspectorName,
      driverName,
      inspectorRegistration,
      driverRegistration,
      answers,
      generalObservations,
      status: 'finalizada',
      inspectorSignature,
      createdAt: new Date().toISOString(),
    };

    setInspections((prev) => [newRecord, ...prev]);

    const cCount = checklistItems.filter((it) => answers[it.number]?.status === 'C').length;
    const ncCount = ncItems.length;
    const naCount = checklistItems.filter((it) => answers[it.number]?.status === 'N/A').length;
    const proto = `UISA-CB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

    setCompletionData({
      protocol: proto,
      systemName: `Caminhão Bombeiro (${effectivePrefix} • ${effectivePlate})`,
      docNumber: SST_RE_109_METADATA.documentCode,
      revision: SST_RE_109_METADATA.revision,
      unit: `${sector} — ${front}`,
      completedAt: `${formatDateBR(date)} às ${time}`,
      inspectorName: inspectorSignature?.inspectorName || inspectorName,
      inspectorRE: inspectorSignature?.registrationNumber || inspectorRegistration,
      signatureType: inspectorSignature?.type || 'digital',
      totalItems: checklistItems.length,
      conformCount: cCount,
      nonConformCount: ncCount,
      naCount: naCount,
      actionPlansCreated: ncItems.length,
      notes: generalObservations,
    });
    setIsCompletionModalOpen(true);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 5000);

    // Reset answers
    const resetAns: Record<number, { status: 'C' | 'NC' | 'N/A' | null; observation: string }> = {};
    checklistItems.forEach((it) => {
      resetAns[it.number] = { status: null, observation: '' };
    });
    setAnswers(resetAns);
    setGeneralObservations('');
    setInspectorSignature(null);
    setHasAttemptedSubmit(false);
  };

  const handlePrintGeneralReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner with Document Header and Annual Review Badge */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {SST_RE_109_METADATA.documentCode} Rev {SST_RE_109_METADATA.revision}
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {SST_RE_109_METADATA.title}
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Formulário oficial de verificação pré-uso para caminhões pipa bombeiro em frentes agrícolas e planta industrial.
            </p>

            {/* ALERTA DE REVISÃO ANUAL DOS PDF DE REFERÊNCIA COM SINAL VERDE / VERMELHO */}
            <div className="pt-1 flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300"></span>
                <span>SINAL VERDE: Revisão Anual de Documento Vigente (Data: {SST_RE_109_METADATA.date} • Próxima Revisão: {SST_RE_109_METADATA.annualReviewDate})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Gerar PDF Geral das Inspeções Finalizadas */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintGeneralReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
            title="Gerar e Baixar PDF Geral de todas as inspeções finalizadas"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar PDF Geral</span>
          </button>
          {onOpenPdfArchive && (
            <button
              onClick={onOpenPdfArchive}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
              title="Armazenamento e Repositório de Checklists do Caminhão Bombeiro em PDF"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#007960]" />
              <span>Armazenamento PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'checklist'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Preencher Checklist SST.RE-109</span>
        </button>

        <button
          onClick={() => setActiveTab('frota')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'frota'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Frota de Caminhões Pipa ({trucks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'historico'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico de Inspeções ({inspections.length})</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-[#007960] text-[#007960] flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Checklist SST.RE-109 Finalizado com Sucesso!</span>
            <span>As eventuais não conformidades apontadas geraram planos de ação automáticos no Painel Geral.</span>
          </div>
        </div>
      )}

      {/* TAB 1: FORMULÁRIO OFICIAL DO CHECKLIST SST.RE-109 */}
      {activeTab === 'checklist' && (
        <form onSubmit={handleSaveChecklist} className="space-y-6">
          {/* Cabeçalho Oficial do Documento SST.RE-109 (Todos os campos editáveis) */}
          <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#007960]" />
              <span>1. Dados Gerais da Inspeção (Cabeçalho Oficial SST.RE-109)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">EMPRESA: *</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  placeholder="Ex: UISA"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">PREFIXO: *</label>
                <input
                  type="text"
                  value={truckPrefix}
                  onChange={(e) => setTruckPrefix(e.target.value)}
                  required
                  placeholder="Ex: CB-01 / PIPA-01"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">PLACA: *</label>
                <input
                  type="text"
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  required
                  placeholder="Ex: ABC-1D23"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">SETOR: *</label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  required
                  placeholder="Informe o setor..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">FRENTE: *</label>
                <input
                  type="text"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  required
                  placeholder="Informe a frente de trabalho..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">DATA: *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HORA: *</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">NOME DO INSPETOR: *</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  required
                  placeholder="Digite o nome do inspetor..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">MATRÍCULA / RE DO INSPETOR:</label>
                <input
                  type="text"
                  value={inspectorRegistration}
                  onChange={(e) => setInspectorRegistration(e.target.value)}
                  placeholder="RE do inspetor..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NOME DO MOTORISTA: *</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                    placeholder="Nome do motorista..."
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">RE MOTORISTA:</label>
                  <input
                    type="text"
                    value={driverRegistration}
                    onChange={(e) => setDriverRegistration(e.target.value)}
                    placeholder="RE-00000"
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela dos Itens Editáveis (Conforme PDF SST.RE-109) */}
          <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Itens a Serem Verificados ({checklistItems.length} Itens Editáveis SST.RE-109)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Todos os campos, descrições e observações dos itens são editáveis. Marque C (Conforme), NC (Não Conforme) ou N/A.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddCustomChecklistItem}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#007960] text-[#007960] hover:text-white border border-[#007960]/30 text-[11px] font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Item</span>
                </button>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                    allItemsAnswered
                      ? 'bg-emerald-50 text-[#007960] border-[#007960]/30'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {answeredCount} de {checklistItems.length} respondidos
                </span>
              </div>
            </div>

            <ChecklistMandatoryNotice
              totalItems={checklistItems.length}
              answeredItems={answeredCount}
              hasAttemptedSubmit={hasAttemptedSubmit}
              itemLabel="itens do checklist"
              pendingLabels={unansweredItems.map((it) => `Item ${it.number}`)}
            />

            <div className="space-y-3">
              {checklistItems.map((item) => {
                const ans = answers[item.number] || { status: null, observation: '' };
                const isNC = ans.status === 'NC';
                const isMissing = ans.status === null;

                return (
                  <div
                    key={item.number}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      isMissing
                        ? hasAttemptedSubmit
                          ? 'border-red-400 bg-red-50/40 ring-1 ring-red-300'
                          : 'border-slate-200 bg-[#f8faf9]'
                        : isNC
                        ? 'border-red-300 bg-red-50/20'
                        : 'border-[#007960]/30 bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1">
                        <span
                          className={`w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                            hasAttemptedSubmit && isMissing ? 'bg-[#de2726]' : 'bg-[#007960]'
                          }`}
                        >
                          {item.number}
                        </span>
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => handleEditItemQuestion(item.number, e.target.value)}
                          placeholder={`Descreva o item ${item.number} de verificação...`}
                          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#007960] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none transition-colors"
                        />
                        {hasAttemptedSubmit && isMissing && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-[#de2726] border border-red-300 text-[10px] font-bold shrink-0">
                            Obrigatório flegar
                          </span>
                        )}
                      </div>

                      {/* Botões C, NC, N/A */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleSetAnswerStatus(item.number, 'C')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            ans.status === 'C'
                              ? 'bg-[#007960] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#007960]'
                          }`}
                        >
                          C - Conforme
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetAnswerStatus(item.number, 'NC')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            ans.status === 'NC'
                              ? 'bg-[#de2726] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#de2726]'
                          }`}
                        >
                          NC - Não Conforme
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetAnswerStatus(item.number, 'N/A')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            ans.status === 'N/A'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          N/A - Não se Aplica
                        </button>
                      </div>
                    </div>

                    {/* Campo editável de observação / preenchimento do item (obrigatório em caso de NC) */}
                    <div className={isNC ? 'pt-2 border-t border-red-200 space-y-1' : 'pl-8'}>
                      {isNC && (
                        <label className="block text-[11px] font-bold text-[#de2726]">
                          DESCRIÇÃO DETALHADA DA NÃO CONFORMIDADE (GERA PLANO DE AÇÃO AUTOMÁTICO): *
                        </label>
                      )}
                      <input
                        type="text"
                        value={ans.observation}
                        onChange={(e) => handleSetAnswerObservation(item.number, e.target.value)}
                        placeholder={
                          isNC
                            ? 'Informe a falha constatada no caminhão (ex: vazamento, item desabastecido, lacre violado)...'
                            : 'Observação / anotação editável deste item (opcional)...'
                        }
                        required={isNC}
                        className={`w-full rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none ${
                          isNC
                            ? 'bg-white border border-red-300 focus:border-[#de2726]'
                            : 'bg-white border border-slate-200 focus:border-[#007960]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observações Gerais e Assinaturas */}
          <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#007960]" />
              <span>3. Observações Finais & Assinatura Facial/Digital Obrigatória</span>
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                OBSERVAÇÕES GERAIS / PARECER DA BRIGADA:
              </label>
              <textarea
                rows={2}
                value={generalObservations}
                onChange={(e) => setGeneralObservations(e.target.value)}
                placeholder="Observações complementares referentes aos testes mecânicos e operacionais do caminhão pipa..."
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>

            {/* Módulo de Assinatura Facial ou Digital */}
            <div className="pt-2 border-t border-slate-200">
              <ChecklistSignatureModule
                signature={inspectorSignature}
                onChangeSignature={setInspectorSignature}
                hasAttemptedSubmit={hasAttemptedSubmit}
              />
            </div>

            {/* Aviso de Preenchimento Obrigatório */}
            <ChecklistMandatoryNotice
              totalItems={checklistItems.length}
              answeredItems={answeredCount}
              hasAttemptedSubmit={hasAttemptedSubmit}
              itemLabel="itens do checklist"
              pendingLabels={unansweredItems.map((it) => `Item ${it.number}`)}
            />

            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-[#de2726] text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-mono">
                {allItemsAnswered
                  ? `✓ ${checklistItems.length}/${checklistItems.length} itens flegados`
                  : `${answeredCount}/${checklistItems.length} itens flegados`}
              </span>

              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  allItemsAnswered
                    ? 'bg-[#007960] hover:bg-[#005a47] text-white cursor-pointer'
                    : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {allItemsAnswered
                    ? 'Finalizar e Salvar Checklist SST.RE-109'
                    : `Flegar todos os itens (${answeredCount}/${checklistItems.length})`}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: FROTA DE CAMINHÕES PIPA E ESPECIFICAÇÕES */}
      {activeTab === 'frota' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trucks.map((tr) => (
              <div
                key={tr.id}
                className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tr.prefix}</h4>
                      <p className="text-xs text-slate-500 font-mono">Placa: {tr.plate} • {tr.model}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 uppercase">
                    {tr.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 font-mono">
                  <div className="p-2.5 rounded-lg bg-[#f8faf9]">
                    <span className="text-[10px] text-slate-400 block uppercase">Capacidade do Tanque</span>
                    <strong className="text-slate-900 font-bold">{tr.capacityLiters.toLocaleString('pt-BR')} L</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#f8faf9]">
                    <span className="text-[10px] text-slate-400 block uppercase">Setor Operacional</span>
                    <strong className="text-slate-900 truncate block">{tr.sector}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#f8faf9]">
                    <span className="text-[10px] text-slate-400 block uppercase">Bomba de Combate</span>
                    <strong className="text-slate-900 truncate block">{tr.pumpModel}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#f8faf9]">
                    <span className="text-[10px] text-slate-400 block uppercase">Canhão Monitor</span>
                    <strong className="text-slate-900 truncate block">{tr.canonNozzle}</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Última Inspeção: <strong>{formatDateBR(tr.lastInspectionDate)}</strong>
                  </span>
                  <button
                    onClick={() => {
                      handleSelectTruck(tr.id);
                      setActiveTab('checklist');
                    }}
                    className="text-[#007960] hover:underline font-bold"
                  >
                    Novo Checklist →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HISTÓRICO DE INSPEÇÕES & PDF GERAL */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-[#007960]/20 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#007960]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Registros de Inspeções Finalizadas (SST.RE-109)
              </h3>
            </div>
            <button
              onClick={handlePrintGeneralReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo PDF Geral</span>
            </button>
          </div>

          <div className="space-y-3">
            {inspections.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-[#007960]/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{rec.truckPrefix}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Placa: {rec.plate}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                      Finalizada
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>Data: <strong>{formatDateBR(rec.date)} {rec.time}</strong></span>
                    <button
                      onClick={() => window.print()}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Imprimir Checklist"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Inspetor:</span>
                    <strong className="text-slate-800">{rec.inspectorName} ({rec.inspectorRegistration || '-'})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Motorista:</span>
                    <strong className="text-slate-800">{rec.driverName} ({rec.driverRegistration || '-'})</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-[#f8faf9] p-2.5 rounded-lg border border-slate-100">
                  <strong>Observações: </strong>{rec.generalObservations || 'Sem observações registradas.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Finalização do Checklist */}
      <ChecklistCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        data={completionData}
        onViewPdf={handlePrintGeneralReport}
        onOpenPdfArchive={onOpenPdfArchive}
      />
    </div>
  );
};
