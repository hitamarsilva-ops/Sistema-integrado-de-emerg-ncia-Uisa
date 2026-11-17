import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  Printer,
  Factory,
  Package,
  Fuel,
  Building2,
  ShieldCheck,
  Zap,
  Gauge,
  UserCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  PumpStationDivision,
  PumpTestRecord,
  PUMP_STATIONS_BY_DIVISION,
  PUMP_STATION_SEPTEMBER_2026_TESTS,
} from '../data/pumpStationData';
import { formatDateBR } from '../utils/formatters';

interface PumpWeeklyCalendarViewProps {
  selectedDivision: PumpStationDivision;
  onSelectDivision: (div: PumpStationDivision) => void;
  tests: PumpTestRecord[];
  onAddTest?: (test: PumpTestRecord) => void;
}

// Configuração padrão de agendamento semanal por polo industrial
export const POLE_TEST_SCHEDULE: Record<
  PumpStationDivision,
  {
    poleName: string;
    dayOfWeek: string;
    standardTime: string;
    responsibleTeam: string;
    bciTag: string;
    durationMinutes: number;
  }
> = {
  industria: {
    poleName: 'Polo Industrial (Complexo Sucroalcooleiro)',
    dayOfWeek: 'Toda Quinta-feira',
    standardTime: '09:00 h',
    responsibleTeam: 'Bombeiro Civil Plantonista + Eletricista de Força',
    bciTag: 'TAG 108005 / 104001',
    durationMinutes: 30,
  },
  empacotamento: {
    poleName: 'Polo Empacotamento (Unidade Assari)',
    dayOfWeek: 'Toda Quinta-feira',
    standardTime: '14:00 h',
    responsibleTeam: 'Brigadista Assari + Técnico de SST',
    bciTag: 'TAG 208001 / 204002',
    durationMinutes: 30,
  },
  posto_combustivel: {
    poleName: 'Polo Posto de Combustíveis & Frotas',
    dayOfWeek: 'Toda Terça-feira',
    standardTime: '09:00 h',
    responsibleTeam: 'Bombeiro Civil + Operador de Abastecimento',
    bciTag: 'TAG 408001 / 404001',
    durationMinutes: 25,
  },
  adm: {
    poleName: 'Polo Administrativo & Oficinas GMA',
    dayOfWeek: 'Toda Sexta-feira',
    standardTime: '15:00 h',
    responsibleTeam: 'Técnico de SST + Eletricista Predial',
    bciTag: 'TAG 308001 / 304001',
    durationMinutes: 20,
  },
};

