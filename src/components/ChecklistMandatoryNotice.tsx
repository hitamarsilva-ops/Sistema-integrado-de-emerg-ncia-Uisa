import React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react';

interface ChecklistMandatoryNoticeProps {
  totalItems: number;
  answeredItems: number;
  hasAttemptedSubmit?: boolean;
  theme?: 'light' | 'dark';
  itemLabel?: string;
  pendingLabels?: string[];
}

export const ChecklistMandatoryNotice: React.FC<ChecklistMandatoryNoticeProps> = ({
  totalItems,
  answeredItems,
  hasAttemptedSubmit = false,
  theme = 'light',
  itemLabel = 'itens do checklist',
  pendingLabels,
}) => {
  if (totalItems <= 0) return null;

  const remaining = Math.max(0, totalItems - answeredItems);
  const allAnswered = remaining === 0;
  const isErrorState = hasAttemptedSubmit && !allAnswered;

  if (theme === 'dark') {
    return (
      <div
        className={`rounded-xl border p-3 text-xs transition-all ${
          allAnswered
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : isErrorState
            ? 'bg-red-950/60 border-red-500 text-red-200 ring-1 ring-red-500/70'
            : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            {allAnswered ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isErrorState ? 'text-red-400' : 'text-amber-400'
                }`}
              />
            )}
            <div>
              <span className="font-bold block">
                {allAnswered
                  ? `Todos os ${totalItems} ${itemLabel} foram flegados`
                  : isErrorState
                  ? `Obrigatório flegar todos os itens! Ainda faltam ${remaining} de ${totalItems}.`
                  : `Aviso Obrigatório: Flegue todos os ${totalItems} ${itemLabel}`}
              </span>
              {!allAnswered && (
                <span className="text-[11px] opacity-90 block mt-0.5">
                  É obrigatório marcar <strong>C</strong> (Conforme), <strong>NC</strong> (Não Conforme) ou{' '}
                  <strong>N/A</strong> em todos os itens para finalizar o checklist.
                </span>
              )}
              {isErrorState && pendingLabels && pendingLabels.length > 0 && (
                <span className="text-[11px] text-red-300 font-semibold block mt-1">
                  Pendentes: {pendingLabels.slice(0, 5).join(', ')}
                  {pendingLabels.length > 5 ? ` (+${pendingLabels.length - 5})` : ''}
                </span>
              )}
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border shrink-0 ${
              allAnswered
                ? 'bg-emerald-900/70 border-emerald-500/40 text-emerald-200'
                : isErrorState
                ? 'bg-red-900/70 border-red-400 text-red-100'
                : 'bg-amber-900/60 border-amber-500/40 text-amber-100'
            }`}
          >
            {answeredItems}/{totalItems} flegados
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3.5 text-xs transition-all ${
        allAnswered
          ? 'bg-emerald-50 border-[#007960]/40 text-[#007960]'
          : isErrorState
          ? 'bg-red-50 border-red-400 text-[#de2726] ring-1 ring-red-300'
          : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          {allAnswered ? (
            <CheckCircle2 className="w-4 h-4 text-[#007960] shrink-0 mt-0.5" />
          ) : isErrorState ? (
            <AlertTriangle className="w-4 h-4 text-[#de2726] shrink-0 mt-0.5" />
          ) : (
            <ClipboardCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block">
              {allAnswered
                ? `Checklist completo: todos os ${totalItems} ${itemLabel} foram flegados`
                : isErrorState
                ? `Bloqueio de Finalização: é obrigatório flegar todos os ${totalItems} ${itemLabel} (faltam ${remaining})`
                : `Preenchimento Obrigatório: é necessário flegar todos os ${totalItems} ${itemLabel}`}
            </span>
            {!allAnswered && (
              <span className="text-[11px] opacity-90 block mt-0.5">
                Marque obrigatoriamente uma das opções (<strong>C</strong>, <strong>NC</strong> ou{' '}
                <strong>N/A</strong>) em cada item antes de concluir e salvar.
              </span>
            )}
            {isErrorState && pendingLabels && pendingLabels.length > 0 && (
              <span className="text-[11px] font-bold block mt-1">
                Itens pendentes: {pendingLabels.slice(0, 6).join(', ')}
                {pendingLabels.length > 6 ? ` e mais ${pendingLabels.length - 6}` : ''}
              </span>
            )}
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border shrink-0 ${
            allAnswered
              ? 'bg-white text-[#007960] border-[#007960]/30'
              : isErrorState
              ? 'bg-white text-[#de2726] border-red-300'
              : 'bg-white text-amber-800 border-amber-300'
          }`}
        >
          {answeredItems}/{totalItems} flegados
        </span>
      </div>
    </div>
  );
};
