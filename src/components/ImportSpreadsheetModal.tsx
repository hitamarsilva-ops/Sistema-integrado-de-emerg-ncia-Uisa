import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  RefreshCw,
  Plus,
  ArrowRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import {
  Extinguisher,
} from '../types/extinguisher';
import {
  downloadSpreadsheetTemplate,
  ImportPreviewSummary,
  parseSpreadsheetFile,
} from '../utils/spreadsheetParser';
import { formatDateBR, SECTOR_MAP, TYPE_MAP } from '../utils/formatters';
import { playIndustrialSound } from '../utils/audioAlerts';

interface ImportSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingExtinguishers: Extinguisher[];
  onApplyImport: (
    importedExtinguishers: Extinguisher[],
    mode: 'upsert' | 'update_only' | 'replace_all'
  ) => void;
}

export const ImportSpreadsheetModal: React.FC<ImportSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  existingExtinguishers,
  onApplyImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewSummary, setPreviewSummary] = useState<ImportPreviewSummary | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'update_only' | 'replace_all'>('upsert');
  const [targetUnit, setTargetUnit] = useState<string>('auto');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega setores customizados cadastrados
  const customSectors = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('sge_desktop_custom_sectors_uisa_v2');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }, []);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    try {
      const summary = await parseSpreadsheetFile(selectedFile, existingExtinguishers);
      setPreviewSummary(summary);
      playIndustrialSound('ping');
    } catch (err) {
      console.error('Erro ao ler planilha:', err);
      alert('Erro ao processar o arquivo. Verifique se é uma planilha Excel (.xlsx, .xls) ou CSV válida.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleConfirmImport = () => {
    if (!previewSummary || previewSummary.parsedRows.length === 0) return;

    let finalExtinguishers: Extinguisher[] = [];

    if (importMode === 'replace_all') {
      // Replace entire database with the parsed rows
      finalExtinguishers = previewSummary.parsedRows
        .filter((r) => !r.hasErrors)
        .map((r) => r.extinguisher as Extinguisher);
    } else if (importMode === 'update_only') {
      // Only update matched items in the existing list
      const updateMap = new Map<string, Extinguisher>();
      previewSummary.parsedRows.forEach((r) => {
        if (r.isUpdate && r.matchedId && !r.hasErrors) {
          updateMap.set(r.matchedId, r.extinguisher as Extinguisher);
        }
      });
      finalExtinguishers = existingExtinguishers.map((orig) => {
        return updateMap.get(orig.id) || orig;
      });
    } else {
      // 'upsert': update existing and append new ones
      const existingMap = new Map<string, Extinguisher>();
      existingExtinguishers.forEach((e) => existingMap.set(e.id, e));

      previewSummary.parsedRows.forEach((r) => {
        if (!r.hasErrors) {
          const ext = r.extinguisher as Extinguisher;
          if (r.isUpdate && r.matchedId) {
            existingMap.set(r.matchedId, ext);
          } else {
            existingMap.set(ext.id, ext);
          }
        }
      });
      finalExtinguishers = Array.from(existingMap.values());
    }

    // Aplica a unidade/setor escolhido pelo usuário caso selecionado
    if (targetUnit !== 'auto') {
      finalExtinguishers = finalExtinguishers.map((ext) => ({
        ...ext,
        sector: targetUnit as any,
      }));
    }

    onApplyImport(finalExtinguishers, importMode);
    playIndustrialSound('success');
    onClose();
  };

  const resetUpload = () => {
    setFile(null);
    setPreviewSummary(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#007960]/10 border border-[#007960]/30 text-[#007960]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Importação e Atualização de Extintores por Planilha</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/40 font-bold">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Sincronize validades de recarga, setores (como Posto de Combustível), pesos e dados em lote a partir do Excel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSpreadsheetTemplate('xlsx')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors"
              title="Baixar planilha modelo formatada para preenchimento"
            >
              <Download className="w-3.5 h-3.5 text-[#007960]" />
              <span>Baixar Modelo (.xlsx)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs bg-white">
          {!previewSummary ? (
            /* Upload Drop Area */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-[#007960] bg-emerald-50 ring-2 ring-[#007960]/30'
                  : 'border-slate-300 bg-[#f8faf9] hover:border-[#007960] hover:bg-emerald-50/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-[#007960]/10 border border-[#007960]/30 flex items-center justify-center text-[#007960] mb-3">
                <Upload className="w-7 h-7" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Arraste e solte sua planilha Excel ou clique para selecionar
              </h3>
              <p className="text-slate-600 text-xs max-w-md">
                Suporta arquivos <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>. O sistema reconhece automaticamente colunas como Tag, Setor, Validade de Recarga, Selo INMETRO e Carga/Peso.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-medium">.XLSX</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-medium">.XLS</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-medium">.CSV</span>
              </div>
            </div>
          ) : (
            /* Preview Screen */
            <div className="space-y-4">
              {/* Top Summary Bar */}
              <div className="bg-[#f8faf9] border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#007960]" />
                    <span className="font-bold text-slate-900 text-xs">{previewSummary.fileName}</span>
                    <span className="text-slate-500 font-mono">({previewSummary.totalRows} linhas lidas)</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className="text-blue-700 font-medium">
                      • {previewSummary.updateRowsCount} extintor(es) existentes para <strong>atualizar</strong>
                    </span>
                    <span className="text-[#007960] font-bold">
                      • {previewSummary.newRowsCount} extintor(es) novos para <strong>inserir</strong>
                    </span>
                    {previewSummary.invalidRowsCount > 0 && (
                      <span className="text-rose-600 font-medium">
                        • {previewSummary.invalidRowsCount} com pendência
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={resetUpload}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Trocar Planilha</span>
                </button>
              </div>

              {/* Escolha da Unidade / Setor de Destino (solicitado pelo usuário) */}
              <div className="bg-[#f8faf9] border border-[#007960]/30 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#007960]" />
                    <span>Escolha da Unidade / Setor de Destino:</span>
                  </label>
                  <span className="text-[11px] text-[#007960] font-semibold">
                    {targetUnit === 'auto' ? 'Mantendo setor da planilha' : 'Unidade fixa definida'}
                  </span>
                </div>

                <select
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960]"
                >
                  <option value="auto">Auto-detectar da Coluna "Setor" da Planilha (Padrão)</option>
                  <option value="unidade_industrial">Indústria (Destilaria, Fábrica de Açúcar, ETA, Caldeiras, Moendas)</option>
                  <option value="empacotamento">Empacotamento (Silos, Ensaque, Paletização, Armazéns)</option>
                  <option value="posto_combustivel">Posto de Combustível (Pistas, Tanques, Oficina Automotiva)</option>
                  <option value="adm">ADM / GMA (Administrativo, CPD, Ambulatório, Apoio Geral)</option>
                  {customSectors.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shortName})
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-600">
                  {targetUnit === 'auto'
                    ? 'Cada extintor será atribuído ao setor identificado na linha da planilha.'
                    : `Atenção: Todos os extintores desta importação serão direcionados para este setor selecionado.`}
                </p>
              </div>

              {/* Mode Selection */}
              <div className="bg-[#f8faf9] border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="block text-slate-800 font-bold text-xs">
                  Modo de Aplicação da Planilha:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      importMode === 'upsert'
                        ? 'bg-emerald-50 border-[#007960] text-[#007960] ring-1 ring-[#007960]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-slate-900">Atualizar e Inserir Novos</strong>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'upsert'}
                        onChange={() => setImportMode('upsert')}
                        className="text-[#007960] focus:ring-0"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Recomendado: atualiza os extintores já cadastrados pela Tag e insere os que forem novos (ex: Posto de Combustível).
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      importMode === 'update_only'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-slate-900">Apenas Atualizar</strong>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'update_only'}
                        onChange={() => setImportMode('update_only')}
                        className="text-blue-600 focus:ring-0"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Apenas sincroniza datas e dados de extintores que já existem no sistema. Ignora novos.
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      importMode === 'replace_all'
                        ? 'bg-red-50 border-red-600 text-red-900 ring-1 ring-red-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-slate-900">Substituir Toda a Base</strong>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace_all'}
                        onChange={() => setImportMode('replace_all')}
                        className="text-red-600 focus:ring-0"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Substitui o inventário inteiro exclusivamente pelas linhas desta planilha.
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-800">
                    Pré-visualização das Linhas Reconhecidas ({previewSummary.parsedRows.length}):
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Exibindo dados mapeados
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Ação</th>
                        <th className="py-2.5 px-3">Código/Tag</th>
                        <th className="py-2.5 px-3">Setor Reconhecido</th>
                        <th className="py-2.5 px-3">Localização</th>
                        <th className="py-2.5 px-3">Tipo & Carga</th>
                        <th className="py-2.5 px-3">Validade Recarga</th>
                        <th className="py-2.5 px-3">Reteste (5a)</th>
                        <th className="py-2.5 px-3">Selo INMETRO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {previewSummary.parsedRows.map((row, idx) => {
                        const ext = row.extinguisher;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-sans">
                              {row.hasErrors ? (
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                  Pendente
                                </span>
                              ) : row.isUpdate ? (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                  Atualizar
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30 text-[10px] font-bold">
                                  Novo
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {ext.code}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SECTOR_MAP[ext.sector || 'unidade_industrial']?.badgeBg}`}>
                                {SECTOR_MAP[ext.sector || 'unidade_industrial']?.shortName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-slate-700 max-w-xs truncate" title={ext.locationDetails}>
                              {ext.locationDetails}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-sans">
                              {TYPE_MAP[ext.type || 'po_polivalente_abc']?.acro} {ext.capacityWeight}
                            </td>
                            <td className="py-2.5 px-3 text-[#007960] font-bold">
                              {formatDateBR(ext.rechargeExpiryDate)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {formatDateBR(ext.hydrostaticExpiryDate)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {ext.inmetroSeal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-between bg-[#f8faf9] text-xs">
          <span className="text-slate-500">
            Dica: Utilize o modelo oficial caso suas colunas estejam com nomes diferentes.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={!previewSummary || previewSummary.parsedRows.length === 0}
              className="px-5 py-2 rounded-lg bg-[#007960] hover:bg-[#00604c] disabled:opacity-40 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar e Atualizar Extintores</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
