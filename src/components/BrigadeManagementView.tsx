import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  Flame,
  Plus,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Radio,
  Phone,
  Calendar,
  Building2,
  Award,
  ChevronRight,
  Edit2,
  Trash2,
  HeartPulse,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  FileCheck2,
  Factory,
  Package,
  ScanFace,
  FileText,
} from 'lucide-react';
import {
  BrigadeMember,
  BrigadeUnit,
  BrigadeShift,
  BrigadeRole,
  BrigadeStatus,
} from '../types/brigade';
import {
  BRIGADE_UNITS,
  BRIGADE_SHIFTS,
  ROLE_LABELS,
  STATUS_LABELS,
  getCurrentActiveShift,
  getTrainingStatus,
} from '../data/brigadeData';
import { formatDateBR } from '../utils/formatters';
import { playIndustrialSound } from '../utils/audioAlerts';
import { BrigadeMemberFormModal } from './BrigadeMemberFormModal';
import { BrigadeRosterPrintModal } from './BrigadeRosterPrintModal';
import { BrigadeMeetingsView } from './BrigadeMeetingsView';
import { BrigadeUnitAtaView } from './BrigadeUnitAtaView';
import { SstRe086ReferenceModal } from './SstRe086ReferenceModal';

interface BrigadeManagementViewProps {
  members: BrigadeMember[];
  onUpdateMembers: (newMembers: BrigadeMember[]) => void;
  onNavigateToPAE?: () => void;
  onOpenPdfArchive?: () => void;
}

