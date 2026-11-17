import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Gauge,
  Lock,
  Eye,
  Check,
  Save,
  QrCode,
  ShieldAlert,
  ClipboardEdit,
} from 'lucide-react';
import {
  Extinguisher,
  InspectionRecord,
} from '../types/extinguisher';
import { checkCo2WeightLoss, formatDateBR, SECTOR_MAP, TYPE_MAP } from '../utils/formatters';
import { playIndustrialSound } from '../utils/audioAlerts';
import { ChecklistSignatureModule, SignatureData } from './ChecklistSignatureModule';
import { QrScannerModal } from './QrScannerModal';
import { ChecklistMandatoryNotice } from './ChecklistMandatoryNotice';

interface InspectionChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  extinguisher: Extinguisher | null;
  onSaveInspection: (extId: string, updatedExt: Extinguisher) => void;
}

interface ExtCheckItem {
  id: string;
  title: string;
  description: string;
  icon: 'gauge' | 'lock' | 'hose' | 'sign' | 'access';
}

const EXT_CHECK_ITEMS: ExtCheckItem[] = [
  {
    id: 'gauge',
    title: '1. Pressão do Manômetro na Faixa Verde (Adequada)',
    description: 'Ponteiro indicador dentro da faixa verde de trabalho (sem sobrepressão ou despressurização).',
    icon: 'gauge',
  },
  {
    id: 'seal',
    title: '2. Lacre Plástico e Pino de Segurança Intactos',
    description: 'Lacre sem rompimento e arame de cobre fixado na válvula de disparo sem violação.',
    icon: 'lock',
  },
  {
    id: 'hose',
    title: '3. Mangueira, Bico e Difusor Desobstruídos',
    description: 'Conjunto de mangueira sem ressecamento, rachaduras, insetos ou entupimento interno.',
    icon: 'hose',
  },
  {
    id: 'sign',
    title: '4. Sinalização Fotoluminescente e Piso Demarcado',
    description: 'Placa fotoluminescente visível e demarcação de piso em vermelho e amarelo preservadas.',
    icon: 'sign',
  },
  {
    id: 'access',
    title: '5. Acesso 100% Livre e Desobstruído',
    description: 'Raio de no mínimo 1 metro totalmente livre de caixas, maquinários, paletes ou veículos.',
    icon: 'access',
  },
];

const createInitialEvaluations = () => {
  const init: Record<string, { status: 'C' | 'NC' | 'N/A' | null; observation: string }> = {};
  EXT_CHECK_ITEMS.forEach((item) => {
    init[item.id] = { status: null, observation: '' };
  });
  return init;
};

