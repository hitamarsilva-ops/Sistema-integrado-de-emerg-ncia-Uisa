import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  MapPin,
  Flame,
  Droplets,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  QrCode,
  Lock,
  ClipboardEdit,
} from 'lucide-react';
import { Extinguisher, InspectionRecord } from '../types/extinguisher';
import { Hydrant, HydrantInspection } from '../types/hydrant';
import { ActionPlanDivision, ActionPlanItem } from '../types/actionPlan';
import { ChecklistSignatureModule, SignatureData } from './ChecklistSignatureModule';
import { ChecklistCompletionData } from './ChecklistCompletionModal';
import { QrScannerModal, QrScannableItem } from './QrScannerModal';
import { formatDateBR, TYPE_MAP } from '../utils/formatters';
import { playIndustrialSound } from '../utils/audioAlerts';
import { ChecklistMandatoryNotice } from './ChecklistMandatoryNotice';

export interface SectorChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'extintores' | 'hidrantes';
  sectorName: string;
  unitLabel: string;
  extinguishers?: Extinguisher[];
  hydrants?: Hydrant[];
  onSaveExtinguishersBatch?: (
    updatedList: Extinguisher[],
    newActionPlans: ActionPlanItem[],
    completionData: ChecklistCompletionData
  ) => void;
  onSaveHydrantsBatch?: (
    updatedList: Hydrant[],
    newActionPlans: ActionPlanItem[],
    completionData: ChecklistCompletionData
  ) => void;
}

interface CheckCriterion {
  id: string;
  title: string;
  description: string;
}

const EXT_CRITERIA: CheckCriterion[] = [
  {
    id: 'gauge',
    title: '1. Pressão do Manômetro na Faixa Verde',
    description: 'Ponteiro dentro da faixa verde de trabalho.',
  },
  {
    id: 'seal',
    title: '2. Lacre Plástico e Pino Intactos',
    description: 'Lacre sem rompimento e pino travado na válvula.',
  },
  {
    id: 'hose',
    title: '3. Mangueira, Bico e Difusor Desobstruídos',
    description: 'Sem ressecamento, rachaduras ou entupimentos.',
  },
  {
    id: 'sign',
    title: '4. Sinalização Fotoluminescente e Piso Demarcado',
    description: 'Placa visível e demarcação de solo preservada.',
  },
  {
    id: 'access',
    title: '5. Acesso 100% Livre e Desobstruído',
    description: 'Raio de 1m livre de materiais ou obstáculos.',
  },
];

const HYD_CRITERIA: CheckCriterion[] = [
  {
    id: 'valve',
    title: '1. Válvula Globo Angular',
    description: 'Sem emperramento, volante íntegro e estanqueidade.',
  },
  {
    id: 'cabinet',
    title: '2. Abrigo e Sinalização Fotoluminescente',
    description: 'Abrigo vermelho limpo, visor íntegro e porta livre.',
  },
  {
    id: 'hose',
    title: '3. Mangueiras de Incêndio (NBR 11861 / 12779)',
    description: 'Aduchadas, secas, acopladas e com teste hidrostático vigente.',
  },
  {
    id: 'storz',
    title: '4. Chaves Storz de Engate Rápido',
    description: 'Chaves presentes no abrigo e sem deformações.',
  },
  {
    id: 'nozzle',
    title: '5. Esguicho Regulável de Jato / Neblina',
    description: 'Conectado à mangueira e operando suavemente.',
  },
  {
    id: 'access',
    title: '6. Desobstrução do Raio Operacional',
    description: 'Raio mínimo de 1m totalmente livre de obstáculos.',
  },
];

type EvalStatus = 'C' | 'NC' | 'N/A' | null;

interface ItemEvaluationState {
  criteria: Record<string, EvalStatus>;
  ncObservation: string;
  staticPressureBar?: number;
  weightMeasuredKg?: number;
}

