import { DRILL_FISCAL_MONTHS } from '../data/paeData';
import {
  DrillFiscalMonth,
  DrillMonthExecution,
  DrillScheduleItem,
} from '../types/pae';

export type DrillOccurrenceStatus =
  | 'realizado'
  | 'este_mes'
  | 'pendente'
  | 'proximo'
  | 'futuro';

export interface DrillOccurrence {
  occurrenceKey: string; // `${item.id}__${monthKey}`
  item: DrillScheduleItem;
  monthKey: string;
  monthInfo: DrillFiscalMonth;
  execution?: DrillMonthExecution;
  status: DrillOccurrenceStatus;
  daysUntilTarget: number;
  targetDateISO: string;
}

export function getCurrentYearMonth(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthEndISO(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yStr}-${mStr}-${String(lastDay).padStart(2, '0')}`;
}

export function getMonthStartISO(monthKey: string): string {
  return `${monthKey}-01`;
}

export function getDrillMonthInfo(monthKey: string): DrillFiscalMonth {
  return (
    DRILL_FISCAL_MONTHS.find((m) => m.key === monthKey) || {
      key: monthKey,
      letter: monthKey.slice(5, 7),
      shortLabel: monthKey,
      fullLabel: monthKey,
    }
  );
}

export function computeDrillOccurrences(
  schedule: DrillScheduleItem[],
  leadDays: number = 30,
  now: Date = new Date()
): DrillOccurrence[] {
  const currentMonthKey = getCurrentYearMonth(now);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;

  const occurrences: DrillOccurrence[] = [];

  schedule.forEach((item) => {
    item.plannedMonths.forEach((monthKey) => {
      const execution = item.executions?.[monthKey];
      const monthInfo = getDrillMonthInfo(monthKey);
      const completed = Boolean(execution?.completed);

      // Reference date for countdown: exact plannedDate if set, else end of current month / start of future month
      const targetDateISO =
        execution?.plannedDate ||
        (monthKey <= currentMonthKey ? getMonthEndISO(monthKey) : getMonthStartISO(monthKey));

      const [ty, tm, td] = targetDateISO.split('-').map(Number);
      const targetMs = new Date(ty, tm - 1, td).getTime();
      const daysUntilTarget = Math.ceil((targetMs - todayStart) / msPerDay);

      let status: DrillOccurrenceStatus = 'futuro';
      if (completed) {
        status = 'realizado';
      } else if (execution?.plannedDate && daysUntilTarget < 0) {
        status = 'pendente';
      } else if (monthKey < currentMonthKey) {
        status = 'pendente';
      } else if (monthKey === currentMonthKey) {
        status = 'este_mes';
      } else if (daysUntilTarget <= leadDays) {
        status = 'proximo';
      } else {
        status = 'futuro';
      }

      occurrences.push({
        occurrenceKey: `${item.id}__${monthKey}`,
        item,
        monthKey,
        monthInfo,
        execution,
        status,
        daysUntilTarget,
        targetDateISO,
      });
    });
  });

  // Sort by urgency: este_mes first, then proximo, then pendente, then futuro, then realizado
  const priorityWeight: Record<DrillOccurrenceStatus, number> = {
    este_mes: 0,
    pendente: 1,
    proximo: 2,
    futuro: 3,
    realizado: 4,
  };

  return occurrences.sort((a, b) => {
    const pw = priorityWeight[a.status] - priorityWeight[b.status];
    if (pw !== 0) return pw;
    if (a.monthKey !== b.monthKey) return a.monthKey.localeCompare(b.monthKey);
    return a.item.docCode.localeCompare(b.item.docCode);
  });
}

export function buildDrillReminderText(occ: DrillOccurrence): string {
  const dateDisplay = occ.execution?.plannedDate
    ? `${occ.execution.plannedDate.split('-').reverse().join('/')}${occ.execution.plannedTime ? ` às ${occ.execution.plannedTime}` : ''}`
    : `Mês previsto: ${occ.monthInfo.fullLabel}`;

  return [
    `LEMBRETE DE SIMULADO PAE UISA (${occ.item.docCode})`,
    `Cenário: ${occ.item.scenario}`,
    `Área: ${occ.item.area}`,
    `Responsável: ${occ.item.responsible}`,
    `Equipe: ${occ.item.brigadeTeam}`,
    `Previsão: ${dateDisplay}`,
    `Ação: Confirmar logística, PEE e mobilização da Brigada de Turno (Ramal 3737).`,
  ].join('\n');
}
