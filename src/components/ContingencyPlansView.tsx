import React, { useState } from 'react';
import {
  ShieldAlert,
  Factory,
  Package,
  Tractor,
  AlertTriangle,
  Flame,
  CheckSquare,
  Square,
  Printer,
  Search,
  ExternalLink,
  ChevronRight,
  Clock,
  Radio,
  Sliders,
  ZapOff,
  HardHat,
} from 'lucide-react';
import { ContingencyPlan, ContingencyDivision } from '../types/contingency';
import {
  INITIAL_CONTINGENCY_PLANS,
  CONTINGENCY_DOC_METADATA,
} from '../data/contingencyData';

export const ContingencyPlansView: React.FC = () => {
  const [plans, setPlans] = useState<ContingencyPlan[]>(INITIAL_CONTINGENCY_PLANS);
  const [selectedDivision, setSelectedDivision] = useState<ContingencyDivision>('industria');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pc-ind-01');

  // Toggle checklist item
  const handleToggleChecklistItem = (planId: string, itemId: string) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          checklist: plan.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      })
    );
  };

  const currentDivisionPlans = plans.filter((p) => {
    const matchDiv = p.division === selectedDivision;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.subArea.toLowerCase().includes(q);
    return matchDiv && matchSearch;
  });

  const activePlan = plans.find((p) => p.id === selectedPlanId) || currentDivisionPlans[0] || plans[0];

  const handlePrintPlan = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header (White & Safety Green) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#007960]/20 p-5 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Planos de Contingência Setoriais
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                RESPOSTA A CENÁRIOS CRÍTICOS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30">
                AUDITADO 2026
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Procedimentos operacionais de contenção imediata divididos entre <strong>Indústria</strong>, <strong>Empacotamento</strong> e <strong>ADM / Agrícola</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPlan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
            title="Imprimir Cartão de Resposta a Emergência"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir Cartão de Contingência</span>
          </button>
        </div>
      </div>

      {/* 3 Main Division Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setSelectedDivision('industria');
            const first = plans.find((p) => p.division === 'industria');
            if (first) setSelectedPlanId(first.id);
          }}
          className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all shadow-2xs ${
            selectedDivision === 'industria'
              ? 'bg-[#007960] border-[#007960] text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/50 hover:bg-[#f8faf9]'
          }`}
        >
          <div
            className={`p-2.5 rounded-lg border ${
              selectedDivision === 'industria'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
            }`}
          >
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Divisão Indústria</h3>
            <p className={`text-xs ${selectedDivision === 'industria' ? 'text-white/80' : 'text-slate-500'}`}>
              Tanques de Etanol, Caldeiras, Moenda, Subestação
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedDivision('empacotamento');
            const first = plans.find((p) => p.division === 'empacotamento');
            if (first) setSelectedPlanId(first.id);
          }}
          className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all shadow-2xs ${
            selectedDivision === 'empacotamento'
              ? 'bg-[#007960] border-[#007960] text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/50 hover:bg-[#f8faf9]'
          }`}
        >
          <div
            className={`p-2.5 rounded-lg border ${
              selectedDivision === 'empacotamento'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
            }`}
          >
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Divisão Empacotamento</h3>
            <p className={`text-xs ${selectedDivision === 'empacotamento' ? 'text-white/80' : 'text-slate-500'}`}>
              Silos, Poeiras Combustíveis, Esteiras, Armazém
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedDivision('adm_agricola');
            const first = plans.find((p) => p.division === 'adm_agricola');
            if (first) setSelectedPlanId(first.id);
          }}
          className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all shadow-2xs ${
            selectedDivision === 'adm_agricola'
              ? 'bg-[#007960] border-[#007960] text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/50 hover:bg-[#f8faf9]'
          }`}
        >
          <div
            className={`p-2.5 rounded-lg border ${
              selectedDivision === 'adm_agricola'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
            }`}
          >
            <Tractor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Divisão ADM / Agrícola</h3>
            <p className={`text-xs ${selectedDivision === 'adm_agricola' ? 'text-white/80' : 'text-slate-500'}`}>
              Canaviais, Comboios, Oficinas, Prédio ADM & CPD
            </p>
          </div>
        </button>
      </div>

      {/* Official Document Reference Banner */}
      {(() => {
        const docMeta = CONTINGENCY_DOC_METADATA[selectedDivision];
        return (
          <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-[#007960] border border-[#007960]/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-50 text-[#007960] border border-[#007960]/30">
                    {docMeta.documentCode} Rev {docMeta.revision}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Emitido em {docMeta.date}
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                    Emergência: Ramal 3737 • Canal 01 VHF
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SINAL VERDE • Revisão Anual Válida
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1">
                  {docMeta.title}
                </h4>
              </div>
            </div>

            <a
              href={docMeta.pdfAssetPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Anexo Oficial (PDF)</span>
            </a>
          </div>
        );
      })()}

      {/* Main Content: List of Plans on the Left, Detailed Interactive Card on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Plans in Division */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar cenários..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007960] shadow-2xs"
            />
          </div>

          <div className="space-y-2">
            {currentDivisionPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all shadow-2xs ${
                  activePlan.id === plan.id
                    ? 'bg-emerald-50/70 border-[#007960] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-[#007960]">{plan.code}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      plan.riskRating === 'critico'
                        ? 'bg-red-50 text-[#de2726] border border-red-200'
                        : plan.riskRating === 'alto'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-[#007960] border border-emerald-200'
                    }`}
                  >
                    Risco {plan.riskRating}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs leading-snug">{plan.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{plan.subArea}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Plan Deep-Dive Card */}
        <div className="lg:col-span-2 space-y-4">
          <div
            id="printable-contingency-card"
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5"
          >
            {/* Top Bar of Active Plan */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                    {activePlan.code}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {activePlan.subArea}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Raio de Isolamento:</span>
                  <span className="font-mono font-bold text-[#de2726] text-xs bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {activePlan.isolationRadiusMeters} metros
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {activePlan.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {activePlan.scenarioDescription}
              </p>
            </div>

            {/* Gatilho de Ativação */}
            <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#de2726] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-[#de2726] uppercase block mb-0.5">
                  Evento Gatilho para Ativação da Contingência:
                </span>
                <p className="text-slate-800">{activePlan.triggerEvent}</p>
              </div>
            </div>

            {/* Ações Imediatas de Contenção */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#007960] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#de2726]" />
                <span>Procedimentos Imediatos de Contenção</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                {activePlan.containmentProcedures.map((proc, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#f8faf9] p-2.5 rounded-lg border border-slate-200">
                    <span className="font-mono font-bold text-[#007960] text-xs shrink-0 mt-0.5">
                      {i + 1}.
                    </span>
                    <span className="text-slate-800">{proc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Intertravamentos / Desligamentos de Emergência */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ZapOff className="w-4 h-4 text-blue-600" />
                <span>Desligamentos e Intertravamentos de Segurança (ESD / Trips)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {activePlan.shutdownProcedures.map((proc, i) => (
                  <div key={i} className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-200 text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span>{proc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EPIs Obrigatórios & Tática da Brigada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-purple-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-purple-600" />
                  <span>EPIs de Alta Proteção Requeridos</span>
                </span>
                <ul className="space-y-1 text-slate-700">
                  {activePlan.requiredPPEAndEquipment.map((ppe, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-purple-600">•</span>
                      <span>{ppe}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-[#007960] uppercase tracking-wider block flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#007960]" />
                  <span>Tática de Combate & Acionamento Externo</span>
                </span>
                <p className="text-slate-700 leading-relaxed text-[11px] mb-2">
                  {activePlan.brigadeTactic}
                </p>
                <div className="p-2 rounded bg-white text-[10px] text-slate-600 border border-slate-200">
                  <strong className="text-[#de2726]">Gatilho de Apoio Externo (193): </strong>
                  {activePlan.externalSupportTrigger}
                </div>
              </div>
            </div>

            {/* Checklist Interativo de Treinamento e Resposta */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#007960]" />
                  <span>Checklist Cronológico de Ação (Interativo)</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activePlan.checklist.filter((c) => c.completed).length} de {activePlan.checklist.length} concluídos
                </span>
              </div>

              <div className="space-y-1.5">
                {activePlan.checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklistItem(activePlan.id, item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                      item.completed
                        ? 'bg-emerald-50/80 border-[#007960]/50 text-slate-900'
                        : 'bg-[#f8faf9] border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#007960] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-mono text-[11px] font-bold text-[#007960] w-16 shrink-0">
                        {item.timeframe}
                      </span>
                      <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-800'}>
                        {item.action}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                      {item.responsibleRole}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Footer */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              <div>
                <span>Última Revisão: </span>
                <span className="font-mono text-slate-700">{activePlan.lastReviewDate}</span>
              </div>
              <div>
                <span>Responsável Técnico: </span>
                <span className="text-slate-800 font-semibold">{activePlan.responsibleManager}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
