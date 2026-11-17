import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  AppSettings,
  Extinguisher,
} from '../types/extinguisher';
import {
  computeExtinguisherStatus,
  formatDateBR,
  SECTOR_MAP,
  TYPE_MAP,
} from '../utils/formatters';

interface InspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  extinguishers: Extinguisher[];
  settings: AppSettings;
}

export const InspectionReportModal: React.FC<InspectionReportModalProps> = ({
  isOpen,
  onClose,
  extinguishers,
  settings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const expiredCount = extinguishers.filter(
    (e) => computeExtinguisherStatus(e).status === 'vencido'
  ).length;

  const compliancePercent = Math.round(
    ((extinguishers.length - expiredCount) / extinguishers.length) * 100
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-white">
              Relatório Completo de Conformidade de Extintores
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable View */}
        <div className="p-6 overflow-y-auto bg-slate-950/40">
          <div className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-6 shadow-xl font-sans text-xs space-y-4">
            {/* Header */}
            <div className="border-b-2 border-red-600 pb-3 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-red-700 uppercase">
                  Relatório Geral de Gestão de Extintores de Incêndio
                </h1>
                <p className="text-xs text-slate-700 font-bold">
                  {settings.companyName} • {settings.industrialPlantName}
                </p>
                <p className="text-[11px] text-slate-500">
                  Normas de Referência: NR-23 (Proteção Contra Incêndios) e ABNT NBR 12962 / NBR 12693
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded">
                  Índice de Conformidade: {compliancePercent}%
                </span>
                <div className="text-[11px] text-slate-500 mt-1">
                  Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Inventory table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-1.5 border border-slate-300">Tag / Código</th>
                    <th className="p-1.5 border border-slate-300">Setor</th>
                    <th className="p-1.5 border border-slate-300">Local Instalado</th>
                    <th className="p-1.5 border border-slate-300">Tipo</th>
                    <th className="p-1.5 border border-slate-300">Carga</th>
                    <th className="p-1.5 border border-slate-300">Venc. Recarga</th>
                    <th className="p-1.5 border border-slate-300">Reteste 5a</th>
                    <th className="p-1.5 border border-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {extinguishers.map((ext) => {
                    const st = computeExtinguisherStatus(ext);
                    return (
                      <tr key={ext.id} className="border-b border-slate-200">
                        <td className="p-1.5 border border-slate-300 font-mono font-bold">{ext.code}</td>
                        <td className="p-1.5 border border-slate-300">{SECTOR_MAP[ext.sector]?.shortName}</td>
                        <td className="p-1.5 border border-slate-300 max-w-xs truncate">{ext.locationDetails}</td>
                        <td className="p-1.5 border border-slate-300">{TYPE_MAP[ext.type]?.acro}</td>
                        <td className="p-1.5 border border-slate-300 font-mono">{ext.capacityWeight}</td>
                        <td className="p-1.5 border border-slate-300 font-mono font-semibold">
                          {formatDateBR(ext.rechargeExpiryDate)}
                        </td>
                        <td className="p-1.5 border border-slate-300 font-mono">
                          {formatDateBR(ext.hydrostaticExpiryDate)}
                        </td>
                        <td className="p-1.5 border border-slate-300 font-semibold">
                          {st.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
              <span>Total auditado: {extinguishers.length} extintores cadastrados</span>
              <span>Responsável Técnico SESMT: _________________________________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
