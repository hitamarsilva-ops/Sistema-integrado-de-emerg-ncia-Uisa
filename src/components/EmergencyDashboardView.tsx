import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Flame,
  Droplets,
  BellRing,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  Building2,
  Factory,
  Package,
  Fuel,
  Check,
  RefreshCw,
  Printer,
  Beaker,
  Users,
  ShieldAlert,
  Truck,
  Edit,
  Upload,
  FileCheck,
  X,
  Paperclip,
  BarChart3,
  ListFilter,
} from 'lucide-react';
import {
  ActionPlanItem,
  EmergencySystem,
  ActionPlanDivision,
  ActionPlanStatus,
  ActionPlanPriority,
  EMERGENCY_SYSTEM_LABELS,
  ACTION_PLAN_STATUS_LABELS,
} from '../types/actionPlan';
import { Extinguisher } from '../types/extinguisher';
import { Hydrant } from '../types/hydrant';
import { AlarmInspectionRecord } from '../types/alarm';
import { BrigadeMember } from '../types/brigade';
import { getTrainingStatus } from '../data/brigadeData';
import { formatDateBR } from '../utils/formatters';
import { AnalyticsChartsView } from './AnalyticsChartsView';

interface EmergencyDashboardViewProps {
  actionPlans: ActionPlanItem[];
  onUpdateActionPlanStatus: (id: string, newStatus: ActionPlanStatus) => void;
  onUpdateActionPlan?: (plan: ActionPlanItem) => void;
  onAddActionPlan: (plan: ActionPlanItem) => void;
  extinguishers: Extinguisher[];
  hydrants: Hydrant[];
  alarmInspections: AlarmInspectionRecord[];
  brigadeMembers?: BrigadeMember[];
  onNavigateToTab: (tab: string) => void;
}

