import React from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Droplets,
  BellRing,
  Truck,
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

export interface InspectionPdfItemRow {
  number: number | string;
  categoryOrSection: string;
  itemDescription: string;
  status: 'C' | 'NC' | 'N/A' | 'Conforme' | 'Não Conforme';
  observation?: string;
}

export interface InspectionPdfModalData {
  title: string;
  systemName: string;
  docNumber: string;
  revision: string;
  unit: string;
  date: string;
  inspectorName: string;
  inspectorRole?: string;
  inspectorRE?: string;
  operatorName?: string;
  operatorRole?: string;
  operatorRE?: string;
  managerName?: string;
  managerRole?: string;
  managerRE?: string;
  referenceStandard: string;
  annualReviewStatus: 'SINAL VERDE' | 'SINAL VERMELHO';
  annualReviewExpiryDate: string;
  notes?: string;
  rows: InspectionPdfItemRow[];
}

interface SystemInspectionPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InspectionPdfModalData | null;
}

export const SystemInspectionPdfModal: React.FC<SystemInspectionPdfModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFile = () => {
    // Generate text/html downloadable report
    const content = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${data.title} - ${data.docNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1e293b; font-size: 12px; }
    h1 { color: #007960; margin: 0 0 4px 0; font-size: 18px; text-transform: uppercase; }
    .header { border-bottom: 3px solid #007960; padding-bottom: 12px; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; background: #f8faf9; padding: 12px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #007960; color: white; padding: 8px; text-align: left; font-size: 11px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .badge-c { color: #007960; font-weight: bold; }
    .badge-nc { color: #de2726; font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 32px; text-align: center; }
    .sign-line { border-top: 1px solid #475569; padding-top: 6px; font-weight: bold; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    <p><strong>uisa — Bioenergia & Açúcar</strong> | Formulário Oficial ${data.docNumber} (Rev ${data.revision})</p>
    <p>Norma de Referência: ${data.referenceStandard} • Revisão Anual: ${data.annualReviewStatus} (Validade: ${data.annualReviewExpiryDate})</p>
  </div>
  <div class="meta-grid">
    <div><strong>Unidade / Local:</strong> ${data.unit}</div>
    <div><strong>Data da Inspeção:</strong> ${formatDateBR(data.date)}</div>
    <div><strong>Inspetor Responsável:</strong> ${data.inspectorName} (${data.inspectorRE || 'S/N'})</div>
    <div><strong>Gestor da Área / SESMT:</strong> ${data.managerName || 'João Bosco Lemos Junior'} (Gerente Executivo)</div>
  </div>
  <h3>Itens de Verificação e Conformidade</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Seção / Categoria</th>
        <th>Descrição do Item Inspecionado</th>
        <th style="width: 60px;">Status</th>
        <th>Observações / Ação</th>
      </tr>
    </thead>
    <tbody>
      ${data.rows
        .map(
          (r) => `
        <tr>
          <td>${r.number}</td>
          <td>${r.categoryOrSection}</td>
          <td>${r.itemDescription}</td>
          <td class="${r.status === 'NC' || r.status === 'Não Conforme' ? 'badge-nc' : 'badge-c'}">${r.status}</td>
          <td>${r.observation || '-'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  <div class="signatures">
    <div>
      <div class="sign-line">${data.inspectorName}</div>
      <small>Inspetor / Brigada SST<br>RE: ${data.inspectorRE || '48201'}</small>
    </div>
    <div>
      <div class="sign-line">${data.operatorName || 'Carlos Eduardo Mendes'}</div>
      <small>${data.operatorRole || 'Operador de Utilidades / Manutenção'}<br>RE: ${data.operatorRE || '44129'}</small>
    </div>
    <div>
      <div class="sign-line">${data.managerName || 'João Bosco Lemos Junior'}</div>
      <small>${data.managerRole || 'Gerente Executivo / SESMT'}<br>RE: ${data.managerRE || '10204'}</small>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.docNumber}_Inspecao_${data.unit.replace(/\s+/g, '_')}_${data.date}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const conformesCount = data.rows.filter((r) => r.status === 'C' || r.status === 'Conforme').length;
  const naoConformesCount = data.rows.filter((r) => r.status === 'NC' || r.status === 'Não Conforme').length;
  const naCount = data.rows.filter((r) => r.status === 'N/A').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#007960]/30 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#f8faf9] border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{data.title}</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#007960] text-white font-bold">
                  {data.docNumber}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-[#007960] border border-[#007960]/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {data.annualReviewStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                UISA Bioenergia & Açúcar • Inspeção Oficial Finalizada • Validade Anual: {data.annualReviewExpiryDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition-colors"
              title="Baixar arquivo da inspeção finalizada"
            >
              <Download className="w-3.5 h-3.5 text-[#007960]" />
              <span>Baixar Arquivo</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold text-xs shadow-xs transition-colors"
              title="Imprimir relatório oficial ou salvar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Gerar PDF / Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Preview */}
        <div className="p-6 overflow-y-auto bg-slate-100 text-xs flex-1">
          <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-sm space-y-5 max-w-3xl mx-auto">
            {/* Top Paper Header */}
            <div className="border-b-2 border-[#007960] pb-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
                  UISA BIOENERGIA & AÇÚCAR — SISTEMA INTEGRADO DE GESTÃO DE EMERGÊNCIAS
                </span>
                <h2 className="text-base font-black text-slate-900 uppercase mt-0.5">
                  {data.title}
                </h2>
                <div className="text-[11px] text-slate-600 mt-1">
                  Documento: <strong>{data.docNumber} Rev {data.revision}</strong> • Norma:{' '}
                  <strong>{data.referenceStandard}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-[#007960]/30 text-[#007960] text-[11px] font-bold font-mono">
                  {data.annualReviewStatus} • Anual
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Revisão válida até {data.annualReviewExpiryDate}
                </div>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Unidade / Divisão</span>
                <strong className="text-slate-900 font-bold">{data.unit}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Data da Aferição</span>
                <strong className="text-slate-900 font-mono">{formatDateBR(data.date)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Conformidade Geral</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#007960]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {conformesCount} C / {naoConformesCount} NC
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Plano de Ação</span>
                <strong className={naoConformesCount > 0 ? 'text-[#de2726]' : 'text-[#007960]'}>
                  {naoConformesCount > 0 ? `${naoConformesCount} NC Geradas` : 'Sem Pendências'}
                </strong>
              </div>
            </div>

            {/* Table of Checklist Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#f8faf9] text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">Seção / Categoria</th>
                    <th className="py-2.5 px-3">Critério de Verificação</th>
                    <th className="py-2.5 px-3 w-16 text-center">Status</th>
                    <th className="py-2.5 px-3">Observações / Parecer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.rows.map((row, idx) => {
                    const isNC = row.status === 'NC' || row.status === 'Não Conforme';
                    const isC = row.status === 'C' || row.status === 'Conforme';

                    return (
                      <tr key={idx} className={isNC ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                          {row.number}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium">{row.categoryOrSection}</td>
                        <td className="py-2 px-3 text-slate-900 font-medium">{row.itemDescription}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              isC
                                ? 'bg-emerald-100 text-[#007960]'
                                : isNC
                                ? 'bg-red-100 text-[#de2726]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-[10px]">
                          {row.observation || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Parecer Geral */}
            {data.notes && (
              <div className="bg-[#f8faf9] p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase mb-1">
                  Parecer Técnico Complementar:
                </span>
                <p className="text-slate-800 text-[11px] leading-relaxed">{data.notes}</p>
              </div>
            )}

            {/* Official Signature Blocks According to Reference Document */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                CAMPOS DE ASSINATURAS OFICIAIS (CONFORME FORMULÁRIO DE REFERÊNCIA SST):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {/* 1. Inspetor */}
                <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/50">
                  <div className="h-10 flex items-center justify-center font-serif italic text-slate-700 text-sm border-b border-dashed border-slate-300 pb-1">
                    ✓ Assinatura Digital Verificada
                  </div>
                  <strong className="block text-slate-900 mt-2 font-bold text-[11px]">{data.inspectorName}</strong>
                  <span className="text-[10px] text-slate-500 block">{data.inspectorRole || 'Inspetor / Brigada SST'}</span>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                    RE: {data.inspectorRE || '48201'} • Data: {formatDateBR(data.date)}
                  </span>
                </div>

                {/* 2. Operador de Utilidades / Manutenção */}
                <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/50">
                  <div className="h-10 flex items-center justify-center font-serif italic text-slate-700 text-sm border-b border-dashed border-slate-300 pb-1">
                    ✓ Visto de Manutenção
                  </div>
                  <strong className="block text-slate-900 mt-2 font-bold text-[11px]">
                    {data.operatorName || 'Carlos Eduardo Mendes'}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {data.operatorRole || 'Operador de Utilidades / Manutenção'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                    RE: {data.operatorRE || '44129'} • Visto Aprovado
                  </span>
                </div>

                {/* 3. Gestor de Área / SESMT */}
                <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/50">
                  <div className="h-10 flex items-center justify-center font-serif italic text-slate-700 text-sm border-b border-dashed border-slate-300 pb-1">
                    ✓ Validação de Gestão
                  </div>
                  <strong className="block text-slate-900 mt-2 font-bold text-[11px]">
                    {data.managerName || 'João Bosco Lemos Junior'}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {data.managerRole || 'Gerente Executivo / SESMT'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                    RE: {data.managerRE || '10204'} • Validação SST
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
