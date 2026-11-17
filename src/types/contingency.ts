export type ContingencyDivision = 'industria' | 'empacotamento' | 'adm_agricola';

export type RiskLevel = 'critico' | 'alto' | 'moderado';

export interface ActionChecklistItem {
  id: string;
  order: number;
  timeframe: string; // Ex: '0 - 5 min', '5 - 15 min', '15 - 30 min'
  action: string;
  responsibleRole: string;
  completed?: boolean;
}

export interface ContingencyPlan {
  id: string;
  division: ContingencyDivision;
  code: string; // Ex: PC-IND-01, PC-EMP-02, PC-AGR-03
  title: string;
  subArea: string; // Ex: 'Parque de Tanques e Destilaria', 'Silos de Sacarose', 'Canavial / Colheita Mecanizada'
  scenarioDescription: string;
  riskRating: RiskLevel;
  triggerEvent: string; // O evento gatilho que ativa a contingência
  isolationRadiusMeters: number;
  containmentProcedures: string[];
  shutdownProcedures: string[]; // Desligamentos de emergência / intertravamentos ESD
  requiredPPEAndEquipment: string[];
  brigadeTactic: string;
  externalSupportTrigger: string; // Quando acionar Bombeiros 193 / PAM
  evacuationRouteDetails: string;
  checklist: ActionChecklistItem[];
  lastReviewDate: string;
  responsibleManager: string;
}
