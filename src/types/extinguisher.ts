export type ExtinguisherSector =
  | 'unidade_industrial'
  | 'empacotamento'
  | 'posto_combustivel'
  | 'adm'
  | 'almoxarifado_industria'
  | 'almoxarifado_empacotamento'
  | 'almoxarifado_adm'
  | 'almoxarifado'; // compatibilidade

export type WarehouseSector =
  | 'almoxarifado_industria'
  | 'almoxarifado_empacotamento'
  | 'almoxarifado_adm';

export type ExtinguisherType =
  | 'agua_pressurizada'
  | 'po_quimico_bc'
  | 'po_polivalente_abc'
  | 'co2'
  | 'espuma_mecanica'
  | 'po_classe_d';

export type ExtinguisherWeight =
  | '2kg'
  | '4kg'
  | '6kg'
  | '8kg'
  | '10L'
  | '12kg'
  | '50L Carreta'
  | string;

export type ExtinguisherStatus =
  | 'valido'
  | 'atencao'
  | 'vencido'
  | 'em_manutencao'
  | 'reserva_almoxarifado';

export type StockCondition =
  | 'pronto_uso'
  | 'aguardando_recarga'
  | 'novo'
  | 'em_manutencao';

export interface InspectionRecord {
  id: string;
  date: string;
  inspectorName: string;
  pressureGaugeOk: boolean;
  sealIntact: boolean;
  hoseNozzleOk: boolean;
  signageOk: boolean;
  unobstructed: boolean;
  weightMeasuredKg?: number;
  weightLossPercentage?: number;
  result: 'aprovado' | 'reprovado' | 'requer_ajuste';
  verificationMethod?: 'qr_scan' | 'manual_fallback';
  manualFallbackReason?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface Extinguisher {
  id: string;
  code: string; // Ex: EXT-IND-01, EXT-POSTO-02
  serialNumber: string;
  inmetroSeal: string;
  sector: ExtinguisherSector;
  locationDetails: string; // Ex: Ponto 04 - Próximo ao Tanque Diesel, Linha 1 de Empacotamento
  type: ExtinguisherType;
  capacityWeight: ExtinguisherWeight;
  grossWeightRefKg?: number; // Peso bruto com carga cheia (kg) - Crítico para CO2
  currentWeightKg?: number; // Peso atual medido na pesagem (kg)
  rechargeDate: string; // YYYY-MM-DD
  rechargeExpiryDate: string; // YYYY-MM-DD (Validade da Recarga - norma ABNT)
  hydrostaticTestDate: string; // YYYY-MM-DD
  hydrostaticExpiryDate: string; // YYYY-MM-DD (Reteste a cada 5 anos)
  lastInspectionDate?: string;
  pressureGaugeOk: boolean;
  sealIntact: boolean;
  hoseNozzleOk: boolean;
  signageOk: boolean;
  unobstructed: boolean;
  isStockInWarehouse: boolean; // Indica se está fisicamente no estoque/almoxarifado
  stockCondition?: StockCondition;
  supplierOrWorkshop?: string; // Ex: Empresa Credenciada Inmetro
  maintenanceOrder?: string; // Ex: OS-2026/08
  certificateNumber?: string; // Ex: CERT-SULBRASIL-2026-08
  notes?: string;
  // Campos de Controle de Estoque e Remessa Externa (solicitados pelo usuário)
  dispatchExitInvoiceNumber?: string; // Nota de saída
  dispatchReturnInvoiceNumber?: string; // Nota de retorno
  dispatchReturnDeadline?: string; // Prazo para retorno (YYYY-MM-DD)
  dispatchInvoiceAttachmentName?: string; // Nome do anexo da nota fiscal
  dispatchInvoiceAttachmentData?: string; // Dados/Base64 da nota fiscal anexada
  dispatchNotes?: string;
  createdAt: string;
  updatedAt: string;
  inspectionHistory: InspectionRecord[];
}

export interface SectorSummary {
  id: ExtinguisherSector;
  name: string;
  description: string;
  icon: string;
  color: string;
  total: number;
  valid: number;
  warning: number;
  expired: number;
  inStock: number;
}

export interface NotificationAlert {
  id: string;
  extinguisherId: string;
  extinguisherCode: string;
  sector: ExtinguisherSector;
  locationDetails: string;
  type: ExtinguisherType;
  capacityWeight: string;
  urgency: 'critica' | 'atencao' | 'informativa';
  title: string;
  message: string;
  daysRemaining: number;
  expiryDate: string;
  read: boolean;
  createdAt: string;
}

export interface AppSettings {
  warningThresholdDays: number; // Padrão: 30 dias para alerta amarelo
  criticalThresholdDays: number; // Padrão: 7 dias para alerta crítico
  enableSoundAlerts: boolean;
  enableDesktopNotifications: boolean;
  autoCheckIntervalMinutes: number;
  notificationEmailRecipient: string;
  companyName: string;
  industrialPlantName: string;
}