export const BrigadeManagementView: React.FC<BrigadeManagementViewProps> = ({
  members,
  onUpdateMembers,
  onNavigateToPAE,
  onOpenPdfArchive,
}) => {
  // Sub-navigation: Efetivo, Agenda Anual e Abas por Unidade (Indústria, Empacotamento, ADM/GMA)
  const [activeBrigadeTab, setActiveBrigadeTab] = useState<
    'efetivo' | 'reunioes' | 'reuniao_industria' | 'reuniao_empacotamento' | 'reuniao_adm'
  >('efetivo');

  // Navigation / Filters
  const [selectedUnit, setSelectedUnit] = useState<BrigadeUnit | 'todas'>('todas');
  const [selectedShift, setSelectedShift] = useState<BrigadeShift | 'todos'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<BrigadeStatus | 'todos'>('todos');
  const [selectedTrainingStatus, setSelectedTrainingStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'tabela'>('cards');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<BrigadeMember | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSstRe086ModalOpen, setIsSstRe086ModalOpen] = useState(false);

  // Live active shift calculation (updates every minute)
  const [liveShiftInfo, setLiveShiftInfo] = useState(() => getCurrentActiveShift());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveShiftInfo(getCurrentActiveShift());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filtered list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (selectedUnit !== 'todas' && member.unit !== selectedUnit) return false;
      if (selectedShift !== 'todos' && member.shift !== selectedShift) return false;
      if (selectedStatus !== 'todos' && member.status !== selectedStatus) return false;

      if (selectedTrainingStatus !== 'todos') {
        const st = getTrainingStatus(member.trainingExpiryDate);
        if (st.status !== selectedTrainingStatus) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = member.name.toLowerCase().includes(q);
        const matchRE = member.registrationNumber?.toLowerCase().includes(q);
        const matchRadio = member.radioCallsign?.toLowerCase().includes(q);
        const matchAssignment = member.specificAssignment?.toLowerCase().includes(q);
        const matchRole = ROLE_LABELS[member.role]?.label.toLowerCase().includes(q);
        if (!matchName && !matchRE && !matchRadio && !matchAssignment && !matchRole) {
          return false;
        }
      }

      return true;
    });
  }, [members, selectedUnit, selectedShift, selectedStatus, selectedTrainingStatus, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = members.length;
    const activeOnDuty = members.filter((m) => m.status === 'ativo_plantao').length;
    const inLeave = members.filter((m) => m.status === 'folga').length;
    const inVacation = members.filter((m) => m.status === 'ferias').length;
    const away = members.filter((m) => m.status === 'afastado').length;

    const countShiftA = members.filter((m) => m.shift === 'turno_a').length;
    const countShiftB = members.filter((m) => m.shift === 'turno_b').length;
    const countShiftC = members.filter((m) => m.shift === 'turno_c').length;
    const countShiftAdm = members.filter((m) => m.shift === 'administrativo').length;

    // Training compliance
    let trainingValid = 0;
    let trainingExpiringSoon = 0;
    let trainingExpired = 0;

    members.forEach((m) => {
      const st = getTrainingStatus(m.trainingExpiryDate);
      if (st.status === 'valido') trainingValid++;
      else if (st.status === 'alerta_30d') trainingExpiringSoon++;
      else trainingExpired++;
    });

    const scbaCount = members.filter((m) => m.hasScbaTraining).length;
    const firstAidCount = members.filter((m) => m.role === 'socorrista').length;

    return {
      total,
      activeOnDuty,
      inLeave,
      inVacation,
      away,
      countShiftA,
      countShiftB,
      countShiftC,
      countShiftAdm,
      trainingValid,
      trainingExpiringSoon,
      trainingExpired,
      scbaCount,
      firstAidCount,
    };
  }, [members]);

  // Active shift on-duty count
  const liveActiveDutyCount = useMemo(() => {
    return members.filter(
      (m) => m.shift === liveShiftInfo.activeShift && m.status === 'ativo_plantao'
    ).length;
  }, [members, liveShiftInfo]);

  // Handlers for Member Management
  const handleSaveMember = (member: BrigadeMember) => {
    const exists = members.some((m) => m.id === member.id);
    let updated: BrigadeMember[];
    if (exists) {
      updated = members.map((m) => (m.id === member.id ? member : m));
    } else {
      updated = [member, ...members];
    }
    onUpdateMembers(updated);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o brigadista ${name} da escala?`)) {
      const updated = members.filter((m) => m.id !== id);
      onUpdateMembers(updated);
      playIndustrialSound('ping');
    }
  };

  const handleToggleStatus = (id: string, currentStatus: BrigadeStatus) => {
    const nextStatusMap: Record<BrigadeStatus, BrigadeStatus> = {
      ativo_plantao: 'folga',
      folga: 'ferias',
      ferias: 'afastado',
      afastado: 'ativo_plantao',
    };
    const nextStatus = nextStatusMap[currentStatus];
    const updated = members.map((m) => (m.id === id ? { ...m, status: nextStatus } : m));
    onUpdateMembers(updated);
    playIndustrialSound('ping');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'RE/Matrícula',
      'Nome Completo',
      'Unidade',
      'Turno',
      'Horário',
      'Função Brigada',
      'Atribuição Tática',
      'Prefixo Rádio',
      'Telefone/Ramal',
      'Status Plantão',
      'Nível Treinamento',
      'Data Treinamento',
      'Validade Treinamento',
      'Data ASO',
      'EPR Máscara Autônoma',
      'Tipo Sanguíneo',
      'EPIs Vinculados',
      'Observações',
    ];

    const rows = filteredMembers.map((m) => {
      const u = (m.unit ? BRIGADE_UNITS[m.unit]?.name : undefined) || m.unit || m.sector || '';
      const s = BRIGADE_SHIFTS[m.shift]?.name || m.shift;
      const shHours = BRIGADE_SHIFTS[m.shift]?.hours || '';
      const r = ROLE_LABELS[m.role]?.label || m.role;
      const st = (m.status ? STATUS_LABELS[m.status]?.label : undefined) || m.status || '';

      return [
        `"${m.registrationNumber || ''}"`,
        `"${m.name.replace(/"/g, '""')}"`,
        `"${u}"`,
        `"${s}"`,
        `"${shHours}"`,
        `"${r}"`,
        `"${(m.specificAssignment || '').replace(/"/g, '""')}"`,
        `"${m.radioCallsign || ''}"`,
        `"${m.phone || ''}"`,
        `"${st}"`,
        `"${m.trainingLevel}"`,
        `"${m.trainingCertificationDate}"`,
        `"${m.trainingExpiryDate}"`,
        `"${m.medicalCheckDate}"`,
        m.hasScbaTraining ? 'SIM' : 'NÃO',
        `"${m.bloodType || ''}"`,
        `"${(m.ppeKits || []).join(', ')}"`,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Escala_Brigada_uisa_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playIndustrialSound('success');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-50 text-[#007960] border border-[#007960]/40">
                SST.AN-014 • NBR 14276 / NR-23
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[#007960] bg-[#007960]/10 border border-[#007960]/30 font-bold">
                Prontidão 24 Horas
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-300">
                Rádio Canal 01
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-[#007960]" />
              Gestão de Brigadistas por Turno & Unidade
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Controle de efetivo operacional de brigada industrial, empacotamento, administração,
              posto de combustível e brigada florestal, divididos nos{' '}
              <strong className="text-slate-900">Turnos A, B e C</strong> com cobertura contínua e
              dimensionamento mínimo de segurança.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setMemberToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#007960] hover:bg-[#00604c] text-white text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Brigadista</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold transition-all"
              title="Visualizar e Imprimir Escala de Brigada Oficial (SST.AN-014)"
            >
              <Printer className="w-4 h-4 text-[#007960]" />
              <span>Imprimir Escala</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSstRe086ModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007960] border border-[#007960]/30 text-xs font-bold transition-all shadow-2xs"
              title="Abrir Formulário Oficial de Referência SST.RE-086 — Ata de Reunião Brigada de Incêndio"
            >
              <FileText className="w-4 h-4" />
              <span>Ref. SST.RE-086</span>
            </button>

            {onOpenPdfArchive && (
              <button
                onClick={onOpenPdfArchive}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
                title="Armazenamento e Repositório de Atas e Checklists da Brigada em PDF"
              >
                <FileCheck2 className="w-4 h-4 text-[#007960]" />
                <span>Armazenamento PDF</span>
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold transition-all"
              title="Exportar dados para Excel (.CSV)"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#007960]" />
              <span>Exportar CSV</span>
            </button>

            {onNavigateToPAE && (
              <button
                onClick={onNavigateToPAE}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007960] border border-[#007960]/30 text-xs font-semibold transition-all"
                title="Ver Procedimentos e Protocolos no PAE Oficial"
              >
                <span>Ver PAE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Shift Active Indicator Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f8faf9] -mx-6 -mb-6 p-4 px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#007960]"></span>
            </div>
            <div className="text-xs">
              <span className="text-slate-600">Turno de Plantão Ativo Agora: </span>
              <strong className="text-[#007960] uppercase font-mono font-bold">
                {BRIGADE_SHIFTS[liveShiftInfo.activeShift]?.name}
              </strong>
              <span className="text-slate-500 ml-1.5 font-mono">
                ({BRIGADE_SHIFTS[liveShiftInfo.activeShift]?.hours})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Users className="w-3.5 h-3.5 text-[#007960]" />
              <span>
                Efetivo em Posto:{' '}
                <strong className="text-slate-900 text-sm font-bold">{liveActiveDutyCount}</strong> brigadistas ativos
              </span>
            </div>

            <div className="h-3 w-px bg-slate-300 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-slate-600">
              <Radio className="w-3.5 h-3.5 text-[#007960]" />
              <span>Canal Rádio: CAE Canal 01</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Aba Navigation: Efetivo, Agenda Anual e Reuniões/Ata com Facial por Unidade */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#007960]/20 shadow-2xs print:hidden">
        <button
          onClick={() => setActiveBrigadeTab('efetivo')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeBrigadeTab === 'efetivo'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Efetivo Operacional (A, B, C)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeBrigadeTab === 'efetivo' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveBrigadeTab('reunioes')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeBrigadeTab === 'reunioes'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda Anual (JAN–DEZ)</span>
        </button>

        <button
          onClick={() => setActiveBrigadeTab('reuniao_industria')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeBrigadeTab === 'reuniao_industria'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Indústria • Reunião & Ata</span>
          <ScanFace
            className={`w-3.5 h-3.5 ${
              activeBrigadeTab === 'reuniao_industria' ? 'text-emerald-200' : 'text-[#007960]'
            }`}
          />
        </button>

        <button
          onClick={() => setActiveBrigadeTab('reuniao_empacotamento')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeBrigadeTab === 'reuniao_empacotamento'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Empacotamento • Reunião & Ata</span>
          <ScanFace
            className={`w-3.5 h-3.5 ${
              activeBrigadeTab === 'reuniao_empacotamento' ? 'text-emerald-200' : 'text-[#007960]'
            }`}
          />
        </button>

        <button
          onClick={() => setActiveBrigadeTab('reuniao_adm')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeBrigadeTab === 'reuniao_adm'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>ADM/GMA • Reunião & Ata</span>
          <ScanFace
            className={`w-3.5 h-3.5 ${
              activeBrigadeTab === 'reuniao_adm' ? 'text-emerald-200' : 'text-[#007960]'
            }`}
          />
        </button>
      </div>

      {activeBrigadeTab === 'reunioes' ? (
        <BrigadeMeetingsView
          members={members}
          onOpenUnitAta={(loc) => {
            if (loc === 'industria') setActiveBrigadeTab('reuniao_industria');
            else if (loc === 'empacotamento') setActiveBrigadeTab('reuniao_empacotamento');
            else setActiveBrigadeTab('reuniao_adm');
          }}
        />
      ) : activeBrigadeTab === 'reuniao_industria' ? (
        <BrigadeUnitAtaView unit="industria" members={members} />
      ) : activeBrigadeTab === 'reuniao_empacotamento' ? (
        <BrigadeUnitAtaView unit="empacotamento" members={members} />
      ) : activeBrigadeTab === 'reuniao_adm' ? (
        <BrigadeUnitAtaView unit="adm" members={members} />
      ) : (
        <div className="space-y-6">
          {/* 2. KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Brigadistas */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Total Geral</span>
            <Users className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[10px] text-slate-500">Efetivo cadastrado</p>
        </div>

        {/* Em Plantão Hoje */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Em Plantão</span>
            <CheckCircle className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="text-2xl font-black text-[#007960]">{stats.activeOnDuty}</div>
          <p className="text-[10px] text-slate-500">
            {stats.total > 0 ? Math.round((stats.activeOnDuty / stats.total) * 100) : 0}% de prontidão
          </p>
        </div>

        {/* Turno A */}
        <div
          onClick={() => setSelectedShift(selectedShift === 'turno_a' ? 'todos' : 'turno_a')}
          className={`cursor-pointer transition-all border p-4 rounded-xl space-y-1 ${
            selectedShift === 'turno_a'
              ? 'bg-emerald-50 border-[#007960] ring-1 ring-[#007960]'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Turno A</span>
            <Clock className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.countShiftA}</div>
          <p className="text-[10px] text-slate-500 font-mono">00:20 às 08:20</p>
        </div>

        {/* Turno B */}
        <div
          onClick={() => setSelectedShift(selectedShift === 'turno_b' ? 'todos' : 'turno_b')}
          className={`cursor-pointer transition-all border p-4 rounded-xl space-y-1 ${
            selectedShift === 'turno_b'
              ? 'bg-emerald-50 border-[#007960] ring-1 ring-[#007960]'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Turno B</span>
            <Clock className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.countShiftB}</div>
          <p className="text-[10px] text-slate-500 font-mono">08:20 às 16:20</p>
        </div>

        {/* Turno C */}
        <div
          onClick={() => setSelectedShift(selectedShift === 'turno_c' ? 'todos' : 'turno_c')}
          className={`cursor-pointer transition-all border p-4 rounded-xl space-y-1 ${
            selectedShift === 'turno_c'
              ? 'bg-emerald-50 border-[#007960] ring-1 ring-[#007960]'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Turno C</span>
            <Clock className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.countShiftC}</div>
          <p className="text-[10px] text-slate-500 font-mono">16:20 às 00:20</p>
        </div>

        {/* Treinamentos Válidos */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Em Dia</span>
            <Award className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#007960]">{stats.trainingValid}</span>
            {stats.trainingExpiringSoon > 0 && (
              <span className="text-xs text-amber-600 font-bold font-mono">
                +{stats.trainingExpiringSoon} a vencer
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">Certificação válida</p>
        </div>

        {/* Treinamentos Vencidos (Notificação em Ponto Vermelho) */}
        <div
          onClick={() => setSelectedTrainingStatus(selectedTrainingStatus === 'vencido' ? 'todos' : 'vencido')}
          className={`cursor-pointer transition-all border p-4 rounded-xl space-y-1 shadow-2xs ${
            selectedTrainingStatus === 'vencido'
              ? 'bg-red-50 border-[#de2726] ring-2 ring-red-300'
              : stats.trainingExpired > 0
              ? 'bg-white border-red-300 hover:border-[#de2726]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase text-[#de2726]">Treinamento Vencido</span>
            <span className="w-3 h-3 rounded-full bg-[#de2726] animate-pulse ring-4 ring-red-100" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#de2726] font-mono">{stats.trainingExpired}</span>
            <span className="text-[10px] text-red-600 font-bold uppercase font-mono">Ponto Vermelho</span>
          </div>
          <p className="text-[10px] text-red-600 font-medium">
            {stats.trainingExpired > 0 ? 'Clique para filtrar brigadistas' : 'Nenhum vencido'}
          </p>
        </div>
      </div>

      {/* 3. Matriz Executiva: Dimensionamento Unidade × Turno */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#007960]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Matriz Operacional de Cobertura (Turno × Unidade)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Dimensionamento mínimo conforme ABNT NBR 14276 & Instrução Técnica CBM-MT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-600">
                <th className="py-2.5 px-3">Unidade Operacional</th>
                <th className="py-2.5 px-3 text-center">Turno A (06h - 14h20)</th>
                <th className="py-2.5 px-3 text-center">Turno B (14h20 - 22h40)</th>
                <th className="py-2.5 px-3 text-center">Turno C (22h40 - 06h00)</th>
                <th className="py-2.5 px-3 text-center">Administrativo</th>
                <th className="py-2.5 px-3 text-right">Total Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {(Object.keys(BRIGADE_UNITS) as BrigadeUnit[]).map((unitKey) => {
                const unit = BRIGADE_UNITS[unitKey];
                const unitMembers = members.filter((m) => m.unit === unitKey);
                const countA = unitMembers.filter((m) => m.shift === 'turno_a').length;
                const countB = unitMembers.filter((m) => m.shift === 'turno_b').length;
                const countC = unitMembers.filter((m) => m.shift === 'turno_c').length;
                const countAdm = unitMembers.filter((m) => m.shift === 'administrativo').length;
                const minA = unit.minHeadcountPerShift.turno_a;
                const minB = unit.minHeadcountPerShift.turno_b;
                const minC = unit.minHeadcountPerShift.turno_c;

                const isCurrentUnit = selectedUnit === unitKey;

                return (
                  <tr
                    key={unitKey}
                    className={`transition-colors ${
                      isCurrentUnit ? 'bg-emerald-50/60 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setSelectedUnit(isCurrentUnit ? 'todas' : unitKey)}
                        className="flex items-center gap-2 text-left hover:text-[#007960] transition-colors group"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: unit.color }}
                        />
                        <span className="font-sans font-bold text-slate-800 group-hover:text-[#007960]">
                          {unit.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({unit.shortName})
                        </span>
                      </button>
                    </td>

                    {/* Turno A */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedUnit(unitKey);
                          setSelectedShift('turno_a');
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          countA >= minA
                            ? 'bg-emerald-50 text-[#007960] border border-[#007960]/30 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                        }`}
                        title={`Efetivo Turno A: ${countA} (Mínimo recomendado: ${minA})`}
                      >
                        <span>{countA}</span>
                        <span className="text-[9px] text-slate-500 font-normal">/ min {minA}</span>
                      </button>
                    </td>

                    {/* Turno B */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedUnit(unitKey);
                          setSelectedShift('turno_b');
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          countB >= minB
                            ? 'bg-emerald-50 text-[#007960] border border-[#007960]/30 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                        }`}
                        title={`Efetivo Turno B: ${countB} (Mínimo recomendado: ${minB})`}
                      >
                        <span>{countB}</span>
                        <span className="text-[9px] text-slate-500 font-normal">/ min {minB}</span>
                      </button>
                    </td>

                    {/* Turno C */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedUnit(unitKey);
                          setSelectedShift('turno_c');
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          countC >= minC
                            ? 'bg-emerald-50 text-[#007960] border border-[#007960]/30 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                        }`}
                        title={`Efetivo Turno C: ${countC} (Mínimo recomendado: ${minC})`}
                      >
                        <span>{countC}</span>
                        <span className="text-[9px] text-slate-500 font-normal">/ min {minC}</span>
                      </button>
                    </td>

                    {/* Adm */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedUnit(unitKey);
                          setSelectedShift('administrativo');
                        }}
                        className="inline-flex items-center px-2 py-0.5 rounded text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold"
                      >
                        {countAdm}
                      </button>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-right font-bold text-slate-800">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-800 font-sans">
                        {unitMembers.length} brigadistas
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Unit Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedUnit('todas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedUnit === 'todas'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#007960] hover:bg-emerald-50'
            }`}
          >
            Todas as Unidades ({members.length})
          </button>
          {(Object.keys(BRIGADE_UNITS) as BrigadeUnit[]).map((uKey) => {
            const u = BRIGADE_UNITS[uKey];
            const cnt = members.filter((m) => m.unit === uKey).length;
            const isSelected = selectedUnit === uKey;
            return (
              <button
                key={uKey}
                onClick={() => setSelectedUnit(uKey)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#007960] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }} />
                <span>{u.shortName}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Line: Shifts, Status, Training & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-200 items-center">
          {/* Shift selector pills */}
          <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase font-mono mr-1">
              Turno:
            </span>
            <button
              onClick={() => setSelectedShift('todos')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedShift === 'todos'
                  ? 'bg-[#007960] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            {(Object.keys(BRIGADE_SHIFTS) as BrigadeShift[]).map((sKey) => {
              const s = BRIGADE_SHIFTS[sKey];
              const isSelected = selectedShift === sKey;
              return (
                <button
                  key={sKey}
                  onClick={() => setSelectedShift(sKey)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#007960] text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
            >
              <option value="todos">Status: Todos</option>
              <option value="ativo_plantao">🟢 Em Plantão</option>
              <option value="folga">⚪ Folga</option>
              <option value="ferias">🟡 Férias</option>
              <option value="afastado">🔴 Afastado</option>
            </select>
          </div>

          {/* Training filter */}
          <div className="md:col-span-2">
            <select
              value={selectedTrainingStatus}
              onChange={(e) => setSelectedTrainingStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
            >
              <option value="todos">Treinamento: Todos</option>
              <option value="valido">Em Dia (Válido)</option>
              <option value="alerta_30d">Vencendo em 30d</option>
              <option value="vencido">🔴 Treinamento Vencido ({stats.trainingExpired})</option>
            </select>
          </div>

          {/* Search Input & View Switcher */}
          <div className="md:col-span-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, RE, rádio..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#007960]"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-[#007960] text-white font-bold' : 'text-slate-600'
                }`}
                title="Modo Cards"
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('tabela')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'tabela' ? 'bg-[#007960] text-white font-bold' : 'text-slate-600'
                }`}
                title="Modo Tabela"
              >
                Tabela
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Members Content Area */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum brigadista encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Nenhum registro corresponde aos filtros selecionados. Altere os filtros de turno, unidade
            ou termo de busca, ou cadastre um novo brigadista.
          </p>
          <button
            onClick={() => {
              setSelectedUnit('todas');
              setSelectedShift('todos');
              setSelectedStatus('todos');
              setSelectedTrainingStatus('todos');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold"
          >
            Limpar Filtros
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const unitInfo = member.unit ? BRIGADE_UNITS[member.unit] : undefined;
            const shiftInfo = BRIGADE_SHIFTS[member.shift];
            const roleInfo = ROLE_LABELS[member.role];
            const statusInfo = member.status ? STATUS_LABELS[member.status] : STATUS_LABELS['ativo_plantao'];
            const trainStatus = getTrainingStatus(member.trainingExpiryDate);

            return (
              <div
                key={member.id}
                className="bg-white border border-slate-200 hover:border-[#007960]/40 rounded-2xl p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between"
              >
                {/* Card Top: Unit & Shift Badges + 1-Click Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {unitInfo?.shortName || member.unit}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono text-white"
                        style={{ backgroundColor: shiftInfo?.color || '#007960' }}
                      >
                        {shiftInfo?.name || member.shift}
                      </span>
                    </div>

                    {/* Quick Status Pill (Click to toggle) */}
                    <button
                      onClick={() => handleToggleStatus(member.id, member.status || 'ativo_plantao')}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition-all font-semibold"
                      title="Clique para alternar status: Plantão > Folga > Férias > Afastado"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo?.dotColor}`} />
                      <span>{statusInfo?.label}</span>
                    </button>
                  </div>

                  {/* Identification */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {trainStatus.status === 'vencido' && (
                          <span
                            className="w-3.5 h-3.5 rounded-full bg-[#de2726] animate-pulse ring-4 ring-red-200 shrink-0 inline-block"
                            title="PONTO VERMELHO: Treinamento de Brigada Vencido!"
                          />
                        )}
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{member.name}</h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {member.registrationNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#007960] border border-[#007960]/30"
                      >
                        {roleInfo?.label || member.role}
                      </span>
                      {member.hasScbaTraining && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          EPR Máscara Scott
                        </span>
                      )}
                      {member.bloodType && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {member.bloodType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tactical Assignment */}
                  {member.specificAssignment && (
                    <div className="bg-[#f8faf9] border border-slate-200 p-2.5 rounded-xl text-xs space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Atribuição Tática:
                      </span>
                      <p className="text-slate-800 text-xs font-medium leading-snug">
                        {member.specificAssignment}
                      </p>
                    </div>
                  )}

                  {/* Contacts & Radio */}
                  <div className="space-y-1.5 text-xs font-mono pt-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Radio className="w-3.5 h-3.5 text-[#007960]" />
                        <span>Rádio:</span>
                      </span>
                      <span className="text-slate-900 font-bold">{member.radioCallsign}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-[#007960]" />
                        <span>Telefone/Ramal:</span>
                      </span>
                      <span className="text-slate-800">{member.phone}</span>
                    </div>
                  </div>

                  {/* Compliance & Certifications */}
                  <div className="border-t border-slate-200 pt-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Treinamento Brigada:</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                          trainStatus.status === 'vencido'
                            ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                            : trainStatus.status === 'alerta_30d'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                            : 'bg-emerald-50 text-[#007960] border-[#007960]/30 font-bold'
                        }`}
                      >
                        {formatDateBR(member.trainingExpiryDate)} ({trainStatus.label})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Exame Médico (ASO):</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {formatDateBR(member.medicalCheckDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {shiftInfo?.hours}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setMemberToEdit(member);
                        setIsFormModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#007960] hover:bg-emerald-50 transition-colors"
                      title="Editar dados do brigadista"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#007960]" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remover brigadista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABULAR VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                  <th className="py-3 px-4">RE</th>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Unidade</th>
                  <th className="py-3 px-4">Turno</th>
                  <th className="py-3 px-4">Função Brigada</th>
                  <th className="py-3 px-4">Atribuição Tática</th>
                  <th className="py-3 px-4">Rádio / Ramal</th>
                  <th className="py-3 px-4">Validade Brigada</th>
                  <th className="py-3 px-4">Status Plantão</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredMembers.map((member) => {
                  const unitInfo = member.unit ? BRIGADE_UNITS[member.unit] : undefined;
                  const shiftInfo = BRIGADE_SHIFTS[member.shift];
                  const roleInfo = ROLE_LABELS[member.role];
                  const statusInfo = member.status ? STATUS_LABELS[member.status] : STATUS_LABELS['ativo_plantao'];
                  const trainStatus = getTrainingStatus(member.trainingExpiryDate);

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-600">
                        {member.registrationNumber}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {trainStatus.status === 'vencido' && (
                            <span
                              className="w-3 h-3 rounded-full bg-[#de2726] animate-pulse ring-4 ring-red-100 shrink-0 inline-block"
                              title="PONTO VERMELHO: Treinamento de Brigada Vencido!"
                            />
                          )}
                          <span>{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-100 text-slate-700 border-slate-200"
                        >
                          {unitInfo?.shortName || member.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {shiftInfo?.name || member.shift}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-50 text-[#007960] border-[#007960]/30 font-bold"
                        >
                          {roleInfo?.label || member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 text-[11px] max-w-[200px] truncate">
                        {member.specificAssignment || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-[11px]">
                        <div className="text-[#007960] font-bold">{member.radioCallsign}</div>
                        <div className="text-slate-500 text-[10px]">{member.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                            trainStatus.status === 'vencido'
                              ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                              : trainStatus.status === 'alerta_30d'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                              : 'bg-emerald-50 text-[#007960] border-[#007960]/30 font-bold'
                          }`}
                        >
                          {trainStatus.status === 'vencido' && (
                            <span className="w-2 h-2 rounded-full bg-[#de2726] animate-pulse shrink-0" />
                          )}
                          <span>{formatDateBR(member.trainingExpiryDate)} ({trainStatus.label})</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(member.id, member.status || 'ativo_plantao')}
                          className="px-2.5 py-0.5 rounded-full text-[10px] border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-medium"
                          title="Clique para alternar status"
                        >
                          {statusInfo?.label}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setMemberToEdit(member);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-[#007960] hover:bg-emerald-50"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#007960]" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      )}

      {/* MODALS */}
      <BrigadeMemberFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
        defaultUnit={selectedUnit !== 'todas' ? selectedUnit : 'industria'}
        defaultShift={selectedShift !== 'todos' ? selectedShift : 'turno_a'}
      />

      <BrigadeRosterPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        members={members}
      />

      <SstRe086ReferenceModal
        isOpen={isSstRe086ModalOpen}
        onClose={() => setIsSstRe086ModalOpen(false)}
      />
    </div>
  );
};
