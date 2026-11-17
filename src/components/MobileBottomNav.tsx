import React, { useState } from 'react';
import {
  LayoutDashboard,
  Flame,
  Droplets,
  Users,
  Menu,
  Bell,
  Activity,
  ShieldAlert,
  FileCheck2,
  Smartphone,
  Settings,
  PhoneCall,
  X,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type AppTabKey =
  | 'dashboard'
  | 'extintores'
  | 'hidrantes'
  | 'alarmes'
  | 'bombas'
  | 'caminhao_pipa'
  | 'brigadistas'
  | 'pae';

interface MobileBottomNavProps {
  activeTab: AppTabKey;
  onSelectTab: (tab: AppTabKey) => void;
  openNcCount: number;
  alertsCount: number;
  onOpenNotifications: () => void;
  onOpenPdfArchive: () => void;
  onOpenSettings: () => void;
  onOpenMobileInstall: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  openNcCount,
  alertsCount,
  onOpenNotifications,
  onOpenPdfArchive,
  onOpenSettings,
  onOpenMobileInstall,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const isMoreTabActive =
    activeTab === 'alarmes' ||
    activeTab === 'bombas' ||
    activeTab === 'caminhao_pipa' ||
    activeTab === 'pae';

  const handleNavigate = (tab: AppTabKey) => {
    onSelectTab(tab);
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Mobile only, thumb-zone) */}
      <nav
        aria-label="Navegação Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] print:hidden"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
              activeTab === 'dashboard'
                ? 'text-[#007960] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Painel</span>
            {openNcCount > 0 && (
              <span className="absolute top-1.5 right-3 px-1 min-w-[16px] h-4 rounded-full bg-[#de2726] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {openNcCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('extintores')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
              activeTab === 'extintores'
                ? 'text-[#007960] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Extintores</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('hidrantes')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
              activeTab === 'hidrantes'
                ? 'text-[#007960] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Droplets className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Hidrantes</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('brigadistas')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
              activeTab === 'brigadistas'
                ? 'text-[#007960] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Brigada</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
              isMoreTabActive || isDrawerOpen
                ? 'text-[#007960] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Módulos</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Drawer for Remaining Modules & Field Actions */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in print:hidden"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 pb-8 max-h-[85dvh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Módulos & Ferramentas SGE</h3>
                <p className="text-[11px] text-slate-500">Acesso rápido em campo pelo celular</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Emergency Ramal 3737 Tap-to-call */}
            <a
              href="tel:3737"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#de2726] text-white flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black block">Emergência UISA 24h</span>
                  <span className="text-[11px] text-red-700">Toque para ligar no Ramal 3737</span>
                </div>
              </div>
              <span className="font-mono font-black text-base text-[#de2726]">3737</span>
            </a>

            {/* Primary Modules Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleNavigate('alarmes')}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-left min-h-[56px] ${
                  activeTab === 'alarmes'
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : 'bg-[#f8faf9] text-slate-800 border-slate-200'
                }`}
              >
                <Bell className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Alarmes</span>
                  <span className="text-[10px] opacity-80 block">SST.RE-020</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('bombas')}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-left min-h-[56px] ${
                  activeTab === 'bombas'
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : 'bg-[#f8faf9] text-slate-800 border-slate-200'
                }`}
              >
                <Activity className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Bombas & RTI</span>
                  <span className="text-[10px] opacity-80 block">Teste Semanal</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('caminhao_pipa')}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-left min-h-[56px] ${
                  activeTab === 'caminhao_pipa'
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : 'bg-[#f8faf9] text-slate-800 border-slate-200'
                }`}
              >
                <Flame className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Caminhão</span>
                  <span className="text-[10px] opacity-80 block">SST.RE-109</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('pae')}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-left min-h-[56px] ${
                  activeTab === 'pae'
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : 'bg-[#f8faf9] text-slate-800 border-slate-200'
                }`}
              >
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">PAE Oficial</span>
                  <span className="text-[10px] opacity-80 block">Emergências</span>
                </div>
              </button>
            </div>

            {/* Utility Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              {!isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    if (isInstallable) {
                      install();
                    } else {
                      setIsDrawerOpen(false);
                      onOpenMobileInstall();
                    }
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-[#007960]/40 text-[#007960] font-bold text-xs min-h-[48px]"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4" />
                    <span>Instalar App na Tela Inicial do Celular</span>
                  </div>
                  <Smartphone className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenPdfArchive();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-[#007960]" />
                  <span>Armazenamento de Checklists (PDF)</span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenNotifications();
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 text-slate-800 font-bold text-xs min-h-[46px]"
                >
                  <Bell className="w-4 h-4 text-[#007960]" />
                  <span>Alertas ({alertsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenSettings();
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 text-slate-800 font-bold text-xs min-h-[46px]"
                >
                  <Settings className="w-4 h-4 text-[#007960]" />
                  <span>Configurações</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