export const EmergencyDashboardView: React.FC<EmergencyDashboardViewProps> = ({
  actionPlans,
  onUpdateActionPlanStatus,
  onAddActionPlan,
  extinguishers,
  hydrants,
  alarmInspections,
  brigadeMembers = [],
  onNavigateToTab,
  onUpdateActionPlan,
}) => {
  const [activeMainSection, setActiveMainSection] = useState<'planos' | 'graficos'>('planos');
  const [statusFilter, setStatusFilter] = useState<ActionPlanStatus | 'todos'>('todos');
  const [systemFilter, setSystemFilter] = useState<EmergencySystem | 'todos'>('todos');
  const [divisionFilter, setDivisionFilter] = useState<ActionPlanDivision | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Edit Action Plan Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlanItem | null>(null);
  const [editItemChecked, setEditItemChecked] = useState('');
  const [editNcDesc, setEditNcDesc] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editResponsible, setEditResponsible] = useState('');
  const [editPriority, setEditPriority] = useState<ActionPlanPriority>('alta');
  const [editStatus, setEditStatus] = useState<ActionPlanStatus>('em_andamento');
  const [editNotes, setEditNotes] = useState('');

  // Finalize Action Plan with Mandatory Evidence Modal State
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [finalizingPlan, setFinalizingPlan] = useState<ActionPlanItem | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceAttachmentName, setEvidenceAttachmentName] = useState('Comprovante_Execucao_OS.pdf');
  const [evidenceAttachmentData, setEvidenceAttachmentData] = useState<string | null>(null);
  const [evidenceResponsible, setEvidenceResponsible] = useState('Brigada de Emergência / Técnico SST');
  const [evidenceDate, setEvidenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [evidenceSubmittedAttempt, setEvidenceSubmittedAttempt] = useState(false);

  // Expired brigade members count
  const expiredBrigadeCount = useMemo(() => {
    return brigadeMembers.filter((m) => getTrainingStatus(m.trainingExpiryDate).status === 'vencido').length;
  }, [brigadeMembers]);

  // New action plan form state
  const [newSystem, setNewSystem] = useState<EmergencySystem>('bombas');
  const [newDivision, setNewDivision] = useState<ActionPlanDivision>('INDUSTRIA');
  const [newItemChecked, setNewItemChecked] = useState('');
  const [newNcDesc, setNewNcDesc] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newResponsible, setNewResponsible] = useState('Brigada de Emergência / SST');
  const [newPriority, setNewPriority] = useState<'alta' | 'media' | 'baixa'>('alta');

  // Metrics for Action Plans
  const metrics = useMemo(() => {
    const total = actionPlans.length;
    const atrasados = actionPlans.filter((p) => p.status === 'atrasado').length;
    const emAndamento = actionPlans.filter((p) => p.status === 'em_andamento').length;
    const finalizados = actionPlans.filter((p) => p.status === 'finalizado').length;
    const resolutionRate = total > 0 ? Math.round((finalizados / total) * 100) : 100;

    // By System
    const systems: Record<EmergencySystem, { total: number; atrasado: number; em_andamento: number; finalizado: number }> = {
      bombas: { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
      extintores: { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
      hidrantes: { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
      alarmes: { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
      caminhao_pipa: { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
    };

    actionPlans.forEach((p) => {
      if (systems[p.system]) {
        systems[p.system].total++;
        if (p.status === 'atrasado') systems[p.system].atrasado++;
        else if (p.status === 'em_andamento') systems[p.system].em_andamento++;
        else if (p.status === 'finalizado') systems[p.system].finalizado++;
      }
    });

    // By Division
    const divisions: Record<ActionPlanDivision, { total: number; atrasado: number; em_andamento: number; finalizado: number }> = {
      INDUSTRIA: { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
      EMPACOTAMENTO: { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
      'POSTO DE COMBUSTIVEL': { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
      'ADM/GMA': { total: 0, atrasado: 0, em_andamento: 0, finalizado: 0 },
    };

    actionPlans.forEach((p) => {
      if (divisions[p.division]) {
        divisions[p.division].total++;
        if (p.status === 'atrasado') divisions[p.division].atrasado++;
        else if (p.status === 'em_andamento') divisions[p.division].em_andamento++;
        else if (p.status === 'finalizado') divisions[p.division].finalizado++;
      }
    });

    return { total, atrasados, emAndamento, finalizados, resolutionRate, systems, divisions };
  }, [actionPlans]);

  // Filtered action plans
  const filteredPlans = useMemo(() => {
    return actionPlans.filter((p) => {
      const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
      const matchSystem = systemFilter === 'todos' || p.system === systemFilter;
      const matchDivision = divisionFilter === 'todos' || p.division === divisionFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.itemChecked.toLowerCase().includes(q) ||
        p.nonConformityDescription.toLowerCase().includes(q) ||
        p.correctiveAction.toLowerCase().includes(q) ||
        p.responsible.toLowerCase().includes(q) ||
        p.division.toLowerCase().includes(q);

      return matchStatus && matchSystem && matchDivision && matchSearch;
    });
  }, [actionPlans, statusFilter, systemFilter, divisionFilter, searchQuery]);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemChecked.trim() || !newNcDesc.trim()) return;

    const newPlan: ActionPlanItem = {
      id: `pa-manual-${Date.now()}`,
      system: newSystem,
      division: newDivision,
      itemChecked: newItemChecked.trim(),
      nonConformityDescription: newNcDesc.trim(),
      correctiveAction: newAction.trim() || 'Avaliar causa-raiz e aplicar correção técnica preventiva.',
      deadline: newDeadline,
      responsible: newResponsible.trim(),
      status: 'em_andamento',
      priority: newPriority,
      createdAt: new Date().toISOString().split('T')[0],
      checklistDoc: 'Plano Diretor de Emergência',
    };

    onAddActionPlan(newPlan);
    setIsNewModalOpen(false);
    setNewItemChecked('');
    setNewNcDesc('');
    setNewAction('');
  };

  // Open Edit Action Plan Modal
  const handleOpenEditModal = (plan: ActionPlanItem) => {
    setEditingPlan(plan);
    setEditItemChecked(plan.itemChecked);
    setEditNcDesc(plan.nonConformityDescription);
    setEditAction(plan.correctiveAction);
    setEditDeadline(plan.deadline);
    setEditResponsible(plan.responsible);
    setEditPriority(plan.priority);
    setEditStatus(plan.status);
    setEditNotes(plan.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditedPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const updated: ActionPlanItem = {
      ...editingPlan,
      itemChecked: editItemChecked.trim(),
      nonConformityDescription: editNcDesc.trim(),
      correctiveAction: editAction.trim(),
      deadline: editDeadline,
      responsible: editResponsible.trim(),
      priority: editPriority,
      status: editStatus,
      notes: editNotes.trim(),
      completedAt: editStatus === 'finalizado' ? (editingPlan.completedAt || new Date().toISOString().split('T')[0]) : undefined,
    };

    if (onUpdateActionPlan) {
      onUpdateActionPlan(updated);
    } else {
      onUpdateActionPlanStatus(editingPlan.id, editStatus);
    }

    setIsEditModalOpen(false);
    setEditingPlan(null);
  };

  // Open Finalize Action Plan Modal with Mandatory Evidence
  const handleOpenFinalizeModal = (plan: ActionPlanItem) => {
    setFinalizingPlan(plan);
    setEvidenceDescription(plan.evidenceOfExecution || '');
    setEvidenceAttachmentName(plan.evidenceAttachmentName || `Comprovante_OS_${plan.id}.pdf`);
    setEvidenceAttachmentData(plan.evidenceAttachmentData || null);
    setEvidenceResponsible(plan.responsible || 'Brigada de Emergência / SST');
    setEvidenceDate(new Date().toISOString().split('T')[0]);
    setEvidenceSubmittedAttempt(false);
    setIsFinalizeModalOpen(true);
  };

  const handleConfirmFinalizeWithEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    setEvidenceSubmittedAttempt(true);

    if (!evidenceDescription.trim() || !evidenceAttachmentName.trim() || !evidenceResponsible.trim()) {
      return;
    }

    if (!finalizingPlan) return;

    const finalized: ActionPlanItem = {
      ...finalizingPlan,
      status: 'finalizado',
      completedAt: evidenceDate,
      evidenceOfExecution: evidenceDescription.trim(),
      evidenceAttachmentName: evidenceAttachmentName.trim(),
      evidenceAttachmentData: evidenceAttachmentData || undefined,
      evidenceDate,
      evidenceResponsible: evidenceResponsible.trim(),
    };

    if (onUpdateActionPlan) {
      onUpdateActionPlan(finalized);
    } else {
      onUpdateActionPlanStatus(finalizingPlan.id, 'finalizado');
    }

    setIsFinalizeModalOpen(false);
    setFinalizingPlan(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'Sistema',
      'Unidade',
      'Documento',
      'Item Inspecionado',
      'Não Conformidade (Descrição)',
      'Ação Corretiva',
      'Prazo',
      'Responsável',
      'Prioridade',
      'Status',
      'Data Criação',
      'Data Conclusão',
    ];

    const rows = actionPlans.map((p) => [
      `"${EMERGENCY_SYSTEM_LABELS[p.system]?.name || p.system}"`,
      `"${p.division}"`,
      `"${p.checklistDoc || '-'}"`,
      `"${p.itemChecked.replace(/"/g, '""')}"`,
      `"${p.nonConformityDescription.replace(/"/g, '""')}"`,
      `"${p.correctiveAction.replace(/"/g, '""')}"`,
      `"${p.deadline}"`,
      `"${p.responsible}"`,
      `"${p.priority}"`,
      `"${ACTION_PLAN_STATUS_LABELS[p.status]?.label || p.status}"`,
      `"${p.createdAt}"`,
      `"${p.completedAt || '-'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Planos_de_Acao_Nao_Conformidades_UISA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 7 Operational Cards in ALPHABETICAL ORDER (Alarmes, Bombas, Brigada, Caminhão Bombeiro, Extintores, PAE, Rede de Hidrantes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        {/* 1. Alarmes de Incêndio (A) */}
        <div
          onClick={() => onNavigateToTab('alarmes')}
          className="bg-white border border-[#007960]/20 p-3.5 rounded-2xl shadow-xs hover:border-[#007960] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Alarmes de Incêndio
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#de2726] flex items-center justify-center group-hover:scale-110 transition-transform">
                <BellRing className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">4</span>
              <span className="text-[10px] text-slate-500 font-medium">Centrais</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              SST.RE-020 • Acionadores & Sirenes
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
            <span className="text-slate-500 group-hover:text-[#007960] font-bold flex items-center gap-1 transition-colors">
              Acessar Aba <ArrowRight className="w-3 h-3 text-[#007960]" />
            </span>
          </div>
        </div>

        {/* 2. Bombas de Incêndio (B) */}
        <div
          onClick={() => onNavigateToTab('bombas')}
          className="bg-white border border-[#007960]/20 p-3.5 rounded-2xl shadow-xs hover:border-[#007960] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Bombas de Incêndio
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#007960] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">4</span>
              <span className="text-[10px] text-slate-500 font-medium">Unidades</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              SST.RE-094 • Testes Semanais RTI
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
            <span className="text-slate-500 group-hover:text-[#007960] font-bold flex items-center gap-1 transition-colors">
              Acessar Aba <ArrowRight className="w-3 h-3 text-[#007960]" />
            </span>
          </div>
        </div>

        {/* 3. Brigada de Emergência (B) */}
        <div
          onClick={() => onNavigateToTab('brigadistas')}
          className="bg-white border border-[#007960]/20 p-3.5 rounded-2xl shadow-xs hover:border-[#007960] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Brigada de Emergência
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#007960] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">{brigadeMembers.length}</span>
              <span className="text-[10px] text-slate-500 font-medium">Brigadistas</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              Turnos A, B, C e ADM • Treinamentos
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
            <span className="text-slate-500 group-hover:text-[#007960] font-bold flex items-center gap-1 transition-colors">
              Acessar Aba <ArrowRight className="w-3 h-3 text-[#007960]" />
            </span>
          </div>
        </div>

        {/* 4. Caminhão Bombeiro (C) */}
        <div
          onClick={() => onNavigateToTab('caminhao_pipa')}
          className="bg-white border border-[#007960]/20 p-3.5 rounded-2xl shadow-xs hover:border-[#007960] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Caminhão Bombeiro
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">4</span>
              <span className="text-[10px] text-slate-500 font-medium">Caminhões Pipa</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              SST.RE-109 • Canhão, Bomba e Drip Torch
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
            <span className="text-slate-500 group-hover:text-[#007960] font-bold flex items-center gap-1 transition-colors">
              Acessar Aba <ArrowRight className="w-3 h-3 text-[#007960]" />
            </span>
          </div>
        </div>

        {/* 5. Extintores de Incêndio (E) */}
        <div
          onClick={() => onNavigateToTab('extintores')}
          className="bg-white border border-[#007960]/20 p-3.5 rounded-2xl shadow-xs hover:border-[#007960] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Extintores de Incêndio
              </span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">{extinguishers.length}</span>
              <span className="text-[10px] text-slate-500 font-medium">Equipamentos</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              Ficha Geral, Almoxarifado e Setores
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
            <span className="text-slate-500 group-hover:text-[#007960] font-bold flex items-center gap-1 transition-colors">
              Acessar Aba <ArrowRight className="w-3 h-3 text-[#007960]" />
            </span>
          </div>
        </div>

        {/* 6. Plano de Emergência (PAE) (P) */}
        <div
          onClick={() => onNavigateToTab('pae')}
          className="bg-white border border-[#007960]/20 p-3.5 rounded-2xl shadow-xs hover:border-[#007960] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Plano de Emergência
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-[#de2726] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">6</span>
              <span className="text-[10px] text-slate-500 font-medium">Cenários PAE</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              Gravidade Decrescente • Ramal 3737
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
            <span className="text-slate-500 group-hover:text-[#007960] font-bold flex items-center gap-1 transition-colors">
              Acessar Aba <ArrowRight className="w-3 h-3 text-[#007960]" />
            </span>
          </div>
        </div>

        {/* 7. Rede de Hidrantes & LGE (R) */}
        <div
          onClick={() => onNavigateToTab('hidrantes')}
          className="bg-white border border-[#007960]/20 p-3.5 rounded-2xl shadow-xs hover:border-[#007960] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Rede de Hidrantes
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Droplets className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">{hydrants.length}</span>
              <span className="text-[10px] text-slate-500 font-medium">Pontos</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              Laudos LGE NBR 15511 & Mangueiras
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px]">
            <span className="text-slate-500 group-hover:text-[#007960] font-bold flex items-center gap-1 transition-colors">
              Acessar Aba <ArrowRight className="w-3 h-3 text-[#007960]" />
            </span>
          </div>
        </div>
      </div>

      {/* LEMBRETE DO PRÓXIMO TESTE DE LABORATÓRIO DE LGE (ABNT NBR 15511) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-[#007960]/30 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#007960] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Beaker className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-[#007960] uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-[#007960]/30">
                Lembrete Técnico Obrigatório • ABNT NBR 15511
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Laboratório Firemetria (CRL 0576)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Próximo Teste de Laboratório de LGE:{' '}
              <span className="text-[#007960] font-mono font-black text-base">15/06/2027</span>
              <span className="text-xs font-normal text-slate-600 ml-1.5">
                (Periodicidade de 12 meses • Ensaio de fogo válido até 15/06/2029)
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              Unidades cobertas com laudos aprovados: <strong>Indústria (Carregamento de Etanol)</strong>,{' '}
              <strong>Posto de Combustível</strong> e <strong>Empacotamento</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            onClick={() => onNavigateToTab('hidrantes')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ver Laudos Oficiais LGE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SELETOR DE MODO DO PAINEL GERAL: Indicadores & Ações vs Gráficos Globais */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveMainSection('planos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainSection === 'planos'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Painel de Não Conformidades & Planos de Ação ({actionPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveMainSection('graficos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainSection === 'graficos'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Gráficos & Análise Estatística Global (Painel Geral)</span>
        </button>
      </div>

      {activeMainSection === 'graficos' ? (
        <div className="space-y-4">
          <AnalyticsChartsView
            extinguishers={extinguishers}
            hydrants={hydrants}
            brigadeMembers={brigadeMembers}
          />
        </div>
      ) : (
        /* PAINEL CENTRAL DE NÃO CONFORMIDADES & PLANOS DE AÇÃO */
        <div className="bg-white border border-[#007960]/20 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Header do Painel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#de2726] flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Painel Geral de Não Conformidades & Planos de Ação
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento integrado de não conformidades para Bombas de Incêndio, Extintores, Hidrantes e Alarmes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
              title="Imprimir Painel de Indicadores e Planos de Ação"
            >
              <Printer className="w-4 h-4 text-[#007960]" />
              <span>Imprimir Relatório</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#007960]" />
              <span>Exportar Planilha</span>
            </button>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Plano de Ação</span>
            </button>
          </div>
        </div>

        {/* 4 Indicadores Numéricos em Destaque */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              Total Não Conformidades
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono">{metrics.total}</span>
              <span className="text-xs text-slate-500">registradas</span>
            </div>
          </div>

          {/* Atrasados (Destaque em Vermelho) */}
          <div
            onClick={() => setStatusFilter('atrasado')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'atrasado'
                ? 'bg-red-50 border-[#de2726] ring-2 ring-red-300 shadow-xs'
                : 'bg-white border-red-200 hover:border-[#de2726]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#de2726] font-bold block">
                Atrasado (Crítico)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#de2726] animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#de2726] font-mono">{metrics.atrasados}</span>
              <span className="text-xs text-red-600 font-bold">pendências</span>
            </div>
          </div>

          {/* Em Andamento (Âmbar) */}
          <div
            onClick={() => setStatusFilter('em_andamento')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'em_andamento'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                : 'bg-white border-amber-200 hover:border-amber-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-amber-700 font-bold block">
              Em Andamento
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-600 font-mono">{metrics.emAndamento}</span>
              <span className="text-xs text-amber-700">tratamento</span>
            </div>
          </div>

          {/* Finalizados (Verde) */}
          <div
            onClick={() => setStatusFilter('finalizado')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'finalizado'
                ? 'bg-emerald-50 border-[#007960] ring-2 ring-emerald-300 shadow-xs'
                : 'bg-white border-emerald-200 hover:border-[#007960]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#007960] font-bold block">
                Finalizado / Resolvido
              </span>
              <span className="text-xs font-mono font-bold text-[#007960]">{metrics.resolutionRate}%</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#007960] font-mono">{metrics.finalizados}</span>
              <span className="text-xs text-emerald-700 font-bold">concluídos</span>
            </div>
          </div>
        </div>

        {/* Gráfico Visual: Distribuição por Sistema e Unidade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Card Gráfico 1: Não Conformidades por Sistema */}
          <div className="bg-[#f8faf9] border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#007960]" />
                <span>Indicadores por Sistema de Emergência</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Atrasado / Andamento / Finalizado</span>
            </div>

            <div className="space-y-3 text-xs">
              {(['bombas', 'extintores', 'hidrantes', 'alarmes'] as EmergencySystem[]).map((sys) => {
                const s = metrics.systems[sys];
                const label = EMERGENCY_SYSTEM_LABELS[sys];
                const total = s.total || 1; // avoid / 0
                const pctAtrasado = Math.round((s.atrasado / total) * 100);
                const pctAndamento = Math.round((s.em_andamento / total) * 100);
                const pctFinalizado = Math.round((s.finalizado / total) * 100);

                return (
                  <div key={sys} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{label.name}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-[#de2726] font-bold">{s.atrasado} atr</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-600 font-bold">{s.em_andamento} and</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[#007960] font-bold">{s.finalizado} fin</span>
                        <span className="text-slate-400">({s.total} un)</span>
                      </div>
                    </div>

                    {/* Progress Bar Stack */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      {s.atrasado > 0 && (
                        <div
                          style={{ width: `${pctAtrasado}%` }}
                          className="bg-[#de2726] h-full"
                          title={`Atrasados: ${s.atrasado} (${pctAtrasado}%)`}
                        />
                      )}
                      {s.em_andamento > 0 && (
                        <div
                          style={{ width: `${pctAndamento}%` }}
                          className="bg-[#f58220] h-full"
                          title={`Em Andamento: ${s.em_andamento} (${pctAndamento}%)`}
                        />
                      )}
                      {s.finalizado > 0 && (
                        <div
                          style={{ width: `${pctFinalizado}%` }}
                          className="bg-[#007960] h-full"
                          title={`Finalizados: ${s.finalizado} (${pctFinalizado}%)`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card Gráfico 2: Não Conformidades por Unidade Operacional */}
          <div className="bg-[#f8faf9] border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#007960]" />
                <span>Indicadores por Unidade Operacional</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">4 Polos Operacionais</span>
            </div>

            <div className="space-y-3 text-xs">
              {(['INDUSTRIA', 'EMPACOTAMENTO', 'POSTO DE COMBUSTIVEL', 'ADM/GMA'] as ActionPlanDivision[]).map((div) => {
                const d = metrics.divisions[div];
                const total = d.total || 1;
                const pctAtrasado = Math.round((d.atrasado / total) * 100);
                const pctAndamento = Math.round((d.em_andamento / total) * 100);
                const pctFinalizado = Math.round((d.finalizado / total) * 100);

                return (
                  <div key={div} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{div}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-[#de2726] font-bold">{d.atrasado} atr</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-600 font-bold">{d.em_andamento} and</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[#007960] font-bold">{d.finalizado} fin</span>
                        <span className="text-slate-400">({d.total} un)</span>
                      </div>
                    </div>

                    {/* Progress Bar Stack */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      {d.atrasado > 0 && (
                        <div
                          style={{ width: `${pctAtrasado}%` }}
                          className="bg-[#de2726] h-full"
                          title={`Atrasados: ${d.atrasado} (${pctAtrasado}%)`}
                        />
                      )}
                      {d.em_andamento > 0 && (
                        <div
                          style={{ width: `${pctAndamento}%` }}
                          className="bg-[#f58220] h-full"
                          title={`Em Andamento: ${d.em_andamento} (${pctAndamento}%)`}
                        />
                      )}
                      {d.finalizado > 0 && (
                        <div
                          style={{ width: `${pctFinalizado}%` }}
                          className="bg-[#007960] h-full"
                          title={`Finalizados: ${d.finalizado} (${pctFinalizado}%)`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filtros e Barra de Busca */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar não conformidade, descrição, responsável..."
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
            />
          </div>

          {/* Filtros por Botões */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Status */}
            <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'todos' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({actionPlans.length})
              </button>
              <button
                onClick={() => setStatusFilter('atrasado')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'atrasado' ? 'bg-[#de2726] text-white shadow-xs' : 'text-red-700 hover:bg-red-50'
                }`}
              >
                Atrasados ({metrics.atrasados})
              </button>
              <button
                onClick={() => setStatusFilter('em_andamento')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'em_andamento' ? 'bg-[#f58220] text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                Em Andamento ({metrics.emAndamento})
              </button>
              <button
                onClick={() => setStatusFilter('finalizado')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'finalizado' ? 'bg-[#007960] text-white shadow-xs' : 'text-[#007960] hover:bg-emerald-50'
                }`}
              >
                Finalizados ({metrics.finalizados})
              </button>
            </div>

            {/* Sistema Select */}
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value as any)}
              className="bg-[#f8faf9] border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="todos">Todos Sistemas</option>
              <option value="bombas">Bombas de Incêndio</option>
              <option value="extintores">Extintores</option>
              <option value="hidrantes">Hidrantes</option>
              <option value="alarmes">Alarmes</option>
            </select>

            {/* Unidade Select */}
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value as any)}
              className="bg-[#f8faf9] border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="todos">Todas Unidades</option>
              <option value="INDUSTRIA">INDUSTRIA</option>
              <option value="EMPACOTAMENTO">EMPACOTAMENTO</option>
              <option value="POSTO DE COMBUSTIVEL">POSTO DE COMBUSTIVEL</option>
              <option value="ADM/GMA">ADM/GMA</option>
            </select>
          </div>
        </div>

        {/* Lista Detalhada de Planos de Ação */}
        <div className="space-y-3">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-10 bg-[#f8faf9] rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-10 h-10 text-[#007960] mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-600 font-bold">Nenhum plano de ação encontrado para o filtro selecionado.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Todas as não conformidades desta categoria foram tratadas ou não existem pendências.</p>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const sysMeta = EMERGENCY_SYSTEM_LABELS[plan.system];
              const stMeta = ACTION_PLAN_STATUS_LABELS[plan.status];
              const isOverdue = plan.status === 'atrasado';

              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverdue
                      ? 'bg-red-50/20 border-red-200 hover:border-red-400'
                      : plan.status === 'finalizado'
                      ? 'bg-emerald-50/15 border-emerald-200 opacity-90'
                      : 'bg-white border-slate-200 hover:border-[#007960]/40 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge Sistema */}
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${sysMeta.badgeBg}`}>
                        {sysMeta.name}
                      </span>

                      {/* Badge Unidade */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {plan.division}
                      </span>

                      {/* Doc */}
                      {plan.checklistDoc && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200">
                          {plan.checklistDoc}
                        </span>
                      )}

                      {/* Status */}
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${stMeta.badgeBg}`}>
                        {stMeta.label}
                      </span>
                    </div>

                    {/* Action Plan Actions: Editar & Concluir com Evidência */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center flex-wrap">
                      <button
                        onClick={() => handleOpenEditModal(plan)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
                        title="Editar Plano de Ação (Ação, Prazo, Responsável, Prioridade)"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#007960]" />
                        <span>Editar</span>
                      </button>

                      {plan.status !== 'finalizado' ? (
                        <button
                          onClick={() => handleOpenFinalizeModal(plan)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-[#007960] text-[#007960] hover:text-white border border-[#007960]/30 text-xs font-bold transition-all shadow-2xs"
                          title="Finalizar Plano de Ação com Evidência Obrigatória de Execução"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Concluir c/ Evidência</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateActionPlanStatus(plan.id, 'em_andamento')}
                          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-bold transition-colors"
                          title="Reabrir plano de ação"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reabrir</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Descrição Principal da Não Conformidade e Ação */}
                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-slate-900 flex items-baseline gap-1.5">
                      <span className="text-[#de2726]">•</span>
                      <span>Item Inspecionado: {plan.itemChecked}</span>
                    </div>

                    <p className="text-slate-700 pl-3 border-l-2 border-red-300 py-0.5">
                      <strong className="text-slate-900">Não Conformidade: </strong>
                      {plan.nonConformityDescription}
                    </p>

                    <p className="text-slate-700 pl-3 border-l-2 border-[#007960] py-0.5 bg-emerald-50/30 rounded-r-lg">
                      <strong className="text-[#007960]">Plano de Ação Corretiva: </strong>
                      {plan.correctiveAction}
                    </p>

                    {/* Exibição da Evidência de Execução Registrada (Quando Finalizado) */}
                    {plan.evidenceOfExecution && (
                      <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-300 text-xs space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-[#007960] font-bold">
                          <span className="flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-[#007960]" />
                            <span>Evidência de Execução Comprovada</span>
                          </span>
                          {plan.evidenceDate && (
                            <span className="text-[10px] font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                              Data: {formatDateBR(plan.evidenceDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 text-[11px] font-medium leading-relaxed">
                          {plan.evidenceOfExecution}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-emerald-200/60 text-[10px] text-slate-600 font-mono">
                          {plan.evidenceAttachmentName && (
                            <span className="flex items-center gap-1 font-bold text-emerald-800">
                              <Paperclip className="w-3 h-3" />
                              <span>Anexo: {plan.evidenceAttachmentName}</span>
                            </span>
                          )}
                          {plan.evidenceResponsible && (
                            <span>
                              Validado por: <strong>{plan.evidenceResponsible}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Meta: Prazo, Responsável, Data de Conclusão */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Prazo: </span>
                        <strong className={isOverdue ? 'text-[#de2726] font-bold underline' : 'text-slate-800'}>
                          {formatDateBR(plan.deadline)} {isOverdue && '(VENCIDO)'}
                        </strong>
                      </span>

                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Resp: </span>
                        <strong className="text-slate-800">{plan.responsible}</strong>
                      </span>
                    </div>

                    {plan.completedAt && (
                      <span className="text-[#007960] font-bold">
                        Finalizado em {formatDateBR(plan.completedAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* MODAL 1: Novo Plano de Ação Manual */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#f8faf9] flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Cadastrar Não Conformidade & Plano de Ação
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sistema de Emergência</label>
                  <select
                    value={newSystem}
                    onChange={(e) => setNewSystem(e.target.value as EmergencySystem)}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#007960]"
                  >
                    <option value="bombas">Bomba de Combate a Incêndio</option>
                    <option value="extintores">Extintores de Incêndio</option>
                    <option value="hidrantes">Rede de Hidrantes</option>
                    <option value="alarmes">Alarmes de Incêndio</option>
                    <option value="caminhao_pipa">Caminhão Bombeiro (Pipa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unidade Operacional</label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value as ActionPlanDivision)}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#007960]"
                  >
                    <option value="INDUSTRIA">INDUSTRIA</option>
                    <option value="EMPACOTAMENTO">EMPACOTAMENTO</option>
                    <option value="POSTO DE COMBUSTIVEL">POSTO DE COMBUSTIVEL</option>
                    <option value="ADM/GMA">ADM/GMA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Item Inspecionado *</label>
                <input
                  type="text"
                  value={newItemChecked}
                  onChange={(e) => setNewItemChecked(e.target.value)}
                  placeholder="Ex: Bomba Diesel, Acionador Manual AM-02, Válvula de Manobra, Esguicho Canhão..."
                  required
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição Detalhada da Não Conformidade *</label>
                <textarea
                  rows={2}
                  value={newNcDesc}
                  onChange={(e) => setNewNcDesc(e.target.value)}
                  placeholder="Relate os detalhes técnicos do defeito ou desvio encontrado..."
                  required
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ação Corretiva Proposta</label>
                <textarea
                  rows={2}
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="Ação necessária para eliminar a anomalia..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prazo Limite *</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Responsável *</label>
                  <input
                    type="text"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold transition-all shadow-xs"
                >
                  Registrar Plano de Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Editar Plano de Ação (Ação, Prazo, Responsáveis, etc.) */}
      {isEditModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#f8faf9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#007960]" />
                <h3 className="text-base font-bold text-slate-900">
                  Editar Plano de Ação & Prazos
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedPlan} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  {EMERGENCY_SYSTEM_LABELS[editingPlan.system]?.name} • {editingPlan.division}
                </span>
                <p className="font-bold text-slate-900">{editItemChecked}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ação Corretiva Proposta / Executada: *
                </label>
                <textarea
                  rows={3}
                  value={editAction}
                  onChange={(e) => setEditAction(e.target.value)}
                  required
                  placeholder="Editar a descrição da ação técnica preventiva ou corretiva..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Prazo Limite para Conclusão: *
                  </label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Responsável pela Execução: *
                  </label>
                  <input
                    type="text"
                    value={editResponsible}
                    onChange={(e) => setEditResponsible(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prioridade</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as ActionPlanPriority)}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#007960]"
                  >
                    <option value="alta">Alta Prioridade</option>
                    <option value="media">Média Prioridade</option>
                    <option value="baixa">Baixa Prioridade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Atual</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ActionPlanStatus)}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#007960]"
                  >
                    <option value="em_andamento">Em Andamento</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Observações / Anotações Técnicas</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Número de Ordem de Serviço, fornecedor ou observação interna..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold transition-all shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Finalizar Plano de Ação com EVIDÊNCIA OBRIGATÓRIA */}
      {isFinalizeModalOpen && finalizingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-emerald-300 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-200 bg-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#007960] text-white flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Concluir Plano de Ação com Evidência Obrigatória
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Obrigatório anexar comprovante e descrever a execução
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFinalizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmFinalizeWithEvidence} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  {EMERGENCY_SYSTEM_LABELS[finalizingPlan.system]?.name} • {finalizingPlan.division}
                </span>
                <p className="font-bold text-slate-900">{finalizingPlan.itemChecked}</p>
                <p className="text-slate-600 text-[11px]">{finalizingPlan.nonConformityDescription}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  DESCRIÇÃO DETALHADA DA EVIDÊNCIA DE EXECUÇÃO: *
                </label>
                <textarea
                  rows={3}
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  required
                  placeholder="Descreva minuciosamente como a não conformidade foi sanada (ex: reparo realizado na válvula, peça substituída conforme OS 8412, teste hidrostático concluído com pressão nominal)..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  NOME DO ARQUIVO / COMPROVANTE ANEXADO: *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={evidenceAttachmentName}
                      onChange={(e) => setEvidenceAttachmentName(e.target.value)}
                      required
                      placeholder="Ex: Foto_Evidencia_Troca.jpg ou OS_Manutencao_381.pdf"
                      className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-[#007960]"
                    />
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <label className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#007960] font-bold border border-[#007960]/30 cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEvidenceAttachmentName(file.name);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    DATA DE CONCLUSÃO: *
                  </label>
                  <input
                    type="date"
                    value={evidenceDate}
                    onChange={(e) => setEvidenceDate(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    RESPONSÁVEL PELA VALIDAÇÃO: *
                  </label>
                  <input
                    type="text"
                    value={evidenceResponsible}
                    onChange={(e) => setEvidenceResponsible(e.target.value)}
                    required
                    placeholder="Nome do técnico SST / Brigadista..."
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>

              {evidenceSubmittedAttempt && (!evidenceDescription.trim() || !evidenceAttachmentName.trim()) && (
                <div className="p-2.5 rounded-lg bg-red-50 text-[#de2726] border border-red-200 text-[11px] font-bold">
                  Atenção: A descrição da evidência e o nome do comprovante são de preenchimento obrigatório para finalizar o plano de ação.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!evidenceDescription.trim() || !evidenceAttachmentName.trim()}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold transition-all shadow-xs ${
                    evidenceDescription.trim() && evidenceAttachmentName.trim()
                      ? 'bg-[#007960] hover:bg-[#005a47] text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Validar e Finalizar com Evidência</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
