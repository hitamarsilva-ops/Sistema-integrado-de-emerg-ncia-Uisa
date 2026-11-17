import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Plus,
  Printer,
  Factory,
  Package,
  Building2,
  FileText,
  Search,
  BookOpen,
  UserCheck,
  Flame,
  Clock,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { BrigadeMember } from '../types/brigade';
import {
  SstRe086ReferenceBanner,
  SstRe086ReferenceModal,
} from './SstRe086ReferenceModal';

export type BrigadeMeetingLocation = 'industria' | 'empacotamento' | 'adm';

export interface BrigadeMeeting {
  id: string;
  monthIndex: number; // 0 = JAN .. 11 = DEZ
  monthLabel: string; // 'JAN' .. 'DEZ'
  location: BrigadeMeetingLocation; // 'industria' (IND) | 'empacotamento' (ASSARI) | 'adm' (AGRÍCOLA)
  theme: string;
  dateDisplay: string; // Ex: '28 e 29/01/2026', '30/01/2026'
  meetingDate: string; // YYYY-MM-DD
  time: string;
  room: string;
  leaderName: string;
  leaderRole: string;
  status: 'realizada' | 'agendada'; // Realizado vs Programado
  objectives: string;
  agendaItems: string[];
  attendeesCount: number;
  expectedAttendees: number;
  minutesSummary: string;
  actionPoints: string[];
}

interface MonthlyScheduleSeed {
  monthIndex: number;
  monthLabel: string;
  ind: { dateDisplay: string; iso: string; status: 'realizada' | 'agendada'; theme: string };
  assari: { dateDisplay: string; iso: string; status: 'realizada' | 'agendada'; theme: string };
  agricola: { dateDisplay: string; iso: string; status: 'realizada' | 'agendada'; theme: string };
}

