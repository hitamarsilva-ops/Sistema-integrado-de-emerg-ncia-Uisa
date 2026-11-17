import { Extinguisher, NotificationAlert } from '../types/extinguisher';
import { getDaysRemaining, isWarehouseSector, SECTOR_MAP, TYPE_MAP } from './formatters';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    console.error('Erro ao solicitar permissão de notificação:', err);
    return false;
  }
}

export function dispatchDesktopNotification(title: string, body: string, tag?: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23dc2626"><path d="M12 2c1.1 0 2 .9 2 2v1.1c2.8.8 4.8 3.3 5 6.4.2 3.7-2.3 6.9-5.9 7.4-.6.1-1.1.5-1.1 1.1v2h-4v-2c0-.6-.5-1-1.1-1.1C3.3 18.4.8 15.2 1 11.5 1.2 8.4 3.2 5.9 6 5.1V4c0-1.1.9-2 2-2h4zm-2 20h4v2h-4v-2z"/></svg>',
      tag: tag || 'extintores-alert',
      silent: false,
    });
  } catch (err) {
    console.error('Erro ao disparar notificação desktop:', err);
  }
}

export function generateAlertsFromExtinguishers(
  extinguishers: Extinguisher[],
  warningThresholdDays: number = 30,
  criticalThresholdDays: number = 7
): NotificationAlert[] {
  const alerts: NotificationAlert[] = [];

  extinguishers.forEach((ext) => {
    // Extintores nos almoxarifados marcados como aguardando recarga
    if ((ext.isStockInWarehouse || isWarehouseSector(ext.sector)) && ext.stockCondition === 'aguardando_recarga') {
      const whName = SECTOR_MAP[ext.sector]?.name || 'Almoxarifado';
      alerts.push({
        id: `almox-recarga-${ext.id}`,
        extinguisherId: ext.id,
        extinguisherCode: ext.code,
        sector: ext.sector,
        locationDetails: ext.locationDetails,
        type: ext.type,
        capacityWeight: ext.capacityWeight,
        urgency: 'atencao',
        title: `${whName}: ${ext.code} aguarda recarga externa`,
        message: `Extintor de ${TYPE_MAP[ext.type]?.acro || ext.type} (${ext.capacityWeight}) no ${whName} precisa ser enviado para recarga.`,
        daysRemaining: getDaysRemaining(ext.rechargeExpiryDate),
        expiryDate: ext.rechargeExpiryDate,
        read: false,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    // Se estiver em operação no setor
    if (!ext.isStockInWarehouse && !isWarehouseSector(ext.sector)) {
      const days = getDaysRemaining(ext.rechargeExpiryDate);
      const sectorName = SECTOR_MAP[ext.sector]?.name || ext.sector;

      if (days < 0) {
        alerts.push({
          id: `vencido-${ext.id}`,
          extinguisherId: ext.id,
          extinguisherCode: ext.code,
          sector: ext.sector,
          locationDetails: ext.locationDetails,
          type: ext.type,
          capacityWeight: ext.capacityWeight,
          urgency: 'critica',
          title: `CRÍTICO: ${ext.code} VENCIDO há ${Math.abs(days)} dias`,
          message: `Setor: ${sectorName} (${ext.locationDetails}). Recarga expirou em ${ext.rechargeExpiryDate}. Troca imediata necessária!`,
          daysRemaining: days,
          expiryDate: ext.rechargeExpiryDate,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } else if (days <= criticalThresholdDays) {
        alerts.push({
          id: `critico-expira-${ext.id}`,
          extinguisherId: ext.id,
          extinguisherCode: ext.code,
          sector: ext.sector,
          locationDetails: ext.locationDetails,
          type: ext.type,
          capacityWeight: ext.capacityWeight,
          urgency: 'critica',
          title: `URGENTE: ${ext.code} vence em ${days === 0 ? 'HOJE' : `${days} dias`}`,
          message: `Setor: ${sectorName} (${ext.locationDetails}). Validade da recarga: ${ext.rechargeExpiryDate}. Agende substituição.`,
          daysRemaining: days,
          expiryDate: ext.rechargeExpiryDate,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } else if (days <= warningThresholdDays) {
        alerts.push({
          id: `alerta-expira-${ext.id}`,
          extinguisherId: ext.id,
          extinguisherCode: ext.code,
          sector: ext.sector,
          locationDetails: ext.locationDetails,
          type: ext.type,
          capacityWeight: ext.capacityWeight,
          urgency: 'atencao',
          title: `Aviso: ${ext.code} vence em ${days} dias`,
          message: `Setor: ${sectorName} (${ext.locationDetails}). Vencimento da recarga em ${ext.rechargeExpiryDate}.`,
          daysRemaining: days,
          expiryDate: ext.rechargeExpiryDate,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Alerta de Teste Hidrostático (reteste quinquenal) se estiver vencendo em 60 dias
      const hydroDays = getDaysRemaining(ext.hydrostaticExpiryDate);
      if (hydroDays < 0) {
        alerts.push({
          id: `hydro-vencido-${ext.id}`,
          extinguisherId: ext.id,
          extinguisherCode: ext.code,
          sector: ext.sector,
          locationDetails: ext.locationDetails,
          type: ext.type,
          capacityWeight: ext.capacityWeight,
          urgency: 'critica',
          title: `Teste Hidrostático Vencido: ${ext.code}`,
          message: `Cilindro venceu o reteste de 5 anos em ${ext.hydrostaticExpiryDate}. Cilindro não pode operar com risco de ruptura.`,
          daysRemaining: hydroDays,
          expiryDate: ext.hydrostaticExpiryDate,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  return alerts.sort((a, b) => {
    // Crítico primeiro, depois atenção
    if (a.urgency === 'critica' && b.urgency !== 'critica') return -1;
    if (b.urgency === 'critica' && a.urgency !== 'critica') return 1;
    return a.daysRemaining - b.daysRemaining;
  });
}
