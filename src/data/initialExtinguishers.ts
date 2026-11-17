import { AppSettings, Extinguisher } from '../types/extinguisher';

export const DEFAULT_SETTINGS: AppSettings = {
  warningThresholdDays: 30,
  criticalThresholdDays: 7,
  enableSoundAlerts: true,
  enableDesktopNotifications: true,
  autoCheckIntervalMinutes: 30,
  notificationEmailRecipient: 'hitamar.silva@uisa.com.br',
  companyName: 'UISA - Usina Itamarati S/A',
  industrialPlantName: 'Unidade Industrial - Complexo Sucroalcooleiro',
};

// Base inicial vazia - todos os extintores excluídos a pedido do usuário
export const INITIAL_EXTINGUISHERS: Extinguisher[] = [];
