export type PumpStationDivision = 'industria' | 'empacotamento' | 'posto_combustivel' | 'adm';

export interface DivisionPumpStationInfo {
  division: PumpStationDivision;
  name: string;
  shortName: string;
  location: string;
  tag: string;
  coveredAreas: string[];
  rtiCapacityLiters: number;
  rtiCapacityM3: number;
  nominalWorkingPressureKgf: number;
  nominalFlowM3h: number;
  dieselPumpSpec: {
    brand: string;
    model: string;
    rpm: number;
    powerHp: string;
    flowGpm: number;
    status: 'operante' | 'alerta' | 'manutencao';
  };
  electricPumpSpec: {
    brand: string;
    powerCv: number;
    voltage: string;
    flowGpm: number;
    status: 'operante' | 'alerta' | 'manutencao';
  };
  jockeyPumpSpec: {
    brand: string;
    powerCv: number;
    cutInPressureKgf: number;
    cutOutPressureKgf: number;
    status: 'operante' | 'alerta' | 'manutencao';
  };
  foamSystemLge?: {
    hasLge: boolean;
    tankCapacityLiters: number;
    foamType: string;
  };
  status: 'operante' | 'alerta' | 'manutencao';
  currentReservePercentage: number;
}

export const PUMP_STATIONS_BY_DIVISION: Record<PumpStationDivision, DivisionPumpStationInfo> = {
  industria: {
    division: 'industria',
    name: 'Estação de Bombas — Indústria',
    shortName: 'Indústria',
    location: 'Área Técnica de Incêndio — Indústria',
    tag: 'BCI-IND',
    coveredAreas: [
      'Parque de Tanques de Etanol & Carregamento',
      'Destilaria & Colunas de Destilação',
      'Moendas, Difusor & Pátio de Cana',
      'Caldeiras de Alta Pressão & COGEN',
      'Fábrica de Açúcar & Armazém de Bagaço',
      'Estação de Tratamento de Água (ETA / ETALG)',
    ],
    rtiCapacityLiters: 500000,
    rtiCapacityM3: 500,
    nominalWorkingPressureKgf: 8.0,
    nominalFlowM3h: 284,
    dieselPumpSpec: {
      brand: 'Cummins 6CTA 8.3 / KSB Meganorm',
      model: 'BCI-IND-D01',
      rpm: 2750,
      powerHp: '260 HP',
      flowGpm: 1250,
      status: 'operante',
    },
    electricPumpSpec: {
      brand: 'WEG W22 Premium',
      powerCv: 150,
      voltage: '440V Trifásico',
      flowGpm: 1000,
      status: 'operante',
    },
    jockeyPumpSpec: {
      brand: 'WEG Eletrobomba Vertical',
      powerCv: 7.5,
      cutInPressureKgf: 6.0,
      cutOutPressureKgf: 7.0,
      status: 'operante',
    },
    status: 'operante',
    currentReservePercentage: 100,
  },
  empacotamento: {
    division: 'empacotamento',
    name: 'Estação de Bombas — Unidade Assari (Empacotamento)',
    shortName: 'Empacotamento',
    location: 'Pátio Técnico de Apoio Assari (TAG 208001 / 204002)',
    tag: 'TAG 208001 / 204002',
    coveredAreas: [
      'Silos de Armazenagem de Açúcar Granulado',
      'Linhas de Empacotamento de 1kg, 2kg e 5kg',
      'Armazém de Paletes e Estocagem 01 & 02',
      'Doca de Carregamento & Expedição Assari',
      'Sistemas de Filtros e Despoeiramento',
    ],
    rtiCapacityLiters: 150000,
    rtiCapacityM3: 150,
    nominalWorkingPressureKgf: 7.0,
    nominalFlowM3h: 150,
    dieselPumpSpec: {
      brand: 'Motor MWM Sprint Turbo / Imbil',
      model: 'BCI-EMP-D02',
      rpm: 2200,
      powerHp: '85 HP',
      flowGpm: 600,
      status: 'operante',
    },
    electricPumpSpec: {
      brand: 'WEG W22 Plus',
      powerCv: 75,
      voltage: '380V Trifásico',
      flowGpm: 650,
      status: 'operante',
    },
    jockeyPumpSpec: {
      brand: 'KSB Hydrobloc Multiestágio',
      powerCv: 3.0,
      cutInPressureKgf: 5.5,
      cutOutPressureKgf: 6.5,
      status: 'operante',
    },
    status: 'operante',
    currentReservePercentage: 98,
  },
  posto_combustivel: {
    division: 'posto_combustivel',
    name: 'Estação de Bombas & LGE — Posto de Combustíveis & GMA',
    shortName: 'Posto Combustível',
    location: 'Área Técnica do Posto Central / Pátio GMA (TAG 308001 / 304001)',
    tag: 'TAG 308001 / 304001',
    coveredAreas: [
      'Ilhas de Abastecimento (Diesel S10, Gasolina e Etanol)',
      'Bacias de Contenção de Tanques de Combustível',
      'Pátio de Abastecimento de Comboios Agrícolas',
      'Oficinas Mecânicas de Manutenção Automotiva GMA',
      'Rampa de Lavagem & Troca de Lubrificantes',
    ],
    rtiCapacityLiters: 100000,
    rtiCapacityM3: 100,
    nominalWorkingPressureKgf: 6.5,
    nominalFlowM3h: 115,
    dieselPumpSpec: {
      brand: 'Yanmar Industrial / Schneider',
      model: 'BCI-PST-D01',
      rpm: 2400,
      powerHp: '45 HP',
      flowGpm: 450,
      status: 'operante',
    },
    electricPumpSpec: {
      brand: 'WEG W22 Ex-d Blindada à Prova de Explosão',
      powerCv: 50,
      voltage: '380V Trifásico (Zona 1/2)',
      flowGpm: 500,
      status: 'operante',
    },
    jockeyPumpSpec: {
      brand: 'Schneider BC-92',
      powerCv: 2.5,
      cutInPressureKgf: 5.0,
      cutOutPressureKgf: 6.0,
      status: 'operante',
    },
    foamSystemLge: {
      hasLge: true,
      tankCapacityLiters: 1000,
      foamType: 'LGE AFFF/ARC 3% Proporcional',
    },
    status: 'operante',
    currentReservePercentage: 100,
  },
  adm: {
    division: 'adm',
    name: 'Estação de Pressurização e Combate — ADM/GMA',
    shortName: 'ADM/GMA',
    location: 'Complexo Administrativo & Pátio GMA',
    tag: 'BCI-ADM-GMA',
    coveredAreas: [
      'Prédio Administrativo Central (Escritórios e Diretoria)',
      'Datacenter / CPD & Sala de Servidores de TI',
      'Ambulatório Médico & Saúde Ocupacional',
      'Refeitório Geral & Cozinha Industrial',
      'Portaria Principal & Recepção de Visitantes',
    ],
    rtiCapacityLiters: 60000,
    rtiCapacityM3: 60,
    nominalWorkingPressureKgf: 5.0,
    nominalFlowM3h: 60,
    dieselPumpSpec: {
      brand: 'Grupo Gerador QTA Cummins Power',
      model: 'QTA-ADM-60kVA',
      rpm: 1800,
      powerHp: '60 kVA (Transferência 8s)',
      flowGpm: 300,
      status: 'operante',
    },
    electricPumpSpec: {
      brand: 'Eletrobomba Predial WEG',
      powerCv: 25,
      voltage: '220/380V Trifásico',
      flowGpm: 260,
      status: 'operante',
    },
    jockeyPumpSpec: {
      brand: 'Dancor Autoaspirante Pressurizadora',
      powerCv: 2.0,
      cutInPressureKgf: 4.0,
      cutOutPressureKgf: 5.0,
      status: 'operante',
    },
    status: 'operante',
    currentReservePercentage: 100,
  },
};

