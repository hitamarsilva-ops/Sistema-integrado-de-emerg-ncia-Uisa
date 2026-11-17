import React, { useState } from 'react';
import {
  Activity,
  Gauge,
  Droplets,
  Zap,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Printer,
  ExternalLink,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  ShieldCheck,
  Factory,
  Package,
  Building2,
  ChevronRight,
  Save,
  Check,
  FileCheck2,
  PenTool,
  CheckSquare,
  Square,
  Wrench,
  Thermometer,
  RotateCw,
} from 'lucide-react';
import {
  PUMP_STATION_METADATA,
  PUMP_STATIONS_BY_DIVISION,
  PUMP_STATION_SEPTEMBER_2026_TESTS,
  PumpStationDivision,
  PumpTestRecord,
} from '../data/pumpStationData';
import { ActionPlanItem } from '../types/actionPlan';
import { formatDateBR } from '../utils/formatters';
import { PumpWeeklyCalendarView, POLE_TEST_SCHEDULE } from './PumpWeeklyCalendarView';
import { SystemInspectionPdfModal, InspectionPdfModalData } from './SystemInspectionPdfModal';
import { ChecklistSignatureModule, SignatureData } from './ChecklistSignatureModule';
import { ChecklistCompletionModal, ChecklistCompletionData } from './ChecklistCompletionModal';
import { ParticipantSignaturePad } from './ParticipantSignaturePad';
import { ChecklistMandatoryNotice } from './ChecklistMandatoryNotice';

interface FirePumpsViewProps {
  onAddActionPlan?: (plan: ActionPlanItem) => void;
  onOpenPdfArchive?: () => void;
}

export type PumpAreaKey = 'INDUSTRIA' | 'EMPACOTAMENTO' | 'POSTO DE COMBUSTIVEL' | 'ADM/GMA';

interface PumpChecklistQuestion {
  id: string;
  section: string;
  question: string;
}

// 40 Itens Oficiais Conforme Formulário SST.RE-094 Rev 00 (21/05/2025)
const BCI_CHECKLIST_QUESTIONS: PumpChecklistQuestion[] = [
  // 1. BOMBA DIESEL (MOTOR DESLIGADO)
  {
    id: 'bci_d1',
    section: '1. BOMBA DIESEL (MOTOR DESLIGADO)',
    question: '1.1 A camisa de aquecimento do motor diesel está aquecida (pré-aquecedor)?',
  },
  {
    id: 'bci_d2',
    section: '1. BOMBA DIESEL (MOTOR DESLIGADO)',
    question: '1.2 Nível de óleo lubrificante do cárter na vareta medidora (entre marcas mín e máx)?',
  },
  {
    id: 'bci_d3',
    section: '1. BOMBA DIESEL (MOTOR DESLIGADO)',
    question: '1.3 Nível do líquido refrigerante no radiador / vaso de expansão (mín 50% aditivo)?',
  },
  {
    id: 'bci_d4',
    section: '1. BOMBA DIESEL (MOTOR DESLIGADO)',
    question: '1.4 Filtros de ar e conexões do motor diesel limpos, sem obstruções ou furos?',
  },
  {
    id: 'bci_d5',
    section: '1. BOMBA DIESEL (MOTOR DESLIGADO)',
    question: '1.5 Cabos e terminais das baterias 1 e 2 devidamente conectados e firmes?',
  },
  {
    id: 'bci_d6',
    section: '1. BOMBA DIESEL (MOTOR DESLIGADO)',
    question: '1.6 Baterias com densidade do eletrólito normal e polos isentos de corrosão / azinhavre?',
  },
  {
    id: 'bci_d7',
    section: '1. BOMBA DIESEL (MOTOR DESLIGADO)',
    question: '1.7 Nível de combustível do tanque diário de óleo diesel acima de 3/4 da capacidade?',
  },

  // 2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)
  {
    id: 'bci_op1',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.1 A motobomba diesel partiu automaticamente por alívio de pressão na rede (pressostato)?',
  },
  {
    id: 'bci_op2',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.2 Pressão de partida da motobomba diesel aferida no manômetro (Kgf/cm²)?',
  },
  {
    id: 'bci_op3',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.3 Pressão de trabalho contínuo estabilizada dentro da faixa nominal de projeto (Kgf/cm²)?',
  },
  {
    id: 'bci_op4',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.4 Rotação do motor diesel aferida no tacômetro (RPM conforme plaqueta do fabricante)?',
  },
  {
    id: 'bci_op5',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.5 Temperatura da água de arrefecimento estabilizada na faixa operacional ideal (ºC)?',
  },
  {
    id: 'bci_op6',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.6 Pressão do óleo lubrificante em regime de trabalho dentro do padrão operacional?',
  },
  {
    id: 'bci_op7',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.7 Água do circuito de arrefecimento / trocador de calor com fluxo contínuo e desobstruído?',
  },
  {
    id: 'bci_op8',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.8 Gaxetas da bomba com gotejamento normal de refrigeração sem superaquecimento?',
  },
  {
    id: 'bci_op9',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.9 Ausência de vibrações anômalas, ruídos metálicos estranhos ou folgas na estrutura?',
  },
  {
    id: 'bci_op10',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.10 Sistema de exaustão, silencioso e dutos de gases estanques sem vazamento de fumaça?',
  },
  {
    id: 'bci_op11',
    section: '2. BOMBA DIESEL (MOTOR LIGADO POR 30 MIN PELO PRESSOSTATO)',
    question: '2.11 Após o teste de 30 min, a chave seletora do painel foi retornada para AUTOMÁTICO?',
  },

  // 3. BOMBA JOCKEY (PRESSURIZAÇÃO DA REDE)
  {
    id: 'bci_j1',
    section: '3. BOMBA JOCKEY (PRESSURIZAÇÃO DA REDE)',
    question: '3.1 A eletrobomba jockey mantém a pressão estática da rede sem partidas intermitentes anormais?',
  },
  {
    id: 'bci_j2',
    section: '3. BOMBA JOCKEY (PRESSURIZAÇÃO DA REDE)',
    question: '3.2 Pressão de partida automática (Cut-In) regulada e aferida no manômetro (Kgf/cm²)?',
  },
  {
    id: 'bci_j3',
    section: '3. BOMBA JOCKEY (PRESSURIZAÇÃO DA REDE)',
    question: '3.3 Pressão de parada automática (Cut-Out) regulada e aferida no manômetro (Kgf/cm²)?',
  },
  {
    id: 'bci_j4',
    section: '3. BOMBA JOCKEY (PRESSURIZAÇÃO DA REDE)',
    question: '3.4 Válvula de retenção da sucção e recalque estanques sem refluxo ou contrapressão?',
  },
  {
    id: 'bci_j5',
    section: '3. BOMBA JOCKEY (PRESSURIZAÇÃO DA REDE)',
    question: '3.5 Chave seletora do painel da bomba jockey mantida na posição AUTOMÁTICO?',
  },

  // 4. PAINEL DE CONTROLE E AUTOMAÇÃO
  {
    id: 'bci_p1',
    section: '4. PAINEL DE CONTROLE E AUTOMAÇÃO',
    question: '4.1 Todos os sinalizadores visuais e lâmpadas LEDs piloto operando normalmente?',
  },
  {
    id: 'bci_p2',
    section: '4. PAINEL DE CONTROLE E AUTOMAÇÃO',
    question: '4.2 Botões de comando, botoeiras de emergência e chaves sem avarias mecânicas?',
  },
  {
    id: 'bci_p3',
    section: '4. PAINEL DE CONTROLE E AUTOMAÇÃO',
    question: '4.3 Alarmes sonoros e luminosos de sinalização de partida / falha funcionando perfeitamente?',
  },
  {
    id: 'bci_p4',
    section: '4. PAINEL DE CONTROLE E AUTOMAÇÃO',
    question: '4.4 Painel de controle devidamente identificado, aterrado, limpo e trancado?',
  },

  // 5. BOMBA ELÉTRICA PRINCIPAL
  {
    id: 'bci_e1',
    section: '5. BOMBA ELÉTRICA PRINCIPAL',
    question: '5.1 Conjunto motobomba elétrica principal e manômetros identificados e desobstruídos?',
  },
  {
    id: 'bci_e2',
    section: '5. BOMBA ELÉTRICA PRINCIPAL',
    question: '5.2 Alimentação elétrica independente com disjuntor geral de força armado no CCM?',
  },
  {
    id: 'bci_e3',
    section: '5. BOMBA ELÉTRICA PRINCIPAL',
    question: '5.3 Teste de partida automática e manual da motobomba elétrica realizado com sucesso?',
  },
  {
    id: 'bci_e4',
    section: '5. BOMBA ELÉTRICA PRINCIPAL',
    question: '5.4 Sentido correto de rotação do motor elétrico e pressão nominal de descarga alcançada?',
  },
  {
    id: 'bci_e5',
    section: '5. BOMBA ELÉTRICA PRINCIPAL',
    question: '5.5 Gaxetas / selo mecânico da bomba elétrica operando com lubrificação e resfriamento?',
  },
  {
    id: 'bci_e6',
    section: '5. BOMBA ELÉTRICA PRINCIPAL',
    question: '5.6 Ausência de sobreaquecimento nos mancais ou ruídos anômalos no motor elétrico?',
  },
  {
    id: 'bci_e7',
    section: '5. BOMBA ELÉTRICA PRINCIPAL',
    question: '5.7 Chave de comando da bomba elétrica retornada para o modo AUTOMÁTICO pós-teste?',
  },

  // 6. RESERVATÓRIOS DOS TANQUES DE ÓLEO DIESEL
  {
    id: 'bci_t1',
    section: '6. RESERVATÓRIOS DOS TANQUES DE ÓLEO DIESEL',
    question: '6.1 Tanque de diesel sem indícios de vazamentos nas conexões, dreno, visor ou bocal?',
  },
  {
    id: 'bci_t2',
    section: '6. RESERVATÓRIOS DOS TANQUES DE ÓLEO DIESEL',
    question: '6.2 Válvulas de alimentação de combustível abertas e travadas na posição aberta?',
  },
  {
    id: 'bci_t3',
    section: '6. RESERVATÓRIOS DOS TANQUES DE ÓLEO DIESEL',
    question: '6.3 Bacia de contenção do tanque de combustível limpa, seca e sem resíduos oleosos?',
  },

  // 7. RESERVATÓRIO DE ÁGUA DE INCÊNDIO (RTI)
  {
    id: 'bci_r1',
    section: '7. RESERVATÓRIO DE ÁGUA DE INCÊNDIO (RTI)',
    question: '7.1 Nível da Reserva Técnica de Incêndio (RTI) em 100% da capacidade volumétrica?',
  },
  {
    id: 'bci_r2',
    section: '7. RESERVATÓRIO DE ÁGUA DE INCÊNDIO (RTI)',
    question: '7.2 Válvulas de sucção do reservatório de água abertas, travadas e identificadas?',
  },
  {
    id: 'bci_r3',
    section: '7. RESERVATÓRIO DE ÁGUA DE INCÊNDIO (RTI)',
    question: '7.3 Reservatório e conexões hidráulicas isentos de vazamentos, trincas ou corrosão?',
  },
];

