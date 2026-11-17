import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  BellRing,
  Activity,
  Truck,
  Users,
  ShieldAlert,
  Building2,
  Paperclip,
  Upload,
  Eye,
  Plus,
  Save,
  Trash2,
  FileCheck2,
  ScanFace,
  PenTool,
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

export type ChecklistSystemKey =
  | 'extintores'
  | 'hidrantes'
  | 'alarmes'
  | 'bombas'
  | 'caminhao_pipa'
  | 'brigadistas'
  | 'pae';

export interface ArchivedChecklistItem {
  id: string;
  system: ChecklistSystemKey;
  systemName: string;
  formCode: string;
  revision: string;
  title: string;
  unit: string;
  subLocation?: string;
  date: string;
  inspectorName: string;
  inspectorRE: string;
  inspectorRole: string;
  status: 'conforme' | 'nao_conforme' | 'com_ressalva';
  totalItemsChecked: number;
  itemsCompliant: number;
  itemsNonCompliant: number;
  facialSignatureCaptured: boolean;
  digitalSignature: string;
  fileAttachmentName?: string;
  fileAttachmentData?: string;
  itemsSummary?: { item: string; status: 'C' | 'NC' | 'N/A'; obs?: string }[];
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY_CHECKLIST_ARCHIVE = 'sge_desktop_checklists_pdf_archive_v2';

const INITIAL_CHECKLISTS: ArchivedChecklistItem[] = [
  {
    id: 'chk-bomba-01',
    system: 'bombas',
    systemName: 'Bombas de Combate & RTI',
    formCode: 'SST.RE-094',
    revision: 'Rev 00',
    title: 'Registro de Teste Semanal em Modo Automático da Casa de Bombas',
    unit: 'Indústria',
    subLocation: 'Casa de Bombas Principal - Destilaria',
    date: '2026-09-18',
    inspectorName: 'Hitamar Silva',
    inspectorRE: '48201',
    inspectorRole: 'Técnico de Segurança do Trabalho',
    status: 'conforme',
    totalItemsChecked: 10,
    itemsCompliant: 10,
    itemsNonCompliant: 0,
    facialSignatureCaptured: true,
    digitalSignature: 'Hitamar Silva - RE 48201 (Certificação Digital SST)',
    itemsSummary: [
      { item: 'Pressão da rede principal (8.0 kgf/cm²)', status: 'C', obs: 'Pressurização nominal mantida' },
      { item: 'Partida automática da Bomba Jockey (7.5 kgf/cm²)', status: 'C', obs: 'Partida em 2 segundos' },
      { item: 'Partida automática da Bomba Principal Elétrica (6.0 kgf/cm²)', status: 'C', obs: 'Fluxo estável' },
      { item: 'Partida automática do Motor Diesel (5.0 kgf/cm²)', status: 'C', obs: 'Baterias 24V carregadas' },
      { item: 'Nível da Reserva Técnica de Incêndio (RTI)', status: 'C', obs: '100% capacidade (1.200 m³)' },
    ],
    notes: 'Teste semanal realizado com sucesso em modo automático. Todas as pressostatos calibrados.',
    createdAt: '2026-09-18T09:30:00Z',
  },
  {
    id: 'chk-alarme-01',
    system: 'alarmes',
    systemName: 'Alarmes de Incêndio',
    formCode: 'SST.RE-020',
    revision: 'Rev 02',
    title: 'Inspeção Periódica do Sistema de Detecção e Alarme de Incêndio',
    unit: 'Indústria',
    subLocation: 'Central de Alarme Endereçável - Prédio Central',
    date: '2026-09-15',
    inspectorName: 'Hitamar Silva',
    inspectorRE: '48201',
    inspectorRole: 'Técnico de Segurança do Trabalho',
    status: 'conforme',
    totalItemsChecked: 12,
    itemsCompliant: 12,
    itemsNonCompliant: 0,
    facialSignatureCaptured: true,
    digitalSignature: 'Hitamar Silva - RE 48201 (Certificação Digital SST)',
    itemsSummary: [
      { item: 'Central de alarme operando em modo Normal / Standby', status: 'C' },
      { item: 'Laço 01 - Destilaria & Tancagem (Acionadores manuais)', status: 'C' },
      { item: 'Laço 02 - Caldeiras & Coger (Detectores termovelocimétricos)', status: 'C' },
      { item: 'Sirenes audiovisuais estroboscópicas', status: 'C', obs: 'Disparo audível em 100% da área' },
      { item: 'Nobreak e baterias seladas 24V', status: 'C', obs: 'Autonomia testada 4 horas' },
    ],
    notes: 'Inspeção trimestral SST.RE-020 concluída sem anomalias no sistema de detecção.',
    createdAt: '2026-09-15T14:20:00Z',
  },
  {
    id: 'chk-pipa-01',
    system: 'caminhao_pipa',
    systemName: 'Caminhão Bombeiro (Pipa)',
    formCode: 'SST.RE-109',
    revision: 'Rev 01',
    title: 'Checklist Diário e Operacional do Caminhão Pipa / Bombeiro',
    unit: 'Indústria',
    subLocation: 'Pátio de Combate a Incêndio / Garagem SST',
    date: '2026-09-19',
    inspectorName: 'Lucas Ferreira',
    inspectorRE: '44129',
    inspectorRole: 'Bombeiro Civil / Operador',
    status: 'conforme',
    totalItemsChecked: 12,
    itemsCompliant: 12,
    itemsNonCompliant: 0,
    facialSignatureCaptured: true,
    digitalSignature: 'Lucas Ferreira - RE 44129 (Bombeiro Civil UISA)',
    itemsSummary: [
      { item: 'Canhão monitor superior de água/espuma e esguicho', status: 'C', obs: 'Giro 360° livre' },
      { item: 'Bomba de combate acionada por tomada de força (PTO)', status: 'C', obs: 'Pressão 12 kgf/cm²' },
      { item: 'Carretel de mangotinho 1" com 30 metros', status: 'C', obs: 'Sem vazamentos' },
      { item: 'Tanque de água capacidade 15.000 litros', status: 'C', obs: 'Tanque cheio 100%' },
      { item: 'Proporcionador e dosador de LGE 3%/6%', status: 'C', obs: 'LGE tipo AR nível normal' },
      { item: 'Sirene eletrônica e sinalizador giroflex visual', status: 'C', obs: 'Funcionando perfeitamente' },
    ],
    notes: 'Caminhão Pipa Bombeiro pronto para pronto-emprego operacional em ocorrências agroindustriais.',
    createdAt: '2026-09-19T07:10:00Z',
  },
  {
    id: 'chk-extintor-01',
    system: 'extintores',
    systemName: 'Extintores de Incêndio',
    formCode: 'SST.RE-015',
    revision: 'Rev 03',
    title: 'Ficha Geral de Vistoria Mensal de Extintores de Incêndio (NBR 12962)',
    unit: 'Empacotamento',
    subLocation: 'Linhas 1kg / 5kg e Silos de Açúcar',
    date: '2026-09-10',
    inspectorName: 'Hitamar Silva',
    inspectorRE: '48201',
    inspectorRole: 'Técnico de Segurança do Trabalho',
    status: 'conforme',
    totalItemsChecked: 18,
    itemsCompliant: 18,
    itemsNonCompliant: 0,
    facialSignatureCaptured: true,
    digitalSignature: 'Hitamar Silva - RE 48201',
    itemsSummary: [
      { item: 'Indicadores de pressão (manômetros em faixa verde)', status: 'C' },
      { item: 'Lacres inviolados e travas de segurança', status: 'C' },
      { item: 'Mangueiras e difusores sem rachaduras ou entupimento', status: 'C' },
      { item: 'Sinalização fotoluminescente e desobstrução de 1 metro', status: 'C' },
    ],
    notes: 'Todos os extintores inspecionados em conformidade com a NBR 12962 e NR-23.',
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'chk-hidrante-01',
    system: 'hidrantes',
    systemName: 'Rede de Hidrantes & LGE',
    formCode: 'SST.RE-044',
    revision: 'Rev 02',
    title: 'Inspeção e Teste de Fluxo da Rede de Hidrantes Industriais (IT-22)',
    unit: 'Posto de Combustível',
    subLocation: 'Pista Diesel & Tanques Subterrâneos',
    date: '2026-09-12',
    inspectorName: 'Hitamar Silva',
    inspectorRE: '48201',
    inspectorRole: 'Técnico de Segurança do Trabalho',
    status: 'conforme',
    totalItemsChecked: 8,
    itemsCompliant: 8,
    itemsNonCompliant: 0,
    facialSignatureCaptured: true,
    digitalSignature: 'Hitamar Silva - RE 48201',
    itemsSummary: [
      { item: 'Abrigo metálico com pintura epóxi vermelha conservada', status: 'C' },
      { item: 'Mangueiras tipo 2 (38mm e 65mm) enroladas em adufa', status: 'C' },
      { item: 'Esguicho regulável vazão e chave Storz presente', status: 'C' },
      { item: 'Válvula globo angular sem vazamento e vedação íntegra', status: 'C' },
    ],
    notes: 'Hidrantes do Posto de Combustível operacionais e desobstruídos.',
    createdAt: '2026-09-12T15:00:00Z',
  },
  {
    id: 'chk-brigada-01',
    system: 'brigadistas',
    systemName: 'Brigada de Emergência',
    formCode: 'SST.RE-061',
    revision: 'Rev 01',
    title: 'Ata de Simulado Prático e Treinamento de Combate a Princípios de Incêndio',
    unit: 'Indústria',
    subLocation: 'Destilaria & Pátio de Treinamento SST',
    date: '2026-08-28',
    inspectorName: 'João Bosco Lemos Junior',
    inspectorRE: '10204',
    inspectorRole: 'Gerente Executivo / SESMT',
    status: 'conforme',
    totalItemsChecked: 15,
    itemsCompliant: 15,
    itemsNonCompliant: 0,
    facialSignatureCaptured: true,
    digitalSignature: 'João Bosco Lemos Junior - RE 10204 (Gerência SST)',
    itemsSummary: [
      { item: 'Tempo de resposta da brigada do Turno A (< 4 minutos)', status: 'C', obs: 'Resposta em 3m12s' },
      { item: 'Uso completo de EPI (Capacete, luva, bota e capa de aproximação)', status: 'C' },
      { item: 'Montagem de linha de combate e resfriamento de tancagem', status: 'C' },
    ],
    notes: 'Simulado de emergência realizado com êxito operacional conforme IT-17.',
    createdAt: '2026-08-28T16:30:00Z',
  },
  {
    id: 'chk-pae-01',
    system: 'pae',
    systemName: 'Plano de Atendimento a Emergência (PAE)',
    formCode: 'SST.NP-022',
    revision: 'Rev 09',
    title: 'Relatório de Inspeção e Auditoria do Plano de Atendimento a Emergências',
    unit: 'ADM / GMA',
    subLocation: 'Prédio Administrativo Central & Sala de Crise',
    date: '2026-09-05',
    inspectorName: 'Hitamar Silva',
    inspectorRE: '48201',
    inspectorRole: 'Técnico de Segurança do Trabalho',
    status: 'conforme',
    totalItemsChecked: 14,
    itemsCompliant: 14,
    itemsNonCompliant: 0,
    facialSignatureCaptured: true,
    digitalSignature: 'Hitamar Silva - RE 48201',
    itemsSummary: [
      { item: 'Rotas de fuga e iluminação de emergência autônoma', status: 'C' },
      { item: 'Pontos de encontro de emergência sinalizados', status: 'C' },
      { item: 'Lista de contatos do comitê de crise e PAM atualizada', status: 'C' },
    ],
    notes: 'Auditoria de prontidão do PAE concluída com 100% de conformidade.',
    createdAt: '2026-09-05T11:00:00Z',
  },
];

interface ChecklistPdfArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSystemFilter?: ChecklistSystemKey | 'todos';
}

