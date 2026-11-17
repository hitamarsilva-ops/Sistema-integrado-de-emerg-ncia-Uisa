import * as XLSX from 'xlsx';
import {
  Extinguisher,
  ExtinguisherSector,
  ExtinguisherType,
  StockCondition,
} from '../types/extinguisher';

export interface ParsedRowResult {
  rawRow: Record<string, unknown>;
  extinguisher: Partial<Extinguisher>;
  isUpdate: boolean;
  matchedId?: string;
  hasErrors: boolean;
  errors: string[];
}

export interface ImportPreviewSummary {
  fileName: string;
  totalRows: number;
  newRowsCount: number;
  updateRowsCount: number;
  invalidRowsCount: number;
  parsedRows: ParsedRowResult[];
}

// Convert Excel dates (serial numbers or strings) to YYYY-MM-DD
export function parseDateToIso(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel serial date to JS date
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str) return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback try standard date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '';
}

// Normalize sector names from Brazilian spreadsheet text
export function normalizeSector(raw: unknown): ExtinguisherSector {
  const str = String(raw || '').toLowerCase().trim();

  if (str.includes('estoque') || str.includes('almoxarifado')) {
    if (str.includes('empacot')) return 'almoxarifado_empacotamento';
    if (str.includes('adm') || str.includes('admin') || str.includes('escrit')) return 'almoxarifado_adm';
    return 'almoxarifado_industria';
  }

  if (str.includes('empacot') || str.includes('ensaque') || str.includes('paleti')) {
    return 'empacotamento';
  }

  if (str.includes('posto') || str.includes('combust') || str.includes('diesel') || str.includes('abastec')) {
    return 'posto_combustivel';
  }

  if (str.includes('adm') || str.includes('admin') || str.includes('escrit') || str.includes('diret') || str.includes('ti')) {
    return 'adm';
  }

  return 'unidade_industrial';
}

// Normalize extinguisher agent type from text
export function normalizeType(raw: unknown): ExtinguisherType {
  const str = String(raw || '').toLowerCase().trim();

  if (str.includes('co2') || str.includes('carbon') || str.includes('carbô')) {
    return 'co2';
  }
  if (str.includes('abc') || str.includes('polivalente')) {
    return 'po_polivalente_abc';
  }
  if (str.includes('bc') || str.includes('pqs') || str.includes('bicarbonato')) {
    return 'po_quimico_bc';
  }
  if (str.includes('agua') || str.includes('água') || str.includes('ap') || str.includes('pressurizada')) {
    return 'agua_pressurizada';
  }
  if (str.includes('espuma') || str.includes('mecanica') || str.includes('mecânica') || str.includes('afff')) {
    return 'espuma_mecanica';
  }
  if (str.includes('classe d') || str.includes('pirof')) {
    return 'po_classe_d';
  }

  return 'po_polivalente_abc';
}

