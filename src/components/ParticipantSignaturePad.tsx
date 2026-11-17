import React, { useRef, useState } from 'react';
import { PenTool, RotateCcw, CheckCircle2, X, Camera, Upload } from 'lucide-react';

interface ParticipantSignaturePadProps {
  participantRole: string;
  participantName: string;
  onConfirm: (dataUrl: string, mode: 'rubrica' | 'facial') => void;
  onCancel: () => void;
}

export const ParticipantSignaturePad: React.FC<ParticipantSignaturePadProps> = ({
  participantRole,
  participantName,
  onConfirm,
  onCancel,
}) => {
  const [mode, setMode] = useState<'rubrica' | 'facial'>('rubrica');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCoordinates = (
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const handleConfirmCanvas = () => {
    if (!hasDrawn || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onConfirm(dataUrl, 'rubrica');
  };

  const handleFacialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onConfirm(result, 'facial');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-2.5 p-3 bg-white border-2 border-[#007960]/40 rounded-xl shadow-sm space-y-2.5 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div>
          <span className="text-[11px] font-bold text-[#007960] uppercase flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5" />
            <span>Campo de Assinatura / Rubrica — {participantRole}</span>
          </span>
          {participantName.trim() && (
            <span className="text-[10px] text-slate-500 block">
              Assinante: <strong className="text-slate-700">{participantName}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('rubrica')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
              mode === 'rubrica' ? 'bg-[#007960] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rubrica / Assinatura
          </button>
          <button
            type="button"
            onClick={() => setMode('facial')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
              mode === 'facial' ? 'bg-[#007960] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Foto Facial
          </button>
        </div>
      </div>

      {mode === 'rubrica' ? (
        <>
          <div className="bg-[#f8faf9] border border-dashed border-slate-400 rounded-lg overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={480}
              height={130}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-28 bg-white cursor-crosshair touch-none block"
            />
            {!hasDrawn && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 select-none">
                Desenhe sua assinatura ou rubrica aqui (mouse ou dedo)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar Traço</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Cancelar</span>
              </button>

              <button
                type="button"
                disabled={!hasDrawn}
                onClick={handleConfirmCanvas}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-2xs ${
                  hasDrawn
                    ? 'bg-[#007960] hover:bg-[#005a47] text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar Assinatura</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-[#f8faf9] hover:bg-emerald-50/40 text-[#007960] border border-dashed border-[#007960]/40 font-bold text-xs transition-colors cursor-pointer">
            <Camera className="w-4 h-4" />
            <span>Tirar Foto Facial ou Anexar Imagem</span>
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFacialUpload}
              className="hidden"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
