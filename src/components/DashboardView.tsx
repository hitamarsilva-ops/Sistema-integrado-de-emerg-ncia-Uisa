import React, { useState, useMemo } from 'react';
import {
  Factory,
  Boxes,
  Fuel,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Repeat,
  Printer,
  FileSpreadsheet,
  Plus,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Extinguisher,
  ExtinguisherSector,
  NotificationAlert,
} from '../types/extinguisher';
import {
  computeExtinguisherStatus,
  formatDateBR,
  SECTOR_MAP,
  TYPE_MAP,
} from '../utils/formatters';

interface DashboardViewProps {
  extinguishers: Extinguisher[];
  alerts: NotificationAlert[];
  onSelectSector: (sector: ExtinguisherSector | 'todos') => void;
  onFilterStatus: (status: string) => void;
  onOpenQuickSwap: (expiredExtinguisher?: Extinguisher) => void;
  onOpenNewExtinguisher: () => void;
  onOpenNotifications: () => void;
  onExportCsv: () => void;
  onPrintReport: () => void;
  onNavigateToTab?: (tab: 'dashboard' | 'tabela' | 'setores' | 'almoxarifado' | 'hidrantes' | 'bombas' | 'pae' | 'contingencia' | 'brigadistas' | 'graficos') => void;
}

// 4 Unidades Operacionais Principais solicitadas pelo usuário
export type OperationalUnitKey = 'unidade_industrial' | 'empacotamento' | 'posto_combustivel' | 'adm';

