export interface LgeTestReport {
  id: string;
  reportNumber: string; // ex: "0852-26-3"
  unit: 'INDUSTRIA' | 'POSTO DE COMBUSTIVEL' | 'EMPACOTAMENTO';
  unitLabel: string;
  locationDetails: string;
  storageType: string; // "Tanque (atmosférico)", "Bombona", "Bombona 50 L em abrigo"
  foamType: string; // "AFFF/AR 1% x 3%", "AFFF/AR 3% x 6%", "AFFF 6%"
  manufacturer: string; // "ARGUS", "Secur / Chemguard", "FIREKILL"
  batchNumber: string; // "17L0625", "12SCH03", "20/22D"
  waterType: string; // "Doce"
  dosageClass: string; // "AR 3%", "HC 3% x AR 6%", "HC 6%"
  collectionDate: string; // "2026-05-07"
  labReceivedDate: string; // "2026-06-02"
  testDate: string; // "2026-06-12 a 2026-06-15"
  emissionDate: string; // "2026-06-15"
  labExpiryDate: string; // "2027-06-15" (12 meses)
  fireTestExpiryDate: string; // "2029-06-15" ou "2028-04-02" (36 meses)
  status: 'aprovado' | 'reprovado' | 'atencao';
  laboratoryName: string; // "FIREMETRIA CONSULTORIA, ASSESSORIA E APOIO TÉCNICO LTDA."
  accreditation: string; // "CRL 0576 - NBR ISO/IEC 17025"
  normReference: string; // "ABNT NBR 15511:2023 - Líquido Gerador de Espuma (LGE)"
  pdfUrl: string;
  physicalChemicalResults: {
    specificMass: { result: number; unit: string; spec: string };
    pH: { result: number; spec: string };
    refractiveIndex: { result: number; spec: string };
    viscosity: { result: number; unit: string; spec: string };
    sealingCapacity: { hc: string; ar: string };
    expansion: { result: number; spec: string };
    drainageTime25s: { result: number; unit: string; spec: string };
  };
  fireTestResults: {
    classTested: string;
    extinctionTimeSeconds: number;
    reignitionResistanceMinutes: string;
    compliance: string;
  };
  chemists: string[];
}