export const PumpWeeklyCalendarView: React.FC<PumpWeeklyCalendarViewProps> = ({
  selectedDivision,
  onSelectDivision,
  tests,
  onAddTest,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState<boolean>(false);

  // Form modal state for registering a weekly test
  const [newTestWeek, setNewTestWeek] = useState<string>('Semana 5');
  const [newTestDate, setNewTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTestTime, setNewTestTime] = useState<string>('09:00 h');
  const [newTestInspector, setNewTestInspector] = useState<string>('Maria Ap. S. Guimarães');
  const [newTestElectrician, setNewTestElectrician] = useState<string>('Rodrigo Alencar');
  const [newTestDieselRpm, setNewTestDieselRpm] = useState<number>(2750);
  const [newTestJockeyPress, setNewTestJockeyPress] = useState<number>(6.0);
  const [newTestRti, setNewTestRti] = useState<number>(100);
  const [newTestNotes, setNewTestNotes] = useState<string>(
    'Teste semanal preventivo executado com partida automática por despressurização.'
  );

  const currentStation = PUMP_STATIONS_BY_DIVISION[selectedDivision];
  const poleSchedule = POLE_TEST_SCHEDULE[selectedDivision];
  const [newTestTag, setNewTestTag] = useState<string>(poleSchedule.bciTag);

  React.useEffect(() => {
    setNewTestTag(poleSchedule.bciTag);
  }, [selectedDivision, poleSchedule.bciTag]);

  // Filter tests for the active division
  const divisionTests = tests.filter((t) => (t.division || 'industria') === selectedDivision);

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: PumpTestRecord = {
      id: `test-${selectedDivision}-${Date.now()}`,
      division: selectedDivision,
      weekLabel: `${newTestWeek} - ${formatDateBR(newTestDate)}`,
      date: newTestDate,
      time: newTestTime,
      location: currentStation.name,
      motorTags: newTestTag.trim() || currentStation.tag,
      preHeatingJacketWarmed: true,
      oilLevelNormal: true,
      coolantLevelNormal: true,
      oilFilterNormal: true,
      batteryCablesConnected: true,
      electrolyteDensityOk: true,
      batteryCablesCorrosionNormal: true,
      dieselRpm: Number(newTestDieselRpm),
      coolingWaterFlowNormal: true,
      packingSealNormal: true,
      abnormalVibration: false,
      dieselSystemInAutoAfterTest: true,
      jockeyNoiseLeak: false,
      jockeyStartPressureKgf: Number(newTestJockeyPress),
      jockeyStopPressureKgf: Number(newTestJockeyPress) + 1.0,
      jockeyAlarmTripped: false,
      jockeySystemInAutoAfterTest: true,
      panelLedsNormal: true,
      switchButtonFault: false,
      panelIdentifiedAndOperant: true,
      electricMotorHpApproved: true,
      independentElectricalConnection: true,
      extinguishersPresentAtStation: true,
      electricPanelIdentifiedAndOperant: true,
      electricPumpNoiseLeak: false,
      testedManualAndAuto: true,
      electricSystemInAutoAfterTest: true,
      dieselFuelLevelOk: true,
      dieselFuelTankLeak: false,
      dieselTankValveOpenLocked: true,
      waterTankLeak: false,
      waterTankFull: true,
      waterReservePercentage: Number(newTestRti),
      generatorFuelLevelPercentage: 100,
      brigadeLeaderName: newTestInspector,
      brigadeLeaderSignature: 'Assinatura Registrada',
      electricianName: newTestElectrician,
      electricianSignature: 'Assinatura Registrada',
      importantNotes: newTestNotes,
      recommendedMaintenance: 'Manter sistema em modo automático e checagem semanal contínua.',
    };

    if (onAddTest) {
      onAddTest(newRecord);
    }
    setIsNewTestModalOpen(false);
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  // Pre-configured 4 weeks of the month for visual calendar
  const calendarWeeks = [
    {
      weekNumber: 1,
      title: 'Semana 1',
      dateLabel: '04/09/2026',
      status: 'concluido',
      details: 'Teste de 30 min da Bomba Diesel e Partida por Despressurização da Jockey',
      inspector: 'Maria Ap. S. Guimarães',
      pressure: `${currentStation.nominalWorkingPressureKgf} kgf/cm²`,
    },
    {
      weekNumber: 2,
      title: 'Semana 2',
      dateLabel: '11/09/2026',
      status: 'concluido',
      details: 'Partida Elétrica Soft-Starter, Intertravamento e Nível de Tanque de Óleo Diesel',
      inspector: 'Maria Ap. S. Guimarães',
      pressure: `${currentStation.nominalWorkingPressureKgf} kgf/cm²`,
    },
    {
      weekNumber: 3,
      title: 'Semana 3',
      dateLabel: '18/09/2026',
      status: 'concluido',
      details: 'Vazão de Água do Radiador, Teste de Baterias 24V e Estanqueidade de Gaxetas',
      inspector: 'Maria Ap. S. Guimarães',
      pressure: `${currentStation.nominalWorkingPressureKgf} kgf/cm²`,
    },
    {
      weekNumber: 4,
      title: 'Semana 4',
      dateLabel: '25/09/2026',
      status: 'concluido',
      details: 'Simulação de Queda de Energia Geral, Teste Automático BCI Diesel e Alívio',
      inspector: 'Maria Ap. S. Guimarães',
      pressure: `${currentStation.nominalWorkingPressureKgf} kgf/cm²`,
    },
    {
      weekNumber: 5,
      title: 'Semana 5 (Próximo)',
      dateLabel: '02/10/2026',
      status: 'agendado',
      details: 'Rotina Semanal Programada: Verificação de pré-aquecedor, diesel e RTI',
      inspector: 'Equipe de SST / Bombeiro Civil',
      pressure: 'Aguardando Medição',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Calendar Header Card */}
      <div className="bg-white border border-[#007960]/20 p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0 shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Calendário Semanal de Testes das Casas de Bombas
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 uppercase">
                Teste Semanal Obrigatório
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                SST.RE-094
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Programação periódica de acionamento por despressurização, ensaios de bomba diesel, elétrica e jockey para cada polo industrial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrintSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir Calendário</span>
          </button>
          <button
            onClick={() => setIsNewTestModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Teste Semanal</span>
          </button>
        </div>
      </div>

      {/* Selector of 4 Industrial Poles (Indústria, Empacotamento, Posto de Combustível, ADM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectDivision('industria')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            selectedDivision === 'industria'
              ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              selectedDivision === 'industria'
                ? 'bg-[#007960] text-white border-[#007960]'
                : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
            }`}
          >
            <Factory className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs truncate">Polo Indústria</h3>
            <span className="text-[10px] text-[#007960] font-bold block">Toda Quarta-feira • 08:30h</span>
            <span className="text-[10px] text-slate-500 font-mono">TAG 108005 (RTI 500 m³)</span>
          </div>
        </button>

        <button
          onClick={() => onSelectDivision('empacotamento')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            selectedDivision === 'empacotamento'
              ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              selectedDivision === 'empacotamento'
                ? 'bg-[#007960] text-white border-[#007960]'
                : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
            }`}
          >
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs truncate">Polo Empacotamento</h3>
            <span className="text-[10px] text-[#007960] font-bold block">Toda Quinta-feira • 09:00h</span>
            <span className="text-[10px] text-slate-500 font-mono">TAG 208001 (RTI 250 m³)</span>
          </div>
        </button>

        <button
          onClick={() => onSelectDivision('posto_combustivel')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            selectedDivision === 'posto_combustivel'
              ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              selectedDivision === 'posto_combustivel'
                ? 'bg-[#007960] text-white border-[#007960]'
                : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
            }`}
          >
            <Fuel className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs truncate">Polo Posto Combustível</h3>
            <span className="text-[10px] text-[#007960] font-bold block">Toda Terça-feira • 14:00h</span>
            <span className="text-[10px] text-slate-500 font-mono">TAG 408001 (LGE 1.000 L)</span>
          </div>
        </button>

        <button
          onClick={() => onSelectDivision('adm')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            selectedDivision === 'adm'
              ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30 text-slate-900'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#007960]/40 hover:bg-[#f8faf9]'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              selectedDivision === 'adm'
                ? 'bg-[#007960] text-white border-[#007960]'
                : 'bg-emerald-50 text-[#007960] border-[#007960]/20'
            }`}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs truncate">Polo ADM / Agrícola</h3>
            <span className="text-[10px] text-[#007960] font-bold block">Toda Sexta-feira • 10:00h</span>
            <span className="text-[10px] text-slate-500 font-mono">TAG 308001 (GMA / Prédio)</span>
          </div>
        </button>
      </div>

      {/* Pole Information Banner */}
      <div className="bg-[#f8faf9] border border-[#007960]/25 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white border border-[#007960]/20 text-[#007960] shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase">Regime Oficial de Testes:</span>
              <span className="text-xs font-bold text-[#007960]">{poleSchedule.dayOfWeek} às {poleSchedule.standardTime}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              <strong>Equipe Responsável:</strong> {poleSchedule.responsibleTeam} • <strong>Duração Mínima:</strong> {poleSchedule.durationMinutes} minutos em rotação nominal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Conformidade Mês</span>
            <span className="text-sm font-bold text-[#007960]">100% OK</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">Semanas Registradas</span>
            <span className="text-sm font-bold text-slate-900">{divisionTests.length} testes</span>
          </div>
        </div>
      </div>

      {/* Visual Weekly Calendar Grid (Semana a Semana) */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#007960]" />
          <span>Cronograma Semanal do Mês — {currentStation.name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {calendarWeeks.map((week) => {
            const isCompleted = week.status === 'concluido';
            return (
              <div
                key={week.weekNumber}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-white border-[#007960]/30 shadow-xs hover:border-[#007960]'
                    : 'bg-emerald-50/30 border-dashed border-[#007960]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{week.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-50 text-[#007960] border border-[#007960]/30'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {isCompleted ? 'Concluído' : 'Programado'}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-[#007960] mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{week.dateLabel}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                    {week.details}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Pressão:</span>
                    <span className="font-bold text-slate-800">{week.pressure}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Inspetor:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[100px]">{week.inspector}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Table of Weekly Pump Tests */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#007960]" />
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Histórico Detalhado dos Testes Semanais Registrados ({divisionTests.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {currentStation.tag}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8faf9] text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Semana / Data</th>
                <th className="px-4 py-3">Polo Industrial</th>
                <th className="px-4 py-3">Bomba Diesel (30min)</th>
                <th className="px-4 py-3">Bomba Elétrica</th>
                <th className="px-4 py-3">Bomba Jockey</th>
                <th className="px-4 py-3">Reserva RTI</th>
                <th className="px-4 py-3">Inspetor Técnico</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {divisionTests.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono">
                    <span className="font-bold text-slate-900 block">{t.weekLabel}</span>
                    <span className="text-[10px] text-slate-500">{t.time}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <span className="block">{currentStation.shortName}</span>
                    <span className="text-[10px] font-mono text-[#007960] font-bold">{t.motorTags}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="text-[#007960] font-bold">{t.dieselRpm} RPM</span>
                    <span className="text-[10px] text-slate-500 block">Arrefecimento OK</span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="text-slate-800 font-bold">440V / Soft-Start</span>
                    <span className="text-[10px] text-[#007960] block">Modo Auto OK</span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="text-[#007960] font-bold">{t.jockeyStartPressureKgf} kgf/cm²</span>
                    <span className="text-[10px] text-slate-500 block">Parada: {t.jockeyStopPressureKgf} kgf</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[#007960]">
                    {t.waterReservePercentage}% ({currentStation.rtiCapacityM3} m³)
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="font-bold block">{t.brigadeLeaderName}</span>
                    <span className="text-[10px] text-slate-500">{t.electricianName}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 uppercase">
                      100% Aprovado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Teste Semanal */}
      {isNewTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f8faf9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registrar Teste Semanal — {currentStation.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conformidade semanal conforme procedimento SST.RE-094
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTestModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semana de Referência *</label>
                  <input
                    type="text"
                    value={newTestWeek}
                    onChange={(e) => setNewTestWeek(e.target.value)}
                    placeholder="Ex: Semana 5"
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Data da Realização *</label>
                  <input
                    type="date"
                    value={newTestDate}
                    onChange={(e) => setNewTestDate(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Horário do Teste *</label>
                  <input
                    type="text"
                    value={newTestTime}
                    onChange={(e) => setNewTestTime(e.target.value)}
                    placeholder="Ex: 08:30 h"
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">TAG (Bomba / Sistema) *</label>
                  <input
                    type="text"
                    value={newTestTag}
                    onChange={(e) => setNewTestTag(e.target.value)}
                    placeholder="Ex: TAG 108005 / 104001"
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-[#007960]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bombeiro / Inspetor Responsável *</label>
                  <input
                    type="text"
                    value={newTestInspector}
                    onChange={(e) => setNewTestInspector(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Eletricista de Apoio</label>
                  <input
                    type="text"
                    value={newTestElectrician}
                    onChange={(e) => setNewTestElectrician(e.target.value)}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs block">Parâmetros Medidos no Teste</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">RPM Motor Diesel</label>
                    <input
                      type="number"
                      value={newTestDieselRpm}
                      onChange={(e) => setNewTestDieselRpm(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Partida Jockey (kgf/cm²)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newTestJockeyPress}
                      onChange={(e) => setNewTestJockeyPress(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Reserva RTI (%)</label>
                    <input
                      type="number"
                      value={newTestRti}
                      onChange={(e) => setNewTestRti(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono font-bold text-[#007960]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Observações Técnicas do Teste</label>
                <textarea
                  rows={2}
                  value={newTestNotes}
                  onChange={(e) => setNewTestNotes(e.target.value)}
                  className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold shadow-xs"
                >
                  Salvar Registro de Teste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