export const InspectionChecklistModal: React.FC<InspectionChecklistModalProps> = ({
  isOpen,
  onClose,
  extinguisher,
  onSaveInspection,
}) => {
  const [inspectorName, setInspectorName] = useState('Brigada de Emergência / Técnico SST');
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [measuredWeight, setMeasuredWeight] = useState<number | undefined>(
    extinguisher?.currentWeightKg || extinguisher?.grossWeightRefKg
  );
  const [notes, setNotes] = useState('');
  const [qrVerification, setQrVerification] = useState<{
    method: 'qr_scan' | 'manual_fallback';
    verifiedAt: string;
    reason?: string;
  } | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 5 criteria mandatory C, NC, N/A (initialized to null)
  const [evaluations, setEvaluations] = useState<
    Record<string, { status: 'C' | 'NC' | 'N/A' | null; observation: string }>
  >(createInitialEvaluations);

  useEffect(() => {
    if (!isOpen || !extinguisher) return;
    setInspectorName('Brigada de Emergência / Técnico SST');
    setSignature(null);
    setHasAttemptedSubmit(false);
    setValidationError(null);
    setMeasuredWeight(extinguisher.currentWeightKg || extinguisher.grossWeightRefKg);
    setNotes('');
    setQrVerification(null);
    setIsQrScannerOpen(false);
    setEvaluations(createInitialEvaluations());
  }, [isOpen, extinguisher?.id]);

  if (!isOpen || !extinguisher) return null;

  const unansweredItems = EXT_CHECK_ITEMS.filter((item) => evaluations[item.id]?.status === null);
  const answeredCount = EXT_CHECK_ITEMS.length - unansweredItems.length;
  const allItemsAnswered = unansweredItems.length === 0;

  const handleStatusChange = (id: string, status: 'C' | 'NC' | 'N/A') => {
    setValidationError(null);
    setEvaluations((prev) => ({
      ...prev,
      [id]: { ...prev[id], status },
    }));
  };

  const handleObservationChange = (id: string, observation: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [id]: { ...prev[id], observation },
    }));
  };

  const co2Check = extinguisher.type === 'co2' ? checkCo2WeightLoss(extinguisher.grossWeightRefKg, measuredWeight) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setValidationError(null);

    if (!qrVerification) {
      setValidationError(
        `Realize a leitura do QR Code do extintor ${extinguisher.code} antes de finalizar o checklist (ou utilize o Checklist Manual em caso de erro de leitura).`
      );
      return;
    }

    // Validação Obrigatória: 100% dos 5 itens preenchidos
    if (unansweredItems.length > 0) {
      setValidationError(
        `É obrigatório flegar TODOS os ${EXT_CHECK_ITEMS.length} itens do checklist (C, NC ou N/A). Faltam ${unansweredItems.length} item(ns): ${unansweredItems
          .map((i) => i.title.split('.')[0])
          .join(', ')}.`
      );
      return;
    }

    if (!signature || !signature.inspectorName.trim() || (!signature.signatureImage && signature.type !== 'digital')) {
      setValidationError('A assinatura facial ou digital é obrigatória para salvar este checklist.');
      return;
    }

    const pressureGaugeOk = evaluations['gauge']?.status === 'C';
    const sealIntact = evaluations['seal']?.status === 'C';
    const hoseNozzleOk = evaluations['hose']?.status === 'C';
    const signageOk = evaluations['sign']?.status === 'C';
    const unobstructed = evaluations['access']?.status === 'C';

    const isFailed =
      evaluations['gauge']?.status === 'NC' ||
      evaluations['seal']?.status === 'NC' ||
      evaluations['hose']?.status === 'NC' ||
      (co2Check?.isCritical ?? false);

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: InspectionRecord = {
      id: `insp-${Date.now()}`,
      date: todayStr,
      inspectorName: signature.inspectorName.trim() || inspectorName.trim() || 'Inspetor',
      pressureGaugeOk,
      sealIntact,
      hoseNozzleOk,
      signageOk,
      unobstructed,
      weightMeasuredKg: measuredWeight,
      weightLossPercentage: co2Check?.lossPercent,
      result: isFailed ? 'reprovado' : (!signageOk || !unobstructed) ? 'requer_ajuste' : 'aprovado',
      verificationMethod: qrVerification.method,
      manualFallbackReason: qrVerification.reason,
      verifiedAt: qrVerification.verifiedAt,
      notes: [
        notes.trim(),
        qrVerification.method === 'manual_fallback'
          ? `Checklist Manual (Erro QR: ${qrVerification.reason || 'Não especificado'})`
          : 'Verificado via Leitura QR Code',
      ]
        .filter(Boolean)
        .join(' | '),
    };

    const updated: Extinguisher = {
      ...extinguisher,
      lastInspectionDate: todayStr,
      pressureGaugeOk,
      sealIntact,
      hoseNozzleOk,
      signageOk,
      unobstructed,
      currentWeightKg: measuredWeight,
      inspectionHistory: [newRecord, ...(extinguisher.inspectionHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    onSaveInspection(extinguisher.id, updated);
    playIndustrialSound(isFailed ? 'warning' : 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Inspeção Mensal / Checklist de Campo</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  NR-23 / NBR 12962
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Extintor: <strong className="text-white">{extinguisher.code}</strong> ({TYPE_MAP[extinguisher.type]?.acro} {extinguisher.capacityWeight}) - {SECTOR_MAP[extinguisher.sector]?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checklist Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Verificação Obrigatória de QR Code */}
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 ${
              qrVerification?.method === 'qr_scan'
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : qrVerification?.method === 'manual_fallback'
                ? 'bg-amber-950/40 border-amber-500/50'
                : hasAttemptedSubmit
                ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                : 'bg-slate-950/70 border-slate-700'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    1º Passo Obrigatório: Leitura do QR Code ({extinguisher.code})
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {qrVerification?.method === 'qr_scan'
                      ? `✓ QR Code lido às ${qrVerification.verifiedAt}`
                      : qrVerification?.method === 'manual_fallback'
                      ? `⚠ Checklist Manual liberado por erro de leitura (${qrVerification.reason})`
                      : 'Escaneie a etiqueta QR do extintor para liberar a finalização do checklist.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{qrVerification?.method === 'qr_scan' ? 'QR Lido ✓' : 'Ler QR Code'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Inspector name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome do Responsável / Inspetor (Brigada / SESMT):
            </label>
            <input
              type="text"
              required
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none"
            />
          </div>

          {/* Checklist items list with 3-state radio (C, NC, N/A) */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <ChecklistMandatoryNotice
              theme="dark"
              totalItems={EXT_CHECK_ITEMS.length}
              answeredItems={answeredCount}
              hasAttemptedSubmit={hasAttemptedSubmit}
              itemLabel="itens do extintor"
              pendingLabels={unansweredItems.map((i) => `Item ${i.title.split('.')[0]}`)}
            />

            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Itens Obrigatórios de Verificação Visual:
              </span>
              <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 pr-2">
                <span className="w-8 text-center text-emerald-400">C</span>
                <span className="w-8 text-center text-red-400">NC</span>
                <span className="w-8 text-center text-slate-400">N/A</span>
              </div>
            </div>

            {EXT_CHECK_ITEMS.map((item) => {
              const cur = evaluations[item.id] || { status: null, observation: '' };
              const isNC = cur.status === 'NC';
              const isMissing = cur.status === null;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isNC
                      ? 'bg-red-950/40 border-red-500/60'
                      : cur.status === 'C'
                      ? 'bg-slate-900 border-slate-700'
                      : cur.status === 'N/A'
                      ? 'bg-slate-900/60 border-slate-800'
                      : hasAttemptedSubmit && isMissing
                      ? 'bg-red-950/30 border-red-500/80 ring-1 ring-red-500/60'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200">{item.title}</span>
                        {hasAttemptedSubmit && isMissing && (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-500/60 text-red-300 text-[10px] font-bold">
                            Obrigatório flegar
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{item.description}</span>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 self-end sm:self-center pr-2">
                      {/* C */}
                      <label className="w-8 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`ext_${item.id}`}
                          checked={cur.status === 'C'}
                          onChange={() => handleStatusChange(item.id, 'C')}
                          className="w-4 h-4 text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </label>

                      {/* NC */}
                      <label className="w-8 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`ext_${item.id}`}
                          checked={cur.status === 'NC'}
                          onChange={() => handleStatusChange(item.id, 'NC')}
                          className="w-4 h-4 text-red-500 focus:ring-0 cursor-pointer"
                        />
                      </label>

                      {/* N/A */}
                      <label className="w-8 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`ext_${item.id}`}
                          checked={cur.status === 'N/A'}
                          onChange={() => handleStatusChange(item.id, 'N/A')}
                          className="w-4 h-4 text-slate-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {isNC && (
                    <div className="mt-2.5 pt-2 border-t border-red-500/30">
                      <textarea
                        rows={2}
                        value={cur.observation}
                        onChange={(e) => handleObservationChange(item.id, e.target.value)}
                        placeholder="Descreva o motivo da não conformidade encontrada..."
                        required
                        className="w-full bg-slate-800 border border-red-500/50 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Teste de Pesagem para CO2 */}
          {extinguisher.type === 'co2' && (
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200">
                  Pesagem e Controle de Perda de Carga (CO2)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-[11px] text-slate-400 block">Peso Bruto Referência (kg):</span>
                  <strong className="text-white text-sm">{extinguisher.grossWeightRefKg || '-'} kg</strong>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Peso Aferido Hoje (kg):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={measuredWeight || ''}
                    onChange={(e) => setMeasuredWeight(parseFloat(e.target.value) || undefined)}
                    placeholder="Ex: 14.20"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
                  />
                </div>
              </div>
              {co2Check && (
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    co2Check.isCritical
                      ? 'bg-red-950/50 border-red-800 text-red-200'
                      : 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                  }`}
                >
                  {co2Check.isCritical ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  <span>
                    {co2Check.isCritical
                      ? `Perda crítica de peso: ${co2Check.lossPercent}% (${co2Check.lossKg}kg) — Recarga imediata obrigatória!`
                      : `Perda de peso aceitável: ${co2Check.lossPercent}% (${co2Check.lossKg}kg) — Dentro do limite NBR (<10%)`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Observações Gerais */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Observações Gerais do Inspetor:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cilindro limpo, sinalização fotoluminescente bem fixada..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none"
            />
          </div>

          {/* Módulo Obrigatório de Assinatura Facial ou Digital */}
          <div className="pt-2 border-t border-slate-800">
            <ChecklistSignatureModule
              signature={signature}
              onChangeSignature={setSignature}
              hasAttemptedSubmit={hasAttemptedSubmit}
            />
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold transition-all shadow-md ${
                qrVerification && allItemsAnswered
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
              title={!qrVerification ? 'Realize a leitura do QR Code ou libere o checklist manual primeiro' : 'Salvar Inspeção'}
            >
              <Save className="w-4 h-4" />
              <span>
                {!qrVerification
                  ? 'Ler QR e Salvar Inspeção'
                  : allItemsAnswered
                  ? 'Salvar Inspeção Mensal'
                  : `Flegar todos os itens (${answeredCount}/${EXT_CHECK_ITEMS.length})`}
              </span>
            </button>
          </div>
        </form>
      </div>

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        equipmentKind="extintor"
        expectedItem={{
          id: extinguisher.id,
          code: extinguisher.code,
          locationDetails: extinguisher.locationDetails,
          secondaryCode: extinguisher.inmetroSeal,
          verifiedMethod: qrVerification?.method || null,
        }}
        onQrMatched={() => {
          setQrVerification({
            method: 'qr_scan',
            verifiedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          });
        }}
        onManualFallback={(_id, reason) => {
          setQrVerification({
            method: 'manual_fallback',
            verifiedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            reason,
          });
        }}
      />
    </div>
  );
};
