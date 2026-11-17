import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  ShieldAlert,
  Flame,
  Radio,
  Phone,
  Calendar,
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  Building2,
} from 'lucide-react';
import {
  BrigadeMember,
  BrigadeUnit,
  BrigadeShift,
  BrigadeRole,
  BrigadeStatus,
  TrainingLevel,
} from '../types/brigade';
import { BRIGADE_UNITS, BRIGADE_SHIFTS, ROLE_LABELS } from '../data/brigadeData';
import { playIndustrialSound } from '../utils/audioAlerts';

interface BrigadeMemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: BrigadeMember) => void;
  memberToEdit?: BrigadeMember | null;
  defaultUnit?: BrigadeUnit;
  defaultShift?: BrigadeShift;
}

export const BrigadeMemberFormModal: React.FC<BrigadeMemberFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
  defaultUnit = 'industria',
  defaultShift = 'turno_a',
}) => {
  const [formData, setFormData] = useState<Partial<BrigadeMember>>({
    name: '',
    registrationNumber: '',
    unit: defaultUnit,
    shift: defaultShift,
    role: 'brigadista',
    specificAssignment: '',
    phone: '',
    radioCallsign: '',
    trainingCertificationDate: new Date().toISOString().split('T')[0],
    trainingExpiryDate: '',
    medicalCheckDate: new Date().toISOString().split('T')[0],
    medicalExpiryDate: '',
    status: 'ativo_plantao',
    trainingLevel: 'intermediario',
    hasScbaTraining: false,
    bloodType: 'O+',
    ppeKits: ['Capacete Gallet', 'Nomex', 'Botas Combate', 'Rádio HT'],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        ...memberToEdit,
        ppeKits: memberToEdit.ppeKits || ['Capacete Gallet', 'Nomex', 'Botas Combate', 'Rádio HT'],
      });
    } else {
      // Calculate 1 year expiry by default
      const certDate = new Date();
      const expDate = new Date();
      expDate.setFullYear(certDate.getFullYear() + 1);

      setFormData({
        name: '',
        registrationNumber: `RE-${Math.floor(10000 + Math.random() * 90000)}`,
        unit: defaultUnit,
        shift: defaultShift,
        role: 'brigadista',
        specificAssignment: '',
        phone: 'Ramal 3737',
        radioCallsign: `BRIGADA-${defaultUnit.substring(0, 3).toUpperCase()}-01 (Canal 01)`,
        trainingCertificationDate: certDate.toISOString().split('T')[0],
        trainingExpiryDate: expDate.toISOString().split('T')[0],
        medicalCheckDate: certDate.toISOString().split('T')[0],
        medicalExpiryDate: expDate.toISOString().split('T')[0],
        status: 'ativo_plantao',
        trainingLevel: 'intermediario',
        hasScbaTraining: false,
        bloodType: 'O+',
        ppeKits: ['Capacete Gallet', 'Nomex', 'Botas Combate', 'Rádio HT'],
        notes: '',
      });
    }
    setErrors({});
  }, [memberToEdit, defaultUnit, defaultShift, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.registrationNumber?.trim()) newErrors.registrationNumber = 'Matrícula/RE é obrigatória';
    if (!formData.phone?.trim()) newErrors.phone = 'Telefone ou ramal é obrigatório';
    if (!formData.trainingCertificationDate) newErrors.trainingCertificationDate = 'Data de treinamento obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      playIndustrialSound('warning');
      return;
    }

    // Auto compute expiry if empty
    let expiry = formData.trainingExpiryDate;
    if (!expiry && formData.trainingCertificationDate) {
      const dt = new Date(formData.trainingCertificationDate);
      dt.setFullYear(dt.getFullYear() + 1);
      expiry = dt.toISOString().split('T')[0];
    }

    const memberToSave: BrigadeMember = {
      id: memberToEdit ? memberToEdit.id : `bm-${Date.now()}`,
      name: formData.name!.trim(),
      registrationNumber: formData.registrationNumber!.trim(),
      unit: formData.unit as BrigadeUnit,
      sector: formData.unit,
      shift: formData.shift as BrigadeShift,
      role: formData.role as BrigadeRole,
      specificAssignment: formData.specificAssignment?.trim() || '',
      phone: formData.phone!.trim(),
      radioCallsign: formData.radioCallsign?.trim() || 'Canal 01',
      trainingCertificationDate: formData.trainingCertificationDate!,
      trainingExpiryDate: expiry || '',
      medicalCheckDate: formData.medicalCheckDate || formData.trainingCertificationDate!,
      medicalExpiryDate: formData.medicalExpiryDate || '',
      status: (formData.status as BrigadeStatus) || 'ativo_plantao',
      trainingLevel: (formData.trainingLevel as TrainingLevel) || 'intermediario',
      hasScbaTraining: !!formData.hasScbaTraining,
      bloodType: formData.bloodType || 'O+',
      ppeKits: formData.ppeKits || [],
      notes: formData.notes?.trim() || '',
    };

    onSave(memberToSave);
    playIndustrialSound('success');
    onClose();
  };

  const handleTogglePPE = (ppe: string) => {
    const current = formData.ppeKits || [];
    if (current.includes(ppe)) {
      setFormData({ ...formData, ppeKits: current.filter((p) => p !== ppe) });
    } else {
      setFormData({ ...formData, ppeKits: [...current, ppe] });
    }
  };

  const ppeOptions = [
    'Capacete Gallet F1',
    'Capa e Calça Nomex',
    'Botas Combate Incêndio',
    'Rádio HT Motorola',
    'EPR Máscara Autônoma Scott',
    'Balaclava Anti-chamas',
    'Luvas de Vaqueta / Couro',
    'Óculos Ampla Visão',
    'Mochila APH Socorrista',
    'Lanterna Intrínseca',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007960]/10 border border-[#007960]/30 flex items-center justify-center text-[#007960]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {memberToEdit ? 'Editar Dados do Brigadista' : 'Cadastrar Novo Brigadista'}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-[#007960] border border-[#007960]/30 font-bold">
                  NR-23 / IT-17
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Alocação por turno de plantão, unidade operacional e função de emergência
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-white">
          {/* Section 1: Dados Pessoais & RE */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#007960]" />
              Identificação do Brigadista
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Nogueira"
                  className={`w-full px-3 py-2 bg-[#f8faf9] border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:border-[#007960] focus:ring-[#007960]'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-red-600 font-medium">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Matrícula / RE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber || ''}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="Ex: RE-10482"
                  className={`w-full px-3 py-2 bg-[#f8faf9] border rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                    errors.registrationNumber
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:border-[#007960] focus:ring-[#007960]'
                  }`}
                />
                {errors.registrationNumber && (
                  <p className="text-[10px] text-red-600 font-medium">{errors.registrationNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Unidade, Turno e Função */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#007960]" />
              Lotação Operacional & Escala de Revezamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unidade */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Unidade Operacional <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as BrigadeUnit })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                >
                  {Object.values(BRIGADE_UNITS).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  {BRIGADE_UNITS[formData.unit as BrigadeUnit]?.description}
                </p>
              </div>

              {/* Turno */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Turno de Trabalho <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value as BrigadeShift })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                >
                  {Object.values(BRIGADE_SHIFTS).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} • {s.hours}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  {BRIGADE_SHIFTS[formData.shift as BrigadeShift]?.scheduleDescription}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Função na Brigada */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Função na Brigada de Emergência <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as BrigadeRole })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                >
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status de Prontidão */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Status de Prontidão no Plantão
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BrigadeStatus })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                >
                  <option value="ativo_plantao">🟢 Em Plantão / Ativo no Turno</option>
                  <option value="folga">⚪ Folga de Escala (6x2 / 5x1)</option>
                  <option value="ferias">🟡 Em Férias</option>
                  <option value="afastado">🔴 Afastado / Atestado Médico</option>
                </select>
              </div>
            </div>

            {/* Atribuição Tática */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Atribuição Tática Específica (Posto de Emergência)
              </label>
              <input
                type="text"
                value={formData.specificAssignment || ''}
                onChange={(e) => setFormData({ ...formData, specificAssignment: e.target.value })}
                placeholder="Ex: Fechamento de Válvula Etanol Destilaria / Operador Canhão Monitor Tanques"
                className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960]"
              />
            </div>
          </div>

          {/* Section 3: Comunicação & Contatos */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#007960]" />
              Comunicação Tática & Contatos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Telefone / Ramal Interno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: Ramal 3737 / Cel (65) 99621-3011"
                  className={`w-full px-3 py-2 bg-[#f8faf9] border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                    errors.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:border-[#007960] focus:ring-[#007960]'
                  }`}
                />
                {errors.phone && <p className="text-[10px] text-red-600 font-medium">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Prefixo de Rádio HT & Canal
                </label>
                <input
                  type="text"
                  value={formData.radioCallsign || ''}
                  onChange={(e) => setFormData({ ...formData, radioCallsign: e.target.value })}
                  placeholder="Ex: LÍDER TURNO A (Canal 01)"
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Certificações & Saúde */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#007960]" />
              Certificação de Brigadista & Saúde Ocupacional (ASO)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nível de Formação
                </label>
                <select
                  value={formData.trainingLevel}
                  onChange={(e) => setFormData({ ...formData, trainingLevel: e.target.value as TrainingLevel })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                >
                  <option value="basico">Básico (NBR 14276)</option>
                  <option value="intermediario">Intermediário (Combate e Resgate)</option>
                  <option value="avancado">Avançado (Liderança / Químico / Espaço Confinado)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Data Conclusão Treinamento
                </label>
                <input
                  type="date"
                  value={formData.trainingCertificationDate || ''}
                  onChange={(e) => setFormData({ ...formData, trainingCertificationDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Validade da Certificação (Anual)
                </label>
                <input
                  type="date"
                  value={formData.trainingExpiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, trainingExpiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Data Exame Médico (ASO)
                </label>
                <input
                  type="date"
                  value={formData.medicalCheckDate || ''}
                  onChange={(e) => setFormData({ ...formData, medicalCheckDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Tipo Sanguíneo / Fator Rh
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#007960]"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="hasScbaTraining"
                  checked={!!formData.hasScbaTraining}
                  onChange={(e) => setFormData({ ...formData, hasScbaTraining: e.target.checked })}
                  className="w-4 h-4 rounded text-[#007960] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="hasScbaTraining" className="text-xs text-slate-700 select-none cursor-pointer font-medium">
                  Habilitado em EPR / Máscara Autônoma (Scott)
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: EPIs Vinculados */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              EPIs de Combate & Salvamento Vinculados
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ppeOptions.map((ppe) => {
                const checked = formData.ppeKits?.includes(ppe);
                return (
                  <button
                    key={ppe}
                    type="button"
                    onClick={() => handleTogglePPE(ppe)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors border ${
                      checked
                        ? 'bg-emerald-50 text-[#007960] border-[#007960]/50 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] ${
                        checked ? 'bg-[#007960] border-[#007960] text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && '✓'}
                    </div>
                    <span className="truncate">{ppe}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Observações */}
          <div className="space-y-1 pt-4 border-t border-slate-200">
            <label className="text-xs font-semibold text-slate-700">Observações Operacionais</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Treinado para operação de corte de alta tensão e resgate em altura..."
              className="w-full px-3 py-2 bg-[#f8faf9] border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007960]"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#007960] hover:bg-[#00604c] text-white text-xs font-bold transition-all shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{memberToEdit ? 'Salvar Alterações' : 'Cadastrar Brigadista'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