// 8 Participantes Oficiais Conforme Formulário SST.RE-094
export interface PumpParticipant {
  id: string;
  role: string;
  name: string;
  re: string;
  isPresent: boolean;
  isSigned: boolean;
  signatureImage?: string;
  signatureMode?: 'rubrica' | 'facial';
  signatureTimestamp?: string;
  signatureHash?: string;
  absenceReason: string;
}

const DEFAULT_PARTICIPANTS: PumpParticipant[] = [
  {
    id: 'p1',
    role: 'Mecânico Industrial',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
  {
    id: 'p2',
    role: 'Líder da Brigada',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
  {
    id: 'p3',
    role: 'Mecânico GMA',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
  {
    id: 'p4',
    role: 'Instrumentista',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
  {
    id: 'p5',
    role: 'Eletricista',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
  {
    id: 'p6',
    role: 'Confiabilidade',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
  {
    id: 'p7',
    role: 'Responsável pela Área',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
  {
    id: 'p8',
    role: 'Eletricista Automotivo GMA',
    name: '',
    re: '',
    isPresent: true,
    isSigned: false,
    absenceReason: '',
  },
];

const DEFAULT_PUMP_TAGS: Record<PumpAreaKey, string> = {
  INDUSTRIA: '108005 / 104001',
  EMPACOTAMENTO: '208001 / 204002',
  'POSTO DE COMBUSTIVEL': '308001 / 304001',
  'ADM/GMA': '408001 / 404001',
};

export const FirePumpsView: React.FC<FirePumpsViewProps> = ({ onAddActionPlan, onOpenPdfArchive }) => {
  // Area selection: opens the checklist only when clicked
  const [selectedArea, setSelectedArea] = useState<PumpAreaKey | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'areas' | 'calendario'>('areas');
  const [calendarDivision, setCalendarDivision] = useState<PumpStationDivision>('industria');

  // Checklist responses state: clean/unfilled by default
  const [checklistAnswers, setChecklistAnswers] = useState<
    Record<string, { status: 'C' | 'NC' | 'N/A' | null; observation: string }>
  >(() => {
    const init: Record<string, { status: 'C' | 'NC' | 'N/A' | null; observation: string }> = {};
    BCI_CHECKLIST_QUESTIONS.forEach((q) => {
      init[q.id] = { status: null, observation: '' };
    });
    return init;
  });

  // Numeric measurement fields conforme SST.RE-094
  const [dieselStartPress, setDieselStartPress] = useState<string>('6.0');
  const [dieselWorkingPress, setDieselWorkingPress] = useState<string>('8.0');
  const [dieselRpm, setDieselRpm] = useState<string>('2750');
  const [dieselTemp, setDieselTemp] = useState<string>('82');
  const [jockeyStartPress, setJockeyStartPress] = useState<string>('6.0');
  const [jockeyStopPress, setJockeyStopPress] = useState<string>('7.0');
  const [rtiLevel, setRtiLevel] = useState<string>('100');

  // Textarea fields conforme SST.RE-094
  const [importantNotes, setImportantNotes] = useState<string>(
    'Teste operacional semanal em modo automático executado em conformidade com o procedimento SST.RE-094. Pressão de trabalho nominal aferida e estável.'
  );
  const [recommendedMaintenance, setRecommendedMaintenance] = useState<string>('');

  // 8 Participantes & Ausências State
  const [participants, setParticipants] = useState<PumpParticipant[]>(DEFAULT_PARTICIPANTS);
  const [participantActiveTab, setParticipantActiveTab] = useState<'presentes' | 'ausentes'>('presentes');
  const [activeSignatureParticipantId, setActiveSignatureParticipantId] = useState<string | null>(null);

  const [equipmentTag, setEquipmentTag] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorRE, setInspectorRE] = useState('');
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // PDF Geral Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalData, setPdfModalData] = useState<InspectionPdfModalData | null>(null);

  // Confirmação de Finalização Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState<ChecklistCompletionData | null>(null);

  const unansweredQuestions = BCI_CHECKLIST_QUESTIONS.filter(
    (q) => checklistAnswers[q.id]?.status === null
  );
  const answeredCount = BCI_CHECKLIST_QUESTIONS.length - unansweredQuestions.length;
  const allItemsAnswered = unansweredQuestions.length === 0;

  const handleSelectArea = (area: PumpAreaKey) => {
    setSelectedArea(area);
    setEquipmentTag(DEFAULT_PUMP_TAGS[area]);
    // Reset answers to fresh unfilled state
    const clean: Record<string, { status: 'C' | 'NC' | 'N/A' | null; observation: string }> = {};
    BCI_CHECKLIST_QUESTIONS.forEach((q) => {
      clean[q.id] = { status: null, observation: '' };
    });
    setChecklistAnswers(clean);
    setSaveSuccess(false);
    setHasAttemptedSubmit(false);
    setValidationError(null);
  };

  const handleStatusChange = (questionId: string, status: 'C' | 'NC' | 'N/A') => {
    setValidationError(null);
    setChecklistAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        status,
      },
    }));
  };

  const handleObservationChange = (questionId: string, obs: string) => {
    setChecklistAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        observation: obs,
      },
    }));
  };

  // Participant updates
  const handleTogglePresence = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextPresent = !p.isPresent;
        return {
          ...p,
          isPresent: nextPresent,
          isSigned: nextPresent ? p.isSigned : false,
          signatureImage: nextPresent ? p.signatureImage : undefined,
          absenceReason: nextPresent ? '' : p.absenceReason || 'Ausência justificada em serviço',
        };
      })
    );
    if (activeSignatureParticipantId === id) {
      setActiveSignatureParticipantId(null);
    }
  };

  const handleUpdateParticipantInfo = (id: string, field: 'name' | 're' | 'absenceReason', val: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleConfirmParticipantSignature = (id: string, dataUrl: string, mode: 'rubrica' | 'facial') => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} h`;
        const certHash = `${mode === 'facial' ? 'BIO-FAC' : 'RUB-DIG'}-${Math.floor(10000 + Math.random() * 90000)}-${p.re.trim() || 'UISA'}`;
        return {
          ...p,
          isSigned: true,
          signatureImage: dataUrl,
          signatureMode: mode,
          signatureTimestamp: timeStr,
          signatureHash: certHash,
        };
      })
    );
    setActiveSignatureParticipantId(null);
  };

  const handleRemoveSignature = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isSigned: false,
              signatureImage: undefined,
              signatureMode: undefined,
              signatureTimestamp: undefined,
              signatureHash: undefined,
            }
          : p
      )
    );
  };

  const handleSaveChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea) return;
    setValidationError(null);

    if (!equipmentTag.trim()) {
      setHasAttemptedSubmit(true);
      setValidationError('Informe a TAG do conjunto motobomba / sistema antes de finalizar o checklist.');
      return;
    }

    // Validação Obrigatória: 100% dos 40 itens preenchidos
    if (unansweredQuestions.length > 0) {
      setHasAttemptedSubmit(true);
      setValidationError(
        `Bloqueio de Envio: É obrigatório flegar todos os ${BCI_CHECKLIST_QUESTIONS.length} itens do checklist (C, NC ou N/A). Faltam ${unansweredQuestions.length} item(ns): ${unansweredQuestions
          .slice(0, 5)
          .map((q) => q.question.split(' ')[0])
          .join(', ')}${unansweredQuestions.length > 5 ? '...' : ''}.`
      );
      return;
    }

    // Validação de Ausências: motivo obrigatório para ausentes
    const invalidAbsentees = participants.filter((p) => !p.isPresent && !p.absenceReason.trim());
    if (invalidAbsentees.length > 0) {
      setHasAttemptedSubmit(true);
      setParticipantActiveTab('ausentes');
      setValidationError(
        `Todos os membros flegados como ausentes devem ter a justificativa/motivo da ausência preenchido obrigatoriamente. Verifique: ${invalidAbsentees.map((p) => p.role).join(', ')}.`
      );
      return;
    }

    // Validação de Assinatura do Inspetor Responsável (Facial ou Digital)
    if (!signature || !signature.inspectorName.trim() || (!signature.signatureImage && signature.type !== 'digital')) {
      setHasAttemptedSubmit(true);
      setValidationError('A solicitação de assinatura facial ou digital do inspetor é obrigatória para validar e finalizar o checklist.');
      return;
    }

    // Validação de Assinatura dos Participantes
    const signedParticipants = participants.filter((p) => p.isPresent && p.isSigned);
    if (signedParticipants.length === 0) {
      setHasAttemptedSubmit(true);
      setParticipantActiveTab('presentes');
      setValidationError('É obrigatório que ao menos um participante presente preencha o nome e assine/rubrique o checklist semanal.');
      return;
    }

    const signedWithoutName = signedParticipants.filter((p) => !p.name.trim());
    if (signedWithoutName.length > 0) {
      setHasAttemptedSubmit(true);
      setParticipantActiveTab('presentes');
      setValidationError(
        `Preencha o nome completo do(s) participante(s) que assinaram o checklist: ${signedWithoutName.map((p) => p.role).join(', ')}.`
      );
      return;
    }

    const effectiveTag = equipmentTag.trim();

    // Check for NC items and create action plans
    const ncItems: PumpChecklistQuestion[] = [];
    BCI_CHECKLIST_QUESTIONS.forEach((q) => {
      if (checklistAnswers[q.id]?.status === 'NC') {
        ncItems.push(q);
      }
    });

    if (ncItems.length > 0 && onAddActionPlan) {
      ncItems.forEach((item, idx) => {
        const obs = checklistAnswers[item.id]?.observation || '';
        const newPlan: ActionPlanItem = {
          id: `pa-bci-auto-${Date.now()}-${idx}`,
          system: 'bombas',
          division: selectedArea,
          checklistDoc: 'SST.RE-094 Rev 00',
          itemChecked: `[TAG ${effectiveTag}] ${item.section}: ${item.question}`,
          nonConformityDescription:
            obs.trim() || `Não conformidade constatada no item "${item.question}" da Casa de Bombas - ${selectedArea} (TAG ${effectiveTag}).`,
          correctiveAction: 'Programar intervenção de manutenção mecânica/elétrica corretiva.',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          responsible: 'Manutenção Industrial / Eletromecânica / Brigada',
          status: 'em_andamento',
          priority: 'alta',
          createdAt: testDate,
          notes: `Checklist semanal registrado por equipe técnica da Casa de Bombas (${selectedArea} • TAG ${effectiveTag}).`,
        };
        onAddActionPlan(newPlan);
      });
    }

    const cCount = BCI_CHECKLIST_QUESTIONS.filter((q) => checklistAnswers[q.id]?.status === 'C').length;
    const ncCount = ncItems.length;
    const naCount = BCI_CHECKLIST_QUESTIONS.filter((q) => checklistAnswers[q.id]?.status === 'N/A').length;
    const pCount = participants.filter((p) => p.isPresent).length;
    const aCount = participants.filter((p) => !p.isPresent).length;
    const proto = `UISA-BCI-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

    setCompletionData({
      protocol: proto,
      systemName: `Bombas de Combate a Incêndio & RTI (TAG ${effectiveTag})`,
      docNumber: 'SST.RE-094',
      revision: '00',
      unit: `${selectedArea} • TAG ${effectiveTag}`,
      completedAt: `${formatDateBR(testDate)} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      inspectorName: signature?.inspectorName || inspectorName,
      inspectorRE: signature?.registrationNumber || inspectorRE,
      signatureType: signature?.type || 'digital',
      totalItems: 40,
      conformCount: cCount,
      nonConformCount: ncCount,
      naCount: naCount,
      actionPlansCreated: ncItems.length,
      presentMembersCount: pCount,
      absentMembersCount: aCount,
    });
    setIsCompletionModalOpen(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleOpenGeneralPdf = () => {
    const currentUnit = selectedArea || 'INDUSTRIA';
    const effectiveTag = equipmentTag.trim() || DEFAULT_PUMP_TAGS[currentUnit];
    const rows = BCI_CHECKLIST_QUESTIONS.map((q, idx) => ({
      number: idx + 1,
      categoryOrSection: q.section,
      itemDescription: q.question,
      status: (checklistAnswers[q.id]?.status || 'C') as any,
      observation: checklistAnswers[q.id]?.observation || '',
    }));

    const presentMembers = participants.filter((p) => p.isPresent);
    const absentMembers = participants.filter((p) => !p.isPresent);

    const leadInspector = presentMembers.find((p) => p.role === 'Líder da Brigada') || presentMembers[0];
    const mechInspector = presentMembers.find((p) => p.role === 'Mecânico Industrial') || presentMembers[1];
    const gestorInspector = presentMembers.find((p) => p.role === 'Responsável pela Área') || presentMembers[2];

    const compositeNotes = `TAG DO EQUIPAMENTO / MOTOBOMBAS: ${effectiveTag}

PARÂMETROS DE TESTE MEDIDOS:
- Pressão Partida Diesel: ${dieselStartPress} Kgf/cm² | Pressão Trabalho: ${dieselWorkingPress} Kgf/cm² | Rotação: ${dieselRpm} RPM | Temp: ${dieselTemp} ºC
- Bomba Jockey Partida: ${jockeyStartPress} Kgf/cm² | Parada: ${jockeyStopPress} Kgf/cm² | RTI: ${rtiLevel}%

OBSERVAÇÕES IMPORTANTES:
${importantNotes || 'Nenhuma observação adicional.'}

MANUTENÇÕES RECOMENDADAS:
${recommendedMaintenance || 'Nenhuma manutenção corretiva imediata requerida.'}

REGISTRO DE AUSÊNCIAS (${absentMembers.length}):
${absentMembers.map((a) => `• ${a.role} (${a.name.trim() || 'Nome não informado'}): ${a.absenceReason}`).join('\n') || 'Nenhum membro ausente.'}`;

    setPdfModalData({
      title: `Relatório de Teste Semanal em Modo Automático - Bombas de Incêndio (TAG ${effectiveTag})`,
      systemName: 'Bombas de Combate a Incêndio & RTI',
      docNumber: 'SST.RE-094',
      revision: '00',
      unit: `${currentUnit} • TAG ${effectiveTag}`,
      date: testDate,
      inspectorName: signature?.inspectorName || (leadInspector?.name.trim() ? `${leadInspector.name} (${leadInspector.role})` : 'Inspetor / Líder da Brigada'),
      inspectorRole: leadInspector?.role || 'Líder da Brigada',
      inspectorRE: signature?.registrationNumber || leadInspector?.re || '-',
      operatorName: mechInspector?.name.trim() ? `${mechInspector.name} (${mechInspector.role})` : 'Mecânico Industrial (Não informado)',
      operatorRole: mechInspector?.role || 'Mecânico Industrial',
      operatorRE: mechInspector?.re || '-',
      managerName: gestorInspector?.name.trim() ? `${gestorInspector.name} (${gestorInspector.role})` : 'Responsável pela Área (Não informado)',
      managerRole: gestorInspector?.role || 'Responsável pela Área',
      managerRE: gestorInspector?.re || '-',
      referenceStandard: 'NFPA 20 / ABNT NBR 13714 / IT-22 CBMMT',
      annualReviewStatus: 'SINAL VERDE',
      annualReviewExpiryDate: '21/05/2026',
      notes: compositeNotes,
      rows,
    });
    setIsPdfModalOpen(true);
  };

  // Group questions by section
  const sections = Array.from(new Set(BCI_CHECKLIST_QUESTIONS.map((q) => q.section)));

  const presentCount = participants.filter((p) => p.isPresent).length;
  const absentCount = participants.filter((p) => !p.isPresent).length;

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#007960]/20 p-5 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0 shadow-xs">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Bombas de Combate a Incêndio & RTI
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#007960] text-white">
                SISTEMA OPERACIONAL
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                4 UNIDADES
              </span>
              {/* Alerta de Revisão Anual do PDF de Referência */}
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SINAL VERDE: SST.RE-094 Rev 00 (Válido até 21/05/2026)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Testes periódicos semanais em modo automático e inspeção dos conjuntos motobomba e pressurização conforme formulário oficial SST.RE-094.
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('areas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'areas'
                  ? 'bg-[#007960] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Abertura de Checklist
            </button>
            <button
              onClick={() => setActiveSubTab('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'calendario'
                  ? 'bg-[#007960] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário Semanal</span>
            </button>
          </div>

          <button
            onClick={handleOpenGeneralPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors shadow-xs"
            title="Gerar PDF Geral das inspeções finalizadas com opção de download"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Gerar PDF Geral</span>
          </button>
          {onOpenPdfArchive && (
            <button
              onClick={onOpenPdfArchive}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
              title="Armazenamento e Repositório de Checklists da Casa de Bombas em PDF"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#007960]" />
              <span>Armazenamento PDF</span>
            </button>
          )}

          <a
            href={PUMP_STATION_METADATA.pdfAssetPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
            title="Abrir documento oficial de referência SST.RE-094 em PDF"
          >
            <ExternalLink className="w-4 h-4 text-[#007960]" />
            <span>PDF Referência (SST.RE-094)</span>
          </a>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'areas' && (
        <>
          {/* BANNER EM DESTAQUE: CALENDÁRIO OFICIAL DE TESTES SEMANAIS */}
          <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border-2 border-[#007960] p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#007960]/20 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007960] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>CALENDÁRIO OFICIAL DE TESTES SEMANAIS EM MODO AUTOMÁTICO</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#007960] text-white">
                      SST.RE-094
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Horários obrigatórios estabelecidos para realização dos testes de partida e pressurização nas 4 unidades
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#007960] bg-white px-3 py-1 rounded-lg border border-[#007960]/30 shrink-0 flex items-center gap-1.5 self-start sm:self-center shadow-2xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Cronograma Semanal Vigente</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* 1. Indústria */}
              <div
                onClick={() => handleSelectArea('INDUSTRIA')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedArea === 'INDUSTRIA'
                    ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                    : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Factory className="w-4 h-4 text-[#007960]" />
                    INDÚSTRIA
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                    09:00 h
                  </span>
                </div>
                <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Toda Quinta-feira às 09:00 h</span>
                </div>
                <p className="text-[10px] text-slate-600">Parque de Etanol, Caldeiras, Moendas</p>
                <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                  {selectedArea === 'INDUSTRIA' ? '✓ Checklist Aberto' : 'Clique para preencher →'}
                </span>
              </div>

              {/* 2. Empacotamento */}
              <div
                onClick={() => handleSelectArea('EMPACOTAMENTO')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedArea === 'EMPACOTAMENTO'
                    ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                    : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#007960]" />
                    EMPACOTAMENTO
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                    14:00 h
                  </span>
                </div>
                <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Toda Quinta-feira às 14:00 h</span>
                </div>
                <p className="text-[10px] text-slate-600">Silos de Açúcar, Armazéns, Assari</p>
                <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                  {selectedArea === 'EMPACOTAMENTO' ? '✓ Checklist Aberto' : 'Clique para preencher →'}
                </span>
              </div>

              {/* 3. Posto de Combustível */}
              <div
                onClick={() => handleSelectArea('POSTO DE COMBUSTIVEL')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedArea === 'POSTO DE COMBUSTIVEL'
                    ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                    : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-[#007960]" />
                    POSTO DE COMBUSTÍVEL
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                    09:00 h
                  </span>
                </div>
                <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Toda Terça-feira às 09:00 h</span>
                </div>
                <p className="text-[10px] text-slate-600">Ilhas, Bacias de Contenção, Comboios</p>
                <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                  {selectedArea === 'POSTO DE COMBUSTIVEL' ? '✓ Checklist Aberto' : 'Clique para preencher →'}
                </span>
              </div>

              {/* 4. ADM/GMA */}
              <div
                onClick={() => handleSelectArea('ADM/GMA')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedArea === 'ADM/GMA'
                    ? 'bg-emerald-100/60 border-[#007960] shadow-sm ring-2 ring-[#007960]/40'
                    : 'bg-white border-[#007960]/30 hover:border-[#007960] hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#007960]" />
                    ADM/GMA
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#007960] text-white">
                    15:00 h
                  </span>
                </div>
                <div className="text-xs font-extrabold text-[#007960] flex items-center gap-1 mb-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Toda Sexta-feira às 15:00 h</span>
                </div>
                <p className="text-[10px] text-slate-600">Prédio Central, Datacenter, Pátio GMA</p>
                <span className="text-[10px] font-bold text-[#007960] mt-1.5 block">
                  {selectedArea === 'ADM/GMA' ? '✓ Checklist Aberto' : 'Clique para preencher →'}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Division Selector Cards */}
          <div>
            <div className="mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selecione a unidade operacional para realizar a inspeção e checklist:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. INDUSTRIA */}
              <button
                type="button"
                onClick={() => handleSelectArea('INDUSTRIA')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                  selectedArea === 'INDUSTRIA'
                    ? 'bg-emerald-50/70 border-[#007960] shadow-sm ring-2 ring-[#007960]/30 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    selectedArea === 'INDUSTRIA'
                      ? 'bg-[#007960] text-white border-[#007960]'
                      : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
                  }`}
                >
                  <Factory className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-xs truncate">INDUSTRIA</h3>
                    <span className="text-[10px] font-mono text-[#007960] font-bold">Quinta • 09h</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">Destilaria, Caldeiras, Moenda</p>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    TAG: {DEFAULT_PUMP_TAGS.INDUSTRIA}
                  </span>
                  <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                    Clique para abrir checklist →
                  </span>
                </div>
              </button>

              {/* 2. EMPACOTAMENTO */}
              <button
                type="button"
                onClick={() => handleSelectArea('EMPACOTAMENTO')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                  selectedArea === 'EMPACOTAMENTO'
                    ? 'bg-emerald-50/70 border-[#007960] shadow-sm ring-2 ring-[#007960]/30 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    selectedArea === 'EMPACOTAMENTO'
                      ? 'bg-[#007960] text-white border-[#007960]'
                      : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
                  }`}
                >
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-xs truncate">EMPACOTAMENTO</h3>
                    <span className="text-[10px] font-mono text-[#007960] font-bold">Quinta • 14h</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">Silos, Armazéns, Assari</p>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    TAG: {DEFAULT_PUMP_TAGS.EMPACOTAMENTO}
                  </span>
                  <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                    Clique para abrir checklist →
                  </span>
                </div>
              </button>

              {/* 3. POSTO DE COMBUSTIVEL */}
              <button
                type="button"
                onClick={() => handleSelectArea('POSTO DE COMBUSTIVEL')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                  selectedArea === 'POSTO DE COMBUSTIVEL'
                    ? 'bg-emerald-50/70 border-[#007960] shadow-sm ring-2 ring-[#007960]/30 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    selectedArea === 'POSTO DE COMBUSTIVEL'
                      ? 'bg-[#007960] text-white border-[#007960]'
                      : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
                  }`}
                >
                  <Fuel className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-xs truncate">POSTO DE COMBUSTIVEL</h3>
                    <span className="text-[10px] font-mono text-[#007960] font-bold">Terça • 09h</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">Pistas, Descarga & Frotas</p>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    TAG: {DEFAULT_PUMP_TAGS['POSTO DE COMBUSTIVEL']}
                  </span>
                  <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                    Clique para abrir checklist →
                  </span>
                </div>
              </button>

              {/* 4. ADM/GMA */}
              <button
                type="button"
                onClick={() => handleSelectArea('ADM/GMA')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                  selectedArea === 'ADM/GMA'
                    ? 'bg-emerald-50/70 border-[#007960] shadow-sm ring-2 ring-[#007960]/30 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    selectedArea === 'ADM/GMA'
                      ? 'bg-[#007960] text-white border-[#007960]'
                      : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-xs truncate">ADM/GMA</h3>
                    <span className="text-[10px] font-mono text-[#007960] font-bold">Sexta • 15h</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">Prédio Central & Pátio GMA</p>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    TAG: {DEFAULT_PUMP_TAGS['ADM/GMA']}
                  </span>
                  <span className="text-[10px] font-mono text-[#007960] mt-0.5 block font-bold">
                    Clique para abrir checklist →
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Toast / Feedback */}
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-[#007960] text-[#007960] flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Checklist Oficial SST.RE-094 Salvo com Sucesso!</span>
                <span>As assinaturas digitais foram autenticadas e eventuais não conformidades geraram plano de ação no Painel Geral.</span>
              </div>
            </div>
          )}

          {/* Formulário do Checklist Aberto */}
          {selectedArea ? (
            <form onSubmit={handleSaveChecklist} className="space-y-5 animate-in fade-in">
              {/* Header do Checklist Selecionado */}
              <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#007960]" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Checklist Oficial de Teste das Bombas de Incêndio • {selectedArea}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Formulário SST.RE-094 Rev 00 (21/05/2025) • 40 Itens Obrigatórios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#007960] text-white">
                      {selectedArea === 'INDUSTRIA' && 'Toda Quinta • 09:00 h'}
                      {selectedArea === 'EMPACOTAMENTO' && 'Toda Quinta • 14:00 h'}
                      {selectedArea === 'POSTO DE COMBUSTIVEL' && 'Toda Terça • 09:00 h'}
                      {selectedArea === 'ADM/GMA' && 'Toda Sexta • 15:00 h'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">TAG (BOMBA / SISTEMA): *</label>
                    <input
                      type="text"
                      value={equipmentTag}
                      onChange={(e) => {
                        setEquipmentTag(e.target.value);
                        setValidationError(null);
                      }}
                      required
                      placeholder="Ex: 108005 / 104001"
                      className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-[#007960]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">DATA DO TESTE: *</label>
                    <input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      required
                      className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">UNIDADE OPERACIONAL:</label>
                    <input
                      type="text"
                      value={selectedArea}
                      disabled
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">HORÁRIO PADRÃO DO POLO:</label>
                    <input
                      type="text"
                      disabled
                      value={
                        selectedArea === 'INDUSTRIA'
                          ? '09:00 h (Toda Quinta-feira)'
                          : selectedArea === 'EMPACOTAMENTO'
                          ? '14:00 h (Toda Quinta-feira)'
                          : selectedArea === 'POSTO DE COMBUSTIVEL'
                          ? '09:00 h (Toda Terça-feira)'
                          : '15:00 h (Toda Sexta-feira)'
                      }
                      className="w-full bg-emerald-50/50 border border-[#007960]/30 rounded-lg px-3 py-2 text-[#007960] font-bold cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                {/* Parâmetros Técnicos de Medição (Conforme SST.RE-094) */}
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    PARÂMETROS TÉCNICOS & LEITURAS MANOMÉTRICAS DO TESTE:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
                    <div className="bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-600 font-semibold block">Partida Jockey (Kgf):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={jockeyStartPress}
                        onChange={(e) => setJockeyStartPress(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-600 font-semibold block">Parada Jockey (Kgf):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={jockeyStopPress}
                        onChange={(e) => setJockeyStopPress(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-600 font-semibold block">Partida Diesel (Kgf):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dieselStartPress}
                        onChange={(e) => setDieselStartPress(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-600 font-semibold block">Trabalho Diesel (Kgf):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dieselWorkingPress}
                        onChange={(e) => setDieselWorkingPress(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-600 font-semibold block">Rotação Diesel (RPM):</label>
                      <input
                        type="number"
                        value={dieselRpm}
                        onChange={(e) => setDieselRpm(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-600 font-semibold block">Temp. Motor (ºC):</label>
                      <input
                        type="number"
                        value={dieselTemp}
                        onChange={(e) => setDieselTemp(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-600 font-semibold block">Nível RTI (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rtiLevel}
                        onChange={(e) => setRtiLevel(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aviso de obrigatoriedade de flegar todos os 40 itens */}
              <ChecklistMandatoryNotice
                totalItems={BCI_CHECKLIST_QUESTIONS.length}
                answeredItems={answeredCount}
                hasAttemptedSubmit={hasAttemptedSubmit}
                itemLabel="itens das bombas"
                pendingLabels={unansweredQuestions.map((q) => `Item ${q.question.split(' ')[0]}`)}
              />

              {/* Lista de Questões Agrupadas (40 itens) */}
              <div className="bg-white border border-[#007960]/20 rounded-2xl overflow-hidden shadow-xs">
                {/* Table Header */}
                <div className="bg-emerald-50/70 border-b border-[#007960]/20 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    CRITÉRIOS DE VERIFICAÇÃO OPERACIONAL ({answeredCount}/{BCI_CHECKLIST_QUESTIONS.length} FLEGADOS • SST.RE-094)
                  </span>
                  <div className="flex items-center gap-6 text-xs font-bold text-slate-700">
                    <span className="w-10 text-center text-[#007960]">C</span>
                    <span className="w-10 text-center text-[#de2726]">NC</span>
                    <span className="w-10 text-center text-slate-500">N/A</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {sections.map((sec, secIdx) => {
                    const secQuestions = BCI_CHECKLIST_QUESTIONS.filter((q) => q.section === sec);
                    return (
                      <div key={sec} className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#007960] text-white flex items-center justify-center text-xs font-bold font-mono">
                            {secIdx + 1}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            {sec}
                          </h4>
                        </div>

                        <div className="space-y-2.5 pl-8">
                          {secQuestions.map((q) => {
                            const cur = checklistAnswers[q.id] || { status: null, observation: '' };
                            const isNC = cur.status === 'NC';
                            const isMissing = cur.status === null;

                            return (
                              <div
                                key={q.id}
                                className={`p-3 rounded-xl border transition-all ${
                                  isNC
                                    ? 'bg-red-50/50 border-red-300 ring-1 ring-red-300'
                                    : cur.status === 'C'
                                    ? 'bg-emerald-50/20 border-emerald-200'
                                    : cur.status === 'N/A'
                                    ? 'bg-slate-50 border-slate-200'
                                    : hasAttemptedSubmit && isMissing
                                    ? 'bg-red-50/40 border-red-400 ring-1 ring-red-300'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-slate-800 leading-snug">
                                      {q.question}
                                    </span>
                                    {hasAttemptedSubmit && isMissing && (
                                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#de2726] border border-red-300 text-[10px] font-bold">
                                        Obrigatório flegar
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-6 shrink-0 self-end sm:self-center">
                                    {/* C */}
                                    <label className="w-10 flex items-center justify-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`pump_${q.id}`}
                                        checked={cur.status === 'C'}
                                        onChange={() => handleStatusChange(q.id, 'C')}
                                        className="w-4 h-4 text-[#007960] focus:ring-[#007960] cursor-pointer"
                                      />
                                    </label>

                                    {/* NC */}
                                    <label className="w-10 flex items-center justify-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`pump_${q.id}`}
                                        checked={cur.status === 'NC'}
                                        onChange={() => handleStatusChange(q.id, 'NC')}
                                        className="w-4 h-4 text-[#de2726] focus:ring-[#de2726] cursor-pointer"
                                      />
                                    </label>

                                    {/* N/A */}
                                    <label className="w-10 flex items-center justify-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`pump_${q.id}`}
                                        checked={cur.status === 'N/A'}
                                        onChange={() => handleStatusChange(q.id, 'N/A')}
                                        className="w-4 h-4 text-slate-500 focus:ring-slate-400 cursor-pointer"
                                      />
                                    </label>
                                  </div>
                                </div>

                                {isNC && (
                                  <div className="mt-3 pt-3 border-t border-red-200 animate-in fade-in">
                                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#de2726]">
                                      <AlertTriangle className="w-4 h-4 shrink-0" />
                                      <span>Não Conformidade Detectada • Gera Plano de Ação Automático</span>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={cur.observation}
                                      onChange={(e) => handleObservationChange(q.id, e.target.value)}
                                      placeholder="Descreva detalhadamente a não conformidade para geração de plano de ação..."
                                      required
                                      className="w-full bg-white border border-red-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#de2726] focus:ring-1 focus:ring-[#de2726]"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observações Importantes & Manutenções Recomendadas Conforme SST.RE-094 */}
              <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-bold text-xs uppercase tracking-wider mb-1">
                      OBSERVAÇÕES IMPORTANTES (SST.RE-094):
                    </label>
                    <textarea
                      rows={3}
                      value={importantNotes}
                      onChange={(e) => setImportantNotes(e.target.value)}
                      placeholder="Descreva observações adicionais sobre o comportamento dos pressostatos, alívios ou rede..."
                      className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold text-xs uppercase tracking-wider mb-1">
                      MANUTENÇÕES RECOMENDADAS:
                    </label>
                    <textarea
                      rows={3}
                      value={recommendedMaintenance}
                      onChange={(e) => setRecommendedMaintenance(e.target.value)}
                      placeholder="Indique serviços preventivos ou corretivos necessários identificados durante o teste..."
                      className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                    />
                  </div>
                </div>

                {/* ASSINATURA FACIAL OU DIGITAL DO INSPETOR RESPONSÁVEL */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#007960]" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                        INSPETOR PRINCIPAL / BRIGADISTA RESPONSÁVEL (ASSINATURA FACIAL OU RUBRICA DIGITAL): *
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                      OBRIGATÓRIO SST.RE-094
                    </span>
                  </div>

                  <ChecklistSignatureModule
                    signature={signature}
                    onChangeSignature={(sig) => {
                      setSignature(sig);
                      if (sig) {
                        setInspectorName(sig.inspectorName);
                        setInspectorRE(sig.registrationNumber);
                      }
                    }}
                    hasAttemptedSubmit={hasAttemptedSubmit}
                  />
                </div>

                {/* CONTROLE DE ASSINATURAS / RUBRICAS & AUSÊNCIAS (TODOS OS 8 PARTICIPANTES) */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                        PARTICIPANTES DO TESTE & ASSINATURA / RUBRICA (SST.RE-094)
                      </span>
                      <p className="text-[11px] text-slate-600">
                        Preencha os nomes dos participantes presentes e abra o campo de assinatura ou rubrica individual, ou flegue ausências com justificativa
                      </p>
                    </div>

                    {/* Tabs: Presentes vs Ausências */}
                    <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setParticipantActiveTab('presentes')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          participantActiveTab === 'presentes'
                            ? 'bg-[#007960] text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Presentes ({presentCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setParticipantActiveTab('ausentes')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          participantActiveTab === 'ausentes'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Flegar Ausências ({absentCount})</span>
                      </button>
                    </div>
                  </div>

                  {/* ABA: MEMBROS PRESENTES & ASSINATURA / RUBRICA */}
                  {participantActiveTab === 'presentes' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {participants.map((p) => {
                          if (!p.isPresent) return null;
                          const isPadOpen = activeSignatureParticipantId === p.id;
                          return (
                            <div
                              key={p.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                p.isSigned
                                  ? 'bg-emerald-50/50 border-[#007960]/30'
                                  : isPadOpen
                                  ? 'bg-emerald-50/30 border-[#007960]'
                                  : 'bg-[#f8faf9] border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2.5">
                                <span className="text-[11px] font-mono font-bold text-[#007960] uppercase">
                                  {p.role}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePresence(p.id)}
                                  className="text-[10px] text-amber-700 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors"
                                  title="Marcar como ausente neste teste"
                                >
                                  Flegar Ausente
                                </button>
                              </div>

                              {/* Campos Editáveis para Preenchimento do Nome e Matrícula / RE */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                    Nome do Participante:
                                  </label>
                                  <input
                                    type="text"
                                    value={p.name}
                                    onChange={(e) =>
                                      handleUpdateParticipantInfo(p.id, 'name', e.target.value)
                                    }
                                    placeholder="Digite o nome completo..."
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                    RE / Matrícula:
                                  </label>
                                  <input
                                    type="text"
                                    value={p.re}
                                    onChange={(e) =>
                                      handleUpdateParticipantInfo(p.id, 're', e.target.value)
                                    }
                                    placeholder="Ex: RE-00000"
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                                  />
                                </div>
                              </div>

                              {/* Campo Aberto de Assinatura / Rubrica */}
                              {isPadOpen ? (
                                <ParticipantSignaturePad
                                  participantRole={p.role}
                                  participantName={p.name}
                                  onConfirm={(dataUrl, mode) =>
                                    handleConfirmParticipantSignature(p.id, dataUrl, mode)
                                  }
                                  onCancel={() => setActiveSignatureParticipantId(null)}
                                />
                              ) : (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                                  {p.isSigned ? (
                                    <div className="flex items-center gap-2.5">
                                      {p.signatureImage ? (
                                        <img
                                          src={p.signatureImage}
                                          alt={`Rubrica de ${p.name || p.role}`}
                                          className="h-10 max-w-[110px] object-contain bg-white rounded-md border border-[#007960]/30 px-1.5 py-0.5 shadow-2xs"
                                        />
                                      ) : (
                                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#007960] flex items-center justify-center shrink-0">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </span>
                                      )}
                                      <div>
                                        <span className="text-[10px] font-bold text-[#007960] block leading-none">
                                          {p.signatureMode === 'facial'
                                            ? 'BIOMETRIA FACIAL REGISTRADA'
                                            : 'ASSINATURA / RUBRICA REGISTRADA'}
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-500">
                                          {p.signatureTimestamp} • {p.signatureHash}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Pendente de assinatura / rubrica</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2">
                                    {p.isSigned ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => setActiveSignatureParticipantId(p.id)}
                                          className="text-[10px] text-[#007960] hover:underline font-bold"
                                        >
                                          Refazer
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSignature(p.id)}
                                          className="text-[10px] text-slate-500 hover:text-red-600 font-semibold"
                                        >
                                          Remover
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setActiveSignatureParticipantId(p.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-[11px] font-bold transition-colors shadow-2xs"
                                      >
                                        <PenTool className="w-3.5 h-3.5" />
                                        <span>Abrir Assinatura / Rubrica</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ABA: MEMBROS AUSENTES & MOTIVO DA AUSÊNCIA */}
                  {participantActiveTab === 'ausentes' && (
                    <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          Flegar Membros Ausentes e Descrever Justificativa Obrigatória (SST.RE-094)
                        </span>
                      </div>

                      <div className="divide-y divide-amber-100 space-y-3 pt-1">
                        {participants.map((p) => {
                          const isAbsent = !p.isPresent;
                          return (
                            <div key={p.id} className="pt-3 first:pt-0 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isAbsent}
                                    onChange={() => handleTogglePresence(p.id)}
                                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                  />
                                  <span className="text-xs font-bold text-slate-800">
                                    {p.role}
                                  </span>
                                </label>

                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded self-start sm:self-center ${
                                    isAbsent
                                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isAbsent ? 'AUSENTE NO TESTE' : 'PRESENTE'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-6">
                                <input
                                  type="text"
                                  value={p.name}
                                  onChange={(e) =>
                                    handleUpdateParticipantInfo(p.id, 'name', e.target.value)
                                  }
                                  placeholder="Preencher nome do colaborador..."
                                  className="sm:col-span-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                                />
                                <input
                                  type="text"
                                  value={p.re}
                                  onChange={(e) =>
                                    handleUpdateParticipantInfo(p.id, 're', e.target.value)
                                  }
                                  placeholder="RE / Matrícula"
                                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                                />
                              </div>

                              {isAbsent && (
                                <div className="mt-2 pl-6 space-y-2 animate-in fade-in">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-600">
                                      Motivos comuns:
                                    </span>
                                    {[
                                      'Escala de folga programada',
                                      'Atestado médico',
                                      'Atendimento a emergência operacional',
                                      'Férias regulamentares',
                                      'Treinamento externo de capacitação',
                                    ].map((prefill) => (
                                      <button
                                        key={prefill}
                                        type="button"
                                        onClick={() =>
                                          handleUpdateParticipantInfo(p.id, 'absenceReason', prefill)
                                        }
                                        className="text-[10px] bg-white hover:bg-amber-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded transition-colors"
                                      >
                                        + {prefill}
                                      </button>
                                    ))}
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                                      MOTIVO DA AUSÊNCIA (OBRIGATÓRIO): *
                                    </label>
                                    <input
                                      type="text"
                                      value={p.absenceReason}
                                      onChange={(e) =>
                                        handleUpdateParticipantInfo(p.id, 'absenceReason', e.target.value)
                                      }
                                      placeholder="Descreva formalmente o motivo da ausência do participante..."
                                      required
                                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <ChecklistMandatoryNotice
                  totalItems={BCI_CHECKLIST_QUESTIONS.length}
                  answeredItems={answeredCount}
                  hasAttemptedSubmit={hasAttemptedSubmit}
                  itemLabel="itens das bombas"
                  pendingLabels={unansweredQuestions.map((q) => `Item ${q.question.split(' ')[0]}`)}
                />

                {validationError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-[#de2726] text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Ações Finais do Formulário */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedArea(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Fechar Checklist
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleOpenGeneralPdf}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-colors shadow-2xs"
                    >
                      Visualizar PDF do Teste
                    </button>

                    <button
                      type="submit"
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs ${
                        allItemsAnswered
                          ? 'bg-[#007960] hover:bg-[#005a47]'
                          : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {allItemsAnswered
                          ? 'Salvar Checklist Semanal da Unidade'
                          : `Flegar todos os itens (${answeredCount}/${BCI_CHECKLIST_QUESTIONS.length})`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-white border border-dashed border-[#007960]/30 rounded-2xl p-8 text-center space-y-2">
              <Activity className="w-10 h-10 text-[#007960] mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-slate-800">
                Selecione uma das 4 áreas acima para preencher o checklist
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Clique nos cartões do calendário ou nos botões de unidade (<strong>INDÚSTRIA</strong>, <strong>EMPACOTAMENTO</strong>, <strong>POSTO DE COMBUSTÍVEL</strong> ou <strong>ADM/GMA</strong>) para abrir o checklist oficial SST.RE-094 com todas as perguntas, parâmetros técnicos e assinaturas digitais.
              </p>
            </div>
          )}
        </>
      )}

      {/* SubTab: Calendário de Testes Semanal Detalhado */}
      {activeSubTab === 'calendario' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#007960]/20 p-5 rounded-2xl shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Calendário de Testes Semanal em Modo Automático (SST.RE-094)
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Cronograma e histórico de aferição de partidas automáticas semanais para todas as unidades industriais.
            </p>
            <PumpWeeklyCalendarView
              selectedDivision={calendarDivision}
              onSelectDivision={setCalendarDivision}
              tests={PUMP_STATION_SEPTEMBER_2026_TESTS}
            />
          </div>
        </div>
      )}

      {/* Modal de PDF Geral e Download da Inspeção */}
      <SystemInspectionPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        data={pdfModalData}
      />

      {/* Modal de Confirmação de Finalização do Checklist */}
      <ChecklistCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        data={completionData}
        onViewPdf={handleOpenGeneralPdf}
        onOpenPdfArchive={onOpenPdfArchive}
      />
    </div>
  );
};
