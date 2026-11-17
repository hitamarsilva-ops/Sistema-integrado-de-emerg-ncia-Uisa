import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Droplets, Save, ClipboardCheck, QrCode } from 'lucide-react';
import { Hydrant, HydrantInspection } from '../types/hydrant';
import { ActionPlanItem, ActionPlanDivision } from '../types/actionPlan';
import { ChecklistSignatureModule, SignatureData } from './ChecklistSignatureModule';
import { QrScannerModal } from './QrScannerModal';
import { ChecklistMandatoryNotice } from './ChecklistMandatoryNotice';

interface HydrantInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hydrant: Hydrant | null;
  onSaveInspection: (hydrantId: string, updatedHydrant: Hydrant, newActionPlan?: ActionPlanItem) => void;
}

interface HydrantCheckItem {
  id: string;
  title: string;
  description: string;
}

const HYDRANT_CHECK_ITEMS: HydrantCheckItem[] = [
  {
    id: 'valve',
    title: '1. Válvula Globo Angular',
    description: 'Sem emperramento, volante íntegro, vedação perfeita e estanqueidade sem vazamento sob pressão.',
  },
  {
    id: 'cabinet',
    title: '2. Abrigo e Sinalização Fotoluminescente',
    description: 'Caixa pintada em vermelho segurança, visor de vidro ou acrílico limpo, porta abrindo livremente.',
  },
  {
    id: 'hose',
    title: '3. Mangueiras de Incêndio (NBR 11861 / NBR 12779)',
    description: 'Mangueiras enroladas corretamente (aduchadas), acopladas, secas e com teste hidrostático anual vigente.',
  },
  {
    id: 'storz',
    title: '4. Chaves Storz de Engate Rápido',
    description: 'Par de chaves Storz presentes dentro do abrigo e sem deformações mecânicas.',
  },
  {
    id: 'nozzle',
    title: '5. Esguicho Regulável de Jato / Neblina',
    description: 'Esguicho em latão ou alumínio naval conectado à mangueira e com manopla operando suavemente.',
  },
  {
    id: 'access',
    title: '6. Desobstrução do Raio Operacional',
    description: 'Raio de no mínimo 1 metro 100% desobstruído de paletes, produtos acabados, veículos ou maquinários.',
  },
];

const createInitialEvaluations = () => {
  const init: Record<string, { status: 'C' | 'NC' | 'N/A' | null; observation: string }> = {};
  HYDRANT_CHECK_ITEMS.forEach((item) => {
    init[item.id] = { status: null, observation: '' };
  });
  return init;
};

