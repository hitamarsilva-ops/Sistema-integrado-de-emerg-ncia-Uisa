import React, { useRef } from 'react';
import {
  X,
  Settings,
  Building2,
  Bell,
  Volume2,
  Mail,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings } from '../types/extinguisher';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetFactoryData?: () => void;
  onClearAllExtinguishers?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onResetFactoryData,
  onClearAllExtinguishers,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportJson(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960]">
              <Settings className="w-5 h-5 text-[#007960]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Configurações do Sistema</h2>
              <p className="text-xs text-slate-600">
                Parâmetros operacionais, empresa, alertas e gerenciamento de base de dados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Company details */}
          <div className="space-y-3 bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#007960]" />
              <span>Identificação da Empresa / Planta</span>
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Razão Social / Nome da Empresa:</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => onUpdateSettings({ companyName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nome da Unidade Industrial / Planta:</label>
              <input
                type="text"
                value={settings.industrialPlantName}
                onChange={(e) => onUpdateSettings({ industrialPlantName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">E-mail SESMT para Alertas:</label>
              <input
                type="email"
                value={settings.notificationEmailRecipient}
                onChange={(e) => onUpdateSettings({ notificationEmailRecipient: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              />
            </div>
          </div>

          {/* Alert rules */}
          <div className="space-y-3 bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#007960]" />
              <span>Prazos de Notificação Automática</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Alerta Amarelo (Atenção):</label>
                <select
                  value={settings.warningThresholdDays}
                  onChange={(e) => onUpdateSettings({ warningThresholdDays: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-[#007960]"
                >
                  <option value={15}>15 dias antes</option>
                  <option value={30}>30 dias antes</option>
                  <option value={45}>45 dias antes</option>
                  <option value={60}>60 dias antes</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Alerta Vermelho (Crítico):</label>
                <select
                  value={settings.criticalThresholdDays}
                  onChange={(e) => onUpdateSettings({ criticalThresholdDays: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-[#007960]"
                >
                  <option value={3}>3 dias antes</option>
                  <option value={7}>7 dias antes</option>
                  <option value={10}>10 dias antes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Backup & Data Persistence */}
          <div className="space-y-3 bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#007960]" />
              <span>Backup e Gerenciamento da Base de Dados</span>
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Os dados são mantidos com segurança no banco local do seu navegador. Você pode exportar backups em JSON ou zerar a base para importar novas planilhas.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={onExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#007960]" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#007960]" />
                <span>Importar Backup (JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              {onClearAllExtinguishers && (
                <button
                  onClick={() => {
                    onClearAllExtinguishers();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#de2726] font-bold border border-red-300 transition-colors shadow-2xs ml-auto"
                  title="Excluir todos os extintores cadastrados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#de2726]" />
                  <span>Excluir Todos os Extintores</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end bg-[#f8faf9]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors"
          >
            Concluir e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
