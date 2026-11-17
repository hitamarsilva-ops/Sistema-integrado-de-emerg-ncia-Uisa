import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  User,
  Fingerprint,
  FileCheck,
} from 'lucide-react';

export interface SignatureData {
  type: 'facial' | 'digital';
  inspectorName: string;
  registrationNumber: string;
  signatureImage?: string; // Data URL da foto facial ou do canvas de rubrica
  timestamp: string;
  bioHash?: string;
}

interface ChecklistSignatureModuleProps {
  signature: SignatureData | null;
  onChangeSignature: (sig: SignatureData | null) => void;
  required?: boolean;
  hasAttemptedSubmit?: boolean;
}

export const ChecklistSignatureModule: React.FC<ChecklistSignatureModuleProps> = ({
  signature,
  onChangeSignature,
  required = true,
  hasAttemptedSubmit = false,
}) => {
  const [signatureMode, setSignatureMode] = useState<'facial' | 'digital'>('facial');
  const [inspectorName, setInspectorName] = useState(signature?.inspectorName || '');
  const [registrationNumber, setRegistrationNumber] = useState(signature?.registrationNumber || '');

  // Camera / Facial state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Digital canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Stop camera stream when switching modes or unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Erro ao acessar webcam:', err);
      setCameraError('Não foi possível iniciar a webcam. Use o envio de foto de rosto abaixo.');
      setIsCameraActive(false);
    }
  };

  const captureFacialPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      applySignature('facial', dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      applySignature('facial', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const applySignature = (type: 'facial' | 'digital', dataUrl?: string) => {
    const now = new Date();
    const hash = 'UISA-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + now.getTime().toString().slice(-4);
    onChangeSignature({
      type,
      inspectorName: inspectorName.trim() || 'Inspetor SST / Brigada',
      registrationNumber: registrationNumber.trim() || 'MAT-SST',
      signatureImage: dataUrl,
      timestamp: now.toISOString(),
      bioHash: hash,
    });
  };

  // Drawing Canvas logic
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#007960';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing && hasDrawn && canvasRef.current) {
      setIsDrawing(false);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      applySignature('digital', dataUrl);
    } else {
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onChangeSignature(null);
  };

  const isComplete = Boolean(
    signature &&
    signature.inspectorName.trim() &&
    (signature.signatureImage || signature.type === 'digital')
  );

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        hasAttemptedSubmit && !isComplete
          ? 'bg-red-50/60 border-red-500 ring-2 ring-red-200'
          : isComplete
          ? 'bg-emerald-50/40 border-[#007960]/40'
          : 'bg-white border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              isComplete ? 'bg-[#007960] text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <span>Autenticação & Assinatura Obrigatória</span>
              <span className="text-[10px] text-red-600 font-mono">*Obrigatório</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Para salvar este checklist é obrigatório validar a assinatura facial ou digital descrita
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSignatureMode('facial');
              clearCanvas();
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              signatureMode === 'facial'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Assinatura Facial</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSignatureMode('digital');
              stopCamera();
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              signatureMode === 'digital'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Assinatura Digital</span>
          </button>
        </div>
      </div>

      {/* Inspector Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Nome do Inspetor / Responsável: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={inspectorName}
            onChange={(e) => {
              const val = e.target.value;
              setInspectorName(val);
              if (signature) {
                onChangeSignature({ ...signature, inspectorName: val });
              }
            }}
            placeholder="Ex: Carlos Eduardo de Oliveira"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#007960]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Matrícula / RE / Cargo: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={registrationNumber}
            onChange={(e) => {
              const val = e.target.value;
              setRegistrationNumber(val);
              if (signature) {
                onChangeSignature({ ...signature, registrationNumber: val });
              }
            }}
            placeholder="Ex: RE-49021 / Técnico SST"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#007960]"
          />
        </div>
      </div>

      {/* Body per Mode */}
      <div className="pt-3">
        {signatureMode === 'facial' ? (
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#007960]" />
                <span>Validação Biométrica / Foto Facial</span>
              </span>
              {signature?.type === 'facial' && signature?.signatureImage && (
                <button
                  type="button"
                  onClick={() => onChangeSignature(null)}
                  className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refazer Foto</span>
                </button>
              )}
            </div>

            {signature?.type === 'facial' && signature?.signatureImage ? (
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#007960]/30 shadow-2xs">
                <img
                  src={signature.signatureImage}
                  alt="Biometria Facial"
                  className="w-20 h-20 object-cover rounded-xl border-2 border-[#007960] shadow-xs"
                />
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-[#007960] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Biometria Facial Autenticada</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Token: {signature.bioHash}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Capturado em: {new Date(signature.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ) : isCameraActive ? (
              <div className="space-y-2 text-center">
                <div className="relative mx-auto w-64 h-48 bg-black rounded-xl overflow-hidden border-2 border-[#007960]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/50 rounded-xl pointer-events-none" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={captureFacialPhoto}
                    className="px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Foto Facial</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#007960] border border-[#007960]/30 font-bold text-xs transition-colors shadow-2xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Abrir Câmera / Tirar Selfie</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors shadow-2xs cursor-pointer">
                    <Upload className="w-4 h-4 text-[#007960]" />
                    <span>Carregar Foto do Rosto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {cameraError && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {cameraError}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* DIGITAL SIGNATURE MODE */
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-[#007960]" />
                <span>Rubrica na Tela (Mouse ou Toque)</span>
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar Traço</span>
              </button>
            </div>

            <div className="bg-white border border-slate-300 rounded-xl overflow-hidden p-1 shadow-2xs">
              <canvas
                ref={canvasRef}
                width={500}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 bg-white cursor-crosshair touch-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Desenhe sua assinatura/rubrica acima. O traço será registrado com carimbo de tempo e certificado no checklist.
            </p>
          </div>
        )}
      </div>

      {/* Validation warning if tried to submit without signature */}
      {hasAttemptedSubmit && !isComplete && (
        <div className="mt-3 p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>
            <strong>Assinatura Obrigatória:</strong> Por favor, preencha o nome do responsável e capture a foto facial ou desenhe a assinatura digital antes de salvar.
          </span>
        </div>
      )}
    </div>
  );
};
