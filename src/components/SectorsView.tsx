import React, { useState, useMemo, useEffect } from 'react';
import {
  Factory,
  Boxes,
  Fuel,
  Building2,
  Warehouse,
  Plus,
  Flame,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Repeat,
  Printer,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Save,
  Layers,
  Wrench,
  Truck,
  Eye,
  Check,
  Calendar,
  AlertOctagon,
  ClipboardCheck,
  QrCode,
} from 'lucide-react';
import {
  Extinguisher,
  ExtinguisherSector,
} from '../types/extinguisher';
import { ActionPlanItem } from '../types/actionPlan';
import { ChecklistCompletionData } from './ChecklistCompletionModal';
import { SectorChecklistModal } from './SectorChecklistModal';
import {
  computeExtinguisherStatus,
  formatDateBR,
  isWarehouseSector,
  SECTOR_MAP,
  TYPE_MAP,
} from '../utils/formatters';

export interface CustomSector {
  id: string;
  name: string;
  shortName: string;
  description: string;
  parentUnit: 'unidade_industrial' | 'empacotamento' | 'posto_combustivel' | 'adm';
  color?: string;
}

interface SectorsViewProps {
  extinguishers: Extinguisher[];
  onInspectExtinguisher: (ext: Extinguisher) => void;
  onPrintLabel: (ext: Extinguisher) => void;
  onQuickSwap: (ext: Extinguisher) => void;
  onAddInSector: (sector: ExtinguisherSector) => void;
  onDeleteExtinguisher?: (id: string) => void;
  onOpenTechnicalCertificate?: () => void;
  onOpenPumpStationChecklist?: () => void;
  onSaveSectorChecklist?: (
    updatedList: Extinguisher[],
    newActionPlans: ActionPlanItem[],
    completionData: ChecklistCompletionData
  ) => void;
  isCreateSectorModalOpen?: boolean;
  onCloseCreateSectorModal?: () => void;
}

// Sub-setores oficiais registrados para cada uma das 4 unidades operacionais da UISA
export const UNIT_DEFAULT_SUBSECTORS: Record<
  'unidade_industrial' | 'empacotamento' | 'posto_combustivel' | 'adm',
  { id: string; name: string; tag: string; description: string }[]
