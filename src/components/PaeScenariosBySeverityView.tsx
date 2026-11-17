import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Radio,
  PhoneCall,
  Clock,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Factory,
  Package,
  Building2,
  Sliders,
  Zap,
} from 'lucide-react';
import { ContingencyPlan, RiskLevel } from '../types/contingency';
import { INITIAL_CONTINGENCY_PLANS } from '../data/contingencyData';

interface PaeScenariosBySeverityViewProps {
  onSelectPlan?: (planId: string) => void;
}

// Ordem estrita de gravidade técnica
const SEVERITY_WEIGHT: Record<RiskLevel, number> = {
  critico: 3,
  alto: 2,
  moderado: 1,
};

// Ranking manual de prioridade máxima entre os cenários
const SCENARIO_PRIORITY_ORDER: Record<string, number> = {
  'pc-ind-incendio-inflamaveis': 1, // Incêndio Parque de Tanques de Etanol
  'pc-agr-defensivos-agricolas': 2, // Incêndio Defensivos (PROIBIDO ÁGUA)
  'pc-ind-subestacao': 3, // Subestação Elétrica 13.8kV
  'pc-ind-quimicos-acidos': 4, // Vazamento Soda e Ácidos Corrosivos
  'pc-agr-incendio-canavial': 5, // Incêndio Canavial e Vegetação Florestal
  'pc-agr-incendio-colhedora': 6, // Incêndio Colhedora no Campo
  'pc-ind-abandono': 7, // Abandono Geral da Indústria
  'pc-emp-abandono-assari': 8, // Abandono Geral Empacotamento
  'pc-ind-deposito-bagaco': 9, // Incêndio Depósito de Bagaço
  'pc-emp-incendio-acucar': 10, // Incêndio Açúcar e Saneantes
  'pc-agr-vazamento-defensivos': 11, // Vazamento Defensivos
  'pc-adm-abandono-gma': 12, // Abandono ADM / Posto
};

