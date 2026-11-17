import React from 'react';
import { FileText, Download, Eye, X, ShieldCheck } from 'lucide-react';

export const SST_RE086_PDF_PATH =
  '/assets/aistudio/SST.RE-086_Ata_Reuni_o_Brigada_de_Inc_ndio__1__cf9678e2.pdf';

interface SstRe086ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SstRe086ReferenceModal: React.FC<SstRe086ReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in print:hidden">
      <div className="bg-white border-2 border-[#007960] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[88vh]">
        <div className="bg-[#007960] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white text-[#007960] font-mono text-[10px] font-black uppercase">
                  Doc.: SST.RE-086
                </span>
                <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono text-[10px] font-bold">
                  Rev. 01 • 13/02/2026
                </span>
              </div>
              <h3 className="text-sm font-black mt-0.5">
                Formulário Oficial de Referência — Ata de Reunião Brigada de Incêndio
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={SST_RE086_PDF_PATH}
              download="SST.RE-086_Ata_Reuniao_Brigada_de_Incendio.pdf"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#007960] hover:bg-emerald-50 text-xs font-black transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF SST.RE-086</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
              title="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-[#f8faf9] px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#007960]" />
            <span>
              Referência padrão UISA para todas as unidades (<strong>Indústria</strong>,{' '}
              <strong>Empacotamento</strong> e <strong>ADM/GMA</strong>) — Guanabara Agrícola LTDA
            </span>
          </div>
          <span className="font-mono text-slate-500">Pág.: 1 / 1</span>
        </div>

        <div className="flex-1 bg-slate-100 p-2">
          <iframe
            src={SST_RE086_PDF_PATH}
            title="SST.RE-086 - Ata de Reunião Brigada de Incêndio"
            className="w-full h-full rounded-xl border border-slate-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
};

interface SstRe086ReferenceBannerProps {
  unitLabel?: string;
  onOpenViewer: () => void;
}

export const SstRe086ReferenceBanner: React.FC<SstRe086ReferenceBannerProps> = ({
  unitLabel,
  onOpenViewer,
}) => {
  return (
    <div className="bg-emerald-50/70 border border-[#007960]/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#007960]/30 text-[#007960] flex items-center justify-center shrink-0 shadow-2xs">
          <FileText className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-[#007960] text-white font-mono text-[10px] font-bold uppercase">
              Ref. SST.RE-086
            </span>
            <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[10px] font-bold">
              Revisão 01 • 13/02/2026
            </span>
            {unitLabel && (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#007960] font-mono text-[10px] font-bold uppercase">
                {unitLabel}
              </span>
            )}
          </div>
          <p className="font-bold text-slate-900 mt-1">
            Documento de Referência: Ata de Reunião Brigada de Incêndio (SST.RE-086)
          </p>
          <p className="text-[11px] text-slate-600">
            Padrão oficial UISA aplicado a todas as unidades (Reunião Ordinária Nº, Local, Data, Horário, Convocados e Relato da Reunião).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenViewer}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Visualizar SST.RE-086</span>
        </button>

        <a
          href={SST_RE086_PDF_PATH}
          download="SST.RE-086_Ata_Reuniao_Brigada_de_Incendio.pdf"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#007960]" />
          <span>Baixar PDF</span>
        </a>
      </div>
    </div>
  );
};
