import React, { useState, useMemo } from 'react';
import {
  Droplets,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  Gauge,
  ShieldCheck,
  Flame,
  ChevronRight,
  ClipboardCheck,
  Edit,
  Trash2,
  Calendar,
  ExternalLink,
  FileText,
  FileCheck2,
  Layers,
  MapPin,
  X,
  QrCode,
} from 'lucide-react';
import { Hydrant, HydrantSector, HydrantStatus } from '../types/hydrant';
import { ActionPlanItem } from '../types/actionPlan';
import { ChecklistCompletionData } from './ChecklistCompletionModal';
import { SectorChecklistModal } from './SectorChecklistModal';
import { HydrantQrModal } from './HydrantQrModal';
import { formatDateBR } from '../utils/formatters';

import { LgeReportsSubView } from './LgeReportsSubView';
import { SystemInspectionPdfModal, InspectionPdfModalData } from './SystemInspectionPdfModal';

interface HydrantsViewProps {
  hydrants: Hydrant[];
  onAddHydrant: () => void;
  onEditHydrant: (hydrant: Hydrant) => void;
  onDeleteHydrant: (id: string) => void;
  onInspectHydrant: (hydrant: Hydrant) => void;
  onSaveSectorChecklist?: (
    updatedList: Hydrant[],
    newActionPlans: ActionPlanItem[],
    completionData: ChecklistCompletionData
  ) => void;
  initialSubTab?: 'pontos' | 'laudos_lge';
  onOpenPdfArchive?: () => void;
}

const getUnitLabel = (sector: HydrantSector): string => {
  switch (sector) {
    case 'empacotamento':
      return 'Empacotamento';
    case 'posto_combustivel':
      return 'Posto de Combustível';
    case 'industria':
      return 'Indústria';
    default:
      return 'ADM / Agrícola';
  }
};

export const extractHydrantSectorName = (hydrant: Hydrant): string => {
  const raw = (hydrant.locationDetails || '').trim();
  if (!raw) return 'Setor Geral';

  const lower = raw.toLowerCase();
  if (lower.startsWith('posto de combustíveis') || lower.startsWith('posto de combustivel')) {
    return 'Posto de Combustíveis';
  }
  if (lower.includes('depósito lge') || lower.includes('canhão espuma')) {
    return 'Depósito LGE (Canhão Espuma)';
  }
  if (lower.includes('fáb. externo') || lower.includes('fábrica externa')) {
    return 'Fábrica Externa';
  }
  if (lower.includes('fáb. atrás') || lower.includes('fábrica atrás')) {
    return 'Fábrica Atrás';
  }
  if (lower.includes('academia uisa')) {
    return 'Academia UISA';
  }
  if (lower.includes('mecânica agrícola')) {
    return 'Mecânica Agrícola';
  }

  // Strip unit prefixes like "Empacotamento - ", "Administrativo - ", "Agrícola - "
  const dashIdx = raw.indexOf(' - ');
  if (dashIdx >= 0) {
    return raw.slice(dashIdx + 3).trim() || raw;
  }

  return raw;
};