> = {
  unidade_industrial: [
    { id: 'ind_destilaria', name: 'Destilaria', tag: 'DESTILARIA', description: 'Coluna de destilação, dornas de fermentação e tancagem de etanol' },
    { id: 'ind_caldeiras', name: 'Caldeiras & COGEN', tag: 'CALDEIRAS', description: 'Geradores de vapor, turbogeradores e subestação elétrica industrial' },
    { id: 'ind_moendas', name: 'Moendas & Preparo', tag: 'MOENDAS', description: 'Mesas alimentadoras, picadores, desfibradores e ternos de moenda' },
    { id: 'ind_tratamento', name: 'Tratamento de Caldo', tag: 'TRATAMENTO DE CALDO', description: 'Aquecedores, clarificadores, filtros rotativos e evaporadores' },
    { id: 'ind_fab_acucar', name: 'Fábrica de Açúcar', tag: 'FÁBRICA DE AÇÚCAR', description: 'Cozedores a vácuo, cristalizadores, centrífugas e secadores' },
    { id: 'ind_fab_levedura', name: 'Fábrica de Levedura', tag: 'FÁBRICA DE LEVEDURA', description: 'Centrífugas separadoras, secador spray dryer e empacotamento' },
    { id: 'ind_eta', name: 'ETA (Água Industrial)', tag: 'ETA', description: 'Estação de tratamento de água clarificada, desmineralizada e filtros' },
    { id: 'ind_etalg', name: 'ETALG (Vinhaça & Efluentes)', tag: 'ETALG', description: 'Lagoas de estabilização, bacias de vinhaça e canais de fertirrigação' },
    { id: 'ind_captacao', name: 'Captação de Água Bruta', tag: 'CAPTAÇÃO', description: 'Estação de bombas do manancial e adutoras industriais' },
    { id: 'ind_biolab', name: 'Centro de Tecnologia / Biolab', tag: 'CENTRO DE TECNOLOGIA', description: 'Laboratórios físico-químico, microbiológico e automação' },
    { id: 'ind_oficinas', name: 'Oficinas & Manutenção Central', tag: 'SETOR INDÚSTRIAL', description: 'Caldeiraria pesada, usinagem mecânica e elétrica central' },
  ],
  empacotamento: [
    { id: 'emp_silos', name: 'Silos de Açúcar & Alimentação', tag: 'SILO', description: 'Silos verticais de armazenamento a granel e roscas transportadoras' },
    { id: 'emp_linha_1kg', name: 'Linha 1kg (Embalagem)', tag: '1KG', description: 'Envasadoras automáticas, esteiras rolantes e empacotadoras' },
    { id: 'emp_linha_5kg', name: 'Linha 5kg (Fardos)', tag: '5KG', description: 'Enfardadeiras automáticas, balanças dinâmicas e túnel termoencolhível' },
    { id: 'emp_big_bags', name: 'Ensaque Big Bags (1.000kg)', tag: 'BIG BAG', description: 'Plataforma de enchimento de big bags e células de pesagem' },
    { id: 'emp_paletizadoras', name: 'Paletizadoras & Robôs', tag: 'PALETIZADORA', description: 'Células robotizadas de paletização e aplicadoras de stretch' },
    { id: 'emp_armazem_01', name: 'Armazém de Açúcar 01', tag: 'ARMAZÉM 01', description: 'Pátio coberto de estocagem de paletes prontos' },
    { id: 'emp_armazem_02', name: 'Armazém de Açúcar 02', tag: 'ARMAZÉM 02', description: 'Área climatizada e estocagem de fardos e big bags' },
    { id: 'emp_docas', name: 'Docas de Carregamento', tag: 'DOCA', description: 'Rampas de expedição, niveladoras e carregamento de carretas' },
  ],
  posto_combustivel: [
    { id: 'pos_pista_diesel', name: 'Pista Diesel (S10 / S500)', tag: 'DIESEL', description: 'Bombas de alta vazão para abastecimento de frotas e caminhões canavieiros' },
    { id: 'pos_tanques', name: 'Tanques Subterrâneos', tag: 'TANQUE', description: 'Bacias de contenção, bocas de descarga seladas e respiros antichama' },
    { id: 'pos_gasolina_etanol', name: 'Bombas Gasolina & Etanol', tag: 'GASOLINA', description: 'Abastecimento de utilitários, vans e veículos leves da usina' },
    { id: 'pos_comboios', name: 'Pista Comboios Agrícolas', tag: 'COMBOIO', description: 'Área de carregamento de caminhões comboio de lubrificação/abastecimento de campo' },
    { id: 'pos_oficina_lub', name: 'Oficina / Troca de Óleo', tag: 'OFICINA', description: 'Armazenamento de tambores de lubrificantes e descarte de filtros' },
    { id: 'pos_escritorio', name: 'Escritório de Controle & Faturamento', tag: 'ESCRITÓRIO', description: 'Automação de abastecimento, computadores e arquivos fiscais' },
  ],
  adm: [
    { id: 'adm_central', name: 'Prédio Administrativo Central', tag: 'ADMINISTRATIVO', description: 'Diretoria, gerências, controladoria, RH e salas de reunião' },
    { id: 'adm_cpd', name: 'Data Center & CPD Central', tag: 'CPD', description: 'Racks de servidores, no-breaks industriais e infraestrutura de TI (proteção CO2)' },
    { id: 'adm_ambulatorio', name: 'Ambulatório Médico Ocupacional', tag: 'AMBULATÓRIO', description: 'Consultórios, enfermagem ocupacional e sala de emergência' },
    { id: 'adm_sesmt', name: 'SESMT & Segurança do Trabalho', tag: 'SESMT', description: 'Base operacional dos técnicos de segurança e sala de treinamentos' },
    { id: 'adm_almoxarifado', name: 'Almoxarifado Central GMA', tag: 'ALMOXARIFADO', description: 'Depósito de peças de reposição, EPIs e suprimentos gerais' },
    { id: 'adm_refeitorio', name: 'Refeitório & Cozinha Industrial', tag: 'REFEITÓRIO', description: 'Salão de refeições, coifas, câmaras frias e área de cocção' },
    { id: 'adm_portaria', name: 'Portaria Principal & Balança', tag: 'PORTARIA', description: 'Guarita de controle de acesso de veículos e balança rodoviária de carretas' },
  ],
};

const STORAGE_KEY_CUSTOM_SECTORS = 'sge_desktop_custom_sectors_uisa_v2';
const STORAGE_KEY_SECTOR_OVERRIDES = 'sge_desktop_sector_name_overrides_v2';

