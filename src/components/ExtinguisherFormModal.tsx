import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Save,
  Calendar,
  MapPin,
  Scale,
  ShieldCheck,
  Warehouse,
  CheckCircle2,
} from 'lucide-react';
import {
  Extinguisher,
  ExtinguisherSector,
  ExtinguisherType,
  StockCondition,
} from '../types/extinguisher';
import { SECTOR_MAP, TYPE_MAP } from '../utils/formatters';

interface ExtinguisherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (extinguisher: Extinguisher) => void;
  editingExtinguisher?: Extinguisher | null;
  defaultSector?: ExtinguisherSector;
  isAddingToWarehouse?: boolean;
}

export const ExtinguisherFormModal: React.FC<ExtinguisherFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExtinguisher,
  defaultSector = 'unidade_industrial',
  isAddingToWarehouse = false,
}) => {
  const [code, setCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [inmetroSeal, setInmetroSeal] = useState('');
  const [sector, setSector] = useState<ExtinguisherSector>(defaultSector);
  const [locationDetails, setLocationDetails] = useState('');
  const [type, setType] = useState<ExtinguisherType>('po_polivalente_abc');
  const [capacityWeight, setCapacityWeight] = useState('6kg');
  const [grossWeightRefKg, setGrossWeightRefKg] = useState<number | undefined>(undefined);
  const [currentWeightKg, setCurrentWeightKg] = useState<number | undefined>(undefined);
  const [rechargeDate, setRechargeDate] = useState('');
  const [rechargeExpiryDate, setRechargeExpiryDate] = useState('');
  const [hydrostaticTestDate, setHydrostaticTestDate] = useState('');
  const [hydrostaticExpiryDate, setHydrostaticExpiryDate] = useState('');
  const [isStockInWarehouse, setIsStockInWarehouse] = useState(isAddingToWarehouse);
  const [stockCondition, setStockCondition] = useState<StockCondition>('pronto_uso');
  const [notes, setNotes] = useState('');

  // Populate or reset form when opening
  useEffect(() => {
    if (editingExtinguisher) {
      setCode(editingExtinguisher.code);
      setSerialNumber(editingExtinguisher.serialNumber);
      setInmetroSeal(editingExtinguisher.inmetroSeal);
      setSector(editingExtinguisher.sector);
      setLocationDetails(editingExtinguisher.locationDetails);
      setType(editingExtinguisher.type);
      setCapacityWeight(editingExtinguisher.capacityWeight);
      setGrossWeightRefKg(editingExtinguisher.grossWeightRefKg);
      setCurrentWeightKg(editingExtinguisher.currentWeightKg);
      setRechargeDate(editingExtinguisher.rechargeDate);
      setRechargeExpiryDate(editingExtinguisher.rechargeExpiryDate);
      setHydrostaticTestDate(editingExtinguisher.hydrostaticTestDate);
      setHydrostaticExpiryDate(editingExtinguisher.hydrostaticExpiryDate);
      setIsStockInWarehouse(editingExtinguisher.isStockInWarehouse);
      setStockCondition(editingExtinguisher.stockCondition || 'pronto_uso');
      setNotes(editingExtinguisher.notes || '');
    } else {
      // Default new extinguisher
      const randomTagNum = Math.floor(10 + Math.random() * 90);
      const isWarehouse = isAddingToWarehouse || defaultSector.startsWith('almoxarifado');
      let defaultCode = `EXT-${randomTagNum}`;
      if (defaultSector === 'almoxarifado_industria') defaultCode = `EXT-EST-IND-${randomTagNum}`;
      else if (defaultSector === 'almoxarifado_empacotamento') defaultCode = `EXT-EST-EMP-${randomTagNum}`;
      else if (defaultSector === 'almoxarifado_adm') defaultCode = `EXT-EST-ADM-${randomTagNum}`;
      else if (isWarehouse) defaultCode = `EXT-ALM-${randomTagNum}`;

      setCode(defaultCode);
      setSerialNumber(`SN-${Math.floor(1000000 + Math.random() * 9000000)}-26`);
      setInmetroSeal(`INM-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setSector(defaultSector);

      let defaultLoc = '';
      if (defaultSector === 'almoxarifado_industria') defaultLoc = 'Rack Indústria - Prateleira 01 (Reserva Ativa)';
      else if (defaultSector === 'almoxarifado_empacotamento') defaultLoc = 'Armário Empacotamento - Prateleira 01';
      else if (defaultSector === 'almoxarifado_adm') defaultLoc = 'Depósito Predial ADM - Prateleira A-01';
      else if (isWarehouse) defaultLoc = 'Rack Almoxarifado - Prateleira 01';

      setLocationDetails(defaultLoc);
      setType('po_polivalente_abc');
      setCapacityWeight('6kg');
      setGrossWeightRefKg(undefined);
      setCurrentWeightKg(undefined);

      const today = new Date().toISOString().split('T')[0];
      setRechargeDate(today);

      // Default +1 year for recharge
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setRechargeExpiryDate(nextYear.toISOString().split('T')[0]);

      // Default +5 years for hydrostatic test
      setHydrostaticTestDate(today);
      const next5Years = new Date();
      next5Years.setFullYear(next5Years.getFullYear() + 5);
      setHydrostaticExpiryDate(next5Years.toISOString().split('T')[0]);

      setIsStockInWarehouse(isWarehouse);
      setStockCondition('pronto_uso');
      setNotes('');
    }
  }, [editingExtinguisher, isOpen, defaultSector, isAddingToWarehouse]);

  if (!isOpen) return null;

  // Auto-calc expiry when rechargeDate changes
  const handleRechargeDateChange = (val: string) => {
    setRechargeDate(val);
    if (val) {
      const d = new Date(val + 'T00:00:00');
      d.setFullYear(d.getFullYear() + 1);
      setRechargeExpiryDate(d.toISOString().split('T')[0]);
    }
  };

  // Auto-calc hydrostatic expiry when hydrostaticTestDate changes
  const handleHydrostaticDateChange = (val: string) => {
    setHydrostaticTestDate(val);
    if (val) {
      const d = new Date(val + 'T00:00:00');
      d.setFullYear(d.getFullYear() + 5);
      setHydrostaticExpiryDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !locationDetails.trim()) {
      alert('Por favor, preencha o Código/Tag e a Localização detalhada.');
      return;
    }

    const payload: Extinguisher = {
      id: editingExtinguisher ? editingExtinguisher.id : `ext-${Date.now()}`,
      code: code.trim().toUpperCase(),
      serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
      inmetroSeal: inmetroSeal.trim() || `INM-${Date.now().toString().slice(-8)}`,
      sector,
      locationDetails: locationDetails.trim(),
      type,
      capacityWeight,
      grossWeightRefKg: grossWeightRefKg ? Number(grossWeightRefKg) : undefined,
      currentWeightKg: currentWeightKg ? Number(currentWeightKg) : grossWeightRefKg,
      rechargeDate,
      rechargeExpiryDate,
      hydrostaticTestDate,
      hydrostaticExpiryDate,
      lastInspectionDate: editingExtinguisher?.lastInspectionDate || new Date().toISOString().split('T')[0],
      pressureGaugeOk: editingExtinguisher ? editingExtinguisher.pressureGaugeOk : true,
      sealIntact: editingExtinguisher ? editingExtinguisher.sealIntact : true,
      hoseNozzleOk: editingExtinguisher ? editingExtinguisher.hoseNozzleOk : true,
      signageOk: editingExtinguisher ? editingExtinguisher.signageOk : true,
      unobstructed: editingExtinguisher ? editingExtinguisher.unobstructed : true,
      isStockInWarehouse: sector === 'almoxarifado' ? true : isStockInWarehouse,
      stockCondition: isStockInWarehouse ? stockCondition : undefined,
      supplierOrWorkshop: editingExtinguisher?.supplierOrWorkshop,
      maintenanceOrder: editingExtinguisher?.maintenanceOrder,
      certificateNumber: editingExtinguisher?.certificateNumber,
      notes: notes.trim(),
      createdAt: editingExtinguisher?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inspectionHistory: editingExtinguisher?.inspectionHistory || [],
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960]">
              <Flame className="w-5 h-5 text-[#007960]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingExtinguisher ? 'Editar Extintor' : 'Cadastrar Novo Extintor'}
              </h2>
              <p className="text-xs text-slate-600">
                Cadastro técnico com controle de setor, tipo, peso e validade ABNT.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Code, Serial, Inmetro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Tag / Código do Extintor: *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: EXT-IND-05"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nº de Série do Cilindro:
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Ex: SN-4819201"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Selo INMETRO:
              </label>
              <input
                type="text"
                value={inmetroSeal}
                onChange={(e) => setInmetroSeal(e.target.value)}
                placeholder="Ex: INM-948172"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              />
            </div>
          </div>

          {/* Row 2: Setor e Localização Detalhada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Setor de Instalação: *
              </label>
              <select
                value={sector}
                onChange={(e) => {
                  const s = e.target.value as ExtinguisherSector;
                  setSector(s);
                  if (s.startsWith('almoxarifado')) {
                    setIsStockInWarehouse(true);
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960] font-medium"
              >
                <optgroup label="Setores Operacionais em Campo">
                  <option value="unidade_industrial">Unidade Industrial</option>
                  <option value="empacotamento">Empacotamento</option>
                  <option value="posto_combustivel">Posto de Combustível</option>
                  <option value="adm">Administração (ADM)</option>
                </optgroup>
                <optgroup label="Almoxarifados / Estoques de Reserva Técnica">
                  <option value="almoxarifado_industria">Estoque da Indústria (Almoxarifado Indústria)</option>
                  <option value="almoxarifado_empacotamento">Estoque do Empacotamento (Almoxarifado Empacotamento)</option>
                  <option value="almoxarifado_adm">Estoque do ADM (Almoxarifado ADM)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Ponto Exato / Local Instalado: *
              </label>
              <input
                type="text"
                required
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="Ex: Pilar 14 - Próximo à Caldeira 02"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              />
            </div>
          </div>

          {/* Row 3: Tipo do Agente e Carga / Peso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Tipo de Extintor (Agente Extintor): *
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as ExtinguisherType;
                  setType(t);
                  // auto set common weight
                  if (t === 'agua_pressurizada') setCapacityWeight('10L');
                  else if (t === 'espuma_mecanica') setCapacityWeight('10L');
                  else if (t === 'co2') setCapacityWeight('6kg');
                  else setCapacityWeight('6kg');
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
              >
                {Object.entries(TYPE_MAP).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name} - {info.agent}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Capacidade / Peso: *
              </label>
              <div className="flex gap-2">
                <select
                  value={capacityWeight}
                  onChange={(e) => setCapacityWeight(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
                >
                  <option value="2kg">2 kg</option>
                  <option value="4kg">4 kg</option>
                  <option value="6kg">6 kg (Padrão Industrial)</option>
                  <option value="8kg">8 kg</option>
                  <option value="10L">10 Litros (Água / Espuma)</option>
                  <option value="12kg">12 kg (Alta Capacidade)</option>
                  <option value="50L Carreta">50 Litros (Carreta sobre rodas)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Special Row: Weighing for CO2 */}
          {type === 'co2' && (
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-[#007960]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#007960] font-bold">
                <Scale className="w-4 h-4" />
                <span>Controle de Pesagem Obrigatório para CO2 (NBR 12962):</span>
              </div>
              <p className="text-[11px] text-slate-600">
                O extintor de CO2 não possui manômetro. A conferência é feita por balança (perda de massa &gt; 10% exige recarga).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 text-[11px] font-semibold mb-1">
                    Peso Bruto de Referência (kg com carga cheia):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={grossWeightRefKg ?? ''}
                    onChange={(e) => setGrossWeightRefKg(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 18.5"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:ring-2 focus:ring-[#007960]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[11px] font-semibold mb-1">
                    Peso Atual Medido (kg):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={currentWeightKg ?? ''}
                    onChange={(e) => setCurrentWeightKg(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 18.4"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:ring-2 focus:ring-[#007960]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Validade da Recarga & Reteste Hidrostático */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#f8faf9] border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block mb-1">Recarga Anual (12 Meses):</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5 font-medium">Data da Última Recarga:</label>
                  <input
                    type="date"
                    required
                    value={rechargeDate}
                    onChange={(e) => handleRechargeDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5 font-bold">
                    Data de Vencimento da Recarga (Validade): *
                  </label>
                  <input
                    type="date"
                    required
                    value={rechargeExpiryDate}
                    onChange={(e) => setRechargeExpiryDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-[#007960]"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-1">Teste Hidrostático (5 Anos):</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5 font-medium">Data do Último Reteste:</label>
                  <input
                    type="date"
                    required
                    value={hydrostaticTestDate}
                    onChange={(e) => handleHydrostaticDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5 font-medium">Vencimento do Reteste (5 Anos):</label>
                  <input
                    type="date"
                    required
                    value={hydrostaticExpiryDate}
                    onChange={(e) => setHydrostaticExpiryDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Almoxarifado Toggle */}
          <div className="p-3.5 rounded-xl bg-[#f8faf9] border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStockInWarehouse}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsStockInWarehouse(checked);
                    if (checked) {
                      setSector('almoxarifado');
                    }
                  }}
                  className="rounded border-slate-300 text-[#007960] focus:ring-[#007960]"
                />
                <span className="font-semibold text-slate-800">
                  Extintor Armazenado no Estoque do Almoxarifado (Reserva Técnica)
                </span>
              </label>

              {isStockInWarehouse && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#007960] border border-[#007960]/30 font-bold">
                  Estoque Almoxarifado
                </span>
              )}
            </div>

            {isStockInWarehouse && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-slate-600 text-[11px] font-semibold mb-1">
                  Condição do Estoque:
                </label>
                <select
                  value={stockCondition}
                  onChange={(e) => setStockCondition(e.target.value as StockCondition)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                >
                  <option value="pronto_uso">Pronto para Uso (Reserva Ativa de Troca)</option>
                  <option value="aguardando_recarga">Aguardando Coleta / Recarga Externa</option>
                  <option value="novo">Novo Lacrado em Quarentena</option>
                  <option value="em_manutencao">Em Manutenção Técnica</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Observações Técnicas / Fornecedor Credenciado:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Empresa de recarga ExtinChamas LTDA, suporte de parede OK..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007960]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Extintor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
