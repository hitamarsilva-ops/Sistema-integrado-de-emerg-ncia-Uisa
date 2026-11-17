import React, { useState } from 'react';
import {
  Warehouse,
  Repeat,
  Plus,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Flame,
  FileText,
  Printer,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Factory,
  Building2,
  FileCheck2,
  Paperclip,
  Calendar,
  Clock,
  ExternalLink,
  Download,
  X,
  Save,
  Tag,
  AlertCircle,
} from 'lucide-react';
import {
  Extinguisher,
  ExtinguisherSector,
  StockCondition,
} from '../types/extinguisher';
import {
  formatDateBR,
  isWarehouseSector,
  SECTOR_MAP,
  STOCK_CONDITION_MAP,
  TYPE_MAP,
  WAREHOUSE_SECTORS,
} from '../utils/formatters';

interface WarehouseStockViewProps {
  extinguishers: Extinguisher[];
  onOpenQuickSwap: (expiredExt?: Extinguisher) => void;
  onAddNewStock: (targetWarehouse?: ExtinguisherSector) => void;
  onInspectExtinguisher: (ext: Extinguisher) => void;
  onPrintLabel: (ext: Extinguisher) => void;
  onUpdateCondition: (id: string, condition: StockCondition) => void;
  onPrintRechargeOrder: (rechargeUnits: Extinguisher[]) => void;
  onUpdateExtinguisher?: (updated: Extinguisher) => void;
}

