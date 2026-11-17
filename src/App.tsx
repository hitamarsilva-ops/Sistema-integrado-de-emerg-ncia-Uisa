import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  LayoutDashboard,
  Table,
  Building2,
  Warehouse,
  Bell,
  BellRing,
  Plus,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Boxes,
  Factory,
  Fuel,
  Upload,
  Activity,
  Award,
  Droplets,
  ShieldAlert,
  Users,
  BarChart3,
  FileCheck2,
} from 'lucide-react';
import {
  AppSettings,
  Extinguisher,
  ExtinguisherSector,
  NotificationAlert,
  StockCondition,
  ExtinguisherType,
} from './types/extinguisher';
import { Hydrant } from './types/hydrant';
import { BrigadeMember } from './types/brigade';
import { DEFAULT_SETTINGS, INITIAL_EXTINGUISHERS } from './data/initialExtinguishers';
import { INITIAL_HYDRANTS } from './data/hydrantData';
import { INITIAL_BRIGADE_MEMBERS, getTrainingStatus } from './data/brigadeData';
import {
  computeExtinguisherStatus,
  formatDateBR,
  isWarehouseSector,
  SECTOR_MAP,
  TYPE_MAP,
} from './utils/formatters';
import {
  dispatchDesktopNotification,
  generateAlertsFromExtinguishers,
} from './utils/notificationService';
import { playIndustrialSound } from './utils/audioAlerts';

import { DesktopHeader } from './components/DesktopHeader';
import { DashboardView } from './components/DashboardView';
import { EmergencyDashboardView } from './components/EmergencyDashboardView';
import { ExtinguisherTableView } from './components/ExtinguisherTableView';
import { SectorsView } from './components/SectorsView';
import { WarehouseStockView } from './components/WarehouseStockView';
import { HydrantsView } from './components/HydrantsView';
import { HydrantFormModal } from './components/HydrantFormModal';
import { HydrantInspectionModal } from './components/HydrantInspectionModal';
import { AlarmSystemView } from './components/AlarmSystemView';
import { FirePumpsView } from './components/FirePumpsView';
import { PaeView } from './components/PaeView';
import { ContingencyPlansView } from './components/ContingencyPlansView';
import { BrigadeManagementView } from './components/BrigadeManagementView';
import { AnalyticsChartsView } from './components/AnalyticsChartsView';
import { UisaLogo } from './components/UisaLogo';
import { QuickSwapModal } from './components/QuickSwapModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { ExtinguisherFormModal } from './components/ExtinguisherFormModal';
import { InspectionChecklistModal } from './components/InspectionChecklistModal';
import { PrintLabelModal } from './components/PrintLabelModal';
import { RechargeOrderModal } from './components/RechargeOrderModal';
import { InspectionReportModal } from './components/InspectionReportModal';
import { SettingsModal } from './components/SettingsModal';
import { ImportSpreadsheetModal } from './components/ImportSpreadsheetModal';
import { ActionPlanItem, ActionPlanStatus, ActionPlanDivision } from './types/actionPlan';
import { INITIAL_ACTION_PLANS } from './data/actionPlanData';
import { AlarmInspectionRecord } from './types/alarm';
import { INITIAL_ALARM_INSPECTIONS } from './data/alarmData';
import { DrillScheduleItem } from './types/pae';
import { INITIAL_PAE_DRILL_SCHEDULE } from './data/paeData';
import { computeDrillOccurrences } from './utils/paeDrillReminders';
import { FireTruckView } from './components/FireTruckView';
import { DeleteExtinguisherModal, ExtinguisherDeletionRecord } from './components/DeleteExtinguisherModal';
import { ChecklistPdfArchiveModal, ChecklistSystemKey } from './components/ChecklistPdfArchiveModal';
import { ChecklistCompletionModal, ChecklistCompletionData } from './components/ChecklistCompletionModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileAppInstallModal } from './components/MobileAppInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY_EXTINGUISHERS = 'sge_desktop_extinguishers_uisa_v3';
const STORAGE_KEY_SETTINGS = 'extintorpro_desktop_settings_uisa_v2';
const STORAGE_KEY_HYDRANTS = 'sge_desktop_hydrants_uisa_v3';
const STORAGE_KEY_BRIGADE = 'sge_desktop_brigade_members_uisa_v2';
const STORAGE_KEY_ACTION_PLANS = 'sge_desktop_action_plans_uisa_v3';
const STORAGE_KEY_ALARM_INSPECTIONS = 'sge_desktop_alarm_inspections_uisa_v3';
const STORAGE_KEY_PAE_DRILLS = 'sge_pae_drill_schedule_uisa_v1';
const STORAGE_KEY_PAE_DRILL_LEAD = 'sge_pae_drill_lead_days_v1';

