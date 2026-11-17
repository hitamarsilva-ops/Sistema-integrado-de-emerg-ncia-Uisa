import React, { useState } from 'react';
import { X, Printer, ShieldAlert, Download, Filter, Building2, Clock, Users } from 'lucide-react';
import { BrigadeMember, BrigadeUnit, BrigadeShift } from '../types/brigade';
import { BRIGADE_UNITS, BRIGADE_SHIFTS, ROLE_LABELS, STATUS_LABELS } from '../data/brigadeData';
import { formatDateBR } from '../utils/formatters';
import { UisaLogo } from './UisaLogo';

interface BrigadeRosterPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: BrigadeMember[];
}

export const BrigadeRosterPrintModal: React.FC<BrigadeRosterPrintModalProps> = ({
  isOpen,
  onClose,
  members,
}) => {
  const [filterShift, setFilterShift] = useState<BrigadeShift | 'todos'>('todos');
  const [filterUnit, setFilterUnit] = useState<BrigadeUnit | 'todas'>('todas');

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    if (filterShift !== 'todos' && m.shift !== filterShift) return false;
    if (filterUnit !== 'todas' && m.unit !== filterUnit) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-[#1a1d21] border border-[#4b4f55]/60 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh] print:border-0 print:shadow-none print:max-h-none print:w-full print:rounded-none print:bg-white print:text-black">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4b4f55]/40 bg-[#121417] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#de2726]/20 border border-[#de2726]/40 flex items-center justify-center text-[#de2726]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Escala Oficial de Brigada de Incêndio • SST.AN-014
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Pronto para Imprimir
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Visualização do quadro oficial para murais operacionais, portarias e CAE 24h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by Shift */}
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="todos">Todos os Turnos (A, B, C & Adm)</option>
              <option value="turno_a">Turno A (00:20 às 08:20)</option>
              <option value="turno_b">Turno B (08:20 às 16:20)</option>
              <option value="turno_c">Turno C (16:20 às 00:20)</option>
              <option value="administrativo">Horário Administrativo</option>
            </select>

            {/* Filter by Unit */}
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="todas">Todas as Unidades</option>
              {Object.values(BRIGADE_UNITS).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#de2726] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-950/60"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Documento</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Canvas */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UisaLogo size="lg" />
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    uisa agroindustrial de nova olímpia s/a
                  </h1>
                  <h2 className="text-sm font-bold text-slate-700">
                    SST.AN-014 — Escala Oficial da Brigada de Emergência e Combate a Incêndio
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Conformidade: NR-23 • ABNT NBR 14276 • IT-17 CBM-MT • PAE SST.NP-022 Rev 05
                  </p>
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="font-mono bg-slate-100 border border-slate-300 px-3 py-1 rounded inline-block">
                  <strong>Emissão:</strong> {currentDateStr}
                </div>
                <div className="text-[11px] text-slate-600">
                  Canal de Rádio CAE: <strong>Canal 01</strong> | Ramal: <strong>1930 / 3737</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Scope & Shift Filter Info */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Filtro de Turno:</span>
              <strong className="text-slate-800">
                {filterShift === 'todos' ? 'Escala Geral (Turnos A, B, C & Adm)' : BRIGADE_SHIFTS[filterShift]?.name}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Filtro de Unidade:</span>
              <strong className="text-slate-800">
                {filterUnit === 'todas' ? 'Todas as Unidades Operacionais' : BRIGADE_UNITS[filterUnit]?.name}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Efetivo Listado:</span>
              <strong className="text-slate-800">{filteredMembers.length} Brigadistas Habilitados</strong>
            </div>
          </div>

          {/* Members Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-slate-700">RE</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Nome do Brigadista</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Unidade</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Turno</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Função de Emergência</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Rádio / Ramal</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Validade Brigada</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMembers.map((member, idx) => (
                  <tr key={member.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 border-r border-slate-200">
                      {member.registrationNumber}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      <div>{member.name}</div>
                      {member.specificAssignment && (
                        <div className="text-[10px] text-slate-500 font-normal">
                          {member.specificAssignment}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className="font-medium text-slate-700">
                        {(member.unit ? BRIGADE_UNITS[member.unit]?.shortName : undefined) || member.unit || member.sector}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium">
                      {BRIGADE_SHIFTS[member.shift]?.name || member.shift}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className="font-medium text-slate-800">
                        {ROLE_LABELS[member.role]?.label || member.role}
                      </span>
                      {member.hasScbaTraining && (
                        <span className="ml-1 text-[9px] px-1 bg-red-100 text-red-700 rounded font-bold">
                          EPR
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                      <div>{member.radioCallsign}</div>
                      <div className="text-[10px] text-slate-500">{member.phone}</div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700">
                      {formatDateBR(member.trainingExpiryDate || '')}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          member.status === 'ativo_plantao'
                            ? 'bg-emerald-100 text-emerald-800'
                            : member.status === 'folga'
                            ? 'bg-slate-100 text-slate-700'
                            : member.status === 'ferias'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {(member.status ? STATUS_LABELS[member.status]?.label : undefined) || member.status || 'Ativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Operational Notes */}
          <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg text-xs space-y-2 mb-8">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">
              Instruções Operacionais de Prontidão (SST.NP-022 Item 5):
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px]">
              <li>
                <strong>Corte Imediato de Etanol (Nota 1):</strong> O operador designado da Destilaria deve fechar imediatamente as válvulas de isolamento do parque de tanques em qualquer alarme de incêndio na área industrial.
              </li>
              <li>
                <strong>Desenergização Segura (Nota 2):</strong> O eletricista de plantão deve comparecer ao local da ocorrência para bloqueio da subestação antes do lançamento de jatos de hidrante.
              </li>
              <li>
                <strong>Pressurização de Hidrantes (Nota 3):</strong> O operador da Casa de Bombas confirma a partida automática da motobomba diesel, mantendo pressão mínima de 7.0 kgf/cm² na rede.
              </li>
              <li>
                <strong>Proteção em Defensivos:</strong> Proibido terminantemente uso de água em combate a fogo em galpões de defensivos químicos agrícolas.
              </li>
            </ul>
          </div>

          {/* Formal Signatures Section */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-xs">
            <div className="space-y-12">
              <div className="h-10 border-b border-slate-400 mx-4" />
              <div>
                <p className="font-bold text-slate-900">Coordenador Geral da Brigada</p>
                <p className="text-[10px] text-slate-500">Coordenador da Brigada / Gerência SST</p>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10 border-b border-slate-400 mx-4" />
              <div>
                <p className="font-bold text-slate-900">João Bosco Lemos Junior</p>
                <p className="text-[10px] text-slate-500">Comandante da Brigada Florestal / Gerente Executivo</p>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10 border-b border-slate-400 mx-4" />
              <div>
                <p className="font-bold text-slate-900">Técnico de Segurança do Trabalho</p>
                <p className="text-[10px] text-slate-500">SESMT / Registro MTE</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