const OFFICIAL_ANNUAL_AGENDA: MonthlyScheduleSeed[] = [
  {
    monthIndex: 0,
    monthLabel: 'JAN',
    ind: {
      dateDisplay: '28 e 29/01/2026',
      iso: '2026-01-28',
      status: 'realizada',
      theme: 'Operação da central de alarmes e bomba de combate a incêndio',
    },
    assari: {
      dateDisplay: '30/01/2026',
      iso: '2026-01-30',
      status: 'realizada',
      theme: 'Operação da central de alarmes e bomba de combate a incêndio',
    },
    agricola: {
      dateDisplay: '22/01/2026',
      iso: '2026-01-22',
      status: 'realizada',
      theme: 'Operação da central de alarmes e bomba de combate a incêndio',
    },
  },
  {
    monthIndex: 1,
    monthLabel: 'FEV',
    ind: {
      dateDisplay: '25 e 26/02/2026',
      iso: '2026-02-25',
      status: 'realizada',
      theme: 'Simulados e comunicação de emergência',
    },
    assari: {
      dateDisplay: '27/02/2026',
      iso: '2026-02-27',
      status: 'realizada',
      theme: 'Simulados e comunicação de emergência',
    },
    agricola: {
      dateDisplay: '19/02/2026',
      iso: '2026-02-19',
      status: 'realizada',
      theme: 'Simulados e comunicação de emergência',
    },
  },
  {
    monthIndex: 2,
    monthLabel: 'MAR',
    ind: {
      dateDisplay: '30 e 31/03/2026',
      iso: '2026-03-30',
      status: 'agendada',
      theme: 'PAE (Plano de Atendimento a Emergência)',
    },
    assari: {
      dateDisplay: '30/03/2026',
      iso: '2026-03-30',
      status: 'agendada',
      theme: 'PAE (Plano de Atendimento a Emergência)',
    },
    agricola: {
      dateDisplay: '31/03/2026',
      iso: '2026-03-31',
      status: 'agendada',
      theme: 'PAE (Plano de Atendimento a Emergência)',
    },
  },
  {
    monthIndex: 3,
    monthLabel: 'ABR',
    ind: {
      dateDisplay: '29 e 30/04/2026',
      iso: '2026-04-29',
      status: 'realizada',
      theme: 'Táticas e métodos de combate a incêndio / montagem das linhas de combate a incêndio',
    },
    assari: {
      dateDisplay: '30/04/2026',
      iso: '2026-04-30',
      status: 'realizada',
      theme: 'Táticas e métodos de combate a incêndio / montagem das linhas de combate a incêndio',
    },
    agricola: {
      dateDisplay: '29/04/2026',
      iso: '2026-04-29',
      status: 'realizada',
      theme: 'Táticas e métodos de combate a incêndio / montagem das linhas de combate a incêndio',
    },
  },
  {
    monthIndex: 4,
    monthLabel: 'MAI',
    ind: {
      dateDisplay: '28 e 29/05/2026',
      iso: '2026-05-28',
      status: 'realizada',
      theme: 'Primeiros socorros (imobilização e remoção de vítima) com o uso da ambulância.',
    },
    assari: {
      dateDisplay: '29/05/2026',
      iso: '2026-05-29',
      status: 'realizada',
      theme: 'Resgate em altura',
    },
    agricola: {
      dateDisplay: '28/05/2026',
      iso: '2026-05-28',
      status: 'realizada',
      theme: 'Primeiros socorros (imobilização e remoção de vítima) com o uso da ambulância.',
    },
  },
  {
    monthIndex: 5,
    monthLabel: 'JUN',
    ind: {
      dateDisplay: '29 e 30/06/2025',
      iso: '2025-06-29',
      status: 'agendada',
      theme: 'Primeiros socorros (acidentes com produtos químicos)',
    },
    assari: {
      dateDisplay: '30/06/2026',
      iso: '2026-06-30',
      status: 'agendada',
      theme: 'Primeiros socorros (acidentes com produtos químicos)',
    },
    agricola: {
      dateDisplay: '29/06/2026',
      iso: '2026-06-29',
      status: 'agendada',
      theme: 'Primeiros socorros (acidentes com produtos químicos)',
    },
  },
  {
    monthIndex: 6,
    monthLabel: 'JUL',
    ind: {
      dateDisplay: '30 e 31/07/2026',
      iso: '2026-07-30',
      status: 'agendada',
      theme: 'Resgate (trabalho em altura)',
    },
    assari: {
      dateDisplay: '30/07/2026',
      iso: '2026-07-30',
      status: 'agendada',
      theme: 'Resgate (trabalho em altura)',
    },
    agricola: {
      dateDisplay: '31/07/2026',
      iso: '2026-07-31',
      status: 'agendada',
      theme: 'Resgate (trabalho em altura)',
    },
  },
  {
    monthIndex: 7,
    monthLabel: 'AGO',
    ind: {
      dateDisplay: '26 e 27/08/2026',
      iso: '2026-08-26',
      status: 'realizada',
      theme: 'Combate a incêndio',
    },
    assari: {
      dateDisplay: '27/08/2026',
      iso: '2026-08-27',
      status: 'realizada',
      theme: 'Combate a incêndio',
    },
    agricola: {
      dateDisplay: '26/08/2026',
      iso: '2026-08-26',
      status: 'realizada',
      theme: 'Combate a incêndio',
    },
  },
  {
    monthIndex: 8,
    monthLabel: 'SET',
    ind: {
      dateDisplay: '29 e 30/09/2026',
      iso: '2026-09-29',
      status: 'agendada',
      theme: 'Combate a incêndio',
    },
    assari: {
      dateDisplay: '29/09/2026',
      iso: '2026-09-29',
      status: 'agendada',
      theme: 'Combate a incêndio',
    },
    agricola: {
      dateDisplay: '30/09/2026',
      iso: '2026-09-30',
      status: 'agendada',
      theme: 'Combate a incêndio',
    },
  },
  {
    monthIndex: 9,
    monthLabel: 'OUT',
    ind: {
      dateDisplay: '28 e 29/10/2026',
      iso: '2026-10-28',
      status: 'agendada',
      theme: 'Operação da central de alarmes e bomba de combate a incêndio',
    },
    assari: {
      dateDisplay: '28/10/2026',
      iso: '2026-10-28',
      status: 'agendada',
      theme: 'Operação da central de alarmes e bomba de combate a incêndio',
    },
    agricola: {
      dateDisplay: '29/10/2026',
      iso: '2026-10-29',
      status: 'agendada',
      theme: 'Operação da central de alarmes e bomba de combate a incêndio',
    },
  },
  {
    monthIndex: 10,
    monthLabel: 'NOV',
    ind: {
      dateDisplay: '18 e 19/11/2025',
      iso: '2025-11-18',
      status: 'agendada',
      theme: 'Primeiros Socorros (queimaduras)',
    },
    assari: {
      dateDisplay: '26/11/2025',
      iso: '2025-11-26',
      status: 'agendada',
      theme: 'Primeiros Socorros (queimaduras)',
    },
    agricola: {
      dateDisplay: '12/11/2025',
      iso: '2025-11-12',
      status: 'agendada',
      theme: 'Primeiros Socorros (queimaduras)',
    },
  },
  {
    monthIndex: 11,
    monthLabel: 'DEZ',
    ind: {
      dateDisplay: '15 e 16/12/2025',
      iso: '2025-12-15',
      status: 'agendada',
      theme: 'Programação e participação de simulados',
    },
    assari: {
      dateDisplay: '23/12/2025',
      iso: '2025-12-23',
      status: 'agendada',
      theme: 'Programação e participação de simulados',
    },
    agricola: {
      dateDisplay: '09/12/2025',
      iso: '2025-12-09',
      status: 'agendada',
      theme: 'Programação e participação de simulados',
    },
  },
];

