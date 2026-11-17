import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  QrCode,
  Share,
  PlusSquare,
  CheckCircle2,
  Copy,
  Check,
  X,
  Wifi,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppInstallModal: React.FC<MobileAppInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'instalar' | 'preview'>('instalar');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (!isOpen || !appUrl) return;
    QRCode.toDataURL(appUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#007960',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    if (!appUrl) return;
    navigator.clipboard?.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in print:hidden">
      <div className="bg-white border-2 border-[#007960] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="bg-[#007960] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                Versão Celular — SGE UISA Mobile (PWA)
              </h3>
              <p className="text-[11px] text-emerald-100">
                Instale na tela inicial do celular Android/iPhone para inspeções em campo, QR Code e Biometria Facial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher (Desktop preview vs Install instructions) */}
        <div className="px-5 pt-3 pb-2 bg-[#f8faf9] border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('instalar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'instalar'
                ? 'bg-[#007960] text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar & Abrir no Celular</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`hidden md:flex px-3.5 py-2 rounded-xl text-xs font-bold transition-colors items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-[#007960] text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pré-visualizar Tela Celular (390×720)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'instalar' ? (
            <>
              {/* Direct Install Banner */}
              {isInstalled ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-[#007960]/40 flex items-center gap-3 text-[#007960]">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <strong className="text-sm font-black block">Aplicativo Instalado no Dispositivo!</strong>
                    <span className="text-xs text-slate-700">
                      Você já está executando a versão instalada (modo aplicativo independente).
                    </span>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-[#007960] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="text-sm font-black text-slate-900 block">
                      Instalação Direta Disponível
                    </strong>
                    <span className="text-xs text-slate-700">
                      Clique ao lado para instalar o SGE UISA diretamente na tela inicial deste aparelho.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={install}
                    className="px-5 py-3 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 min-h-[44px]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar App Agora</span>
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* QR Code Card for opening on Phone */}
                <div className="bg-[#f8faf9] border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center gap-1.5 text-[#007960] font-black text-xs uppercase">
                    <QrCode className="w-4 h-4" />
                    <span>Abrir Direto no Celular via QR Code</span>
                  </div>

                  {qrDataUrl ? (
                    <div className="p-2.5 bg-white rounded-2xl border border-[#007960]/30 shadow-xs">
                      <img
                        src={qrDataUrl}
                        alt="QR Code para abrir no celular"
                        className="w-44 h-44"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 rounded-2xl bg-slate-100 animate-pulse" />
                  )}

                  <p className="text-[11px] text-slate-600 leading-snug">
                    Aponte a câmera do celular para o QR Code acima para abrir a versão mobile diretamente no smartphone.
                  </p>

                  <div className="w-full flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={appUrl}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono text-[10px] text-slate-600 truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-3 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white font-bold text-[11px] flex items-center gap-1 shrink-0 min-h-[38px]"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Android & iOS Installation Steps */}
                <div className="space-y-3">
                  {/* Android Chrome */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                    <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs uppercase">
                      <span className="w-2 h-2 rounded-full bg-[#007960]" />
                      <span>Android (Google Chrome / Edge)</span>
                    </h4>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-700">
                      <li>Abra o link acima ou escaneie o QR Code no Chrome do celular.</li>
                      <li>
                        Toque no botão <strong>Instalar App</strong> (ou no menu <strong>⋮</strong> do navegador).
                      </li>
                      <li>
                        Selecione <strong>Instalar aplicativo</strong> / <strong>Adicionar à tela inicial</strong>.
                      </li>
                    </ol>
                  </div>

                  {/* iOS Safari */}
                  <div
                    className={`bg-white border rounded-2xl p-4 space-y-2 ${
                      isIOS ? 'border-[#007960] ring-2 ring-[#007960]/20' : 'border-slate-200'
                    }`}
                  >
                    <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs uppercase">
                      <Share className="w-3.5 h-3.5 text-[#007960]" />
                      <span>iPhone / iPad (Safari iOS)</span>
                    </h4>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-700">
                      <li>Abra o endereço no navegador <strong>Safari</strong>.</li>
                      <li>
                        Toque no ícone <strong>Compartilhar</strong>{' '}
                        <span className="font-mono text-[#007960]">(quadrado com seta)</span> na barra inferior.
                      </li>
                      <li>
                        Role e toque em{' '}
                        <strong className="inline-flex items-center gap-1">
                          <PlusSquare className="w-3 h-3 inline text-[#007960]" /> Adicionar à Tela de Início
                        </strong>.
                      </li>
                    </ol>
                  </div>

                  {/* Mobile capabilities */}
                  <div className="bg-emerald-50/70 border border-[#007960]/20 rounded-2xl p-3.5 space-y-1.5 text-[11px] text-slate-700">
                    <div className="font-bold text-[#007960] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Recursos Otimizados no Celular:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#007960] shrink-0" />
                      <span>Câmera traseira para QR Code e câmera frontal para Facial/Ata.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-[#007960] shrink-0" />
                      <span>Cache offline (PWA) para uso em campo mesmo com sinal fraco.</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Live Smartphone Preview Frame */
            <div className="flex flex-col items-center space-y-3">
              <p className="text-[11px] text-slate-600 text-center">
                Visualização interativa da interface mobile (<strong>390 × 700 px</strong>) com barra de navegação inferior para polegar:
              </p>
              <div className="p-3 bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-slate-700">
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
                <div className="w-[390px] h-[640px] bg-white rounded-[1.75rem] overflow-hidden border border-slate-800">
                  <iframe
                    src={appUrl}
                    title="Pré-visualização Celular SGE UISA"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
