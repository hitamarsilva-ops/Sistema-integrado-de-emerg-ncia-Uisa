import {
  Extinguisher,
  ExtinguisherSector,
  ExtinguisherStatus,
  ExtinguisherType,
  StockCondition,
} from '../types/extinguisher';

export const SECTOR_MAP: Record<
  ExtinguisherSector,
  { name: string; shortName: string; description: string; color: string; badgeBg: string; badgeText: string; borderColor: string; isWarehouse?: boolean }
> = {
  unidade_industrial: {
    name: 'Unidade Industrial',
    shortName: 'Indústria',
    description: 'Parque fabril, caldeiras, moagem, oficinas e áreas de processo pesado',
    color: '#f58220',
    badgeBg: 'bg-[#f58220]/15 text-[#f58220] border-[#f58220]/30',
    badgeText: 'text-[#f58220]',
    borderColor: 'border-[#f58220]/40',
    isWarehouse: false,
  },
  empacotamento: {
    name: 'Empacotamento',
    shortName: 'Empacotamento',
    description: 'Linhas de ensaque, paletização, esteiras e armazém de produto acabado',
    color: '#4b4f55',
    badgeBg: 'bg-[#4b4f55]/20 text-[#f4f4f5] border-[#4b4f55]/40',
    badgeText: 'text-[#f4f4f5]',
    borderColor: 'border-[#4b4f55]/40',
    isWarehouse: false,
  },
  posto_combustivel: {
    name: 'Posto de Combustível',
    shortName: 'Posto',
    description: 'Bandeja de abastecimento de diesel/gasolina/etanol, bombas e tanques',
    color: '#de2726',
    badgeBg: 'bg-[#de2726]/15 text-[#de2726] border-[#de2726]/30',
    badgeText: 'text-[#de2726]',
    borderColor: 'border-[#de2726]/40',
    isWarehouse: false,
  },
  adm: {
    name: 'Administração (ADM)',
    shortName: 'ADM',
    description: 'Escritórios centrais, diretoria, CPD/TI, refeitório e recepção',
    color: '#4b4f55',
    badgeBg: 'bg-[#4b4f55]/20 text-[#a5a7aa] border-[#4b4f55]/40',
    badgeText: 'text-[#a5a7aa]',
    borderColor: 'border-[#4b4f55]/40',
    isWarehouse: false,
  },
  almoxarifado_industria: {
    name: 'Estoque da Indústria',
    shortName: 'Estoque Indústria',
    description: 'Reserva técnica do parque industrial (Pós químicos 6/12kg, CO2 6kg e carretas)',
    color: '#007960',
    badgeBg: 'bg-[#007960]/15 text-[#007960] border-[#007960]/30',
    badgeText: 'text-[#007960]',
    borderColor: 'border-[#007960]/40',
    isWarehouse: true,
  },
  almoxarifado_empacotamento: {
    name: 'Estoque do Empacotamento',
    shortName: 'Estoque Empacotamento',
    description: 'Reserva técnica para as linhas de ensaque, robôs de paletização e docas',
    color: '#007960',
    badgeBg: 'bg-[#007960]/15 text-[#007960] border-[#007960]/30',
    badgeText: 'text-[#007960]',
    borderColor: 'border-[#007960]/40',
    isWarehouse: true,
  },
  almoxarifado_adm: {
    name: 'Estoque do ADM',
    shortName: 'Estoque ADM',
    description: 'Reserva técnica predial para escritórios, TI/Data Center e recepção',
    color: '#007960',
    badgeBg: 'bg-[#007960]/15 text-[#007960] border-[#007960]/30',
    badgeText: 'text-[#007960]',
    borderColor: 'border-[#007960]/40',
    isWarehouse: true,
  },
  almoxarifado: {
    name: 'Estoque Geral / Almoxarifado',
    shortName: 'Almoxarifado Geral',
    description: 'Reserva técnica central de prontidão para troca rápida',
    color: '#007960',
    badgeBg: 'bg-[#007960]/15 text-[#007960] border-[#007960]/30',
    badgeText: 'text-[#007960]',
    borderColor: 'border-[#007960]/40',
    isWarehouse: true,
  },
};

export const WAREHOUSE_SECTORS: ExtinguisherSector[] = [
  'almoxarifado_industria',
  'almoxarifado_empacotamento',
  'almoxarifado_adm',
];

export const OPERATIONAL_SECTORS: ExtinguisherSector[] = [
  'unidade_industrial',
  'empacotamento',
  'posto_combustivel',
  'adm',
];

export function isWarehouseSector(sector: ExtinguisherSector): boolean {
  return (
    sector === 'almoxarifado_industria' ||
    sector === 'almoxarifado_empacotamento' ||
    sector === 'almoxarifado_adm' ||
    sector === 'almoxarifado'
  );
}

export const TYPE_MAP: Record<
  ExtinguisherType,
  { name: string; acro: string; agent: string; fireClasses: string; standardWeight: string; color: string; badgeBg: string; badgeText: string }