const buildInitialMeetings = (): BrigadeMeeting[] => {
  const list: BrigadeMeeting[] = [];

  OFFICIAL_ANNUAL_AGENDA.forEach((row) => {
    const units: Array<{
      loc: BrigadeMeetingLocation;
      code: string;
      room: string;
      leaderName: string;
      leaderRole: string;
      expected: number;
      data: MonthlyScheduleSeed['ind'];
    }> = [
      {
        loc: 'industria',
        code: 'ind',
        room: 'Sala de Treinamento da Brigada Industrial (IND)',
        leaderName: 'Coordenação Brigada IND / SST',
        leaderRole: 'Técnico de Segurança do Trabalho / Bombeiro Civil',
        expected: 18,
        data: row.ind,
      },
      {
        loc: 'empacotamento',
        code: 'assari',
        room: 'Auditório / Sala de SST Unidade Assari',
        leaderName: 'Coordenação Brigada ASSARI / SST',
        leaderRole: 'Técnico de Segurança do Trabalho - Assari',
        expected: 15,
        data: row.assari,
      },
      {
        loc: 'adm',
        code: 'agricola',
        room: 'Sala de Treinamento Agrícola / ADM Central',
        leaderName: 'Coordenação Brigada Agrícola & ADM / SST',
        leaderRole: 'Técnico de Segurança do Trabalho - Agrícola/ADM',
        expected: 16,
        data: row.agricola,
      },
    ];

    units.forEach((u) => {
      const isDone = u.data.status === 'realizada';
      list.push({
        id: `agenda-${row.monthLabel.toLowerCase()}-${u.code}`,
        monthIndex: row.monthIndex,
        monthLabel: row.monthLabel,
        location: u.loc,
        theme: u.data.theme,
        dateDisplay: u.data.dateDisplay,
        meetingDate: u.data.iso,
        time: '08:30 h',
        room: u.room,
        leaderName: u.leaderName,
        leaderRole: u.leaderRole,
        status: u.data.status,
        objectives: `Capacitação técnica e alinhamento mensal da Brigada de Emergência UISA (${row.monthLabel}) — Tema: ${u.data.theme}`,
        agendaItems: [
          `Apresentação teórica e protocolo operacional: ${u.data.theme}`,
          'Checklist de prontidão dos equipamentos, rádios e EPIs da equipe',
          'Exercício prático / simulação de campo conforme cronograma SST',
        ],
        attendeesCount: isDone ? u.expected - 1 : 0,
        expectedAttendees: u.expected,
        minutesSummary: isDone
          ? `Reunião de ${row.monthLabel} realizada conforme Agenda Oficial da Brigada UISA (${u.data.dateDisplay}).`
          : `Reunião programada para ${u.data.dateDisplay} conforme Agenda Oficial da Brigada UISA.`,
        actionPoints: isDone
          ? ['Lista de presença assinada e arquivada junto ao SESMT']
          : ['Confirmar convocação dos brigadistas dos turnos A, B e C'],
      });
    });
  });

  return list;
};

