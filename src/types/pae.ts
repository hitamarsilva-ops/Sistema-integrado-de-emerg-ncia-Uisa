export type EmergencyLevel = 'nivel_1_local' | 'nivel_2_setorial' | 'nivel_3_geral';

export interface EmergencyContact {
  id: string;
  role: string;
  name: string;
  radioChannel: string;
  internalExtension: string;
  externalPhone: string;
  area: string;
  isUrgentDirect: boolean;
}

export type { BrigadeMember } from './brigade';

export interface EmergencyScenarioProtocol {
  id: string;
  title: string;
  category: 'incendio' | 'quimico' | 'espaco_confinado' | 'altura' | 'agricola' | 'explosao';
  code: string;
  riskRating: 'critico' | 'alto' | 'medio';
  immediateActions: string[];
  secondaryActions: string[];
  evacuationTrigger: string;
  requiredPPE: string[];
  isolationPerimeterMeters: number;
  tacticalNotes: string;
}

export interface MusterPoint {
  id: string;
  code: string; // Ex: PEE-01
  name: string;
  location: string;
  associatedSectors: string[];
  capacityPeople: number;
  leaderResponsible: string;
  equippedWithFirstAidKit: boolean;
  equippedWithMegaphone: boolean;
  notes: string;
}

export interface DrillRecord {
  id: string;
  title: string;
  date: string;
  sector: string;
  scenario: string;
  evacuatedHeadcount: number;
  targetResponseTimeMinutes: number;
  actualResponseTimeMinutes: number;
  ratingScore: number; // 0 to 10
  identifiedGaps: string[];
  actionPlans: string[];
  brigadeLeader: string;
}

export type DrillScheduleDocCode = 'SST.RE-105' | 'SST.RE-104' | 'SST.RE-085';

export interface DrillScheduleDocument {
  code: DrillScheduleDocCode;
  title: string;
  subtitle: string;
  revision: string;
  date: string;
  pages: string;
  yearRange: string;
  pdfAssetPath: string;
}

export interface DrillFiscalMonth {
  key: string; // 'YYYY-MM' (e.g., '2026-04' .. '2027-03')
  letter: string; // 'A' | 'M' | 'J' | ...
  shortLabel: string; // 'Abr/26'
  fullLabel: string; // 'Abril/2026'
}

export interface RaseTechnicalParticipant {
  id: string;
  name: string;
  role: string;
  signatureDataUrl?: string;
  signatureMode?: 'rubrica' | 'facial';
  signedAt?: string;
}

export interface RasePhotoAttachment {
  id: string;
  fileName: string;
  dataUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface RaseReport {
  id: string;
  docCode: 'SST.RE-085';
  revision: '00';
  scheduleItemId?: string;
  scheduleMonthKey?: string;
  // 1- INFORMAÇÕES GERAIS
  drillExercise: string;
  date: string;
  time: string;
  location: string;
  // 2- DESCRIÇÃO DA OCORRÊNCIA
  occurrenceDescription: string;
  // 3- DESENCADEAMENTO DAS AÇÕES DE EMERGÊNCIA
  emergencyActionsTrigger: string;
  // 4- CRONOLOGIA DAS AÇÕES
  actionsChronology: string;
  // 5- PRINCIPAIS DESVIOS OBSERVADOS
  observedDeviations: string;
  // 6- PRINCIPAIS PONTOS POSITIVOS
  positivePoints: string;
  // 7- ANÁLISE CRÍTICA DE AVALIAÇÃO E EFICÁCIA DO SIMULADO
  criticalEffectivenessAnalysis: string;
  // 8- PARTICIPANTES DA EQUIPE TÉCNICA SST
  sstParticipants: RaseTechnicalParticipant[];
  attendanceListAttachedName?: string;
  attendanceListAttachedData?: string;
  // 9- ARQUIVOS FOTOGRÁFICOS
  isClassifiedAreaNoElectronics: boolean;
  photoAttachments: RasePhotoAttachment[];
  // Métricas complementares
  participantsCount?: number;
  responseTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DrillMonthExecution {
  plannedDate?: string; // YYYY-MM-DD optional exact scheduled day
  plannedTime?: string; // HH:MM optional
  completed: boolean;
  completedDate?: string; // YYYY-MM-DD
  participantsCount?: number;
  responseTimeMinutes?: number;
  notes?: string;
  reminderMuted?: boolean;
  raseReport?: RaseReport;
}

export interface DrillScheduleItem {
  id: string;
  docCode: 'SST.RE-105' | 'SST.RE-104';
  scenario: string;
  responsible: string;
  brigadeTeam: string;
  area: string;
  plannedMonths: string[]; // ['2026-11', ...]
  executions: Record<string, DrillMonthExecution>; // keyed by 'YYYY-MM'
}