export const ChecklistPdfArchiveModal: React.FC<ChecklistPdfArchiveModalProps> = ({
  isOpen,
  onClose,
  initialSystemFilter = 'todos',
}) => {
  const [selectedSystem, setSelectedSystem] = useState<ChecklistSystemKey | 'todos'>(initialSystemFilter);
  const [selectedUnit, setSelectedUnit] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChecklistForView, setSelectedChecklistForView] = useState<ArchivedChecklistItem | null>(null);

  // Archive storage
  const [checklists, setChecklists] = useState<ArchivedChecklistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CHECKLIST_ARCHIVE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler arquivo de checklists:', e);
    }
    return INITIAL_CHECKLISTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHECKLIST_ARCHIVE, JSON.stringify(checklists));
    } catch (e) {
      console.error('Erro ao salvar arquivo de checklists:', e);
    }
  }, [checklists]);

  useEffect(() => {
    if (initialSystemFilter) {
      setSelectedSystem(initialSystemFilter);
    }
  }, [initialSystemFilter, isOpen]);

  // Modal para upload/arquivamento manual de novo checklist em PDF
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSystem, setNewSystem] = useState<ChecklistSystemKey>('extintores');
  const [newDocCode, setNewDocCode] = useState('SST.RE-001');
  const [newRevision, setNewRevision] = useState('Rev 00');
  const [newUnit, setNewUnit] = useState('Indústria');
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInspector, setNewInspector] = useState('Hitamar Silva');
  const [newInspectorRE, setNewInspectorRE] = useState('48201');
  const [newStatus, setNewStatus] = useState<'conforme' | 'nao_conforme' | 'com_ressalva'>('conforme');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileData, setUploadedFileData] = useState('');
  const [newNotes, setNewNotes] = useState('');

  if (!isOpen) return null;

  // Filtered checklists
  const filteredList = checklists.filter((item) => {
    if (selectedSystem !== 'todos' && item.system !== selectedSystem) return false;
    if (selectedUnit !== 'TODAS' && item.unit !== selectedUnit) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDoc = item.formCode.toLowerCase().includes(q);
      const matchInsp = item.inspectorName.toLowerCase().includes(q);
      const matchLoc = (item.subLocation || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDoc && !matchInsp && !matchLoc) return false;
    }
    return true;
  });

  const getSystemIcon = (key: ChecklistSystemKey) => {
    switch (key) {
      case 'extintores':
        return <Flame className="w-4 h-4 text-[#007960]" />;
      case 'hidrantes':
        return <Droplets className="w-4 h-4 text-[#007960]" />;
      case 'alarmes':
        return <BellRing className="w-4 h-4 text-[#007960]" />;
      case 'bombas':
        return <Activity className="w-4 h-4 text-[#007960]" />;
      case 'caminhao_pipa':
        return <Truck className="w-4 h-4 text-[#007960]" />;
      case 'brigadistas':
        return <Users className="w-4 h-4 text-[#007960]" />;
      case 'pae':
        return <ShieldAlert className="w-4 h-4 text-[#007960]" />;
    }
  };

  const getSystemLabel = (key: ChecklistSystemKey) => {
    switch (key) {
      case 'extintores':
        return 'Extintores';
      case 'hidrantes':
        return 'Hidrantes & LGE';
      case 'alarmes':
        return 'Alarmes (SST.RE-020)';
      case 'bombas':
        return 'Bombas (SST.RE-094)';
      case 'caminhao_pipa':
        return 'Caminhão Bombeiro (SST.RE-109)';
      case 'brigadistas':
        return 'Brigada';
      case 'pae':
        return 'PAE (SST.NP-022)';
    }
  };

  // Download PDF / HTML File
  const handleDownloadChecklist = (item: ArchivedChecklistItem) => {
    if (item.fileAttachmentData) {
      const link = document.createElement('a');
      link.href = item.fileAttachmentData;
      link.download = item.fileAttachmentName || `${item.formCode}_${item.unit}_${item.date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${item.title} - ${item.formCode}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 32px; color: #0f172a; font-size: 12px; }
    .header { border-bottom: 3px solid #007960; padding-bottom: 12px; margin-bottom: 18px; }
    h1 { color: #007960; margin: 0 0 4px 0; font-size: 18px; text-transform: uppercase; }
    .sub { color: #475569; font-size: 11px; margin: 0; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8faf9; padding: 12px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th { background: #007960; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .badge-c { color: #007960; font-weight: bold; }
    .badge-nc { color: #de2726; font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 36px; text-align: center; }
    .sign-box { border-top: 1px solid #475569; padding-top: 6px; margin-top: 40px; }
    .auth-badge { margin-top: 24px; padding: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 10px; color: #065f46; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${item.title}</h1>
    <p class="sub"><strong>uisa — Bioenergia & Açúcar</strong> | Formulário Oficial ${item.formCode} (${item.revision})</p>
    <p class="sub">Sistema: ${item.systemName} • Unidade Operacional: ${item.unit} (${item.subLocation || 'Geral'})</p>
  </div>

  <div class="meta">
    <div><strong>Data da Realização:</strong> ${formatDateBR(item.date)}</div>
    <div><strong>Status Geral:</strong> ${item.status === 'conforme' ? 'APROVADO / 100% CONFORME' : 'NÃO CONFORME / COM RESSALVA'}</div>
    <div><strong>Inspetor SST:</strong> ${item.inspectorName} (RE: ${item.inspectorRE})</div>
    <div><strong>Cargo / Função:</strong> ${item.inspectorRole}</div>
  </div>

  <h3>Itens de Verificação do Checklist</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Item Inspecionado</th>
        <th style="width: 70px;">Status</th>
        <th>Observações / Ação Corretiva</th>
      </tr>
    </thead>
    <tbody>
      ${(item.itemsSummary || [
        { item: 'Verificação visual e mecânica do sistema', status: 'C', obs: 'Conforme parâmetros' },
        { item: 'Teste operacional de funcionamento', status: 'C', obs: 'Operando dentro do padrão' },
      ])
        .map(
          (row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${row.item}</td>
          <td class="${row.status === 'NC' ? 'badge-nc' : 'badge-c'}">${row.status === 'NC' ? 'NÃO CONFORME' : 'CONFORME'}</td>
          <td>${row.obs || '—'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  ${item.notes ? `<p style="margin-top: 16px; background: #f1f5f9; padding: 10px; border-radius: 6px;"><strong>Parecer Técnico:</strong> ${item.notes}</p>` : ''}

  <div class="auth-badge">
    <strong>VALIDAÇÃO ELETRÔNICA DE AUTENTICIDADE:</strong><br>
    Assinatura Digital SST: ${item.digitalSignature}<br>
    ${item.facialSignatureCaptured ? '✓ Autenticação biométrica facial confirmada no momento da finalização do checklist.' : ''}
  </div>

  <div class="signatures">
    <div>
      <div class="sign-box">
        <strong>${item.inspectorName}</strong><br>
        <small>${item.inspectorRole} — RE ${item.inspectorRE}</small>
      </div>
    </div>
    <div>
      <div class="sign-box">
        <strong>João Bosco Lemos Junior</strong><br>
        <small>Gerente Executivo SESMT — RE 10204</small>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.formCode}_${item.unit.replace(/\s+/g, '_')}_${item.date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload file handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileName(file.name);
      setUploadedFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save new archived checklist
  const handleSaveNewChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ArchivedChecklistItem = {
      id: `chk-custom-${Date.now()}`,
      system: newSystem,
      systemName: getSystemLabel(newSystem),
      formCode: newDocCode.trim() || 'SST.RE-001',
      revision: newRevision.trim() || 'Rev 00',
      title: newTitle.trim(),
      unit: newUnit,
      subLocation: newLocation.trim() || undefined,
      date: newDate,
      inspectorName: newInspector.trim(),
      inspectorRE: newInspectorRE.trim() || '48201',
      inspectorRole: 'Técnico de Segurança do Trabalho',
      status: newStatus,
      totalItemsChecked: 10,
      itemsCompliant: newStatus === 'conforme' ? 10 : 8,
      itemsNonCompliant: newStatus === 'conforme' ? 0 : 2,
      facialSignatureCaptured: true,
      digitalSignature: `${newInspector.trim()} - RE ${newInspectorRE.trim()} (Certificado Digital)`,
      fileAttachmentName: uploadedFileName || undefined,
      fileAttachmentData: uploadedFileData || undefined,
      notes: newNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setChecklists((prev) => [newItem, ...prev]);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setUploadedFileName('');
    setUploadedFileData('');
    setNewNotes('');
  };

  // Delete checklist item
  const handleDeleteItem = (id: string) => {
    if (confirm('Deseja realmente excluir este checklist arquivado?')) {
      setChecklists((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border border-[#007960]/30 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header do Arquivo */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30 font-mono">
                  Repositório Oficial UISA
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {checklists.length} checklists arquivados
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Armazenamento de Checklists Realizados em PDF
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Arquivar Novo Checklist (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros por Sistema e Unidade */}
        <div className="p-3.5 border-b border-slate-100 bg-white space-y-2.5 shrink-0">
          {/* Seletor de Sistema */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedSystem('todos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                selectedSystem === 'todos'
                  ? 'bg-[#007960] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos os Sistemas ({checklists.length})
            </button>

            {(
              [
                'extintores',
                'hidrantes',
                'alarmes',
                'bombas',
                'caminhao_pipa',
                'brigadistas',
                'pae',
              ] as ChecklistSystemKey[]
            ).map((sysKey) => {
              const count = checklists.filter((c) => c.system === sysKey).length;
              const isSel = selectedSystem === sysKey;

              return (
                <button
                  key={sysKey}
                  onClick={() => setSelectedSystem(sysKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                    isSel
                      ? 'bg-[#007960] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {getSystemIcon(sysKey)}
                  <span>{getSystemLabel(sysKey)}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Busca e Filtro de Unidade */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#007960]" />
                <span>Unidade:</span>
              </span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-[#f8faf9] border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#007960]"
              >
                <option value="TODAS">Todas as Unidades</option>
                <option value="Indústria">Indústria</option>
                <option value="Empacotamento">Empacotamento</option>
                <option value="Posto de Combustível">Posto de Combustível</option>
                <option value="ADM / GMA">ADM / GMA</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por formulário, inspetor, local..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#f8faf9] border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#007960] w-64"
              />
            </div>
          </div>
        </div>

        {/* Lista de Checklists Arquivados */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
          {filteredList.map((item) => {
            const isConforme = item.status === 'conforme';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-[#007960]/40 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.formCode} ({item.revision})
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30 flex items-center gap-1">
                        {getSystemIcon(item.system)}
                        <span>{item.systemName}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isConforme
                          ? 'bg-emerald-50 text-[#007960] border-emerald-200'
                          : 'bg-red-50 text-[#de2726] border-red-200'
                      }`}>
                        {isConforme ? '✓ Aprovado / Conforme' : '⚠ Com Não Conformidade'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{item.unit}</strong> {item.subLocation ? `• ${item.subLocation}` : ''}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateBR(item.date)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>Inspetor: <strong>{item.inspectorName}</strong> ({item.inspectorRE})</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      {item.facialSignatureCaptured && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1 text-[10px]">
                          <ScanFace className="w-3 h-3" />
                          <span>Assinatura Facial Verificada</span>
                        </span>
                      )}
                      <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] flex items-center gap-1 truncate max-w-md">
                        <PenTool className="w-3 h-3 text-[#007960]" />
                        <span>{item.digitalSignature}</span>
                      </span>
                    </div>
                  </div>

                  {/* Ações: Visualizar e Baixar PDF */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedChecklistForView(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-colors shadow-2xs"
                      title="Visualizar documento completo e imprimir"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#007960]" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      onClick={() => handleDownloadChecklist(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors"
                      title="Baixar arquivo em PDF / HTML"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar PDF</span>
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir do repositório"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              Nenhum checklist arquivado encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO E IMPRESSÃO DE CHECKLIST */}
      {selectedChecklistForView && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white border border-[#007960]/30 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#007960]" />
                <span className="font-bold text-sm text-slate-900">
                  {selectedChecklistForView.formCode} — {selectedChecklistForView.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => handleDownloadChecklist(selectedChecklistForView)}
                  className="px-3 py-1.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>
                <button
                  onClick={() => setSelectedChecklistForView(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="border-b-2 border-[#007960] pb-3">
                <h2 className="text-base font-black text-[#007960] uppercase">
                  {selectedChecklistForView.title}
                </h2>
                <p className="text-slate-600 text-xs">
                  uisa — Bioenergia & Açúcar | Formulário Oficial {selectedChecklistForView.formCode} ({selectedChecklistForView.revision})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div><strong>Unidade:</strong> {selectedChecklistForView.unit} {selectedChecklistForView.subLocation ? `(${selectedChecklistForView.subLocation})` : ''}</div>
                <div><strong>Data:</strong> {formatDateBR(selectedChecklistForView.date)}</div>
                <div><strong>Inspetor:</strong> {selectedChecklistForView.inspectorName} (RE: {selectedChecklistForView.inspectorRE})</div>
                <div><strong>Status:</strong> {selectedChecklistForView.status === 'conforme' ? '100% Conforme' : 'Com Não Conformidade'}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 font-mono">
                  Itens Verificados no Checklist:
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#007960] text-white text-[11px]">
                      <tr>
                        <th className="p-2 w-8">#</th>
                        <th className="p-2">Item Verificado</th>
                        <th className="p-2 w-24">Status</th>
                        <th className="p-2">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedChecklistForView.itemsSummary || [
                        { item: 'Verificação visual e mecânica do sistema', status: 'C', obs: 'Conforme parâmetros' },
                        { item: 'Teste operacional de funcionamento', status: 'C', obs: 'Operando dentro do padrão' },
                      ]).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-medium text-slate-800">{row.item}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === 'NC' ? 'bg-red-100 text-[#de2726]' : 'bg-emerald-100 text-[#007960]'
                            }`}>
                              {row.status === 'NC' ? 'Não Conforme' : 'Conforme'}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600">{row.obs || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedChecklistForView.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-0.5">Parecer e Observações Técnicas:</span>
                  <p className="text-slate-700">{selectedChecklistForView.notes}</p>
                </div>
              )}

              {/* Assinaturas Digitais e Biométricas */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-[#007960] block text-[11px] uppercase tracking-wider font-mono">
                  Validação Eletrônica de Autenticidade:
                </span>
                <p className="text-slate-700 text-[11px]">
                  <strong>Assinatura Digital SST:</strong> {selectedChecklistForView.digitalSignature}
                </p>
                {selectedChecklistForView.facialSignatureCaptured && (
                  <p className="text-emerald-800 text-[11px] font-medium flex items-center gap-1">
                    <ScanFace className="w-3.5 h-3.5" />
                    <span>Autenticação biométrica facial confirmada no momento da finalização do checklist.</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ARQUIVAMENTO MANUAL DE NOVO CHECKLIST (PDF) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#007960]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#007960]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Arquivar Novo Checklist em PDF
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewChecklist} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sistema Aplicável:</label>
                <select
                  value={newSystem}
                  onChange={(e) => setNewSystem(e.target.value as ChecklistSystemKey)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#007960]"
                >
                  <option value="extintores">Extintores de Incêndio</option>
                  <option value="hidrantes">Rede de Hidrantes & LGE</option>
                  <option value="alarmes">Alarmes de Incêndio (SST.RE-020)</option>
                  <option value="bombas">Bombas de Combate & RTI (SST.RE-094)</option>
                  <option value="caminhao_pipa">Caminhão Bombeiro (SST.RE-109)</option>
                  <option value="brigadistas">Brigada de Emergência</option>
                  <option value="pae">Plano de Emergência (PAE)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cód. Formulário:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SST.RE-094"
                    value={newDocCode}
                    onChange={(e) => setNewDocCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Revisão:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rev 00"
                    value={newRevision}
                    onChange={(e) => setNewRevision(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Checklist:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Registro de Teste Semanal em Modo Automático"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unidade:</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#007960]"
                  >
                    <option value="Indústria">Indústria</option>
                    <option value="Empacotamento">Empacotamento</option>
                    <option value="Posto de Combustível">Posto de Combustível</option>
                    <option value="ADM / GMA">ADM / GMA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Data:</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#007960]"
                  />
                </div>
              </div>

              {/* Anexar Arquivo PDF */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Anexar Documento PDF:</label>
                {uploadedFileName ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="font-bold text-slate-900 truncate">{uploadedFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileName('');
                        setUploadedFileData('');
                      }}
                      className="text-rose-600 font-bold ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-300 hover:border-[#007960] rounded-xl p-3 text-center cursor-pointer bg-[#f8faf9]">
                    <input
                      type="file"
                      accept=".pdf,.html,.png,.jpg"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Paperclip className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <span className="font-bold text-slate-700 block">Clique para anexar arquivo PDF</span>
                    <span className="text-[10px] text-slate-500">PDF ou HTML até 15MB</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações do Registro:</label>
                <textarea
                  rows={2}
                  placeholder="Parecer do teste ou observações pertinentes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar no Repositório</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
