export type EmergencySystem = 'bombas' | 'extintores' | 'hidrantes' | 'alarmes' | 'caminhao_pipa';

export type ActionPlanDivision = 'INDUSTRIA' | 'EMPACOTAMENTO' | 'POSTO DE COMBUSTIVEL' | 'ADM/GMA';

export type ActionPlanStatus = 'atrasado' | 'em_andamento' | 'finalizado';

export type ActionPlanPriority = 'alta' | 'media' | 'baixa';

export interface ActionPlanItem {
  id: string;
  system: EmergencySystem;
  division: ActionPlanDivision;
  checklistDoc?: string; // ex: SST.RE-020, SST.RE-094, SST.RE-109, NBR 13714, NBR 12962
  itemChecked: string; // Título/Item inspecionado com defeito
  nonConformityDescription: string; // Descrição detalhada da não conformidade
  correctiveAction: string; // Ação corretiva necessária / editável
  deadline: string; // YYYY-MM-DD
  responsible: string; // Responsável pela ação
  status: ActionPlanStatus;
  priority: ActionPlanPriority;
  createdAt: string; // YYYY-MM-DD
  completedAt?: string; // YYYY-MM-DD quando finalizado
  notes?: string;
  // Campos obrigatórios para encerramento de plano de ação (conforme solicitação)
  evidenceOfExecution?: string; // Descrição detalhada da evidência de execução
  evidenceAttachmentName?: string; // Nome do anexo/documento comprobatório
  evidenceAttachmentData?: string; // Base64 da imagem/comprovante
  evidenceDate?: string; // Data da evidência
  evidenceResponsible?: string; // Responsável pela comprovação
}

export const EMERGENCY_SYSTEM_LABELS: Record<EmergencySystem, { name: string; shortName: string; color: string; badgeBg: string }> = {
  bombas: {
    name: 'Bomba de Combate a Incêndio',
    shortName: 'Bombas BCI',
    color: '#007960',
    badgeBg: 'bg-emerald-50 text-[#007960] border-emerald-200',
  },
  extintores: {
    name: 'Extintores de Incêndio',
    shortName: 'Extintores',
    color: '#f58220',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  hidrantes: {
    name: 'Rede de Hidrantes & Mangueiras',
    shortName: 'Hidrantes',
    color: '#0284c7',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  alarmes: {
    name: 'Sistema de Alarme e Detecção',
    shortName: 'Alarmes',
    color: '#de2726',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  caminhao_pipa: {
    name: 'Caminhão Bombeiro (Pipa)',
    shortName: 'Caminhão Bombeiro',
    color: '#d97706',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
};

export const ACTION_PLAN_STATUS_LABELS: Record<ActionPlanStatus, { label: string; color: string; badgeBg: string; textClass: string }> = {
  atrasado: {
    label: 'Atrasado',
    color: '#de2726',
    badgeBg: 'bg-red-50 border-red-200 text-[#de2726]',
    textClass: 'text-[#de2726]',
  },
  em_andamento: {
    label: 'Em Andamento',
    color: '#f58220',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    textClass: 'text-amber-700',
  },
  finalizado: {
    label: 'Finalizado',
    color: '#007960',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-[#007960]',
    textClass: 'text-[#007960]',
  },
};