export default function App() {
  // 1. Data persistence state (todos os extintores excluídos a pedido do usuário)
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>(() => {
    try {
      // Limpa chaves legadas com extintores de demonstração
      localStorage.removeItem('extintorpro_desktop_extinguishers_uisa_v2');
      localStorage.removeItem('extintorpro_desktop_extinguishers_v1');
      const stored = localStorage.getItem(STORAGE_KEY_EXTINGUISHERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar extintores do localStorage:', e);
    }
    return INITIAL_EXTINGUISHERS; // []
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.companyName && parsed.companyName.includes('UISA')) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar configurações do localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Hydrants State (excluídos todos os hidrantes da indústria; mantidos laudos oficiais NBR 12779)
  const [hydrants, setHydrants] = useState<Hydrant[]>(() => {
    try {
      localStorage.removeItem('sge_desktop_hydrants_uisa_v2');
      localStorage.removeItem('sge_desktop_hydrants_uisa_v1');
      const stored = localStorage.getItem(STORAGE_KEY_HYDRANTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove qualquer hidrante que seja da indústria
          const filtered = parsed.filter((h: Hydrant) => h.sector !== 'industria');
          if (filtered.length > 0) {
            return filtered;
          }
        }
      }
    } catch (e) {
      console.error('Falha ao carregar hidrantes:', e);
    }
    return INITIAL_HYDRANTS;
  });

  // Brigade Members State
  const [brigadeMembers, setBrigadeMembers] = useState<BrigadeMember[]>(() => {
    try {
      localStorage.removeItem('sge_desktop_brigade_members_uisa_v1');
      const stored = localStorage.getItem(STORAGE_KEY_BRIGADE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar brigadistas do localStorage:', e);
    }
    return INITIAL_BRIGADE_MEMBERS;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXTINGUISHERS, JSON.stringify(extinguishers));
    } catch (e) {
      console.error('Erro ao salvar extintores:', e);
    }
  }, [extinguishers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HYDRANTS, JSON.stringify(hydrants));
    } catch (e) {
      console.error('Erro ao salvar hidrantes:', e);
    }
  }, [hydrants]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRIGADE, JSON.stringify(brigadeMembers));
    } catch (e) {
      console.error('Erro ao salvar brigadistas:', e);
    }
  }, [brigadeMembers]);

  // Action Plans State (Não Conformidades unificadas de Bombas, Extintores, Hidrantes, Alarmes)
  const [actionPlans, setActionPlans] = useState<ActionPlanItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTION_PLANS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar planos de ação:', e);
    }
    return INITIAL_ACTION_PLANS;
  });

  // Alarm Inspections State (Doc SST.RE-020)
  const [alarmInspections, setAlarmInspections] = useState<AlarmInspectionRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ALARM_INSPECTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar inspeções de alarme:', e);
    }
    return INITIAL_ALARM_INSPECTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTION_PLANS, JSON.stringify(actionPlans));
    } catch (e) {
      console.error('Erro ao salvar planos de ação:', e);
    }
  }, [actionPlans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALARM_INSPECTIONS, JSON.stringify(alarmInspections));
    } catch (e) {
      console.error('Erro ao salvar inspeções de alarme:', e);
    }
  }, [alarmInspections]);

  // PAE Drill Schedule & Reminders State (SST.RE-105 & SST.RE-104)
  const [paeDrillSchedule, setPaeDrillSchedule] = useState<DrillScheduleItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PAE_DRILLS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar cronograma de simulados PAE:', e);
    }
    return INITIAL_PAE_DRILL_SCHEDULE;
  });

  const [paeDrillLeadDays, setPaeDrillLeadDays] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PAE_DRILL_LEAD);
      const parsed = stored ? Number(stored) : 30;
      return parsed >= 7 ? parsed : 30;
    } catch {
      return 30;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAE_DRILLS, JSON.stringify(paeDrillSchedule));
    } catch (e) {
      console.error('Erro ao salvar cronograma de simulados PAE:', e);
    }
  }, [paeDrillSchedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAE_DRILL_LEAD, String(paeDrillLeadDays));
    } catch {
      // ignore
    }
  }, [paeDrillLeadDays]);

  // Handlers de Planos de Ação e Alarmes
  const handleUpdateActionPlanStatus = (id: string, newStatus: ActionPlanStatus) => {
    setActionPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: newStatus,
              completedAt: newStatus === 'finalizado' ? new Date().toISOString().split('T')[0] : undefined,
            }
          : p
      )
    );
    playIndustrialSound(newStatus === 'finalizado' ? 'success' : 'ping');
  };

  const handleAddActionPlan = (plan: ActionPlanItem) => {
    setActionPlans((prev) => [plan, ...prev]);
    playIndustrialSound('warning');
  };

  const handleSaveAlarmInspection = (record: AlarmInspectionRecord, newPlans?: ActionPlanItem[]) => {
    setAlarmInspections((prev) => [record, ...prev]);
    if (newPlans && newPlans.length > 0) {
      setActionPlans((prev) => [...newPlans, ...prev]);
      playIndustrialSound('warning');
    } else {
      playIndustrialSound('success');
    }
  };

  const handleUpdateActionPlan = (updated: ActionPlanItem) => {
    setActionPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    playIndustrialSound('success');
  };

  // 2. Navigation View State: Início (Painel Geral), Extintores, Hidrantes, Alarmes, Bombas, Caminhão Bombeiro, Brigada, PAE
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'extintores' | 'hidrantes' | 'alarmes' | 'bombas' | 'caminhao_pipa' | 'brigadistas' | 'pae'
  >('dashboard');

  // Sub-módulos internos da aba Extintores (Setores Operacionais e Estoque Almoxarifado)
  const [extinguisherSubTab, setExtinguisherSubTab] = useState<
    'setores' | 'almoxarifado'
  >('setores');
  const [isCreateSectorModalOpen, setIsCreateSectorModalOpen] = useState(false);

  const [selectedSector, setSelectedSector] = useState<ExtinguisherSector | 'todos'>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 3. Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExtinguisher, setEditingExtinguisher] = useState<Extinguisher | null>(null);
  const [formDefaultSector, setFormDefaultSector] = useState<ExtinguisherSector>('unidade_industrial');
  const [isAddingToWarehouse, setIsAddingToWarehouse] = useState(false);

  // Hydrant Modals State
  const [isHydrantFormOpen, setIsHydrantFormOpen] = useState(false);
  const [editingHydrant, setEditingHydrant] = useState<Hydrant | null>(null);
  const [isHydrantInspectOpen, setIsHydrantInspectOpen] = useState(false);
  const [inspectingHydrant, setInspectingHydrant] = useState<Hydrant | null>(null);

  const [isQuickSwapOpen, setIsQuickSwapOpen] = useState(false);
  const [preSelectedSwapTarget, setPreSelectedSwapTarget] = useState<Extinguisher | undefined>(undefined);

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [inspectingExtinguisher, setInspectingExtinguisher] = useState<Extinguisher | null>(null);

  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
  const [printingExtinguisher, setPrintingExtinguisher] = useState<Extinguisher | null>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isRechargeOrderOpen, setIsRechargeOrderOpen] = useState(false);
  const [rechargeOrderUnits, setRechargeOrderUnits] = useState<Extinguisher[]>([]);

  const [isInspectionReportOpen, setIsInspectionReportOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPdfArchiveOpen, setIsPdfArchiveOpen] = useState(false);
  const [pdfArchiveInitialSystem, setPdfArchiveInitialSystem] = useState<ChecklistSystemKey | 'todos'>('todos');
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState<ChecklistCompletionData | null>(null);
  const [completionSystemKey, setCompletionSystemKey] = useState<ChecklistSystemKey>('extintores');
  const [isMobileAppModalOpen, setIsMobileAppModalOpen] = useState(false);

  const handleOpenPdfArchive = (system?: ChecklistSystemKey | 'todos') => {
    setPdfArchiveInitialSystem(system || 'todos');
    setIsPdfArchiveOpen(true);
  };

  // 4. Alerts calculation: Extintores, Não Conformidades (Planos de Ação) e Brigadistas com Treinamento Vencido
  const alerts: NotificationAlert[] = useMemo(() => {
    const extAlerts = generateAlertsFromExtinguishers(
      extinguishers,
      settings.warningThresholdDays,
      settings.criticalThresholdDays
    );

    // Não Conformidades ativas de Bombas, Extintores, Hidrantes, Alarmes
    const ncAlerts: NotificationAlert[] = actionPlans
      .filter((p) => p.status === 'atrasado' || p.status === 'em_andamento')
      .map((p) => ({
        id: `nc-${p.id}`,
        extinguisherId: p.id,
        extinguisherCode: `NC: [${p.system.toUpperCase()}]`,
        sector: 'unidade_industrial',
        locationDetails: `${p.division} - ${p.itemChecked}`,
        type: (p.system === 'hidrantes' ? 'agua_pressurizada' : p.system === 'bombas' ? 'espuma_mecanica' : 'po_polivalente_abc') as ExtinguisherType,
        capacityWeight: p.priority.toUpperCase(),
        expiryDate: p.deadline,
        daysRemaining: Math.ceil((new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        urgency: p.status === 'atrasado' ? 'critica' : 'atencao',
        title: `Não Conformidade (${p.system.toUpperCase()}): ${p.itemChecked}`,
        message: `${p.nonConformityDescription} • Ação: ${p.correctiveAction} (Resp: ${p.responsible})`,
        read: false,
        createdAt: p.createdAt || new Date().toISOString(),
      }));

    // Brigadistas com Treinamento Vencido (Ponto Vermelho)
    const brigadeAlerts: NotificationAlert[] = brigadeMembers
      .filter((m) => {
        const st = getTrainingStatus(m.trainingExpiryDate);
        return st.status === 'vencido';
      })
      .map((m) => ({
        id: `train-${m.id}`,
        extinguisherId: m.id,
        extinguisherCode: `BRIGADA: ${m.registrationNumber}`,
        sector: 'unidade_industrial',
        locationDetails: `Turno ${m.shift} - ${m.name}`,
        type: 'co2',
        capacityWeight: 'RECICLAGEM',
        expiryDate: m.trainingExpiryDate || new Date().toISOString().split('T')[0],
        daysRemaining: -1,
        urgency: 'critica',
        title: `🔴 Brigadista com Treinamento Vencido: ${m.name}`,
        message: `Treinamento de brigada expirou em ${formatDateBR(m.trainingExpiryDate)}. Reciclagem obrigatória imediata.`,
        read: false,
        createdAt: new Date().toISOString(),
      }));

    // Lembretes de Simulados PAE (SST.RE-105 e SST.RE-104)
    const drillOccurrences = computeDrillOccurrences(paeDrillSchedule, paeDrillLeadDays);
    const paeDrillAlerts: NotificationAlert[] = drillOccurrences
      .filter(
        (o) =>
          (o.status === 'este_mes' || o.status === 'proximo' || o.status === 'pendente') &&
          !o.execution?.reminderMuted
      )
      .map((o) => {
        const isCurrentOrOverdue = o.status === 'este_mes' || o.status === 'pendente';
        return {
          id: `pae-drill-${o.occurrenceKey}`,
          extinguisherId: o.item.id,
          extinguisherCode: `PAE ${o.item.docCode}`,
          sector: o.item.docCode === 'SST.RE-105' ? 'unidade_industrial' : 'adm',
          locationDetails: `${o.item.area} · ${o.monthInfo.fullLabel}`,
          type: 'po_polivalente_abc',
          capacityWeight: o.monthInfo.shortLabel.toUpperCase(),
          expiryDate: o.targetDateISO,
          daysRemaining: o.daysUntilTarget,
          urgency: o.status === 'pendente' ? 'critica' : isCurrentOrOverdue ? 'atencao' : 'atencao',
          title: `Simulado PAE (${o.item.docCode}): ${o.item.scenario}`,
          message: `Previsto para ${o.monthInfo.fullLabel} · Área: ${o.item.area} · Resp.: ${o.item.responsible}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
      });

    return [...paeDrillAlerts, ...ncAlerts, ...brigadeAlerts, ...extAlerts];
  }, [
    extinguishers,
    actionPlans,
    brigadeMembers,
    paeDrillSchedule,
    paeDrillLeadDays,
    settings.warningThresholdDays,
    settings.criticalThresholdDays,
  ]);

  // Periodic automatic notification trigger
  useEffect(() => {
    if (!settings.enableDesktopNotifications) return;

    const criticals = alerts.filter((a) => a.urgency === 'critica');
    if (criticals.length > 0) {
      dispatchDesktopNotification(
        `Alerta ExtintorPRO: ${criticals.length} extintor(es) vencido(s)`,
        `Existem unidades críticas em setores como ${SECTOR_MAP[criticals[0].sector]?.name || criticals[0].sector}. Verifique a central de notificações.`,
        'critical-pulse'
      );
    }
  }, []);

  // Handlers
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSaveExtinguisher = (saved: Extinguisher) => {
    setExtinguishers((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      } else {
        return [saved, ...prev];
      }
    });
    playIndustrialSound('success');
  };

  // Deletion modal state & audit records
  const [isDeleteExtinguisherOpen, setIsDeleteExtinguisherOpen] = useState(false);
  const [deletingExtinguisher, setDeletingExtinguisher] = useState<Extinguisher | null>(null);
  const [deletionRecords, setDeletionRecords] = useState<ExtinguisherDeletionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('sge_desktop_extinguisher_deletions_uisa_v1');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sge_desktop_extinguisher_deletions_uisa_v1', JSON.stringify(deletionRecords));
    } catch (e) {
      console.error('Erro ao salvar registros de exclusão:', e);
    }
  }, [deletionRecords]);

  const handleDeleteExtinguisher = (id: string) => {
    const ext = extinguishers.find((e) => e.id === id);
    if (!ext) return;
    setDeletingExtinguisher(ext);
    setIsDeleteExtinguisherOpen(true);
  };

  const handleConfirmDeleteExtinguisher = (
    id: string,
    reasonCategory: string,
    reasonDescription: string,
    responsible: string
  ) => {
    const ext = extinguishers.find((e) => e.id === id);
    if (!ext) return;

    const record: ExtinguisherDeletionRecord = {
      id: `del-ext-${Date.now()}`,
      extinguisherId: ext.id,
      code: ext.code,
      sector: ext.sector,
      type: ext.type,
      capacityWeight: ext.capacityWeight,
      serialNumber: ext.serialNumber || 'S/N',
      reasonCategory,
      reasonDescription,
      responsible,
      deletedAt: new Date().toISOString(),
    };

    setDeletionRecords((prev) => [record, ...prev]);
    setExtinguishers((prev) => prev.filter((e) => e.id !== id));
    playIndustrialSound('ping');
  };

  const handleClearAllExtinguishers = () => {
    if (
      confirm(
        'Atenção: Deseja realmente excluir todos os extintores cadastrados no aplicativo? O inventário ficará zerado para novo cadastro ou importação.'
      )
    ) {
      setExtinguishers([]);
      try {
        localStorage.setItem(STORAGE_KEY_EXTINGUISHERS, JSON.stringify([]));
      } catch (e) {
        console.error('Erro ao limpar extintores do storage:', e);
      }
      playIndustrialSound('ping');
    }
  };

  // Hydrant handlers
  const handleSaveHydrant = (saved: Hydrant) => {
    setHydrants((prev) => {
      const idx = prev.findIndex((h) => h.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      } else {
        return [saved, ...prev];
      }
    });
    playIndustrialSound('success');
  };

  const handleDeleteHydrant = (id: string) => {
    const hyd = hydrants.find((h) => h.id === id);
    if (!hyd) return;
    if (confirm(`Tem certeza que deseja excluir o hidrante [${hyd.code}]?`)) {
      setHydrants((prev) => prev.filter((h) => h.id !== id));
      playIndustrialSound('ping');
    }
  };

  const handleInspectHydrant = (hyd: Hydrant) => {
    setInspectingHydrant(hyd);
    setIsHydrantInspectOpen(true);
  };

  const handleExecuteSwap = (
    targetExtId: string,
    spareExtId: string,
    swapNotes: string,
    destinationWarehouse?: ExtinguisherSector
  ) => {
    setExtinguishers((prev) => {
      const target = prev.find((e) => e.id === targetExtId);
      const spare = prev.find((e) => e.id === spareExtId);
      if (!target || !spare) return prev;

      const oldSector = target.sector;
      const oldLocation = target.locationDetails;

      const destWh: ExtinguisherSector =
        destinationWarehouse ||
        (oldSector === 'unidade_industrial'
          ? 'almoxarifado_industria'
          : oldSector === 'empacotamento'
          ? 'almoxarifado_empacotamento'
          : oldSector === 'adm'
          ? 'almoxarifado_adm'
          : 'almoxarifado_industria');

      return prev.map((item) => {
        if (item.id === spare.id) {
          // The spare takes over the physical location and sector
          return {
            ...item,
            sector: oldSector,
            locationDetails: oldLocation,
            isStockInWarehouse: false,
            stockCondition: undefined,
            notes: `Substituiu ${target.code} em ${new Date().toLocaleDateString('pt-BR')}. ${item.notes || ''}`.trim(),
            updatedAt: new Date().toISOString(),
          };
        }
        if (item.id === target.id) {
          // The old expired unit goes to the selected sector warehouse awaiting recharge
          return {
            ...item,
            sector: destWh,
            locationDetails: `Palete Quarentena (${SECTOR_MAP[destWh]?.shortName}) - Aguardando Recarga`,
            isStockInWarehouse: true,
            stockCondition: 'aguardando_recarga' as StockCondition,
            notes: `Retirado de ${SECTOR_MAP[oldSector]?.name} (${oldLocation}). Motivo: ${swapNotes}`.trim(),
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });
    });
  };

  const handleUpdateStockCondition = (id: string, condition: StockCondition) => {
    setExtinguishers((prev) =>
      prev.map((e) => (e.id === id ? { ...e, stockCondition: condition, updatedAt: new Date().toISOString() } : e))
    );
  };

  // Open Quick Swap with preselection
  const handleOpenQuickSwapWithTarget = (expiredExt?: Extinguisher) => {
    setPreSelectedSwapTarget(expiredExt);
    setIsQuickSwapOpen(true);
  };

  const handleOpenQuickSwapWithId = (extId: string) => {
    const target = extinguishers.find((e) => e.id === extId);
    handleOpenQuickSwapWithTarget(target);
  };

  // Open Add modal with specific sector pre-selected
  const handleAddInSector = (sector: ExtinguisherSector) => {
    setEditingExtinguisher(null);
    setFormDefaultSector(sector);
    setIsAddingToWarehouse(sector === 'almoxarifado');
    setIsFormModalOpen(true);
  };

  // CSV Export with BOM
  const handleExportCsv = () => {
    const headers = [
      'Código/Tag',
      'Setor',
      'Localização Detalhada',
      'Tipo de Agente',
      'Carga/Peso',
      'Nº de Série',
      'Selo INMETRO',
      'Data da Recarga',
      'Validade da Recarga',
      'Data Reteste (5 Anos)',
      'Validade Reteste (5 Anos)',
      'Status Atual',
      'Dias Restantes',
      'No Almoxarifado',
      'Condição do Estoque',
      'Manômetro OK',
      'Lacre OK',
      'Desobstruído',
      'Observações',
    ];

    const rows = extinguishers.map((e) => {
      const st = computeExtinguisherStatus(e, settings.warningThresholdDays);
      return [
        `"${e.code}"`,
        `"${SECTOR_MAP[e.sector]?.name || e.sector}"`,
        `"${e.locationDetails.replace(/"/g, '""')}"`,
        `"${TYPE_MAP[e.type]?.name || e.type}"`,
        `"${e.capacityWeight}"`,
        `"${e.serialNumber}"`,
        `"${e.inmetroSeal}"`,
        `"${e.rechargeDate}"`,
        `"${e.rechargeExpiryDate}"`,
        `"${e.hydrostaticTestDate}"`,
        `"${e.hydrostaticExpiryDate}"`,
        `"${st.label}"`,
        st.daysRemaining,
        e.isStockInWarehouse ? 'SIM' : 'NÃO',
        `"${e.stockCondition || '-'}"`,
        e.pressureGaugeOk ? 'SIM' : 'NÃO',
        e.sealIntact ? 'SIM' : 'NÃO',
        e.unobstructed ? 'SIM' : 'NÃO',
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_Extintores_UISA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playIndustrialSound('success');
  };

  // JSON Export / Import
  const handleExportJson = () => {
    const dataStr = JSON.stringify({ extinguishers, settings, exportDate: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Backup_ExtintoresPRO_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.extinguishers && Array.isArray(json.extinguishers)) {
          setExtinguishers(json.extinguishers);
          if (json.settings) setSettings(json.settings);
          alert('Backup importado com sucesso!');
          playIndustrialSound('success');
        } else {
          alert('Arquivo de backup inválido: não contém a lista de extintores.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetFactoryData = () => {
    setExtinguishers(INITIAL_EXTINGUISHERS);
    setSettings(DEFAULT_SETTINGS);
    playIndustrialSound('ping');
  };

  // Direct trigger to open recharge order from Almoxarifado
  const handlePrintRechargeOrder = (rechargeUnits: Extinguisher[]) => {
    setRechargeOrderUnits(rechargeUnits);
    setIsRechargeOrderOpen(true);
  };

  // Handler for spreadsheet import batch update / insert
  const handleApplyImport = (
    importedExts: Extinguisher[],
    mode: 'upsert' | 'update_only' | 'replace_all'
  ) => {
    if (mode === 'replace_all') {
      setExtinguishers(importedExts);
    } else {
      setExtinguishers((prev) => {
        const copy = [...prev];
        importedExts.forEach((imp) => {
          const idx = copy.findIndex(
            (e) => e.id === imp.id || e.code.trim().toUpperCase() === imp.code.trim().toUpperCase()
          );
          if (idx >= 0) {
            copy[idx] = imp;
          } else if (mode === 'upsert') {
            copy.unshift(imp);
          }
        });
        return copy;
      });
    }
    playIndustrialSound('success');
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col font-sans selection:bg-[#007960] selection:text-white overflow-x-hidden">
      {/* Top Application Desktop & Mobile Header */}
      <DesktopHeader
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        alerts={alerts}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenNewExtinguisherModal={() => {
          setEditingExtinguisher(null);
          setFormDefaultSector('unidade_industrial');
          setIsAddingToWarehouse(false);
          setIsFormModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={extinguishers.length}
        onOpenMobileAppModal={() => setIsMobileAppModalOpen(true)}
      />

      {/* Main Navigation Bar (Desktop sticky; mobile uses compact inline breadcrumb + Bottom Tab Bar) */}
      <nav className="hidden md:block bg-white/95 border-b border-[#007960]/20 px-4 py-2 sticky top-0 z-30 backdrop-blur shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Main Module - Painel Geral ONLY */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Painel Geral */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#007960] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white border border-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel Geral</span>
              {actionPlans.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-rose-100 text-[#de2726]'
                  }`}
                >
                  {actionPlans.filter((p) => p.status !== 'finalizado').length} NC
                </span>
              )}
            </button>

            {/* Breadcrumb / Indicador de Retorno quando em outros módulos */}
            {activeTab !== 'dashboard' && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-slate-300 font-bold">/</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {activeTab === 'extintores' && 'Extintores de Incêndio'}
                  {activeTab === 'hidrantes' && 'Rede de Hidrantes & LGE'}
                  {activeTab === 'alarmes' && 'Alarmes de Incêndio (SST.RE-020)'}
                  {activeTab === 'bombas' && 'Bombas de Combate & RTI'}
                  {activeTab === 'caminhao_pipa' && 'Caminhão Bombeiro (SST.RE-109)'}
                  {activeTab === 'brigadistas' && 'Brigada de Emergência'}
                  {activeTab === 'pae' && 'Plano de Atendimento a Emergência (PAE)'}
                </span>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="ml-2 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#007960] bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  ← Voltar ao Painel Geral
                </button>
                <button
                  onClick={() => {
                    const sysMap: Record<string, ChecklistSystemKey> = {
                      extintores: 'extintores',
                      hidrantes: 'hidrantes',
                      alarmes: 'alarmes',
                      bombas: 'bombas',
                      caminhao_pipa: 'caminhao_pipa',
                      brigadistas: 'brigadistas',
                      pae: 'pae',
                    };
                    handleOpenPdfArchive(sysMap[activeTab] || 'todos');
                  }}
                  className="ml-2 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Armazenamento e Repositório de Checklists Realizados em PDF"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Armazenamento de Checklists (PDF)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile inline breadcrumb bar (non-sticky to keep viewport open) */}
      {activeTab !== 'dashboard' && (
        <div className="md:hidden px-3 pt-3 flex items-center justify-between gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="px-3 py-2 rounded-xl text-xs font-bold text-[#007960] bg-white border border-[#007960]/30 shadow-2xs min-h-[40px]"
          >
            ← Painel Geral
          </button>
          <span className="text-[11px] font-black text-slate-800 uppercase truncate">
            {activeTab === 'extintores' && 'Extintores'}
            {activeTab === 'hidrantes' && 'Hidrantes'}
            {activeTab === 'alarmes' && 'Alarmes'}
            {activeTab === 'bombas' && 'Bombas & RTI'}
            {activeTab === 'caminhao_pipa' && 'Caminhão Bombeiro'}
            {activeTab === 'brigadistas' && 'Brigada'}
            {activeTab === 'pae' && 'PAE Oficial'}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        {/* ABA 1: PAINEL GERAL (DASHBOARD COM INDICADORES DE NÃO CONFORMIDADES) */}
        {activeTab === 'dashboard' && (
          <EmergencyDashboardView
            actionPlans={actionPlans}
            onUpdateActionPlanStatus={handleUpdateActionPlanStatus}
            onUpdateActionPlan={handleUpdateActionPlan}
            onAddActionPlan={handleAddActionPlan}
            extinguishers={extinguishers}
            hydrants={hydrants}
            alarmInspections={alarmInspections}
            brigadeMembers={brigadeMembers}
            onNavigateToTab={(tab) => {
              setActiveTab(tab as any);
            }}
          />
        )}

        {/* ABA 2: EXTINTORES (Toda informação dentro da aba de extintores) */}
        {activeTab === 'extintores' && (
          <div className="space-y-5">
            {/* Sub-navegação interna e Ações da Aba Extintores */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#007960]/25 shadow-sm">
              {/* Sub-abas de Extintores: Setores Operacionais e Estoque Almoxarifado */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setExtinguisherSubTab('setores')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    extinguisherSubTab === 'setores'
                      ? 'bg-[#007960] text-white shadow-xs'
                      : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Setores Operacionais</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    extinguisherSubTab === 'setores' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {extinguishers.filter((e) => !e.isStockInWarehouse && !isWarehouseSector(e.sector)).length}
                  </span>
                </button>

                <button
                  onClick={() => setExtinguisherSubTab('almoxarifado')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    extinguisherSubTab === 'almoxarifado'
                      ? 'bg-[#007960] text-white shadow-xs'
                      : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10 bg-white'
                  }`}
                >
                  <Warehouse className="w-4 h-4" />
                  <span>Estoque Almoxarifado</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    extinguisherSubTab === 'almoxarifado' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-[#007960]'
                  }`}>
                    {extinguishers.filter((e) => e.isStockInWarehouse || isWarehouseSector(e.sector)).length}
                  </span>
                </button>
              </div>

              {/* Botões de Ação lado a lado: Ficha Geral, Exportar Planilha, Importar Planilha, Novo Extintor, Cadastrar Novo Setor */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsInspectionReportOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors text-xs font-bold shadow-2xs"
                  title="Emitir Ficha Geral / Relatório Oficial de Inspeção"
                >
                  <Printer className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Ficha Geral</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors text-xs font-bold shadow-2xs"
                  title="Exportar dados para Excel (.CSV)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Exportar Planilha</span>
                </button>

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors text-xs font-bold shadow-2xs"
                  title="Importar e atualizar extintores via planilha (.xlsx, .csv)"
                >
                  <Upload className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Importar Planilha</span>
                </button>

                <button
                  onClick={() => {
                    setEditingExtinguisher(null);
                    setFormDefaultSector('unidade_industrial');
                    setIsAddingToWarehouse(false);
                    setIsFormModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold text-xs shadow-xs transition-all"
                  title="Cadastrar Novo Extintor"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Extintor</span>
                </button>

                <button
                  onClick={() => {
                    setExtinguisherSubTab('setores');
                    setIsCreateSectorModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007960] border border-[#007960]/40 font-bold text-xs shadow-2xs transition-all"
                  title="Cadastrar Novo Setor Operacional"
                >
                  <Plus className="w-4 h-4 text-[#007960]" />
                  <span>Cadastrar Novo Setor</span>
                </button>

                <button
                  onClick={() => handleOpenPdfArchive('extintores')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors text-xs font-bold shadow-2xs"
                  title="Armazenamento e Repositório de Checklists de Extintores em PDF"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Checklists em PDF</span>
                </button>
              </div>
            </div>

            {/* Conteúdo Renderizado da Sub-Aba de Extintores */}
            {extinguisherSubTab === 'setores' && (
              <SectorsView
                extinguishers={extinguishers}
                onInspectExtinguisher={(ext) => {
                  setInspectingExtinguisher(ext);
                  setIsInspectionModalOpen(true);
                }}
                onPrintLabel={(ext) => {
                  setPrintingExtinguisher(ext);
                  setIsPrintLabelOpen(true);
                }}
                onQuickSwap={handleOpenQuickSwapWithTarget}
                onAddInSector={handleAddInSector}
                onDeleteExtinguisher={handleDeleteExtinguisher}
                onOpenPumpStationChecklist={() => setActiveTab('bombas')}
                onSaveSectorChecklist={(updatedList, newPlans, completion) => {
                  setExtinguishers((prev) => {
                    const updatedMap = new Map(updatedList.map((item) => [item.id, item]));
                    return prev.map((ext) => updatedMap.get(ext.id) || ext);
                  });
                  if (newPlans.length > 0) {
                    setActionPlans((prev) => [...newPlans, ...prev]);
                  }
                  setCompletionSystemKey('extintores');
                  setCompletionData(completion);
                  setIsCompletionModalOpen(true);
                }}
                isCreateSectorModalOpen={isCreateSectorModalOpen}
                onCloseCreateSectorModal={() => setIsCreateSectorModalOpen(false)}
              />
            )}

            {extinguisherSubTab === 'almoxarifado' && (
              <WarehouseStockView
                extinguishers={extinguishers}
                onOpenQuickSwap={handleOpenQuickSwapWithTarget}
                onAddNewStock={(targetWh) => {
                  setEditingExtinguisher(null);
                  setFormDefaultSector(targetWh || 'almoxarifado_industria');
                  setIsAddingToWarehouse(true);
                  setIsFormModalOpen(true);
                }}
                onInspectExtinguisher={(ext) => {
                  setInspectingExtinguisher(ext);
                  setIsInspectionModalOpen(true);
                }}
                onPrintLabel={(ext) => {
                  setPrintingExtinguisher(ext);
                  setIsPrintLabelOpen(true);
                }}
                onUpdateCondition={handleUpdateStockCondition}
                onPrintRechargeOrder={handlePrintRechargeOrder}
                onUpdateExtinguisher={handleSaveExtinguisher}
              />
            )}
          </div>
        )}

        {/* ABA 3: HIDRANTES */}
        {activeTab === 'hidrantes' && (
          <HydrantsView
            hydrants={hydrants}
            onAddHydrant={() => {
              setEditingHydrant(null);
              setIsHydrantFormOpen(true);
            }}
            onEditHydrant={(hyd) => {
              setEditingHydrant(hyd);
              setIsHydrantFormOpen(true);
            }}
            onDeleteHydrant={handleDeleteHydrant}
            onInspectHydrant={handleInspectHydrant}
            onSaveSectorChecklist={(updatedList, newPlans, completion) => {
              setHydrants((prev) => {
                const updatedMap = new Map(updatedList.map((item) => [item.id, item]));
                return prev.map((hid) => updatedMap.get(hid.id) || hid);
              });
              if (newPlans.length > 0) {
                setActionPlans((prev) => [...newPlans, ...prev]);
              }
              setCompletionSystemKey('hidrantes');
              setCompletionData(completion);
              setIsCompletionModalOpen(true);
            }}
            onOpenPdfArchive={() => handleOpenPdfArchive('hidrantes')}
          />
        )}

        {/* ABA 4: ALARMES DE INCÊNDIO (AO LADO DE HIDRANTES) */}
        {activeTab === 'alarmes' && (
          <AlarmSystemView
            inspections={alarmInspections}
            onSaveInspection={handleSaveAlarmInspection}
            onOpenPdfArchive={() => handleOpenPdfArchive('alarmes')}
          />
        )}

        {/* ABA 5: BOMBAS DE INCÊNDIO & RTI */}
        {activeTab === 'bombas' && (
          <FirePumpsView
            onAddActionPlan={handleAddActionPlan}
            onOpenPdfArchive={() => handleOpenPdfArchive('bombas')}
          />
        )}

        {/* ABA 6: CAMINHÃO BOMBEIRO (CAMINHÃO PIPA - SST.RE-109) */}
        {activeTab === 'caminhao_pipa' && (
          <FireTruckView
            onAddActionPlan={handleAddActionPlan}
            onOpenPdfArchive={() => handleOpenPdfArchive('caminhao_pipa')}
          />
        )}

        {/* ABA 7: BRIGADA DE EMERGÊNCIA */}
        {activeTab === 'brigadistas' && (
          <BrigadeManagementView
            members={brigadeMembers}
            onUpdateMembers={setBrigadeMembers}
            onNavigateToPAE={() => setActiveTab('pae')}
            onOpenPdfArchive={() => handleOpenPdfArchive('brigadistas')}
          />
        )}

        {/* ABA 8: PLANO DE EMERGÊNCIA (PAE + CONTINGÊNCIA INTEGRADA) */}
        {activeTab === 'pae' && (
          <PaeView
            onOpenPdfArchive={() => handleOpenPdfArchive('pae')}
            drillSchedule={paeDrillSchedule}
            onUpdateDrillSchedule={setPaeDrillSchedule}
            reminderLeadDays={paeDrillLeadDays}
            onChangeReminderLeadDays={setPaeDrillLeadDays}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Quick Swap Modal */}
      <QuickSwapModal
        isOpen={isQuickSwapOpen}
        onClose={() => setIsQuickSwapOpen(false)}
        extinguishers={extinguishers}
        preSelectedTargetExt={preSelectedSwapTarget}
        onExecuteSwap={handleExecuteSwap}
      />

      {/* 2. Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenQuickSwapWithExtinguisherId={handleOpenQuickSwapWithId}
      />

      {/* 3. Add / Edit Extinguisher Modal */}
      <ExtinguisherFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveExtinguisher}
        editingExtinguisher={editingExtinguisher}
        defaultSector={formDefaultSector}
        isAddingToWarehouse={isAddingToWarehouse}
      />

      {/* 4. Inspection Checklist Modal */}
      <InspectionChecklistModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        extinguisher={inspectingExtinguisher}
        onSaveInspection={(id, updated) => {
          handleSaveExtinguisher(updated);
          const hasNC =
            !updated.pressureGaugeOk ||
            !updated.sealIntact ||
            !updated.hoseNozzleOk ||
            !updated.signageOk ||
            !updated.unobstructed;
          if (hasNC) {
            const divMap: Record<string, ActionPlanDivision> = {
              unidade_industrial: 'INDUSTRIA',
              empacotamento: 'EMPACOTAMENTO',
              posto_combustivel: 'POSTO DE COMBUSTIVEL',
              adm: 'ADM/GMA',
            };
            const div = divMap[updated.sector] || 'INDUSTRIA';
            handleAddActionPlan({
              id: `pa-ext-auto-${Date.now()}`,
              system: 'extintores',
              division: div,
              checklistDoc: 'NBR 12962',
              itemChecked: `Extintor ${updated.code} (${updated.locationDetails})`,
              nonConformityDescription: `Não conformidade constatada na inspeção mensal (Lacre: ${
                updated.sealIntact ? 'OK' : 'ROMPEU'
              }, Manômetro: ${updated.pressureGaugeOk ? 'OK' : 'DESPRESSURIZADO'}, Desobstruído: ${
                updated.unobstructed ? 'SIM' : 'NÃO'
              }).`,
              correctiveAction: 'Substituição imediata por unidade reserva do almoxarifado e envio para recarga.',
              deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              responsible: 'Inspetor de SST / Almoxarifado de Emergência',
              status: 'em_andamento',
              priority: 'alta',
              createdAt: new Date().toISOString().split('T')[0],
              notes: 'Plano de ação automático gerado no checklist de extintor.',
            });
          }

          const latestRecord = updated.inspectionHistory?.[0];
          const checks = [
            updated.pressureGaugeOk,
            updated.sealIntact,
            updated.hoseNozzleOk,
            updated.signageOk,
            updated.unobstructed,
          ];
          const cCount = checks.filter(Boolean).length;
          const ncCount = checks.filter((c) => !c).length;
          const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const proto = `UISA-EXT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

          setCompletionSystemKey('extintores');
          setCompletionData({
            protocol: proto,
            systemName: `Extintor ${updated.code} (${TYPE_MAP[updated.type]?.name || updated.type} ${updated.capacityWeight})`,
            docNumber: 'NBR 12962 / NR-23',
            revision: '02',
            unit: `${SECTOR_MAP[updated.sector]?.name || updated.sector} — ${updated.locationDetails}`,
            completedAt: `${formatDateBR(latestRecord?.date || new Date().toISOString().split('T')[0])} às ${nowTime}`,
            inspectorName: latestRecord?.inspectorName || 'Inspetor SST',
            signatureType: 'digital',
            totalItems: 5,
            conformCount: cCount,
            nonConformCount: ncCount,
            naCount: 0,
            actionPlansCreated: hasNC ? 1 : 0,
            qrVerifiedCount: latestRecord?.verificationMethod === 'manual_fallback' ? 0 : 1,
            manualFallbackCount: latestRecord?.verificationMethod === 'manual_fallback' ? 1 : 0,
            notes: latestRecord?.notes,
          });
          setIsCompletionModalOpen(true);
        }}
      />

      {/* 5. Print Label & QR Code Modal */}
      <PrintLabelModal
        isOpen={isPrintLabelOpen}
        onClose={() => setIsPrintLabelOpen(false)}
        extinguisher={printingExtinguisher}
        companyName={settings.companyName}
      />

      {/* 6. External Recharge Order Modal */}
      <RechargeOrderModal
        isOpen={isRechargeOrderOpen}
        onClose={() => setIsRechargeOrderOpen(false)}
        rechargeUnits={rechargeOrderUnits}
        settings={settings}
      />

      {/* 7. Full Plant Inspection Report Modal */}
      <InspectionReportModal
        isOpen={isInspectionReportOpen}
        onClose={() => setIsInspectionReportOpen(false)}
        extinguishers={extinguishers}
        settings={settings}
      />

      {/* 8. Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetFactoryData={handleResetFactoryData}
        onClearAllExtinguishers={handleClearAllExtinguishers}
      />

      {/* 9. Import Spreadsheet Modal */}
      <ImportSpreadsheetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingExtinguishers={extinguishers}
        onApplyImport={handleApplyImport}
      />

      {/* 10. Hydrant Form Modal */}
      <HydrantFormModal
        isOpen={isHydrantFormOpen}
        onClose={() => setIsHydrantFormOpen(false)}
        onSave={handleSaveHydrant}
        editingHydrant={editingHydrant}
      />

      {/* 12. Hydrant Inspection Modal */}
      <HydrantInspectionModal
        isOpen={isHydrantInspectOpen}
        onClose={() => setIsHydrantInspectOpen(false)}
        hydrant={inspectingHydrant}
        onSaveInspection={(id, updated, newPlan) => {
          handleSaveHydrant(updated);
          if (newPlan) handleAddActionPlan(newPlan);

          const latestHyd = updated.inspections?.[0];
          const checks = latestHyd
            ? [
                latestHyd.valveOperant,
                latestHyd.cabinetConditionOk,
                latestHyd.hoseTestedOk,
                latestHyd.storzKeysPresent,
                latestHyd.nozzleOperant,
                latestHyd.unobstructed,
              ]
            : [true, true, true, true, true, true];
          const cCount = checks.filter(Boolean).length;
          const ncCount = checks.filter((c) => !c).length;
          const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const proto = `UISA-HID-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

          setCompletionSystemKey('hidrantes');
          setCompletionData({
            protocol: proto,
            systemName: `Hidrante ${updated.code} (${updated.locationDetails})`,
            docNumber: 'NBR 13714',
            revision: '01',
            unit: updated.sector.toUpperCase(),
            completedAt: `${formatDateBR(latestHyd?.date || new Date().toISOString().split('T')[0])} às ${nowTime}`,
            inspectorName: latestHyd?.inspectorName || 'Brigada de Emergência / SST',
            signatureType: 'digital',
            totalItems: 6,
            conformCount: cCount,
            nonConformCount: ncCount,
            naCount: 0,
            actionPlansCreated: newPlan ? 1 : 0,
            qrVerifiedCount: latestHyd?.verificationMethod === 'manual_fallback' ? 0 : 1,
            manualFallbackCount: latestHyd?.verificationMethod === 'manual_fallback' ? 1 : 0,
            notes: latestHyd?.notes,
          });
          setIsCompletionModalOpen(true);
        }}
      />

      {/* 13. Delete Extinguisher with Mandatory Reason Modal */}
      <DeleteExtinguisherModal
        isOpen={isDeleteExtinguisherOpen}
        onClose={() => {
          setIsDeleteExtinguisherOpen(false);
          setDeletingExtinguisher(null);
        }}
        extinguisher={deletingExtinguisher}
        onConfirmDelete={handleConfirmDeleteExtinguisher}
      />

      {/* 14. Checklist PDF Archive Modal (Armazenamento de Checklists em PDF de Todas as Abas) */}
      <ChecklistPdfArchiveModal
        isOpen={isPdfArchiveOpen}
        onClose={() => setIsPdfArchiveOpen(false)}
        initialSystemFilter={pdfArchiveInitialSystem}
      />

      {/* 15. Confirmação de Finalização de Checklist (Extintores & Hidrantes) */}
      <ChecklistCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        data={completionData}
        onViewPdf={() => setIsInspectionReportOpen(true)}
        onOpenPdfArchive={() => handleOpenPdfArchive(completionSystemKey)}
      />

      {/* 16. Modal Versão Celular (PWA Install, QR Code & Preview Mobile) */}
      <MobileAppInstallModal
        isOpen={isMobileAppModalOpen}
        onClose={() => setIsMobileAppModalOpen(false)}
      />

      {/* 17. Barra de Navegação Inferior Mobile & Drawer de Módulos */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        openNcCount={actionPlans.filter((p) => p.status !== 'finalizado').length}
        alertsCount={alerts.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenPdfArchive={() => handleOpenPdfArchive('todos')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMobileInstall={() => setIsMobileAppModalOpen(true)}
      />

      {/* 18. Indicador de Modo Offline PWA */}
      <OfflineIndicator />
    </div>
  );
}
