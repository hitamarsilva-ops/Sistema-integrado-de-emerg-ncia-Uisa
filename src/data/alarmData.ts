import { AlarmDivision, AlarmInspectionRecord, OFFICIAL_ALARM_QUESTIONS } from '../types/alarm';

export interface AlarmUnitInfo {
  division: AlarmDivision;
  name: string;
  centralModel: string;
  location: string;
  zonesCount: number;
  manualPullStationsCount: number;
  sirensCount: number;
  smokeDetectorsCount: number;
  status: 'operante' | 'atencao' | 'manutencao';
  lastInspectionDate: string;
}

export const ALARM_UNITS: Record<AlarmDivision, AlarmUnitInfo> = {
  INDUSTRIA: {
    division: 'INDUSTRIA',
    name: 'Central Principal de Alarme - Indústria',
    centralModel: 'Notifier NFS2-3030 Endereçável / Intelbras CIE 1250',
    location: 'Sala de Controle / Sala de Instrumentação Indústria',
    zonesCount: 16,
    manualPullStationsCount: 38,
    sirensCount: 24,
    smokeDetectorsCount: 65,
    status: 'atencao',
    lastInspectionDate: '2026-11-06',
  },
  EMPACOTAMENTO: {
    division: 'EMPACOTAMENTO',
    name: 'Central de Alarme - Unidade Empacotamento Assari',
    centralModel: 'Intelbras Endereçável CIE 1060',
    location: 'Cabine de Operação Linhas de Açúcar / Doca 01',
    zonesCount: 8,
    manualPullStationsCount: 18,
    sirensCount: 12,
    smokeDetectorsCount: 32,
    status: 'operante',
    lastInspectionDate: '2026-11-06',
  },
  'POSTO DE COMBUSTIVEL': {
    division: 'POSTO DE COMBUSTIVEL',
    name: 'Sistema de Alarme Ex-d - Posto de Combustíveis & GMA',
    centralModel: 'Central Convencional à Prova de Explosão / Zener',
    location: 'Guarita Técnica de Abastecimento Posto Central',
    zonesCount: 4,
    manualPullStationsCount: 8,
    sirensCount: 6,
    smokeDetectorsCount: 10,
    status: 'operante',
    lastInspectionDate: '2026-11-06',
  },
  'ADM/GMA': {
    division: 'ADM/GMA',
    name: 'Central Predial de Alarme - Complexo ADM / GMA',
    centralModel: 'Intelbras CIE 1060 Microprocessada',
    location: 'Recepção Central / Sala de TI & Datacenter',
    zonesCount: 6,
    manualPullStationsCount: 14,
    sirensCount: 10,
    smokeDetectorsCount: 28,
    status: 'operante',
    lastInspectionDate: '2026-11-06',
  },
};

export const INITIAL_ALARM_INSPECTIONS: AlarmInspectionRecord[] = [
  {
    id: 'insp-alm-ind-01',
    division: 'INDUSTRIA',
    docNumber: 'SST.RE-020',
    revision: '02',
    docDate: '06/11/2026',
    company: 'uisa',
    inspectorName: 'Maria Ap. S. Guimarães',
    sectorsCovered: 'Destilaria, Caldeiras, Moenda, Parque de Tanques',
    date: '2026-11-06',
    time: '08:30',
    items: OFFICIAL_ALARM_QUESTIONS.map((q) => {
      if (q.id === 'cnt_3') {
        return {
          ...q,
          status: 'NC',
          observation: 'Sinal de internet instável no switch de automação da central.',
        };
      }
      return {
        ...q,
        status: 'C',
      };
    }),
    anomaliesOrComments: 'Central em operação normal com sonorização e laço de detecção íntegros. Detectada perda momentânea de conexão de rede Ethernet da telemetria.',
    hasNonConformity: true,
    actionPlanGeneratedId: 'pa-alm-01',
    createdAt: '2026-11-06T08:45:00Z',
  },
  {
    id: 'insp-alm-emp-01',
    division: 'EMPACOTAMENTO',
    docNumber: 'SST.RE-020',
    revision: '02',
    docDate: '06/11/2026',
    company: 'uisa',
    inspectorName: 'Carlos Eduardo Silva',
    sectorsCovered: 'Silos, Linhas de Ensaque 01 e 02, Armazém Assari',
    date: '2026-11-06',
    time: '10:15',
    items: OFFICIAL_ALARM_QUESTIONS.map((q) => {
      if (q.id === 'acm_1') {
        return {
          ...q,
          status: 'NC',
          observation: 'Martelo quebra-vidro pendente de recolocação no ponto AM-04.',
        };
      }
      return {
        ...q,
        status: 'C',
      };
    }),
    anomaliesOrComments: 'Todos os detectores e sirenes testados e aprovados. Martelo do acionador manual AM-04 sendo substituído.',
    hasNonConformity: true,
    actionPlanGeneratedId: 'pa-alm-02',
    createdAt: '2026-11-06T10:30:00Z',
  },
  {
    id: 'insp-alm-pst-01',
    division: 'POSTO DE COMBUSTIVEL',
    docNumber: 'SST.RE-020',
    revision: '02',
    docDate: '06/11/2026',
    company: 'uisa',
    inspectorName: 'João Roberto Santos',
    sectorsCovered: 'Ilhas de Abastecimento, Bacias de Contenção, GMA',
    date: '2026-11-06',
    time: '14:00',
    items: OFFICIAL_ALARM_QUESTIONS.map((q) => ({
      ...q,
      status: 'C',
    })),
    anomaliesOrComments: '100% dos pontos conformes. Acionadores à prova de explosão e sinalizadores sonoros e visuais operando em perfeita sincronia.',
    hasNonConformity: false,
    createdAt: '2026-11-06T14:20:00Z',
  },
  {
    id: 'insp-alm-adm-01',
    division: 'ADM/GMA',
    docNumber: 'SST.RE-020',
    revision: '02',
    docDate: '06/11/2026',
    company: 'uisa',
    inspectorName: 'Maria Ap. S. Guimarães',
    sectorsCovered: 'Prédio Administrativo, Datacenter / TI, Refeitório',
    date: '2026-11-06',
    time: '16:00',
    items: OFFICIAL_ALARM_QUESTIONS.map((q) => {
      if (q.id === 'det_1') {
        return {
          ...q,
          status: 'NC',
          observation: 'Detector de fumaça da sala de no-break com poeira acumulada.',
        };
      }
      return {
        ...q,
        status: 'C',
      };
    }),
    anomaliesOrComments: 'Central e acionadores manuais OK. Realizar limpeza técnica do detector ótico na sala de no-break do Datacenter.',
    hasNonConformity: true,
    actionPlanGeneratedId: 'pa-alm-04',
    createdAt: '2026-11-06T16:25:00Z',
  },
];