export interface PumpTestRecord {
  id: string;
  division?: PumpStationDivision;
  weekLabel: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  motorTags: string;

  // Bomba Diesel - Motor Desligado
  preHeatingJacketWarmed: boolean; // Camisa de aquecimento (pré aquecedor)
  oilLevelNormal: boolean; // Nível óleo lubrificante (vareta)
  coolantLevelNormal: boolean; // Nível refrigerante (aditivo >= 50%)
  oilFilterNormal: boolean; // Filtro de óleo lubrificante
  batteryCablesConnected: boolean; // Cabos das baterias 1 e 2 conectados
  electrolyteDensityOk: boolean; // Densidade do eletrólito
  batteryCablesCorrosionNormal: boolean; // Cabos das baterias sem corrosão / apertados

  // Bomba Diesel - Motor Ligado por 30 min pelo pressostato
  dieselRpm: number; // Rotação do motor (rpm)
  coolingWaterFlowNormal: boolean; // Vazão de água arrefecimento
  packingSealNormal: boolean; // Gaxetas pequeno fluxo normal
  abnormalVibration: boolean; // Vibração ou som estranho
  dieselSystemInAutoAfterTest: boolean; // Sistema no automático depois dos testes

  // Bomba Jockey
  jockeyNoiseLeak: boolean; // Barulho ou vazamento
  jockeyStartPressureKgf: number; // Pressão de partida (Kgf)
  jockeyStopPressureKgf: number; // Pressão de parada automática (Kgf)
  jockeyAlarmTripped: boolean; // Painel acusou alarme
  jockeySystemInAutoAfterTest: boolean; // Sistema no automático pós teste

