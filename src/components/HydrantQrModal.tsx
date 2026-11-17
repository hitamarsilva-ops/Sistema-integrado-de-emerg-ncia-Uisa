import React from 'react';
import { X, Printer, Download, Droplets } from 'lucide-react';
import { Hydrant } from '../types/hydrant';
import { QrCodeSvg } from './QrCodeSvg';
import { buildEquipmentQrPayload, generateQrDataUrl } from '../utils/qrCodeGenerator';
import { formatDateBR } from '../utils/formatters';

interface HydrantQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  hydrant: Hydrant | null;
}

export const HydrantQrModal: React.FC<HydrantQrModalProps> = ({
  isOpen,
  onClose,
  hydrant,
}) => {
  if (!isOpen || !hydrant) return null;

  const qrPayload = buildEquipmentQrPayload('hidrante', hydrant.code);

  const handleDownloadPng = async () => {
    try {
      const dataUrl = await generateQrDataUrl(qrPayload, 400);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `QR_Hidrante_${hydrant.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erro ao gerar PNG do QR Code:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border-2 border-[#007960]/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-[#f8faf9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#007960]" />
            <h2 className="text-sm font-bold text-slate-900">
              Etiqueta QR Code • Hidrante {hydrant.code}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge */}
        <div className="p-5 bg-slate-100 flex items-center justify-center">
          <div className="w-full bg-white border-2 border-[#007960] rounded-xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#007960] block">
                  UISA • Controle de Hidrante
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {hydrant.code}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                NBR 13714
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 text-xs flex-1">
                <p className="font-bold text-slate-800">{hydrant.locationDetails}</p>
                {hydrant.cabinetNumber && (
                  <p className="text-[11px] font-mono text-[#007960] font-bold">
                    Abrigo: {hydrant.cabinetNumber}
                  </p>
                )}
                <p className="text-[11px] text-slate-600">
                  Mangueiras: {hydrant.hoseCount}x {hydrant.hoseLengthMeters}m ({hydrant.hoseDiameterInches})
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Teste NBR 12779: {formatDateBR(hydrant.hoseNextHydrostaticTest)}
                </p>
              </div>

              <div className="p-2 bg-white border border-slate-300 rounded-xl shrink-0 text-center shadow-2xs">
                <QrCodeSvg value={qrPayload} className="w-24 h-24" />
                <span className="text-[8px] font-mono font-bold text-slate-600 block mt-1">
                  {qrPayload}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007960] border border-[#007960]/30 text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar QR (PNG)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Etiqueta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