> = {
  agua_pressurizada: {
    name: 'Água Pressurizada (AP)',
    acro: 'AP',
    agent: 'Água Potável H2O',
    fireClasses: 'Classe A (Madeira, Papel, Tecido)',
    standardWeight: '10 Litros',
    color: '#f58220',
    badgeBg: 'bg-[#f58220]/15 text-[#f58220] border-[#f58220]/30',
    badgeText: 'text-[#f58220]',
  },
  po_polivalente_abc: {
    name: 'Pó Químico Polivalente (ABC)',
    acro: 'Pó ABC',
    agent: 'Fosfato Monoamônico',
    fireClasses: 'Classes A, B e C (Sólidos, Líquidos e Elétricos)',
    standardWeight: '4kg / 6kg / 8kg / 12kg',
    color: '#007960',
    badgeBg: 'bg-[#007960]/15 text-[#007960] border-[#007960]/30',
    badgeText: 'text-[#007960]',
  },
  po_quimico_bc: {
    name: 'Pó Químico Seco (BC)',
    acro: 'Pó BC',
    agent: 'Bicarbonato de Sódio',
    fireClasses: 'Classes B e C (Inflamáveis e Elétricos)',
    standardWeight: '4kg / 6kg / 12kg',
    color: '#de2726',
    badgeBg: 'bg-[#de2726]/15 text-[#de2726] border-[#de2726]/30',
    badgeText: 'text-[#de2726]',
  },
  co2: {
    name: 'Dióxido de Carbono (CO2)',
    acro: 'CO2',
    agent: 'Gás Carbônico Liquefeito',
    fireClasses: 'Classes B e C (Não deixa resíduo)',
    standardWeight: '2kg / 4kg / 6kg',
    color: '#4b4f55',
    badgeBg: 'bg-[#4b4f55]/20 text-[#f4f4f5] border-[#4b4f55]/40',
    badgeText: 'text-[#f4f4f5]',
  },
  espuma_mecanica: {
    name: 'Espuma Mecânica',
    acro: 'Espuma',
    agent: 'Líquido Gerador de Espuma (AFFF)',
    fireClasses: 'Classes A e B (Resfriamento e Abafamento)',
    standardWeight: '10 Litros / 50L Carreta',
    color: '#f58220',
    badgeBg: 'bg-[#f58220]/15 text-[#f58220] border-[#f58220]/30',
    badgeText: 'text-[#f58220]',
  },
  po_classe_d: {
    name: 'Pó Especial Classe D',
    acro: 'Pó D',
    agent: 'Composto de Cloreto de Sódio/Cobre',
    fireClasses: 'Classe D (Metais Pirofóricos)',
    standardWeight: '9kg / 12kg',
    color: '#ffcf01',
    badgeBg: 'bg-[#ffcf01]/15 text-[#ffcf01] border-[#ffcf01]/30',
    badgeText: 'text-[#ffcf01]',
  },
};

export const STOCK_CONDITION_MAP: Record<StockCondition, { label: string; badge: string }> = {
  pronto_uso: {
    label: 'Pronto para Uso (Reserva Ativa)',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  aguardando_recarga: {
    label: 'Aguardando Coleta/Recarga',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  novo: {
    label: 'Novo em Estoque (Lacrado)',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  em_manutencao: {
    label: 'Em Teste / Manutenção Externa',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  },
};

export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function computeExtinguisherStatus(
  ext: Extinguisher,
  warningDaysThreshold: number = 30
): {
  status: ExtinguisherStatus;
  daysRemaining: number;
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
} {
  const days = getDaysRemaining(ext.rechargeExpiryDate);

  if (ext.isStockInWarehouse) {
    if (ext.stockCondition === 'aguardando_recarga' || days < 0) {
      return {
        status: 'vencido',
        daysRemaining: days,
        label: 'Estoque: Vencido / P/ Recarga',
        badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        badgeText: 'text-rose-400',
        dotColor: 'bg-rose-500',
      };
    }
    return {
      status: 'reserva_almoxarifado',
      daysRemaining: days,
      label: 'Reserva Almoxarifado',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      badgeText: 'text-emerald-400',
      dotColor: 'bg-emerald-500',
    };
  }

  if (days < 0) {
    return {
      status: 'vencido',
      daysRemaining: days,
      label: `Vencido há ${Math.abs(days)} dia(s)`,
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
      badgeText: 'text-red-400',
      dotColor: 'bg-red-500',
    };
  }

  if (days === 0) {
    return {
      status: 'vencido',
      daysRemaining: 0,
      label: 'Vence HOJE!',
      badgeBg: 'bg-red-500/25 text-red-200 border-red-500/50 animate-pulse',
      badgeText: 'text-red-300',
      dotColor: 'bg-red-500',
    };
  }

  if (days <= warningDaysThreshold) {
    return {
      status: 'atencao',
      daysRemaining: days,
      label: `Vence em ${days} dia(s)`,
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-400',
      dotColor: 'bg-amber-400',
    };
  }

  return {
    status: 'valido',
    daysRemaining: days,
    label: `Válido (${days} dias)`,
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    badgeText: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
  };
}

// Verifica perda de peso excessiva (> 10%) para CO2
export function checkCo2WeightLoss(grossRef?: number, current?: number): {
  hasLoss: boolean;
  lossKg: number;
  lossPercent: number;
  isCritical: boolean;
} {
  if (!grossRef || !current || grossRef <= 0) {
    return { hasLoss: false, lossKg: 0, lossPercent: 0, isCritical: false };
  }
  const lossKg = Math.max(0, grossRef - current);
  const lossPercent = (lossKg / grossRef) * 100;
  return {
    hasLoss: lossKg > 0.05,
    lossKg: Number(lossKg.toFixed(2)),
    lossPercent: Number(lossPercent.toFixed(1)),
    isCritical: lossPercent >= 10, // Norma NBR: se perda >= 10%, deve ser recarregado imediatamente
  };
}