  // Painel de Controle
  panelLedsNormal: boolean; // LEDs das luzes normais
  switchButtonFault: boolean; // Irregularidade botões/chaves
  panelIdentifiedAndOperant: boolean; // Painel elétrico identificado e operante

  // Bomba Elétrica
  electricMotorHpApproved: boolean; // Especificação potência CV/HP aprovado
  independentElectricalConnection: boolean; // BCI ligação elétrica independente
  extinguishersPresentAtStation: boolean; // Existe extintor de incêndio na casa de bombas
  electricPanelIdentifiedAndOperant: boolean; // Painel elétrico operante
  electricPumpNoiseLeak: boolean; // Barulho ou vazamento
  testedManualAndAuto: boolean; // Testado modo manual e automático
  electricSystemInAutoAfterTest: boolean; // Sistema no automático após teste

  // Reservatórios de Óleo Diesel
  dieselFuelLevelOk: boolean; // Nível a 3/4 do volume máximo
  dieselFuelTankLeak: boolean; // Vazamento
  dieselTankValveOpenLocked: boolean; // Válvula trancada aberta

  // Reservatório de Água de Incêndio (RTI)
  waterTankLeak: boolean; // Vazamento
  waterTankFull: boolean; // Nível do tanque cheio
  waterReservePercentage: number; // % da reserva técnica de incêndio

  // Observações e Equipe
  generatorFuelLevelPercentage: number; // Nível combustível gerador
  brigadeLeaderName: string;
  brigadeLeaderSignature: string;
  electricianName: string;
  electricianSignature: string;
  importantNotes: string;
  recommendedMaintenance: string;
}

export interface PumpStationMetadata {
  documentCode: string; // Doc.: SST.RE-094
  documentDate: string; // 21/05/2025
  revision: string; // 00
  title: string;
  location: string;
  pdfAssetPath: string;
}

export const PUMP_STATION_METADATA: PumpStationMetadata = {
  documentCode: 'SST.RE-094',
  documentDate: '21/05/2025',
  revision: '00',
  title: 'CHECKLIST - TESTE SISTEMA DE INCÊNDIO (CASA DE BOMBAS)',
  location: 'Casa de Bombas - uisa (Divisões: Indústria, Empacotamento, Posto, ADM)',
  pdfAssetPath: '/assets/aistudio/SST.RE-094_Teste_Bombas_Inc_ndio_2025__1__755f1e54.pdf',
};