export const SectorsView: React.FC<SectorsViewProps> = ({
  extinguishers,
  onInspectExtinguisher,
  onPrintLabel,
  onQuickSwap,
  onAddInSector,
  onDeleteExtinguisher,
  onOpenTechnicalCertificate,
  onOpenPumpStationChecklist,
  onSaveSectorChecklist,
  isCreateSectorModalOpen = false,
  onCloseCreateSectorModal,
}) => {
  // 4 Unidades Operacionais Principais
  const [activeUnit, setActiveUnit] = useState<'unidade_industrial' | 'empacotamento' | 'posto_combustivel' | 'adm'>('unidade_industrial');
  
  // Sub-setor selecionado dentro da unidade (ou 'TODOS')
  const [selectedSubSector, setSelectedSubSector] = useState<string>('TODOS');
  
  // Função/Filtro de Saúde clicada: 'todos' | 'valido' | 'atencao' | 'vencido'
  const [statusFilterCondition, setStatusFilterCondition] = useState<'todos' | 'valido' | 'atencao' | 'vencido'>('todos');
  
  const [sectorSearch, setSectorSearch] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(40);

  // Modal de ação ao clicar no nome do setor e Modal de Checklist do Setor
  const [sectorActionTarget, setSectorActionTarget] = useState<{
    id: string;
    name: string;
    description: string;
    items: Extinguisher[];
  } | null>(null);
  const [sectorChecklistTarget, setSectorChecklistTarget] = useState<{
    name: string;
    items: Extinguisher[];
  } | null>(null);

  // Custom sectors state
  const [customSectors, setCustomSectors] = useState<CustomSector[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_SECTORS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Sector name overrides
  const [sectorOverrides, setSectorOverrides] = useState<Record<string, { name: string; shortName: string; description: string }>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SECTOR_OVERRIDES);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_SECTORS, JSON.stringify(customSectors));
    } catch (e) {
      console.error('Erro ao salvar setores customizados:', e);
    }
  }, [customSectors]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SECTOR_OVERRIDES, JSON.stringify(sectorOverrides));
    } catch (e) {
      console.error('Erro ao salvar renomeações de setores:', e);
    }
  }, [sectorOverrides]);

  // Modals state for sector creation and editing
  const [internalCreateSectorOpen, setInternalCreateSectorOpen] = useState(false);
  const isCreateModalVisible = isCreateSectorModalOpen || internalCreateSectorOpen;

  const [isEditSectorOpen, setIsEditSectorOpen] = useState(false);

  // New sector form
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorShortName, setNewSectorShortName] = useState('');
  const [newSectorDescription, setNewSectorDescription] = useState('');
  const [newSectorUnit, setNewSectorUnit] = useState<'unidade_industrial' | 'empacotamento' | 'posto_combustivel' | 'adm'>('unidade_industrial');

  // Edit sector form
  const [editSectorName, setEditSectorName] = useState('');
  const [editSectorShortName, setEditSectorShortName] = useState('');
  const [editSectorDescription, setEditSectorDescription] = useState('');

  // Sincroniza a unidade ao abrir modal de cadastro
  useEffect(() => {
    setNewSectorUnit(activeUnit);
  }, [activeUnit]);

  const getUnitIcon = (unitKey: string) => {
    switch (unitKey) {
      case 'unidade_industrial':
        return <Factory className="w-5 h-5 text-[#007960]" />;
      case 'empacotamento':
        return <Boxes className="w-5 h-5 text-[#007960]" />;
      case 'posto_combustivel':
        return <Fuel className="w-5 h-5 text-[#007960]" />;
      case 'adm':
        return <Building2 className="w-5 h-5 text-[#007960]" />;
      default:
        return <Building2 className="w-5 h-5 text-[#007960]" />;
    }
  };

  // Helper to resolve unit info
  const getUnitDisplayInfo = (unitKey: string) => {
    const override = sectorOverrides[unitKey];
    if (override) {
      return {
        name: override.name,
        shortName: override.shortName,
        description: override.description,
      };
    }
    const standard = SECTOR_MAP[unitKey as ExtinguisherSector];
    if (standard) {
      return {
        name: standard.name,
        shortName: standard.shortName,
        description: standard.description,
      };
    }
    return {
      name: 'Unidade Operacional',
      shortName: 'Unidade',
      description: 'Área da UISA',
    };
  };

  const currentUnitInfo = getUnitDisplayInfo(activeUnit);

  // Extintores pertencentes à unidade ativa
  const unitExtinguishers = useMemo(() => {
    return extinguishers.filter((e) => e.sector === activeUnit);
  }, [extinguishers, activeUnit]);

  // Lista combinada de todos os setores registrados para a unidade ativa:
  // Sub-setores padrão + Setores Customizados + Setores dinâmicos encontrados nos extintores importados/cadastrados
  const registeredSubSectors = useMemo(() => {
    const defaults = UNIT_DEFAULT_SUBSECTORS[activeUnit] || [];
    const customs = customSectors
      .filter((c) => c.parentUnit === activeUnit || !c.parentUnit)
      .map((c) => ({
        id: c.id,
        name: c.name,
        tag: c.shortName.toUpperCase(),
        description: c.description,
      }));

    const baseList = [...defaults, ...customs];
    const unmatchedLocs = new Map<string, number>();

    unitExtinguishers.forEach((ext) => {
      const locRaw = (ext.locationDetails || '').trim();
      const locUpper = locRaw.toUpperCase();
      const matched = baseList.some(
        (s) => locUpper.includes(s.tag.toUpperCase()) || locUpper.includes(s.name.toUpperCase())
      );
      if (!matched) {
        const fallbackName = locRaw || 'Localidade Geral';
        unmatchedLocs.set(fallbackName, (unmatchedLocs.get(fallbackName) || 0) + 1);
      }
    });

    const dynamicList = Array.from(unmatchedLocs.keys()).map((locName, idx) => ({
      id: `dyn_sec_${idx}_${locName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: locName,
      tag: locName.toUpperCase(),
      description: `Setor / ponto operacional cadastrado em ${currentUnitInfo.shortName}`,
      isDynamic: true,
    }));

    return [...baseList, ...dynamicList];
  }, [activeUnit, customSectors, unitExtinguishers, currentUnitInfo.shortName]);

  // Helper para encontrar a qual setor um extintor pertence
  const resolveExtinguisherSector = (ext: Extinguisher) => {
    const locRaw = (ext.locationDetails || '').trim();
    const locUpper = locRaw.toUpperCase();
    const found = registeredSubSectors.find(
      (s) => locUpper.includes(s.tag.toUpperCase()) || locUpper.includes(s.name.toUpperCase())
    );
    if (found) return found;
    return {
      id: 'outros_setores',
      name: locRaw || 'Localidade Geral',
      tag: (locRaw || 'GERAL').toUpperCase(),
      description: 'Outros pontos da unidade',
    };
  };

  // Extintores filtrados pelo sub-setor selecionado
  const subSectorFilteredExtinguishers = useMemo(() => {
    if (selectedSubSector === 'TODOS') return unitExtinguishers;

    const targetSec = registeredSubSectors.find((s) => s.id === selectedSubSector);
    if (!targetSec) return unitExtinguishers;

    return unitExtinguishers.filter((e) => {
      const loc = (e.locationDetails || '').trim().toUpperCase();
      return loc.includes(targetSec.tag.toUpperCase()) || loc.includes(targetSec.name.toUpperCase()) || loc === targetSec.name.toUpperCase();
    });
  }, [unitExtinguishers, selectedSubSector, registeredSubSectors]);

  // Status de saúde dos extintores na unidade ativa
  const validInUnit = useMemo(
    () => unitExtinguishers.filter((e) => computeExtinguisherStatus(e).status === 'valido'),
    [unitExtinguishers]
  );
  const warningInUnit = useMemo(
    () => unitExtinguishers.filter((e) => computeExtinguisherStatus(e).status === 'atencao'),
    [unitExtinguishers]
  );
  const expiredInUnit = useMemo(
    () => unitExtinguishers.filter((e) => computeExtinguisherStatus(e).status === 'vencido'),
    [unitExtinguishers]
  );

  // Extintores filtrados pela função de saúde clicada (Em Conformidade, A Vencer, Recarga Vencida)
  const healthFilteredExtinguishers = useMemo(() => {
    if (statusFilterCondition === 'todos') return subSectorFilteredExtinguishers;
    return subSectorFilteredExtinguishers.filter((e) => {
      const st = computeExtinguisherStatus(e).status;
      return st === statusFilterCondition;
    });
  }, [subSectorFilteredExtinguishers, statusFilterCondition]);

  // Filtragem final incluindo busca por tag, localização ou tipo
  const finalExtinguishers = useMemo(() => {
    if (!sectorSearch.trim()) return healthFilteredExtinguishers;
    const q = sectorSearch.toLowerCase();
    return healthFilteredExtinguishers.filter((ext) => {
      const mCode = ext.code.toLowerCase().includes(q);
      const mLoc = (ext.locationDetails || '').toLowerCase();
      const mSeal = (ext.inmetroSeal || '').toLowerCase();
      const mType = TYPE_MAP[ext.type]?.name.toLowerCase().includes(q);
      return mCode || mLoc.includes(q) || mSeal.includes(q) || mType;
    });
  }, [healthFilteredExtinguishers, sectorSearch]);

  // Agrupamento dos extintores filtrados por Local/Setor para exibição destacada
  const groupedByLocation = useMemo(() => {
    const map = new Map<string, Extinguisher[]>();
    finalExtinguishers.forEach((ext) => {
      const locKey = ext.locationDetails?.trim() || 'Localidade Geral';
      if (!map.has(locKey)) {
        map.set(locKey, []);
      }
      map.get(locKey)!.push(ext);
    });
    return Array.from(map.entries());
  }, [finalExtinguishers]);

  // Separação oficial dos extintores exibidos por Setor
  const groupedBySector = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; description: string; items: Extinguisher[]; allUnitSectorItems: Extinguisher[] }
    >();

    finalExtinguishers.forEach((ext) => {
      const sec = resolveExtinguisherSector(ext);
      if (!map.has(sec.id)) {
        const allSectorItems = unitExtinguishers.filter((uExt) => {
          const loc = (uExt.locationDetails || '').trim().toUpperCase();
          return loc.includes(sec.tag.toUpperCase()) || loc.includes(sec.name.toUpperCase()) || loc === sec.name.toUpperCase();
        });
        map.set(sec.id, {
          id: sec.id,
          name: sec.name,
          description: sec.description,
          items: [],
          allUnitSectorItems: allSectorItems.length > 0 ? allSectorItems : [ext],
        });
      }
      map.get(sec.id)!.items.push(ext);
    });

    return Array.from(map.values());
  }, [finalExtinguishers, unitExtinguishers, registeredSubSectors]);

  // Criação de Novo Setor
  const handleCreateSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim() || !newSectorShortName.trim()) return;

    const newId = `setor_${newSectorShortName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newSec: CustomSector = {
      id: newId,
      name: newSectorName.trim(),
      shortName: newSectorShortName.trim(),
      description: newSectorDescription.trim() || `Setor operacional ${newSectorName.trim()} da UISA.`,
      parentUnit: newSectorUnit,
      color: '#007960',
    };

    setCustomSectors((prev) => [...prev, newSec]);
    setActiveUnit(newSectorUnit);
    setSelectedSubSector(newId);
    setNewSectorName('');
    setNewSectorShortName('');
    setNewSectorDescription('');
    setInternalCreateSectorOpen(false);
    if (onCloseCreateSectorModal) onCloseCreateSectorModal();
  };

  // Salvar Edição do Nome do Setor
  const handleSaveEditSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSectorName.trim() || !editSectorShortName.trim()) return;

    setSectorOverrides((prev) => ({
      ...prev,
      [activeUnit]: {
        name: editSectorName.trim(),
        shortName: editSectorShortName.trim(),
        description: editSectorDescription.trim(),
      },
    }));

    setIsEditSectorOpen(false);
  };

  const handleOpenEditSector = () => {
    setEditSectorName(currentUnitInfo.name);
    setEditSectorShortName(currentUnitInfo.shortName);
    setEditSectorDescription(currentUnitInfo.description);
    setIsEditSectorOpen(true);
  };

  // Toggle da função de saúde para abrir o local/setor
  const handleToggleHealthFilter = (target: 'valido' | 'atencao' | 'vencido') => {
    if (statusFilterCondition === target) {
      setStatusFilterCondition('todos');
    } else {
      setStatusFilterCondition(target);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 4 UNIDADES OPERACIONAIS PRINCIPAIS (Indústria, Empacotamento, Posto, ADM/GMA) */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#007960] font-mono px-2 py-0.5 rounded bg-emerald-50 border border-[#007960]/30">
                Divisões Operacionais UISA
              </span>
              <span className="text-xs text-slate-500">Selecione uma das 4 unidades operacionais</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Gestão de Setores por Unidade Operacional
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const allOperational = extinguishers.filter(
                  (e) => !e.isStockInWarehouse && !isWarehouseSector(e.sector)
                );
                setSectorChecklistTarget({
                  name: 'Todos os Extintores Cadastrados (Planta Completa)',
                  items: allOperational,
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-[#007960] text-[#007960] hover:text-white border border-[#007960]/40 text-xs font-bold shadow-2xs transition-colors"
              title="Realizar checklist completo exigindo leitura de QR Code de todos os extintores cadastrados"
            >
              <QrCode className="w-4 h-4" />
              <span>
                Checklist Geral c/ QR ({extinguishers.filter((e) => !e.isStockInWarehouse && !isWarehouseSector(e.sector)).length} cadastrados)
              </span>
            </button>

            <button
              onClick={() => {
                setNewSectorUnit(activeUnit);
                setInternalCreateSectorOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Setor nesta Unidade</span>
            </button>
          </div>
        </div>

        {/* 4 Botões/Cards das Unidades */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {(['unidade_industrial', 'empacotamento', 'posto_combustivel', 'adm'] as const).map((unitKey) => {
            const isSelected = activeUnit === unitKey;
            const info = getUnitDisplayInfo(unitKey);
            const totalExts = extinguishers.filter((e) => e.sector === unitKey).length;
            const hasExpired = extinguishers.some((e) => e.sector === unitKey && computeExtinguisherStatus(e).status === 'vencido');

            return (
              <button
                key={unitKey}
                onClick={() => {
                  setActiveUnit(unitKey);
                  setSelectedSubSector('TODOS');
                  setStatusFilterCondition('todos');
                  setVisibleCount(40);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-white border-[#007960] shadow-md ring-2 ring-[#007960]/40'
                    : 'bg-[#fcfdfc] border-slate-200 hover:border-[#007960]/50 hover:bg-emerald-50/20'
                }`}
              >
                {hasExpired && (
                  <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5" title="Contém extintor com recarga vencida">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#de2726] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#de2726]"></span>
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-xl border ${isSelected ? 'bg-emerald-50 border-[#007960]/30 text-[#007960]' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                    {getUnitIcon(unitKey)}
                  </div>
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {info.shortName}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-mono font-bold text-slate-900">{totalExts}</span>
                  <span className="text-[10px] text-slate-500 font-medium">extintores</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PAINEL DA UNIDADE SELECIONADA: ABRE TODOS OS SETORES CADASTRADOS NAQUELA UNIDADE */}
      <div className="bg-white border border-[#007960]/20 rounded-2xl p-5 md:p-6 space-y-5 shadow-sm">
        {/* Cabeçalho da Unidade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960]">
              {getUnitIcon(activeUnit)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{currentUnitInfo.name}</h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#007960] border border-[#007960]/30 font-mono">
                  {unitExtinguishers.length} extintores instalados
                </span>
                <button
                  onClick={handleOpenEditSector}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-[#007960] hover:bg-[#007960]/10 border border-slate-200 flex items-center gap-1 transition-colors"
                  title="Editar Nome e Descrição da Unidade"
                >
                  <Edit2 className="w-3 h-3 text-[#007960]" />
                  <span>Editar Nome</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{currentUnitInfo.description}</p>
            </div>
          </div>
        </div>

        {/* SETORES CADASTRADOS NA UNIDADE SELECIONADA */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-[#007960]" />
              <span>Setores Cadastrados em {currentUnitInfo.shortName} ({registeredSubSectors.length}):</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedSubSector('TODOS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedSubSector === 'TODOS'
                    ? 'bg-[#007960] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos os Setores ({unitExtinguishers.length})
              </button>
            </div>
          </div>

          {/* Grid com Todos os Setores Cadastrados naquela Unidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {registeredSubSectors.map((subSec) => {
              const isSecSelected = selectedSubSector === subSec.id;
              // Contagem de extintores neste sub-setor
              const extsInSub = unitExtinguishers.filter((e) => {
                const loc = (e.locationDetails || '').trim().toUpperCase();
                return loc.includes(subSec.tag.toUpperCase()) || loc.includes(subSec.name.toUpperCase()) || loc === subSec.name.toUpperCase();
              });
              const hasExpired = extsInSub.some((e) => computeExtinguisherStatus(e).status === 'vencido');
              const hasWarning = extsInSub.some((e) => computeExtinguisherStatus(e).status === 'atencao');

              return (
                <div
                  key={subSec.id}
                  onClick={() =>
                    setSectorActionTarget({
                      id: subSec.id,
                      name: subSec.name,
                      description: subSec.description,
                      items: extsInSub,
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSectorActionTarget({
                        id: subSec.id,
                        name: subSec.name,
                        description: subSec.description,
                        items: extsInSub,
                      });
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer group ${
                    isSecSelected
                      ? 'bg-emerald-50/70 border-[#007960] ring-2 ring-[#007960]/30 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-[#007960]/50 hover:bg-[#f8faf9]'
                  }`}
                  title={`Clique no setor "${subSec.name}" para realizar o checklist ou filtrar`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#007960] group-hover:underline truncate block">
                      {subSec.name}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      isSecSelected ? 'bg-[#007960] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {extsInSub.length} un
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{subSec.description}</p>
                  
                  {/* Status Badges e ação rápida de Checklist no sub-setor */}
                  <div className="flex items-center justify-between gap-1.5 mt-2">
                    <div className="flex items-center gap-1">
                      {hasExpired && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-[#de2726] border border-red-200 flex items-center gap-0.5">
                          <AlertOctagon className="w-2.5 h-2.5" />
                          <span>Vencido</span>
                        </span>
                      )}
                      {hasWarning && !hasExpired && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>&lt;30d</span>
                        </span>
                      )}
                      {!hasExpired && !hasWarning && extsInSub.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-[#007960]">
                          100% Conforme
                        </span>
                      )}
                      {extsInSub.length === 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
                          Sem itens
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-[#007960] flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                      <ClipboardCheck className="w-3 h-3" />
                      <span>Checklist</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARDS INTERATIVOS DE STATUS DE SAÚDE (Em Conformidade, A Vencer (<30d), Recarga Vencida) */}
        {/* AO CLICAR NA FUNÇÃO, ABRE O LOCAL/SETOR DE INSTALAÇÃO */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Indicadores de Conformidade (Clique para abrir e detalhar Local/Setor):
            </span>
            {statusFilterCondition !== 'todos' && (
              <button
                onClick={() => setStatusFilterCondition('todos')}
                className="text-[11px] font-bold text-[#007960] hover:underline flex items-center gap-1"
              >
                <span>Mostrar Todos ({subSectorFilteredExtinguishers.length})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Em Conformidade */}
            <button
              onClick={() => handleToggleHealthFilter('valido')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilterCondition === 'valido'
                  ? 'bg-emerald-50/80 border-[#007960] ring-2 ring-[#007960]/40 shadow-xs'
                  : 'bg-[#f8faf9] border-[#007960]/20 hover:border-[#007960]/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#007960]" />
                  <span>Em Conformidade:</span>
                </span>
                <span className="text-base font-mono font-bold text-[#007960]">
                  {validInUnit.length} un
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {statusFilterCondition === 'valido'
                  ? '● Filtrado: Exibindo locais/setores conformes abaixo'
                  : 'Clique para abrir todos os locais/setores em conformidade'}
              </p>
            </button>

            {/* 2. A Vencer (<30d) */}
            <button
              onClick={() => handleToggleHealthFilter('atencao')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilterCondition === 'atencao'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/40 shadow-xs'
                  : 'bg-[#f8faf9] border-slate-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>A Vencer (&lt;30d):</span>
                </span>
                <span className="text-base font-mono font-bold text-amber-600">
                  {warningInUnit.length} un
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {statusFilterCondition === 'atencao'
                  ? '● Filtrado: Exibindo locais com recarga a vencer'
                  : 'Clique para abrir locais/setores com validade próxima'}
              </p>
            </button>

            {/* 3. Recarga Vencida */}
            <button
              onClick={() => handleToggleHealthFilter('vencido')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilterCondition === 'vencido'
                  ? 'bg-red-50 border-[#de2726] ring-2 ring-[#de2726]/40 shadow-xs'
                  : expiredInUnit.length > 0
                  ? 'bg-red-50/50 border-[#de2726]/40 hover:border-[#de2726]'
                  : 'bg-[#f8faf9] border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-[#de2726]" />
                  <span>Recarga Vencida:</span>
                </span>
                <span className={`text-base font-mono font-bold ${expiredInUnit.length > 0 ? 'text-[#de2726] animate-pulse' : 'text-[#007960]'}`}>
                  {expiredInUnit.length} un
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {statusFilterCondition === 'vencido'
                  ? '● Filtrado: Exibindo locais com extintores vencidos'
                  : 'Clique para abrir locais/setores com recarga vencida'}
              </p>
            </button>
          </div>
        </div>

        {/* DETALHAMENTO DE LOCAL/SETOR DOS EXTINTORES */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                <MapPin className="w-4 h-4 text-[#007960]" />
                <span>
                  Locais e Setores de Instalação: {statusFilterCondition === 'todos' ? 'Todos' : statusFilterCondition === 'valido' ? 'Em Conformidade' : statusFilterCondition === 'atencao' ? 'A Vencer (<30d)' : 'Recarga Vencida'} ({finalExtinguishers.length})
                </span>
              </h3>
              {selectedSubSector !== 'TODOS' && (
                <span className="text-[11px] text-[#007960] font-semibold">
                  Filtrado pelo setor: {registeredSubSectors.find((s) => s.id === selectedSubSector)?.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Busca local no setor */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar tag, local, selo..."
                  value={sectorSearch}
                  onChange={(e) => setSectorSearch(e.target.value)}
                  className="bg-[#f8faf9] border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#007960] w-52"
                />
              </div>
            </div>
          </div>

          {/* PAINEL AGRUPADO POR LOCAL / SETOR (quando filtro de saúde estiver ativo) */}
          {statusFilterCondition !== 'todos' && groupedByLocation.length > 0 && (
            <div className="p-4 bg-emerald-50/40 border border-[#007960]/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#007960] font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#007960]" />
                <span>Resumo por Ponto/Local de Instalação:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {groupedByLocation.map(([locName, list]) => (
                  <div key={locName} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-800 block truncate" title={locName}>
                        {locName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Tags: {list.map((x) => x.code).join(', ')}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#007960] shrink-0">
                      {list.length} un
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extintores Separados por Setor */}
          <div className="space-y-5">
            {groupedBySector.map((sectorGroup) => {
              const validCount = sectorGroup.items.filter((e) => computeExtinguisherStatus(e).status === 'valido').length;
              const warnCount = sectorGroup.items.filter((e) => computeExtinguisherStatus(e).status === 'atencao').length;
              const expCount = sectorGroup.items.filter((e) => computeExtinguisherStatus(e).status === 'vencido').length;

              return (
                <div
                  key={sectorGroup.id}
                  className="bg-[#fcfdfc] border border-[#007960]/25 rounded-2xl overflow-hidden shadow-2xs"
                >
                  {/* Cabeçalho Clicável do Setor */}
                  <div className="px-4 py-3.5 bg-emerald-50/50 border-b border-[#007960]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setSectorActionTarget({
                            id: sectorGroup.id,
                            name: sectorGroup.name,
                            description: sectorGroup.description,
                            items: sectorGroup.allUnitSectorItems,
                          })
                        }
                        className="text-left group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#007960] text-slate-900 hover:text-white border border-[#007960]/30 shadow-2xs transition-all"
                        title={`Clique no nome do setor "${sectorGroup.name}" para realizar o checklist`}
                      >
                        <Layers className="w-4 h-4 text-[#007960] group-hover:text-white shrink-0" />
                        <span className="text-sm font-extrabold tracking-tight">
                          {sectorGroup.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 group-hover:bg-white/20 text-[#007960] group-hover:text-white">
                          {sectorGroup.items.length} ext.
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        {validCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#007960]">
                            {validCount} Conforme(s)
                          </span>
                        )}
                        {warnCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {warnCount} A Vencer
                          </span>
                        )}
                        {expCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-[#de2726]">
                            {expCount} Vencido(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSectorChecklistTarget({
                          name: sectorGroup.name,
                          items: sectorGroup.allUnitSectorItems,
                        })
                      }
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Realizar Checklist do Setor ({sectorGroup.allUnitSectorItems.length})</span>
                    </button>
                  </div>

                  {/* Grid de Extintores deste Setor */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {sectorGroup.items.map((ext) => {
                      const statusData = computeExtinguisherStatus(ext);
                      const typeInfo = TYPE_MAP[ext.type] || {
                        name: ext.type,
                        acro: ext.type,
                        agent: '',
                        fireClasses: '',
                        standardWeight: '',
                        color: '#007960',
                        badgeBg: 'bg-slate-100 border-slate-300',
                        badgeText: 'text-slate-700',
                      };
                      const isExpired = statusData.status === 'vencido';
                      const isWarning = statusData.status === 'atencao';

                      return (
                        <div
                          key={ext.id}
                          className={`bg-white border rounded-2xl p-4 transition-all hover:shadow-sm ${
                            isExpired
                              ? 'border-[#de2726]/40 bg-red-50/20'
                              : isWarning
                              ? 'border-amber-300 bg-amber-50/20'
                              : 'border-slate-200 hover:border-[#007960]/50'
                          }`}
                        >
                          <div className="flex flex-col justify-between h-full">
                            <div>
                              {/* Header Tag + Capacidade */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-black text-slate-900 tracking-tight">
                                    {ext.code}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeInfo.badgeBg} ${typeInfo.badgeText}`}>
                                    {typeInfo.name} ({ext.capacityWeight})
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusData.badgeBg} ${statusData.badgeText}`}>
                                  {statusData.label}
                                </span>
                              </div>

                              {/* DESTAQUE DO LOCAL / SETOR DE INSTALAÇÃO */}
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-2.5">
                                <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">
                                  Local / Setor de Instalação:
                                </span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#007960] shrink-0" />
                                  <span className="truncate" title={ext.locationDetails}>
                                    {ext.locationDetails}
                                  </span>
                                </div>
                              </div>

                              {/* Datas de Validade */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#f8faf9] p-2.5 rounded-xl border border-slate-200 mb-2">
                                <div>
                                  <span className="text-[10px] text-slate-500 font-sans block">Validade Recarga:</span>
                                  <span className={isExpired ? 'text-[#de2726] font-bold' : isWarning ? 'text-amber-700 font-bold' : 'text-slate-900 font-semibold'}>
                                    {formatDateBR(ext.rechargeExpiryDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 font-sans block">Reteste Hidrostático:</span>
                                  <span className="text-slate-700 font-semibold">
                                    {formatDateBR(ext.hydrostaticExpiryDate)}
                                  </span>
                                </div>
                                <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 font-sans">Selo INMETRO:</span>
                                  <span className="text-slate-700 font-mono">{ext.inmetroSeal}</span>
                                </div>
                              </div>
                            </div>

                            {/* Ações do Card */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 gap-2">
                              <div className="flex items-center gap-1.5">
                                {onDeleteExtinguisher && (
                                  <button
                                    onClick={() => onDeleteExtinguisher(ext.id)}
                                    className="p-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                                    title="Excluir Extintor com Justificativa Técnica Obrigatória"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onPrintLabel(ext)}
                                  className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:border-[#007960]/40 text-slate-700 hover:text-[#007960] transition-colors flex items-center gap-1 text-[10px] font-bold"
                                  title="Visualizar, Imprimir ou Baixar QR Code do Extintor"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>QR</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {(isExpired || isWarning) && (
                                  <button
                                    onClick={() => onQuickSwap(ext)}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                    title="Trocar por cilindro reserva do almoxarifado"
                                  >
                                    <Repeat className="w-3 h-3 text-[#007960]" />
                                    <span>Trocar</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => onInspectExtinguisher(ext)}
                                  className="px-3 py-1 rounded-lg bg-[#007960] hover:bg-[#005a47] text-white text-[11px] font-bold transition-colors shadow-2xs"
                                >
                                  Checar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {groupedBySector.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-2xl">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                Nenhum extintor encontrado neste setor com os filtros selecionados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE OPÇÕES AO CLICAR NO NOME DO SETOR */}
      {sectorActionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#007960]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#007960] block">
                    Setor Operacional • {currentUnitInfo.shortName}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{sectorActionTarget.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSectorActionTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">{sectorActionTarget.description}</p>

            <div className="bg-[#f8faf9] border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Extintores vinculados a este setor:</span>
              <span className="font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-[#007960]">
                {sectorActionTarget.items.length} unidade(s)
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {sectorActionTarget.items.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = sectorActionTarget;
                    setSectorActionTarget(null);
                    setSectorChecklistTarget({
                      name: target.name,
                      items: target.items,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Realizar Checklist deste Setor ({sectorActionTarget.items.length} extintores)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSectorActionTarget(null);
                    onAddInSector(activeUnit);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nenhum extintor no setor • Cadastrar Extintor</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const id = sectorActionTarget.id;
                  setSelectedSubSector(selectedSubSector === id ? 'TODOS' : id);
                  setSectorActionTarget(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007960] border border-[#007960]/30 text-xs font-bold transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>
                  {selectedSubSector === sectorActionTarget.id
                    ? 'Remover Filtro e Mostrar Todos os Setores'
                    : 'Filtrar e Exibir Apenas Este Setor'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKLIST COMPLETO DO SETOR (EXTINTORES) */}
      <SectorChecklistModal
        isOpen={Boolean(sectorChecklistTarget)}
        onClose={() => setSectorChecklistTarget(null)}
        mode="extintores"
        sectorName={sectorChecklistTarget?.name || ''}
        unitLabel={currentUnitInfo.name}
        extinguishers={sectorChecklistTarget?.items || []}
        onSaveExtinguishersBatch={(updatedList, newPlans, completionData) => {
          if (onSaveSectorChecklist) {
            onSaveSectorChecklist(updatedList, newPlans, completionData);
          }
        }}
      />

      {/* MODAL PARA CADASTRAR NOVO SETOR */}
      {isCreateModalVisible && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#007960]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cadastrar Novo Setor</h3>
                  <p className="text-xs text-slate-500">Adicione uma nova localidade técnica à unidade</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInternalCreateSectorOpen(false);
                  if (onCloseCreateSectorModal) onCloseCreateSectorModal();
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSector} className="space-y-3.5">
              {/* Unidade Mãe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidade Operacional de Destino:
                </label>
                <select
                  value={newSectorUnit}
                  onChange={(e) => setNewSectorUnit(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#007960]"
                >
                  <option value="unidade_industrial">Indústria</option>
                  <option value="empacotamento">Empacotamento</option>
                  <option value="posto_combustivel">Posto de Combustível</option>
                  <option value="adm">ADM / GMA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Setor / Área:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sala Elétrica da Moenda 02"
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sigla / TAG Identificadora:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ELE-MOE-02"
                  value={newSectorShortName}
                  onChange={(e) => setNewSectorShortName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição Técnica do Setor:
                </label>
                <textarea
                  rows={2}
                  placeholder="Finalidade operacional, riscos de incêndio ou equipamentos instalados..."
                  value={newSectorDescription}
                  onChange={(e) => setNewSectorDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setInternalCreateSectorOpen(false);
                    if (onCloseCreateSectorModal) onCloseCreateSectorModal();
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Cadastrar Setor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR NOME DO SETOR */}
      {isEditSectorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#007960]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#007960]/30 text-[#007960] flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Editar Nome da Unidade</h3>
                  <p className="text-xs text-slate-500">Altere o nome e a descrição exibida no sistema</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditSectorOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSector} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  value={editSectorName}
                  onChange={(e) => setEditSectorName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sigla / Nome Curto:
                </label>
                <input
                  type="text"
                  required
                  value={editSectorShortName}
                  onChange={(e) => setEditSectorShortName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição Operacional:
                </label>
                <textarea
                  rows={2}
                  value={editSectorDescription}
                  onChange={(e) => setEditSectorDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#007960]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditSectorOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#007960] hover:bg-[#005a47] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