const OPERATIONAL_UNITS: {
  key: OperationalUnitKey;
  name: string;
  shortName: string;
  scope: string;
  icon: typeof Factory;
  subAreas: string[];
}[] = [
  {
    key: 'unidade_industrial',
    name: 'Unidade Industrial',
    shortName: 'Indústria',
    scope: 'Moenda, Caldeiras, Destilaria, Cogeração, Oficinas e Fabricação',
    icon: Factory,
    subAreas: ['TODAS', 'DESTILARIA', 'CALDEIRAS', 'MOENDAS', 'COGEN', 'OFICINAS', 'TRATAMENTO DE CALDO'],
  },
  {
    key: 'empacotamento',
    name: 'Empacotamento',
    shortName: 'Empacotamento',
    scope: 'Linhas de Ensaque Automático de Açúcar, Paletização Robotizada e Armazéns',
    icon: Boxes,
    subAreas: ['TODAS', 'LINHA 1 ENSAQUE', 'LINHA 2 ENSAQUE', 'PALETIZAÇÃO', 'ARMAZÉM AÇÚCAR', 'DOCAS'],
  },
  {
    key: 'posto_combustivel',
    name: 'Posto de Combustível',
    shortName: 'Posto de Combustível',
    scope: 'Pistas de Abastecimento, Tanques Subterrâneos de Diesel/Etanol e Descarga',
    icon: Fuel,
    subAreas: ['TODAS', 'PISTA DIESEL', 'PISTA ETANOL', 'DESCARGA DE COMBUSTÍVEL', 'ILHA PRINCIPAL'],
  },
  {
    key: 'adm',
    name: 'Administrativo',
    shortName: 'Administrativo',
    scope: 'Escritórios Centrais, TI / CPD, Ambulatório Médico, Refeitório e GMA / Agrícola',
    icon: Building2,
    subAreas: ['TODAS', 'ESCRITÓRIOS CENTRAIS', 'TI / DATA CENTER', 'AMBULATÓRIO', 'REFEITÓRIO', 'GMA / AGRÍCOLA'],
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  extinguishers,
  alerts,
  onSelectSector,
  onFilterStatus,
  onOpenQuickSwap,
  onOpenNewExtinguisher,
  onOpenNotifications,
  onExportCsv,
  onPrintReport,
  onNavigateToTab,
}) => {
  // Estado para controlar a unidade selecionada. Quando null, mostra apenas o resumo geral dos 4 setores.
  const [selectedUnit, setSelectedUnit] = useState<OperationalUnitKey | null>(null);
  const [unitSearch, setUnitSearch] = useState<string>('');
  const [selectedSubArea, setSelectedSubArea] = useState<string>('TODAS');
  const [statusFilterInUnit, setStatusFilterInUnit] = useState<'todos' | 'valido' | 'atencao' | 'vencido'>('todos');

  // Cálculos consolidados para as 4 unidades operacionais
  const unitStats = useMemo(() => {
    const stats: Record<OperationalUnitKey, { total: number; valid: number; warning: number; expired: number }> = {
      unidade_industrial: { total: 0, valid: 0, warning: 0, expired: 0 },
      empacotamento: { total: 0, valid: 0, warning: 0, expired: 0 },
      posto_combustivel: { total: 0, valid: 0, warning: 0, expired: 0 },
      adm: { total: 0, valid: 0, warning: 0, expired: 0 },
    };

    let totalOp = 0;
    let totalValid = 0;
    let totalWarning = 0;
    let totalExpired = 0;
    const expiredList: Extinguisher[] = [];

    extinguishers.forEach((ext) => {
      // Ignorar estoque do almoxarifado no cálculo operacional principal dos setores
      if (ext.isStockInWarehouse || ext.sector.startsWith('almoxarifado')) {
        return;
      }

      const secKey = ext.sector as OperationalUnitKey;
      if (stats[secKey]) {
        stats[secKey].total++;
        totalOp++;

        const statusData = computeExtinguisherStatus(ext);
        if (statusData.status === 'vencido') {
          stats[secKey].expired++;
          totalExpired++;
          expiredList.push(ext);
        } else if (statusData.status === 'atencao') {
          stats[secKey].warning++;
          totalWarning++;
        } else {
          stats[secKey].valid++;
          totalValid++;
        }
      }
    });

    const complianceRate = totalOp > 0 ? Math.round(((totalOp - totalExpired) / totalOp) * 100) : 100;

    return {
      stats,
      totalOp,
      totalValid,
      totalWarning,
      totalExpired,
      complianceRate,
      expiredList,
    };
  }, [extinguishers]);

  // Extintores da unidade atualmente selecionada
  const currentUnitExtinguishers = useMemo(() => {
    if (!selectedUnit) return [];

    return extinguishers
      .filter((ext) => ext.sector === selectedUnit && !ext.isStockInWarehouse)
      .filter((ext) => {
        // Filtro por sub-área
        if (selectedSubArea !== 'TODAS') {
          if (!ext.locationDetails.toUpperCase().includes(selectedSubArea.toUpperCase())) {
            return false;
          }
        }
        // Filtro por status
        if (statusFilterInUnit !== 'todos') {
          const st = computeExtinguisherStatus(ext).status;
          if (st !== statusFilterInUnit) return false;
        }
        // Busca textual
        if (unitSearch.trim()) {
          const q = unitSearch.toLowerCase();
          const matchCode = ext.code.toLowerCase().includes(q);
          const matchLoc = ext.locationDetails.toLowerCase().includes(q);
          const matchSeal = ext.inmetroSeal.toLowerCase().includes(q);
          const matchType = TYPE_MAP[ext.type]?.name.toLowerCase().includes(q);
          if (!matchCode && !matchLoc && !matchSeal && !matchType) return false;
        }
        return true;
      });
  }, [extinguishers, selectedUnit, selectedSubArea, statusFilterInUnit, unitSearch]);

  const activeUnitConfig = OPERATIONAL_UNITS.find((u) => u.key === selectedUnit);
  const activeUnitData = selectedUnit ? unitStats.stats[selectedUnit] : null;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* =========================================================================
          CABEÇALHO DO PAINEL GERAL: ESTÉTICA VERDE E BRANCA DA SEGURANÇA (NR-23)
          ========================================================================= */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#007960]/10 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#007960] font-mono">
                  Segurança Contra Incêndio & Pânico (NR-23 / NBR 12693)
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] text-slate-500 font-medium">Planta Operacional uisa</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                Painel Geral dos Setores
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Monitoramento consolidado das 4 unidades operacionais. Clique nas abas ou nos cartões abaixo para visualizar os dados detalhados.
              </p>
            </div>
          </div>

          {/* Indicadores Consolidado Verde e Branco */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#f8faf9] border border-[#007960]/20 rounded-xl px-4 py-2.5 text-right">
              <span className="text-[10px] text-slate-500 font-medium block">Total em Operação</span>
              <span className="text-lg font-bold font-mono text-slate-900">{unitStats.totalOp} extintores</span>
            </div>

            <div className="bg-[#f8faf9] border border-[#007960]/20 rounded-xl px-4 py-2.5 text-right">
              <span className="text-[10px] text-slate-500 font-medium block">Conformidade Geral</span>
              <span className="text-lg font-bold font-mono text-[#007960]">{unitStats.complianceRate}% OK</span>
            </div>
          </div>
        </div>

        {/* ALERTA CRÍTICO: EM DESTAQUE APENAS QUANDO HOUVER EXTINTORES VENCIDOS */}
        {unitStats.totalExpired > 0 ? (
          <div className="mt-5 p-4 rounded-xl bg-red-50 border border-[#de2726] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#de2726] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#de2726] text-white font-mono">
                    Ação Imediata Necessária
                  </span>
                  <span className="text-xs font-semibold text-[#de2726]">
                    {unitStats.totalExpired} extintor(es) com validade de recarga vencida
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5">
                  Extintores vencidos não oferecem garantia de extinção de princípios de incêndio. Realize a troca imediata utilizando os extintores de reserva do Almoxarifado.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto">
              <button
                onClick={() => onOpenQuickSwap(unitStats.expiredList[0])}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#de2726] hover:bg-[#c41f1e] text-white text-xs font-bold shadow transition-all"
              >
                <Repeat className="w-4 h-4" />
                <span>Troca Rápida com Almoxarifado</span>
              </button>
            </div>
          </div>
        ) : unitStats.totalOp === 0 ? (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600 font-medium">
                Nenhum extintor cadastrado na base de dados. Cadastre novos extintores ou importe uma planilha.
              </span>
            </div>
            <button
              onClick={onOpenNewExtinguisher}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Extintor</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 p-3 rounded-xl bg-emerald-50/70 border border-[#007960]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#007960]" />
              <span className="text-xs font-semibold text-[#007960]">
                Todas as 4 unidades operacionais estão com 100% dos extintores em dia (sem equipamentos vencidos).
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#007960] bg-white px-2.5 py-1 rounded-md border border-[#007960]/30">
              Conformidade 100%
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          BARRA DE NAVEGAÇÃO ENTRE AS 4 UNIDADES (ABAS DA UNIDADE)
          ========================================================================= */}
      <div className="flex items-center justify-between gap-3 p-2 bg-white border border-[#007960]/20 rounded-xl shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => setSelectedUnit(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedUnit === null
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Visão Geral (4 Unidades)</span>
          </button>

          {OPERATIONAL_UNITS.map((unit) => {
            const data = unitStats.stats[unit.key];
            const Icon = unit.icon;
            const isSelected = selectedUnit === unit.key;

            return (
              <button
                key={unit.key}
                onClick={() => {
                  setSelectedUnit(unit.key);
                  setSelectedSubArea('TODAS');
                  setStatusFilterInUnit('todos');
                  setUnitSearch('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
                  isSelected
                    ? 'bg-[#007960] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#007960]'}`} />
                <span>{unit.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : data.expired > 0
                      ? 'bg-red-100 text-[#de2726]'
                      : 'bg-emerald-100 text-[#007960]'
                  }`}
                >
                  {data.total}
                </span>

                {/* Destaque apenas se houver vencidos */}
                {data.expired > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#de2726] animate-ping" title={`${data.expired} vencido(s)`} />
                )}
              </button>
            );
          })}
        </div>

        {selectedUnit && (
          <button
            onClick={() => setSelectedUnit(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#007960] hover:bg-[#007960]/10 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Visão Geral</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          CENÁRIO 1: VISÃO GERAL (APENAS AS 4 UNIDADES)
          Quando nenhuma unidade está aberta, mostra apenas os 4 cartões com totais
          ========================================================================= */}
      {selectedUnit === null ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#007960]" />
              <span>Resumo Operacional das 4 Unidades</span>
            </h2>
            <span className="text-xs text-slate-500">
              Clique no cartão ou no botão para abrir os detalhes de cada unidade
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {OPERATIONAL_UNITS.map((unit) => {
              const data = unitStats.stats[unit.key];
              const Icon = unit.icon;
              const rate = data.total > 0 ? Math.round(((data.total - data.expired) / data.total) * 100) : 100;
              const hasExpired = data.expired > 0;

              return (
                <div
                  key={unit.key}
                  onClick={() => {
                    setSelectedUnit(unit.key);
                    setSelectedSubArea('TODAS');
                    setStatusFilterInUnit('todos');
                    setUnitSearch('');
                  }}
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative ${
                    hasExpired
                      ? 'border-[#de2726]/80 hover:border-[#de2726]'
                      : 'border-[#007960]/30 hover:border-[#007960]'
                  }`}
                >
                  <div>
                    {/* Header do Cartão */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[#007960]/10 border border-[#007960]/20 flex items-center justify-center text-[#007960] group-hover:bg-[#007960] group-hover:text-white transition-all shadow-xs">
                        <Icon className="w-6 h-6" />
                      </div>

                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          hasExpired
                            ? 'bg-red-50 text-[#de2726] border-[#de2726]/40'
                            : 'bg-emerald-50 text-[#007960] border-[#007960]/30'
                        }`}
                      >
                        {rate}% Conforme
                      </span>
                    </div>

                    {/* Nome & Escopo */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#007960] transition-colors">
                      {unit.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {unit.scope}
                    </p>
                  </div>

                  {/* Estatísticas Numéricas */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-medium text-slate-500">Total Instalado</span>
                      <span className="font-mono font-bold text-xl text-slate-900">{data.total} <span className="text-xs font-normal text-slate-500">un</span></span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-emerald-50/70 border border-[#007960]/20">
                        <span className="text-[10px] text-slate-500 block">Conformes</span>
                        <span className="font-mono font-bold text-[#007960]">{data.valid} em dia</span>
                      </div>

                      <div
                        className={`p-2 rounded-lg border ${
                          hasExpired
                            ? 'bg-red-50 border-[#de2726]/40 text-[#de2726]'
                            : 'bg-[#f8faf9] border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 block">Vencidos</span>
                        <span
                          className={`font-mono font-bold ${
                            hasExpired ? 'text-[#de2726]' : 'text-[#007960]'
                          }`}
                        >
                          {data.expired} {hasExpired ? 'atenção' : 'vencidos'}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Ação para Abrir Detalhes */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#007960] group-hover:text-[#005a47]">
                      <span>Abrir Detalhes da Unidade</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* =========================================================================
            CENÁRIO 2: INFORMAÇÕES DETALHADAS DA UNIDADE EM QUESTÃO
            Aberto somente ao clicar na respectiva aba ou cartão da unidade
            ========================================================================= */
        <div className="space-y-5">
          {activeUnitConfig && activeUnitData && (
            <div className="bg-white border border-[#007960]/20 rounded-2xl p-6 shadow-sm">
              {/* Header da Unidade Selecionada */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#007960] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <activeUnitConfig.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#007960] font-mono">
                        Detalhamento Operacional da Unidade
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{activeUnitConfig.scope}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      {activeUnitConfig.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectSector(activeUnitConfig.key)}
                    className="px-3.5 py-2 rounded-lg bg-white border border-[#007960]/40 text-[#007960] hover:bg-[#007960]/10 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Ver no Inventário Geral"
                  >
                    <span>Abrir no Inventário</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedUnit(null)}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Fechar Detalhes</span>
                  </button>
                </div>
              </div>

              {/* 3 Cartões de Resumo da Unidade Selecionada */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-5">
                <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#007960]/20">
                  <span className="text-xs text-slate-500 font-medium block">Total nesta Unidade</span>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {activeUnitData.total} <span className="text-xs font-normal text-slate-500">extintores</span>
                  </div>
                  <span className="text-[11px] text-[#007960] font-medium block mt-1">
                    Todos mapeados por tag e ponto
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-[#007960]/30">
                  <span className="text-xs text-slate-500 font-medium block">Conformes & Válidos</span>
                  <div className="text-2xl font-bold font-mono text-[#007960] mt-1">
                    {activeUnitData.valid} <span className="text-xs font-normal text-[#007960]">em dia</span>
                  </div>
                  <span className="text-[11px] text-slate-600 block mt-1">
                    Recarga e teste hidrostático regulares
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    activeUnitData.expired > 0
                      ? 'bg-red-50 border-[#de2726]/40 text-[#de2726]'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-xs text-slate-500 font-medium block">Vencidos na Unidade</span>
                  <div
                    className={`text-2xl font-bold font-mono mt-1 ${
                      activeUnitData.expired > 0 ? 'text-[#de2726]' : 'text-[#007960]'
                    }`}
                  >
                    {activeUnitData.expired}
                  </div>
                  <span className="text-[11px] block mt-1">
                    {activeUnitData.expired > 0 ? (
                      <strong className="text-[#de2726]">Requer troca urgente</strong>
                    ) : (
                      'Nenhum equipamento vencido'
                    )}
                  </span>
                </div>
              </div>

              {/* Filtros Internos da Unidade: Sub-Áreas e Busca */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                {/* Seletor de Sub-Área */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-[#007960]" />
                    <span>Sub-Área:</span>
                  </span>
                  {activeUnitConfig.subAreas.map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedSubArea(area)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        selectedSubArea === area
                          ? 'bg-[#007960] text-white shadow-xs'
                          : 'bg-[#f8faf9] text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>

                {/* Filtro por Status & Busca */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      placeholder="Buscar por tag, selo ou local..."
                      className="bg-[#f8faf9] border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960]"
                    />
                  </div>

                  {/* Filtro Status da Unidade */}
                  <select
                    value={statusFilterInUnit}
                    onChange={(e) => setStatusFilterInUnit(e.target.value as any)}
                    className="bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#007960]"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="valido">Válidos</option>
                    <option value="atencao">A Vencer (&lt;30d)</option>
                    <option value="vencido">Vencidos</option>
                  </select>
                </div>
              </div>

              {/* Tabela de Extintores Detalhados da Unidade */}
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3.5">Código / Tag</th>
                      <th className="py-3 px-3.5">Localização / Ponto</th>
                      <th className="py-3 px-3.5">Tipo & Carga</th>
                      <th className="py-3 px-3.5">Selo INMETRO</th>
                      <th className="py-3 px-3.5">Validade Recarga</th>
                      <th className="py-3 px-3.5">Teste Hidrostático</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                      <th className="py-3 px-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentUnitExtinguishers.map((ext) => {
                      const statusData = computeExtinguisherStatus(ext);
                      const isExpired = statusData.status === 'vencido';

                      return (
                        <tr
                          key={ext.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isExpired ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {ext.code}
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 max-w-xs truncate" title={ext.locationDetails}>
                            {ext.locationDetails}
                          </td>
                          <td className="py-3 px-3.5 text-slate-800 whitespace-nowrap">
                            <span className="font-semibold">{TYPE_MAP[ext.type]?.name || ext.type}</span>{' '}
                            <span className="text-slate-500 font-mono">({ext.capacityWeight})</span>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                            {ext.inmetroSeal}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                            {formatDateBR(ext.rechargeExpiryDate)}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                            {formatDateBR(ext.hydrostaticExpiryDate)}
                          </td>
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${
                                isExpired
                                  ? 'bg-red-100 text-[#de2726] border-[#de2726]/40'
                                  : statusData.status === 'atencao'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-emerald-100 text-[#007960] border-[#007960]/30'
                              }`}
                            >
                              {statusData.label}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            {isExpired ? (
                              <button
                                onClick={() => onOpenQuickSwap(ext)}
                                className="px-2.5 py-1 rounded bg-[#de2726] hover:bg-[#c41f1e] text-white text-xs font-bold shadow-xs transition-colors"
                                title="Substituir imediatamente pelo almoxarifado"
                              >
                                Trocar
                              </button>
                            ) : (
                              <button
                                onClick={() => onSelectSector(activeUnitConfig.key)}
                                className="text-xs text-[#007960] hover:text-[#005a47] font-semibold"
                              >
                                Ficha →
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {currentUnitExtinguishers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                          Nenhum extintor encontrado para os filtros selecionados nesta unidade.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rodapé informativo da Unidade */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Exibindo <strong>{currentUnitExtinguishers.length}</strong> extintor(es) da {activeUnitConfig.name}.
                </span>
                <button
                  onClick={() => onSelectSector(activeUnitConfig.key)}
                  className="text-xs text-[#007960] hover:underline font-bold"
                >
                  Abrir visão setorial completa desta unidade →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