// Testes divididos por setor operacional
export const PUMP_STATION_SEPTEMBER_2026_TESTS: PumpTestRecord[] = [
  // --- INDÚSTRIA ---
  {
    id: 'pump-test-ind-01',
    division: 'industria',
    weekLabel: 'Semana 1 - 04/09/2026',
    date: '2026-09-04',
    time: '15:00 h',
    location: 'Casa de Bombas Usari (Indústria)',
    motorTags: '108005 / 104001',
    preHeatingJacketWarmed: false,
    oilLevelNormal: true,
    coolantLevelNormal: true,
    oilFilterNormal: true,
    batteryCablesConnected: true,
    electrolyteDensityOk: true,
    batteryCablesCorrosionNormal: true,
    dieselRpm: 2750,
    coolingWaterFlowNormal: true,
    packingSealNormal: true,
    abnormalVibration: false,
    dieselSystemInAutoAfterTest: true,
    jockeyNoiseLeak: false,
    jockeyStartPressureKgf: 6.0,
    jockeyStopPressureKgf: 7.0,
    jockeyAlarmTripped: false,
    jockeySystemInAutoAfterTest: true,
    panelLedsNormal: true,
    switchButtonFault: false,
    panelIdentifiedAndOperant: true,
    electricMotorHpApproved: true,
    independentElectricalConnection: true,
    extinguishersPresentAtStation: true,
    electricPanelIdentifiedAndOperant: true,
    electricPumpNoiseLeak: false,
    testedManualAndAuto: true,
    electricSystemInAutoAfterTest: true,
    dieselFuelLevelOk: true,
    dieselFuelTankLeak: false,
    dieselTankValveOpenLocked: true,
    waterTankLeak: false,
    waterTankFull: true,
    waterReservePercentage: 100,
    generatorFuelLevelPercentage: 75,
    brigadeLeaderName: 'Maria Ap. S. Guimarães',
    brigadeLeaderSignature: 'Maria Ap.',
    electricianName: 'Jardiel Feitosa',
    electricianSignature: 'Jardiel Feitosa',
    importantNotes: 'Partida automática por pressostato em 6.0 kgf/cm² plenamente executada. Nível de diesel do gerador em 75%.',
    recommendedMaintenance: 'Inspecionar resistência da camisa de aquecimento do pré-aquecedor da motobomba diesel.',
  },
  {
    id: 'pump-test-ind-02',
    division: 'industria',
    weekLabel: 'Semana 2 - 11/09/2026',
    date: '2026-09-11',
    time: '08:45 h',
    location: 'Casa de Bombas Usari (Indústria)',
    motorTags: '108005 / 104001',
    preHeatingJacketWarmed: false,
    oilLevelNormal: true,
    coolantLevelNormal: true,
    oilFilterNormal: true,
    batteryCablesConnected: true,
    electrolyteDensityOk: true,
    batteryCablesCorrosionNormal: true,
    dieselRpm: 2750,
    coolingWaterFlowNormal: true,
    packingSealNormal: true,
    abnormalVibration: false,
    dieselSystemInAutoAfterTest: true,
    jockeyNoiseLeak: false,
    jockeyStartPressureKgf: 6.0,
    jockeyStopPressureKgf: 7.0,
    jockeyAlarmTripped: false,
    jockeySystemInAutoAfterTest: true,
    panelLedsNormal: true,
    switchButtonFault: false,
    panelIdentifiedAndOperant: true,
    electricMotorHpApproved: true,
    independentElectricalConnection: true,
    extinguishersPresentAtStation: true,
    electricPanelIdentifiedAndOperant: true,
    electricPumpNoiseLeak: false,
    testedManualAndAuto: true,
    electricSystemInAutoAfterTest: true,
    dieselFuelLevelOk: true,
    dieselFuelTankLeak: false,
    dieselTankValveOpenLocked: true,
    waterTankLeak: false,
    waterTankFull: true,
    waterReservePercentage: 99,
    generatorFuelLevelPercentage: 80,
    brigadeLeaderName: 'Maria Ap. S. Guimarães',
    brigadeLeaderSignature: 'Maria Ap.',
    electricianName: 'Jardiel Feitosa',
    electricianSignature: 'Jardiel Feitosa',
    importantNotes: 'Nível da RTI em 99%. Teste de chave de transferência de baterias 1 e 2 operando normalmente.',
    recommendedMaintenance: 'Ajuste fino no selo mecânico da bomba jockey.',
  },

  // --- EMPACOTAMENTO (ASSARI) ---
  {
    id: 'pump-test-emp-01',
    division: 'empacotamento',
    weekLabel: 'Semana 1 - 05/09/2026',
    date: '2026-09-05',
    time: '10:00 h',
    location: 'Estação de Bombas Assari (Empacotamento)',
    motorTags: '208001 / 204002',
    preHeatingJacketWarmed: true,
    oilLevelNormal: true,
    coolantLevelNormal: true,
    oilFilterNormal: true,
    batteryCablesConnected: true,
    electrolyteDensityOk: true,
    batteryCablesCorrosionNormal: true,
    dieselRpm: 2200,
    coolingWaterFlowNormal: true,
    packingSealNormal: true,
    abnormalVibration: false,
    dieselSystemInAutoAfterTest: true,
    jockeyNoiseLeak: false,
    jockeyStartPressureKgf: 5.5,
    jockeyStopPressureKgf: 6.5,
    jockeyAlarmTripped: false,
    jockeySystemInAutoAfterTest: true,
    panelLedsNormal: true,
    switchButtonFault: false,
    panelIdentifiedAndOperant: true,
    electricMotorHpApproved: true,
    independentElectricalConnection: true,
    extinguishersPresentAtStation: true,
    electricPanelIdentifiedAndOperant: true,
    electricPumpNoiseLeak: false,
    testedManualAndAuto: true,
    electricSystemInAutoAfterTest: true,
    dieselFuelLevelOk: true,
    dieselFuelTankLeak: false,
    dieselTankValveOpenLocked: true,
    waterTankLeak: false,
    waterTankFull: true,
    waterReservePercentage: 98,
    generatorFuelLevelPercentage: 90,
    brigadeLeaderName: 'Silvano F. Cruz',
    brigadeLeaderSignature: 'Silvano Cruz',
    electricianName: 'Robson G. Pires',
    electricianSignature: 'Robson Pires',
    importantNotes: 'Sistema da Unidade de Empacotamento Assari em pleno funcionamento. Pressão estável em 6.5 kgf/cm² na doca.',
    recommendedMaintenance: 'Limpeza semestral do filtro Y na sucção do reservatório de 150m³.',
  },

  // --- POSTO DE COMBUSTÍVEL ---
  {
    id: 'pump-test-pst-01',
    division: 'posto_combustivel',
    weekLabel: 'Semana 1 - 06/09/2026',
    date: '2026-09-06',
    time: '14:20 h',
    location: 'Estação de Bombas Posto / GMA',
    motorTags: '308001 / 304001',
    preHeatingJacketWarmed: true,
    oilLevelNormal: true,
    coolantLevelNormal: true,
    oilFilterNormal: true,
    batteryCablesConnected: true,
    electrolyteDensityOk: true,
    batteryCablesCorrosionNormal: true,
    dieselRpm: 2400,
    coolingWaterFlowNormal: true,
    packingSealNormal: true,
    abnormalVibration: false,
    dieselSystemInAutoAfterTest: true,
    jockeyNoiseLeak: false,
    jockeyStartPressureKgf: 5.0,
    jockeyStopPressureKgf: 6.0,
    jockeyAlarmTripped: false,
    jockeySystemInAutoAfterTest: true,
    panelLedsNormal: true,
    switchButtonFault: false,
    panelIdentifiedAndOperant: true,
    electricMotorHpApproved: true,
    independentElectricalConnection: true,
    extinguishersPresentAtStation: true,
    electricPanelIdentifiedAndOperant: true,
    electricPumpNoiseLeak: false,
    testedManualAndAuto: true,
    electricSystemInAutoAfterTest: true,
    dieselFuelLevelOk: true,
    dieselFuelTankLeak: false,
    dieselTankValveOpenLocked: true,
    waterTankLeak: false,
    waterTankFull: true,
    waterReservePercentage: 100,
    generatorFuelLevelPercentage: 88,
    brigadeLeaderName: 'Claudionor V. Matos',
    brigadeLeaderSignature: 'C. Matos',
    electricianName: 'Jardiel Feitosa',
    electricianSignature: 'Jardiel Feitosa',
    importantNotes: 'Teste de dosador do tanque de LGE 1.000 L com os canhões monitores do posto de combustível aprovado com sucesso.',
    recommendedMaintenance: 'Revisão periódica dos anéis O-ring das conexões Storz de espuma.',
  },

  // --- ADM (ADMINISTRATIVO) ---
  {
    id: 'pump-test-adm-01',
    division: 'adm',
    weekLabel: 'Semana 1 - 07/09/2026',
    date: '2026-09-07',
    time: '09:10 h',
    location: 'Estação Predial ADM / CPD',
    motorTags: '408001 / 404001',
    preHeatingJacketWarmed: true,
    oilLevelNormal: true,
    coolantLevelNormal: true,
    oilFilterNormal: true,
    batteryCablesConnected: true,
    electrolyteDensityOk: true,
    batteryCablesCorrosionNormal: true,
    dieselRpm: 1800,
    coolingWaterFlowNormal: true,
    packingSealNormal: true,
    abnormalVibration: false,
    dieselSystemInAutoAfterTest: true,
    jockeyNoiseLeak: false,
    jockeyStartPressureKgf: 4.0,
    jockeyStopPressureKgf: 5.0,
    jockeyAlarmTripped: false,
    jockeySystemInAutoAfterTest: true,
    panelLedsNormal: true,
    switchButtonFault: false,
    panelIdentifiedAndOperant: true,
    electricMotorHpApproved: true,
    independentElectricalConnection: true,
    extinguishersPresentAtStation: true,
    electricPanelIdentifiedAndOperant: true,
    electricPumpNoiseLeak: false,
    testedManualAndAuto: true,
    electricSystemInAutoAfterTest: true,
    dieselFuelLevelOk: true,
    dieselFuelTankLeak: false,
    dieselTankValveOpenLocked: true,
    waterTankLeak: false,
    waterTankFull: true,
    waterReservePercentage: 100,
    generatorFuelLevelPercentage: 95,
    brigadeLeaderName: 'Silvia Sobrinho',
    brigadeLeaderSignature: 'Silvia S.',
    electricianName: 'Jardiel Feitosa',
    electricianSignature: 'Jardiel Feitosa',
    importantNotes: 'Rede hidrante predial e sprinkler do CPD em pleno funcionamento com 5.0 kgf/cm². QTA operante.',
    recommendedMaintenance: 'Inspeção mensal no alarme de fluxo de água do CPD.',
  },
];
