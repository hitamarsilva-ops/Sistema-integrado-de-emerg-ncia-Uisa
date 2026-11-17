import React, { useState, useEffect } from 'react';
import {
  X,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Warehouse,
  ArrowRight,
  Flame,
  Scale,
  Factory,
  Boxes,
  Building2,
} from 'lucide-react';
import {
  Extinguisher,
  ExtinguisherSector,
  StockCondition,
} from '../types/extinguisher';
import {
  computeExtinguisherStatus,
  formatDateBR,
  isWarehouseSector,
  SECTOR_MAP,
  TYPE_MAP,
} from '../utils/formatters';
import { playIndustrialSound } from '../utils/audioAlerts';

interface QuickSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  extinguishers: Extinguisher[];
  preSelectedTargetExt?: Extinguisher;
  onExecuteSwap: (targetExtId: string, spareExtId: string, swapNotes: string, destinationWarehouse?: ExtinguisherSector) => void;
}

const getDefaultWarehouseForSector = (sector?: ExtinguisherSector): ExtinguisherSector => {
  if (sector === 'unidade_industrial') return 'almoxarifado_industria';
  if (sector === 'empacotamento') return 'almoxarifado_empacotamento';
  if (sector === 'adm') return 'almoxarifado_adm';
  return 'almoxarifado_industria';
};

