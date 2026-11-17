export type AlarmDivision = 'INDUSTRIA' | 'EMPACOTAMENTO' | 'POSTO DE COMBUSTIVEL' | 'ADM/GMA';

export type AlarmEvaluation = 'C' | 'NC' | 'N/A';

export interface AlarmChecklistItem {
  id: string;
  category: 'CENTRAL' | 'ACIONADOR MANUAL' | 'SIRENES' | 'DETECTORES DE FUMAÇA';
  question: string;
  status: AlarmEvaluation | null; // null = não preenchido
  observation?: string;
  photoAttached?: boolean;
}

export interface AlarmInspectionRecord {
  id: string;
  division: AlarmDivision;
  docNumber: string; // 'SST.RE-020'
  revision: string; // '02'
  docDate: string; // '06/11/2026'
  company: string; // 'uisa'
  inspectorName: string;
  sectorsCovered: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  items: AlarmChecklistItem[];
  anomaliesOrComments: string;
  hasNonConformity: boolean;
  actionPlanGeneratedId?: string;
  createdAt: string;
}

export const OFFICIAL_ALARM_QUESTIONS: {
  id: string;
  category: 'CENTRAL' | 'ACIONADOR MANUAL' | 'SIRENES' | 'DETECTORES DE FUMAÇA';
  question: string;
}[] = [
  // 1. CENTRAL
  { id: 'cnt_1', category: 'CENTRAL', question: 'Sinal sonoro' },
  { id: 'cnt_2', category: 'CENTRAL', question: 'Localização do acionamento na tela da central' },
  { id: 'cnt_3', category: 'CENTRAL', question: 'Sinal de internet' },
  { id: 'cnt_4', category: 'CENTRAL', question: 'Central apresenta falha' },
  { id: 'cnt_5', category: 'CENTRAL', question: 'Alarme acionado pela central (Aviso de brigada e abandono geral)' },
  { id: 'cnt_6', category: 'CENTRAL', question: 'Reset' },
  { id: 'cnt_7', category: 'CENTRAL', question: 'Placa de sinalização' },

  // 2. ACIONADOR MANUAL
  { id: 'acm_1', category: 'ACIONADOR MANUAL', question: 'Vidro e botão de acionamento' },
  { id: 'acm_2', category: 'ACIONADOR MANUAL', question: 'Funcionamento (comunicação com a central de alarmes)' },
  { id: 'acm_3', category: 'ACIONADOR MANUAL', question: 'Placa de sinalização' },
  { id: 'acm_4', category: 'ACIONADOR MANUAL', question: 'Funcionamento' },

  // 3. SIRENES
  { id: 'sir_1', category: 'SIRENES', question: 'Sinalizador luminoso' },
  { id: 'sir_2', category: 'SIRENES', question: 'Placa de sinalização' },
  { id: 'sir_3', category: 'SIRENES', question: 'Sinalizador sonoro' },

  // 4. DETECTORES DE FUMAÇA
  { id: 'det_1', category: 'DETECTORES DE FUMAÇA', question: 'Funcionamento (comunicação com a central de alarmes)' },
];
