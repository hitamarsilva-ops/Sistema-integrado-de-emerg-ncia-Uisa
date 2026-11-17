import React from 'react';
import { FileText, Download, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { DrillScheduleDocument } from '../types/pae';
import { PAE_DRILL_DOCUMENTS, PAE_RASE_DOCUMENT } from '../data/paeData';

interface PaeDrillPdfModalProps {
  isOpen: boolean;
  document: DrillScheduleDocument | null;
  onSelectDocument: (doc: DrillScheduleDocument) => void;
  onClose: () => void;
}

export const PaeDrillPdfModal: React.FC<PaeDrillPdfModalProps> = ({
  isOpen,
  document: activeDoc,
  onSelectDocument,
  onClose,
}) => {
  if (!isOpen || !activeDoc) return null;

  const allDocs = [...PAE_DRILL_DOCUMENTS, PAE_RASE_DOCUMENT];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs print:hidden">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-[#007960] text-white px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-100">
                <span className="font-bold text-white">{activeDoc.code}</span>
                <span aria-hidden="true">·</span>
                <span>Rev. {activeDoc.revision}</span>
                <span aria-hidden="true">·</span>
                <span>{activeDoc.date}</span>
                <span aria-hidden="true">·</span>
                <span>Pág. {activeDoc.pages}</span>
              </div>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">
                {activeDoc.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={activeDoc.pdfAssetPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors min-h-[40px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Aba</span>
            </a>

            <a
              href={activeDoc.pdfAssetPath}
              download={`${activeDoc.code}_${activeDoc.code === 'SST.RE-085' ? 'RASE_Relatorio_Analise_Emergencia' : 'Cronograma_Simulados'}.pdf`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-[#007960] hover:bg-emerald-50 text-xs font-bold transition-colors min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Switcher Bar */}
        <div className="bg-[#f8faf9] px-4 sm:px-5 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg self-start">
            {allDocs.map((doc) => {
              const isSelected = doc.code === activeDoc.code;
              return (
                <button
                  key={doc.code}
                  type="button"
                  onClick={() => onSelectDocument(doc)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                    isSelected
                      ? 'bg-white text-[#007960] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {doc.code} ·{' '}
                  {doc.code === 'SST.RE-105'
                    ? 'Indústria / Empacot.'
                    : doc.code === 'SST.RE-104'
                    ? 'GMA / Posto / ADM / Agrícola'
                    : 'RASE Análise Emergências'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#007960] shrink-0" />
            <span>Documento Oficial UISA · Vinculado ao PAE (SST.NP-022)</span>
          </div>
        </div>

        {/* Embedded PDF */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-3">
          <iframe
            src={activeDoc.pdfAssetPath}
            title={`${activeDoc.code} — ${activeDoc.title}`}
            className="w-full h-full rounded-xl border border-slate-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
