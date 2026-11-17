import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  X,
  QrCode,
  Camera,
  CameraOff,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Keyboard,
  RefreshCw,
  ClipboardEdit,
} from 'lucide-react';
import { parseEquipmentQrPayload } from '../utils/qrCodeGenerator';
import { playIndustrialSound } from '../utils/audioAlerts';

export interface QrScannableItem {
  id: string;
  code: string;
  locationDetails: string;
  secondaryCode?: string; // e.g. cabinetNumber or inmetroSeal
  verifiedMethod?: 'qr_scan' | 'manual_fallback' | null;
}

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentKind: 'extintor' | 'hidrante';
  expectedItem?: QrScannableItem | null;
  items?: QrScannableItem[];
  onQrMatched: (matchedItemId: string, rawPayload: string) => void;
  onManualFallback?: (itemId: string, reason: string) => void;
}

const READ_ERROR_REASONS = [
  'Etiqueta QR danificada, rasgada ou ilegível',
  'Equipamento sem etiqueta QR física instalada',
  'Câmera indisponível / falha de foco / baixa iluminação',
  'Equipamento em local de difícil acesso para leitura com câmera',
  'Outro motivo técnico de erro de leitura',
];

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  equipmentKind,
  expectedItem = null,
  items = [],
  onQrMatched,
  onManualFallback,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ payload: string; time: number }>({ payload: '', time: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerInput, setScannerInput] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Manual fallback state
  const [showManualPanel, setShowManualPanel] = useState(false);
  const [manualTargetId, setManualTargetId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>(READ_ERROR_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  const candidateItems: QrScannableItem[] = expectedItem ? [expectedItem] : items;
  const pendingItems = candidateItems.filter((it) => !it.verifiedMethod);
  const verifiedCount = candidateItems.length - pendingItems.length;

  const stopCamera = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleDecodedPayload = (raw: string) => {
    const now = Date.now();
    // Prevent duplicate rapid triggers of the exact same QR within 1.8s
    if (raw === lastScanRef.current.payload && now - lastScanRef.current.time < 1800) {
      return;
    }
    lastScanRef.current = { payload: raw, time: now };

    const parsed = parseEquipmentQrPayload(raw);
    const scannedCode = parsed.code.toUpperCase();

    if (!scannedCode) {
      setFeedback({
        type: 'error',
        message: 'QR Code vazio ou formato inválido. Tente aproximar a câmera ou use o checklist manual.',
      });
      playIndustrialSound('warning');
      return;
    }

    if (expectedItem) {
      const targetUpper = expectedItem.code.trim().toUpperCase();
      const secondaryUpper = expectedItem.secondaryCode?.trim().toUpperCase();
      if (scannedCode === targetUpper || (secondaryUpper && scannedCode === secondaryUpper) || scannedCode === expectedItem.id.toUpperCase()) {
        playIndustrialSound('success');
        setFeedback({
          type: 'success',
          message: `QR Code lido com sucesso: ${expectedItem.code}`,
        });
        onQrMatched(expectedItem.id, raw);
        stopCamera();
        setTimeout(() => {
          onClose();
        }, 450);
      } else {
        playIndustrialSound('warning');
        setFeedback({
          type: 'error',
          message: `QR lido pertence a "${scannedCode}", mas o checklist aberto exige "${expectedItem.code}".`,
        });
      }
      return;
    }

    // Batch mode: match against any item in items[]
    const matched = items.find((it) => {
      const c = it.code.trim().toUpperCase();
      const sec = it.secondaryCode?.trim().toUpperCase();
      return c === scannedCode || (sec && sec === scannedCode) || it.id.toUpperCase() === scannedCode;
    });

    if (!matched) {
      playIndustrialSound('warning');
      setFeedback({
        type: 'error',
        message: `Código "${scannedCode}" não pertence aos ${equipmentKind === 'extintor' ? 'extintores' : 'hidrantes'} deste checklist.`,
      });
      return;
    }

    if (matched.verifiedMethod === 'qr_scan') {
      setFeedback({
        type: 'info',
        message: `${matched.code} já teve o QR Code lido nesta sessão.`,
      });
      return;
    }

    playIndustrialSound('success');
    onQrMatched(matched.id, raw);
    setFeedback({
      type: 'success',
      message: `✓ ${matched.code} (${matched.locationDetails}) confirmado via QR Code!`,
    });
  };

  const scanVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          handleDecodedPayload(code.data);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Câmera não suportada neste navegador/dispositivo. Use o leitor USB, envie foto do QR ou libere o checklist manual por erro de leitura.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
    } catch {
      setCameraError(
        'Não foi possível acessar a câmera (permissão negada ou câmera ausente). Utilize o upload de imagem do QR, leitor USB ou libere o checklist manual.'
      );
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    setFeedback(null);
    setScannerInput('');
    setShowManualPanel(false);
    setSelectedReason(READ_ERROR_REASONS[0]);
    setCustomReason('');
    setManualTargetId(expectedItem?.id || pendingItems[0]?.id || candidateItems[0]?.id || '');
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, expectedItem?.id]);

  // Keep manualTargetId pointing to a pending item when batch items update
  useEffect(() => {
    if (!isOpen) return;
    if (expectedItem) {
      setManualTargetId(expectedItem.id);
    } else if (!pendingItems.some((p) => p.id === manualTargetId)) {
      setManualTargetId(pendingItems[0]?.id || '');
    }
  }, [isOpen, items.length, pendingItems.length]);

  if (!isOpen) return null;

  const handleImageFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (decoded && decoded.data) {
          handleDecodedPayload(decoded.data);
        } else {
          playIndustrialSound('warning');
          setFeedback({
            type: 'error',
            message:
              'Nenhum QR Code legível foi detectado na imagem enviada. Caso haja erro de leitura, utilize o Checklist Manual abaixo.',
          });
          setShowManualPanel(true);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleScannerInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput.trim()) return;
    handleDecodedPayload(scannerInput.trim());
    setScannerInput('');
  };

  const handleConfirmManualFallback = () => {
    if (!onManualFallback) return;
    const targetId = expectedItem?.id || manualTargetId;
    if (!targetId) return;

    const reasonText =
      selectedReason === READ_ERROR_REASONS[4] && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    onManualFallback(targetId, reasonText);
    playIndustrialSound('ping');
    setShowManualPanel(false);
    setCustomReason('');

    const targetCode = candidateItems.find((i) => i.id === targetId)?.code || targetId;
    setFeedback({
      type: 'info',
      message: `Checklist manual liberado para ${targetCode} (Motivo: ${reasonText}).`,
    });

    if (expectedItem) {
      stopCamera();
      setTimeout(() => onClose(), 350);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border-2 border-[#007960]/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#007960] to-[#005a47] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded font-bold">
                Leitura Obrigatória QR Code • {equipmentKind === 'extintor' ? 'Extintores' : 'Hidrantes'}
              </span>
              <h3 className="text-base font-black tracking-tight mt-0.5">
                {expectedItem
                  ? `Escanear QR Code: ${expectedItem.code}`
                  : `Leitor de QR Code do Checklist (${verifiedCount}/${candidateItems.length} verificados)`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Batch progress bar */}
          {!expectedItem && candidateItems.length > 0 && (
            <div className="bg-[#f8faf9] border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  Progresso de Leitura dos Equipamentos Cadastrados:
                </span>
                <span className="font-mono font-bold text-[#007960]">
                  {verifiedCount} / {candidateItems.length} ({pendingItems.length} pendente{pendingItems.length === 1 ? '' : 's'})
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007960] transition-all duration-300"
                  style={{
                    width: `${candidateItems.length > 0 ? Math.round((verifiedCount / candidateItems.length) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Live Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-[#007960]/40 text-[#007960]'
                  : feedback.type === 'error'
                  ? 'bg-red-50 border-red-300 text-[#de2726]'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Camera Viewport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative min-h-[220px] flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-56 object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraActive ? (
                <>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] relative">
                      <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400/80 animate-pulse" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-mono text-white bg-black/60 px-2 py-1 rounded-lg">
                    Aponte a câmera para o QR Code da etiqueta UISA
                  </span>
                </>
              ) : (
                <div className="p-5 text-center space-y-2.5 text-slate-300">
                  <CameraOff className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-[11px] leading-relaxed">
                    {cameraError || 'Iniciando leitor de câmera...'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white font-bold text-[11px] transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar Câmera Novamente</span>
                  </button>
                </div>
              )}
            </div>

            {/* Alternative QR Reading Methods (Image Upload + USB Scanner Input) */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="p-3.5 rounded-2xl bg-[#f8faf9] border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Upload className="w-4 h-4 text-[#007960]" />
                  <span>Ler QR por Foto / Imagem da Etiqueta</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Selecione uma foto tirada do QR Code ou a imagem PNG salva da etiqueta.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileScan}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#007960] border border-[#007960]/40 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Selecionar / Fotografar QR Code</span>
                </button>
              </div>

              <form
                onSubmit={handleScannerInputSubmit}
                className="p-3.5 rounded-2xl bg-[#f8faf9] border border-slate-200 space-y-2"
              >
                <label className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Keyboard className="w-4 h-4 text-[#007960]" />
                  <span>Leitor Óptico USB / Código Lido</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={scannerInput}
                    onChange={(e) => setScannerInput(e.target.value)}
                    placeholder={
                      expectedItem
                        ? `Ex: ${expectedItem.code} ou UISA:...`
                        : equipmentKind === 'extintor'
                        ? 'Ex: EXT-IND-01 ou UISA:EXT:...'
                        : 'Ex: HID-01 ou UISA:HID:...'
                    }
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold transition-colors"
                  >
                    Validar
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Pending list in batch mode */}
          {!expectedItem && candidateItems.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-600 block">
                Status dos Equipamentos neste Checklist:
              </span>
              <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {candidateItems.map((it) => (
                  <div
                    key={it.id}
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                      it.verifiedMethod === 'qr_scan'
                        ? 'bg-emerald-50 border-emerald-200 text-[#007960]'
                        : it.verifiedMethod === 'manual_fallback'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-mono font-bold truncate">{it.code}</span>
                    <span className="text-[10px] font-bold shrink-0">
                      {it.verifiedMethod === 'qr_scan'
                        ? 'QR Lido ✓'
                        : it.verifiedMethod === 'manual_fallback'
                        ? 'Manual (Erro QR)'
                        : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error de leitura -> Liberar Checklist Manual */}
          {onManualFallback && (expectedItem || pendingItems.length > 0) && (
            <div className="border-t border-slate-200 pt-3">
              {!showManualPanel ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-semibold">
                      Etiqueta danificada, ausente ou erro de leitura na câmera?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualPanel(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  >
                    <ClipboardEdit className="w-3.5 h-3.5" />
                    <span>Erro de Leitura → Realizar Checklist Manual</span>
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <ClipboardEdit className="w-4 h-4 text-amber-700" />
                      <span>Liberação de Checklist Manual por Erro de Leitura QR</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowManualPanel(false)}
                      className="text-[11px] text-amber-800 hover:underline font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  {!expectedItem && pendingItems.length > 0 && (
                    <div>
                      <label className="block font-bold text-amber-900 mb-1">
                        Equipamento com Erro de Leitura:
                      </label>
                      <select
                        value={manualTargetId}
                        onChange={(e) => setManualTargetId(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                      >
                        {pendingItems.map((it) => (
                          <option key={it.id} value={it.id}>
                            [{it.code}] — {it.locationDetails}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      Motivo do Erro de Leitura QR (Obrigatório para Auditoria):
                    </label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                    >
                      {READ_ERROR_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedReason === READ_ERROR_REASONS[4] && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Descreva o motivo do erro de leitura..."
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmManualFallback}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors"
                  >
                    Confirmar Erro de Leitura e Liberar Checklist Manual
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-[#f8faf9] flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold text-xs transition-colors"
          >
            {!expectedItem && pendingItems.length === 0 ? 'Concluir Leitura e Preencher Checklist' : 'Voltar ao Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
