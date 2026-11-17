import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  Clock,
  UserCheck,
  X,
  FileCheck2,
  ExternalLink,
  Award,
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

export interface ChecklistCompletionData {
  protocol: string;
  systemName: string;
  docNumber: string;
  revision: string;
  unit: string;
  completedAt: string;
  inspectorName: string;
  inspectorRE?: string;
  signatureType?: 'facial' | 'digital' | 'biometric';
  signaturePreview?: string;
  totalItems: number;
  conformCount: number;
  nonConformCount: number;
  naCount: number;
  actionPlansCreated?: number;
  notes?: string;
  presentMembersCount?: number;
  absentMembersCount?: number;
  qrVerifiedCount?: number;
  manualFallbackCount?: number;
}

interface ChecklistCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChecklistCompletionData | null;
  onViewPdf?: () => void;
  onOpenPdfArchive?: () => void;
}

export const ChecklistCompletionModal: React.FC<ChecklistCompletionModalProps> = ({
  isOpen,
  onClose,
  data,
  onViewPdf,
  onOpenPdfArchive,
}) => {
  if (!isOpen || !data) return null;

  const hasNC = data.nonConformCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-[#007960] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Top Header with Celebration Badge */}
        <div className="bg-gradient-to-r from-[#007960] to-[#005a47] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#007960] flex items-center justify-center shrink-0 shadow-lg ring-4 ring-white/20">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white uppercase tracking-wider">
                  Checklist Finalizado
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-400 text-slate-950">
                  {data.protocol}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1">
                Inspeção Concluída e Registrada com Sucesso!
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Protocolo emitido e armazenado no repositório de segurança uisa.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Main Info Card */}
          <div className="bg-[#f8faf9] border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Sistema Inspecionado:</span>
                <span className="font-bold text-slate-900 text-xs">{data.systemName}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Unidade / Polo:</span>
                <span className="font-bold text-[#007960] text-xs">{data.unit}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Documento Oficial:</span>
                <span className="font-mono font-bold text-slate-800">
                  {data.docNumber} (Rev {data.revision})
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Data & Horário:</span>
                <span className="font-mono text-slate-800 font-semibold">{data.completedAt}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Inspetor Responsável:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#007960]" />
                  <span className="font-bold text-slate-900">{data.inspectorName}</span>
                  {data.inspectorRE && (
                    <span className="text-[10px] font-mono text-slate-500">({data.inspectorRE})</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Certificação Digital:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold text-emerald-700 text-[11px]">
                    {data.signatureType === 'facial'
                      ? 'Biometria Facial Autenticada'
                      : 'Assinatura Digital Válida'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Evaluation Card */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Estatísticas de Avaliação ({data.totalItems} Itens)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                100% Preenchido
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-[#007960] uppercase block">Conformes</span>
                <span className="text-lg font-black text-[#007960]">{data.conformCount}</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  data.nonConformCount > 0
                    ? 'bg-red-50 border-red-300 text-[#de2726]'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-bold uppercase block">Não Conformes</span>
                <span className="text-lg font-black">{data.nonConformCount}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-600">
                <span className="text-[10px] font-bold uppercase block">Não Aplicável</span>
                <span className="text-lg font-black">{data.naCount}</span>
              </div>
            </div>

            {/* Presença de Participantes se aplicável (Bombas) */}
            {data.presentMembersCount !== undefined && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Participantes do Teste Semanal:</span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-[#007960]">{data.presentMembersCount} Presentes</span>
                  {data.absentMembersCount ? (
                    <span className="text-amber-700">({data.absentMembersCount} Ausentes com Justificativa)</span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Auditoria de Leitura QR Code */}
            {(data.qrVerifiedCount !== undefined || data.manualFallbackCount !== undefined) && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Rastreabilidade por QR Code:</span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                    {data.qrVerifiedCount || 0} via QR Code
                  </span>
                  {(data.manualFallbackCount || 0) > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                      {data.manualFallbackCount} Manual (Erro Leitura QR)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Plans Alert */}
            {hasNC ? (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-900">
                <AlertTriangle className="w-4 h-4 text-[#de2726] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {data.actionPlansCreated || data.nonConformCount} Plano(s) de Ação Corretivo(s) Gerado(s) Automaticamente
                  </span>
                  <span className="text-[11px] text-red-700">
                    Encaminhado para a aba de Planos de Ação no Painel Geral com prazo de regularização técnica.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-[#007960] shrink-0" />
                <div>
                  <span className="font-bold">Sistema em Plena Conformidade Operacional</span>
                  <p className="text-[11px] text-emerald-700">Nenhuma irregularidade impeditiva constatada nesta inspeção.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Concluir e Fechar
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
            {onOpenPdfArchive && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPdfArchive();
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-colors shadow-2xs"
              >
                <FileCheck2 className="w-4 h-4 text-[#007960]" />
                <span>Repositório PDF</span>
              </button>
            )}

            {onViewPdf && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewPdf();
                }}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Visualizar / Baixar PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
