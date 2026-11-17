import React, { useState, useEffect } from 'react';
import {
  Flame,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Settings,
  ShieldCheck,
  Search,
  FileSpreadsheet,
  Award,
  BarChart3,
  PhoneCall,
  Smartphone,
  X,
} from 'lucide-react';
import { AppSettings, NotificationAlert } from '../types/extinguisher';
import { playIndustrialSound } from '../utils/audioAlerts';
import { getNotificationPermission, requestDesktopNotificationPermission } from '../utils/notificationService';
import { UisaLogo } from './UisaLogo';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DesktopHeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  alerts: NotificationAlert[];
  onOpenNotifications: () => void;
  onOpenNewExtinguisherModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalCount: number;
  onOpenCharts?: () => void;
  onOpenMobileAppModal?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  settings,
  onUpdateSettings,
  alerts,
  onOpenNotifications,
  onOpenNewExtinguisherModal,
  onOpenSettingsModal,
  onOpenImportModal,
  onExportCsv,
  onExportJson,
  onImportJson,
  searchQuery,
  onSearchChange,
  totalCount,
  onOpenCharts,
  onOpenMobileAppModal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [notificationPerm, setNotificationPerm] = useState<string>('default');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const { isInstalled } = usePWAInstall();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setNotificationPerm(getNotificationPermission());
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const criticalAlertsCount = alerts.filter((a) => a.urgency === 'critica').length;
  const totalAlertsCount = alerts.length;

  const handleSoundToggle = () => {
    const nextState = !settings.enableSoundAlerts;
    onUpdateSettings({ enableSoundAlerts: nextState });
    if (nextState) {
      playIndustrialSound('ping');
    }
  };

  const handleEnableDesktopNotifications = async () => {
    const granted = await requestDesktopNotificationPermission();
    setNotificationPerm(granted ? 'granted' : 'denied');
    if (granted) {
      onUpdateSettings({ enableDesktopNotifications: true });
      playIndustrialSound('success');
    }
  };

  return (
    <header className="border-b border-[#007960]/20 bg-white sticky top-0 z-40 select-none shadow-xs">
      {/* Compact Mobile Top App Bar (< md) */}
      <div className="md:hidden px-3 py-2 flex items-center justify-between gap-2 h-14">
        <div className="flex items-center gap-2 min-w-0">
          <UisaLogo size="sm" variant="color" />
          <div className="min-w-0">
            <span className="text-sm font-black text-slate-900 tracking-tight block truncate leading-tight">
              SGE UISA
            </span>
            <span className="text-[10px] font-mono text-[#007960] font-bold block leading-none">
              Emergências
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            className={`p-2 rounded-xl border min-h-[42px] min-w-[42px] flex items-center justify-center transition-colors ${
              isMobileSearchOpen || searchQuery
                ? 'bg-emerald-50 text-[#007960] border-[#007960]/40'
                : 'bg-[#f8faf9] text-slate-700 border-slate-200'
            }`}
            title="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>

          <a
            href="tel:3737"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-red-50 border border-red-200 text-[#de2726] font-mono font-black text-xs min-h-[42px]"
            title="Ligar Ramal 3737"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>3737</span>
          </a>

          <button
            type="button"
            onClick={() => {
              if (settings.enableSoundAlerts) playIndustrialSound('ping');
              onOpenNotifications();
            }}
            className={`relative p-2 rounded-xl min-h-[42px] min-w-[42px] flex items-center justify-center transition-colors ${
              criticalAlertsCount > 0
                ? 'bg-[#de2726] text-white'
                : totalAlertsCount > 0
                ? 'bg-[#f58220] text-white'
                : 'bg-emerald-50 text-[#007960] border border-[#007960]/30'
            }`}
            title="Notificações"
          >
            {criticalAlertsCount > 0 ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {totalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-slate-900 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {totalAlertsCount}
              </span>
            )}
          </button>

          {onOpenMobileAppModal && !isInstalled && (
            <button
              type="button"
              onClick={onOpenMobileAppModal}
              className="p-2 rounded-xl bg-[#007960] text-white min-h-[42px] min-w-[42px] flex items-center justify-center shadow-2xs"
              title="Instalar App no Celular"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Strip */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-3 pb-2.5 pt-1 border-t border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar Código, Tag, Setor..."
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960]"
            />
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setIsMobileSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full Desktop Header Bar (>= md) */}
      <div className="hidden md:flex px-5 py-3 flex-wrap items-center justify-between gap-4">
        {/* Brand Identity: Pristine Uisa Logo */}
        <div className="flex items-center gap-3">
          <UisaLogo size="md" variant="color" />
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <h1 className="text-[17px] sm:text-[19px] font-black text-slate-900 tracking-tight font-sans leading-tight">
              Sistema Integrado de Gestão de Emergências
            </h1>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">
              {currentDate} • <span className="font-mono text-[#007960] font-bold">{currentTime}</span>
            </span>
          </div>
        </div>

        {/* Global Quick Search */}
        <div className="flex-1 max-w-lg min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por Código/Tag, Selo, Setor, Ponto ou Responsável..."
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg pl-10 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960] transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Controls with HIGHLIGHTED NOTIFICATIONS & RAMAL 3737 */}
        <div className="flex items-center gap-2.5">
          {/* Ramal de Emergência: 3737 Oficial */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 shadow-2xs shrink-0"
            title="Ramal Telefônico de Emergência UISA: 3737 (24 Horas)"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#de2726] animate-pulse" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-800">Ramal Emergência</span>
              <span className="text-sm font-black font-mono text-[#de2726] tracking-wider">3737</span>
            </div>
          </div>

          {/* Notification Alert Trigger - Em destaque conforme solicitado */}
          <button
            onClick={() => {
              if (settings.enableSoundAlerts) playIndustrialSound('ping');
              onOpenNotifications();
            }}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
              criticalAlertsCount > 0
                ? 'bg-[#de2726] text-white hover:bg-[#c41f1e] ring-2 ring-[#de2726]/50 animate-pulse'
                : totalAlertsCount > 0
                ? 'bg-[#f58220] text-white hover:bg-[#e07519] ring-2 ring-[#f58220]/40'
                : 'bg-emerald-50 text-[#007960] border border-[#007960]/30 hover:bg-[#007960] hover:text-white'
            }`}
            title="Ver Central de Notificações e Alertas"
          >
            {criticalAlertsCount > 0 ? (
              <BellRing className="w-4 h-4 text-white animate-bounce" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            <span>Notificações</span>
            {totalAlertsCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-black/40 text-white">
                {totalAlertsCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#007960]" title="Sem alertas pendentes" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              settings.enableSoundAlerts
                ? 'bg-emerald-50 text-[#007960] border-[#007960]/30 hover:bg-emerald-100'
                : 'bg-[#f8faf9] text-slate-400 border-slate-200 hover:bg-slate-100'
            }`}
            title={settings.enableSoundAlerts ? 'Alertas Sonoros: ATIVADOS' : 'Alertas Sonoros: SILENCIADOS'}
          >
            {settings.enableSoundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Desktop Push Notification Permission Request (if not yet granted) */}
          {notificationPerm !== 'granted' && (
            <button
              onClick={handleEnableDesktopNotifications}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-[#007960] hover:bg-[#007960] hover:text-white border border-[#007960]/40 text-xs transition-colors flex items-center gap-1.5"
              title="Ativar Notificações do Navegador"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Alertas Desktop</span>
            </button>
          )}

          {/* Mobile App (PWA) & QR Code Trigger */}
          {onOpenMobileAppModal && (
            <button
              type="button"
              onClick={onOpenMobileAppModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-[#007960] hover:bg-[#007960] hover:text-white border border-[#007960]/30 text-xs font-bold transition-colors whitespace-nowrap shrink-0"
              title="Abrir ou Instalar Versão Celular (QR Code & PWA)"
            >
              <Smartphone className="w-4 h-4" />
              <span>App Celular</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#f8faf9] text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-xs transition-colors"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-lg bg-[#f8faf9] text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-xs transition-colors"
            title="Configurações e Parâmetros"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