export const HydrantInspectionModal: React.FC<HydrantInspectionModalProps> = ({
  isOpen,
  onClose,
  hydrant,
  onSaveInspection,
}) => {
  const [inspectorName, setInspectorName] = useState('Brigada de Emergência / SST');
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [staticPressureBar, setStaticPressureBar] = useState<number>(hydrant?.lastMeasuredPressureKgf || 8.0);
  const [notes, setNotes] = useState('');
  const [qrVerification, setQrVerification] = useState<{
    method: 'qr_scan' | 'manual_fallback';
    verifiedAt: string;
    reason?: string;
  } | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 6 Criteria with mandatory C / NC / N/A
  const [evaluations, setEvaluations] = useState<
    Record<string, { status: 'C' | 'NC' | 'N/A' | null; observation: string }>
  >(createInitialEvaluations);

  useEffect(() => {
    if (!isOpen || !hydrant) return;
    setInspectorName('Brigada de Emergência / SST');
    setSignature(null);
    setHasAttemptedSubmit(false);
    setValidationError(null);
    setInspectionDate(new Date().toISOString().split('T')[0]);
    setStaticPressureBar(hydrant.lastMeasuredPressureKgf || 8.0);
    setNotes('');
    setQrVerification(null);
    setIsQrScannerOpen(false);
    setEvaluations(createInitialEvaluations());
  }, [isOpen, hydrant?.id]);

  if (!isOpen || !hydrant) return null;

  const unansweredItems = HYDRANT_CHECK_ITEMS.filter((item) => evaluations[item.id]?.status === null);
  const answeredCount = HYDRANT_CHECK_ITEMS.length - unansweredItems.length;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setValidationError(null);

    if (!qrVerification) {
      setValidationError(
        `Realize a leitura do QR Code do hidrante ${hydrant.code} antes de finalizar o checklist (ou libere o Checklist Manual em caso de erro de leitura).`
      );
      return;
    }

    // Validação Obrigatória: 100% dos 6 itens preenchidos
    if (unansweredItems.length > 0) {
      setValidationError(
        `É obrigatório flegar todos os ${HYDRANT_CHECK_ITEMS.length} itens (C, NC ou N/A). Faltam ${unansweredItems.length} item(ns): ${unansweredItems
          .map((i) => `Item ${i.title.split('.')[0]}`)
          .join(', ')}.`
      );
      return;
    }

    if (!signature || !signature.inspectorName.trim() || (!signature.signatureImage && signature.type !== 'digital')) {
      setValidationError('A assinatura facial ou digital é obrigatória para salvar o checklist do hidrante.');
      return;
    }

    const hasNC = HYDRANT_CHECK_ITEMS.some((item) => evaluations[item.id]?.status === 'NC');
    const effectiveInspector = signature.inspectorName.trim() || inspectorName.trim();

    const newRecord: HydrantInspection = {
      id: `insp-hid-${Date.now()}`,
      date: inspectionDate,
      inspectorName: effectiveInspector,
      valveOperant: evaluations['valve']?.status === 'C',
      cabinetConditionOk: evaluations['cabinet']?.status === 'C',
      hoseTestedOk: evaluations['hose']?.status === 'C',
      storzKeysPresent: evaluations['storz']?.status === 'C',
      nozzleOperant: evaluations['nozzle']?.status === 'C',
      unobstructed: evaluations['access']?.status === 'C',
      staticPressureBar: Number(staticPressureBar),
      result: hasNC ? 'reprovado' : 'aprovado',
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

    const nextStatus = hasNC ? 'atencao' : 'operacional';

    const updated: Hydrant = {
      ...hydrant,
      lastMeasuredPressureKgf: Number(staticPressureBar),
      status: nextStatus,
      notes: notes.trim()
        ? `${hydrant.notes ? hydrant.notes + ' | ' : ''}Inspeção ${inspectionDate}: ${notes.trim()}`
        : hydrant.notes,
      inspections: [newRecord, ...(hydrant.inspections || [])],
    };

    let actionPlan: ActionPlanItem | undefined = undefined;
    if (hasNC) {
      const divisionMap: Record<string, ActionPlanDivision> = {
        empacotamento: 'EMPACOTAMENTO',
        posto_combustivel: 'POSTO DE COMBUSTIVEL',
        adm_agricola: 'ADM/GMA',
        industria: 'INDUSTRIA',
      };

      const ncReasons = HYDRANT_CHECK_ITEMS.filter((item) => evaluations[item.id]?.status === 'NC')
        .map((item) => `${item.title}: ${evaluations[item.id]?.observation || 'Não conforme'}`)
        .join('; ');

      actionPlan = {
        id: `pa-hid-auto-${Date.now()}`,
        system: 'hidrantes',
        division: divisionMap[hydrant.sector] || 'EMPACOTAMENTO',
        checklistDoc: 'NBR 13714',
        itemChecked: `Hidrante ${hydrant.code} - ${hydrant.locationDetails}`,
        nonConformityDescription: ncReasons || `Não conformidade identificada no hidrante ${hydrant.code} durante inspeção de rotina.`,
        correctiveAction: 'Programar reparo imediato de válvulas/acessórios e desobstrução da área.',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        responsible: 'Brigada de Emergência & Manutenção Hidráulica',
        status: 'em_andamento',
        priority: 'alta',
        createdAt: inspectionDate,
        notes: `Registrado pelo inspetor ${effectiveInspector}.`,
      };
    }

    onSaveInspection(hydrant.id, updated, actionPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Inspeção Técnica de Hidrante [{hydrant.code}]
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-[#007960] font-bold">
                  NBR 13714
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Checklist Oficial Mensal de Conformidade • UISA Bioenergia & Açúcar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Verificação Obrigatória por QR Code */}
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 ${
              qrVerification?.method === 'qr_scan'
                ? 'bg-emerald-50 border-[#007960]/40'
                : qrVerification?.method === 'manual_fallback'
                ? 'bg-amber-50 border-amber-300'
                : hasAttemptedSubmit
                ? 'bg-red-50 border-red-400 ring-1 ring-red-400'
                : 'bg-[#f8faf9] border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#007960] shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">
                  Leitura Obrigatória de QR Code ({hydrant.code})
                </span>
                <span className="text-[11px] text-slate-600">
                  {qrVerification?.method === 'qr_scan'
                    ? `✓ QR Code verificado às ${qrVerification.verifiedAt}`
                    : qrVerification?.method === 'manual_fallback'
                    ? `⚠ Checklist Manual liberado (Erro de leitura: ${qrVerification.reason})`
                    : 'Leia o QR Code do abrigo/hidrante antes de concluir (ou libere manual se houver erro).'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{qrVerification?.method === 'qr_scan' ? 'QR Lido ✓' : 'Ler QR Code'}</span>
            </button>
          </div>

          {/* Metadata Card */}
          <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Localização / Ponto</span>
              <span className="text-slate-900 font-bold text-xs">{hydrant.locationDetails}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Mangueiras no Abrigo</span>
              <span className="text-slate-900 font-semibold">
                {hydrant.hoseCount}x {hydrant.hoseLengthMeters}m ({hydrant.hoseDiameterInches})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Responsável / Inspetor</label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                required
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Data da Inspeção</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              />
            </div>
          </div>

          {/* Checklist Items with 3-state radio (C, NC, N/A) */}
          <div className="space-y-3 pt-2">
            <ChecklistMandatoryNotice
              totalItems={HYDRANT_CHECK_ITEMS.length}
              answeredItems={answeredCount}
              hasAttemptedSubmit={hasAttemptedSubmit}
              itemLabel="itens do hidrante"
              pendingLabels={unansweredItems.map((i) => `Item ${i.title.split('.')[0]}`)}
            />

            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Critérios de Avaliação Obrigatórios (NBR 13714)
              </h4>
              <div className="flex items-center gap-6 text-[11px] font-bold text-slate-700 pr-2">
                <span className="w-8 text-center text-[#007960]">C</span>
                <span className="w-8 text-center text-[#de2726]">NC</span>
                <span className="w-8 text-center text-slate-500">N/A</span>
              </div>
            </div>

            {HYDRANT_CHECK_ITEMS.map((item) => {
              const cur = evaluations[item.id] || { status: null, observation: '' };
              const isNC = cur.status === 'NC';
              const isMissing = cur.status === null;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isNC
                      ? 'bg-red-50/50 border-red-300 ring-1 ring-red-300'
                      : cur.status === 'C'
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : cur.status === 'N/A'
                      ? 'bg-slate-50 border-slate-200'
                      : hasAttemptedSubmit && isMissing
                      ? 'bg-red-50/40 border-red-400 ring-1 ring-red-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                        {hasAttemptedSubmit && isMissing && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#de2726] border border-red-300 text-[10px] font-bold">
                            Obrigatório flegar
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 self-end sm:self-center pr-2">
                      {/* C */}
                      <label className="w-8 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`hyd_${item.id}`}
                          checked={cur.status === 'C'}
                          onChange={() => handleStatusChange(item.id, 'C')}
                          className="w-4 h-4 text-[#007960] focus:ring-[#007960] cursor-pointer"
                        />
                      </label>

                      {/* NC */}
                      <label className="w-8 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`hyd_${item.id}`}
                          checked={cur.status === 'NC'}
                          onChange={() => handleStatusChange(item.id, 'NC')}
                          className="w-4 h-4 text-[#de2726] focus:ring-[#de2726] cursor-pointer"
                        />
                      </label>

                      {/* N/A */}
                      <label className="w-8 flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`hyd_${item.id}`}
                          checked={cur.status === 'N/A'}
                          onChange={() => handleStatusChange(item.id, 'N/A')}
                          className="w-4 h-4 text-slate-500 focus:ring-slate-400 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {isNC && (
                    <div className="mt-2.5 pt-2.5 border-t border-red-200 animate-in fade-in">
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-[#de2726]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Não Conformidade Detectada • Gera Plano de Ação Automático</span>
                      </div>
                      <textarea
                        rows={2}
                        value={cur.observation}
                        onChange={(e) => handleObservationChange(item.id, e.target.value)}
                        placeholder="Descreva o motivo da não conformidade para o plano de ação..."
                        required
                        className="w-full bg-white border border-red-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-[#de2726] focus:ring-1 focus:ring-[#de2726]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Pressão Estática Medida (Kgf/cm²)</label>
              <input
                type="number"
                step="0.1"
                value={staticPressureBar}
                onChange={(e) => setStaticPressureBar(Number(e.target.value))}
                required
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Observações do Ponto</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Abrigo limpo, esguicho sem vazamento..."
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              />
            </div>
          </div>

          {/* Módulo Obrigatório de Assinatura Facial ou Digital */}
          <div className="pt-2 border-t border-slate-200">
            <ChecklistSignatureModule
              signature={signature}
              onChangeSignature={setSignature}
              hasAttemptedSubmit={hasAttemptedSubmit}
            />
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-[#de2726] text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-xs ${
                qrVerification && allItemsAnswered
                  ? 'bg-[#007960] hover:bg-[#005a47]'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
              title={!qrVerification ? 'Realize a leitura do QR Code ou libere o checklist manual primeiro' : 'Finalizar Inspeção'}
            >
              <Save className="w-4 h-4" />
              <span>
                {!qrVerification
                  ? 'Ler QR e Finalizar Inspeção'
                  : allItemsAnswered
                  ? 'Finalizar Inspeção do Hidrante'
                  : `Flegar todos os itens (${answeredCount}/${HYDRANT_CHECK_ITEMS.length})`}
              </span>
            </button>
          </div>
        </form>
      </div>

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        equipmentKind="hidrante"
        expectedItem={{
          id: hydrant.id,
          code: hydrant.code,
          locationDetails: hydrant.locationDetails,
          secondaryCode: hydrant.cabinetNumber,
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