export const WarehouseStockView: React.FC<WarehouseStockViewProps> = ({
  extinguishers,
  onOpenQuickSwap,
  onAddNewStock,
  onInspectExtinguisher,
  onPrintLabel,
  onUpdateCondition,
  onPrintRechargeOrder,
  onUpdateExtinguisher,
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    'todos' | 'almoxarifado_industria' | 'almoxarifado_empacotamento' | 'almoxarifado_adm'
  >('todos');
  const [stockConditionFilter, setStockConditionFilter] = useState<'todos' | 'pronto_uso' | 'aguardando_recarga' | 'com_remessa'>('todos');

  // Modal de Nota Fiscal de Saída / Retorno / Prazo / Anexo
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingExtForInvoice, setEditingExtForInvoice] = useState<Extinguisher | null>(null);

  const [exitInvoice, setExitInvoice] = useState('');
  const [returnInvoice, setReturnInvoice] = useState('');
  const [returnDeadline, setReturnDeadline] = useState('');
  const [invoiceAttachmentName, setInvoiceAttachmentName] = useState('');
  const [invoiceAttachmentData, setInvoiceAttachmentData] = useState('');
  const [workshopSupplier, setWorkshopSupplier] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Filter all warehouse items (using helper isWarehouseSector or isStockInWarehouse)
  const allWarehouseItems = extinguishers.filter(
    (e) => e.isStockInWarehouse || isWarehouseSector(e.sector)
  );

  // Group by specific separated warehouse
  const industriaItems = allWarehouseItems.filter(
    (e) => e.sector === 'almoxarifado_industria' || (!isWarehouseSector(e.sector) && e.isStockInWarehouse)
  );
  const empacotamentoItems = allWarehouseItems.filter(
    (e) => e.sector === 'almoxarifado_empacotamento'
  );
  const admItems = allWarehouseItems.filter(
    (e) => e.sector === 'almoxarifado_adm'
  );

  // Filtered list based on selected warehouse tab
  const currentWarehouseItems = allWarehouseItems.filter((e) => {
    if (selectedWarehouse === 'todos') return true;
    if (selectedWarehouse === 'almoxarifado_industria') {
      return e.sector === 'almoxarifado_industria' || e.sector === 'almoxarifado';
    }
    return e.sector === selectedWarehouse;
  });

  const readyUnits = currentWarehouseItems.filter((e) => e.stockCondition === 'pronto_uso' || !e.stockCondition);
  const awaitingRecharge = currentWarehouseItems.filter((e) => e.stockCondition === 'aguardando_recarga');
  const unitsWithInvoice = currentWarehouseItems.filter((e) => Boolean(e.dispatchExitInvoiceNumber || e.dispatchReturnInvoiceNumber || e.dispatchInvoiceAttachmentData));

  // Expired units in other sectors that need replacement
  const expiredFieldUnits = extinguishers.filter(
    (e) => !e.isStockInWarehouse && !isWarehouseSector(e.sector) && new Date(e.rechargeExpiryDate + 'T00:00:00').getTime() < new Date().setHours(0,0,0,0)
  );

  const displayedItems = currentWarehouseItems.filter((e) => {
    if (stockConditionFilter === 'pronto_uso') return e.stockCondition === 'pronto_uso' || !e.stockCondition;
    if (stockConditionFilter === 'aguardando_recarga') return e.stockCondition === 'aguardando_recarga';
    if (stockConditionFilter === 'com_remessa') return Boolean(e.dispatchExitInvoiceNumber || e.dispatchReturnInvoiceNumber || e.dispatchInvoiceAttachmentData);
    return true;
  });

  // Open invoice dispatch modal for specific extinguisher
  const handleOpenInvoiceModal = (ext: Extinguisher) => {
    setEditingExtForInvoice(ext);
    setExitInvoice(ext.dispatchExitInvoiceNumber || '');
    setReturnInvoice(ext.dispatchReturnInvoiceNumber || '');
    setReturnDeadline(ext.dispatchReturnDeadline || '');
    setInvoiceAttachmentName(ext.dispatchInvoiceAttachmentName || '');
    setInvoiceAttachmentData(ext.dispatchInvoiceAttachmentData || '');
    setWorkshopSupplier(ext.supplierOrWorkshop || '');
    setDispatchNotes(ext.dispatchNotes || '');
    setIsInvoiceModalOpen(true);
  };

  // Handle file attachment upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo selecionado deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInvoiceAttachmentName(file.name);
      setInvoiceAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save invoice dispatch info
  const handleSaveInvoiceInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExtForInvoice || !onUpdateExtinguisher) return;

    const updatedExt: Extinguisher = {
      ...editingExtForInvoice,
      dispatchExitInvoiceNumber: exitInvoice.trim() || undefined,
      dispatchReturnInvoiceNumber: returnInvoice.trim() || undefined,
      dispatchReturnDeadline: returnDeadline || undefined,
      dispatchInvoiceAttachmentName: invoiceAttachmentName || undefined,
      dispatchInvoiceAttachmentData: invoiceAttachmentData || undefined,
      supplierOrWorkshop: workshopSupplier.trim() || editingExtForInvoice.supplierOrWorkshop,
      dispatchNotes: dispatchNotes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onUpdateExtinguisher(updatedExt);
    setIsInvoiceModalOpen(false);
    setEditingExtForInvoice(null);
  };

  // Check deadline status helper
  const getDeadlineStatus = (deadline?: string, hasReturn?: boolean) => {
    if (hasReturn) return { label: 'Devolvido com NF', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (!deadline) return null;
    const target = new Date(deadline + 'T00:00:00').getTime();
    const today = new Date().setHours(0,0,0,0);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Prazo Expirado (${Math.abs(diffDays)}d atrasado)`, color: 'text-[#de2726] bg-red-50 border-red-200 font-bold' };
    }
    if (diffDays <= 7) {
      return { label: `A Vencer (${diffDays} dias restantes)`, color: 'text-amber-700 bg-amber-50 border-amber-200 font-bold' };
    }
    return { label: `No Prazo (${diffDays} dias)`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & KPI (White & Safety Green) */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shrink-0">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30">
                  Reserva Técnica & Estoques Setoriais
                </span>
                <span className="text-xs text-slate-500">Controle de Remessas e Notas Fiscais</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Gestão dos Estoques Almoxarifados
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Controle de cilindros em reserva técnica e remessas para recarga com <strong>Nota de Saída</strong>, <strong>Nota de Retorno</strong>, <strong>Prazo</strong> e <strong>Anexo de NF</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenQuickSwap()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs transition-colors"
            >
              <Repeat className="w-4 h-4 text-[#007960]" />
              <span>Realizar Troca Rápida</span>
            </button>
            <button
              onClick={() => onAddNewStock(selectedWarehouse !== 'todos' ? selectedWarehouse : 'almoxarifado_industria')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Entrada no Estoque</span>
            </button>
          </div>
        </div>

        {/* 3 Dedicated Warehouse Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-4 border-t border-slate-100">
          {/* 1. Estoque da Indústria */}
          <div
            onClick={() => setSelectedWarehouse('almoxarifado_industria')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedWarehouse === 'almoxarifado_industria'
                ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30'
                : 'bg-white border-slate-200 hover:border-[#007960]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-[#007960]" />
                <span>Estoque da Indústria</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#007960]">
                {industriaItems.length} un
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              Prontos: <strong className="text-[#007960] font-mono">{industriaItems.filter((x) => x.stockCondition === 'pronto_uso' || !x.stockCondition).length}</strong> • 
              P/ Recarga: <strong className="text-rose-600 font-mono">{industriaItems.filter((x) => x.stockCondition === 'aguardando_recarga').length}</strong>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              Cilindros industriais (Pó ABC 12kg, CO2 6kg)
            </p>
          </div>

          {/* 2. Estoque do Empacotamento */}
          <div
            onClick={() => setSelectedWarehouse('almoxarifado_empacotamento')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedWarehouse === 'almoxarifado_empacotamento'
                ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30'
                : 'bg-white border-slate-200 hover:border-[#007960]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#007960]" />
                <span>Estoque do Empacotamento</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#007960]">
                {empacotamentoItems.length} un
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              Prontos: <strong className="text-[#007960] font-mono">{empacotamentoItems.filter((x) => x.stockCondition === 'pronto_uso' || !x.stockCondition).length}</strong> • 
              P/ Recarga: <strong className="text-rose-600 font-mono">{empacotamentoItems.filter((x) => x.stockCondition === 'aguardando_recarga').length}</strong>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              Reservas para linhas de ensaque, robôs e docas
            </p>
          </div>

          {/* 3. Estoque do ADM */}
          <div
            onClick={() => setSelectedWarehouse('almoxarifado_adm')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedWarehouse === 'almoxarifado_adm'
                ? 'bg-emerald-50/50 border-[#007960] shadow-xs ring-2 ring-[#007960]/30'
                : 'bg-white border-slate-200 hover:border-[#007960]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#007960]" />
                <span>Estoque do ADM</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#007960]">
                {admItems.length} un
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              Prontos: <strong className="text-[#007960] font-mono">{admItems.filter((x) => x.stockCondition === 'pronto_uso' || !x.stockCondition).length}</strong> • 
              P/ Recarga: <strong className="text-rose-600 font-mono">{admItems.filter((x) => x.stockCondition === 'aguardando_recarga').length}</strong>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              Cilindros prediais (AP 10L, Pó ABC 4kg, CO2 CPD)
            </p>
          </div>
        </div>
      </div>

      {/* Action Prompt if there are expired field units */}
      {expiredFieldUnits.length > 0 && readyUnits.length > 0 && (
        <div className="bg-red-50 border border-[#de2726]/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#de2726] shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Existem {expiredFieldUnits.length} extintor(es) vencido(s) no chão de fábrica e você possui {readyUnits.length} unidade(s) de reserva pronta nos almoxarifados!
              </span>
              <span className="text-slate-600">
                Execute a substituição agora para manter a conformidade do setor sem interrupção operacional.
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpenQuickSwap(expiredFieldUnits[0])}
            className="px-3.5 py-2 rounded-xl bg-[#de2726] hover:bg-[#c41f1e] text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Trocar Agora</span>
          </button>
        </div>
      )}

      {/* Warehouse Selector Filter Bar */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Warehouse Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-bold mr-1 flex items-center gap-1">
            <Warehouse className="w-3.5 h-3.5 text-[#007960]" />
            <span>Filtrar Almoxarifado:</span>
          </span>

          <button
            onClick={() => setSelectedWarehouse('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              selectedWarehouse === 'todos'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10'
            }`}
          >
            Todos os 3 Almoxarifados ({allWarehouseItems.length})
          </button>

          <button
            onClick={() => setSelectedWarehouse('almoxarifado_industria')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              selectedWarehouse === 'almoxarifado_industria'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Estoque da Indústria ({industriaItems.length})</span>
          </button>

          <button
            onClick={() => setSelectedWarehouse('almoxarifado_empacotamento')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              selectedWarehouse === 'almoxarifado_empacotamento'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Estoque do Empacotamento ({empacotamentoItems.length})</span>
          </button>

          <button
            onClick={() => setSelectedWarehouse('almoxarifado_adm')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              selectedWarehouse === 'almoxarifado_adm'
                ? 'bg-[#007960] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#007960] hover:bg-[#007960]/10'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Estoque do ADM ({admItems.length})</span>
          </button>
        </div>

        {/* Condition Filter & Order */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStockConditionFilter('todos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                stockConditionFilter === 'todos' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({currentWarehouseItems.length})
            </button>
            <button
              onClick={() => setStockConditionFilter('pronto_uso')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                stockConditionFilter === 'pronto_uso' ? 'bg-[#007960] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prontos ({readyUnits.length})
            </button>
            <button
              onClick={() => setStockConditionFilter('aguardando_recarga')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                stockConditionFilter === 'aguardando_recarga' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              P/ Recarga ({awaitingRecharge.length})
            </button>
            <button
              onClick={() => setStockConditionFilter('com_remessa')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                stockConditionFilter === 'com_remessa' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Com NF/Remessa ({unitsWithInvoice.length})
            </button>
          </div>

          {awaitingRecharge.length > 0 && (
            <button
              onClick={() => onPrintRechargeOrder(awaitingRecharge)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-rose-700 border border-rose-300 text-xs font-bold transition-colors shadow-2xs"
              title="Gerar Ordem de Coleta / Recarga para a empresa credenciada"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Emitir Ordem de Recarga ({awaitingRecharge.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stock Cards Grid with Dispatch Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedItems.map((ext) => {
          const typeInfo = TYPE_MAP[ext.type] || { acro: ext.type, name: ext.type };
          const condInfo = STOCK_CONDITION_MAP[ext.stockCondition || 'pronto_uso'];
          const sectorInfo = SECTOR_MAP[ext.sector] || { name: 'Almoxarifado', badgeBg: 'bg-slate-100 text-slate-700' };
          const isAwaiting = ext.stockCondition === 'aguardando_recarga';
          const deadlineStatus = getDeadlineStatus(ext.dispatchReturnDeadline, Boolean(ext.dispatchReturnInvoiceNumber));
          const hasInvoiceData = Boolean(ext.dispatchExitInvoiceNumber || ext.dispatchReturnInvoiceNumber || ext.dispatchInvoiceAttachmentName);

          return (
            <div
              key={ext.id}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xs ${
                isAwaiting ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-[#007960]/40'
              }`}
            >
              <div>
                {/* Header Tag + Warehouse Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-slate-900">{ext.code}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-700 font-bold">
                      {ext.capacityWeight}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${condInfo.badge}`}>
                    {condInfo.label}
                  </span>
                </div>

                {/* Warehouse Sector Label */}
                <div className="mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f8faf9] text-slate-700 border border-slate-200">
                    {sectorInfo.name}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 mb-1">
                  {typeInfo.name}
                </div>

                <p className="text-[11px] text-slate-600 mb-3">
                  Localização: <strong className="text-slate-800">{ext.locationDetails}</strong>
                </p>

                {/* Specs Box */}
                <div className="bg-[#f8faf9] p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px] font-mono mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Validade Recarga:</span>
                    <span className={isAwaiting ? 'text-rose-600 font-bold' : 'text-slate-900 font-semibold'}>
                      {formatDateBR(ext.rechargeExpiryDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Reteste (5 Anos):</span>
                    <span className="text-slate-700">{formatDateBR(ext.hydrostaticExpiryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Selo INMETRO:</span>
                    <span className="text-slate-700">{ext.inmetroSeal}</span>
                  </div>
                  {ext.supplierOrWorkshop && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-medium">Oficina Credenciada:</span>
                      <span className="text-slate-700 truncate max-w-[150px]">{ext.supplierOrWorkshop}</span>
                    </div>
                  )}
                  {ext.notes && (
                    <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 font-sans italic">
                      Obs: {ext.notes}
                    </div>
                  )}
                </div>

                {/* BOX OBRIGATÓRIO: CONTROLE DE NOTAS FISCAIS & REMESSA */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1 font-mono">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#007960]" />
                      <span>Controle de Remessa & NFs</span>
                    </span>
                    {deadlineStatus && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${deadlineStatus.color}`}>
                        {deadlineStatus.label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Nota de Saída:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {ext.dispatchExitInvoiceNumber ? ext.dispatchExitInvoiceNumber : '—'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Nota de Retorno:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {ext.dispatchReturnInvoiceNumber ? ext.dispatchReturnInvoiceNumber : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Prazo Retorno:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {ext.dispatchReturnDeadline ? formatDateBR(ext.dispatchReturnDeadline) : 'Não definido'}
                    </span>
                  </div>

                  {/* Anexo de Nota Fiscal */}
                  {ext.dispatchInvoiceAttachmentData && (
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <Paperclip className="w-3.5 h-3.5 text-[#007960] shrink-0" />
                        <span className="text-slate-800 font-medium truncate" title={ext.dispatchInvoiceAttachmentName}>
                          {ext.dispatchInvoiceAttachmentName || 'Nota_Fiscal.pdf'}
                        </span>
                      </div>
                      <a
                        href={ext.dispatchInvoiceAttachmentData}
                        download={ext.dispatchInvoiceAttachmentName || `NF_${ext.code}.pdf`}
                        className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-[#007960] border border-emerald-300 font-bold text-[10px] transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Baixar</span>
                      </a>
                    </div>
                  )}

                  {/* Botão para Preencher / Editar Notas */}
                  <button
                    onClick={() => handleOpenInvoiceModal(ext)}
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-white hover:bg-emerald-50 text-[#007960] hover:text-[#005a47] border border-[#007960]/30 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{hasInvoiceData ? 'Editar Notas / Anexo de Remessa' : '+ Preencher Notas e Prazo de Retorno'}</span>
                  </button>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Condition Switcher */}
                <select
                  value={ext.stockCondition || 'pronto_uso'}
                  onChange={(e) => onUpdateCondition(ext.id, e.target.value as StockCondition)}
                  className="bg-white border border-slate-300 text-slate-800 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none"
                >
                  <option value="pronto_uso">Pronto para Uso</option>
                  <option value="aguardando_recarga">Aguardando Recarga</option>
                  <option value="novo">Novo Lacrado</option>
                  <option value="em_manutencao">Em Manutenção</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPrintLabel(ext)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                    title="Imprimir Etiqueta"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onInspectExtinguisher(ext)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#007960] text-[#007960] hover:text-white border border-[#007960]/30 text-[11px] font-bold transition-colors"
                    title="Inspecionar"
                  >
                    Checar
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {displayedItems.length === 0 && (
          <div className="col-span-3 py-12 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-2xl">
            <Warehouse className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            Nenhum extintor encontrado neste almoxarifado com o filtro atual.
          </div>
        )}
      </div>

      {/* MODAL DE PREENCHIMENTO: NOTA DE SAÍDA, NOTA DE RETORNO, PRAZO PARA RETORNO, ANEXAR NOTA */}
      {isInvoiceModalOpen && editingExtForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#007960]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Controle de Remessa & Nota Fiscal
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Extintor {editingExtForInvoice.code} ({editingExtForInvoice.capacityWeight})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceInfo} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-slate-200 text-xs">
                <span className="text-slate-500 block">Setor de Estoque Atual:</span>
                <span className="font-bold text-slate-800">
                  {SECTOR_MAP[editingExtForInvoice.sector]?.name || 'Almoxarifado'} • {editingExtForInvoice.locationDetails}
                </span>
              </div>

              {/* 1. Nota de Saída */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota de Saída (Remessa p/ Recarga/Manutenção):
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 045921/2026"
                  value={exitInvoice}
                  onChange={(e) => setExitInvoice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Número da Nota Fiscal emitida para envio à empresa terceirizada credenciada.
                </span>
              </div>

              {/* 2. Prazo para Retorno */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Prazo Limite para Retorno:</span>
                </label>
                <input
                  type="date"
                  value={returnDeadline}
                  onChange={(e) => setReturnDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Data máxima acordada para entrega do extintor recarregado/retestado.
                </span>
              </div>

              {/* 3. Nota de Retorno */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota de Retorno (NF de Devolução):
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 046102/2026 (ou deixe em branco se pendente)"
                  value={returnInvoice}
                  onChange={(e) => setReturnInvoice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Preencher assim que a empresa terceirizada entregar o lote e a nota de retorno.
                </span>
              </div>

              {/* 4. Anexar Nota Fiscal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#007960]" />
                  <span>Anexar Nota Fiscal (PDF ou Imagem):</span>
                </label>
                
                {invoiceAttachmentData ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileCheck2 className="w-4 h-4 text-[#007960] shrink-0" />
                      <span className="font-bold text-slate-900 truncate">
                        {invoiceAttachmentName || 'Nota_Fiscal.pdf'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={invoiceAttachmentData}
                        download={invoiceAttachmentName || 'Nota_Fiscal.pdf'}
                        className="px-2 py-1 rounded bg-white text-[#007960] border border-emerald-300 text-[10px] font-bold"
                      >
                        Baixar
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceAttachmentName('');
                          setInvoiceAttachmentData('');
                        }}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50"
                        title="Remover anexo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-300 hover:border-[#007960] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#f8faf9]">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.xml"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-700 block">
                      Clique para anexar a Nota Fiscal
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Suporta PDF, JPG, PNG e XML (até 10MB)
                    </span>
                  </div>
                )}
              </div>

              {/* 5. Fornecedor / Oficina */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Empresa / Oficina Credenciada:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sul Brasil Extintores - Portaria Inmetro 005"
                  value={workshopSupplier}
                  onChange={(e) => setWorkshopSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              {/* 6. Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações da Remessa:
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções adicionais, selos ou detalhes da inspeção..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados da NF</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
