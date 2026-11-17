import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  FileText,
  Printer,
  Plus,
  UserPlus,
  UserCheck,
  UserX,
  RotateCcw,
  Upload,
  ShieldCheck,
  Factory,
  Package,
  Building2,
  Search,
  MapPin,
  X,
  Save,
  Trash2,
  Eye,
  ScanFace,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { BrigadeMember, BrigadeShift } from '../types/brigade';
import { BRIGADE_SHIFTS, ROLE_LABELS } from '../data/brigadeData';
import {
  BrigadeMeeting,
  BrigadeMeetingLocation,
  INITIAL_BRIGADE_MEETINGS,
  STORAGE_KEY_MEETINGS,
} from './BrigadeMeetingsView';
import { playIndustrialSound } from '../utils/audioAlerts';
import {
  SstRe086ReferenceBanner,
  SstRe086ReferenceModal,
} from './SstRe086ReferenceModal';

export const STORAGE_KEY_BRIGADE_ATAS = 'sge_desktop_brigade_atas_uisa_v1';

export interface AtaPhotoAttachment {
  id: string;
  fileName: string;
  dataUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface FacialAttendanceRecord {
  id: string;
  memberId?: string;
  name: string;
  registrationNumber: string;
  shift: string;
  roleLabel: string;
  status: 'presente' | 'ausente';
  justification?: string;
  facialImage?: string; // Data URL da captura facial
  facialTimestamp?: string;
  facialHash?: string;
}

export interface BrigadeUnitAtaRecord {
  id: string;
  protocol: string;
  ordinaryMeetingNumber?: string; // Reunião Ordinária Nº (SST.RE-086)
  unit: BrigadeMeetingLocation;
  linkedMeetingId?: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  room: string;
  theme: string;
  involvedShifts: BrigadeShift[];
  coordinatorName: string;
  coordinatorRole: string;
  objectives: string;
  agendaItems: string[];
  minutesSummary: string;
  actionPoints: string[];
  photoAttachments?: AtaPhotoAttachment[];
  attendance: FacialAttendanceRecord[];
  createdAt: string;
  updatedAt: string;
}

interface BrigadeUnitAtaViewProps {
  unit: BrigadeMeetingLocation;
  members: BrigadeMember[];
}

const UNIT_META: Record<
  BrigadeMeetingLocation,
  {
    title: string;
    shortBadge: string;
    subtitle: string;
    defaultRoom: string;
    defaultCoordinatorRole: string;
    icon: React.FC<{ className?: string }>;
    codePrefix: string;
  }
> = {
  industria: {
    title: 'Unidade Indústria — Reuniões & Ata da Brigada',
    shortBadge: 'INDÚSTRIA (IND)',
    subtitle: 'Destilaria, Moenda, Caldeiras, Fábrica de Açúcar, Casa de Força e Tancagem',
    defaultRoom: 'Sala de Treinamento da Brigada Industrial (IND)',
    defaultCoordinatorRole: 'Coordenação Brigada IND / Técnico de Segurança',
    icon: Factory,
    codePrefix: 'IND',
  },
  empacotamento: {
    title: 'Unidade Empacotamento — Reuniões & Ata da Brigada',
    shortBadge: 'EMPACOTAMENTO (ASSARI)',
    subtitle: 'Silos, Ensaque 1kg/5kg, Big Bags, Paletizadora e Armazéns de Açúcar',
    defaultRoom: 'Auditório / Sala de SST Unidade Assari',
    defaultCoordinatorRole: 'Coordenação Brigada ASSARI / Técnico de Segurança',
    icon: Package,
    codePrefix: 'EMP',
  },
  adm: {
    title: 'Unidade ADM / GMA — Reuniões & Ata da Brigada',
    shortBadge: 'ADM / GMA (AGRÍCOLA & APOIO)',
    subtitle: 'Prédio Administrativo Central, GMA / Agrícola, Ambulatório Médico, Oficinas e Portaria',
    defaultRoom: 'Sala de Treinamento ADM Central / GMA',
    defaultCoordinatorRole: 'Coordenação Brigada ADM & GMA / Técnico de Segurança',
    icon: Building2,
    codePrefix: 'ADM',
  },
};

export const BrigadeUnitAtaView: React.FC<BrigadeUnitAtaViewProps> = ({ unit, members }) => {
  const meta = UNIT_META[unit];
  const UnitIcon = meta.icon;

  // Saved Atas from localStorage
  const [atas, setAtas] = useState<BrigadeUnitAtaRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BRIGADE_ATAS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler atas da brigada:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRIGADE_ATAS, JSON.stringify(atas));
    } catch (e) {
      console.error('Erro ao salvar atas da brigada:', e);
    }
  }, [atas]);

  // Official Unit Meetings loaded from shared schedule
  const [unitMeetings, setUnitMeetings] = useState<BrigadeMeeting[]>([]);

  const loadMeetingsFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MEETINGS);
      const list: BrigadeMeeting[] = raw ? JSON.parse(raw) : INITIAL_BRIGADE_MEETINGS;
      setUnitMeetings(
        list
          .filter((m) => m.location === unit)
          .sort((a, b) => a.monthIndex - b.monthIndex)
      );
    } catch {
      setUnitMeetings(
        INITIAL_BRIGADE_MEETINGS.filter((m) => m.location === unit).sort(
          (a, b) => a.monthIndex - b.monthIndex
        )
      );
    }
  };

  useEffect(() => {
    loadMeetingsFromStorage();
  }, [unit]);

  // Unit default members
  const unitMembers = useMemo(() => {
    return members.filter((m) => m.unit === unit);
  }, [members, unit]);

  const gmaForestalMembers = useMemo(() => {
    return members.filter((m) => m.unit === 'brigada_florestal');
  }, [members]);

  const buildDefaultAttendance = (list: BrigadeMember[]): FacialAttendanceRecord[] => {
    return list.map((m) => ({
      id: `att-${m.id}`,
      memberId: m.id,
      name: m.name,
      registrationNumber: m.registrationNumber || 'S/RE',
      shift: BRIGADE_SHIFTS[m.shift]?.name || m.shift,
      roleLabel: ROLE_LABELS[m.role]?.label || m.role,
      status: 'presente',
      justification: '',
    }));
  };

  // Active Ata Form State
  const [editingAtaId, setEditingAtaId] = useState<string | null>(null);
  const [linkedMeetingId, setLinkedMeetingId] = useState<string | undefined>(undefined);
  const [protocol, setProtocol] = useState<string>('');
  const [ordinaryMeetingNumber, setOrdinaryMeetingNumber] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('09:30');
  const [room, setRoom] = useState<string>(meta.defaultRoom);
  const [theme, setTheme] = useState<string>('');
  const [involvedShifts, setInvolvedShifts] = useState<BrigadeShift[]>([
    'turno_a',
    'turno_b',
    'turno_c',
    'administrativo',
  ]);
  const [coordinatorName, setCoordinatorName] = useState<string>('');
  const [coordinatorRole, setCoordinatorRole] = useState<string>(meta.defaultCoordinatorRole);
  const [objectives, setObjectives] = useState<string>('');
  const [agendaText, setAgendaText] = useState<string>('');
  const [minutesSummary, setMinutesSummary] = useState<string>('');
  const [actionPointsText, setActionPointsText] = useState<string>('');
  const [photoAttachments, setPhotoAttachments] = useState<AtaPhotoAttachment[]>([]);
  const [attendance, setAttendance] = useState<FacialAttendanceRecord[]>(() =>
    buildDefaultAttendance(unitMembers)
  );

  // Manual Extra Participant inputs
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [extraName, setExtraName] = useState('');
  const [extraRE, setExtraRE] = useState('');
  const [extraShift, setExtraShift] = useState('Turno A');
  const [extraRole, setExtraRole] = useState('Brigadista / Convidado');
  const [selectedImportMemberId, setSelectedImportMemberId] = useState('');

  // Filters / UI State
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedBannerAta, setSavedBannerAta] = useState<BrigadeUnitAtaRecord | null>(null);
  const [previewAta, setPreviewAta] = useState<BrigadeUnitAtaRecord | null>(null);
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);

  // Live Camera Facial Modal State
  const [facialTargetId, setFacialTargetId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateProtocol = () => {
    const unitAtasCount = atas.filter((a) => a.unit === unit).length + 1;
    const year = new Date().getFullYear();
    return `ATA-${meta.codePrefix}-${year}-${String(unitAtasCount).padStart(3, '0')}`;
  };

  const generateOrdinaryNumber = () => {
    const unitAtasCount = atas.filter((a) => a.unit === unit).length + 1;
    const year = new Date().getFullYear();
    return `${String(unitAtasCount).padStart(2, '0')}/${year}`;
  };

  // Reset form cleanly when unit prop changes
  useEffect(() => {
    startNewAtaForm();
    return () => {
      stopCamera();
    };
  }, [unit]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startNewAtaForm = () => {
    setEditingAtaId(null);
    setLinkedMeetingId(undefined);
    setProtocol(generateProtocol());
    setOrdinaryMeetingNumber(generateOrdinaryNumber());
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setStartTime('08:30');
    setEndTime('09:30');
    setRoom(meta.defaultRoom);
    setTheme('');
    setInvolvedShifts(['turno_a', 'turno_b', 'turno_c', 'administrativo']);
    setCoordinatorName('');
    setCoordinatorRole(meta.defaultCoordinatorRole);
    setObjectives('');
    setAgendaText(
      '1. Alinhamento dos protocolos operacionais de emergência e rotas de fuga\n2. Inspeção rápida de EPIs, rádios VHF e equipamentos do setor\n3. Assuntos gerais da Brigada de Emergência UISA'
    );
    setMinutesSummary('');
    setActionPointsText('');
    setPhotoAttachments([]);
    setAttendance(buildDefaultAttendance(unitMembers));
    setHasAttemptedSave(false);
    setValidationError(null);
    setSavedBannerAta(null);
  };

  const handleSelectOfficialMeeting = (meeting: BrigadeMeeting) => {
    // Check if there's already an Ata saved for this meeting
    const existingAta = atas.find((a) => a.unit === unit && a.linkedMeetingId === meeting.id);
    if (existingAta) {
      handleLoadSavedAta(existingAta);
      return;
    }

    setEditingAtaId(null);
    setLinkedMeetingId(meeting.id);
    setProtocol(generateProtocol());
    setOrdinaryMeetingNumber(
      `${String(meeting.monthIndex + 1).padStart(2, '0')}/${(meeting.meetingDate || '2026').slice(0, 4)}`
    );
    setMeetingDate(meeting.meetingDate || new Date().toISOString().split('T')[0]);
    setStartTime(meeting.time.replace(' h', '').trim() || '08:30');
    setEndTime('09:30');
    setRoom(meeting.room || meta.defaultRoom);
    setTheme(meeting.theme);
    setCoordinatorName(meeting.leaderName || '');
    setCoordinatorRole(meeting.leaderRole || meta.defaultCoordinatorRole);
    setObjectives(meeting.objectives || '');
    setAgendaText((meeting.agendaItems || []).join('\n'));
    setMinutesSummary(
      meeting.status === 'realizada' ? meeting.minutesSummary : ''
    );
    setActionPointsText((meeting.actionPoints || []).join('\n'));
    setPhotoAttachments([]);
    setAttendance(buildDefaultAttendance(unitMembers));
    setHasAttemptedSave(false);
    setValidationError(null);
    setSavedBannerAta(null);
  };

  const handleLoadSavedAta = (ata: BrigadeUnitAtaRecord) => {
    setEditingAtaId(ata.id);
    setLinkedMeetingId(ata.linkedMeetingId);
    setProtocol(ata.protocol);
    setOrdinaryMeetingNumber(ata.ordinaryMeetingNumber || generateOrdinaryNumber());
    setMeetingDate(ata.date);
    setStartTime(ata.startTime);
    setEndTime(ata.endTime);
    setRoom(ata.room);
    setTheme(ata.theme);
    setInvolvedShifts(ata.involvedShifts);
    setCoordinatorName(ata.coordinatorName);
    setCoordinatorRole(ata.coordinatorRole);
    setObjectives(ata.objectives);
    setAgendaText(ata.agendaItems.join('\n'));
    setMinutesSummary(ata.minutesSummary);
    setActionPointsText(ata.actionPoints.join('\n'));
    setPhotoAttachments(ata.photoAttachments || []);
    setAttendance(ata.attendance);
    setHasAttemptedSave(false);
    setValidationError(null);
    setSavedBannerAta(null);
  };

  // Photographic Evidence Upload Handlers
  const handleUploadPhotoAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          const item: AtaPhotoAttachment = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            fileName: file.name,
            dataUrl: result,
            caption: '',
            uploadedAt: new Date().toISOString(),
          };
          setPhotoAttachments((prev) => [...prev, item]);
          setValidationError(null);
          playIndustrialSound('ping');
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleUpdatePhotoCaption = (photoId: string, caption: string) => {
    setPhotoAttachments((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
  };

  const handleRemovePhotoAttachment = (photoId: string) => {
    setPhotoAttachments((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Facial Camera Modal Open & Capture
  const openFacialScanner = async (recordId: string) => {
    setFacialTargetId(recordId);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não disponível neste navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      setCameraError(
        'Não foi possível acessar a webcam diretamente. Utilize o botão abaixo para tirar selfie ou enviar a foto facial.'
      );
      setIsCameraActive(false);
    }
  };

  const closeFacialScanner = () => {
    stopCamera();
    setFacialTargetId(null);
    setCameraError(null);
  };

  const saveFacialForRecord = (recordId: string, dataUrl: string) => {
    const now = new Date();
    const hash =
      'FAC-UISA-' +
      meta.codePrefix +
      '-' +
      Math.random().toString(36).substring(2, 7).toUpperCase();

    setAttendance((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              status: 'presente',
              facialImage: dataUrl,
              facialTimestamp: now.toISOString(),
              facialHash: hash,
            }
          : item
      )
    );
    playIndustrialSound('success');
    closeFacialScanner();
  };

  const captureFromVideo = () => {
    if (!videoRef.current || !facialTargetId) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 400;
    canvas.height = videoRef.current.videoHeight || 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      saveFacialForRecord(facialTargetId, dataUrl);
    }
  };

  const handleFacialFileUpload = (recordId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        saveFacialForRecord(recordId, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearFacial = (recordId: string) => {
    setAttendance((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              facialImage: undefined,
              facialTimestamp: undefined,
              facialHash: undefined,
            }
          : item
      )
    );
  };

  const handleSetAttendanceStatus = (recordId: string, status: 'presente' | 'ausente') => {
    setAttendance((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              status,
              justification: status === 'presente' ? '' : item.justification,
            }
          : item
      )
    );
  };

  const handleSetJustification = (recordId: string, justification: string) => {
    setAttendance((prev) =>
      prev.map((item) => (item.id === recordId ? { ...item, justification } : item))
    );
  };

  const handleRemoveParticipant = (recordId: string) => {
    setAttendance((prev) => prev.filter((item) => item.id !== recordId));
  };

  const handleAddManualParticipant = () => {
    if (!extraName.trim()) return;
    const newRecord: FacialAttendanceRecord = {
      id: `att-extra-${Date.now()}`,
      name: extraName.trim(),
      registrationNumber: extraRE.trim() || 'CONVIDADO',
      shift: extraShift,
      roleLabel: extraRole.trim() || 'Participante',
      status: 'presente',
    };
    setAttendance((prev) => [newRecord, ...prev]);
    setExtraName('');
    setExtraRE('');
    setShowAddParticipant(false);
  };

  const handleImportMember = () => {
    if (!selectedImportMemberId) return;
    const m = members.find((mem) => mem.id === selectedImportMemberId);
    if (!m) return;
    if (attendance.some((a) => a.memberId === m.id)) {
      setSelectedImportMemberId('');
      return;
    }
    const newRecord: FacialAttendanceRecord = {
      id: `att-${m.id}-${Date.now()}`,
      memberId: m.id,
      name: m.name,
      registrationNumber: m.registrationNumber || 'S/RE',
      shift: BRIGADE_SHIFTS[m.shift]?.name || m.shift,
      roleLabel: ROLE_LABELS[m.role]?.label || m.role,
      status: 'presente',
    };
    setAttendance((prev) => [newRecord, ...prev]);
    setSelectedImportMemberId('');
  };

  const handleImportGmaMembers = () => {
    const existingMemberIds = new Set(attendance.map((a) => a.memberId).filter(Boolean));
    const toAdd = gmaForestalMembers.filter((m) => !existingMemberIds.has(m.id));
    if (toAdd.length === 0) return;
    setAttendance((prev) => [...prev, ...buildDefaultAttendance(toAdd)]);
  };

  const toggleShift = (s: BrigadeShift) => {
    setInvolvedShifts((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  // Attendance Summary Stats
  const attendanceStats = useMemo(() => {
    const present = attendance.filter((a) => a.status === 'presente');
    const absent = attendance.filter((a) => a.status === 'ausente');
    const facialDone = present.filter((a) => Boolean(a.facialImage));
    const facialPending = present.filter((a) => !a.facialImage);
    return {
      total: attendance.length,
      presentCount: present.length,
      absentCount: absent.length,
      facialDoneCount: facialDone.length,
      facialPendingList: facialPending,
    };
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    const q = attendanceSearch.toLowerCase().trim();
    if (!q) return attendance;
    return attendance.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.registrationNumber.toLowerCase().includes(q) ||
        a.shift.toLowerCase().includes(q) ||
        a.roleLabel.toLowerCase().includes(q)
    );
  }, [attendance, attendanceSearch]);

  const unitAtas = useMemo(() => {
    return atas
      .filter((a) => a.unit === unit)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [atas, unit]);

  // Save & Finalize Ata with Facial Attendance
  const handleSaveAta = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSave(true);

    if (!theme.trim()) {
      setValidationError('Informe o Tema / Assunto principal da reunião antes de registrar a Ata.');
      return;
    }
    if (!coordinatorName.trim()) {
      setValidationError('Informe o Nome do Coordenador / Instrutor responsável pela reunião.');
      return;
    }
    if (!minutesSummary.trim()) {
      setValidationError('Preencha o Relato da Reunião / Deliberações Oficiais da Ata (SST.RE-086).');
      return;
    }
    if (photoAttachments.length === 0) {
      setValidationError(
        'Arquivo Fotográfico Obrigatório: Anexe pelo menos 1 arquivo fotográfico da reunião antes de registrar a Ata (SST.RE-086).'
      );
      return;
    }
    if (attendanceStats.presentCount === 0) {
      setValidationError('Marque pelo menos 1 participante como Presente com validação facial.');
      return;
    }
    if (attendanceStats.facialPendingList.length > 0) {
      const pendingNames = attendanceStats.facialPendingList
        .slice(0, 3)
        .map((p) => p.name)
        .join(', ');
      const extra =
        attendanceStats.facialPendingList.length > 3
          ? ` e mais ${attendanceStats.facialPendingList.length - 3}`
          : '';
      setValidationError(
        `Captura Facial Obrigatória: ${attendanceStats.facialPendingList.length} participante(s) marcado(s) como Presente ainda não registraram foto facial (${pendingNames}${extra}). Capture a facial ou altere o status para Ausente.`
      );
      return;
    }

    setValidationError(null);

    const nowIso = new Date().toISOString();
    const record: BrigadeUnitAtaRecord = {
      id: editingAtaId || `ata-${unit}-${Date.now()}`,
      protocol: protocol.trim() || generateProtocol(),
      ordinaryMeetingNumber: ordinaryMeetingNumber.trim() || generateOrdinaryNumber(),
      unit,
      linkedMeetingId,
      date: meetingDate,
      startTime,
      endTime,
      room: room.trim() || meta.defaultRoom,
      theme: theme.trim(),
      involvedShifts,
      coordinatorName: coordinatorName.trim(),
      coordinatorRole: coordinatorRole.trim() || meta.defaultCoordinatorRole,
      objectives: objectives.trim(),
      agendaItems: agendaText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      minutesSummary: minutesSummary.trim(),
      actionPoints: actionPointsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      photoAttachments,
      attendance,
      createdAt: editingAtaId
        ? atas.find((a) => a.id === editingAtaId)?.createdAt || nowIso
        : nowIso,
      updatedAt: nowIso,
    };

    setAtas((prev) => {
      const exists = prev.some((a) => a.id === record.id);
      return exists ? prev.map((a) => (a.id === record.id ? record : a)) : [record, ...prev];
    });

    // Sync with official Brigade Meetings Agenda
    try {
      const rawMeetings = localStorage.getItem(STORAGE_KEY_MEETINGS);
      const currentMeetings: BrigadeMeeting[] = rawMeetings
        ? JSON.parse(rawMeetings)
        : INITIAL_BRIGADE_MEETINGS;

      const dateBR = meetingDate.includes('-')
        ? meetingDate.split('-').reverse().join('/')
        : meetingDate;
      const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const parsedDt = new Date(meetingDate + 'T00:00:00');
      const mIdx = isNaN(parsedDt.getTime()) ? new Date().getMonth() : parsedDt.getMonth();

      let updatedMeetings: BrigadeMeeting[];
      if (linkedMeetingId && currentMeetings.some((m) => m.id === linkedMeetingId)) {
        updatedMeetings = currentMeetings.map((m) =>
          m.id === linkedMeetingId
            ? {
                ...m,
                status: 'realizada',
                attendeesCount: attendanceStats.facialDoneCount,
                expectedAttendees: attendanceStats.total,
                minutesSummary: record.minutesSummary,
                actionPoints:
                  record.actionPoints.length > 0
                    ? record.actionPoints
                    : [`Ata ${record.protocol} registrada com ${attendanceStats.facialDoneCount} assinaturas faciais.`],
                leaderName: record.coordinatorName,
                leaderRole: record.coordinatorRole,
                room: record.room,
              }
            : m
        );
      } else {
        const extraMeeting: BrigadeMeeting = {
          id: `meet-${unit}-ata-${Date.now()}`,
          monthIndex: mIdx,
          monthLabel: monthNames[mIdx] || 'EXTRA',
          location: unit,
          theme: record.theme,
          dateDisplay: dateBR,
          meetingDate: record.date,
          time: `${record.startTime} h`,
          room: record.room,
          leaderName: record.coordinatorName,
          leaderRole: record.coordinatorRole,
          status: 'realizada',
          objectives:
            record.objectives || `Ata ${record.protocol} — Reunião da Brigada ${meta.shortBadge}`,
          agendaItems: record.agendaItems,
          attendeesCount: attendanceStats.facialDoneCount,
          expectedAttendees: attendanceStats.total,
          minutesSummary: record.minutesSummary,
          actionPoints: record.actionPoints,
        };
        record.linkedMeetingId = extraMeeting.id;
        updatedMeetings = [extraMeeting, ...currentMeetings];
      }

      localStorage.setItem(STORAGE_KEY_MEETINGS, JSON.stringify(updatedMeetings));
      loadMeetingsFromStorage();
    } catch (syncErr) {
      console.error('Erro ao sincronizar Ata com agenda anual:', syncErr);
    }

    setEditingAtaId(record.id);
    setSavedBannerAta(record);
    playIndustrialSound('success');
  };

  const facialTargetRecord = attendance.find((a) => a.id === facialTargetId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Unit Header Card */}
      <div className="bg-white border border-[#007960]/25 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#007960] text-white flex items-center justify-center shrink-0 shadow-xs">
            <UnitIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/40 uppercase">
                {meta.shortBadge}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Ata Oficial & Lista de Presença Facial
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">{meta.title}</h2>
            <p className="text-xs text-slate-600">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={startNewAtaForm}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ata de Reunião</span>
          </button>

          {savedBannerAta && (
            <button
              type="button"
              onClick={() => setPreviewAta(savedBannerAta)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4 text-[#007960]" />
              <span>Visualizar / Imprimir Ata</span>
            </button>
          )}
        </div>
      </div>

      {/* Referência Oficial SST.RE-086 */}
      <SstRe086ReferenceBanner
        unitLabel={meta.shortBadge}
        onOpenViewer={() => setIsRefModalOpen(true)}
      />

      {/* Unit KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
            Brigadistas na Unidade
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{unitMembers.length}</span>
            <span className="text-[11px] text-slate-500">efetivo base</span>
          </div>
        </div>

        <div className="bg-white border border-[#007960]/30 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#007960] block">
            Atas Registradas c/ Facial
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#007960] font-mono">{unitAtas.length}</span>
            <span className="text-[11px] text-[#007960] font-semibold">atas salvas</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
            Agenda da Unidade
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {unitMeetings.filter((m) => m.status === 'realizada').length}/{unitMeetings.length}
            </span>
            <span className="text-[11px] text-slate-500">realizadas</span>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#007960] block">
            Presença Facial (Atual)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#007960] font-mono">
              {attendanceStats.facialDoneCount}/{attendanceStats.presentCount}
            </span>
            <span className="text-[11px] text-slate-500">faciais OK</span>
          </div>
        </div>
      </div>

      {/* Selector de Reunião da Agenda da Unidade */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#007960]" />
              <span>Agenda Oficial de Reuniões — {meta.shortBadge} (Clique para preencher a Ata)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Selecione um mês programado abaixo para puxar automaticamente tema e data, ou preencha uma Ata avulsa.
            </p>
          </div>
          {linkedMeetingId && (
            <button
              type="button"
              onClick={startNewAtaForm}
              className="text-[11px] font-bold text-[#007960] hover:underline"
            >
              Desvincular e criar Ata Avulsa
            </button>
          )}
        </div>

        <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5">
          {unitMeetings.map((m) => {
            const isSelected = linkedMeetingId === m.id;
            const hasSavedAta = atas.some((a) => a.unit === unit && a.linkedMeetingId === m.id);
            const isDone = m.status === 'realizada';

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectOfficialMeeting(m)}
                className={`min-w-[185px] max-w-[210px] shrink-0 text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-50 border-[#007960] ring-2 ring-[#007960]/30'
                    : 'bg-[#f8faf9] border-slate-200 hover:border-[#007960]/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded bg-[#007960] text-white font-mono text-[10px] font-bold">
                    {m.monthLabel}
                  </span>
                  {hasSavedAta ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[#007960] text-[9px] font-mono font-bold border border-[#007960]/30">
                      ATA OK
                    </span>
                  ) : (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        isDone
                          ? 'bg-emerald-50 text-[#007960] border-[#007960]/30'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {isDone ? 'Realizado' : 'Programado'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-snug">
                  {m.theme}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{m.dateDisplay}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Banner after saving */}
      {savedBannerAta && (
        <div className="bg-emerald-50 border-2 border-[#007960] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007960] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <h4 className="font-black text-slate-900 text-sm">
                Ata {savedBannerAta.protocol} Registrada com Lista de Presença Facial!
              </h4>
              <p className="text-slate-700 mt-0.5">
                <strong>{savedBannerAta.attendance.filter((a) => a.status === 'presente').length}</strong>{' '}
                brigadista(s) confirmado(s) por biometria facial • Tema:{' '}
                <strong className="text-[#007960]">{savedBannerAta.theme}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewAta(savedBannerAta)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ata Oficial</span>
            </button>
            <button
              type="button"
              onClick={startNewAtaForm}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold"
            >
              Nova Ata
            </button>
          </div>
        </div>
      )}

      {/* MAIN FORM: REGISTRO DE ATA + LISTA DE PRESENÇA COM FACIAL */}
      <form onSubmit={handleSaveAta} className="space-y-6 print:hidden">
        {/* Section 1: Dados da Reunião e Ata */}
        <div className="bg-white border border-[#007960]/25 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#007960]" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  1. Registro da Ata de Reunião da Brigada — {meta.shortBadge}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Preencha todos os campos da ata, pauta discutida e encaminhamentos operacionais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-700">
                Doc.: SST.RE-086 (Rev. 01)
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-[#007960]/30 font-mono text-xs font-bold text-[#007960]">
                Protocolo: {protocol}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reunião Ordinária Nº</label>
              <input
                type="text"
                value={ordinaryMeetingNumber}
                onChange={(e) => setOrdinaryMeetingNumber(e.target.value)}
                placeholder="Ex: 01/2026"
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nº Protocolo Ata</label>
              <input
                type="text"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Data *</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Horário Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Horário Término</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Local *</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ex: Sala de Treinamento"
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Tema / Assunto Principal da Reunião *
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Ex: Simulado de Abandono, Operação de Bombas e Combate a Incêndio"
                className={`w-full bg-[#f8faf9] border rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#007960] ${
                  hasAttemptedSave && !theme.trim() ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Turnos Participantes</label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(['turno_a', 'turno_b', 'turno_c', 'administrativo'] as BrigadeShift[]).map(
                  (s) => {
                    const active = involvedShifts.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleShift(s)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                          active
                            ? 'bg-[#007960] text-white border-[#007960]'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {s === 'administrativo'
                          ? 'ADM'
                          : BRIGADE_SHIFTS[s].name}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Coordenador / Instrutor Responsável (Nome Completo) *
              </label>
              <input
                type="text"
                value={coordinatorName}
                onChange={(e) => {
                  setCoordinatorName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Nome do Técnico SST, Líder ou Bombeiro Civil"
                className={`w-full bg-[#f8faf9] border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960] ${
                  hasAttemptedSave && !coordinatorName.trim()
                    ? 'border-red-500 ring-1 ring-red-200'
                    : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cargo / RE / Coordenação</label>
              <input
                type="text"
                value={coordinatorRole}
                onChange={(e) => setCoordinatorRole(e.target.value)}
                placeholder="Ex: Técnico de Segurança do Trabalho / RE-10482"
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Objetivos & Pauta Discutida (1 tópico por linha)
              </label>
              <textarea
                rows={4}
                value={agendaText}
                onChange={(e) => setAgendaText(e.target.value)}
                placeholder="Liste os tópicos apresentados na reunião..."
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-[#007960]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Encaminhamentos / Plano de Ação (1 providência por linha)
              </label>
              <textarea
                rows={4}
                value={actionPointsText}
                onChange={(e) => setActionPointsText(e.target.value)}
                placeholder="Ex:&#10;Substituir mangueira com avaria no setor de envase até 20/05&#10;Agendar simulado prático de abandono para Turno B"
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-[#007960]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">
              Relato da Reunião / Deliberações Oficiais (SST.RE-086) *
            </label>
            <textarea
              rows={4}
              value={minutesSummary}
              onChange={(e) => {
                setMinutesSummary(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Descreva os assuntos tratados, orientações técnicas repassadas à brigada, observações dos brigadistas e decisões registradas nesta reunião..."
              className={`w-full bg-[#f8faf9] border rounded-xl px-3 py-2.5 text-slate-900 leading-relaxed focus:outline-none focus:border-[#007960] ${
                hasAttemptedSave && !minutesSummary.trim()
                  ? 'border-red-500 ring-1 ring-red-200'
                  : 'border-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Section 2: Campo Obrigatório de Arquivo Fotográfico na Ata */}
        <div
          className={`bg-white rounded-2xl p-6 shadow-xs space-y-4 border transition-all ${
            hasAttemptedSave && photoAttachments.length === 0
              ? 'border-red-500 ring-2 ring-red-200 bg-red-50/30'
              : photoAttachments.length > 0
              ? 'border-[#007960]/40'
              : 'border-[#007960]/25'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  photoAttachments.length > 0
                    ? 'bg-[#007960] text-white border-[#007960]'
                    : hasAttemptedSave
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-emerald-50 text-[#007960] border-[#007960]/30'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    2. Registro Fotográfico da Reunião
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-100 text-red-700 border border-red-300">
                    * Obrigatório (Mín. 1 foto)
                  </span>
                  {photoAttachments.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-100 text-[#007960] border border-[#007960]/30">
                      {photoAttachments.length} Arquivo(s) Anexado(s)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Anexe obrigatoriamente o registro fotográfico da reunião / treinamento da brigada para compor a Ata SST.RE-086.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-4 h-4" />
                <span>Anexar Arquivo Fotográfico</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadPhotoAttachments}
                  className="hidden"
                />
              </label>

              <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-[#007960]" />
                <span>Fotografar Agora</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleUploadPhotoAttachments}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {photoAttachments.length === 0 ? (
            <label
              className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center ${
                hasAttemptedSave
                  ? 'border-red-400 bg-red-50/60 text-red-800'
                  : 'border-slate-300 bg-[#f8faf9] hover:border-[#007960] text-slate-600'
              }`}
            >
              <ImageIcon
                className={`w-8 h-8 ${
                  hasAttemptedSave ? 'text-red-500' : 'text-[#007960]'
                }`}
              />
              <div className="text-xs">
                <span className="font-bold block">
                  Clique aqui para anexar uma ou mais fotos da reunião (JPG, PNG, WEBP)
                </span>
                <span className="text-[11px] opacity-80">
                  Campo obrigatório para registrar a Ata de Reunião da Brigada de Incêndio (SST.RE-086).
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadPhotoAttachments}
                className="hidden"
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {photoAttachments.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="bg-[#f8faf9] border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="relative h-40 bg-slate-900">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || photo.fileName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/75 text-white font-mono text-[10px] font-bold">
                      Foto #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhotoAttachment(photo.id)}
                      title="Remover arquivo fotográfico"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                      <span className="truncate font-semibold">{photo.fileName}</span>
                      <span className="shrink-0">
                        {new Date(photo.uploadedAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={photo.caption || ''}
                      onChange={(e) => handleUpdatePhotoCaption(photo.id, e.target.value)}
                      placeholder="Legenda da foto (opcional)"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-[#007960]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Lista de Presença com Captura Facial */}
        <div className="bg-white border border-[#007960]/25 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center shrink-0">
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  3. Lista de Presença com Reconhecimento / Foto Facial — {meta.shortBadge}
                </h3>
                <p className="text-[11px] text-slate-600">
                  Convocados: <strong>Todos participantes com lista em anexo.</strong> Todo participante marcado como <strong>Presente</strong> deve registrar a captura facial obrigatória.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {unit === 'adm' && gmaForestalMembers.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportGmaMembers}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007960] border border-[#007960]/30 text-xs font-bold transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>+ Incluir Brigada Agrícola/GMA ({gmaForestalMembers.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddParticipant((prev) => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#007960]" />
                <span>Adicionar Participante</span>
              </button>
            </div>
          </div>

          {/* Add Participant / Import Drawer */}
          {showAddParticipant && (
            <div className="bg-[#f8faf9] border border-[#007960]/30 rounded-xl p-4 space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#007960] uppercase text-[11px]">
                  Adicionar Brigadista de Outro Setor ou Convidado à Lista
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddParticipant(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Importar Brigadista já Cadastrado:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedImportMemberId}
                      onChange={(e) => setSelectedImportMemberId(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
                    >
                      <option value="">Selecione um brigadista...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.registrationNumber || 'S/RE'}) — {m.unit?.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleImportMember}
                      className="px-3 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white font-bold"
                    >
                      Incluir
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    placeholder="Nome do participante ou convidado"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RE / Matrícula</label>
                  <input
                    type="text"
                    value={extraRE}
                    onChange={(e) => setExtraRE(e.target.value)}
                    placeholder="Ex: RE-15400"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Turno / Função</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={extraShift}
                      onChange={(e) => setExtraShift(e.target.value)}
                      placeholder="Turno"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualParticipant}
                      className="px-3 py-2 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white font-bold shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Search + Live Counters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8faf9] p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                placeholder="Filtrar participante por nome, RE ou turno..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-[#007960] font-bold border border-[#007960]/30">
                {attendanceStats.facialDoneCount} Facial Validada
              </span>
              {attendanceStats.facialPendingList.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  {attendanceStats.facialPendingList.length} Pendente Facial
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold">
                {attendanceStats.absentCount} Ausente(s)
              </span>
            </div>
          </div>

          {/* Attendance Cards / Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAttendance.map((person) => {
              const isPresent = person.status === 'presente';
              const hasFacial = Boolean(person.facialImage);
              const needsFacialHighlight = hasAttemptedSave && isPresent && !hasFacial;

              return (
                <div
                  key={person.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    needsFacialHighlight
                      ? 'bg-red-50/70 border-red-400 ring-2 ring-red-200'
                      : isPresent && hasFacial
                      ? 'bg-emerald-50/40 border-[#007960]/40'
                      : !isPresent
                      ? 'bg-slate-50 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {person.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                          {person.registrationNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {person.shift} • {person.roleLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetAttendanceStatus(person.id, 'presente')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          isPresent
                            ? 'bg-[#007960] text-white border-[#007960]'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Presente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetAttendanceStatus(person.id, 'ausente')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          !isPresent
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <UserX className="w-3 h-3" />
                        <span>Ausente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(person.id)}
                        title="Remover da lista desta ata"
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isPresent ? (
                    hasFacial ? (
                      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#007960]/30">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={person.facialImage}
                            alt={`Facial ${person.name}`}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-[#007960] shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007960]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Facial Confirmada</span>
                            </span>
                            <span className="block text-[10px] font-mono text-slate-500 truncate">
                              {person.facialHash}
                            </span>
                            {person.facialTimestamp && (
                              <span className="block text-[9px] font-mono text-slate-400">
                                {new Date(person.facialTimestamp).toLocaleTimeString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleClearFacial(person.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-[10px] font-bold shrink-0"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Refazer</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openFacialScanner(person.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-[11px] font-bold transition-colors shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Capturar Facial (Câmera)</span>
                        </button>

                        <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5 text-[#007960]" />
                          <span>Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={(e) => handleFacialFileUpload(person.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )
                  ) : (
                    <input
                      type="text"
                      value={person.justification || ''}
                      onChange={(e) => handleSetJustification(person.id, e.target.value)}
                      placeholder="Justificativa da ausência (Ex: Folga de escala, Férias, Plantão externo)"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:border-[#007960]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {validationError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#de2726] shrink-0 mt-0.5" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}

          {/* Save / Finalize Bar */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#007960]" />
              <span>
                Presença validada por facial:{' '}
                <strong className="text-slate-900">
                  {attendanceStats.facialDoneCount} de {attendanceStats.presentCount} presentes
                </strong>
              </span>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-black uppercase tracking-wide shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{editingAtaId ? 'Atualizar Ata & Presença Facial' : 'Registrar Ata c/ Lista Facial'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Section 3: Histórico de Atas Registradas da Unidade */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Histórico de Atas Registradas — {meta.shortBadge}
            </h3>
            <p className="text-[11px] text-slate-500">
              Todas as atas finalizadas com fotos faciais ficam arquivadas nesta unidade
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700">
            {unitAtas.length} ata(s)
          </span>
        </div>

        {unitAtas.length === 0 ? (
          <div className="p-8 text-center bg-[#f8faf9] rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
            Nenhuma Ata registrada ainda para <strong>{meta.shortBadge}</strong>. Preencha o formulário acima e valide a presença com foto facial para registrar a primeira Ata.
          </div>
        ) : (
          <div className="space-y-3">
            {unitAtas.map((ata) => {
              const facCount = ata.attendance.filter(
                (a) => a.status === 'presente' && a.facialImage
              ).length;
              return (
                <div
                  key={ata.id}
                  className="p-4 rounded-xl border border-slate-200 bg-[#f8faf9] flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#007960] text-white font-mono text-[10px] font-bold">
                        {ata.protocol}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-700">
                        {ata.date.split('-').reverse().join('/')} ({ata.startTime} - {ata.endTime})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#007960] border border-[#007960]/30 text-[10px] font-mono font-bold">
                        {facCount} Presenças Faciais
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono font-bold">
                        {(ata.photoAttachments || []).length} Foto(s) Anexa(s)
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{ata.theme}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1">
                      Coord.: {ata.coordinatorName} • {ata.room}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoadSavedAta(ata)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold"
                    >
                      <span>Abrir / Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewAta(ata)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ata & Fotos</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: CAPTURA FACIAL AO VIVO (BIOMETRIA FACIAL) */}
      {facialTargetId && facialTargetRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="bg-white border-2 border-[#007960] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#007960] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ScanFace className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black">Validação Facial — Lista de Presença</h3>
                  <p className="text-[11px] text-emerald-100">
                    {facialTargetRecord.name} ({facialTargetRecord.registrationNumber})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFacialScanner}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-center">
              {isCameraActive ? (
                <div className="space-y-3">
                  <div className="relative mx-auto w-72 h-56 bg-slate-950 rounded-2xl overflow-hidden border-2 border-[#007960]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Biometric oval alignment guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-36 h-44 rounded-full border-2 border-dashed border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Centralize o rosto do brigadista dentro da marcação e clique em capturar.
                  </p>
                  <button
                    type="button"
                    onClick={captureFromVideo}
                    className="w-full py-2.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Registrar Biometria Facial</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {cameraError && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left">
                      {cameraError}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#007960]" />
                  <span>Tirar Selfie / Enviar Foto Facial</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFacialFileUpload(facialTargetRecord.id, e)}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={closeFacialScanner}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW / IMPRESSÃO OFICIAL DA ATA COM FOTOS FACIAIS */}
      {previewAta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border-2 border-[#007960] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-0">
            <div className="px-6 py-4 bg-[#007960] text-white flex items-center justify-between print:hidden">
              <div>
                <h3 className="text-sm font-black uppercase">
                  Ata Oficial de Reunião da Brigada — {previewAta.protocol}
                </h3>
                <p className="text-[11px] text-emerald-100">
                  Visualização para Auditoria & Impressão com Lista de Presença Facial
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#007960] text-xs font-black hover:bg-emerald-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAta(null)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-900">
              {/* Cabeçalho Oficial SST.RE-086 */}
              <div className="border-2 border-slate-800 rounded-xl overflow-hidden bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-12 border-b-2 border-slate-800">
                  <div className="sm:col-span-3 p-3 border-b sm:border-b-0 sm:border-r-2 border-slate-800 flex flex-col justify-center bg-[#f8faf9]">
                    <span className="font-black text-base text-[#007960] tracking-tight">UISA</span>
                    <span className="text-[9px] font-bold uppercase text-slate-500">
                      Bioenergia + Açúcar
                    </span>
                  </div>
                  <div className="sm:col-span-6 p-3 border-b sm:border-b-0 sm:border-r-2 border-slate-800 flex flex-col items-center justify-center text-center">
                    <h2 className="text-sm font-black text-slate-900 uppercase">
                      Ata de Reunião — Brigada de Incêndio
                    </h2>
                    <span className="text-[10px] font-bold text-[#007960] uppercase mt-0.5">
                      {UNIT_META[previewAta.unit].shortBadge} • {previewAta.protocol}
                    </span>
                  </div>
                  <div className="sm:col-span-3 p-3 font-mono text-[10px] space-y-0.5 bg-[#f8faf9]">
                    <div><strong>Doc.:</strong> SST.RE-086</div>
                    <div><strong>Data:</strong> 13/02/2026</div>
                    <div><strong>Revisão:</strong> 01</div>
                    <div><strong>Pág.:</strong> 1 / 1</div>
                  </div>
                </div>

                {/* Tabela de Campos SST.RE-086 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-800">
                  <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-slate-800">
                    <strong>Reunião Ordinária Nº:</strong>{' '}
                    <span className="font-mono">{previewAta.ordinaryMeetingNumber || previewAta.protocol}</span>
                  </div>
                  <div className="p-2.5">
                    <strong>Local:</strong> {previewAta.room}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-800">
                  <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-slate-800">
                    <strong>Data:</strong>{' '}
                    <span className="font-mono">{previewAta.date.split('-').reverse().join('/')}</span>
                  </div>
                  <div className="p-2.5">
                    <strong>Horário:</strong>{' '}
                    <span className="font-mono">{previewAta.startTime} às {previewAta.endTime}</span>
                  </div>
                </div>
                <div className="p-2.5 border-b border-slate-800 bg-[#f8faf9]">
                  <strong>Convocados:</strong> Todos participantes com lista em anexo. (
                  {previewAta.involvedShifts.map((s) => BRIGADE_SHIFTS[s]?.name || s).join(', ')})
                </div>
                <div className="p-2.5">
                  <strong>Tema / Coordenador:</strong> {previewAta.theme} —{' '}
                  <span className="text-slate-700">
                    {previewAta.coordinatorName} ({previewAta.coordinatorRole})
                  </span>
                </div>
              </div>

              {/* Relato da Reunião & Encaminhamentos */}
              <div className="space-y-3 border border-slate-300 rounded-xl p-4">
                <div>
                  <h4 className="font-black uppercase text-[11px] text-[#007960] mb-1">
                    Pauta & Tópicos Discutidos
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-800">
                    {previewAta.agendaItems.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <h4 className="font-black uppercase text-[11px] text-[#007960] mb-1">
                    Relato da Reunião (SST.RE-086)
                  </h4>
                  <p className="whitespace-pre-line leading-relaxed text-slate-800">
                    {previewAta.minutesSummary}
                  </p>
                </div>

                {previewAta.actionPoints.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <h4 className="font-black uppercase text-[11px] text-[#007960] mb-1">
                      Encaminhamentos / Plano de Ação
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-800">
                      {previewAta.actionPoints.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Registro Fotográfico Anexo */}
              {(previewAta.photoAttachments || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black uppercase text-[11px] text-[#007960]">
                    Registro Fotográfico da Reunião ({(previewAta.photoAttachments || []).length} Foto(s))
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(previewAta.photoAttachments || []).map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="border border-slate-300 rounded-xl overflow-hidden bg-white"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.caption || photo.fileName}
                          className="w-full h-44 object-cover"
                        />
                        <div className="p-2 text-[10px] text-slate-700 bg-[#f8faf9] border-t border-slate-200">
                          <strong>Foto #{idx + 1}:</strong>{' '}
                          {photo.caption || photo.fileName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance List with Facial Photos */}
              <div className="space-y-2">
                <h4 className="font-black uppercase text-[11px] text-[#007960]">
                  Lista de Presença em Anexo com Validação Biométrica Facial (
                  {previewAta.attendance.filter((a) => a.status === 'presente').length} Presentes)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {previewAta.attendance.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      {att.status === 'presente' && att.facialImage ? (
                        <img
                          src={att.facialImage}
                          alt={att.name}
                          className="w-12 h-12 rounded-lg object-cover border border-[#007960] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-mono text-slate-500 shrink-0">
                          AUSENTE
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">
                          {att.name}{' '}
                          <span className="font-mono text-[10px] text-slate-500">
                            ({att.registrationNumber})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600">
                          {att.shift} • {att.roleLabel}
                        </div>
                        {att.status === 'presente' ? (
                          <div className="text-[10px] font-mono text-[#007960] font-bold flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" />
                            <span>
                              {att.facialHash} •{' '}
                              {att.facialTimestamp
                                ? new Date(att.facialTimestamp).toLocaleTimeString('pt-BR')
                                : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic">
                            Ausente: {att.justification || 'Sem justificativa informada'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rodapé Oficial SST.RE-086 */}
              <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-0.5">
                <div className="font-semibold text-slate-700">
                  Guanabara Agrícola LTDA, CNPJ 03.729.834/0001-20
                </div>
                <div>Rodovia MT 358 km 12,7 – Zona Rural • Nova Olímpia – MT</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Referência Oficial SST.RE-086 */}
      <SstRe086ReferenceModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
      />
    </div>
  );
};