export const SectorChecklistModal: React.FC<SectorChecklistModalProps> = ({
  isOpen,
  onClose,
  mode,
  sectorName,
  unitLabel,
  extinguishers = [],
  hydrants = [],
  onSaveExtinguishersBatch,
  onSaveHydrantsBatch,
}) => {
  const criteriaList = mode === 'extintores' ? EXT_CRITERIA : HYD_CRITERIA;
  const items = mode === 'extintores' ? extinguishers : hydrants;

  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [sectorNotes, setSectorNotes] = useState('');
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<Record<string, ItemEvaluationState>>({});
  const [qrVerifications, setQrVerifications] = useState<
    Record<string, { method: 'qr_scan' | 'manual_fallback'; verifiedAt: string; reason?: string }>
  >({});
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScannerTargetItem, setQrScannerTargetItem] = useState<QrScannableItem | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form state whenever modal opens or target sector/items change
  useEffect(() => {
    if (!isOpen) return;
    const initEval: Record<string, ItemEvaluationState> = {};
    const initExpanded: Record<string, boolean> = {};

    if (mode === 'extintores') {
      extinguishers.forEach((ext) => {
        const critMap: Record<string, EvalStatus> = {};
        EXT_CRITERIA.forEach((c) => {
          critMap[c.id] = null;
        });
        initEval[ext.id] = {
          criteria: critMap,
          ncObservation: '',
          weightMeasuredKg: ext.currentWeightKg || ext.grossWeightRefKg,
        };
        initExpanded[ext.id] = true;
      });
    } else {
      hydrants.forEach((hid) => {
        const critMap: Record<string, EvalStatus> = {};
        HYD_CRITERIA.forEach((c) => {
          critMap[c.id] = null;
        });
        initEval[hid.id] = {
          criteria: critMap,
          ncObservation: '',
          staticPressureBar: hid.lastMeasuredPressureKgf || hid.nominalPressureKgf || 8.0,
        };
        initExpanded[hid.id] = true;
      });
    }

    setEvaluations(initEval);
    setExpandedItemIds(initExpanded);
    setInspectionDate(new Date().toISOString().split('T')[0]);
    setSectorNotes('');
    setSignature(null);
    setHasAttemptedSubmit(false);
    setValidationError(null);
    setQrVerifications({});
    setIsQrScannerOpen(false);
    setQrScannerTargetItem(null);
  }, [isOpen, mode, sectorName, extinguishers, hydrants]);

  const qrStats = useMemo(() => {
    let qrCount = 0;
    let manualCount = 0;
    items.forEach((item) => {
      const v = qrVerifications[item.id];
      if (v?.method === 'qr_scan') qrCount++;
      else if (v?.method === 'manual_fallback') manualCount++;
    });
    const verifiedCount = qrCount + manualCount;
    const pendingCount = Math.max(0, items.length - verifiedCount);
    return { qrCount, manualCount, verifiedCount, pendingCount, allVerified: items.length > 0 && pendingCount === 0 };
  }, [items, qrVerifications]);

  const scannableItems: QrScannableItem[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        code: item.code,
        locationDetails: item.locationDetails,
        secondaryCode:
          mode === 'extintores'
            ? (item as Extinguisher).inmetroSeal
            : (item as Hydrant).cabinetNumber,
        verifiedMethod: qrVerifications[item.id]?.method || null,
      })),
    [items, mode, qrVerifications]
  );

  const progressStats = useMemo(() => {
    const totalChecks = items.length * criteriaList.length;
    let answeredChecks = 0;
    let cCount = 0;
    let ncCount = 0;
    let naCount = 0;

    items.forEach((item) => {
      const ev = evaluations[item.id];
      if (!ev) return;
      criteriaList.forEach((crit) => {
        const st = ev.criteria[crit.id];
        if (st !== null && st !== undefined) {
          answeredChecks++;
          if (st === 'C') cCount++;
          else if (st === 'NC') ncCount++;
          else if (st === 'N/A') naCount++;
        }
      });
    });

    return { totalChecks, answeredChecks, cCount, ncCount, naCount };
  }, [items, criteriaList, evaluations]);

  if (!isOpen) return null;

  const handleSetCriterion = (itemId: string, critId: string, status: 'C' | 'NC' | 'N/A') => {
    setValidationError(null);
    setEvaluations((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        criteria: {
          ...(prev[itemId]?.criteria || {}),
          [critId]: status,
        },
      },
    }));
  };

  const handleMarkEquipmentAllC = (itemId: string) => {
    setValidationError(null);
    setEvaluations((prev) => {
      const updatedCrit: Record<string, EvalStatus> = {};
      criteriaList.forEach((c) => {
        updatedCrit[c.id] = 'C';
      });
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          criteria: updatedCrit,
        },
      };
    });
  };

  const handleClearEquipment = (itemId: string) => {
    setEvaluations((prev) => {
      const updatedCrit: Record<string, EvalStatus> = {};
      criteriaList.forEach((c) => {
        updatedCrit[c.id] = null;
      });
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          criteria: updatedCrit,
          ncObservation: '',
        },
      };
    });
  };

  const handleObservationChange = (itemId: string, value: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ncObservation: value,
      },
    }));
  };

  const handlePressureChange = (itemId: string, value: number) => {
    setEvaluations((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        staticPressureBar: value,
      },
    }));
  };

  const handleWeightChange = (itemId: string, value: number | undefined) => {
    setEvaluations((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        weightMeasuredKg: value,
      },
    }));
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItemIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const openBatchQrScanner = () => {
    setQrScannerTargetItem(null);
    setIsQrScannerOpen(true);
  };

  const openSingleQrScanner = (item: Extinguisher | Hydrant) => {
    setQrScannerTargetItem({
      id: item.id,
      code: item.code,
      locationDetails: item.locationDetails,
      secondaryCode:
        mode === 'extintores'
          ? (item as Extinguisher).inmetroSeal
          : (item as Hydrant).cabinetNumber,
      verifiedMethod: qrVerifications[item.id]?.method || null,
    });
    setIsQrScannerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setValidationError(null);

    if (items.length === 0) {
      setValidationError('Não há equipamentos cadastrados neste setor para realizar o checklist.');
      return;
    }

    // 0. Validate 100% QR verification (or manual fallback due to read error)
    const unverifiedItems = items.filter((item) => !qrVerifications[item.id]);
    if (unverifiedItems.length > 0) {
      setExpandedItemIds((prev) => {
        const next = { ...prev };
        unverifiedItems.forEach((it) => {
          next[it.id] = true;
        });
        return next;
      });
      setValidationError(
        `O checklist só pode ser finalizado após a leitura do QR Code de TODOS os ${items.length} equipamento(s) cadastrado(s) (ou liberação manual em caso de erro de leitura). Faltam ${unverifiedItems.length}: ${unverifiedItems
          .slice(0, 5)
          .map((i) => i.code)
          .join(', ')}${unverifiedItems.length > 5 ? '...' : ''}.`
      );
      return;
    }

    // 1. Validate 100% of items filled
    const incompleteItems: string[] = [];
    let missingChecksCount = 0;

    items.forEach((item) => {
      const ev = evaluations[item.id];
      const missingForThisItem = criteriaList.filter(
        (crit) => !ev || ev.criteria[crit.id] === null || ev.criteria[crit.id] === undefined
      );
      if (missingForThisItem.length > 0) {
        incompleteItems.push(item.code);
        missingChecksCount += missingForThisItem.length;
      }
    });

    if (missingChecksCount > 0) {
      // Expand incomplete cards automatically so user sees them
      setExpandedItemIds((prev) => {
        const next = { ...prev };
        incompleteItems.forEach((code) => {
          const found = items.find((i) => i.code === code);
          if (found) next[found.id] = true;
        });
        return next;
      });
      setValidationError(
        `É obrigatório flegar TODOS os itens (C, NC ou N/A) de cada equipamento antes de finalizar. Faltam ${missingChecksCount} item(ns) em: ${incompleteItems.slice(0, 5).join(', ')}${incompleteItems.length > 5 ? '...' : ''}.`
      );
      return;
    }

    // 2. Validate mandatory NC observations
    const missingNcObs: string[] = [];
    items.forEach((item) => {
      const ev = evaluations[item.id];
      if (!ev) return;
      const hasNC = criteriaList.some((c) => ev.criteria[c.id] === 'NC');
      if (hasNC && !ev.ncObservation.trim()) {
        missingNcObs.push(item.code);
      }
    });

    if (missingNcObs.length > 0) {
      setValidationError(
        `Informe a descrição da não conformidade encontrada nos equipamentos marcados como NC: ${missingNcObs.join(', ')}.`
      );
      return;
    }

    // 3. Validate signature
    if (
      !signature ||
      !signature.inspectorName.trim() ||
      (!signature.signatureImage && signature.type !== 'digital')
    ) {
      setValidationError('A assinatura facial ou rubrica digital do inspetor é obrigatória para finalizar o checklist do setor.');
      return;
    }

    const effectiveInspector = signature.inspectorName.trim();
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newActionPlans: ActionPlanItem[] = [];

    if (mode === 'extintores' && onSaveExtinguishersBatch) {
      const divMap: Record<string, ActionPlanDivision> = {
        unidade_industrial: 'INDUSTRIA',
        empacotamento: 'EMPACOTAMENTO',
        posto_combustivel: 'POSTO DE COMBUSTIVEL',
        adm: 'ADM/GMA',
      };

      const updatedList: Extinguisher[] = extinguishers.map((ext) => {
        const ev = evaluations[ext.id];
        const pressureGaugeOk = ev.criteria['gauge'] !== 'NC';
        const sealIntact = ev.criteria['seal'] !== 'NC';
        const hoseNozzleOk = ev.criteria['hose'] !== 'NC';
        const signageOk = ev.criteria['sign'] !== 'NC';
        const unobstructed = ev.criteria['access'] !== 'NC';

        const hasCriticalNC =
          ev.criteria['gauge'] === 'NC' ||
          ev.criteria['seal'] === 'NC' ||
          ev.criteria['hose'] === 'NC';
        const hasAnyNC = EXT_CRITERIA.some((c) => ev.criteria[c.id] === 'NC');

        const ncItemsText = EXT_CRITERIA.filter((c) => ev.criteria[c.id] === 'NC')
          .map((c) => c.title)
          .join(', ');

        if (hasAnyNC) {
          newActionPlans.push({
            id: `pa-ext-setor-${ext.code}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            system: 'extintores',
            division: divMap[ext.sector] || 'INDUSTRIA',
            checklistDoc: 'NBR 12962 / NR-23',
            itemChecked: `[Setor ${sectorName}] Extintor ${ext.code} (${ext.locationDetails})`,
            nonConformityDescription: `Itens NC: ${ncItemsText}. Detalhes: ${ev.ncObservation.trim()}`,
            correctiveAction: 'Substituição ou regularização imediata do extintor no setor.',
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            responsible: 'Inspetor de SST / Brigada de Emergência',
            status: 'em_andamento',
            priority: 'alta',
            createdAt: inspectionDate,
            notes: `Checklist em lote do setor ${sectorName} por ${effectiveInspector}.`,
          });
        }

        const verif = qrVerifications[ext.id];
        const record: InspectionRecord = {
          id: `insp-set-${ext.id}-${Date.now()}`,
          date: inspectionDate,
          inspectorName: effectiveInspector,
          pressureGaugeOk,
          sealIntact,
          hoseNozzleOk,
          signageOk,
          unobstructed,
          weightMeasuredKg: ev.weightMeasuredKg,
          result: hasCriticalNC ? 'reprovado' : hasAnyNC ? 'requer_ajuste' : 'aprovado',
          verificationMethod: verif?.method || 'qr_scan',
          manualFallbackReason: verif?.reason,
          verifiedAt: verif?.verifiedAt,
          notes: [
            `Checklist Setor: ${sectorName}`,
            verif?.method === 'manual_fallback'
              ? `Manual (Erro QR: ${verif.reason || 'Não informado'})`
              : 'QR Lido',
            ev.ncObservation.trim(),
            sectorNotes.trim(),
          ]
            .filter(Boolean)
            .join(' | '),
        };

        return {
          ...ext,
          lastInspectionDate: inspectionDate,
          pressureGaugeOk,
          sealIntact,
          hoseNozzleOk,
          signageOk,
          unobstructed,
          currentWeightKg: ev.weightMeasuredKg ?? ext.currentWeightKg,
          inspectionHistory: [record, ...(ext.inspectionHistory || [])],
          updatedAt: new Date().toISOString(),
        };
      });

      const proto = `UISA-SET-EXT-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1
      ).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

      const completionData: ChecklistCompletionData = {
        protocol: proto,
        systemName: `Extintores — Setor: ${sectorName} (${extinguishers.length} unid.)`,
        docNumber: 'NBR 12962 / NR-23',
        revision: '02',
        unit: `${unitLabel} • ${sectorName}`,
        completedAt: `${formatDateBR(inspectionDate)} às ${nowTime}`,
        inspectorName: effectiveInspector,
        inspectorRE: signature.registrationNumber,
        signatureType: signature.type,
        signaturePreview: signature.signatureImage,
        totalItems: progressStats.totalChecks,
        conformCount: progressStats.cCount,
        nonConformCount: progressStats.ncCount,
        naCount: progressStats.naCount,
        actionPlansCreated: newActionPlans.length,
        qrVerifiedCount: qrStats.qrCount,
        manualFallbackCount: qrStats.manualCount,
        notes: sectorNotes.trim() || undefined,
      };

      onSaveExtinguishersBatch(updatedList, newActionPlans, completionData);
      playIndustrialSound(newActionPlans.length > 0 ? 'warning' : 'success');
      onClose();
      return;
    }

    if (mode === 'hidrantes' && onSaveHydrantsBatch) {
      const divMap: Record<string, ActionPlanDivision> = {
        empacotamento: 'EMPACOTAMENTO',
        posto_combustivel: 'POSTO DE COMBUSTIVEL',
        adm_agricola: 'ADM/GMA',
        industria: 'INDUSTRIA',
      };

      const updatedList: Hydrant[] = hydrants.map((hid) => {
        const ev = evaluations[hid.id];
        const valveOperant = ev.criteria['valve'] !== 'NC';
        const cabinetConditionOk = ev.criteria['cabinet'] !== 'NC';
        const hoseTestedOk = ev.criteria['hose'] !== 'NC';
        const storzKeysPresent = ev.criteria['storz'] !== 'NC';
        const nozzleOperant = ev.criteria['nozzle'] !== 'NC';
        const unobstructed = ev.criteria['access'] !== 'NC';

        const hasNC = HYD_CRITERIA.some((c) => ev.criteria[c.id] === 'NC');
        const ncItemsText = HYD_CRITERIA.filter((c) => ev.criteria[c.id] === 'NC')
          .map((c) => c.title)
          .join(', ');

        if (hasNC) {
          newActionPlans.push({
            id: `pa-hid-setor-${hid.code}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            system: 'hidrantes',
            division: divMap[hid.sector] || 'EMPACOTAMENTO',
            checklistDoc: 'NBR 13714',
            itemChecked: `[Setor ${sectorName}] Hidrante ${hid.code} (${hid.locationDetails})`,
            nonConformityDescription: `Itens NC: ${ncItemsText}. Detalhes: ${ev.ncObservation.trim()}`,
            correctiveAction: 'Programar manutenção imediata de válvulas, mangueiras ou desobstrução do abrigo.',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            responsible: 'Brigada de Emergência & Manutenção Hidráulica',
            status: 'em_andamento',
            priority: 'alta',
            createdAt: inspectionDate,
            notes: `Checklist do setor ${sectorName} registrado por ${effectiveInspector}.`,
          });
        }

        const measuredPressure = Number(ev.staticPressureBar ?? hid.lastMeasuredPressureKgf ?? hid.nominalPressureKgf);
        const verif = qrVerifications[hid.id];
        const record: HydrantInspection = {
          id: `insp-hid-set-${hid.id}-${Date.now()}`,
          date: inspectionDate,
          inspectorName: effectiveInspector,
          valveOperant,
          cabinetConditionOk,
          hoseTestedOk,
          storzKeysPresent,
          nozzleOperant,
          unobstructed,
          staticPressureBar: measuredPressure,
          result: hasNC ? 'reprovado' : 'aprovado',
          verificationMethod: verif?.method || 'qr_scan',
          manualFallbackReason: verif?.reason,
          verifiedAt: verif?.verifiedAt,
          notes: [
            `Checklist Setor: ${sectorName}`,
            verif?.method === 'manual_fallback'
              ? `Manual (Erro QR: ${verif.reason || 'Não informado'})`
              : 'QR Lido',
            ev.ncObservation.trim(),
            sectorNotes.trim(),
          ]
            .filter(Boolean)
            .join(' | '),
        };

        return {
          ...hid,
          lastMeasuredPressureKgf: measuredPressure,
          status: hasNC ? 'atencao' : 'operacional',
          inspections: [record, ...(hid.inspections || [])],
        };
      });

      const proto = `UISA-SET-HID-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1
      ).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

      const completionData: ChecklistCompletionData = {
        protocol: proto,
        systemName: `Hidrantes — Setor: ${sectorName} (${hydrants.length} unid.)`,
        docNumber: 'NBR 13714',
        revision: '01',
        unit: `${unitLabel} • ${sectorName}`,
        completedAt: `${formatDateBR(inspectionDate)} às ${nowTime}`,
        inspectorName: effectiveInspector,
        inspectorRE: signature.registrationNumber,
        signatureType: signature.type,
        signaturePreview: signature.signatureImage,
        totalItems: progressStats.totalChecks,
        conformCount: progressStats.cCount,
        nonConformCount: progressStats.ncCount,
        naCount: progressStats.naCount,
        actionPlansCreated: newActionPlans.length,
        qrVerifiedCount: qrStats.qrCount,
        manualFallbackCount: qrStats.manualCount,
        notes: sectorNotes.trim() || undefined,
      };

      onSaveHydrantsBatch(updatedList, newActionPlans, completionData);
      playIndustrialSound(newActionPlans.length > 0 ? 'warning' : 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border-2 border-[#007960]/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#007960] to-[#005a47] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              {mode === 'extintores' ? <Flame className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 uppercase">
                  {mode === 'extintores' ? 'Checklist de Extintores por Setor' : 'Checklist de Hidrantes por Setor'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-400 text-slate-950">
                  {mode === 'extintores' ? 'NBR 12962 / NR-23' : 'NBR 13714'}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                Setor: {sectorName}
              </h3>
              <p className="text-xs text-emerald-100">
                {unitLabel} • {items.length} {mode === 'extintores' ? 'extintor(es)' : 'hidrante(s)'} incluído(s) neste checklist
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Progress Strip + Mandatory QR Verification Bar */}
        <div className="px-6 py-3 bg-[#f8faf9] border-b border-slate-200 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-slate-700">Leitura QR Obrigatória:</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg font-mono font-bold border ${
                  qrStats.allVerified
                    ? 'bg-emerald-50 text-[#007960] border-[#007960]/40'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {qrStats.verifiedCount} / {items.length} verificados
              </span>
              <span className="text-[11px] font-bold text-[#007960]">
                ({qrStats.qrCount} QR{qrStats.manualCount > 0 ? ` + ${qrStats.manualCount} Manual Erro QR` : ''})
              </span>
            </div>

            <button
              type="button"
              onClick={openBatchQrScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>
                {qrStats.allVerified
                  ? 'Leitura QR Concluída ✓ (Reabrir Leitor)'
                  : `Escanear QR Code (${qrStats.pendingCount} pendente${qrStats.pendingCount === 1 ? '' : 's'})`}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Checklist Preenchido:</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg font-mono font-bold border ${
                  progressStats.answeredChecks === progressStats.totalChecks && progressStats.totalChecks > 0
                    ? 'bg-emerald-50 text-[#007960] border-[#007960]/40'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {progressStats.answeredChecks} / {progressStats.totalChecks} itens
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-emerald-200">
                C: {progressStats.cCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-red-50 text-[#de2726] border border-red-200">
                NC: {progressStats.ncCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                N/A: {progressStats.naCount}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Date and General Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8faf9] p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data da Inspeção do Setor:</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Observações Gerais do Setor (opcional):</label>
              <input
                type="text"
                value={sectorNotes}
                onChange={(e) => setSectorNotes(e.target.value)}
                placeholder={`Condições gerais encontradas no setor ${sectorName}...`}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>
          </div>

          {/* Mandatory Item Flagging Banner */}
          <ChecklistMandatoryNotice
            totalItems={progressStats.totalChecks}
            answeredItems={progressStats.answeredChecks}
            hasAttemptedSubmit={hasAttemptedSubmit}
            itemLabel={`itens (${items.length} equipamento(s))`}
          />

          {/* Equipment Checklist Cards */}
          <div className="space-y-4">
            {items.map((item, idx) => {
              const ev = evaluations[item.id] || { criteria: {}, ncObservation: '' };
              const answeredForThis = criteriaList.filter(
                (c) => ev.criteria[c.id] !== null && ev.criteria[c.id] !== undefined
              ).length;
              const isComplete = answeredForThis === criteriaList.length;
              const hasNC = criteriaList.some((c) => ev.criteria[c.id] === 'NC');
              const isExpanded = expandedItemIds[item.id] ?? true;
              const verif = qrVerifications[item.id];
              const isItemVerified = Boolean(verif);

              const extItem = mode === 'extintores' ? (item as Extinguisher) : null;
              const hydItem = mode === 'hidrantes' ? (item as Hydrant) : null;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    hasNC
                      ? 'border-red-300 bg-red-50/20'
                      : isComplete && isItemVerified
                      ? 'border-[#007960]/40 bg-emerald-50/10'
                      : hasAttemptedSubmit && (!isItemVerified || !isComplete)
                      ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Equipment Card Header */}
                  <div className="px-4 py-3 bg-[#f8faf9] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#007960] text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900">{item.code}</span>
                          {extItem && (
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                              {TYPE_MAP[extItem.type]?.name || extItem.type} ({extItem.capacityWeight})
                            </span>
                          )}
                          {hydItem && hydItem.cabinetNumber && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-[#007960]/30 text-[10px] font-mono font-bold text-[#007960]">
                              {hydItem.cabinetNumber}
                            </span>
                          )}
                          {verif?.method === 'qr_scan' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-[#007960] border border-[#007960]/30 flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              <span>QR Lido ({verif.verifiedAt})</span>
                            </span>
                          ) : verif?.method === 'manual_fallback' ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"
                              title={verif.reason}
                            >
                              <ClipboardEdit className="w-3 h-3" />
                              <span>Manual (Erro QR)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-[#de2726] border border-rose-200 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Pendente Leitura QR</span>
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              hasNC
                                ? 'bg-red-100 text-[#de2726]'
                                : isComplete
                                ? 'bg-emerald-100 text-[#007960]'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {answeredForThis}/{criteriaList.length} {hasNC ? '• NC' : isComplete ? '• Completo' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#007960] shrink-0" />
                          <span className="truncate">{item.locationDetails}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!isItemVerified && (
                        <button
                          type="button"
                          onClick={() => openSingleQrScanner(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-[11px] font-bold transition-colors shadow-2xs"
                          title="Ler QR Code ou liberar checklist manual em caso de erro"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Ler QR / Manual</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!isItemVerified}
                        onClick={() => handleMarkEquipmentAllC(item.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#007960] disabled:opacity-40 disabled:cursor-not-allowed text-[#007960] hover:text-white border border-[#007960]/30 text-[11px] font-bold transition-colors"
                        title={
                          isItemVerified
                            ? 'Marcar todos os critérios deste equipamento como Conforme (C)'
                            : 'Realize a leitura do QR Code primeiro'
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Todos C</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearEquipment(item.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors"
                        title="Limpar respostas deste equipamento"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                        title={isExpanded ? 'Recolher itens' : 'Expandir itens'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Criteria List */}
                  {isExpanded && (
                    <div className="p-4 space-y-2.5">
                      {!isItemVerified && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>
                              Escaneie o QR Code de <strong>{item.code}</strong> para liberar o preenchimento (ou use{' '}
                              <strong>Erro de Leitura → Manual</strong> se a etiqueta falhar).
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openSingleQrScanner(item)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Ler QR / Erro Manual</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500 px-2">
                        <span>Item de Verificação</span>
                        <div className="flex items-center gap-4 pr-1">
                          <span className="w-8 text-center text-[#007960]">C</span>
                          <span className="w-8 text-center text-[#de2726]">NC</span>
                          <span className="w-8 text-center text-slate-500">N/A</span>
                        </div>
                      </div>

                      {criteriaList.map((crit) => {
                        const val = ev.criteria[crit.id] ?? null;
                        const isMissing = val === null;
                        return (
                          <div
                            key={crit.id}
                            className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              !isItemVerified
                                ? 'bg-slate-50/70 border-slate-200 opacity-60'
                                : val === 'NC'
                                ? 'bg-red-50/70 border-red-300'
                                : val === 'C'
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : val === 'N/A'
                                ? 'bg-slate-50 border-slate-200'
                                : hasAttemptedSubmit && isMissing
                                ? 'bg-red-50/50 border-red-400 ring-1 ring-red-300'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800">{crit.title}</span>
                                {isItemVerified && hasAttemptedSubmit && isMissing && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#de2726] border border-red-300 text-[10px] font-bold">
                                    Obrigatório flegar
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">{crit.description}</span>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 self-end sm:self-center pr-1">
                              <label className="w-8 flex items-center justify-center cursor-pointer">
                                <input
                                  type="radio"
                                  disabled={!isItemVerified}
                                  name={`${item.id}_${crit.id}`}
                                  checked={val === 'C'}
                                  onChange={() => handleSetCriterion(item.id, crit.id, 'C')}
                                  className="w-4 h-4 text-[#007960] focus:ring-[#007960] cursor-pointer disabled:cursor-not-allowed"
                                />
                              </label>
                              <label className="w-8 flex items-center justify-center cursor-pointer">
                                <input
                                  type="radio"
                                  disabled={!isItemVerified}
                                  name={`${item.id}_${crit.id}`}
                                  checked={val === 'NC'}
                                  onChange={() => handleSetCriterion(item.id, crit.id, 'NC')}
                                  className="w-4 h-4 text-[#de2726] focus:ring-[#de2726] cursor-pointer disabled:cursor-not-allowed"
                                />
                              </label>
                              <label className="w-8 flex items-center justify-center cursor-pointer">
                                <input
                                  type="radio"
                                  disabled={!isItemVerified}
                                  name={`${item.id}_${crit.id}`}
                                  checked={val === 'N/A'}
                                  onChange={() => handleSetCriterion(item.id, crit.id, 'N/A')}
                                  className="w-4 h-4 text-slate-500 focus:ring-slate-400 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}

                      {/* Extra technical measurements */}
                      {hydItem && (
                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <label className="text-[11px] font-bold text-slate-700">
                            Pressão Estática Medida (Kgf/cm²):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={ev.staticPressureBar ?? hydItem.nominalPressureKgf}
                            onChange={(e) => handlePressureChange(item.id, Number(e.target.value))}
                            className="w-28 bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1 font-mono text-slate-900 focus:outline-none focus:border-[#007960]"
                          />
                        </div>
                      )}

                      {extItem && extItem.type === 'co2' && (
                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <label className="text-[11px] font-bold text-slate-700">
                            Peso Aferido CO2 (kg) [Ref: {extItem.grossWeightRefKg || '-'} kg]:
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            value={ev.weightMeasuredKg ?? ''}
                            onChange={(e) =>
                              handleWeightChange(item.id, parseFloat(e.target.value) || undefined)
                            }
                            placeholder="Ex: 14.20"
                            className="w-28 bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1 font-mono text-slate-900 focus:outline-none focus:border-[#007960]"
                          />
                        </div>
                      )}

                      {/* Mandatory NC Observation */}
                      {hasNC && (
                        <div className="mt-2 pt-2.5 border-t border-red-200 animate-in fade-in">
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-[#de2726]">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Não Conformidade Detectada em {item.code} (Gera Plano de Ação Automático):
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            required
                            value={ev.ncObservation}
                            onChange={(e) => handleObservationChange(item.id, e.target.value)}
                            placeholder={`Descreva a não conformidade encontrada em ${item.code}...`}
                            className="w-full bg-white border border-red-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#de2726]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mandatory Signature */}
          <div className="pt-2 border-t border-slate-200">
            <ChecklistSignatureModule
              signature={signature}
              onChangeSignature={setSignature}
              hasAttemptedSubmit={hasAttemptedSubmit}
            />
          </div>

          <ChecklistMandatoryNotice
            totalItems={progressStats.totalChecks}
            answeredItems={progressStats.answeredChecks}
            hasAttemptedSubmit={hasAttemptedSubmit}
            itemLabel={`itens (${items.length} equipamento(s))`}
          />

          {validationError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-[#de2726] text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold shadow-xs transition-all ${
                qrStats.allVerified && progressStats.answeredChecks === progressStats.totalChecks
                  ? 'bg-[#007960] hover:bg-[#005a47]'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
              title={
                qrStats.allVerified
                  ? 'Finalizar Checklist'
                  : `Faltam ${qrStats.pendingCount} equipamento(s) para ler o QR Code (ou liberar manual)`
              }
            >
              <Save className="w-4 h-4" />
              <span>
                {!qrStats.allVerified
                  ? `Aguardando QR (${qrStats.verifiedCount}/${items.length})`
                  : progressStats.answeredChecks === progressStats.totalChecks
                  ? `Finalizar Checklist (${items.length} unid.)`
                  : `Flegar todos os itens (${progressStats.answeredChecks}/${progressStats.totalChecks})`}
              </span>
            </button>
          </div>
        </form>
      </div>

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => {
          setIsQrScannerOpen(false);
          setQrScannerTargetItem(null);
        }}
        equipmentKind={mode === 'extintores' ? 'extintor' : 'hidrante'}
        expectedItem={qrScannerTargetItem}
        items={scannableItems}
        onQrMatched={(matchedItemId) => {
          setQrVerifications((prev) => ({
            ...prev,
            [matchedItemId]: {
              method: 'qr_scan',
              verifiedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            },
          }));
          setExpandedItemIds((prev) => ({ ...prev, [matchedItemId]: true }));
        }}
        onManualFallback={(itemId, reason) => {
          setQrVerifications((prev) => ({
            ...prev,
            [itemId]: {
              method: 'manual_fallback',
              verifiedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              reason,
            },
          }));
          setExpandedItemIds((prev) => ({ ...prev, [itemId]: true }));
        }}
      />
    </div>
  );
};
