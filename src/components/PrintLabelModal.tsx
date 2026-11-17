import React from 'react';
import {
  X,
  Printer,
  Download,
  Flame,
} from 'lucide-react';
import {
  Extinguisher,
} from '../types/extinguisher';
import { formatDateBR, SECTOR_MAP, TYPE_MAP } from '../utils/formatters';
import { buildEquipmentQrPayload, generateQrDataUrl } from '../utils/qrCodeGenerator';
import { QrCodeSvg } from './QrCodeSvg';

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  extinguisher: Extinguisher | null;
  companyName: string;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({
  isOpen,
  onClose,
  extinguisher,
  companyName,
}) => {
  if (!isOpen || !extinguisher) return null;

  const typeInfo = TYPE_MAP[extinguisher.type] || { name: extinguisher.type, acro: extinguisher.type, fireClasses: '' };
  const sectorInfo = SECTOR_MAP[extinguisher.sector] || { name: extinguisher.sector };

  const qrPayload = buildEquipmentQrPayload('extintor', extinguisher.code);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQrPng = async () => {
    try {
      const url = await generateQrDataUrl(qrPayload, 400);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_Extintor_${extinguisher.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erro ao baixar QR PNG:', e);
    }
  };

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-white">
              Etiqueta Industrial & QR Code
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs shadow flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar QR (PNG)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Label View */}
        <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-950/40">
          <div
            id="printable-label"
            className="w-full max-w-md bg-white text-slate-900 border-2 border-red-600 rounded-xl p-5 shadow-2xl font-sans"
          >
            {/* Top Badge */}
            <div className="border-b-2 border-red-600 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-red-700 uppercase tracking-tight">
                    Ficha de Controle de Extintor
                  </h3>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">
                    {companyName} • SESMT / Brigada
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-red-100 text-red-800 font-mono font-bold px-2 py-0.5 rounded border border-red-300">
                  NBR 12962
                </span>
              </div>
            </div>

            {/* Tag & QR Code Row */}
            <div className="py-3 flex items-center justify-between border-b border-slate-200 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Identificação / Tag:</span>
                <span className="text-2xl font-black font-mono text-slate-900 tracking-wider">
                  {extinguisher.code}
                </span>
                <div className="mt-1 text-[11px] font-semibold text-red-600">
                  {typeInfo.name} ({extinguisher.capacityWeight})
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Série: {extinguisher.serialNumber} | INMETRO: {extinguisher.inmetroSeal}
                </div>
              </div>

              {/* QR Code SVG rendering */}
              <div className="p-2 bg-white border border-slate-300 rounded-lg shrink-0 shadow-sm text-center">
                <QrCodeSvg value={qrPayload} className="w-20 h-20" />
                <span className="text-[8px] font-mono font-bold text-slate-600 block mt-0.5">
                  {qrPayload}
                </span>
              </div>
            </div>

            {/* Sector & Details */}
            <div className="py-2.5 border-b border-slate-200 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500 font-medium">Setor de Instalação:</span>
                <strong className="text-slate-900">{sectorInfo.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Localização Específica:</span>
                <span className="text-slate-800 font-semibold">{extinguisher.locationDetails}</span>
              </div>
            </div>

            {/* Expiry Dates Highlight Box */}
            <div className="my-3 grid grid-cols-2 gap-2 bg-red-50 p-3 rounded-lg border border-red-200 text-center font-mono">
              <div className="border-r border-red-200 pr-2">
                <span className="text-[9px] uppercase font-bold text-red-700 block font-sans">
                  Validade da Recarga
                </span>
                <strong className="text-base text-red-600 font-extrabold block">
                  {formatDateBR(extinguisher.rechargeExpiryDate)}
                </strong>
                <span className="text-[9px] text-slate-500 font-sans block">
                  Recarregado em: {formatDateBR(extinguisher.rechargeDate)}
                </span>
              </div>

              <div className="pl-2">
                <span className="text-[9px] uppercase font-bold text-slate-700 block font-sans">
                  Reteste Hidrostático (5 Anos)
                </span>
                <strong className="text-base text-slate-800 font-extrabold block">
                  {formatDateBR(extinguisher.hydrostaticExpiryDate)}
                </strong>
                <span className="text-[9px] text-slate-500 font-sans block">
                  Último: {formatDateBR(extinguisher.hydrostaticTestDate)}
                </span>
              </div>
            </div>

            {/* Monthly Inspection Stamp Grid */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                Controle de Inspeção Mensal (Visto / Data):
              </span>
              <div className="grid grid-cols-6 gap-1 text-center font-mono text-[9px]">
                {months.map((m) => (
                  <div key={m} className="border border-slate-300 rounded p-1">
                    <span className="font-bold text-slate-700 block">{m}</span>
                    <div className="h-4 border-t border-slate-200 mt-0.5"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
              <span>Norma Regulamentadora NR-23</span>
              <span>Proibido obstruir acesso ao extintor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
