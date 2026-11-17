export type BrigadeUnit =
  | 'industria'
  | 'empacotamento'
  | 'adm'
  | 'posto_combustivel'
  | 'brigada_florestal';

export type BrigadeShift = 'turno_a' | 'turno_b' | 'turno_c' | 'administrativo';

export type BrigadeRole =
  | 'comandante'
  | 'subcomandante'
  | 'lider_turno'
  | 'lider_setor'
  | 'brigadista'
  | 'socorrista'
  | 'operador_valvula'
  | 'eletricista'
  | 'operador_bomba'
  | 'operador_pipa'
  | 'apoio_tecnico';

export type BrigadeStatus = 'ativo_plantao' | 'folga' | 'ferias' | 'afastado';

export type TrainingLevel = 'basico' | 'intermediario' | 'avancado';

export interface BrigadeMember {
  id: string;
  name: string;
  registrationNumber?: string; // Matrícula ou RE
  unit?: BrigadeUnit;
  sector?: string; // Retrocompatibilidade (exibe unidade correspondente)
  shift: BrigadeShift;
  role: BrigadeRole;
  specificAssignment?: string; // Atribuição tática específica (ex: Válvula Etanol ESD, Pipa 03, Casa de Bombas)
  phone: string;
  radioCallsign: string; // Ex: BRIGADA-IND-01 (Canal 01)
  trainingCertificationDate: string; // Data de conclusão (YYYY-MM-DD)
  trainingExpiryDate?: string; // Validade anual NBR 14276 / NR-23 (YYYY-MM-DD)
  medicalCheckDate: string; // Data ASO (YYYY-MM-DD)
  medicalExpiryDate?: string;
  status?: BrigadeStatus;
  trainingLevel?: TrainingLevel;
  hasScbaTraining?: boolean; // Treinamento para Máscara Autônoma / EPR
  bloodType?: string; // Ex: O+, A+, B+
  ppeKits?: string[]; // EPIs vinculados (Capacete, Nomex, Bota, etc)
  notes?: string;
}

export interface UnitInfo {
  id: BrigadeUnit;
  name: string;
  shortName: string;
  description: string;
  color: string;
  bgBadge: string;
  borderBadge: string;
  emergencyPhone: string;
  radioChannel: string;
  minHeadcountPerShift: {
    turno_a: number;
    turno_b: number;
    turno_c: number;
    administrativo: number;
  };
}

export interface ShiftInfo {
  id: BrigadeShift;
  name: string;
  hours: string;
  scheduleDescription: string;
  color: string;
}