export const INITIAL_BRIGADE_MEETINGS: BrigadeMeeting[] = buildInitialMeetings();

export const STORAGE_KEY_MEETINGS = 'sge_desktop_brigade_meetings_uisa_v2';

interface BrigadeMeetingsViewProps {
  members: BrigadeMember[];
  onOpenUnitAta?: (unit: BrigadeMeetingLocation) => void;
}

export const BrigadeMeetingsView: React.FC<BrigadeMeetingsViewProps> = ({ members, onOpenUnitAta }) => {
  const [viewSection, setViewSection] = useState<'calendario' | 'detalhes'>('calendario');
  const [selectedLocation, setSelectedLocation] = useState<BrigadeMeetingLocation>('industria');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'realizada' | 'agendada'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [isSstRe086ModalOpen, setIsSstRe086ModalOpen] = useState<boolean>(false);

  const [meetings, setMeetings] = useState<BrigadeMeeting[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MEETINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar agenda de reuniões:', e);
    }
    return INITIAL_BRIGADE_MEETINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEETINGS, JSON.stringify(meetings));
    } catch (e) {
      console.error('Erro ao salvar agenda de reuniões:', e);
    }
  }, [meetings]);

  // Inline edit state for annual table cell
  const [editingMeeting, setEditingMeeting] = useState<BrigadeMeeting | null>(null);
  const [editDateDisplay, setEditDateDisplay] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editStatus, setEditStatus] = useState<'realizada' | 'agendada'>('agendada');

  // New Meeting form states
  const [newTheme, setNewTheme] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('08:30 h');
  const [newRoom, setNewRoom] = useState<string>('');
  const [newLeader, setNewLeader] = useState<string>('Coordenação Brigada / SST');
  const [newLeaderRole, setNewLeaderRole] = useState<string>('Coordenador da Brigada');
  const [newObjectives, setNewObjectives] = useState<string>('');
  const [newAgenda, setNewAgenda] = useState<string>('');
  const [newExpectedAttendees, setNewExpectedAttendees] = useState<number>(18);

  const stats = useMemo(() => {
    const total = meetings.length;
    const realizadas = meetings.filter((m) => m.status === 'realizada').length;
    const programadas = meetings.filter((m) => m.status === 'agendada').length;
    const rate = total > 0 ? Math.round((realizadas / total) * 100) : 0;
    return { total, realizadas, programadas, rate };
  }, [meetings]);

  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Rows grouped by month for the Annual Calendar Matrix
  const annualRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return monthNames
      .map((mLabel, mIdx) => {
        const ind = meetings.find((m) => m.monthIndex === mIdx && m.location === 'industria');
        const assari = meetings.find((m) => m.monthIndex === mIdx && m.location === 'empacotamento');
        const agricola = meetings.find((m) => m.monthIndex === mIdx && m.location === 'adm');

        const matchesStatus =
          statusFilter === 'todos' ||
          ind?.status === statusFilter ||
          assari?.status === statusFilter ||
          agricola?.status === statusFilter;

        const matchesQuery =
          !q ||
          mLabel.toLowerCase().includes(q) ||
          (ind?.theme || '').toLowerCase().includes(q) ||
          (assari?.theme || '').toLowerCase().includes(q) ||
          (agricola?.theme || '').toLowerCase().includes(q) ||
          (ind?.dateDisplay || '').toLowerCase().includes(q) ||
          (assari?.dateDisplay || '').toLowerCase().includes(q) ||
          (agricola?.dateDisplay || '').toLowerCase().includes(q);

        return { monthIndex: mIdx, monthLabel: mLabel, ind, assari, agricola, visible: matchesStatus && matchesQuery };
      })
      .filter((r) => r.visible);
  }, [meetings, statusFilter, searchQuery]);

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter((m) => {
        const matchLocation = m.location === selectedLocation;
        const matchStatus = statusFilter === 'todos' || m.status === statusFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          m.monthLabel.toLowerCase().includes(q) ||
          m.theme.toLowerCase().includes(q) ||
          m.dateDisplay.toLowerCase().includes(q) ||
          m.leaderName.toLowerCase().includes(q) ||
          m.room.toLowerCase().includes(q);
        return matchLocation && matchStatus && matchSearch;
      })
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [meetings, selectedLocation, statusFilter, searchQuery]);

  const handleToggleMeetingStatus = (meetingId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const nextStatus = m.status === 'realizada' ? 'agendada' : 'realizada';
        return {
          ...m,
          status: nextStatus,
          attendeesCount: nextStatus === 'realizada' ? Math.max(1, m.expectedAttendees - 1) : 0,
        };
      })
    );
  };

  const handleOpenEditCell = (meeting: BrigadeMeeting) => {
    setEditingMeeting(meeting);
    setEditDateDisplay(meeting.dateDisplay);
    setEditTheme(meeting.theme);
    setEditStatus(meeting.status);
  };

  const handleSaveEditCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === editingMeeting.id
          ? {
              ...m,
              dateDisplay: editDateDisplay.trim() || m.dateDisplay,
              theme: editTheme.trim() || m.theme,
              status: editStatus,
              attendeesCount: editStatus === 'realizada' ? Math.max(1, m.expectedAttendees - 1) : 0,
            }
          : m
      )
    );
    setEditingMeeting(null);
  };

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.trim()) {
      setModalError('Preencha o tema da reunião antes de confirmar o agendamento.');
      return;
    }
    setModalError(null);

    const parsedDate = new Date(newDate + 'T00:00:00');
    const mIdx = isNaN(parsedDate.getTime()) ? 0 : parsedDate.getMonth();
    const formattedDateBR = newDate.includes('-')
      ? newDate.split('-').reverse().join('/')
      : newDate;

    const created: BrigadeMeeting = {
      id: `meet-${selectedLocation}-${Date.now()}`,
      monthIndex: mIdx,
      monthLabel: monthNames[mIdx] || 'EXTRA',
      location: selectedLocation,
      theme: newTheme.trim(),
      dateDisplay: formattedDateBR,
      meetingDate: newDate,
      time: newTime.trim(),
      room: newRoom.trim() || 'Sala de Treinamento da Brigada',
      leaderName: newLeader.trim(),
      leaderRole: newLeaderRole.trim(),
      status: 'agendada',
      objectives: newObjectives.trim() || 'Alinhamento operacional e capacitação contínua da equipe.',
      agendaItems: newAgenda
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      attendeesCount: 0,
      expectedAttendees: Number(newExpectedAttendees) || 15,
      minutesSummary: 'Reunião agendada no cronograma de segurança.',
      actionPoints: [],
    };

    setMeetings((prev) => [created, ...prev]);
    setIsModalOpen(false);
    setNewTheme('');
    setNewObjectives('');
    setNewAgenda('');
  };

  const handleResetOfficialAgenda = () => {
    setConfirmResetOpen(true);
  };

  const confirmResetAgenda = () => {
    setMeetings(INITIAL_BRIGADE_MEETINGS);
    setConfirmResetOpen(false);
  };

  const handlePrintAta = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const renderStatusBadge = (meeting: BrigadeMeeting) => {
    const isDone = meeting.status === 'realizada';
    return (
      <button
        type="button"
        onClick={() => handleToggleMeetingStatus(meeting.id)}
        title="Clique para alternar entre Realizado e Programado"
        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors ${
          isDone
            ? 'bg-emerald-100 text-[#007960] border-[#007960]/30 hover:bg-emerald-200'
            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
        }`}
      >
        {isDone ? 'Realizado' : 'Programado'}
      </button>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-[#007960]/20 p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Agenda de Reunião da Brigada UISA
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 uppercase">
                NBR 14276 & NR-23
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                IND • ASSARI • AGRÍCOLA ({members.length} brigadistas)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Calendário anual oficial de reuniões mensais (JAN a DEZ) com datas previstas, status Realizado/Programado e temas técnicos por unidade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir Agenda</span>
          </button>
          <button
            type="button"
            onClick={handleResetOfficialAgenda}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition-all"
            title="Restaurar datas e temas oficiais da Agenda UISA"
          >
            <span>Restaurar Padrão</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Reunião Extra</span>
          </button>
        </div>
      </div>

      {confirmResetOpen && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-amber-900">
            <strong className="block font-bold">Restaurar Agenda Oficial Padrão UISA (JAN–DEZ)?</strong>
            <span>Alterações manuais feitas diretamente na tabela anual serão revertidas para os dados originais.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmResetAgenda}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              Confirmar Restauração
            </button>
          </div>
        </div>
      )}

      {/* Referência Oficial SST.RE-086 */}
      <SstRe086ReferenceBanner
        unitLabel="TODAS AS UNIDADES (IND • ASSARI • ADM/GMA)"
        onOpenViewer={() => setIsSstRe086ModalOpen(true)}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
            Reuniões no Cronograma
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{stats.total}</span>
            <span className="text-xs text-slate-500">registros (3 polos)</span>
          </div>
        </div>

        <div className="bg-white border border-[#007960]/30 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#007960] block">
            Realizadas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#007960] font-mono">{stats.realizadas}</span>
            <span className="text-xs text-[#007960] font-semibold">concluídas</span>
          </div>
        </div>

        <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-blue-700 block">
            Programadas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-700 font-mono">{stats.programadas}</span>
            <span className="text-xs text-blue-600 font-semibold">previstas</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
            Aderência Atual
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#007960] font-mono">{stats.rate}%</span>
            <span className="text-xs text-slate-500">executado</span>
          </div>
        </div>
      </div>

      {/* Sub-view Switcher + Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#007960]/20 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViewSection('calendario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewSection === 'calendario'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-[#007960]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tabela Agenda Anual (IND • ASSARI • AGRÍCOLA)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewSection('detalhes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewSection === 'detalhes'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-[#007960]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Detalhamento & Atas por Polo</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mês, data ou tema..."
              className="bg-[#f8faf9] border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960] w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-[#007960]"
          >
            <option value="todos">Status: Todos</option>
            <option value="realizada">Somente Realizado</option>
            <option value="agendada">Somente Programado</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: TABELA AGENDA ANUAL OFICIAL UISA (JAN A DEZ) */}
      {viewSection === 'calendario' && (
        <div className="bg-white border border-[#007960]/25 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-[#007960] to-[#005a47] text-white flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                AGENDA DE REUNIÃO DA BRIGADA UISA — CRONOGRAMA ANUAL
              </h3>
              <p className="text-[11px] text-emerald-100">
                Clique em Realizado/Programado para atualizar o status ou no ícone de edição para ajustar datas e temas
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 font-mono text-[11px] font-bold">
              JAN a DEZ • 3 Polos Operacionais
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf9] border-b-2 border-[#007960]/30 text-slate-800 uppercase font-mono text-[11px]">
                  <th className="py-3 px-4 w-20 border-r border-slate-200 font-black">Mês</th>
                  <th className="py-3 px-3 w-28 border-r border-slate-200 font-bold">Item</th>
                  <th className="py-3 px-4 border-r border-slate-200 font-black text-[#007960]">
                    <div className="flex items-center gap-1.5">
                      <Factory className="w-3.5 h-3.5" />
                      <span>IND (Indústria)</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 border-r border-slate-200 font-black text-[#007960]">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>ASSARI (Empacotamento)</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-black text-[#007960]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>AGRÍCOLA (ADM / Agrícola)</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {annualRows.map((row) => (
                  <React.Fragment key={row.monthLabel}>
                    {/* Linha 1: Previsto */}
                    <tr className="bg-white hover:bg-slate-50/70">
                      <td
                        rowSpan={3}
                        className="py-3 px-4 border-r border-slate-200 align-middle text-center bg-emerald-50/40"
                      >
                        <span className="text-sm font-black font-mono text-[#007960] block">
                          {row.monthLabel}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-600 text-[11px] bg-[#fcfdfc]">
                        Previsto
                      </td>
                      {[row.ind, row.assari, row.agricola].map((cell, idx) => (
                        <td
                          key={idx}
                          className={`py-2 px-4 font-mono font-bold text-slate-900 ${
                            idx < 2 ? 'border-r border-slate-200' : ''
                          }`}
                        >
                          {cell ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#007960] shrink-0" />
                                <span>{cell.dateDisplay}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditCell(cell)}
                                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#007960] transition-colors print:hidden"
                                title="Editar data/tema desta reunião"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Linha 2: Realizado / Programado */}
                    <tr className="bg-[#fcfdfc]">
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-600 text-[11px]">
                        Realizado
                      </td>
                      {[row.ind, row.assari, row.agricola].map((cell, idx) => (
                        <td
                          key={idx}
                          className={`py-2 px-4 ${idx < 2 ? 'border-r border-slate-200' : ''}`}
                        >
                          {cell ? renderStatusBadge(cell) : '-'}
                        </td>
                      ))}
                    </tr>

                    {/* Linha 3: Tema */}
                    <tr className="bg-white border-b-2 border-slate-200">
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-600 text-[11px] bg-[#fcfdfc]">
                        Tema
                      </td>
                      {[row.ind, row.assari, row.agricola].map((cell, idx) => (
                        <td
                          key={idx}
                          className={`py-2.5 px-4 text-slate-800 font-medium leading-snug ${
                            idx < 2 ? 'border-r border-slate-200' : ''
                          }`}
                        >
                          {cell ? cell.theme : '-'}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {annualRows.length === 0 && (
              <div className="p-10 text-center text-slate-500 text-xs">
                Nenhum mês encontrado na agenda para os filtros informados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DETALHAMENTO & ATAS POR POLO */}
      {viewSection === 'detalhes' && (
        <>
          {/* 3 Main Location Tabs (IND, ASSARI, AGRÍCOLA) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. IND */}
            <button
              type="button"
              onClick={() => setSelectedLocation('industria')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                selectedLocation === 'industria'
                  ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  selectedLocation === 'industria'
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
                }`}
              >
                <Factory className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm">IND — Indústria</h3>
                  <span className="text-[10px] font-mono font-bold text-[#007960]">
                    {meetings.filter((m) => m.location === 'industria').length} Reuniões
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Destilaria, Caldeiras, Moenda, Tancagem de Etanol</p>
              </div>
            </button>

            {/* 2. ASSARI */}
            <button
              type="button"
              onClick={() => setSelectedLocation('empacotamento')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                selectedLocation === 'empacotamento'
                  ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  selectedLocation === 'empacotamento'
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm">ASSARI — Empacotamento</h3>
                  <span className="text-[10px] font-mono font-bold text-[#007960]">
                    {meetings.filter((m) => m.location === 'empacotamento').length} Reuniões
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Unidade Assari, Silos, Linhas de Ensaque e Docas</p>
              </div>
            </button>

            {/* 3. AGRÍCOLA */}
            <button
              type="button"
              onClick={() => setSelectedLocation('adm')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                selectedLocation === 'adm'
                  ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  selectedLocation === 'adm'
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm">AGRÍCOLA / ADM</h3>
                  <span className="text-[10px] font-mono font-bold text-[#007960]">
                    {meetings.filter((m) => m.location === 'adm').length} Reuniões
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Brigada Agrícola, Prédio Central, Posto e Oficinas</p>
              </div>
            </button>
          </div>

          {/* Meetings List / Cards */}
          <div className="space-y-4">
            {filteredMeetings.map((meet) => {
              const isDone = meet.status === 'realizada';
              return (
                <div
                  key={meet.id}
                  className="bg-white border border-[#007960]/20 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 uppercase">
                          {meet.monthLabel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                          {meet.location === 'industria'
                            ? 'IND (Indústria)'
                            : meet.location === 'empacotamento'
                            ? 'ASSARI (Empacotamento)'
                            : 'AGRÍCOLA (ADM / Agrícola)'}
                        </span>
                        {renderStatusBadge(meet)}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[#007960] shrink-0" />
                        <span>Tema: {meet.theme}</span>
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Objetivo:</strong> {meet.objectives}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0">
                      <div className="bg-[#f8faf9] px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#007960]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{meet.dateDisplay}</span>
                          <span>• {meet.time}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[220px]">
                          {meet.room}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {onOpenUnitAta && (
                          <button
                            type="button"
                            onClick={() => onOpenUnitAta(meet.location)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Registrar Ata & Facial</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditCell(meet)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#007960]" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintAta}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#007960]" />
                          <span>Imprimir Ata</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#007960]" />
                        <span>Pauta Discutida & Tópicos Práticos</span>
                      </span>
                      <ul className="space-y-1.5 text-slate-700">
                        {meet.agendaItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#007960] shrink-0 mt-1.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#007960]" />
                        <span>Resumo & Encaminhamentos</span>
                      </span>
                      <p className="text-slate-700 leading-relaxed">{meet.minutesSummary}</p>

                      {meet.actionPoints.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 mt-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Providências:
                          </span>
                          <ul className="space-y-1 text-[11px] text-[#007960] font-medium">
                            {meet.actionPoints.map((act, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="text-xs">➔</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#007960]" />
                      <span>
                        <strong>Coordenador / Instrutor:</strong> {meet.leaderName} ({meet.leaderRole})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>
                        Presença Confirmada:{' '}
                        <strong className="text-slate-900">
                          {isDone ? `${meet.attendeesCount} / ${meet.expectedAttendees}` : `Previsto: ${meet.expectedAttendees}`}
                        </strong>{' '}
                        brigadistas
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal: Editar Data, Status ou Tema da Agenda */}
      {editingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#f8faf9]">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Editar Reunião — {editingMeeting.monthLabel} ({editingMeeting.location === 'industria' ? 'IND' : editingMeeting.location === 'empacotamento' ? 'ASSARI' : 'AGRÍCOLA'})
                </h3>
                <p className="text-[11px] text-slate-500">Atualize data prevista, status ou tema</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMeeting(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCell} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data Prevista:</label>
                <input
                  type="text"
                  value={editDateDisplay}
                  onChange={(e) => setEditDateDisplay(e.target.value)}
                  required
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status de Execução:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'realizada' | 'agendada')}
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-[#007960]"
                >
                  <option value="realizada">Realizado</option>
                  <option value="agendada">Programado</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tema da Reunião:</label>
                <textarea
                  rows={3}
                  value={editTheme}
                  onChange={(e) => setEditTheme(e.target.value)}
                  required
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agendar Nova Reunião de Brigada */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f8faf9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Agendar Reunião Extra de Brigada</h3>
                  <p className="text-xs text-slate-500">
                    Definição de tema técnico e calendário para o polo selecionado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMeeting} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 font-semibold">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tema da Reunião *</label>
                <input
                  type="text"
                  value={newTheme}
                  onChange={(e) => {
                    setNewTheme(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  placeholder="Ex: Treinamento de Combate a Incêndio em Bagaço e Resfriamento"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Polo / Unidade</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value as BrigadeMeetingLocation)}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
                  >
                    <option value="industria">IND (Indústria)</option>
                    <option value="empacotamento">ASSARI (Empacotamento)</option>
                    <option value="adm">AGRÍCOLA (ADM / Agrícola)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Data da Reunião *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Horário *</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="08:30 h"
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Sala / Local Físico</label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="Ex: Sala de Treinamento da Brigada / Pátio Operacional"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Coordenador / Instrutor</label>
                  <input
                    type="text"
                    value={newLeader}
                    onChange={(e) => setNewLeader(e.target.value)}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Efetivo Convocado (Qtd)</label>
                  <input
                    type="number"
                    value={newExpectedAttendees}
                    onChange={(e) => setNewExpectedAttendees(Number(e.target.value))}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Objetivos Operacionais</label>
                <textarea
                  rows={2}
                  value={newObjectives}
                  onChange={(e) => setNewObjectives(e.target.value)}
                  placeholder="Descreva as metas de aprendizado e habilidades..."
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Pauta da Reunião (Um item por linha)
                </label>
                <textarea
                  rows={3}
                  value={newAgenda}
                  onChange={(e) => setNewAgenda(e.target.value)}
                  placeholder="Ex:&#10;1. Verificação de EPIs e EPR&#10;2. Procedimento de acionamento do rádio VHF Canal 01&#10;3. Simulação prática de combate"
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold shadow-xs"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SstRe086ReferenceModal
        isOpen={isSstRe086ModalOpen}
        onClose={() => setIsSstRe086ModalOpen(false)}
      />
    </div>
  );
};
