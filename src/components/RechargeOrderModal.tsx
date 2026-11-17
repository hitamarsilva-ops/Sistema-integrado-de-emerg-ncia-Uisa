import React from 'react';
import {
  X,
  Printer,
  Truck,
  Flame,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  AppSettings,
  Extinguisher,
} from '../types/extinguisher';
import { formatDateBR, SECTOR_MAP, TYPE_MAP } from '../utils/formatters';

interface RechargeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rechargeUnits: Extinguisher[];
  settings: AppSettings;
}

export const RechargeOrderModal: React.FC<RechargeOrderModalProps> = ({
  isOpen,
  onClose,
  rechargeUnits,
  settings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderNumber = `OS-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Guia de Remessa e Coleta para Recarga Externa
              </h2>
              <p className="text-xs text-slate-400">
                Documento oficial de saída de cilindros para empresa de manutenção credenciada (NBR 12962).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ordem de Serviço</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Order Document */}
        <div className="p-6 overflow-y-auto bg-slate-950/40">
          <div
            id="printable-order"
            className="w-full bg-white text-slate-900 border-2 border-slate-300 rounded-xl p-6 shadow-xl font-sans text-xs space-y-4"
          >
            {/* Header info */}
            <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-slate-900 uppercase">
                  Ordem de Coleta / Recarga de Extintores
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  {settings.companyName} - {settings.industrialPlantName}
                </p>
                <p className="text-[11px] text-slate-500">
                  Departamento de Segurança e Saúde Ocupacional (SESMT)
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs bg-slate-900 text-white font-bold px-2.5 py-1 rounded">
                  {orderNumber}
                </span>
                <div className="text-[11px] text-slate-600 mt-1">
                  Data: {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Instruction description */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700">
              Autorizamos a retirada dos extintores relacionados abaixo para execução de serviços de
              <strong> Manutenção de 2º Nível (Recarga anual)</strong> e/ou
              <strong> Manutenção de 3º Nível (Teste Hidrostático quinquenal)</strong>, conforme NBR 12962 / Portaria INMETRO.
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border border-slate-300">Item</th>
                    <th className="p-2 border border-slate-300">Tag / Código</th>
                    <th className="p-2 border border-slate-300">Tipo de Agente</th>
                    <th className="p-2 border border-slate-300">Carga / Peso</th>
                    <th className="p-2 border border-slate-300">Nº Série / Selo</th>
                    <th className="p-2 border border-slate-300">Motivo da Recarga</th>
                  </tr>
                </thead>
                <tbody>
                  {rechargeUnits.map((ext, idx) => (
                    <tr key={ext.id} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 font-mono text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold">{ext.code}</td>
                      <td className="p-2 border border-slate-300">{TYPE_MAP[ext.type]?.name}</td>
                      <td className="p-2 border border-slate-300 font-mono font-semibold">{ext.capacityWeight}</td>
                      <td className="p-2 border border-slate-300 font-mono text-[10px]">
                        {ext.serialNumber} / {ext.inmetroSeal}
                      </td>
                      <td className="p-2 border border-slate-300 text-[11px] text-rose-700 font-medium">
                        {ext.notes || 'Validade de recarga expirada / Coleta de quarentena'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right font-bold text-slate-800">
              Total de cilindros a serem recarregados: {rechargeUnits.length} unidade(s)
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                  Técnico de Segurança / Responsável SESMT
                </div>
                <span className="text-[10px] text-slate-500">{settings.companyName}</span>
              </div>

              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                  Motorista / Empresa Credenciada de Recarga
                </div>
                <span className="text-[10px] text-slate-500">Nome Legível e RG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