export const PaeScenariosBySeverityView: React.FC<PaeScenariosBySeverityViewProps> = ({
  onSelectPlan,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<RiskLevel | 'todos'>('todos');
  const [filterDivision, setFilterDivision] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>('pc-ind-incendio-inflamaveis');

  // Ordenação do mais grave ao menos grave
  const sortedScenarios = useMemo(() => {
    return [...INITIAL_CONTINGENCY_PLANS].sort((a, b) => {
      const weightA = SEVERITY_WEIGHT[a.riskRating] || 0;
      const weightB = SEVERITY_WEIGHT[b.riskRating] || 0;
      if (weightB !== weightA) {
        return weightB - weightA; // Crítico primeiro, depois Alto, depois Moderado
      }
      const orderA = SCENARIO_PRIORITY_ORDER[a.id] || 99;
      const orderB = SCENARIO_PRIORITY_ORDER[b.id] || 99;
      return orderA - orderB;
    });
  }, []);

  const filteredScenarios = useMemo(() => {
    return sortedScenarios.filter((plan) => {
      const matchSeverity = filterSeverity === 'todos' || plan.riskRating === filterSeverity;
      const matchDivision = filterDivision === 'todas' || plan.division === filterDivision;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        plan.title.toLowerCase().includes(q) ||
        plan.code.toLowerCase().includes(q) ||
        plan.subArea.toLowerCase().includes(q) ||
        plan.scenarioDescription.toLowerCase().includes(q);
      return matchSeverity && matchDivision && matchSearch;
    });
  }, [sortedScenarios, filterSeverity, filterDivision, searchQuery]);

  const stats = useMemo(() => {
    const total = INITIAL_CONTINGENCY_PLANS.length;
    const criticos = INITIAL_CONTINGENCY_PLANS.filter((p) => p.riskRating === 'critico').length;
    const altos = INITIAL_CONTINGENCY_PLANS.filter((p) => p.riskRating === 'alto').length;
    const moderados = INITIAL_CONTINGENCY_PLANS.filter((p) => p.riskRating === 'moderado').length;
    return { total, criticos, altos, moderados };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner com Destaque de Gravidade */}
      <div className="bg-white border border-[#007960]/20 p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#de2726] shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Cenários de Contingência por Grau de Severidade
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-[#de2726] border border-red-200 uppercase">
                Do Mais Grave ao Menos Grave
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30">
                SST.NP-022 • PAE Oficial
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Classificação sistemática de emergências conforme potencial de perdas, abrangência geográfica, risco de explosão e requisitos de evacuação imediata
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir Matriz de Gravidade</span>
          </button>
        </div>
      </div>

      {/* KPI Severity Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            Total de Cenários
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{stats.total}</span>
            <span className="text-xs text-slate-500">planos</span>
          </div>
        </div>

        <div
          onClick={() => setFilterSeverity(filterSeverity === 'critico' ? 'todos' : 'critico')}
          className={`cursor-pointer transition-all border p-4 rounded-2xl shadow-2xs ${
            filterSeverity === 'critico'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
              : 'bg-white border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#de2726] font-bold block">
              Nível Crítico (Grau 1)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#de2726] animate-ping" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#de2726] font-mono">{stats.criticos}</span>
            <span className="text-xs text-red-700 font-semibold">Prioridade Máxima</span>
          </div>
        </div>

        <div
          onClick={() => setFilterSeverity(filterSeverity === 'alto' ? 'todos' : 'alto')}
          className={`cursor-pointer transition-all border p-4 rounded-2xl shadow-2xs ${
            filterSeverity === 'alto'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-amber-200 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">
            Nível Alto (Grau 2)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700 font-mono">{stats.altos}</span>
            <span className="text-xs text-amber-700 font-semibold">Danos Severos</span>
          </div>
        </div>

        <div
          onClick={() => setFilterSeverity(filterSeverity === 'moderado' ? 'todos' : 'moderado')}
          className={`cursor-pointer transition-all border p-4 rounded-2xl shadow-2xs ${
            filterSeverity === 'moderado'
              ? 'bg-emerald-50 border-[#007960] ring-2 ring-[#007960]'
              : 'bg-white border-[#007960]/20 hover:border-[#007960]/40'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-[#007960] font-bold block">
            Nível Moderado (Grau 3)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#007960] font-mono">{stats.moderados}</span>
            <span className="text-xs text-[#007960] font-semibold">Risco Controlável</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Título do Cenário, Código ou Área..."
            className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterSeverity('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterSeverity === 'todos' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas Gravidades
            </button>
            <button
              onClick={() => setFilterSeverity('critico')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterSeverity === 'critico' ? 'bg-[#de2726] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Crítico ({stats.criticos})
            </button>
            <button
              onClick={() => setFilterSeverity('alto')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterSeverity === 'alto' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alto ({stats.altos})
            </button>
            <button
              onClick={() => setFilterSeverity('moderado')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterSeverity === 'moderado' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Moderado ({stats.moderados})
            </button>
          </div>

          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="bg-[#f8faf9] border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-medium focus:outline-none"
          >
            <option value="todas">Todas Unidades</option>
            <option value="industria">Indústria</option>
            <option value="empacotamento">Empacotamento</option>
            <option value="adm_agricola">ADM / Agrícola / Posto</option>
          </select>
        </div>
      </div>

      {/* List of Scenarios Ranked by Severity */}
      <div className="space-y-4">
        {filteredScenarios.map((plan, index) => {
          const rank = index + 1;
          const isCritical = plan.riskRating === 'critico';
          const isHigh = plan.riskRating === 'alto';
          const isExpanded = expandedPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl shadow-xs transition-all overflow-hidden ${
                isCritical
                  ? 'border-red-200 hover:border-red-300'
                  : isHigh
                  ? 'border-amber-200 hover:border-amber-300'
                  : 'border-slate-200 hover:border-[#007960]/40'
              }`}
            >
              {/* Card Header Accordion Trigger */}
              <div
                onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                className="p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none hover:bg-slate-50/50"
              >
                <div className="flex items-start gap-4">
                  {/* Numerical Rank Badge */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-base shrink-0 shadow-xs ${
                      isCritical
                        ? 'bg-red-50 text-[#de2726] border border-red-200'
                        : isHigh
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-[#007960] border border-[#007960]/30'
                    }`}
                  >
                    #{rank}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Risk Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-600 text-white shadow-xs'
                            : isHigh
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-[#007960] text-white shadow-xs'
                        }`}
                      >
                        {isCritical ? 'GRAVIDADE CRÍTICA' : isHigh ? 'GRAVIDADE ALTA' : 'GRAVIDADE MODERADA'}
                      </span>

                      {/* Division Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {plan.division === 'industria'
                          ? 'Indústria'
                          : plan.division === 'empacotamento'
                          ? 'Empacotamento'
                          : 'ADM / Agrícola / Posto'}
                      </span>

                      {/* Code Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 font-bold">
                        {plan.code}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {plan.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      <strong>Área de Ocorrência:</strong> {plan.subArea}
                    </p>
                  </div>
                </div>

                {/* Right Summary Badges */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-[#f8faf9] px-3.5 py-2 rounded-xl border border-slate-200 text-right font-mono text-xs">
                    <span className="text-[10px] text-slate-500 block">Raio de Isolamento</span>
                    <span className="font-bold text-slate-900">{plan.isolationRadiusMeters} metros</span>
                  </div>

                  <div className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Accordion Expanded Details */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 bg-[#f8faf9]/50 space-y-4 text-xs animate-in fade-in">
                  {/* Scenario Description & Trigger */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                        Descrição do Sinistro & Danos Potenciais
                      </span>
                      <p className="text-slate-700 leading-relaxed">{plan.scenarioDescription}</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-red-700 text-[11px] uppercase tracking-wider block flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>Evento Gatilho de Acionamento</span>
                      </span>
                      <p className="text-slate-700 leading-relaxed">{plan.triggerEvent}</p>
                    </div>
                  </div>

                  {/* Immediate Actions Checklist */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#007960]" />
                      <span>Checklist de Resposta Rápida (Cronograma de Ações)</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                      {plan.checklist.map((chk) => (
                        <div
                          key={chk.id}
                          className="p-2.5 rounded-lg bg-[#f8faf9] border border-slate-200 space-y-1"
                        >
                          <span className="text-[10px] font-mono font-bold text-[#007960] bg-emerald-50 px-1.5 py-0.5 rounded border border-[#007960]/20">
                            {chk.timeframe}
                          </span>
                          <p className="text-[11px] font-medium text-slate-800 line-clamp-2">{chk.action}</p>
                          <span className="text-[9px] text-slate-500 block truncate">
                            Resp: {chk.responsibleRole}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brigade Tactics & External Support Trigger */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#007960]" />
                        <span>Tática Prioritária da Brigada</span>
                      </span>
                      <p className="text-slate-700 leading-relaxed">{plan.brigadeTactic}</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-red-200 space-y-1.5">
                      <span className="font-bold text-red-800 text-[11px] uppercase tracking-wider block flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                        <span>Gatilho de Apoio Externo (Corpo de Bombeiros 193)</span>
                      </span>
                      <p className="text-red-900 leading-relaxed font-medium">
                        {plan.externalSupportTrigger}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar inside card */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                      <span>Revisão Oficial: {plan.lastReviewDate}</span>
                      <span>•</span>
                      <span>Gestor: {plan.responsibleManager}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
                      >
                        Imprimir Cartão
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