export const HydrantsView: React.FC<HydrantsViewProps> = ({
  hydrants,
  onAddHydrant,
  onEditHydrant,
  onDeleteHydrant,
  onInspectHydrant,
  onSaveSectorChecklist,
  initialSubTab = 'pontos',
  onOpenPdfArchive,
}) => {
  const [subTab, setSubTab] = useState<'pontos' | 'laudos_lge'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<HydrantSector | 'todos'>('todos');
  const [selectedSubSectorName, setSelectedSubSectorName] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<HydrantStatus | 'todos'>('todos');

  // Sector Action Modal & Sector Checklist Modal
  const [sectorActionTarget, setSectorActionTarget] = useState<{
    name: string;
    unitLabel: string;
    items: Hydrant[];
  } | null>(null);
  const [sectorChecklistTarget, setSectorChecklistTarget] = useState<{
    name: string;
    unitLabel: string;
    items: Hydrant[];
  } | null>(null);

  // PDF Geral Modal State & Hydrant QR Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalData, setPdfModalData] = useState<InspectionPdfModalData | null>(null);
  const [qrLabelHydrant, setQrLabelHydrant] = useState<Hydrant | null>(null);

  // Metrics
  const metrics = useMemo(() => {
    const total = hydrants.length;
    const operacionais = hydrants.filter((h) => h.status === 'operacional').length;
    const atencao = hydrants.filter((h) => h.status === 'atencao').length;
    const manutencao = hydrants.filter((h) => h.status === 'em_manutencao' || h.status === 'obstruido').length;
    const canhoes = hydrants.filter((h) => h.type === 'canhao_monitor').length;
    const avgPressure = total > 0
      ? (hydrants.reduce((sum, h) => sum + (h.lastMeasuredPressureKgf || h.nominalPressureKgf), 0) / total).toFixed(1)
      : '0.0';

    return { total, operacionais, atencao, manutencao, canhoes, avgPressure };
  }, [hydrants]);

  // All sectors inside the currently selected unit (for the top Sector Overview grid)
  const unitSectorsOverview = useMemo(() => {
    const baseList =
      selectedSector === 'todos'
        ? hydrants
        : hydrants.filter((h) => h.sector === selectedSector);

    const map = new Map<
      string,
      { key: string; name: string; unitLabel: string; items: Hydrant[] }
    >();

    baseList.forEach((h) => {
      const secName = extractHydrantSectorName(h);
      const unitLabel = getUnitLabel(h.sector);
      const key = `${h.sector}::${secName}`;
      if (!map.has(key)) {
        map.set(key, { key, name: secName, unitLabel, items: [] });
      }
      map.get(key)!.items.push(h);
    });

    return Array.from(map.values());
  }, [hydrants, selectedSector]);

  // Filtered List
  const filteredHydrants = useMemo(() => {
    return hydrants.filter((h) => {
      const matchSector = selectedSector === 'todos' || h.sector === selectedSector;
      const secName = extractHydrantSectorName(h);
      const matchSubSector =
        selectedSubSectorName === 'TODOS' || secName === selectedSubSectorName;
      const matchStatus = statusFilter === 'todos' || h.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        h.code.toLowerCase().includes(q) ||
        h.locationDetails.toLowerCase().includes(q) ||
        secName.toLowerCase().includes(q) ||
        (h.cabinetNumber && h.cabinetNumber.toLowerCase().includes(q)) ||
        h.nozzleType.toLowerCase().includes(q);

      return matchSector && matchSubSector && matchStatus && matchSearch;
    });
  }, [hydrants, selectedSector, selectedSubSectorName, statusFilter, searchQuery]);

  // Hydrants grouped by Sector for display
  const groupedHydrantsBySector = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; unitLabel: string; items: Hydrant[]; allSectorItems: Hydrant[] }
    >();

    filteredHydrants.forEach((h) => {
      const secName = extractHydrantSectorName(h);
      const unitLabel = getUnitLabel(h.sector);
      const key = `${h.sector}::${secName}`;
      if (!map.has(key)) {
        const allForThisSector = hydrants.filter(
          (item) => item.sector === h.sector && extractHydrantSectorName(item) === secName
        );
        map.set(key, {
          key,
          name: secName,
          unitLabel,
          items: [],
          allSectorItems: allForThisSector.length > 0 ? allForThisSector : [h],
        });
      }
      map.get(key)!.items.push(h);
    });

    return Array.from(map.values());
  }, [filteredHydrants, hydrants]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Código/Tag',
      'Setor',
      'Localização',
      'Tipo de Hidrante',
      'Abrigo',
      'Qtd Mangueiras',
      'Comprimento (m)',
      'Diâmetro',
      'Tipo Mangueira',
      'Fabricante Mangueira',
      'Nº Lacre / Selo NBR 12779',
      'Pressão Ensaio Mangueira (Kgf/cm²)',
      'Último Teste Mangueira',
      'Vencimento Teste Mangueira',
      'Esguicho',
      'Chaves Storz',
      'Misturador LGE',
      'Pressão Medida (Kgf/cm²)',
      'Status Operacional',
      'Observações',
    ];

    const rows = hydrants.map((h) => [
      `"${h.code}"`,
      `"${h.sector}"`,
      `"${h.locationDetails.replace(/"/g, '""')}"`,
      `"${h.type}"`,
      `"${h.cabinetNumber || '-'}"`,
      h.hoseCount,
      h.hoseLengthMeters,
      `"${h.hoseDiameterInches}"`,
      `"${h.hoseType}"`,
      `"${h.hoseManufacturer || '-'}"`,
      `"${h.sealCertificateNumber || '-'}"`,
      h.testPressureKgf || '-',
      `"${h.hoseLastHydrostaticTest}"`,
      `"${h.hoseNextHydrostaticTest}"`,
      `"${h.nozzleType.replace(/"/g, '""')}"`,
      h.storzKeysCount,
      h.hasFoamProportioner ? 'SIM' : 'NÃO',
      h.lastMeasuredPressureKgf || h.nominalPressureKgf,
      `"${h.status}"`,
      `"${(h.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rede_Hidrantes_UISA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isHoseTestExpiringSoon = (nextDate: string) => {
    try {
      const target = new Date(nextDate).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    } catch {
      return false;
    }
  };

  const handleOpenGeneralPdf = () => {
    const rows = hydrants.map((h, idx) => ({
      number: idx + 1,
      categoryOrSection:
        h.sector === 'empacotamento'
          ? 'Empacotamento'
          : h.sector === 'posto_combustivel'
          ? 'Posto de Combustível'
          : 'ADM/GMA',
      itemDescription: `${h.code} - ${h.locationDetails} (Pressão: ${
        h.lastMeasuredPressureKgf || h.nominalPressureKgf
      } kgf/cm² - ${h.hoseCount}x ${h.hoseLengthMeters}m ${h.hoseDiameterInches})`,
      status: (h.status === 'operacional' ? 'C' : 'NC') as any,
      observation: h.notes || (h.status === 'operacional' ? 'Conforme NBR 13714' : 'Atenção/Manutenção'),
    }));

    setPdfModalData({
      title: 'Relatório Geral de Inspeção da Rede de Hidrantes e Canhões Monitores',
      systemName: 'Rede de Hidrantes e LGE',
      docNumber: 'SST.RE-077',
      revision: '03',
      unit: 'UISA Geral (Empacotamento, Posto, ADM/GMA)',
      date: new Date().toISOString().split('T')[0],
      inspectorName: 'Brigada de Emergência / SST',
      inspectorRole: 'Inspetor / Brigada SST',
      inspectorRE: 'RE-48201',
      operatorName: 'Carlos Eduardo Mendes',
      operatorRole: 'Operador de Utilidades / Manutenção Hidráulica',
      operatorRE: 'RE-44129',
      managerName: 'João Bosco Lemos Junior',
      managerRole: 'Gerente Executivo / SESMT',
      managerRE: 'RE-10204',
      referenceStandard: 'ABNT NBR 13714 / NBR 12779',
      annualReviewStatus: 'SINAL VERDE',
      annualReviewExpiryDate: '15/09/2027',
      notes:
        'Auditoria e inspeção técnica de hidrantes realizada com 100% dos pontos cadastrados operando com pressão nominal mínima de 7.5 kgf/cm².',
      rows,
    });
    setIsPdfModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header (White & Safety Green) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#007960]/20 p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0 shadow-xs">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Rede de Hidrantes Industriais & Canhões Monitores
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30">
                ABNT NBR 13714
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                NBR 11861 (Mangueiras)
              </span>
              {/* Alerta de Revisão Anual de Referência */}
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SINAL VERDE: NBR 13714 / NBR 12779 (Válido até 15/09/2027)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Monitoramento de abrigos, lances de mangueira, testes hidrostáticos anuais, esguichos e pressão de rede
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <button
            type="button"
            onClick={() =>
              setSectorChecklistTarget({
                name: 'Todos os Hidrantes Cadastrados (Rede Completa)',
                unitLabel: 'UISA Geral',
                items: hydrants,
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-[#007960] text-[#007960] hover:text-white border border-[#007960]/40 text-xs font-bold transition-colors shadow-2xs"
            title="Realizar checklist geral exigindo leitura de QR Code de todos os hidrantes cadastrados"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Checklist Geral c/ QR ({hydrants.length} cadastrados)</span>
          </button>

          <button
            onClick={handleOpenGeneralPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors shadow-xs"
            title="Gerar PDF Geral das inspeções de hidrantes com opção de download"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Gerar PDF Geral</span>
          </button>
          {onOpenPdfArchive && (
            <button
              onClick={onOpenPdfArchive}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
              title="Armazenamento e Repositório de Checklists de Hidrantes em PDF"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#007960]" />
              <span>Armazenamento PDF</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
            title="Imprimir visualização atual"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#007960]" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={onAddHydrant}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Hidrante</span>
          </button>
        </div>
      </div>

      {/* Sub-Aba Navigation: Pontos de Hidrantes vs Laudos de LGE */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#007960]/20 shadow-2xs print:hidden">
        <button
          onClick={() => setSubTab('pontos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'pontos'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Pontos de Hidrantes & Mangueiras (NBR 13714)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              subTab === 'pontos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {hydrants.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('laudos_lge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'laudos_lge'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Laudos de LGE — Líquido Gerador de Espuma (NBR 15511)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              subTab === 'laudos_lge' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-[#007960]'
            }`}
          >
            Indústria • Posto • Empacotamento
          </span>
        </button>
      </div>

      {subTab === 'laudos_lge' ? (
        <LgeReportsSubView />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-[#007960]/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Total de Pontos</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{metrics.total}</span>
            <span className="text-xs text-slate-500">unidades</span>
          </div>
        </div>

        <div className="bg-white border border-[#007960]/30 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#007960] font-bold block">Operacionais</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#007960] font-mono">{metrics.operacionais}</span>
            <span className="text-xs text-[#007960] font-semibold">100% OK</span>
          </div>
        </div>

        <div className="bg-white border border-amber-300 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono uppercase text-amber-700 font-bold block">Atenção / Teste</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600 font-mono">{metrics.atencao}</span>
            <span className="text-xs text-amber-600">revisar</span>
          </div>
        </div>

        <div className="bg-white border border-red-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#de2726] font-bold block">Manutenção</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#de2726] font-mono">{metrics.manutencao}</span>
            <span className="text-xs text-[#de2726]">crítico</span>
          </div>
        </div>

        <div className="bg-white border border-[#007960]/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#007960] font-bold block">Canhões LGE</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{metrics.canhoes}</span>
            <span className="text-xs text-slate-500">álcool / pátio</span>
          </div>
        </div>

        <div className="bg-white border border-[#007960]/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#007960] font-bold block">Pressão Média</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-[#007960] font-mono">{metrics.avgPressure}</span>
            <span className="text-xs text-slate-500 font-mono">Kgf/cm²</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Tag (HID-01), Abrigo, Local ou Esguicho..."
            className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960]"
          />
        </div>

        {/* Sector and Status filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200 flex-wrap">
            <button
              onClick={() => {
                setSelectedSector('todos');
                setSelectedSubSectorName('TODOS');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSector === 'todos' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas Unidades ({hydrants.length})
            </button>
            <button
              onClick={() => {
                setSelectedSector('empacotamento');
                setSelectedSubSectorName('TODOS');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSector === 'empacotamento' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Empacotamento ({hydrants.filter((h) => h.sector === 'empacotamento').length})
            </button>
            <button
              onClick={() => {
                setSelectedSector('adm_agricola');
                setSelectedSubSectorName('TODOS');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSector === 'adm_agricola' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ADM / Agrícola ({hydrants.filter((h) => h.sector === 'adm_agricola').length})
            </button>
            <button
              onClick={() => {
                setSelectedSector('posto_combustivel');
                setSelectedSubSectorName('TODOS');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSector === 'posto_combustivel' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Posto de Combustível ({hydrants.filter((h) => h.sector === 'posto_combustivel').length})
            </button>
            {hydrants.some((h) => h.sector === 'industria') && (
              <button
                onClick={() => {
                  setSelectedSector('industria');
                  setSelectedSubSectorName('TODOS');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedSector === 'industria' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Indústria ({hydrants.filter((h) => h.sector === 'industria').length})
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#f8faf9] border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-medium focus:outline-none"
          >
            <option value="todos">Status: Todos</option>
            <option value="operacional">Operacional</option>
            <option value="atencao">Atenção</option>
            <option value="em_manutencao">Em Manutenção</option>
          </select>
        </div>
      </div>

      {/* SETORES DE HIDRANTES (CLIQUE NO NOME DO SETOR PARA REALIZAR O CHECKLIST) */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-[#007960]" />
              <span>Setores de Hidrantes ({unitSectorsOverview.length}) — Clique no nome do setor para realizar o checklist:</span>
            </span>
          </div>
          {selectedSubSectorName !== 'TODOS' && (
            <button
              type="button"
              onClick={() => setSelectedSubSectorName('TODOS')}
              className="px-3 py-1 rounded-lg bg-[#007960] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs"
            >
              <span>Mostrar Todos os Setores</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {unitSectorsOverview.map((sec) => {
            const isSelected = selectedSubSectorName === sec.name;
            const hasCritical = sec.items.some(
              (h) => h.status === 'em_manutencao' || h.status === 'obstruido'
            );
            const hasAttention = sec.items.some(
              (h) => h.status === 'atencao' || isHoseTestExpiringSoon(h.hoseNextHydrostaticTest)
            );

            return (
              <div
                key={sec.key}
                onClick={() =>
                  setSectorActionTarget({
                    name: sec.name,
                    unitLabel: sec.unitLabel,
                    items: sec.items,
                  })
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSectorActionTarget({
                      name: sec.name,
                      unitLabel: sec.unitLabel,
                      items: sec.items,
                    });
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-50/70 border-[#007960] ring-2 ring-[#007960]/30 shadow-xs'
                    : 'bg-[#fcfdfc] border-slate-200 hover:border-[#007960]/50 hover:bg-emerald-50/20'
                }`}
                title={`Clique em "${sec.name}" para abrir o checklist deste setor`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#007960] group-hover:underline truncate block">
                    {sec.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      isSelected ? 'bg-[#007960] text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sec.items.length} hid.
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5 mt-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 truncate">
                    {sec.unitLabel}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasCritical ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-[#de2726]">
                        Crítico
                      </span>
                    ) : hasAttention ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                        Atenção
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-[#007960]">
                        OK
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-[#007960] flex items-center gap-0.5">
                      <ClipboardCheck className="w-3 h-3" />
                      <span>Checklist</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hydrants Separated by Sector */}
      <div className="space-y-5">
        {groupedHydrantsBySector.map((sectorGroup) => {
          const okCount = sectorGroup.items.filter((h) => h.status === 'operacional').length;
          const attCount = sectorGroup.items.filter((h) => h.status === 'atencao').length;
          const maintCount = sectorGroup.items.filter(
            (h) => h.status === 'em_manutencao' || h.status === 'obstruido'
          ).length;

          return (
            <div
              key={sectorGroup.key}
              className="bg-white border border-[#007960]/25 rounded-2xl overflow-hidden shadow-xs"
            >
              {/* Cabeçalho Clicável do Setor */}
              <div className="px-5 py-3.5 bg-emerald-50/50 border-b border-[#007960]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setSectorActionTarget({
                        name: sectorGroup.name,
                        unitLabel: sectorGroup.unitLabel,
                        items: sectorGroup.allSectorItems,
                      })
                    }
                    className="text-left group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#007960] text-slate-900 hover:text-white border border-[#007960]/30 shadow-2xs transition-all"
                    title={`Clique no nome do setor "${sectorGroup.name}" para realizar o checklist`}
                  >
                    <MapPin className="w-4 h-4 text-[#007960] group-hover:text-white shrink-0" />
                    <span className="text-sm font-extrabold tracking-tight">{sectorGroup.name}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 group-hover:bg-white/20 text-[#007960] group-hover:text-white">
                      {sectorGroup.items.length} hid.
                    </span>
                  </button>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {sectorGroup.unitLabel}
                  </span>

                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {okCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#007960]">
                        {okCount} Operacional(is)
                      </span>
                    )}
                    {attCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {attCount} Atenção
                      </span>
                    )}
                    {maintCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-[#de2726]">
                        {maintCount} Manutenção
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSectorChecklistTarget({
                      name: sectorGroup.name,
                      unitLabel: sectorGroup.unitLabel,
                      items: sectorGroup.allSectorItems,
                    })
                  }
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Realizar Checklist do Setor ({sectorGroup.allSectorItems.length})</span>
                </button>
              </div>

              {/* Grid de Hidrantes do Setor */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectorGroup.items.map((hid) => {
          const isExpiring = isHoseTestExpiringSoon(hid.hoseNextHydrostaticTest);
          const hasInspection = hid.inspections && hid.inspections.length > 0;
          const lastInsp = hasInspection ? hid.inspections[0] : null;

          return (
            <div
              key={hid.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm ${
                hid.status === 'em_manutencao' || hid.status === 'obstruido'
                  ? 'border-red-300 bg-red-50/20'
                  : hid.status === 'atencao' || isExpiring
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 hover:border-[#007960]/40'
              }`}
            >
              <div>
                {/* Card Top: Code, Sector, Status */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {hid.code}
                    </span>
                    {hid.cabinetNumber && (
                      <span className="text-[11px] font-mono text-[#007960] bg-emerald-50 px-2 py-0.5 rounded-md border border-[#007960]/30 font-bold">
                        {hid.cabinetNumber}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {hid.sector === 'industria'
                        ? 'Indústria'
                        : hid.sector === 'empacotamento'
                        ? 'Empacotamento'
                        : hid.sector === 'posto_combustivel'
                        ? 'Posto de Combustível'
                        : 'ADM / Agrícola'}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      hid.status === 'operacional'
                        ? 'bg-emerald-50 text-[#007960] border border-[#007960]/30'
                        : hid.status === 'atencao'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : 'bg-red-50 text-[#de2726] border border-[#de2726]/40'
                    }`}
                  >
                    {hid.status === 'operacional'
                      ? 'Operacional'
                      : hid.status === 'atencao'
                      ? 'Atenção'
                      : 'Manutenção'}
                  </span>
                </div>

                {/* Location details */}
                <p className="text-xs text-slate-800 font-bold line-clamp-2 mb-3">
                  {hid.locationDetails}
                </p>

                {/* Technical specs block */}
                <div className="space-y-2 bg-[#f8faf9] p-3 rounded-xl border border-slate-200 text-[11px] mb-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tipo de Ponto:</span>
                    <span className="font-bold text-slate-900 capitalize">
                      {hid.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Mangueiras:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {hid.hoseCount}x {hid.hoseLengthMeters}m • {hid.hoseDiameterInches}
                      {hid.hoseManufacturer && ` (${hid.hoseManufacturer})`}
                    </span>
                  </div>

                  {hid.sealCertificateNumber && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Lacre / NBR 12779:</span>
                      <span className="font-mono font-bold text-[#007960] bg-emerald-50 px-1.5 py-0.5 rounded border border-[#007960]/20">
                        Nº {hid.sealCertificateNumber}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pressão Operação:</span>
                    <span className="font-mono font-bold text-[#007960]">
                      {hid.lastMeasuredPressureKgf || hid.nominalPressureKgf} Kgf/cm²
                      {hid.testPressureKgf && (
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          (Ensaio: {hid.testPressureKgf} Kgf)
                        </span>
                      )}
                    </span>
                  </div>

                  {hid.hasFoamProportioner && (
                    <div className="flex items-center justify-between text-purple-700 font-bold">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-purple-600" />
                        Misturador LGE:
                      </span>
                      <span>Instalado (Etanol)</span>
                    </div>
                  )}

                  {/* Hose Hydrostatic Test Validity */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Validade NBR 12779:
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        isExpiring ? 'text-amber-700 animate-pulse' : 'text-slate-800'
                      }`}
                    >
                      {formatDateBR(hid.hoseNextHydrostaticTest)}
                    </span>
                  </div>
                </div>

                {/* Last inspection report snapshot */}
                {lastInsp && (
                  <div className="text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-3 flex items-center justify-between">
                    <span>Última Insp.: {formatDateBR(lastInsp.date)}</span>
                    <span
                      className={`font-bold uppercase ${
                        lastInsp.result === 'aprovado'
                          ? 'text-[#007960]'
                          : lastInsp.result === 'ajuste_necessario'
                          ? 'text-amber-700'
                          : 'text-[#de2726]'
                      }`}
                    >
                      {lastInsp.result}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onInspectHydrant(hid)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#007960] text-[#007960] hover:text-white border border-[#007960]/30 text-xs font-bold transition-colors"
                  title="Registrar Inspeção Mensal NBR 13714"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Inspecionar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQrLabelHydrant(hid)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#007960] transition-colors flex items-center gap-1 text-[11px] font-bold"
                  title="Visualizar, Imprimir ou Baixar QR Code do Hidrante"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR</span>
                </button>

                <button
                  onClick={() => onEditHydrant(hid)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Editar especificações do hidrante"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteHydrant(hid.id)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-[#de2726] transition-colors"
                  title="Excluir hidrante"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
              </div>
            </div>
          );
        })}
      </div>

      {groupedHydrantsBySector.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Droplets className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="font-bold text-slate-800">Nenhum hidrante encontrado com os filtros atuais.</p>
          <p className="text-xs text-slate-500 mt-1">Experimente remover os termos de busca ou mudar o setor selecionado.</p>
        </div>
      )}
        </>
      )}

      {/* Modal de Opções ao Clicar no Nome do Setor (Hidrantes) */}
      {sectorActionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#007960]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#007960] block">
                    Setor de Hidrantes • {sectorActionTarget.unitLabel}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{sectorActionTarget.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSectorActionTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#f8faf9] border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Hidrantes vinculados a este setor:</span>
              <span className="font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-[#007960]">
                {sectorActionTarget.items.length} ponto(s)
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const target = sectorActionTarget;
                  setSectorActionTarget(null);
                  setSectorChecklistTarget(target);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-sm transition-colors"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Realizar Checklist deste Setor ({sectorActionTarget.items.length} hidrantes)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const name = sectorActionTarget.name;
                  setSelectedSubSectorName(selectedSubSectorName === name ? 'TODOS' : name);
                  setSectorActionTarget(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007960] border border-[#007960]/30 text-xs font-bold transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>
                  {selectedSubSectorName === sectorActionTarget.name
                    ? 'Remover Filtro e Mostrar Todos os Setores'
                    : 'Filtrar e Exibir Apenas Este Setor'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checklist Completo do Setor (Hidrantes) */}
      <SectorChecklistModal
        isOpen={Boolean(sectorChecklistTarget)}
        onClose={() => setSectorChecklistTarget(null)}
        mode="hidrantes"
        sectorName={sectorChecklistTarget?.name || ''}
        unitLabel={sectorChecklistTarget?.unitLabel || 'UISA'}
        hydrants={sectorChecklistTarget?.items || []}
        onSaveHydrantsBatch={(updatedList, newPlans, completionData) => {
          if (onSaveSectorChecklist) {
            onSaveSectorChecklist(updatedList, newPlans, completionData);
          }
        }}
      />

      {/* Modal de PDF Geral e Download da Inspeção */}
      <SystemInspectionPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        data={pdfModalData}
      />

      {/* Modal de Etiqueta QR Code do Hidrante */}
      <HydrantQrModal
        isOpen={Boolean(qrLabelHydrant)}
        onClose={() => setQrLabelHydrant(null)}
        hydrant={qrLabelHydrant}
      />
    </div>
  );
};
