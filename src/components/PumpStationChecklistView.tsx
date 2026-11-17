import React, { useState } from 'react';
import {
  ShieldCheck,
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
  Activity,
  Plus,
  Flame,
  Info,
} from 'lucide-react';
import {
  PUMP_STATION_METADATA,
  PUMP_STATION_SEPTEMBER_2026_TESTS,
  PumpTestRecord,
} from '../data/pumpStationData';
import { formatDateBR } from '../utils/formatters';

export const PumpStationChecklistView: React.FC = () => {
  const [tests, setTests] = useState<PumpTestRecord[]>(PUMP_STATION_SEPTEMBER_2026_TESTS);
  const [selectedTestId, setSelectedTestId] = useState<string>(
    PUMP_STATION_SEPTEMBER_2026_TESTS[0].id
  );

  const currentTest = tests.find((t) => t.id === selectedTestId) || tests[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Header & Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/60 border border-red-500/30 shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Casa de Bombas de Incêndio & RTI
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                {PUMP_STATION_METADATA.documentCode}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                REV {PUMP_STATION_METADATA.revision} ({PUMP_STATION_METADATA.documentDate})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                OPERACIONAL 100%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-300">{PUMP_STATION_METADATA.location}</span>
              <span className="text-slate-600">•</span>
              <span>UISA Bioenergia & Açúcar</span>
              <span className="text-slate-600">•</span>
              <span>Inspeções Semanais Setembro/2026 (4 Registros)</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={PUMP_STATION_METADATA.pdfAssetPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            title="Abrir o documento PDF original escaneado de Setembro/2026"
          >
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <span>Ver PDF Original Digitalizado</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            title="Imprimir Checklist Oficial SST.RE-094"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir Ficha SST.RE-094</span>
          </button>
        </div>
      </div>

      {/* Week Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {tests.map((test, index) => {
          const isSelected = test.id === selectedTestId;
          return (
            <button
              key={test.id}
              onClick={() => setSelectedTestId(test.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/60'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{test.weekLabel}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {test.time}
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary KPI Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Diesel Pump Rpm */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bomba Diesel (Rotação)</div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {currentTest.dieselRpm} <span className="text-xs text-slate-400 font-normal">rpm</span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Ligado 30 min sem anomalias</span>
            </div>
          </div>
        </div>

        {/* Jockey Pump Pressure */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bomba Jockey (Pressostato)</div>
            <div className="text-xl font-black font-mono text-white tracking-tight">
              {currentTest.jockeyStartPressureKgf.toFixed(1)} / {currentTest.jockeyStopPressureKgf.toFixed(1)}{' '}
              <span className="text-xs text-slate-400 font-normal">Kgf</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              <span>Partida: 6.0 Kgf • Parada: 7.0 Kgf</span>
            </div>
          </div>
        </div>

        {/* Technical Water Reserve (RTI) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Reserva Técnica Incêndio (RTI)</div>
            <div className="text-2xl font-black font-mono text-cyan-400 tracking-tight">
              {currentTest.waterReservePercentage}%
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Tanque Cheio • Sem Vazamentos</span>
            </div>
          </div>
        </div>

        {/* Diesel Generator Level */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Combustível Gerador Diesel</div>
            <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
              {currentTest.generatorFuelLevelPercentage}%
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              <span>Nível &gt; 3/4 do volume máximo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Form Sheet Replica (SST.RE-094) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Sheet Top Info */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="font-mono font-bold text-amber-400 text-sm">
              SST.RE-094
            </div>
            <div className="text-slate-400">
              Formulário de Verificação Semanal do Sistema de Bombeamento de Incêndio
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
            <div>
              <span className="text-slate-500">DATA:</span>{' '}
              <strong className="text-white">{formatDateBR(currentTest.date)}</strong>
            </div>
            <div>
              <span className="text-slate-500">HORA:</span>{' '}
              <strong className="text-white">{currentTest.time}</strong>
            </div>
            <div>
              <span className="text-slate-500">TAG MOTOR:</span>{' '}
              <strong className="text-amber-400">{currentTest.motorTags}</strong>
            </div>
          </div>
        </div>

        {/* Itemized Grid */}
        <div className="p-6 space-y-6">
          {/* Section 1: Bomba Diesel (Desligado & Ligado) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-red-400 flex items-center gap-2 uppercase tracking-wide">
                <Flame className="w-4 h-4" />
                <span>1. Bomba Diesel (Motor Desligado e Ligado 30 Min)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Pelo Pressostato • Automático
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <ItemCheckRow
                label="Camisa de aquecimento (pré aquecedor) está aquecido?"
                value={currentTest.preHeatingJacketWarmed ? 'Sim' : 'Não'}
                status={currentTest.preHeatingJacketWarmed ? 'ok' : 'neutral'}
                note="Conforme registrado no documento físico (Não)"
              />
              <ItemCheckRow
                label="Nível do óleo lubrificante (vareta)"
                value={currentTest.oilLevelNormal ? 'Normal' : 'Baixo'}
                status="ok"
              />
              <ItemCheckRow
                label="Nível do líquido refrigerante (aditivo >= 50%)"
                value={currentTest.coolantLevelNormal ? 'Normal' : 'Baixo'}
                status="ok"
              />
              <ItemCheckRow
                label="Filtro de óleo lubrificante (validade)"
                value={currentTest.oilFilterNormal ? 'Normal' : 'Vencido'}
                status="ok"
              />
              <ItemCheckRow
                label="Cabos das baterias 1 e 2 estão conectados?"
                value={currentTest.batteryCablesConnected ? 'Sim' : 'Não'}
                status="ok"
              />
              <ItemCheckRow
                label="Densidade do eletrólito das baterias"
                value={currentTest.electrolyteDensityOk ? 'Adequado' : 'Irregular'}
                status="ok"
              />
              <ItemCheckRow
                label="Cabos das baterias apresentam corrosão / apertados"
                value={currentTest.batteryCablesCorrosionNormal ? 'Normal' : 'Irregular'}
                status="ok"
              />
              <ItemCheckRow
                label="Rotação do motor Diesel sob carga"
                value={`${currentTest.dieselRpm} rpm`}
                status="ok"
                highlight
              />
              <ItemCheckRow
                label="Vazão de água do arrefecimento (visual)"
                value={currentTest.coolingWaterFlowNormal ? 'Normal' : 'Irregular'}
                status="ok"
              />
              <ItemCheckRow
                label="Gaxetas da bomba (pequeno fluxo esperado)"
                value={currentTest.packingSealNormal ? 'Normal' : 'Irregular'}
                status="ok"
              />
              <ItemCheckRow
                label="Vibração ou som estranho"
                value={currentTest.abnormalVibration ? 'Sim' : 'Não'}
                status="ok"
              />
              <ItemCheckRow
                label="Sistema ficou no automático depois dos testes?"
                value={currentTest.dieselSystemInAutoAfterTest ? 'Sim' : 'Não'}
                status="ok"
                highlight
              />
            </div>
          </div>

          {/* Section 2: Bomba Jockey & Painel de Controle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bomba Jockey */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2 uppercase tracking-wide">
                  <Activity className="w-4 h-4" />
                  <span>2. Bomba Jockey</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <ItemCheckRow
                  label="Apresenta barulho ou vazamento de água?"
                  value={currentTest.jockeyNoiseLeak ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="Pressão de partida (queda de pressão no manômetro)"
                  value={`${currentTest.jockeyStartPressureKgf.toFixed(1)} Kgf`}
                  status="ok"
                  highlight
                />
                <ItemCheckRow
                  label="Pressão de parada automática (pelo manômetro)"
                  value={`${currentTest.jockeyStopPressureKgf.toFixed(1)} Kgf`}
                  status="ok"
                  highlight
                />
                <ItemCheckRow
                  label="Painel acusou alarme ou outro problema?"
                  value={currentTest.jockeyAlarmTripped ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="Sistema ficou no automático depois dos testes?"
                  value={currentTest.jockeySystemInAutoAfterTest ? 'Sim' : 'Não'}
                  status="ok"
                />
              </div>
            </div>

            {/* Painel de Controle */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2 uppercase tracking-wide">
                  <Zap className="w-4 h-4" />
                  <span>3. Painel de Controle</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <ItemCheckRow
                  label="LEDs das luzes estão funcionando?"
                  value={currentTest.panelLedsNormal ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="Alguma irregularidade com botões ou chaves de acionamento?"
                  value={currentTest.switchButtonFault ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="Sirene de funcionamento"
                  value="N/A"
                  status="neutral"
                />
                <ItemCheckRow
                  label="Painel elétrico está identificado e operante?"
                  value={currentTest.panelIdentifiedAndOperant ? 'Sim' : 'Não'}
                  status="ok"
                  highlight
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bomba Elétrica */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
                <Zap className="w-4 h-4" />
                <span>4. Bomba Elétrica</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <ItemCheckRow
                label="Potência (CV/HP) conforme projeto aprovado?"
                value={currentTest.electricMotorHpApproved ? 'Sim' : 'Não'}
                status="ok"
              />
              <ItemCheckRow
                label="BCI com ligação elétrica independente de outras cargas?"
                value={currentTest.independentElectricalConnection ? 'Sim' : 'Não'}
                status="ok"
              />
              <ItemCheckRow
                label="Existe extintor de incêndio para proteção da casa de bombas?"
                value={currentTest.extinguishersPresentAtStation ? 'Sim' : 'Não'}
                status="ok"
                highlight
                note="Conforme NR-23 / NBR 12962"
              />
              <ItemCheckRow
                label="Painel elétrico identificado e operante?"
                value={currentTest.electricPanelIdentifiedAndOperant ? 'Sim' : 'Não'}
                status="ok"
              />
              <ItemCheckRow
                label="Apresenta algum barulho ou vazamento de água?"
                value={currentTest.electricPumpNoiseLeak ? 'Sim' : 'Não'}
                status="ok"
              />
              <ItemCheckRow
                label="Foi testado o modo manual e automático?"
                value={currentTest.testedManualAndAuto ? 'Sim' : 'Não'}
                status="ok"
              />
              <ItemCheckRow
                label="O sistema ficou no automático depois dos testes?"
                value={currentTest.electricSystemInAutoAfterTest ? 'Sim' : 'Não'}
                status="ok"
                highlight
              />
            </div>
          </div>

          {/* Section 4: Reservatórios (Diesel e Água RTI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wide">
                <Fuel className="w-4 h-4" />
                <span>5. Reservatórios de Óleo Diesel</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <ItemCheckRow
                  label="Está no nível após os testes (≥ 3/4 volume máximo)?"
                  value={currentTest.dieselFuelLevelOk ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="Apresenta algum tipo de vazamento?"
                  value={currentTest.dieselFuelTankLeak ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="Válvula do tanque até a bomba principal trancada aberta?"
                  value={currentTest.dieselTankValveOpenLocked ? 'Sim' : 'Não'}
                  status="ok"
                  highlight
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-cyan-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wide">
                <Droplets className="w-4 h-4" />
                <span>6. Reservatório de Água de Incêndio (RTI)</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <ItemCheckRow
                  label="Apresenta algum vazamento de água?"
                  value={currentTest.waterTankLeak ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="O nível do tanque está cheio?"
                  value={currentTest.waterTankFull ? 'Sim' : 'Não'}
                  status="ok"
                />
                <ItemCheckRow
                  label="Nível da reserva técnica de incêndio (RTI) após os testes"
                  value={`${currentTest.waterReservePercentage}%`}
                  status="ok"
                  highlight
                />
              </div>
            </div>
          </div>

          {/* Section 5: Equipe, Vistos e Observações */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wide">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>7. Responsáveis Técnicos & Observações Importantes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 font-semibold uppercase">Líder da Brigada de Incêndio</div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{currentTest.brigadeLeaderName}</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                  <span>Visto registrado:</span>
                  <span className="text-emerald-400 italic font-semibold">"{currentTest.brigadeLeaderSignature}"</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 font-semibold uppercase">Eletricista Responsável</div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>{currentTest.electricianName}</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                  <span>Visto registrado:</span>
                  <span className="text-blue-400 italic font-semibold">"{currentTest.electricianSignature}"</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>Observações Importantes Registradas em Campo:</span>
              </div>
              <p className="text-slate-300 font-mono">
                {currentTest.importantNotes}
              </p>
              <div className="text-slate-400 font-sans pt-1">
                <strong className="text-slate-300">Manutenções Recomendadas:</strong> {currentTest.recommendedMaintenance}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ItemCheckRowProps {
  label: string;
  value: string;
  status: 'ok' | 'warning' | 'error' | 'neutral';
  note?: string;
  highlight?: boolean;
}

const ItemCheckRow: React.FC<ItemCheckRowProps> = ({
  label,
  value,
  status,
  note,
  highlight,
}) => {
  return (
    <div
      className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
        highlight
          ? 'bg-slate-900/90 border-slate-700 shadow-sm'
          : 'bg-slate-900/40 border-slate-800/80'
      }`}
    >
      <div className="space-y-0.5">
        <span className="text-slate-300 leading-snug block">{label}</span>
        {note && <span className="text-[10px] text-slate-500 block">{note}</span>}
      </div>
      <div className="shrink-0">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
            status === 'ok'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : status === 'warning'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : status === 'error'
              ? 'bg-red-950 text-red-300 border border-red-800'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {status === 'ok' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          <span>{value}</span>
        </span>
      </div>
    </div>
  );
};
