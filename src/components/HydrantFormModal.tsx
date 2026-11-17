import React, { useState, useEffect } from 'react';
import { X, Droplets, Save, ShieldCheck } from 'lucide-react';
import { Hydrant, HydrantSector, HydrantType, HoseType, HydrantStatus } from '../types/hydrant';

interface HydrantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hydrant: Hydrant) => void;
  editingHydrant: Hydrant | null;
  defaultSector?: HydrantSector;
}

export const HydrantFormModal: React.FC<HydrantFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHydrant,
  defaultSector = 'empacotamento',
}) => {
  const [code, setCode] = useState(editingHydrant?.code || `HID-NOVO-${Math.floor(Math.random() * 90 + 10)}`);
  const [sector, setSector] = useState<HydrantSector>(editingHydrant?.sector || defaultSector);
  const [locationDetails, setLocationDetails] = useState(editingHydrant?.locationDetails || '');
  const [type, setType] = useState<HydrantType>(editingHydrant?.type || 'coluna_dupla');
  const [cabinetNumber, setCabinetNumber] = useState(editingHydrant?.cabinetNumber || 'ABR-');
  const [hoseCount, setHoseCount] = useState(editingHydrant?.hoseCount || 2);
  const [hoseLengthMeters, setHoseLengthMeters] = useState(editingHydrant?.hoseLengthMeters || 15);
  const [hoseDiameterInches, setHoseDiameterInches] = useState(editingHydrant?.hoseDiameterInches || '2.1/2"');
  const [hoseType, setHoseType] = useState<HoseType>(editingHydrant?.hoseType || 'tipo_4_industrial_reforcada');
  const [hoseLastHydrostaticTest, setHoseLastHydrostaticTest] = useState(
    editingHydrant?.hoseLastHydrostaticTest || new Date().toISOString().split('T')[0]
  );
  const [hoseNextHydrostaticTest, setHoseNextHydrostaticTest] = useState(
    editingHydrant?.hoseNextHydrostaticTest ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [storzKeysCount, setStorzKeysCount] = useState(editingHydrant?.storzKeysCount || 2);
  const [nozzleType, setNozzleType] = useState(editingHydrant?.nozzleType || 'Esguicho Regulável 2.1/2"');
  const [hasFoamProportioner, setHasFoamProportioner] = useState(editingHydrant?.hasFoamProportioner || false);
  const [nominalPressureKgf, setNominalPressureKgf] = useState(editingHydrant?.nominalPressureKgf || 8.0);
  const [lastMeasuredPressureKgf, setLastMeasuredPressureKgf] = useState(
    editingHydrant?.lastMeasuredPressureKgf || 7.8
  );
  const [flowRateLpm, setFlowRateLpm] = useState(editingHydrant?.flowRateLpm || 850);
  const [hoseManufacturer, setHoseManufacturer] = useState(editingHydrant?.hoseManufacturer || 'RESIL');
  const [sealCertificateNumber, setSealCertificateNumber] = useState(editingHydrant?.sealCertificateNumber || '');
  const [testPressureKgf, setTestPressureKgf] = useState(editingHydrant?.testPressureKgf || 17.0);
  const [inspectionCertificateOS, setInspectionCertificateOS] = useState(editingHydrant?.inspectionCertificateOS || '');
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(editingHydrant?.certificatePdfUrl || '');
  const [status, setStatus] = useState<HydrantStatus>(editingHydrant?.status || 'operacional');
  const [notes, setNotes] = useState(editingHydrant?.notes || '');

  useEffect(() => {
    if (!isOpen) return;
    if (editingHydrant) {
      setCode(editingHydrant.code);
      setSector(editingHydrant.sector);
      setLocationDetails(editingHydrant.locationDetails);
      setType(editingHydrant.type);
      setCabinetNumber(editingHydrant.cabinetNumber || 'ABR-');
      setHoseCount(editingHydrant.hoseCount);
      setHoseLengthMeters(editingHydrant.hoseLengthMeters);
      setHoseDiameterInches(editingHydrant.hoseDiameterInches);
      setHoseType(editingHydrant.hoseType);
      setHoseLastHydrostaticTest(editingHydrant.hoseLastHydrostaticTest);
      setHoseNextHydrostaticTest(editingHydrant.hoseNextHydrostaticTest);
      setStorzKeysCount(editingHydrant.storzKeysCount);
      setNozzleType(editingHydrant.nozzleType);
      setHasFoamProportioner(Boolean(editingHydrant.hasFoamProportioner));
      setNominalPressureKgf(editingHydrant.nominalPressureKgf);
      setLastMeasuredPressureKgf(editingHydrant.lastMeasuredPressureKgf ?? 7.8);
      setFlowRateLpm(editingHydrant.flowRateLpm ?? 850);
      setHoseManufacturer(editingHydrant.hoseManufacturer || 'RESIL');
      setSealCertificateNumber(editingHydrant.sealCertificateNumber || '');
      setTestPressureKgf(editingHydrant.testPressureKgf || 17.0);
      setInspectionCertificateOS(editingHydrant.inspectionCertificateOS || '');
      setCertificatePdfUrl(editingHydrant.certificatePdfUrl || '');
      setStatus(editingHydrant.status);
      setNotes(editingHydrant.notes || '');
    } else {
      setCode(`HID-NOVO-${Math.floor(Math.random() * 90 + 10)}`);
      setSector(defaultSector);
      setLocationDetails('');
      setType('coluna_dupla');
      setCabinetNumber('ABR-');
      setHoseCount(2);
      setHoseLengthMeters(15);
      setHoseDiameterInches('2.1/2"');
      setHoseType('tipo_4_industrial_reforcada');
      setHoseLastHydrostaticTest(new Date().toISOString().split('T')[0]);
      setHoseNextHydrostaticTest(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStorzKeysCount(2);
      setNozzleType('Esguicho Regulável 2.1/2"');
      setHasFoamProportioner(false);
      setNominalPressureKgf(8.0);
      setLastMeasuredPressureKgf(7.8);
      setFlowRateLpm(850);
      setHoseManufacturer('RESIL');
      setSealCertificateNumber('');
      setTestPressureKgf(17.0);
      setInspectionCertificateOS('');
      setCertificatePdfUrl('');
      setStatus('operacional');
      setNotes('');
    }
  }, [isOpen, editingHydrant, defaultSector]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !locationDetails.trim()) {
      alert('Preencha o código/tag e a localização detalhada do hidrante.');
      return;
    }

    const saved: Hydrant = {
      id: editingHydrant?.id || `hid-${Date.now()}`,
      code: code.trim().toUpperCase(),
      sector,
      locationDetails: locationDetails.trim(),
      type,
      cabinetNumber: cabinetNumber.trim(),
      hoseCount: Number(hoseCount),
      hoseLengthMeters: Number(hoseLengthMeters),
      hoseDiameterInches,
      hoseType,
      hoseLastHydrostaticTest,
      hoseNextHydrostaticTest,
      storzKeysCount: Number(storzKeysCount),
      nozzleType: nozzleType.trim(),
      hasFoamProportioner,
      nominalPressureKgf: Number(nominalPressureKgf),
      lastMeasuredPressureKgf: Number(lastMeasuredPressureKgf),
      flowRateLpm: Number(flowRateLpm),
      hoseManufacturer: hoseManufacturer.trim() || undefined,
      sealCertificateNumber: sealCertificateNumber.trim() || undefined,
      testPressureKgf: Number(testPressureKgf) || undefined,
      inspectionCertificateOS: inspectionCertificateOS.trim() || undefined,
      certificatePdfUrl: certificatePdfUrl.trim() || undefined,
      status,
      notes: notes.trim(),
      inspections: editingHydrant?.inspections || [],
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#007960]/30 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 flex items-center justify-center text-[#007960] shadow-xs">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingHydrant ? `Editar Hidrante [${editingHydrant.code}]` : 'Cadastrar Novo Ponto de Hidrante'}
              </h3>
              <p className="text-xs text-slate-500">
                Rede de Combate a Incêndio em conformidade com ABNT NBR 13714 e NBR 11861
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tag / Código do Hidrante *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: HID-IND-07, HID-PST-01, HID-EMP-05"
                required
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Setor / Divisão *</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as HydrantSector)}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              >
                <option value="industria">Indústria (Destilaria, Caldeiras, Moenda)</option>
                <option value="empacotamento">Empacotamento (Silos, Ensaque, Armazém)</option>
                <option value="adm_agricola">ADM / Agrícola (Oficinas, Pátio, Prédio)</option>
                <option value="posto_combustivel">Posto de Combustíveis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Localização Detalhada *</label>
            <input
              type="text"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              placeholder="Ex: Posto de Combustíveis - Próximo à Descarga de Tanques"
              required
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tipo de Hidrante</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as HydrantType)}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              >
                <option value="coluna_dupla">Coluna Dupla 2.1/2"</option>
                <option value="coluna_simples">Coluna Simples</option>
                <option value="parede_embutido">Parede / Embutido</option>
                <option value="canhao_monitor">Canhão Monitor Fixo</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Identificação Abrigo</label>
              <input
                type="text"
                value={cabinetNumber}
                onChange={(e) => setCabinetNumber(e.target.value)}
                placeholder="Ex: ABR-01, ABR-PST-01"
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status Operacional</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as HydrantStatus)}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
              >
                <option value="operacional">Operacional (100% OK)</option>
                <option value="atencao">Atenção (Revisão)</option>
                <option value="em_manutencao">Em Manutenção</option>
                <option value="obstruido">Acesso Obstruído</option>
              </select>
            </div>
          </div>

          {/* Mangueiras e Conexões */}
          <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#007960]" />
              <span>Especificação de Mangueiras & Esguicho</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Qtd Lances</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={hoseCount}
                  onChange={(e) => setHoseCount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Comprimento (m)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={hoseLengthMeters}
                  onChange={(e) => setHoseLengthMeters(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Diâmetro</label>
                <select
                  value={hoseDiameterInches}
                  onChange={(e) => setHoseDiameterInches(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
                >
                  <option value='1.1/2"'>1.1/2" (38mm)</option>
                  <option value='2.1/2"'>2.1/2" (65mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Tipo de Mangueira</label>
                <select
                  value={hoseType}
                  onChange={(e) => setHoseType(e.target.value as HoseType)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
                >
                  <option value="tipo_4_industrial_reforcada">Tipo 4 - Industrial Reforçada</option>
                  <option value="tipo_2_comercial">Tipo 2 - Comercial</option>
                  <option value="tipo_1_residencial">Tipo 1 - Prédio ADM</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Último Teste Hidrostático (Mangueira)</label>
                <input
                  type="date"
                  value={hoseLastHydrostaticTest}
                  onChange={(e) => setHoseLastHydrostaticTest(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Próximo Teste (Anual NBR 11861)</label>
                <input
                  type="date"
                  value={hoseNextHydrostaticTest}
                  onChange={(e) => setHoseNextHydrostaticTest(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-bold"
                />
              </div>
            </div>

            {/* Certificado de Inspeção NBR 12779 (Sul Brasil / Garcias) */}
            <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2.5">
              <span className="text-[11px] font-bold text-[#007960] block">
                Dados do Certificado / Laudo de Ensaio Hidrostático (NBR 12779)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 mb-1">Fabricante Mangueira</label>
                  <input
                    type="text"
                    value={hoseManufacturer}
                    onChange={(e) => setHoseManufacturer(e.target.value)}
                    placeholder="Ex: RESIL, MOCELIM"
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Nº Lacre / Selo NBR</label>
                  <input
                    type="text"
                    value={sealCertificateNumber}
                    onChange={(e) => setSealCertificateNumber(e.target.value)}
                    placeholder="Ex: 002, 027"
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Pressão Ensaio (Kgf/cm²)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={testPressureKgf}
                    onChange={(e) => setTestPressureKgf(Number(e.target.value))}
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 mb-1">Nº Relatório / Laudo</label>
                  <input
                    type="text"
                    value={inspectionCertificateOS}
                    onChange={(e) => setInspectionCertificateOS(e.target.value)}
                    placeholder="Ex: 2316231718, 2316231726"
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Caminho / Link PDF Certificado</label>
                  <input
                    type="text"
                    value={certificatePdfUrl}
                    onChange={(e) => setCertificatePdfUrl(e.target.value)}
                    placeholder="Ex: /assets/aistudio/Empacotamento_76e32ab1.pdf"
                    className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1">Tipo de Esguicho</label>
                <input
                  type="text"
                  value={nozzleType}
                  onChange={(e) => setNozzleType(e.target.value)}
                  placeholder='Ex: Esguicho Regulável 2.1/2" Jato/Neblina'
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Chaves Storz</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={storzKeysCount}
                  onChange={(e) => setStorzKeysCount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="hasFoam"
                checked={hasFoamProportioner}
                onChange={(e) => setHasFoamProportioner(e.target.checked)}
                className="w-4 h-4 rounded text-[#007960] focus:ring-[#007960]"
              />
              <label htmlFor="hasFoam" className="text-slate-800 font-semibold cursor-pointer">
                Equipado com proporcionador de espuma LGE / canhão para etanol
              </label>
            </div>
          </div>

          {/* Dados Hidráulicos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Pressão Nominal (Kgf/cm²)</label>
              <input
                type="number"
                step="0.1"
                value={nominalPressureKgf}
                onChange={(e) => setNominalPressureKgf(Number(e.target.value))}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Última Medição (Kgf/cm²)</label>
              <input
                type="number"
                step="0.1"
                value={lastMeasuredPressureKgf}
                onChange={(e) => setLastMeasuredPressureKgf(Number(e.target.value))}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-[#007960]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Vazão Estimada (L/min)</label>
              <input
                type="number"
                step="10"
                value={flowRateLpm}
                onChange={(e) => setFlowRateLpm(Number(e.target.value))}
                className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Observações Técnicas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre válvula, abrigo, acesso, intervenções..."
              className="w-full bg-[#f8faf9] border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#007960] focus:border-[#007960] focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white font-bold transition-all shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Hidrante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
