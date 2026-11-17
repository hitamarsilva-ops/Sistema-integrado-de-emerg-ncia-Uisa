import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  ShieldAlert,
  FileText,
  User,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Extinguisher } from '../types/extinguisher';
import { SECTOR_MAP, TYPE_MAP, formatDateBR } from '../utils/formatters';

export interface ExtinguisherDeletionRecord {
  id: string;
  extinguisherId: string;
  code: string;
  sector: string;
  type: string;
  capacityWeight: string;
  serialNumber: string;
  reasonCategory: string;
  reasonDescription: string;
  responsible: string;
  deletedAt: string;
}

interface DeleteExtinguisherModalProps {
  extinguisher: Extinguisher | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (id: string, reasonCategory: string, reasonDescription: string, responsible: string) => void;
}

export const DELETE_REASONS = [
  'Cilindro Condenado em Ensaio Hidrostático (ABNT NBR 12962)',
  'Corrosão Acentuada / Deformação Estrutural no Casco',
  'Avaria Mecânica em Rosca / Válvula de Descarga Irreparável',
  'Extravio ou Perda em Área Operacional',
  'Descarte Técnico por Término de Vida Útil Recomendada',
  'Readequação de Carga de Incêndio / Ponto Desativado',
  'Outro Motivo Técnico Operacional',
];

export const DeleteExtinguisherModal: React.FC<DeleteExtinguisherModalProps> = ({
  extinguisher,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [reasonCategory, setReasonCategory] = useState(DELETE_REASONS[0]);
  const [reasonDescription, setReasonDescription] = useState('');
  const [responsible, setResponsible] = useState('Brigada de Emergência / Técnico SST');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!isOpen || !extinguisher) return null;

  const isDescriptionValid = reasonDescription.trim().length >= 8;
  const isResponsibleValid = responsible.trim().length >= 3;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!isDescriptionValid || !isResponsibleValid) {
      return;
    }

    onConfirmDelete(extinguisher.id, reasonCategory, reasonDescription.trim(), responsible.trim());
    onClose();
    setReasonDescription('');
    setHasSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#de2726] text-white flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Excluir Extintor com Justificativa Obrigatória</h3>
              <p className="text-[11px] text-red-700">Norma de Rastreabilidade e Auditoria de Segurança SST</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-red-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4 text-xs">
          {/* Card Resumo do Extintor */}
          <div className="bg-[#f8faf9] border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-[#007960]">{extinguisher.code}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Série: {extinguisher.serialNumber || 'S/N'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">TIPO / AGENTE:</span>
                <strong>{TYPE_MAP[extinguisher.type]?.name || extinguisher.type} ({extinguisher.capacityWeight})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SETOR / LOCAL:</span>
                <strong className="truncate block">{SECTOR_MAP[extinguisher.sector]?.name || extinguisher.sector}</strong>
              </div>
            </div>
          </div>

          {/* Seleção do Motivo */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              MOTIVO DA EXCLUSÃO: *
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#de2726]"
            >
              {DELETE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição Detalhada Obrigatória */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              DESCRIÇÃO DETALHADA DO MOTIVO DA EXCLUSÃO (OBRIGATÓRIO): *
            </label>
            <textarea
              rows={3}
              value={reasonDescription}
              onChange={(e) => setReasonDescription(e.target.value)}
              required
              placeholder="Descreva detalhadamente o parecer técnico, ensaio, avaria ou laudo que fundamenta a exclusão deste extintor do inventário..."
              className={`w-full bg-[#f8faf9] border rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-1 ${
                hasSubmitted && !isDescriptionValid
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-[#de2726] focus:ring-[#de2726]'
              }`}
            />
            {hasSubmitted && !isDescriptionValid && (
              <p className="text-[10px] text-red-600 font-bold mt-1">
                A descrição detalhada do motivo é obrigatória (mínimo de 8 caracteres).
              </p>
            )}
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              RESPONSÁVEL PELA BAIXA / EXCLUSÃO: *
            </label>
            <input
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              required
              placeholder="Nome e cargo do responsável..."
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#de2726]"
            />
          </div>

          {/* Warning */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Esta ação removerá o extintor do inventário operacional ativo e registrará o motivo no histórico de auditoria para fins de fiscalização e controle da Brigada.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isDescriptionValid || !isResponsibleValid}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold transition-all shadow-xs ${
                isDescriptionValid && isResponsibleValid
                  ? 'bg-[#de2726] hover:bg-red-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirmar Exclusão com Motivo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