// Parse spreadsheet buffer (.xlsx, .xls, .csv)
export async function parseSpreadsheetFile(
  file: File,
  existingExtinguishers: Extinguisher[]
): Promise<ImportPreviewSummary> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON objects with header row
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // Map of existing by Code (Tag) or Serial
  const existingByCode = new Map<string, Extinguisher>();
  const existingBySerial = new Map<string, Extinguisher>();
  existingExtinguishers.forEach((e) => {
    existingByCode.set(e.code.toUpperCase().trim(), e);
    if (e.serialNumber) existingBySerial.set(e.serialNumber.toUpperCase().trim(), e);
  });

  const parsedRows: ParsedRowResult[] = [];
  let newRowsCount = 0;
  let updateRowsCount = 0;
  let invalidRowsCount = 0;

  rawRows.forEach((row, index) => {
    // Find column values ignoring case and accent variations
    const findCol = (possibleNames: string[]): unknown => {
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = key
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
        for (const candidate of possibleNames) {
          const cleanCand = candidate
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
          if (cleanKey === cleanCand || cleanKey.includes(cleanCand)) {
            return val;
          }
        }
      }
      return '';
    };

    const rawCode = String(findCol(['codigo', 'tag', 'identificacao', 'extintor', 'numero']) || '').trim().toUpperCase();
    const rawSerial = String(findCol(['serie', 'serial', 'numero de serie', 'cilindro']) || '').trim();
    const rawInmetro = String(findCol(['inmetro', 'selo', 'selo inmetro']) || '').trim();
    const rawSector = findCol(['setor', 'area', 'departamento', 'local instalado']);
    const rawLocation = String(findCol(['localizacao', 'local', 'ponto', 'posicao', 'detalhes']) || '').trim();
    const rawType = findCol(['tipo', 'agente', 'classe']);
    const rawWeight = String(findCol(['peso', 'capacidade', 'carga']) || '6kg').trim();
    const rawRechargeDate = parseDateToIso(findCol(['data recarga', 'ultima recarga', 'recarga']));
    let rawExpiryDate = parseDateToIso(findCol(['validade', 'vencimento', 'validade recarga', 'vencimento recarga']));
    const rawHydroDate = parseDateToIso(findCol(['reteste', 'hidrostatico', 'teste hidrostatico']));
    let rawHydroExpiry = parseDateToIso(findCol(['validade reteste', 'vencimento reteste', 'reteste 5']));
    const rawNotes = String(findCol(['observacoes', 'obs', 'notas', 'fornecedor']) || '').trim();

    const errors: string[] = [];

    // Fallbacks and computations
    if (!rawCode) {
      errors.push(`Linha ${index + 2}: Código/Tag não informado.`);
    }

    // Auto-calculate expiry if recharge date was given but expiry was not
    if (rawRechargeDate && !rawExpiryDate) {
      const d = new Date(rawRechargeDate + 'T00:00:00');
      d.setFullYear(d.getFullYear() + 1);
      rawExpiryDate = d.toISOString().split('T')[0];
    } else if (!rawExpiryDate) {
      // Default 1 year from today if neither was provided
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      rawExpiryDate = d.toISOString().split('T')[0];
    }

    // Auto-calculate hydrostatic expiry if not provided
    if (rawHydroDate && !rawHydroExpiry) {
      const d = new Date(rawHydroDate + 'T00:00:00');
      d.setFullYear(d.getFullYear() + 5);
      rawHydroExpiry = d.toISOString().split('T')[0];
    } else if (!rawHydroExpiry) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 5);
      rawHydroExpiry = d.toISOString().split('T')[0];
    }

    // Check if matches existing
    const matched = (rawCode ? existingByCode.get(rawCode) : undefined) ||
      (rawSerial ? existingBySerial.get(rawSerial.toUpperCase()) : undefined);

    const isUpdate = !!matched;
    if (isUpdate) updateRowsCount++;
    else newRowsCount++;

    if (errors.length > 0) {
      invalidRowsCount++;
    }

    const sectorNormalized = normalizeSector(rawSector);
    const typeNormalized = normalizeType(rawType);
    const isWarehouse = sectorNormalized.startsWith('almoxarifado') || String(rawSector).toLowerCase().includes('estoque');

    const extinguisher: Partial<Extinguisher> = {
      id: matched?.id || `ext-${Date.now()}-${index}`,
      code: rawCode || `EXT-${index + 1}`,
      serialNumber: rawSerial || matched?.serialNumber || `SN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      inmetroSeal: rawInmetro || matched?.inmetroSeal || `INM-${Math.floor(10000000 + Math.random() * 90000000)}`,
      sector: sectorNormalized,
      locationDetails: rawLocation || matched?.locationDetails || 'Ponto não especificado',
      type: typeNormalized,
      capacityWeight: rawWeight || matched?.capacityWeight || '6kg',
      rechargeDate: rawRechargeDate || matched?.rechargeDate || new Date().toISOString().split('T')[0],
      rechargeExpiryDate: rawExpiryDate,
      hydrostaticTestDate: rawHydroDate || matched?.hydrostaticTestDate || new Date().toISOString().split('T')[0],
      hydrostaticExpiryDate: rawHydroExpiry,
      isStockInWarehouse: isWarehouse,
      stockCondition: isWarehouse ? ((matched?.stockCondition as StockCondition) || 'pronto_uso') : undefined,
      notes: rawNotes || matched?.notes || '',
      pressureGaugeOk: matched?.pressureGaugeOk ?? true,
      sealIntact: matched?.sealIntact ?? true,
      hoseNozzleOk: matched?.hoseNozzleOk ?? true,
      signageOk: matched?.signageOk ?? true,
      unobstructed: matched?.unobstructed ?? true,
      createdAt: matched?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inspectionHistory: matched?.inspectionHistory || [],
    };

    parsedRows.push({
      rawRow: row,
      extinguisher,
      isUpdate,
      matchedId: matched?.id,
      hasErrors: errors.length > 0,
      errors,
    });
  });

  return {
    fileName: file.name,
    totalRows: rawRows.length,
    newRowsCount,
    updateRowsCount,
    invalidRowsCount,
    parsedRows,
  };
}

// Download official Excel/CSV template for easy importing
export function downloadSpreadsheetTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleData = [
    {
      'Código/Tag': 'EXT-IND-01',
      'Setor': 'Unidade Industrial',
      'Localização Detalhada': 'Painel Geral de Comando Elétrico - Sala CCM 01',
      'Tipo de Agente': 'CO2',
      'Carga/Peso': '6kg',
      'Nº de Série': 'SN-7849102-21',
      'Selo INMETRO': 'INM-94817263',
      'Data da Recarga': '2025-10-25',
      'Validade da Recarga': '2026-10-25',
      'Data Reteste (5 Anos)': '2023-04-10',
      'Validade Reteste (5 Anos)': '2028-04-10',
      'Observações': 'Equipamento essencial para sala elétrica',
    },
    {
      'Código/Tag': 'EXT-EMP-01',
      'Setor': 'Empacotamento',
      'Localização Detalhada': 'Linha 1 de Ensaque Automático de Açúcar',
      'Tipo de Agente': 'Pó ABC',
      'Carga/Peso': '6kg',
      'Nº de Série': 'SN-5591823-22',
      'Selo INMETRO': 'INM-54918274',
      'Data da Recarga': '2025-11-12',
      'Validade da Recarga': '2026-11-12',
      'Data Reteste (5 Anos)': '2023-05-15',
      'Validade Reteste (5 Anos)': '2028-05-15',
      'Observações': 'Área com poeira orgânica',
    },
    {
      'Código/Tag': 'EXT-POSTO-01',
      'Setor': 'Posto de Combustível',
      'Localização Detalhada': 'Ilha de Abastecimento 01 - Bicos Diesel S10',
      'Tipo de Agente': 'Pó BC',
      'Carga/Peso': '12kg',
      'Nº de Série': 'SN-8829103-23',
      'Selo INMETRO': 'INM-88291044',
      'Data da Recarga': '2026-05-18',
      'Validade da Recarga': '2027-05-18',
      'Data Reteste (5 Anos)': '2023-05-18',
      'Validade Reteste (5 Anos)': '2028-05-18',
      'Observações': 'Abrigo com demarcação NR-23',
    },
    {
      'Código/Tag': 'EXT-ADM-01',
      'Setor': 'Administração (ADM)',
      'Localização Detalhada': 'Recepção Principal / Portaria Administrativa',
      'Tipo de Agente': 'Água Pressurizada (AP)',
      'Carga/Peso': '10L',
      'Nº de Série': 'SN-1029384-21',
      'Selo INMETRO': 'INM-10293844',
      'Data da Recarga': '2026-06-11',
      'Validade da Recarga': '2027-06-11',
      'Data Reteste (5 Anos)': '2023-06-11',
      'Validade Reteste (5 Anos)': '2028-06-11',
      'Observações': 'Pedestal de piso cromado',
    },
    {
      'Código/Tag': 'EXT-EST-IND-01',
      'Setor': 'Estoque da Indústria',
      'Localização Detalhada': 'Rack Indústria - Prateleira 01 (Reserva Pesada)',
      'Tipo de Agente': 'Pó ABC',
      'Carga/Peso': '12kg',
      'Nº de Série': 'SN-9948172-24',
      'Selo INMETRO': 'INM-99481720',
      'Data da Recarga': '2026-08-10',
      'Validade da Recarga': '2027-08-10',
      'Data Reteste (5 Anos)': '2024-08-10',
      'Validade Reteste (5 Anos)': '2029-08-10',
      'Observações': 'Reserva pronta para troca imediata',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extintores');

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, 'Modelo_Planilha_ExtintoresPRO.xlsx');
  } else {
    XLSX.writeFile(workbook, 'Modelo_Planilha_ExtintoresPRO.csv', { bookType: 'csv' });
  }
}
