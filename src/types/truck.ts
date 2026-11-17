import { SignatureData } from '../components/ChecklistSignatureModule';

export interface FireTruck {
  id: string;
  prefix: string; // Ex: 'CB-01 (Pipa Bombeiro)'
  plate: string; // Ex: 'QBU-3737'
  model: string; // Ex: 'Mercedes-Benz Atego 2730 6x4'
  capacityLiters: number; // Ex: 15.000 Litros
  company: string; // 'UISA Bioenergia & Açúcar'
  sector: string; // 'Brigada Agrícola & Industrial'
  front: string; // 'Frente de Colheita / Pátio Industrial'
  pumpModel: string; // 'Bomba Centrífuga Autoescorvante 750 GPM'
  canonNozzle: string; // 'Canhão Monitor 2.1/2" com Jato Regulável e Neblina'
  status: 'operacional' | 'em_manutencao' | 'em_atendimento';
  lastInspectionDate: string;
}

export interface FireTruckInspectionItem {
  number: number;
  question: string;
  category: 'condutor_brigada' | 'equipamentos_combate' | 'veiculo_estrutural' | 'auxiliares';
}

export interface FireTruckInspectionRecord {
  id: string;
  truckId: string;
  truckPrefix: string;
  plate: string;
  company: string;
  sector: string;
  front: string;
  date: string;
  time: string;
  inspectorName: string;
  driverName: string;
  inspectorRegistration?: string;
  driverRegistration?: string;
  answers: Record<number, { status: 'C' | 'NC' | 'N/A' | null; observation: string }>;
  generalObservations: string;
  status: 'finalizada' | 'em_andamento';
  inspectorSignature?: SignatureData | null;
  driverSignature?: SignatureData | null;
  createdAt: string;
}
