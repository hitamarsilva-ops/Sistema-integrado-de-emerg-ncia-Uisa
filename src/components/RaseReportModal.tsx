import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  Paperclip,
  PenTool,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  RasePhotoAttachment,
  RaseReport,
  RaseTechnicalParticipant,
} from '../types/pae';
import { PAE_RASE_DOCUMENT } from '../data/paeData';
import { ParticipantSignaturePad } from './ParticipantSignaturePad';
import { UisaLogo } from './UisaLogo';
import { formatDateBR } from '../utils/formatters';

interface RaseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReport?: RaseReport | null;
  defaultExerciseTitle?: string;
  defaultLocation?: string;
  defaultDate?: string;
  defaultTime?: string;
  scheduleItemId?: string;
  scheduleMonthKey?: string;
  onSave: (report: RaseReport) => void;
  onRevertCompletion?: () => void;
  onViewBlankPdf?: () => void;
}

const createEmptyParticipant = (): RaseTechnicalParticipant => ({
  id: `sst-part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  role: '',
});

export const RaseReportModal: React.FC<RaseReportModalProps> = ({
  isOpen,
  onClose,
  initialReport,
  defaultExerciseTitle = '',
  defaultLocation = '',
  defaultDate = new Date().toISOString().split('T')[0],
  defaultTime = '09:00',
  scheduleItemId,
  scheduleMonthKey,
  onSave,
  onRevertCompletion,
  onViewBlankPdf,
}) => {
  const [drillExercise, setDrillExercise] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [occurrenceDescription, setOccurrenceDescription] = useState('');
  const [emergencyActionsTrigger, setEmergencyActionsTrigger] = useState('');
  const [actionsChronology, setActionsChronology] = useState('');
  const [observedDeviations, setObservedDeviations] = useState('');
  const [positivePoints, setPositivePoints] = useState('');
  const [criticalEffectivenessAnalysis, setCriticalEffectivenessAnalysis] = useState('');
  const [sstParticipants, setSstParticipants] = useState<RaseTechnicalParticipant[]>([
    createEmptyParticipant(),
  ]);
  const [signingRowId, setSigningRowId] = useState<string | null>(null);
  const [attendanceListName, setAttendanceListName] = useState<string | undefined>(undefined);
  const [attendanceListData, setAttendanceListData] = useState<string | undefined>(undefined);

  const [isClassifiedAreaNoElectronics, setIsClassifiedAreaNoElectronics] = useState(false);
  const [photoAttachments, setPhotoAttachments] = useState<RasePhotoAttachment[]>([]);

  const [participantsCount, setParticipantsCount] = useState('30');
  const [responseTimeMinutes, setResponseTimeMinutes] = useState('4.0');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValidationErrors([]);
    setSigningRowId(null);
    setIsPrintPreview(false);

    if (initialReport) {
      setDrillExercise(initialReport.drillExercise);
      setDate(initialReport.date);
      setTime(initialReport.time);
      setLocation(initialReport.location);
      setOccurrenceDescription(initialReport.occurrenceDescription);
      setEmergencyActionsTrigger(initialReport.emergencyActionsTrigger);
      setActionsChronology(initialReport.actionsChronology);
      setObservedDeviations(initialReport.observedDeviations);
      setPositivePoints(initialReport.positivePoints);
      setCriticalEffectivenessAnalysis(initialReport.criticalEffectivenessAnalysis);
      setSstParticipants(
        initialReport.sstParticipants.length > 0
          ? initialReport.sstParticipants
          : [createEmptyParticipant()]
      );
      setAttendanceListName(initialReport.attendanceListAttachedName);
      setAttendanceListData(initialReport.attendanceListAttachedData);
      setIsClassifiedAreaNoElectronics(initialReport.isClassifiedAreaNoElectronics);
      setPhotoAttachments(initialReport.photoAttachments || []);
      setParticipantsCount(
        initialReport.participantsCount ? String(initialReport.participantsCount) : '30'
      );
      setResponseTimeMinutes(
        initialReport.responseTimeMinutes ? String(initialReport.responseTimeMinutes) : '4.0'
      );
    } else {
      setDrillExercise(defaultExerciseTitle);
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime(defaultTime || '09:00');
      setLocation(defaultLocation);
      setOccurrenceDescription('');
      setEmergencyActionsTrigger('');
      setActionsChronology('');
      setObservedDeviations('');
      setPositivePoints('');
      setCriticalEffectivenessAnalysis('');
      setSstParticipants([createEmptyParticipant()]);
      setAttendanceListName(undefined);
      setAttendanceListData(undefined);
      setIsClassifiedAreaNoElectronics(false);
      setPhotoAttachments([]);
      setParticipantsCount('30');
      setResponseTimeMinutes('4.0');
    }
  }, [isOpen, initialReport, defaultExerciseTitle, defaultLocation, defaultDate, defaultTime]);

  if (!isOpen) return null;

  const handleUpdateParticipant = (
    id: string,
    patch: Partial<RaseTechnicalParticipant>
  ) => {
    setSstParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const handleRemoveParticipant = (id: string) => {
    setSstParticipants((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  const handleAttendanceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setAttendanceListName(file.name);
        setAttendanceListData(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setPhotoAttachments((prev) => [
            ...prev,
            {
              id: `rase-photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fileName: file.name,
              dataUrl: result,
              caption: '',
              uploadedAt: new Date().toISOString(),
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const validateReport = (): string[] => {
    const errs: string[] = [];
    if (!drillExercise.trim()) errs.push('1. Informe o Exercício Simulado executado.');
    if (!date.trim()) errs.push('1. Informe a Data do simulado.');
    if (!time.trim()) errs.push('1. Informe o Horário do simulado.');
    if (!location.trim()) errs.push('1. Informe o Local de execução.');
    if (!occurrenceDescription.trim()) errs.push('2. Preencha a Descrição da Ocorrência.');
    if (!emergencyActionsTrigger.trim()) {
      errs.push('3. Preencha o Desencadeamento das Ações de Emergência.');
    }
    if (!actionsChronology.trim()) errs.push('4. Preencha a Cronologia das Ações.');
    if (!observedDeviations.trim()) errs.push('5. Preencha os Principais Desvios Observados.');
    if (!positivePoints.trim()) errs.push('6. Preencha os Principais Pontos Positivos.');
    if (!criticalEffectivenessAnalysis.trim()) {
      errs.push('7. Preencha a Análise Crítica de Avaliação e Eficácia do Simulado.');
    }

    const validSst = sstParticipants.filter(
      (p) => p.name.trim() && p.role.trim() && p.signatureDataUrl
    );
    if (validSst.length === 0) {
      errs.push(
        '8. Cadastre ao menos 1 integrante da Equipe Técnica SST com Nome, Função e Assinatura/Rubrica.'
      );
    }

    if (!isClassifiedAreaNoElectronics && photoAttachments.length === 0) {
      errs.push(
        '9. Anexe ao menos 1 arquivo fotográfico ou marque a dispensa para área classificada / risco com eletroeletrônicos.'
      );
    }
    return errs;
  };

  const buildReportObject = (): RaseReport => {
    const nowIso = new Date().toISOString();
    return {
      id: initialReport?.id || `rase-${Date.now()}`,
      docCode: 'SST.RE-085',
      revision: '00',
      scheduleItemId: initialReport?.scheduleItemId || scheduleItemId,
      scheduleMonthKey: initialReport?.scheduleMonthKey || scheduleMonthKey,
      drillExercise: drillExercise.trim(),
      date,
      time,
      location: location.trim(),
      occurrenceDescription: occurrenceDescription.trim(),
      emergencyActionsTrigger: emergencyActionsTrigger.trim(),
      actionsChronology: actionsChronology.trim(),
      observedDeviations: observedDeviations.trim(),
      positivePoints: positivePoints.trim(),
      criticalEffectivenessAnalysis: criticalEffectivenessAnalysis.trim(),
      sstParticipants: sstParticipants.filter((p) => p.name.trim() || p.role.trim() || p.signatureDataUrl),
      attendanceListAttachedName: attendanceListName,
      attendanceListAttachedData: attendanceListData,
      isClassifiedAreaNoElectronics,
      photoAttachments,
      participantsCount: Number(participantsCount) || undefined,
      responseTimeMinutes: Number(responseTimeMinutes) || undefined,
      createdAt: initialReport?.createdAt || nowIso,
      updatedAt: nowIso,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateReport();
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    onSave(buildReportObject());
  };

  const handlePrint = () => {
    setIsPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const draft = buildReportObject();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="bg-[#007960] text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-100">
                <strong className="text-white">{PAE_RASE_DOCUMENT.code}</strong>
                <span aria-hidden="true">·</span>
                <span>Revisão {PAE_RASE_DOCUMENT.revision}</span>
                <span aria-hidden="true">·</span>
                <span>Obrigatório por simulado executado</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                RASE — Relatório de Análise de Emergências
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onViewBlankPdf && (
              <button
                type="button"
                onClick={onViewBlankPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors min-h-[40px]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anexo SST.RE-085</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPrintPreview((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors min-h-[40px]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isPrintPreview ? 'Voltar à Edição' : 'Folha Oficial'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[#007960] hover:bg-emerald-50 text-xs font-bold transition-colors min-h-[40px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Fechar formulário"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Edit Form vs Official Print Sheet Preview */}
        {isPrintPreview ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0">
            <div className="bg-white border border-slate-400 mx-auto max-w-3xl p-4 sm:p-6 text-slate-900 text-xs space-y-3 print:border-black print:max-w-none">
              {/* Header Box matching SST.RE-085 */}
              <table className="w-full border-collapse border border-slate-700 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-700 p-2.5 w-36 align-middle">
                      <UisaLogo size="sm" />
                    </td>
                    <td className="border border-slate-700 p-2.5 text-center align-middle">
                      <span className="text-lg font-black tracking-wide block">RASE</span>
                    </td>
                    <td className="border border-slate-700 p-2.5 w-44 text-[11px] font-mono leading-snug align-middle">
                      <div>Doc. SST.RE-085</div>
                      <div>Data: 28/11/2024</div>
                      <div>Revisão: 00</div>
                      <div>Pág. 1/2 e 2/2</div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="border border-slate-700 py-1.5 px-3 text-center font-bold text-sm">
                      Relatório de Análise de Emergências
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 1- INFORMAÇÕES GERAIS */}
              <table className="w-full border-collapse border border-slate-700">
                <thead>
                  <tr className="bg-slate-200">
                    <th colSpan={3} className="border border-slate-700 px-2.5 py-1.5 text-left font-bold uppercase">
                      1- INFORMAÇÕES GERAIS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="border border-slate-700 px-2.5 py-2">
                      <strong>Exercício Simulado:</strong> {draft.drillExercise || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-700 px-2.5 py-2 w-1/3">
                      <strong>Data:</strong> {draft.date ? formatDateBR(draft.date) : '—'}
                    </td>
                    <td className="border border-slate-700 px-2.5 py-2 w-1/3">
                      <strong>Horário:</strong> {draft.time || '—'}
                    </td>
                    <td className="border border-slate-700 px-2.5 py-2 w-1/3">
                      <strong>Local:</strong> {draft.location || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Sections 2 to 7 */}
              {[
                { num: '2', title: 'DESCRIÇÃO DA OCORRÊNCIA', value: draft.occurrenceDescription },
                { num: '3', title: 'DESENCADEAMENTO DAS AÇÕES DE EMERGÊNCIA', value: draft.emergencyActionsTrigger },
                { num: '4', title: 'CRONOLOGIA DAS AÇÕES', value: draft.actionsChronology },
                { num: '5', title: 'PRINCIPAIS DESVIOS OBSERVADOS', value: draft.observedDeviations },
                { num: '6', title: 'PRINCIPAIS PONTOS POSITIVOS', value: draft.positivePoints },
                { num: '7', title: 'ANÁLISE CRÍTICA DE AVALIAÇÃO E EFICÁCIA DO SIMULADO', value: draft.criticalEffectivenessAnalysis },
              ].map((sec) => (
                <table key={sec.num} className="w-full border-collapse border border-slate-700">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-slate-700 px-2.5 py-1.5 text-left font-bold uppercase">
                        {sec.num}- {sec.title}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-700 px-2.5 py-2.5 min-h-[60px] whitespace-pre-wrap leading-relaxed">
                        {sec.value || '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ))}

              {/* 8- PARTICIPANTES DA EQUIPE TÉCNICA SST */}
              <table className="w-full border-collapse border border-slate-700">
                <thead>
                  <tr className="bg-slate-200">
                    <th colSpan={3} className="border border-slate-700 px-2.5 py-1.5 text-left font-bold">
                      8- PARTICIPANTES DA EQUIPE TÉCNICA SST:{' '}
                      <span className="font-normal text-[10px]">
                        (A relação dos participantes da brigada e convidados será anexada junto a este relatório em lista de presença padrão da UISA.)
                      </span>
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-slate-700 px-2 py-1 text-center w-2/5">NOME</th>
                    <th className="border border-slate-700 px-2 py-1 text-center w-1/4">FUNÇÃO</th>
                    <th className="border border-slate-700 px-2 py-1 text-center">ASSINATURA</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.sstParticipants.map((p) => (
                    <tr key={p.id}>
                      <td className="border border-slate-700 px-2 py-2">{p.name || '—'}</td>
                      <td className="border border-slate-700 px-2 py-2">{p.role || '—'}</td>
                      <td className="border border-slate-700 px-2 py-1 text-center">
                        {p.signatureDataUrl ? (
                          <img
                            src={p.signatureDataUrl}
                            alt={`Assinatura ${p.name}`}
                            className="h-10 mx-auto object-contain"
                          />
                        ) : (
                          <span className="text-slate-400">Sem assinatura</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 9- ARQUIVOS FOTOGRÁFICOS */}
              <table className="w-full border-collapse border border-slate-700">
                <thead>
                  <tr className="bg-slate-200">
                    <th colSpan={2} className="border border-slate-700 px-2.5 py-1.5 text-left font-bold">
                      9- ARQUIVOS FOTOGRÁFICOS.{' '}
                      <span className="font-normal text-[10px]">
                        (Em áreas classificadas, ou que apresente algum risco quanto ao uso de aparelhos eletroeletrônicos este campo não é obrigatório).
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {draft.isClassifiedAreaNoElectronics ? (
                    <tr>
                      <td colSpan={2} className="border border-slate-700 p-3 text-slate-700 italic">
                        Dispensado por execução em área classificada / risco quanto ao uso de aparelhos eletroeletrônicos.
                      </td>
                    </tr>
                  ) : draft.photoAttachments.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="border border-slate-700 p-4 text-center text-slate-400">
                        Nenhuma fotografia anexada.
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={2} className="border border-slate-700 p-2.5">
                        <div className="grid grid-cols-2 gap-3">
                          {draft.photoAttachments.map((ph) => (
                            <div key={ph.id} className="border border-slate-300 p-1.5">
                              <img
                                src={ph.dataUrl}
                                alt={ph.caption || ph.fileName}
                                className="w-full h-40 object-cover"
                              />
                              <p className="text-[10px] text-slate-700 mt-1">
                                {ph.caption || ph.fileName}
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
            {/* Validation Banner */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3.5 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#de2726]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Preenchimento obrigatório pendente (RASE SST.RE-085):
                  </span>
                </div>
                <ul className="list-disc pl-5 text-red-900 space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 1- INFORMAÇÕES GERAIS */}
            <section className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 font-bold text-slate-900 uppercase tracking-wide flex items-center justify-between">
                <span>1- Informações Gerais *</span>
                <span className="text-[11px] font-mono text-[#007960] normal-case">Obrigatório</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Exercício Simulado *
                  </label>
                  <input
                    type="text"
                    required
                    value={drillExercise}
                    onChange={(e) => setDrillExercise(e.target.value)}
                    placeholder="Ex: Resgate em Espaços Confinados / Abandono de Área"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960] min-h-[40px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Data *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960] min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Horário *</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960] min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Local *</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex: Destilaria / Empacotamento Assari / GMA"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960] min-h-[40px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Total de Participantes / Evacuados
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={participantsCount}
                      onChange={(e) => setParticipantsCount(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 min-h-[38px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Tempo de Resposta / Abandono (minutos)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={responseTimeMinutes}
                      onChange={(e) => setResponseTimeMinutes(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 min-h-[38px]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 2 a 7: Text Sections */}
            {[
              {
                num: '2',
                title: 'Descrição da Ocorrência *',
                value: occurrenceDescription,
                setter: setOccurrenceDescription,
                placeholder:
                  'Descreva o cenário simulado, condições iniciais, ponto do sinistro e supostas vítimas envolvidas...',
              },
              {
                num: '3',
                title: 'Desencadeamento das Ações de Emergência *',
                value: emergencyActionsTrigger,
                setter: setEmergencyActionsTrigger,
                placeholder:
                  'Detalhe como foi feito o acionamento (Rádio Canal 01, Ramal 3737, sirene), mobilização da brigada e atuação do CAE...',
              },
              {
                num: '4',
                title: 'Cronologia das Ações *',
                value: actionsChronology,
                setter: setActionsChronology,
                placeholder:
                  'Ex:\n09:00 - Detecção e acionamento via rádio\n09:02 - Chegada da Brigada e isolamento\n09:05 - Controle / Resgate concluído',
                rows: 4,
              },
              {
                num: '5',
                title: 'Principais Desvios Observados *',
                value: observedDeviations,
                setter: setObservedDeviations,
                placeholder:
                  'Registre os desvios identificados (ou informe explicitamente "Nenhum desvio crítico observado")...',
              },
              {
                num: '6',
                title: 'Principais Pontos Positivos *',
                value: positivePoints,
                setter: setPositivePoints,
                placeholder:
                  'Registre os pontos positivos observados (rapidez na comunicação, uso correto de EPIs/SCBA, tempo de resposta)...',
              },
              {
                num: '7',
                title: 'Análise Crítica de Avaliação e Eficácia do Simulado *',
                value: criticalEffectivenessAnalysis,
                setter: setCriticalEffectivenessAnalysis,
                placeholder:
                  'Conclusão da equipe SST quanto à eficácia do exercício, atendimento ao PAE (SST.NP-022) e necessidade de novos treinamentos...',
              },
            ].map((field) => (
              <section key={field.num} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 font-bold text-slate-900 uppercase tracking-wide flex items-center justify-between">
                  <span>
                    {field.num}- {field.title}
                  </span>
                  <span className="text-[11px] font-mono text-[#007960] normal-case">Obrigatório</span>
                </div>
                <div className="p-3.5">
                  <textarea
                    required
                    rows={field.rows || 3}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
                  />
                </div>
              </section>
            ))}

            {/* 8- PARTICIPANTES DA EQUIPE TÉCNICA SST */}
            <section className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 uppercase tracking-wide block">
                    8- Participantes da Equipe Técnica SST *
                  </span>
                  <span className="text-[11px] text-slate-600">
                    (A relação dos participantes da brigada e convidados será anexada junto a este relatório em lista de presença padrão da UISA.)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSstParticipants((prev) => [...prev, createEmptyParticipant()])}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-semibold min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar SST</span>
                </button>
              </div>

              <div className="p-4 space-y-3">
                {sstParticipants.map((part, idx) => (
                  <div
                    key={part.id}
                    className="border border-slate-200 rounded-xl p-3 bg-[#f8faf9] space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Nome #{idx + 1} *
                        </label>
                        <input
                          type="text"
                          value={part.name}
                          onChange={(e) => handleUpdateParticipant(part.id, { name: e.target.value })}
                          placeholder="Nome completo do integrante SST"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 min-h-[40px]"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Função *
                        </label>
                        <input
                          type="text"
                          value={part.role}
                          onChange={(e) => handleUpdateParticipant(part.id, { role: e.target.value })}
                          placeholder="Ex: Técnico de Seg. do Trabalho"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 min-h-[40px]"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-end gap-2 pt-2 sm:pt-5">
                        {part.signatureDataUrl ? (
                          <div className="flex items-center gap-2 flex-1">
                            <img
                              src={part.signatureDataUrl}
                              alt={`Assinatura ${part.name}`}
                              className="h-10 max-w-[110px] object-contain bg-white border border-slate-300 rounded-md px-1"
                            />
                            <button
                              type="button"
                              onClick={() => setSigningRowId(part.id)}
                              className="text-[11px] font-semibold text-[#007960] hover:underline"
                            >
                              Refazer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSigningRowId(part.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#007960]/40 text-[#007960] hover:bg-emerald-50 text-xs font-bold min-h-[40px]"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Assinar</span>
                          </button>
                        )}

                        {sstParticipants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(part.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-[#de2726] hover:bg-red-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                            title="Remover linha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {signingRowId === part.id && (
                      <ParticipantSignaturePad
                        participantRole={part.role || 'Equipe Técnica SST'}
                        participantName={part.name}
                        onConfirm={(dataUrl, mode) => {
                          handleUpdateParticipant(part.id, {
                            signatureDataUrl: dataUrl,
                            signatureMode: mode,
                            signedAt: new Date().toISOString(),
                          });
                          setSigningRowId(null);
                        }}
                        onCancel={() => setSigningRowId(null)}
                      />
                    )}
                  </div>
                ))}

                {/* Lista de Presença Padrão da UISA (Anexo complementar) */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#007960]" />
                    <span>
                      Lista de presença padrão da UISA (brigada e convidados):{' '}
                      <strong className="text-slate-900">
                        {attendanceListName || 'Nenhum arquivo anexado'}
                      </strong>
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold cursor-pointer min-h-[38px]">
                    <Upload className="w-3.5 h-3.5 text-[#007960]" />
                    <span>{attendanceListName ? 'Substituir Lista' : 'Anexar Lista de Presença'}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleAttendanceUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* 9- ARQUIVOS FOTOGRÁFICOS */}
            <section className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wide">
                    9- Arquivos Fotográficos {isClassifiedAreaNoElectronics ? '(Dispensado)' : '*'}
                  </span>
                  <span className="text-[11px] font-mono text-[#007960]">
                    {photoAttachments.length} foto(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  (Em áreas classificadas, ou que apresente algum risco quanto ao uso de aparelhos eletroeletrônicos este campo não é obrigatório).
                </p>
              </div>

              <div className="p-4 space-y-3">
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#f8faf9] border border-slate-200 cursor-pointer text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={isClassifiedAreaNoElectronics}
                    onChange={(e) => setIsClassifiedAreaNoElectronics(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#007960] focus:ring-[#007960]"
                  />
                  <span className="font-medium">
                    Simulado executado em área classificada ou com risco para uso de aparelhos eletroeletrônicos (dispensa foto obrigatória)
                  </span>
                </label>

                <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-[#f8faf9] hover:bg-emerald-50/50 text-[#007960] border border-dashed border-[#007960]/40 font-bold text-xs transition-colors cursor-pointer min-h-[52px]">
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto ou Anexar Registros Fotográficos do Simulado</span>
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handlePhotosUpload}
                    className="hidden"
                  />
                </label>

                {photoAttachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {photoAttachments.map((photo) => (
                      <div
                        key={photo.id}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-[#f8faf9]"
                      >
                        <div className="relative h-40 bg-slate-200">
                          <img
                            src={photo.dataUrl}
                            alt={photo.fileName}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoAttachments((prev) => prev.filter((p) => p.id !== photo.id))
                            }
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-[#de2726] transition-colors"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5">
                          <input
                            type="text"
                            value={photo.caption || ''}
                            onChange={(e) =>
                              setPhotoAttachments((prev) =>
                                prev.map((p) =>
                                  p.id === photo.id ? { ...p, caption: e.target.value } : p
                                )
                              )
                            }
                            placeholder={`Legenda (${photo.fileName})`}
                            className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-[11px] bg-white text-slate-800"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
              {initialReport && onRevertCompletion ? (
                <button
                  type="button"
                  onClick={onRevertCompletion}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-[#de2726] hover:bg-red-50 min-h-[40px]"
                >
                  Desmarcar Conclusão
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Formulário obrigatório conforme Doc. SST.RE-085 (Rev. 00)
                </span>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white font-bold flex items-center gap-1.5 min-h-[40px]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Salvar RASE Obrigatório e Concluir Simulado</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
