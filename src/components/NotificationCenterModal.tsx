import React, { useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Mail,
  Copy,
  Check,
  Clock,
  MapPin,
  Settings,
  Send,
} from 'lucide-react';
import {
  AppSettings,
  NotificationAlert,
} from '../types/extinguisher';
import { formatDateBR, isWarehouseSector, SECTOR_MAP, TYPE_MAP } from '../utils/formatters';
import { playIndustrialSound } from '../utils/audioAlerts';
import { dispatchDesktopNotification, requestDesktopNotificationPermission } from '../utils/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: NotificationAlert[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenQuickSwapWithExtinguisherId: (id: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  alerts,
  settings,
  onUpdateSettings,
  onOpenQuickSwapWithExtinguisherId,
}) => {
  const [activeTab, setActiveTab] = useState<'alertas' | 'config' | 'email'>('alertas');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'todos' | 'critica' | 'atencao'>('todos');

  if (!isOpen) return null;

  const criticalCount = alerts.filter((a) => a.urgency === 'critica').length;
  const warningCount = alerts.filter((a) => a.urgency === 'atencao').length;

  const displayedAlerts = alerts.filter((a) => {
    if (filterSeverity === 'todos') return true;
    return a.urgency === filterSeverity;
  });

  const handleTestNotification = async () => {
    if (settings.enableSoundAlerts) {
      playIndustrialSound('warning');
    }
    const granted = await requestDesktopNotificationPermission();
    if (granted || Notification.permission === 'granted') {
      dispatchDesktopNotification(
        'ExtintorPRO Alerta de Teste',
        'Sistema de notificação desktop operacional. Você será avisado quando a recarga estiver próxima.',
        'test-alert'
      );
    }
  };

  // Generate Email text for SESMT / Fire Safety Team
  const generateEmailReportText = () => {
    let text = `RELATÓRIO DE MONITORAMENTO DE EXTINTORES - SESMT / BRIGADA\n`;
    text += `Empresa: ${settings.companyName} | ${settings.industrialPlantName}\n`;
    text += `Data da Emissão: ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `Total de Alertas de Vencimento: ${alerts.length}\n`;
    text += `------------------------------------------------------------\n\n`;

    const expired = alerts.filter((a) => a.daysRemaining < 0);
    if (expired.length > 0) {
      text += `🚨 EXTINTORES COM RECARGA VENCIDA (AÇÃO IMEDIATA):\n`;
      expired.forEach((a) => {
        text += `- [${a.extinguisherCode}] Setor: ${SECTOR_MAP[a.sector]?.name} | Ponto: ${a.locationDetails} | Tipo: ${TYPE_MAP[a.type]?.name} (${a.capacityWeight}) | Vencido em: ${a.expiryDate} (${Math.abs(a.daysRemaining)} dias em atraso)\n`;
      });
      text += `\n`;
    }

    const warning = alerts.filter((a) => a.daysRemaining >= 0);
    if (warning.length > 0) {
      text += `⚠️ EXTINTORES COM VENCIMENTO PRÓXIMO (< ${settings.warningThresholdDays} DIAS):\n`;
      warning.forEach((a) => {
        text += `- [${a.extinguisherCode}] Setor: ${SECTOR_MAP[a.sector]?.name} | Ponto: ${a.locationDetails} | Tipo: ${TYPE_MAP[a.type]?.name} (${a.capacityWeight}) | Vence em: ${a.expiryDate} (${a.daysRemaining} dias restantes)\n`;
      });
    }

    text += `\nSolicitamos a providência de troca imediata das unidades vencidas através da reserva técnica do Almoxarifado.\n`;
    text += `Atenciosamente,\nEquipe de Segurança do Trabalho - ExtintorPRO`;
    return text;
  };

  const handleCopyEmail = () => {
    const text = generateEmailReportText();
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[#de2726]">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Central de Notificações Automáticas</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-[#de2726] border border-red-200 font-bold">
                  {alerts.length} Notificações
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Monitoramento contínuo de vencimento de recarga anual e reteste hidrostático.
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

        {/* Navigation Tabs inside modal */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-white text-xs">
          <button
            onClick={() => setActiveTab('alertas')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'alertas'
                ? 'border-[#007960] text-[#007960]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alertas Ativos ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-[#007960] text-[#007960]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Disparo para SESMT</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-[#007960] text-[#007960]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Regras de Notificação</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'alertas' && (
            <div className="space-y-3">
              {/* Filter pills */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFilterSeverity('todos')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      filterSeverity === 'todos' ? 'bg-[#007960] text-white' : 'bg-[#f8faf9] text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Todos ({alerts.length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('critica')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      filterSeverity === 'critica' ? 'bg-[#de2726] text-white' : 'bg-red-50 text-[#de2726] border border-red-200 hover:bg-red-100'
                    }`}
                  >
                    Críticos ({criticalCount})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('atencao')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      filterSeverity === 'atencao' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    Atenção ({warningCount})
                  </button>
                </div>

                <button
                  onClick={handleTestNotification}
                  className="text-[#007960] hover:underline text-[11px] flex items-center gap-1 font-semibold"
                >
                  Testar alerta sonoro & push
                </button>
              </div>

              {/* Alerts List */}
              <div className="space-y-2.5">
                {displayedAlerts.map((alert) => {
                  const isCrit = alert.urgency === 'critica';
                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCrit
                          ? 'bg-red-50/70 border-red-300 shadow-2xs'
                          : 'bg-amber-50/60 border-amber-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                            isCrit ? 'bg-[#de2726] text-white' : 'bg-amber-500 text-white'
                          }`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs">{alert.title}</span>
                              <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                                isCrit ? 'bg-red-100 text-[#de2726] border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {isCrit ? 'Crítico' : 'Atenção'}
                              </span>
                            </div>

                            <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                              {alert.message}
                            </p>

                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 flex-wrap">
                              {alert.sector && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#de2726]" />
                                  {SECTOR_MAP[alert.sector]?.name || alert.sector}
                                </span>
                              )}
                              {alert.type && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {TYPE_MAP[alert.type]?.acro || alert.type} {alert.capacityWeight ? `(${alert.capacityWeight})` : ''}
                                  </span>
                                </>
                              )}
                              {alert.expiryDate && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-slate-800 font-semibold">
                                    Data/Prazo: {formatDateBR(alert.expiryDate)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {alert.daysRemaining <= 0 && !isWarehouseSector(alert.sector) && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenQuickSwapWithExtinguisherId(alert.extinguisherId);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#de2726] hover:bg-[#c41f1e] text-white font-bold text-[11px] shadow transition-colors"
                            >
                              Trocar c/ Almoxarifado
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {displayedAlerts.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-[#007960] mx-auto mb-2 opacity-80" />
                    Nenhuma notificação ativa para os filtros selecionados.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#f8faf9] border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#007960]" />
                    <span className="font-bold text-slate-900">Mensagem Formatada para SESMT / CIPA</span>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#007960]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {generateEmailReportText()}
                </pre>
              </div>

              <div className="flex items-center justify-between bg-[#f8faf9] p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-600 block text-[11px]">Destinatário configurado:</span>
                  <strong className="text-slate-900">{settings.notificationEmailRecipient}</strong>
                </div>
                <a
                  href={`mailto:${settings.notificationEmailRecipient}?subject=Alerta%20de%20Vencimento%20de%20Extintores%20-${encodeURIComponent(settings.companyName)}&body=${encodeURIComponent(generateEmailReportText())}`}
                  className="px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Abrir no Cliente de E-mail</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4 bg-[#f8faf9] p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[#007960]" />
                <span>Parâmetros de Disparo Automático</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Warning days threshold */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Antecedência do Alerta Amarelo (Atenção):
                  </label>
                  <select
                    value={settings.warningThresholdDays}
                    onChange={(e) => onUpdateSettings({ warningThresholdDays: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#007960]"
                  >
                    <option value={15}>15 Dias de antecedência</option>
                    <option value={30}>30 Dias de antecedência (Recomendado)</option>
                    <option value={45}>45 Dias de antecedência</option>
                    <option value={60}>60 Dias de antecedência</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Gera notificação prévia para agendamento de recarga com a empresa contratada.
                  </span>
                </div>

                {/* Critical threshold */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Antecedência do Alerta Vermelho (Crítico):
                  </label>
                  <select
                    value={settings.criticalThresholdDays}
                    onChange={(e) => onUpdateSettings({ criticalThresholdDays: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#007960]"
                  >
                    <option value={3}>3 Dias antes do vencimento</option>
                    <option value={7}>7 Dias antes do vencimento (Padrão)</option>
                    <option value={10}>10 Dias antes do vencimento</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Dispara alerta sonoro e notificação desktop prioritária.
                  </span>
                </div>

                {/* Sound Alerts Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Sons de Alerta Industrial</span>
                    <span className="text-[11px] text-slate-500">Bips sintetizados para eventos críticos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableSoundAlerts}
                    onChange={(e) => onUpdateSettings({ enableSoundAlerts: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#007960] focus:ring-[#007960] cursor-pointer"
                  />
                </div>

                {/* Desktop Push Notifications */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Notificações Nativas Desktop</span>
                    <span className="text-[11px] text-slate-500">Pop-ups nativos do SO ao aproximar o prazo</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableDesktopNotifications}
                    onChange={(e) => onUpdateSettings({ enableDesktopNotifications: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#007960] focus:ring-[#007960] cursor-pointer"
                  />
                </div>
              </div>

              {/* Email recipient */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  E-mail do SESMT / Segurança do Trabalho:
                </label>
                <input
                  type="email"
                  value={settings.notificationEmailRecipient}
                  onChange={(e) => onUpdateSettings({ notificationEmailRecipient: e.target.value })}
                  placeholder="sesmt@suaempresa.com.br"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-[#f8faf9] text-xs">
          <span className="text-slate-600">
            Avisos de conformidade calculados diariamente às 08:00 e em tempo real.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
