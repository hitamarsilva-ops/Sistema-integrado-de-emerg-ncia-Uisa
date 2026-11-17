import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Search,
  Filter,
  QrCode,
  ClipboardCheck,
  Repeat,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  ArrowUpDown,
  Download,
  Plus,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Warehouse,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Extinguisher,
  ExtinguisherSector,
  ExtinguisherType,
} from '../types/extinguisher';
import {
  checkCo2WeightLoss,
  computeExtinguisherStatus,
  formatDateBR,
  SECTOR_MAP,
  TYPE_MAP,
} from '../utils/formatters';

interface ExtinguisherTableViewProps {
  extinguishers: Extinguisher[];
  selectedSector: ExtinguisherSector | 'todos';
  onSelectSector: (sector: ExtinguisherSector | 'todos') => void;
  statusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEditExtinguisher: (ext: Extinguisher) => void;
  onDeleteExtinguisher: (id: string) => void;
  onClearAllExtinguishers?: () => void;
  onInspectExtinguisher: (ext: Extinguisher) => void;
  onPrintLabel: (ext: Extinguisher) => void;
  onQuickSwap: (ext: Extinguisher) => void;
  onAddNew: () => void;
  onOpenImportModal?: () => void;
  onOpenInspectionReport?: () => void;
}

export const ExtinguisherTableView: React.FC<ExtinguisherTableViewProps> = ({
  extinguishers,
  selectedSector,
  onSelectSector,
  statusFilter,
  onSelectStatusFilter,
  searchQuery,
  onSearchChange,
  onEditExtinguisher,
  onDeleteExtinguisher,
  onClearAllExtinguishers,
  onInspectExtinguisher,
  onPrintLabel,
  onQuickSwap,
  onAddNew,
  onOpenImportModal,
  onOpenInspectionReport,
}) => {
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedWeight, setSelectedWeight] = useState<string>('todos');
  const [selectedSubArea, setSelectedSubArea] = useState<string>('todos');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<'rechargeExpiryDate' | 'code' | 'sector'>('rechargeExpiryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const INDUSTRIAL_AREAS = [
    'DESTILARIA',
    'COGEN',
    'ESTEIRAS',
    'CALDEIRAS',
    'ETALG',
    'MOENDAS',
    'TRATAMENTO DE CALDO',
    'FÁBRICA DE AÇÚCAR',
    'ETA',
    'CAPTAÇÃO',
    'FÁBRICA DE LEVEDURA',
    'SETOR INDÚSTRIAL',
    'CENTRO DE TECNOLOGIA',
  ];

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSector, statusFilter, selectedType, selectedWeight, selectedSubArea, searchQuery]);

  // Unique capacity weights
  const uniqueWeights = useMemo(() => {
    const s = new Set<string>();
    extinguishers.forEach((e) => {
      if (e.capacityWeight) s.add(e.capacityWeight);
    });
    return Array.from(s).sort();
  }, [extinguishers]);

  // Filtered extinguishers
  const filteredExtinguishers = useMemo(() => {
    return extinguishers.filter((ext) => {
      // Sector filter
      if (selectedSector !== 'todos') {
        if (ext.sector !== selectedSector) return false;
      }

      // Status filter
      if (statusFilter !== 'todos') {
        const computed = computeExtinguisherStatus(ext);
        if (statusFilter === 'almoxarifado') {
          if (!ext.isStockInWarehouse && !ext.sector.startsWith('almoxarifado')) return false;
        } else if (computed.status !== statusFilter) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'todos' && ext.type !== selectedType) {
        return false;
      }

      // Weight filter
      if (selectedWeight !== 'todos' && ext.capacityWeight !== selectedWeight) {
        return false;
      }

      // Sub-area filter (specifically for UISA industrial plant areas)
      if (selectedSubArea !== 'todos') {
        const matchesSubArea = ext.locationDetails
          .toUpperCase()
          .includes(selectedSubArea.toUpperCase());
        if (!matchesSubArea) return false;
      }

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCode = ext.code.toLowerCase().includes(q);
        const mLoc = ext.locationDetails.toLowerCase().includes(q);
        const mSeal = ext.inmetroSeal.toLowerCase().includes(q);
        const mSerial = ext.serialNumber.toLowerCase().includes(q);
        const mType = (TYPE_MAP[ext.type]?.name || ext.type).toLowerCase().includes(q);
        const mSec = (SECTOR_MAP[ext.sector]?.name || ext.sector).toLowerCase().includes(q);
        if (!mCode && !mLoc && !mSeal && !mSerial && !mType && !mSec) {
          return false;
        }
      }

      return true;
    });
  }, [
    extinguishers,
    selectedSector,
    statusFilter,
    selectedType,
    selectedWeight,
    selectedSubArea,
    searchQuery,
  ]);

  // Sorted extinguishers
  const sortedExtinguishers = useMemo(() => {
    return [...filteredExtinguishers].sort((a, b) => {
      let valA: string = a[sortField] || '';
      let valB: string = b[sortField] || '';

      if (sortField === 'code') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB, undefined, { numeric: true })
          : valB.localeCompare(valA, undefined, { numeric: true });
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredExtinguishers, sortField, sortOrder]);

  // Paginated extinguishers
  const paginatedExtinguishers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedExtinguishers.slice(startIndex, startIndex + pageSize);
  }, [sortedExtinguishers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredExtinguishers.length / pageSize);

  const toggleSort = (field: 'rechargeExpiryDate' | 'code' | 'sector') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredExtinguishers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExtinguishers.map((e) => e.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Filter and Action Bar (White & Safety Green Theme - Inventário Geral) */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
        {/* Filters: Status, Type, Weight, and Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200">
              <span className="text-slate-500 px-2 text-[11px] font-bold">Status:</span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'valido', label: 'Válidos' },
                { id: 'atencao', label: 'A Vencer (<30d)' },
                { id: 'vencido', label: 'Vencidos' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    statusFilter === st.id
                      ? st.id === 'vencido'
                        ? 'bg-[#de2726] text-white shadow-xs'
                        : 'bg-[#007960] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Type Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#f8faf9] border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960]"
            >
              <option value="todos">Todos os Tipos</option>
              {Object.entries(TYPE_MAP).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name}
                </option>
              ))}
            </select>

            {/* Weight Dropdown */}
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(e.target.value)}
              className="bg-[#f8faf9] border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#007960] focus:ring-1 focus:ring-[#007960]"
            >
              <option value="todos">Todas as Cargas/Pesos</option>
              {uniqueWeights.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Right Action count & buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Alerta de Revisão Anual de Referência */}
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-emerald-50 text-[#007960] border border-[#007960]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SINAL VERDE: NBR 12962 / NR-23 (Válido até 31/12/2027)
            </span>

            <span className="text-slate-500 text-xs font-mono mr-1">
              Mostrando <strong className="text-slate-900">{filteredExtinguishers.length}</strong> de {extinguishers.length}
            </span>

            {selectedIds.size > 0 && (
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-mono font-bold">
                {selectedIds.size} selecionado(s)
              </span>
            )}

            {onOpenInspectionReport && (
              <button
                onClick={onOpenInspectionReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 transition-colors shadow-2xs"
                title="Gerar PDF Geral das inspeções finalizadas com opção de download"
              >
                <Printer className="w-3.5 h-3.5 text-[#007960]" />
                <span>Gerar PDF Geral</span>
              </button>
            )}

            {onClearAllExtinguishers && extinguishers.length > 0 && (
              <button
                onClick={onClearAllExtinguishers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#de2726] font-bold border border-red-300 transition-colors shadow-2xs"
                title="Excluir todos os extintores cadastrados"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#de2726]" />
                <span>Excluir Todos</span>
              </button>
            )}

            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 transition-colors shadow-2xs"
                title="Importar e Atualizar Extintores via Planilha Excel (.xlsx) ou CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#007960]" />
                <span>Importar Planilha</span>
              </button>
            )}

            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Extintor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Extinguishers Table (White & Safety Green) */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredExtinguishers.length > 0 &&
                      selectedIds.size === filteredExtinguishers.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#007960] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => toggleSort('code')}
                  className="py-3 px-3 cursor-pointer hover:text-[#007960] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tag / Código</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('sector')}
                  className="py-3 px-3 cursor-pointer hover:text-[#007960] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Setor & Localização</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Tipo & Agente</th>
                <th className="py-3 px-3">Carga / Peso</th>
                <th
                  onClick={() => toggleSort('rechargeExpiryDate')}
                  className="py-3 px-3 cursor-pointer hover:text-[#007960] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Validade Recarga</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Reteste Hidrostático (5a)</th>
                <th className="py-3 px-3 text-center">Condições Físicas</th>
                <th className="py-3 px-3 text-right">Ações Rápidas</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-normal bg-white">
              {paginatedExtinguishers.map((ext) => {
                const statusData = computeExtinguisherStatus(ext);
                const sectorInfo = SECTOR_MAP[ext.sector] || { name: ext.sector, badgeBg: 'bg-slate-100 text-slate-700' };
                const typeInfo = TYPE_MAP[ext.type] || { acro: ext.type, name: ext.type, badgeBg: 'bg-slate-100 text-slate-700' };
                const isSelected = selectedIds.has(ext.id);
                const isExpired = statusData.status === 'vencido';

                // Check CO2 weighing
                const co2Check = ext.type === 'co2' ? checkCo2WeightLoss(ext.grossWeightRefKg, ext.currentWeightKg) : null;

                return (
                  <tr
                    key={ext.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-emerald-50/50' : isExpired ? 'bg-red-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(ext.id)}
                        className="rounded border-slate-300 text-[#007960] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Tag / Code */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onPrintLabel(ext)}
                          className="p-1 rounded bg-slate-100 hover:bg-[#007960] text-slate-600 hover:text-white transition-colors"
                          title="Imprimir Etiqueta / Ver QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <span>{ext.code}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                        Selo: {ext.inmetroSeal}
                      </div>
                    </td>

                    {/* Sector & Detailed Location */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f8faf9] text-slate-700 border border-slate-200">
                          {sectorInfo.name}
                        </span>
                        {ext.maintenanceOrder && (
                          <span
                            className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-mono font-bold"
                            title={`Ordem de Serviço: ${ext.maintenanceOrder}`}
                          >
                            OS {ext.maintenanceOrder}
                          </span>
                        )}
                        {ext.isStockInWarehouse && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-[#007960] border border-[#007960]/30 text-[9px] font-mono font-bold">
                            RESERVA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-800 font-medium truncate mt-1" title={ext.locationDetails}>
                        {ext.locationDetails}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {typeInfo.name}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {typeInfo.fireClasses?.split('(')[0] || ''}
                      </div>
                    </td>

                    {/* Capacity / Weight & Weight loss check for CO2 */}
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-900">{ext.capacityWeight}</div>
                      {ext.type === 'co2' && ext.grossWeightRefKg && (
                        <div className="text-[10px] flex items-center gap-1 mt-0.5">
                          <Scale className="w-3 h-3 text-slate-400" />
                          <span className={co2Check?.isCritical ? 'text-[#de2726] font-bold' : 'text-slate-500'}>
                            {ext.currentWeightKg || ext.grossWeightRefKg}kg
                            {co2Check?.hasLoss && ` (-${co2Check.lossPercent}%)`}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Validade Recarga (Critical) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] border ${
                          isExpired
                            ? 'bg-red-50 text-[#de2726] border-[#de2726]/40'
                            : statusData.status === 'atencao'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-[#007960] border-[#007960]/30'
                        }`}
                      >
                        <span>{statusData.label}</span>
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Expira: <strong>{formatDateBR(ext.rechargeExpiryDate)}</strong>
                      </div>
                    </td>

                    {/* Reteste Hidrostático */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      <div>{formatDateBR(ext.hydrostaticExpiryDate)}</div>
                      <div className="text-[10px] text-slate-400">
                        Último: {formatDateBR(ext.hydrostaticTestDate)}
                      </div>
                    </td>

                    {/* Physical condition checks (Manometer, Seal, Hose, Signage) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5" title="Manômetro / Lacre / Mangueira / Sinalização">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            ext.pressureGaugeOk ? 'bg-emerald-100 text-[#007960] border border-[#007960]/30' : 'bg-red-100 text-[#de2726] border border-[#de2726]/40'
                          }`}
                          title={ext.pressureGaugeOk ? 'Manômetro na faixa verde OK' : 'Manômetro com baixa/alta pressão'}
                        >
                          P
                        </span>
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            ext.sealIntact ? 'bg-emerald-100 text-[#007960] border border-[#007960]/30' : 'bg-red-100 text-[#de2726] border border-[#de2726]/40'
                          }`}
                          title={ext.sealIntact ? 'Lacre e pino de segurança intactos' : 'Lacre violado ou ausente'}
                        >
                          L
                        </span>
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            ext.unobstructed ? 'bg-emerald-100 text-[#007960] border border-[#007960]/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                          title={ext.unobstructed ? 'Área desobstruída' : 'Obstruído por caixas/materiais'}
                        >
                          A
                        </span>
                      </div>
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Inspect checklist */}
                        <button
                          onClick={() => onInspectExtinguisher(ext)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#007960] text-slate-700 hover:text-white transition-colors"
                          title="Realizar Inspeção Mensal / Checklist de Campo"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Swap with Warehouse (if not already warehouse) */}
                        {!ext.isStockInWarehouse && (
                          <button
                            onClick={() => onQuickSwap(ext)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-[#007960] text-[#007960] hover:text-white transition-colors border border-[#007960]/30"
                            title="Troca Rápida: Substituir por unidade reserva do Almoxarifado"
                          >
                            <Repeat className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print Label & QR */}
                        <button
                          onClick={() => onPrintLabel(ext)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Imprimir Etiqueta Industrial"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditExtinguisher(ext)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Editar Cadastro"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteExtinguisher(ext.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-[#de2726] transition-colors"
                          title="Excluir Extintor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExtinguishers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-600 text-xs">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Flame className="w-6 h-6 text-[#007960]" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {extinguishers.length === 0
                        ? 'Nenhum extintor cadastrado no aplicativo'
                        : 'Nenhum extintor encontrado com os filtros selecionados'}
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-4">
                      {extinguishers.length === 0
                        ? 'A base de extintores está zerada. Cadastre um extintor individualmente ou importe a planilha de inventário.'
                        : 'Tente alterar os filtros de setor, status ou termo de busca acima.'}
                    </p>
                    {extinguishers.length === 0 && (
                      <div className="flex items-center justify-center gap-2">
                        {onOpenImportModal && (
                          <button
                            onClick={onOpenImportModal}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 shadow-2xs transition-all"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-[#007960]" />
                            <span>Importar Planilha</span>
                          </button>
                        )}
                        <button
                          onClick={onAddNew}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold shadow-xs transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Novo Extintor</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (White & Safety Theme) */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Exibindo{' '}
              <strong className="text-slate-900">
                {filteredExtinguishers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-slate-900">
                {Math.min(currentPage * pageSize, filteredExtinguishers.length)}
              </strong>{' '}
              de <strong className="text-slate-900">{filteredExtinguishers.length}</strong> unidades
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Itens por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded-md px-2 py-0.5 text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={99999}>Todos ({filteredExtinguishers.length})</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-slate-700 px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold">
                Página <strong className="text-[#007960]">{currentPage}</strong> de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
