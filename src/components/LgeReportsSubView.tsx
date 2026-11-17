import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  Beaker,
  Award,
  Download,
  Filter,
} from 'lucide-react';
import { LgeTestReport } from '../types/lge';
import { INITIAL_LGE_REPORTS } from '../data/lgeData';
import { formatDateBR } from '../utils/formatters';

interface LgeReportsSubViewProps {
  onPrintReport?: (report: LgeTestReport) => void;
}

export const LgeReportsSubView: React.FC<LgeReportsSubViewProps> = () => {
  const [selectedUnit, setSelectedUnit] = useState<string>('todas');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const reports = INITIAL_LGE_REPORTS;

  const filteredReports = reports.filter((r) => {
    if (selectedUnit === 'todas') return true;
    return r.unit === selectedUnit;
  });

  // Calculate days remaining to next lab test (15/06/2027)
  const nextTestDate = new Date('2027-06-15T00:00:00');
  const now = new Date();
  const diffDays = Math.ceil((nextTestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner: LGE Laboratory Compliance Overview */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0 shadow-xs">
            <Beaker className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Laudos Oficiais de Ensaio de LGE (Líquido Gerador de Espuma)
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30">
                ABNT NBR 15511:2023
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Acreditação CRL 0576 (ISO/IEC 17025)
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Controle laboratorial de qualidade e eficácia extintora do LGE para tanques e canhões monitores de combate a incêndio em combustíveis líquidos.
              Laboratório responsável: <strong>FIREMETRIA CONSULTORIA E ENSAIOS LTDA (Valinhos/SP)</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#007960]" />
            <span>Imprimir Laudos LGE</span>
          </button>
        </div>
      </div>

      {/* Lembrete Oficial do Próximo Teste Laboratorial */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-[#007960]/40 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#007960] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#007960] uppercase tracking-wider block">
                Cronograma de Testes Periódicos Obrigatórios (Item 7 — NBR 15511)
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Próximo Ensaio Laboratorial de LGE:{' '}
                <span className="text-[#007960] font-mono font-black text-base">
                  15/06/2027
                </span>{' '}
                <span className="text-xs font-normal text-slate-600">
                  (Periodicidade de 12 meses — Fogo válido até 15/06/2029)
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Válido para as 3 unidades operacionais: <strong>Indústria (Etanol)</strong>,{' '}
                <strong>Posto de Combustível</strong> e <strong>Empacotamento</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/80 px-4 py-2.5 rounded-xl border border-[#007960]/20">
            <Clock className="w-4 h-4 text-[#007960]" />
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 font-mono">
                {diffDays > 0 ? `${diffDays} dias restantes` : 'Data limite atingida'}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">
                Status Atual: Vigente / Aprovado
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Selector Filter */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#007960]/20 shadow-2xs print:hidden">
        <span className="text-xs font-bold text-slate-500 uppercase px-3 font-mono">
          Filtrar por Unidade:
        </span>
        <button
          onClick={() => setSelectedUnit('todas')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedUnit === 'todas'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          Todas as Unidades ({reports.length})
        </button>
        <button
          onClick={() => setSelectedUnit('INDUSTRIA')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedUnit === 'INDUSTRIA'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          Indústria (Carregamento de Etanol)
        </button>
        <button
          onClick={() => setSelectedUnit('POSTO DE COMBUSTIVEL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedUnit === 'POSTO DE COMBUSTIVEL'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          Posto de Combustível
        </button>
        <button
          onClick={() => setSelectedUnit('EMPACOTAMENTO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedUnit === 'EMPACOTAMENTO'
              ? 'bg-[#007960] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
          }`}
        >
          Empacotamento
        </button>
      </div>

      {/* Reports Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const isExpanded = expandedReportId === report.id;
          return (
            <div
              key={report.id}
              className="bg-white border-2 border-slate-200 hover:border-[#007960] rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header of Report Card */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                      {report.unitLabel}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Relatório de Ensaio Nº {report.reportNumber}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-[#007960] border border-[#007960]/30 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>APROVADO</span>
                  </span>
                </div>

                {/* Storage & Product Specs */}
                <div className="bg-[#f8faf9] p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tipo de LGE:</span>
                    <span className="font-bold text-slate-900">{report.foamType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fabricante:</span>
                    <span className="font-semibold text-slate-800">{report.manufacturer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lote:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {report.batchNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Armazenamento:</span>
                    <span className="font-semibold text-slate-800">{report.storageType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dosagem de Uso:</span>
                    <span className="font-bold text-[#007960]">{report.dosageClass}</span>
                  </div>
                </div>

                {/* Dates & Validity */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Data de Coleta:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDateBR(report.collectionDate)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Emissão do Relatório:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDateBR(report.emissionDate)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                    <span className="text-emerald-900 font-bold">Validade Laboratorial (12m):</span>
                    <span className="font-mono font-black text-[#007960]">{formatDateBR(report.labExpiryDate)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-700 font-medium">Validade Ensaio Fogo (36m):</span>
                    <span className="font-mono font-bold text-slate-800">{formatDateBR(report.fireTestExpiryDate)}</span>
                  </div>
                </div>

                {/* Key Laboratory Test Results */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                    Parâmetros Físico-Químicos (ABNT NBR 15511 Anexo D):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">Massa Específica:</span>
                      <strong className="text-slate-900">{report.physicalChemicalResults.specificMass.result} kg/m³</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">pH:</span>
                      <strong className="text-slate-900">{report.physicalChemicalResults.pH.result}</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">Índice Refração:</span>
                      <strong className="text-slate-900">{report.physicalChemicalResults.refractiveIndex.result}</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">Expansão / Drenagem:</span>
                      <strong className="text-slate-900">
                        {report.physicalChemicalResults.expansion.result} / {report.physicalChemicalResults.drainageTime25s.result}s
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Open Official PDF */}
              <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                <a
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Visualizar Laudo Oficial PDF</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
