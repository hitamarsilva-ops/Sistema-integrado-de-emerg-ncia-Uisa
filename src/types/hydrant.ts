export type HydrantType =
  | 'coluna_dupla'
  | 'coluna_simples'
  | 'parede_embutido'
  | 'canhao_monitor';

export type HydrantSector =
  | 'industria'
  | 'empacotamento'
  | 'adm_agricola'
  | 'posto_combustivel';

export type HoseType =
  | 'tipo_1_residencial'
  | 'tipo_2_comercial'
  | 'tipo_4_industrial_reforcada';

export type HydrantStatus =
  | 'operacional'
  | 'atencao'
  | 'em_manutencao'
  | 'obstruido';

export interface HydrantInspection {
  id: string;
  date: string;
  inspectorName: string;
  valveOperant: boolean; // Válvula globo sem emperramento
  cabinetConditionOk: boolean; // Abrigo limpo, pintado, sinalizado
  hoseTestedOk: boolean; // Mangueiras enroladas, secas e com teste em dia
  storzKeysPresent: boolean; // Chaves Storz presentes no abrigo
  nozzleOperant: boolean; // Esguicho regulável funcionando
  unobstructed: boolean; // Sem interferências ou bloqueios de acesso
  staticPressureBar?: number; // Pressão medida (bar ou kgf/cm²)
  result: 'aprovado' | 'reprovado' | 'ajuste_necessario';
  verificationMethod?: 'qr_scan' | 'manual_fallback';
  manualFallbackReason?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface Hydrant {
  id: string;
  code: string; // Ex: HID-IND-01, HID-EMP-02
  sector: HydrantSector;
  locationDetails: string;
  type: HydrantType;
  cabinetNumber?: string;
  hoseCount: number; // Ex: 2 lances
  hoseLengthMeters: number; // 15 ou 30m por lance
  hoseDiameterInches: string; // '1.1/2"' ou '2.1/2"'
  hoseType: HoseType;
  hoseLastHydrostaticTest: string; // YYYY-MM-DD
  hoseNextHydrostaticTest: string; // YYYY-MM-DD (Anual NBR 11861)
  storzKeysCount: number; // Qtd de chaves
  nozzleType: string; // Ex: 'Esguicho Regulável Vazão 1.1/2"' ou 'Esguicho Tronco-Cônico'
  hasFoamProportioner?: boolean; // Canhão/Proporcionador LGE para etanol
  nominalPressureKgf: number; // Pressão nominal esperada (ex: 7.5 Kgf/cm²)
  lastMeasuredPressureKgf?: number; // Última medição
  flowRateLpm?: number; // Vazão estimada L/min
  hoseManufacturer?: string; // Ex: 'RESIL' ou 'MOCELIM'
  sealCertificateNumber?: string; // Nº Lacre/Certificado NBR 12779 (Ex: '002', '027')
  testPressureKgf?: number; // Pressão de ensaio hidrostático da mangueira (Ex: 17,00 Kgf/cm²)
  inspectionCertificateOS?: string; // Relatório/OS nº (Ex: '2316231718', '2316231726', '2316231725')
  certificatePdfUrl?: string; // Link direto para o PDF anexado do certificado
  status: HydrantStatus;
  notes?: string;
  inspections: HydrantInspection[];
}