export const QuickSwapModal: React.FC<QuickSwapModalProps> = ({
  isOpen,
  onClose,
  extinguishers,
  preSelectedTargetExt,
  onExecuteSwap,
}) => {
  // Extinguishers in field (not in warehouse) that can be swapped
  const fieldExtinguishers = extinguishers.filter((e) => !e.isStockInWarehouse && !isWarehouseSector(e.sector));

  // Ready spares available in any of the 3 warehouses
  const readySpares = extinguishers.filter(
    (e) => (e.isStockInWarehouse || isWarehouseSector(e.sector)) && (e.stockCondition === 'pronto_uso' || !e.stockCondition)
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    preSelectedTargetExt?.id || (fieldExtinguishers.length > 0 ? fieldExtinguishers[0].id : '')
  );
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<'todos' | ExtinguisherSector>('todos');
  const [destinationWarehouse, setDestinationWarehouse] = useState<ExtinguisherSector>(
    getDefaultWarehouseForSector(preSelectedTargetExt?.sector || fieldExtinguishers[0]?.sector)
  );
  const [selectedSpareId, setSelectedSpareId] = useState<string>(readySpares[0]?.id || '');
  const [swapNotes, setSwapNotes] = useState<string>('Substituição por vencimento de recarga anual.');

  const targetExt = extinguishers.find((e) => e.id === selectedTargetId);

  // Filter spares
  const filteredSpares = readySpares.filter((s) => {
    if (selectedWarehouseFilter !== 'todos') {
      return s.sector === selectedWarehouseFilter;
    }
    return true;
  });

  const matchingSpares = targetExt
    ? filteredSpares.filter((s) => s.type === targetExt.type && s.capacityWeight === targetExt.capacityWeight)
    : filteredSpares;

  useEffect(() => {
    if (!isOpen) return;
    const initialTarget =
      preSelectedTargetExt || (fieldExtinguishers.length > 0 ? fieldExtinguishers[0] : undefined);
    const nextTargetId = initialTarget?.id || '';
    setSelectedTargetId(nextTargetId);
    setSelectedWarehouseFilter('todos');
    setDestinationWarehouse(getDefaultWarehouseForSector(initialTarget?.sector));
    setSwapNotes('Substituição por vencimento de recarga anual.');

    const initialMatches = initialTarget
      ? readySpares.filter(
          (s) => s.type === initialTarget.type && s.capacityWeight === initialTarget.capacityWeight
        )
      : readySpares;
    setSelectedSpareId(
      initialMatches.length > 0 ? initialMatches[0].id : readySpares.length > 0 ? readySpares[0].id : ''
    );
  }, [isOpen, preSelectedTargetExt?.id]);

  // Keep selectedSpareId valid when warehouse filter or target changes
  useEffect(() => {
    if (!isOpen) return;
    const stillVisible = filteredSpares.some((s) => s.id === selectedSpareId);
    if (!stillVisible) {
      setSelectedSpareId(
        matchingSpares.length > 0
          ? matchingSpares[0].id
          : filteredSpares.length > 0
          ? filteredSpares[0].id
          : ''
      );
    }
  }, [isOpen, selectedWarehouseFilter, selectedTargetId]);

  if (!isOpen) return null;

  const spareExt = extinguishers.find((e) => e.id === selectedSpareId);

  const handleConfirm = () => {
    if (!targetExt || !spareExt) return;
    onExecuteSwap(targetExt.id, spareExt.id, swapNotes, destinationWarehouse);
    playIndustrialSound('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960]">
              <Repeat className="w-5 h-5 text-[#007960]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Troca Rápida de Extintor</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30 font-bold">
                  Substituição Operacional
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Substitua um extintor do setor por uma reserva dos almoxarifados (Indústria, Empacotamento ou ADM).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {readySpares.length === 0 ? (
            <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-[#de2726] mx-auto" />
              <h3 className="text-sm font-bold text-[#de2726]">Sem cilindros reservas disponíveis nos Almoxarifados!</h3>
              <p className="text-slate-700 text-xs">
                Todos os extintores dos estoques estão em uso ou aguardando recarga. Dê entrada em novos cilindros através do menu do Almoxarifado.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Select Field Extinguisher needing replacement */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  1. Selecione o Extintor a ser Retirado do Setor:
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedTargetId(newId);
                    const newTarget = extinguishers.find((x) => x.id === newId);
                    if (newTarget) {
                      const matchingWh =
                        newTarget.sector === 'unidade_industrial'
                          ? 'almoxarifado_industria'
                          : newTarget.sector === 'empacotamento'
                          ? 'almoxarifado_empacotamento'
                          : newTarget.sector === 'adm'
                          ? 'almoxarifado_adm'
                          : 'almoxarifado_industria';
                      setDestinationWarehouse(matchingWh);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
                >
                  {fieldExtinguishers.map((ext) => {
                    const st = computeExtinguisherStatus(ext);
                    const sec = SECTOR_MAP[ext.sector]?.name || ext.sector;
                    return (
                      <option key={ext.id} value={ext.id}>
                        [{ext.code}] - {sec} | {TYPE_MAP[ext.type]?.acro} {ext.capacityWeight} - ({st.label}) - {ext.locationDetails}
                      </option>
                    );
                  })}
                </select>

                {targetExt && (
                  <div className="mt-2 p-3 rounded-lg bg-[#f8faf9] border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Local Atual:</span>
                      <strong className="text-slate-900">{SECTOR_MAP[targetExt.sector]?.name}</strong> - {targetExt.locationDetails}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Validade:</span>
                      <span className="font-mono text-[#de2726] font-bold">{formatDateBR(targetExt.rechargeExpiryDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Select Warehouse Source & Replacement Spare */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-[#007960]" />
                    <span>2. Selecione o Cilindro Reserva do Almoxarifado:</span>
                  </label>

                  {/* Filter by warehouse */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedWarehouseFilter('todos')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        selectedWarehouseFilter === 'todos' ? 'bg-[#007960] text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWarehouseFilter('almoxarifado_industria')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        selectedWarehouseFilter === 'almoxarifado_industria' ? 'bg-[#007960] text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Indústria
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWarehouseFilter('almoxarifado_empacotamento')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        selectedWarehouseFilter === 'almoxarifado_empacotamento' ? 'bg-[#007960] text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Empacotamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWarehouseFilter('almoxarifado_adm')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        selectedWarehouseFilter === 'almoxarifado_adm' ? 'bg-[#007960] text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ADM
                    </button>
                  </div>
                </div>

                <select
                  value={selectedSpareId}
                  onChange={(e) => setSelectedSpareId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
                >
                  {filteredSpares.map((spare) => {
                    const isPerfectMatch = targetExt && spare.type === targetExt.type && spare.capacityWeight === targetExt.capacityWeight;
                    const whName = SECTOR_MAP[spare.sector]?.shortName || 'Estoque';
                    return (
                      <option key={spare.id} value={spare.id}>
                        {isPerfectMatch ? '★ [COMPATÍVEL RECOMENDADO] ' : ''}
                        [{whName}] [{spare.code}] {TYPE_MAP[spare.type]?.name} ({spare.capacityWeight}) - Validade: {formatDateBR(spare.rechargeExpiryDate)} - {spare.locationDetails}
                      </option>
                    );
                  })}
                </select>

                {spareExt && (
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-[#007960]/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#007960] block text-[10px] font-bold">Reserva Selecionada:</span>
                      <strong className="text-slate-900">{spareExt.code}</strong> - {TYPE_MAP[spareExt.type]?.name} ({spareExt.capacityWeight})
                      <span className="text-slate-500 block text-[10px]">Origem: {SECTOR_MAP[spareExt.sector]?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Validade da Nova Recarga:</span>
                      <span className="font-mono text-[#007960] font-bold">{formatDateBR(spareExt.rechargeExpiryDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Destination Warehouse for retired unit */}
              <div className="bg-[#f8faf9] p-3 rounded-xl border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">
                  3. Almoxarifado de Destino para o Extintor Retirado (Quarentena/Recarga):
                </label>
                <select
                  value={destinationWarehouse}
                  onChange={(e) => setDestinationWarehouse(e.target.value as ExtinguisherSector)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
                >
                  <option value="almoxarifado_industria">Estoque da Indústria (Almoxarifado Indústria)</option>
                  <option value="almoxarifado_empacotamento">Estoque do Empacotamento (Almoxarifado Empacotamento)</option>
                  <option value="almoxarifado_adm">Estoque do ADM (Almoxarifado ADM)</option>
                </select>
              </div>

              {/* Visual Swap Preview */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] border border-slate-200 flex items-center justify-between gap-3 text-center">
                <div className="flex-1 p-2.5 rounded-lg bg-red-50 border border-red-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[#de2726] block">Vai para Quarentena</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{targetExt?.code}</span>
                  <span className="text-[10px] text-slate-500 block">Destino: {SECTOR_MAP[destinationWarehouse]?.shortName}</span>
                </div>

                <div className="text-[#007960] flex flex-col items-center">
                  <Repeat className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-[9px] uppercase font-mono font-bold mt-0.5">Troca</span>
                </div>

                <div className="flex-1 p-2.5 rounded-lg bg-emerald-50 border border-[#007960]/30 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[#007960] block">Assume o Posto de Trabalho</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{spareExt?.code}</span>
                  <span className="text-[10px] text-slate-500 block">Setor: {targetExt ? SECTOR_MAP[targetExt.sector]?.name : ''}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Observações / Motivo da Ordem de Troca:
                </label>
                <input
                  type="text"
                  value={swapNotes}
                  onChange={(e) => setSwapNotes(e.target.value)}
                  placeholder="Ex: Extintor retirado para reteste quinquenal e recarga externa..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-[#f8faf9]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!targetExt || !spareExt || readySpares.length === 0}
            className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Efetuar Troca</span>
          </button>
        </div>
      </div>
    </div>
  );
};
