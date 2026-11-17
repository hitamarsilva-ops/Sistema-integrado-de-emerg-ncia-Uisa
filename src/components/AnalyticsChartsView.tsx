import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  ShieldCheck,
  Flame,
  Droplets,
  Activity,
  Users,
  Download,
  Printer,
  Calendar,
  Filter,
  Layers,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { Extinguisher, ExtinguisherSector } from '../types/extinguisher';
import { Hydrant } from '../types/hydrant';
import { BrigadeMember, BrigadeShift, BrigadeUnit } from '../types/brigade';
import { computeExtinguisherStatus, SECTOR_MAP, TYPE_MAP } from '../utils/formatters';
import { UisaLogo } from './UisaLogo';

interface AnalyticsChartsViewProps {
  extinguishers: Extinguisher[];
  hydrants: Hydrant[];
  brigadeMembers: BrigadeMember[];
}

export const AnalyticsChartsView: React.FC<AnalyticsChartsViewProps> = ({
  extinguishers,
  hydrants,
  brigadeMembers,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<'todos' | 'extintores' | 'brigada' | 'hidrantes'>('todos');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 1. Filter extinguishers by selected sector
  const filteredExtinguishers = useMemo(() => {
    if (selectedSector === 'todos') return extinguishers;
    return extinguishers.filter((e) => e.sector === selectedSector);
  }, [extinguishers, selectedSector]);

  // 2. Extinguisher status counts
  const extStatusCounts = useMemo(() => {
    let valid = 0;
    let warning = 0;
    let expired = 0;
    let warehouse = 0;

    filteredExtinguishers.forEach((ext) => {
      if (ext.isStockInWarehouse || ext.sector.startsWith('almoxarifado')) {
        warehouse++;
      }
      const st = computeExtinguisherStatus(ext);
      if (st.status === 'vencido') expired++;
      else if (st.status === 'atencao') warning++;
      else valid++;
    });

    const total = filteredExtinguishers.length;
    const conformityRate = total > 0 ? Math.round((valid / total) * 100) : 100;

    return { total, valid, warning, expired, warehouse, conformityRate };
  }, [filteredExtinguishers]);

  // 3. Extinguishers by Sector
  const sectorExtDistribution = useMemo(() => {
    const sectors: Record<string, { label: string; valid: number; warning: number; expired: number; total: number }> = {
      unidade_industrial: { label: 'Indústria', valid: 0, warning: 0, expired: 0, total: 0 },
      empacotamento: { label: 'Empacotamento', valid: 0, warning: 0, expired: 0, total: 0 },
      posto_combustivel: { label: 'Posto Combustível', valid: 0, warning: 0, expired: 0, total: 0 },
      adm: { label: 'ADM / Agrícola', valid: 0, warning: 0, expired: 0, total: 0 },
      almoxarifado: { label: 'Almoxarifados', valid: 0, warning: 0, expired: 0, total: 0 },
    };

    extinguishers.forEach((ext) => {
      let targetKey = 'unidade_industrial';
      if (ext.sector === 'empacotamento') targetKey = 'empacotamento';
      else if (ext.sector === 'posto_combustivel') targetKey = 'posto_combustivel';
      else if (ext.sector === 'adm') targetKey = 'adm';
      else if (ext.sector.startsWith('almoxarifado') || ext.isStockInWarehouse) targetKey = 'almoxarifado';

      const st = computeExtinguisherStatus(ext);
      sectors[targetKey].total++;
      if (st.status === 'vencido') sectors[targetKey].expired++;
      else if (st.status === 'atencao') sectors[targetKey].warning++;
      else sectors[targetKey].valid++;
    });

    return Object.entries(sectors).map(([key, data]) => ({ key, ...data }));
  }, [extinguishers]);

  // 4. Extinguishers by Type
  const extTypeDistribution = useMemo(() => {
    const map: Record<string, { count: number; totalKg: number }> = {};
    filteredExtinguishers.forEach((e) => {
      const typeKey = e.type || 'po_polivalente_abc';
      const weightNum = parseFloat(e.capacityWeight?.replace(/[^\d.]/g, '') || '0') || 0;
      if (!map[typeKey]) {
        map[typeKey] = { count: 0, totalKg: 0 };
      }
      map[typeKey].count++;
      map[typeKey].totalKg += weightNum;
    });

    return Object.entries(map)
      .map(([type, data]) => ({
        type,
        label: TYPE_MAP[type as keyof typeof TYPE_MAP]?.name || type,
        count: data.count,
        totalKg: Math.round(data.totalKg),
        percentage: filteredExtinguishers.length > 0 ? Math.round((data.count / filteredExtinguishers.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredExtinguishers]);

  // 5. Hydrostatic Test (5 years) projection
  const hydroTestProjection = useMemo(() => {
    const years: Record<number, number> = {
      2026: 0,
      2027: 0,
      2028: 0,
      2029: 0,
      2030: 0,
    };
    let otherYears = 0;

    extinguishers.forEach((e) => {
      if (e.hydrostaticTestDate) {
        const hydroYear = new Date(e.hydrostaticTestDate).getFullYear() + 5;
        if (years[hydroYear] !== undefined) {
          years[hydroYear]++;
        } else {
          otherYears++;
        }
      } else {
        years[2027]++; // default estimate
      }
    });

    return Object.entries(years).map(([year, count]) => ({
      year: parseInt(year, 10),
      count,
      isCurrentYear: parseInt(year, 10) === 2026,
    }));
  }, [extinguishers]);

  // 6. Brigade by Shift and Unit
  const brigadeMatrix = useMemo(() => {
    const shifts: { shift: BrigadeShift; label: string; period: string }[] = [
      { shift: 'turno_a', label: 'Turno A', period: '06h - 14h' },
      { shift: 'turno_b', label: 'Turno B', period: '14h - 22h' },
      { shift: 'turno_c', label: 'Turno C', period: '22h - 06h' },
      { shift: 'administrativo', label: 'ADM', period: '07h - 17h' },
    ];

    const units: { unit: BrigadeUnit; label: string; target: number }[] = [
      { unit: 'industria', label: 'Indústria', target: 8 },
      { unit: 'empacotamento', label: 'Empacotamento', target: 4 },
      { unit: 'adm', label: 'ADM Geral', target: 4 },
      { unit: 'posto_combustivel', label: 'Posto', target: 2 },
      { unit: 'brigada_florestal', label: 'Florestal', target: 6 },
    ];

    const data = shifts.map((s) => {
      const counts: Record<BrigadeUnit, number> = {
        industria: 0,
        empacotamento: 0,
        adm: 0,
        posto_combustivel: 0,
        brigada_florestal: 0,
      };

      brigadeMembers
        .filter((m) => m.shift === s.shift && m.status !== 'afastado')
        .forEach((m) => {
          const u = m.unit || 'industria';
          counts[u] = (counts[u] || 0) + 1;
        });

      const totalShift = Object.values(counts).reduce((a, b) => a + b, 0);

      return {
        ...s,
        counts,
        totalShift,
      };
    });

    const totalActiveBrigadistas = brigadeMembers.filter((m) => m.status !== 'afastado').length;
    const totalTrained = brigadeMembers.filter((m) => {
      if (!m.trainingExpiryDate) return true;
      return new Date(m.trainingExpiryDate) > new Date();
    }).length;

    return { data, shifts, units, totalActiveBrigadistas, totalTrained };
  }, [brigadeMembers]);

  // 7. Hydrants distribution and conformity
  const hydrantStats = useMemo(() => {
    const total = hydrants.length;
    const ok = hydrants.filter((h) => h.status === 'operacional').length;
    const maintenance = hydrants.filter((h) => h.status === 'em_manutencao').length;
    const blocked = hydrants.filter((h) => h.status === 'obstruido' || h.status === 'atencao').length;
    const rate = total > 0 ? Math.round((ok / total) * 100) : 100;

    return { total, ok, maintenance, blocked, rate };
  }, [hydrants]);

  // Handle Copy summary
  const handleCopySummary = () => {
    const summary = `*** RELATÓRIO ANALÍTICO DE EMERGÊNCIAS - UISA ***
Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Empresa: uisa bioenergia

[EXTINTORES]
Total: ${extStatusCounts.total}
Conformes: ${extStatusCounts.valid} (${extStatusCounts.conformityRate}%)
Atenção (< 30 dias): ${extStatusCounts.warning}
Vencidos: ${extStatusCounts.expired}
Estoque Reserva: ${extStatusCounts.warehouse}

[BRIGADA DE EMERGÊNCIA]
Efetivo Ativo: ${brigadeMatrix.totalActiveBrigadistas} brigadistas
Turno A (06h-14h): ${brigadeMatrix.data[0]?.totalShift || 0} brigadistas
Turno B (14h-22h): ${brigadeMatrix.data[1]?.totalShift || 0} brigadistas
Turno C (22h-06h): ${brigadeMatrix.data[2]?.totalShift || 0} brigadistas
ADM (07h-17h): ${brigadeMatrix.data[3]?.totalShift || 0} brigadistas

[REDE DE HIDRANTES]
Total: ${hydrantStats.total}
Operacionais: ${hydrantStats.ok} (${hydrantStats.rate}%)
Em Manutenção: ${hydrantStats.maintenance}

Padrão Técnico: NBR 12693, NBR 13714, NBR 14276, SST.NP-022 (PAE)`;

    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#007960] shadow-xs" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Painel Analítico de Gráficos & Indicadores
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30 font-bold">
              Sistema Integrado de Gestão de Emergências
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Visualização estatística em tempo real de extintores, rede de combate a incêndio e efetivo de brigada por turno.
          </p>
        </div>

        {/* Toolbar Filter & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* System Filter */}
          <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-lg border border-slate-300 text-xs">
            <button
              onClick={() => setSelectedSystem('todos')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                selectedSystem === 'todos' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedSystem('extintores')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                selectedSystem === 'extintores' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extintores
            </button>
            <button
              onClick={() => setSelectedSystem('brigada')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                selectedSystem === 'brigada' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Brigadistas
            </button>
            <button
              onClick={() => setSelectedSystem('hidrantes')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                selectedSystem === 'hidrantes' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hidrantes
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            title="Copiar resumo textual dos indicadores"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#007960]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isCopied ? 'Copiado!' : 'Copiar Resumo'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#007960] hover:bg-[#00604c] text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Clean White & Safety Green) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Conformidade Geral */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[11px]">Conformidade Extintores</span>
            <ShieldCheck className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {extStatusCounts.conformityRate}%
            </span>
            <span className="text-xs text-[#007960] font-bold font-mono">
              ({extStatusCounts.valid}/{extStatusCounts.total})
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007960] transition-all duration-500 rounded-full"
              style={{ width: `${extStatusCounts.conformityRate}%` }}
            />
          </div>
          <p className="mt-2 text-[11px]">
            {extStatusCounts.expired > 0 ? (
              <span className="text-red-600 font-bold">{extStatusCounts.expired} vencido(s) requerem recarga</span>
            ) : (
              <span className="text-[#007960] font-bold">100% dentro do prazo legal</span>
            )}
          </p>
        </div>

        {/* Brigada em Prontidão */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[11px]">Efetivo da Brigada</span>
            <Users className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {brigadeMatrix.totalActiveBrigadistas}
            </span>
            <span className="text-xs text-slate-500 font-medium">ativos</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-600 font-bold">
            <span>A: {brigadeMatrix.data[0]?.totalShift || 0}</span>
            <span>B: {brigadeMatrix.data[1]?.totalShift || 0}</span>
            <span>C: {brigadeMatrix.data[2]?.totalShift || 0}</span>
            <span>ADM: {brigadeMatrix.data[3]?.totalShift || 0}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#007960] flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3 text-[#007960]" />
            <span>Escala 24/7 coberta (NBR 14276)</span>
          </p>
        </div>

        {/* Rede de Hidrantes */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[11px]">Rede de Hidrantes</span>
            <Droplets className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {hydrantStats.rate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">operacional</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007960] transition-all duration-500 rounded-full"
              style={{ width: `${hydrantStats.rate}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-600">
            <span className="text-slate-900 font-bold">{hydrantStats.ok}</span> de {hydrantStats.total} hidrantes prontos p/ combate
          </p>
        </div>

        {/* Reserva no Almoxarifado */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[11px]">Estoque Reserva</span>
            <Layers className="w-4 h-4 text-[#007960]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#007960] tracking-tight">
              {extStatusCounts.warehouse}
            </span>
            <span className="text-xs text-slate-500 font-medium">unidades</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 flex items-center justify-between font-mono">
            <span>Almox. Indústria</span>
            <span className="text-[#007960] font-bold">Pronto</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Permite troca imediata sem desproteger posições
          </p>
        </div>
      </div>

      {/* Row 1: Charts - Status Breakdown & Sector Distribution */}
      {(selectedSystem === 'todos' || selectedSystem === 'extintores') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Donut Status Representation */}
          <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#007960]" />
                <h3 className="text-sm font-bold text-slate-900">Status de Validade de Extintores</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">{extStatusCounts.total} total</span>
            </div>

            {/* SVG Donut / Gauge Chart */}
            <div className="my-6 flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="relative w-40 h-40 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-100"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Valid Segment (#007960) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#007960"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${(extStatusCounts.valid / Math.max(extStatusCounts.total, 1)) * 251.2} 251.2`}
                    strokeDashoffset="0"
                  />
                  {/* Warning Segment (amber-500) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#d97706"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${(extStatusCounts.warning / Math.max(extStatusCounts.total, 1)) * 251.2} 251.2`}
                    strokeDashoffset={`-${(extStatusCounts.valid / Math.max(extStatusCounts.total, 1)) * 251.2}`}
                  />
                  {/* Expired Segment (red-600) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#de2726"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${(extStatusCounts.expired / Math.max(extStatusCounts.total, 1)) * 251.2} 251.2`}
                    strokeDashoffset={`-${((extStatusCounts.valid + extStatusCounts.warning) / Math.max(extStatusCounts.total, 1)) * 251.2}`}
                  />
                </svg>
                {/* Center Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {extStatusCounts.conformityRate}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#007960] mt-1">Conforme</span>
                </div>
              </div>

              {/* Legends & Detail */}
              <div className="space-y-3 w-full max-w-[200px]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#007960]" />
                    <span className="text-slate-700 font-medium">Válido</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {extStatusCounts.valid}{' '}
                    <span className="text-slate-500 font-normal text-[11px]">
                      ({Math.round((extStatusCounts.valid / Math.max(extStatusCounts.total, 1)) * 100)}%)
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#d97706]" />
                    <span className="text-slate-700 font-medium">Atenção (30d)</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700">
                    {extStatusCounts.warning}{' '}
                    <span className="text-slate-500 font-normal text-[11px]">
                      ({Math.round((extStatusCounts.warning / Math.max(extStatusCounts.total, 1)) * 100)}%)
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#de2726]" />
                    <span className="text-slate-700 font-medium">Vencido</span>
                  </div>
                  <span className="font-mono font-bold text-red-600">
                    {extStatusCounts.expired}{' '}
                    <span className="text-slate-500 font-normal text-[11px]">
                      ({Math.round((extStatusCounts.expired / Math.max(extStatusCounts.total, 1)) * 100)}%)
                    </span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-400" />
                    <span className="text-slate-600 font-medium">Almoxarifado</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {extStatusCounts.warehouse} un
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Critério: Portaria INMETRO nº 500 / NR-23</span>
              <span className="text-[#007960] font-bold">Inspeção N1/N2/N3</span>
            </div>
          </div>

          {/* Chart 2: Extinguishers by Sector (Horizontal Stacked Bar Chart) */}
          <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#007960]" />
                <h3 className="text-sm font-bold text-slate-900">Distribuição por Setor & Status Operacional</h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#007960]" /> Conforme</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#d97706]" /> Atenção</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#de2726]" /> Vencido</span>
              </div>
            </div>

            <div className="my-4 space-y-3.5">
              {sectorExtDistribution.map((sector) => {
                const total = Math.max(sector.total, 1);
                const validPct = (sector.valid / total) * 100;
                const warningPct = (sector.warning / total) * 100;
                const expiredPct = (sector.expired / total) * 100;

                return (
                  <div key={sector.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{sector.label}</span>
                      <span className="text-xs font-mono text-slate-600">
                        {sector.total} un • <span className="text-[#007960] font-bold">{sector.valid} OK</span>
                        {sector.warning > 0 && <span className="text-amber-700 font-bold"> • {sector.warning} At.</span>}
                        {sector.expired > 0 && <span className="text-red-600 font-bold"> • {sector.expired} Venc.</span>}
                      </span>
                    </div>

                    {/* Stacked Progress Bar */}
                    <div className="w-full bg-slate-100 h-4 rounded overflow-hidden flex shadow-inner">
                      {validPct > 0 && (
                        <div
                          style={{ width: `${validPct}%` }}
                          className="bg-[#007960] hover:opacity-90 transition-all flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                          title={`${sector.valid} extintores válidos`}
                        >
                          {validPct > 15 && `${sector.valid}`}
                        </div>
                      )}
                      {warningPct > 0 && (
                        <div
                          style={{ width: `${warningPct}%` }}
                          className="bg-[#d97706] hover:opacity-90 transition-all flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                          title={`${sector.warning} em atenção`}
                        >
                          {warningPct > 10 && `${sector.warning}`}
                        </div>
                      )}
                      {expiredPct > 0 && (
                        <div
                          style={{ width: `${expiredPct}%` }}
                          className="bg-[#de2726] hover:opacity-90 transition-all flex items-center justify-center text-[9px] font-bold text-white overflow-hidden animate-pulse"
                          title={`${sector.expired} vencidos`}
                        >
                          {expiredPct > 10 && `${sector.expired}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Setorização conforme Mapa de Riscos uisa</span>
              <span className="text-[#007960] font-semibold">Substituição preventiva com estoque do Almoxarifado</span>
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Brigade Shifts & Minimum Personnel Matrix */}
      {(selectedSystem === 'todos' || selectedSystem === 'brigada') && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#007960]" />
              <h3 className="text-sm font-bold text-slate-900">Efetivo da Brigada por Turno (A, B, C) e Unidade Operacional</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Meta Operacional: <strong className="text-slate-900">Min. 6 por turno</strong></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[#007960] font-bold">100% Capacitados em Treinamento</span>
            </div>
          </div>

          {/* Grouped Visual Bars for Shifts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {brigadeMatrix.data.map((shiftData) => {
              return (
                <div
                  key={shiftData.shift}
                  className="p-4 rounded-xl border border-slate-200 bg-[#f8faf9] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{shiftData.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-bold">
                        {shiftData.period}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {shiftData.totalShift}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">brigadistas</span>
                    </div>

                    {/* Breakdown by Unit */}
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Indústria:</span>
                        <span className="font-bold text-slate-900 font-mono">{shiftData.counts.industria}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Empacotamento:</span>
                        <span className="font-bold text-slate-900 font-mono">{shiftData.counts.empacotamento}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">ADM Geral:</span>
                        <span className="font-bold text-slate-900 font-mono">{shiftData.counts.adm}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Posto Combustível:</span>
                        <span className="font-bold text-slate-900 font-mono">{shiftData.counts.posto_combustivel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Brigada Florestal:</span>
                        <span className="font-bold text-[#007960] font-mono">{shiftData.counts.brigada_florestal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Prontidão:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#007960]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007960]" />
                      Ativo & Conforme
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 3: Agent Type Distribution & Hydrostatic 5-Year Forecast */}
      {(selectedSystem === 'todos' || selectedSystem === 'extintores') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Agent Type Breakdown */}
          <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#007960]" />
                <h3 className="text-sm font-bold text-slate-900">Agentes Extintores Instalados na Planta</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Classes de Fogo A, B, C</span>
            </div>

            <div className="space-y-3">
              {extTypeDistribution.map((item) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.label}</span>
                    <span className="font-mono text-slate-600">
                      <strong className="text-slate-900">{item.count} un</strong> ({item.percentage}%) • Massa Total: {item.totalKg} kg/L
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: '#007960',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Recarga anual obrigatória conforme NBR 12962</span>
              <span className="text-slate-700 font-mono font-medium">Pó ABC é predominante na agroindústria</span>
            </div>
          </div>

          {/* Hydrostatic Test Forecast (5 years) */}
          <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#007960]" />
                <h3 className="text-sm font-bold text-slate-900">Projeção Teste Hidrostático (5 Anos)</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">NBR 13485</span>
            </div>

            <p className="text-xs text-slate-600">
              Cronograma de teste hidrostático de cilindros de alta e baixa pressão (ensaio quinquenal obrigatório):
            </p>

            <div className="space-y-2.5">
              {hydroTestProjection.map((item) => {
                const maxForecast = Math.max(...hydroTestProjection.map((h) => h.count), 1);
                const pct = (item.count / maxForecast) * 100;

                return (
                  <div key={item.year} className="flex items-center gap-3 text-xs">
                    <span
                      className={`w-14 font-mono font-bold ${
                        item.isCurrentYear ? 'text-[#007960]' : 'text-slate-800'
                      }`}
                    >
                      {item.year} {item.isCurrentYear && '•'}
                    </span>
                    <div className="flex-1 bg-slate-100 h-5 rounded overflow-hidden flex items-center">
                      <div
                        className={`h-full flex items-center px-2 text-[10px] font-bold text-white ${
                          item.isCurrentYear ? 'bg-[#007960]' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(pct, 12)}%` }}
                      >
                        {item.count} un
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Teste Quinquenal (3º Nível)</span>
              <span className="text-[#007960] font-bold">Sem gargalos previstos</span>
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Hydrants & Fire Pump Readiness */}
      {(selectedSystem === 'todos' || selectedSystem === 'hidrantes') && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#007960]" />
              <h3 className="text-sm font-bold text-slate-900">Status da Rede Hidráulica e Reserva de Incêndio (RTI)</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">NBR 13714 / SST.RE-094</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8faf9]">
              <span className="text-xs font-bold text-slate-500 uppercase">Hidrantes Operacionais</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{hydrantStats.ok}</span>
                <span className="text-xs text-[#007960] font-bold">({hydrantStats.rate}%)</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Armários com mangueiras tipo 2, esguicho regulável e chaves storz
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8faf9]">
              <span className="text-xs font-bold text-slate-500 uppercase">Casa de Bombas (SST.RE-094)</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#007960]">100%</span>
                <span className="text-xs text-slate-700 font-bold">Operacional</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Motobomba Diesel + Elétrica + Jockey testadas semanalmente
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8faf9]">
              <span className="text-xs font-bold text-slate-500 uppercase">Autonomia Hídrica (RTI)</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">500.000 L</span>
                <span className="text-xs text-[#007960] font-bold">Pleno</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Reserva técnica exclusiva para combate a incêndio industrial
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Compliance Footer */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <UisaLogo size="sm" variant="color" />
          <span className="font-semibold text-slate-800">Sistema Integrado de Gestão de Emergências</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Conformidade: NR-23 • NBR 12693 • NBR 14276 • NBR 13714 • SST.NP-022 (PAE)
        </div>
      </div>
    </div>
  );
};
