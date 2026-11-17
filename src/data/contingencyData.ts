import { ContingencyPlan } from '../types/contingency';

export interface ContingencyDocMetadata {
  division: 'industria' | 'empacotamento' | 'adm_agricola';
  documentCode: string;
  revision: string;
  date: string;
  title: string;
  pdfAssetPath: string;
}

export const CONTINGENCY_DOC_METADATA: Record<'industria' | 'empacotamento' | 'adm_agricola', ContingencyDocMetadata> = {
  industria: {
    division: 'industria',
    documentCode: 'SST.AN-044',
    revision: '00',
    date: '28/08/2025',
    title: 'ANEXO — PLANO DE CONTINGÊNCIA INDÚSTRIA',
    pdfAssetPath: '/assets/aistudio/SST.AN-044_Plano_de_Contig_ncia_Ind_stria__2__e18dafa3.pdf',
  },
  empacotamento: {
    division: 'empacotamento',
    documentCode: 'SST.AN-043',
    revision: '00',
    date: '28/08/2025',
    title: 'ANEXO — PLANO DE CONTINGÊNCIA EMPACOTAMENTO (ASSARI)',
    pdfAssetPath: '/assets/aistudio/SST.AN-043_Plano_de_contig_ncia__Empacotamento_a47c53af.pdf',
  },
  adm_agricola: {
    division: 'adm_agricola',
    documentCode: 'SST.AN-042',
    revision: '00',
    date: '02/09/2025',
    title: 'ANEXO — PLANO DE CONTINGÊNCIA AGRÍCOLA / GMA / ADM / POSTO DE COMBUSTÍVEL',
    pdfAssetPath: '/assets/aistudio/SST.AN-042__Plano_de_contig_ncia_Agr_cola_GMA_ADM_83719a39.pdf',
  },
};

export const INITIAL_CONTINGENCY_PLANS: ContingencyPlan[] = [
  // =========================================================================
  // DIVISÃO 1: INDÚSTRIA (Doc Oficial: SST.AN-044 • Data: 28/08/2025)
  // =========================================================================
  {
    id: 'pc-ind-abandono',
    division: 'industria',
    code: 'SST.AN-044 / §01',
    title: 'Abandono de Área Geral & Setorial da Indústria',
    subArea: 'Toda a Planta Industrial (Moenda, Destilaria, Caldeiras, ETA)',
    scenarioDescription:
      'Ordem de evacuação por risco de propagação de sinistro grave. Condução obrigatória pelo "Cabeça de Fila" até o Ponto de Encontro Principal (PEE-01) ou Alternativo, contagem de integrantes e busca e resgate imediato de faltosos.',
    riskRating: 'critico',
    triggerEvent:
      'Alarme de emergência agudo sonoro contínuo, ordem verbal da Brigada ou identificação de risco incontrolável.',
    isolationRadiusMeters: 150,
    containmentProcedures: [
      'Acionar imediatamente o ramal de emergência (Ramal 3737 / Rádio Canal 01 ou externo 65 3332-3737).',
      'Acionar a Segurança do Trabalho da planta e Segurança Patrimonial via rádio, ramal e celular.',
      'Analisar a gravidade e abrangência do sinistro para decidir sobre ordem de abandono geral ou parcial.',
      'Definir o Ponto de Encontro seguro (com base na direção do vento e distâncias) e acionar a sirene de alarme.',
      'Todos os integrantes desocupam a área em fila única guiados pelo funcionário nomeado "Cabeça de Fila".',
      'Condutores de veículos e equipamentos móveis estacionam em local seguro sem obstruir acessos, desligam o motor, deixam a chave na ignição e dirigem-se ao ponto seguro.',
      'No Ponto de Encontro, o membro nomeado da Brigada promove a contagem do pessoal (verificação nominal de todos).',
      'Vigilante/Segurança Patrimonial com a lista de visitantes da portaria efetua a conferência de externos dando o "OK" para o Coordenador da Brigada.',
      'Certo da falta de alguém, o Coordenador da Brigada providencia imediatamente equipe de Busca e Resgate.',
    ],
    shutdownProcedures: [
      'Desligamento de equipamentos adjacentes pelo operador antes da saída se seguro.',
      'Corte de fornecimento de energia elétrica da área afetada por disjuntores centrais com o Eletricista de Plantão.',
    ],
    requiredPPEAndEquipment: [
      'Placas de rota de fuga e iluminação de emergência ativas',
      'Fita zebrada e cones de sinalização para isolamento de perímetro',
      'Megafones e rádios transceptores Canal 01',
      'Lista nominal de colaboradores e controle de visitantes da portaria',
    ],
    brigadeTactic:
      'Prioridade absoluta na evacuação de vidas. Apenas brigadistas equipados atuam na área de risco. O isolamento de perímetro impede reentrada de pessoas não autorizadas.',
    externalSupportTrigger:
      'Se houver vítimas encurraladas ou colapso estrutural: acionar imediatamente Corpo de Bombeiros Militar 193.',
    evacuationRouteDetails:
      'Rotas de fuga sinalizadas pela rua central em direção ao PEE-01 (Portaria Principal) ou PEE-03 (Área Norte da ETA).',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Ramal 3737 e Rádio Canal 01 acionados', responsibleRole: 'Qualquer Funcionário' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'Alarme sonoro agudo acionado e ordem de abandono emitida', responsibleRole: 'Segurança do Trabalho / Brigada' },
      { id: 'c3', order: 3, timeframe: '2 - 5 min', action: 'Cabeça de Fila conduz integrantes pelas rotas de fuga', responsibleRole: 'Líder / Brigadista Local' },
      { id: 'c4', order: 4, timeframe: '5 - 8 min', action: 'Contagem de pessoal e conferência de visitantes com a portaria', responsibleRole: 'Membro Brigada / Vigilante' },
      { id: 'c5', order: 5, timeframe: '8 - 15 min', action: 'Equipe de Busca e Resgate acionada caso haja faltosos', responsibleRole: 'Coordenador da Brigada' },
    ],
    lastReviewDate: '28/08/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente de SST',
  },
  {
    id: 'pc-ind-incendio-inflamaveis',
    division: 'industria',
    code: 'SST.AN-044 / §06',
    title: 'Incêndio em Carga, Descarga e Bombeamento de Etanol',
    subArea: 'Parque de Tanques, Plataforma de Carregamento & Destilaria',
    scenarioDescription:
      'Fogo em instalações de bombeamento de inflamáveis, descarga para tanques ou abastecimento de carretas de etanol. Divisão tática da brigada em 3 grupos específicos (Combate, Salvamento e Abandono), corte de fluxo e resfriamento.',
    riskRating: 'critico',
    triggerEvent:
      'Visualização de fogo em bomba de transferência, vazamento de etanol com chama ou alarme do sistema de detecção.',
    isolationRadiusMeters: 150,
    containmentProcedures: [
      'Comunicar imediatamente o ocorrido à equipe de Segurança do Trabalho (Ramal 3737) e à Brigada de Incêndio.',
      'Utilização obrigatória de EPIs adequados antes de qualquer aproximação (roupa de combate, capa/calça de aproximação, SCBA).',
      'Fogo restrito à bomba: utilizar extintores de pó químico ABC ou CO2 para conter o fogo, desde que não haja jato de chama.',
      'INTERRUPÇÃO DO BOMBEAMENTO: Parar imediatamente o bombeamento e fechar as válvulas de sucção e descarga para evitar vazamento contínuo decorrente do calor.',
      'ESCALONAMENTO DA EQUIPE EM 3 GRUPOS:',
      '  • Grupo 1 - Combate ao Fogo: Responsável por extinguir o incêndio utilizando hidrantes e canhões de espuma LGE.',
      '  • Grupo 2 - Salvamento: Responsável por prestar socorro a possíveis vítimas de queimaduras ou intoxicação junto ao Ambulatório.',
      '  • Grupo 3 - Abandono de Área: Responsável por garantir a evacuação da área em caso de necessidade.',
      'Eliminação de fontes de ignição próximas e estancamento de vazamentos.',
      'Após controle do sinistro, a equipe da Brigada realiza RONDAS PERIÓDICAS A CADA 30 MINUTOS por no mínimo 2 HORAS para evitar reignição.',
    ],
    shutdownProcedures: [
      'Botoeira de Desarme de Emergência (ESD) das bombas de etanol.',
      'Fechamento manual/automático de válvulas de bloqueio a montante e jusante.',
      'Paralisação total das operações de transferência de etanol.',
      'Eletricista de plantão desliga disjuntores da área.',
    ],
    requiredPPEAndEquipment: [
      'Roupa de aproximação / combate a incêndio com forro térmico',
      'Equipamento autônomo de ar comprimido (SCBA)',
      'Canhões monitores e proporcionadores de espuma LGE',
      'Extintores de Pó Químico ABC 12kg e Carretas 50kg',
    ],
    brigadeTactic:
      'Lançar espuma LGE suavemente contra o costado para formar manta estanque sem revolver a poça. Manter linhas de água em neblina para proteção térmica da equipe e resfriamento de tanques vizinhos.',
    externalSupportTrigger:
      'Fogo fora de controle em tanque de armazenamento de grande volume ou risco de explosão: acionar imediatamente Corpo de Bombeiros 193.',
    evacuationRouteDetails:
      'Evacuação em sentido perpendicular ao vento em direção ao PEE-01 (Portaria Principal).',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Parada imediata de bombeamento e fecho de válvulas', responsibleRole: 'Operador de Carregamento' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'Acionamento do Ramal 3737 e aviso ao CAE', responsibleRole: 'Qualquer Funcionário' },
      { id: 'c3', order: 3, timeframe: '2 - 4 min', action: 'Brigada dividida nos 3 grupos (Combate, Salvamento, Abandono)', responsibleRole: 'Coordenador da Brigada' },
      { id: 'c4', order: 4, timeframe: '3 - 8 min', action: 'Início da aplicação de espuma LGE e linhas de resfriamento', responsibleRole: 'Grupo de Combate' },
      { id: 'c5', order: 5, timeframe: '8 - 120 min', action: 'Rondas periódicas a cada 30 min por 2h após o controle', responsibleRole: 'Brigadistas Designados' },
    ],
    lastReviewDate: '28/08/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente de SST',
  },
  {
    id: 'pc-ind-deposito-bagaco',
    division: 'industria',
    code: 'SST.AN-044 / §09',
    title: 'Incêndio em Depósito e Esteiras de Bagaço de Cana',
    subArea: 'Pátio de Bagaço & Calhas Alimentadoras de Caldeiras',
    scenarioDescription:
      'Princípio de combustão profunda em pilhas de bagaço ou fogo em esteiras transportadoras com risco de propagação para a casa de força e caldeiras.',
    riskRating: 'alto',
    triggerEvent:
      'Fumaça densa em pilha de bagaço, superaquecimento de esteira ou alarme sonoro.',
    isolationRadiusMeters: 80,
    containmentProcedures: [
      'Os brigadistas iniciarão imediatamente o combate ao fogo utilizando os hidrantes da área e/ou caminhão-pipa.',
      'Comunicar imediatamente o Coordenador da Brigada sobre a situação.',
      'O Coordenador avalia e define se os recursos são suficientes ou se solicita apoio de outros brigadistas, equipe de apoio e Gerente da Unidade.',
      'Acionamento do serviço médico de emergência (Ambulatório) informando localização e materiais envolvidos.',
      'Atendimento e socorro a eventuais vítimas com remoção em ambulância.',
      'Evacuação da área caso determinado pelo Coordenador, orientada pelos brigadistas.',
      'Remoção de camada superficial de bagaço queimado com pá-carregadeira e rescaldo contínuo com água em jato neblinado.',
    ],
    shutdownProcedures: [
      'Parada das esteiras de bagaço no botão de emergência local.',
      'Interrupção da alimentação de bagaço para as caldeiras.',
      'Corte de energia elétrica dos acionamentos mecânicos com o Eletricista de Plantão.',
    ],
    requiredPPEAndEquipment: [
      'Óculos de segurança e protetor facial contra partículas',
      'Máscara de proteção contra poeira e fumaça',
      'Linhas de hidrantes com mangueiras tipo 4 reforçadas e esguichos reguláveis',
      'Caminhões-pipa com moto-bomba e canhão monitor',
    ],
    brigadeTactic:
      'Revolver o bagaço atingido com maquinário pesado enquanto a água penetra no miolo da pilha. O bagaço queima em brasa interna e exige encharcamento profundo para evitar reignição.',
    externalSupportTrigger:
      'Se o fogo atingir mais de 25% da pilha principal de bagaço a céu aberto ou ameaçar estruturas de caldeiras: acionar Bombeiros 193.',
    evacuationRouteDetails:
      'Deslocamento pelo pátio de moenda em direção ao PEE-02 (Balança de Cana).',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 2 min', action: 'Parada da esteira e acionamento dos hidrantes locais', responsibleRole: 'Operador de Caldeira / Pátio' },
      { id: 'c2', order: 2, timeframe: '1 - 3 min', action: 'Aviso ao Coordenador da Brigada e Ambulatório', responsibleRole: 'Brigadista' },
      { id: 'c3', order: 3, timeframe: '3 - 8 min', action: 'Chegada do caminhão-pipa e ataque em pinça', responsibleRole: 'Motorista Pipa / Brigada' },
      { id: 'c4', order: 4, timeframe: '8 - 25 min', action: 'Reviramento de bagaço com máquina e rescaldo', responsibleRole: 'Operador de Pá / Brigada' },
    ],
    lastReviewDate: '28/08/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente Industrial',
  },
  {
    id: 'pc-ind-quimicos-acidos',
    division: 'industria',
    code: 'SST.AN-044 / §35',
    title: 'Vazamento em Tanques de Soda Cáustica e Ácido Fosfórico / Sulfúrico',
    subArea: 'Tratamento de Caldo, Clarificação e Regeneração de Resinas',
    scenarioDescription:
      'Vazamento em válvulas, tubulações ou costado de tanques de produtos corrosivos na safra ou entressafra. Uso de batoques de madeira e martelo do kit de emergência e neutralização controlada.',
    riskRating: 'critico',
    triggerEvent:
      'Gotejamento em conexões, névoa ácida visível ou rompimento de flange.',
    isolationRadiusMeters: 40,
    containmentProcedures: [
      'Operador verifica se a válvula de saída do tanque está fechada. Caso não esteja, proceder ao seu imediato fechamento.',
      'Acionar o Brigadista e avisar imediatamente os Técnicos de Segurança do Trabalho.',
      'O vazamento deve ser contido com o auxílio do Kit de Emergência Química.',
      'Caso o vazamento seja nas juntas das bombas: acionar a bomba reserva e fechar válvulas de entrada e saída da bomba avariada.',
      'Caso não haja bomba reserva: substituir bomba ou estancar imediatamente.',
      'Em tubulações e conexões: proceder o reaperto.',
      'No costado do tanque: utilizar BATOQUES DE MADEIRA e MARTELO existentes no Kit de Emergências para estancar o ponto de vazamento.',
      'Se não houver contenção: providenciar veículo-tanque químico para sucção e transferência do produto retirando através das bombas.',
      'Após o atendimento: análise crítica e destinação dos resíduos em tambores identificados para descarte ambiental.',
    ],
    shutdownProcedures: [
      'Fechamento de válvulas de alimentação e descarga do produto.',
      'Bloqueio com cadeado e etiqueta (LOTO).',
    ],
    requiredPPEAndEquipment: [
      'Roupa especial de PVC / Neoprene resistente a ácidos e álcalis',
      'Luvas de borracha nitrílica cano longo',
      'Protetor facial panorâmico e botas de PVC cano longo',
      'Máscara respiratória facial inteira com filtro para vapores ácidos',
      'Kit de emergência química com batoques de madeira, martelo e mantas absorventes',
    ],
    brigadeTactic:
      'Nunca jogar água direta em jato sólido sobre poça concentrada de ácido sulfúrico (reação exotérmica violenta). Conter a mancha com areia/manta absorvente e lavar a área somente após neutralização.',
    externalSupportTrigger:
      'Rompimento total do tanque com transbordamento da bacia de contenção química.',
    evacuationRouteDetails:
      'Afastamento a montante do vento em direção ao PEE-03.',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Fechamento da válvula de saída do tanque', responsibleRole: 'Operador do Setor' },
      { id: 'c2', order: 2, timeframe: '1 - 3 min', action: 'Acionamento do Brigadista e Segurança do Trabalho', responsibleRole: 'Operador' },
      { id: 'c3', order: 3, timeframe: '2 - 5 min', action: 'Batoques de madeira aplicados no tanque', responsibleRole: 'Brigadista com Kit' },
      { id: 'c4', order: 4, timeframe: '5 - 15 min', action: 'Bomba reserva acionada ou transferência para caminhão-tanque', responsibleRole: 'Manutenção / Técnico' },
    ],
    lastReviewDate: '28/08/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Sustentabilidade',
  },
  {
    id: 'pc-ind-subestacao',
    division: 'industria',
    code: 'SST.AN-044 / §28',
    title: 'Princípio de Incêndio e Resgate em Subestação Elétrica 13.8kV',
    subArea: 'Subestação Principal & Casa de Força',
    scenarioDescription:
      'Arco elétrico ou aquecimento de transformador a óleo. Desenergização prévia mandatória alinhada com a Casa de Força e concessionária antes de qualquer aproximação da brigada.',
    riskRating: 'critico',
    triggerEvent:
      'Sinal sonoro contínuo/intermitente na central de alarme de incêndio ou ponto de aquecimento na instrumentação de campo.',
    isolationRadiusMeters: 50,
    containmentProcedures: [
      'Alarme de emergência acionado a partir da central localizada na sala da Brigada.',
      'O brigadista ou técnico de segurança contata imediatamente a Casa de Força para inspeção in loco na subestação.',
      'Um técnico permanece na Casa de Força enquanto outro se desloca até a subestação.',
      'Constatado princípio de incêndio: o técnico de operação aciona a Casa de Força para DESENERGIZAÇÃO TOTAL da instalação.',
      'Qualquer acesso para resgate de vítimas ou combate só pode ocorrer após completa desenergização confirmada.',
      'Combate inicial através dos sistemas de proteção fixos e extintores de CO2.',
      'Linhas de mangueira com neblina somente para resfriamento de carcaça pós-desenergização confirmada.',
    ],
    shutdownProcedures: [
      'Abertura de disjuntores de média tensão (13.8 kV) na Casa de Força.',
      'Abertura de chave seccionadora geral e aterramento de segurança.',
    ],
    requiredPPEAndEquipment: [
      'Vestimenta antichama para arco elétrico (ATPV 40 cal/cm²)',
      'Luvas de borracha isolantes classe 2 (17.000 V) e luvas de cobertura',
      'Vara de manobra isolante de fibra de vidro',
      'Extintores de Gás Carbônico (CO2 6kg) e Carreta CO2 50kg',
    ],
    brigadeTactic:
      'Proibição absoluta de uso de água antes do laudo formal de desenergização do eletricista de plantão.',
    externalSupportTrigger:
      'Fogo propagado para transformadores a óleo de grande porte com óleo em combustão generalizada.',
    evacuationRouteDetails:
      'Saída pelas portas com barra antipânico em direção ao PEE-01.',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 2 min', action: 'Contato imediato entre brigada e Casa de Força', responsibleRole: 'Brigadista / Técnico SST' },
      { id: 'c2', order: 2, timeframe: '1 - 3 min', action: 'Inspeção in loco confirmando sinistro e desenergização', responsibleRole: 'Eletricista de Operação' },
      { id: 'c3', order: 3, timeframe: '2 - 4 min', action: 'Desligamento total e confirmação de tensão zero', responsibleRole: 'Operador Casa de Força' },
      { id: 'c4', order: 4, timeframe: '3 - 8 min', action: 'Combate com extintores de CO2 na área desenergizada', responsibleRole: 'Brigada de Incêndio' },
    ],
    lastReviewDate: '28/08/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Eletricista Responsável',
  },

  // =========================================================================
  // DIVISÃO 2: EMPACOTAMENTO (Doc Oficial: SST.AN-043 • Data: 28/08/2025)
  // =========================================================================
  {
    id: 'pc-emp-abandono-assari',
    division: 'empacotamento',
    code: 'SST.AN-043 / §01',
    title: 'Abandono de Área Geral - Unidade Empacotamento (Assari)',
    subArea: 'Galpões de Ensaque 1kg/5kg, Silos de Açúcar e Fábrica de Saneantes',
    scenarioDescription:
      'Procedimento de desocupação imediata em emergências no complexo de empacotamento Assari. Condução por Cabeça de Fila, controle de motoristas de empilhadeiras e conferência na Portaria Assari (Ramal 1914).',
    riskRating: 'critico',
    triggerEvent:
      'Alarme de emergência agudo, ordem verbal da Brigada ou deflagração em esteiras/silos.',
    isolationRadiusMeters: 100,
    containmentProcedures: [
      'Acionar imediatamente o ramal de emergência: Ramal 3737 / Rádio Canal 01 ou externo (65) 3332-3737.',
      'Acionar a Segurança do Trabalho da Planta Industrial via rádio, ramal e celular.',
      'Analisar gravidade e abrangência para decidir abandono geral ou parcial.',
      'Acionar sirene de alarme e conduzir integrantes pelo Cabeça de Fila até o Ponto de Encontro PEE-04.',
      'Operadores de empilhadeiras e transpaleteiras estacionam em local seguro sem obstruir passagens, desligam motor, deixam a chave na ignição e dirigem-se ao ponto seguro.',
      'Contagem de pessoal no Ponto de Encontro com auxílio do vigilante da Portaria Assari (Ramal 1914) para conferência de visitantes.',
      'Em caso de faltoso, equipe de Busca e Resgate entra em ação imediatamente.',
    ],
    shutdownProcedures: [
      'Parada geral de esteiras de alimentação e ensaque no botão cogumelo.',
      'Desligamento dos compressores de ar e exaustores.',
      'Corte de energia elétrica na subestação de distribuição Assari.',
    ],
    requiredPPEAndEquipment: [
      'Rotas de fuga demarcadas com placas fotoluminescentes',
      'Portas com barras antipânico inspecionadas',
      'Megafones e rádios transceptores Canal 01 / 05',
    ],
    brigadeTactic:
      'Evacuar o galpão em até 3 minutos. Proibir estritamente retorno para resgate de mochilas ou pertences pessoais.',
    externalSupportTrigger:
      'Deflagração estrutural com colapso de divisórias ou aprisionamento de colaboradores.',
    evacuationRouteDetails:
      'Saídas laterais sinalizadas direcionando para o PEE-04 (Pátio Externo do Empacotamento).',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Ramal 3737 e Portaria Assari (1914) acionados', responsibleRole: 'Qualquer Funcionário' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'Alarme sonoro agudo acionado', responsibleRole: 'Segurança do Trabalho' },
      { id: 'c3', order: 3, timeframe: '2 - 4 min', action: 'Evacuação ordenada até o PEE-04 pelo Cabeça de Fila', responsibleRole: 'Líder / Brigadista Local' },
      { id: 'c4', order: 4, timeframe: '4 - 7 min', action: 'Contagem de pessoal e conferência de visitantes', responsibleRole: 'Membro Brigada / Portaria' },
    ],
    lastReviewDate: '28/08/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente de Empacotamento',
  },
  {
    id: 'pc-emp-incendio-acucar',
    division: 'empacotamento',
    code: 'SST.AN-043 / §05',
    title: 'Incêndio em Armazenamento de Açúcar e Fábrica de Saneantes',
    subArea: 'Silos Verticais, Depósitos de Big Bags e Armazém de Fardos',
    scenarioDescription:
      'Superaquecimento de rolamentos em esteiras, curto-circuito em maquinário ou queima de paletes de madeira com propagação para embalagens de açúcar e saneantes. Risco de fumaça densa e caramelização.',
    riskRating: 'alto',
    triggerEvent:
      'Fumaça espessa no armazém, cheiro forte de queimado ou sensor óptico de duto disparado.',
    isolationRadiusMeters: 60,
    containmentProcedures: [
      'Acionar o Ramal 3737 / Rádio Canal 01 informando o foco.',
      'Acionar botoeira de alarme manual (martelinho quebra-vidro).',
      'Desligamento imediato do fornecimento elétrico do setor com o Eletricista de Plantão.',
      'Ataque inicial com extintores de Pó ABC ou Água Pressurizada.',
      'Armar linhas de mangueiras com esguicho regulável dos hidrantes HID-EMP-01 e HID-EMP-02.',
      'Evacuar o pavilhão e abrir portões de doca para ventilação da fumaça.',
      'Apoiar equipe do Corpo de Bombeiros caso acionada e iniciar rescaldo criterioso.',
      'Limpeza de resíduos de queima e acondicionamento em tambores identificados para descarte ambiental.',
    ],
    shutdownProcedures: [
      'Desligamento dos motores de acionamento das ensacadeiras.',
      'Abertura de chaves e disjuntores gerais no painel elétrico central.',
    ],
    requiredPPEAndEquipment: [
      'Capacete de proteção com jugular e óculos ampla visão',
      'Máscara respiratória com filtro contra fumaça e particulados',
      'Linhas de hidrantes com mangueiras tipo 2 comercial e esguicho regulável',
      'Extintores de Pó Químico ABC 12kg',
    ],
    brigadeTactic:
      'Combater o foco em pinça, resfriando as estruturas metálicas de cobertura para evitar deformação por calor. Não direcionar jato sólido de alta pressão sobre pó acumulado.',
    externalSupportTrigger:
      'Propagação do fogo para pilhas superiores de paletes atingindo o forro metálico do armazém.',
    evacuationRouteDetails:
      'Corredor central de docas de carregamento em direção ao PEE-04.',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Botoeira de alarme e Ramal 3737 acionados', responsibleRole: 'Operador de Área' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'Energia elétrica interrompida no disjuntor', responsibleRole: 'Eletricista de Plantão' },
      { id: 'c3', order: 3, timeframe: '2 - 5 min', action: 'Combate com extintores ABC e hidrantes locais', responsibleRole: 'Brigadistas Locais' },
      { id: 'c4', order: 4, timeframe: '5 - 15 min', action: 'Rescaldo de paletes e remoção de resíduos para tambores', responsibleRole: 'Equipe de Brigada / Sustentabilidade' },
    ],
    lastReviewDate: '28/08/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente de SST',
  },

  // =========================================================================
  // DIVISÃO 3: AGRÍCOLA / GMA / ADM / POSTO (Doc Oficial: SST.AN-042 • Data: 02/09/2025)
  // =========================================================================
  {
    id: 'pc-agr-incendio-colhedora',
    division: 'adm_agricola',
    code: 'SST.AN-042 / §09',
    title: 'Incêndio em Colhedora e Tratores no Campo',
    subArea: 'Frentes de Colheita Mecanizada de Cana & Pátios de Transbordo',
    scenarioDescription:
      'Princípio de fogo em motor, mangueiras hidráulicas ou palha acumulada em colhedora de cana. Protocolo com desligamento do motor, alarme sonoro, extintor da máquina, sistema automático de 20kg de pó ABC e caminhão-pipa obrigatório.',
    riskRating: 'critico',
    triggerEvent:
      'Cheiro de óleo aquecido, fumaça no compartimento do motor ou labaredas sob o chassi.',
    isolationRadiusMeters: 50,
    containmentProcedures: [
      'IDENTIFICAÇÃO E ALERTA: O tratorista/operador, ao identificar o princípio de incêndio, deve desligar imediatamente o motor da máquina e sinalizar a emergência por rádio ou buzina.',
      'Solicitar auxílio imediato do brigadista (motorista do caminhão-pipa que acompanha obrigatoriamente toda frente agrícola).',
      'COMBATE INICIAL: O operador, utilizando o extintor portátil da máquina, inicia o combate ao fogo.',
      'ACIONAMENTO DO SISTEMA AUTOMÁTICO: Caso necessário, o sistema automático de extinção (cilindro de 20 kg de pó ABC) pode ser acionado.',
      'AÇÃO DO BRIGADISTA: O brigadista (motorista do caminhão-pipa) dá continuidade ao combate utilizando a mangueira e canhão do caminhão-tanque caso o fogo não seja totalmente debelado.',
      'AVALIAÇÃO E COMUNICAÇÃO: Ambos avaliam os danos e comunicam a liderança via rádio sobre o ocorrido e a possibilidade de novos focos.',
      'Resfriamento de pneus e mangueiras hidráulicas para evitar reignição por calor residual.',
    ],
    shutdownProcedures: [
      'Desligamento imediato da chave geral da máquina.',
      'Corte de alimentação de diesel da bomba injetora.',
    ],
    requiredPPEAndEquipment: [
      'Extintor portátil de Pó Químico ABC da colhedora',
      'Sistema fixo de extinção com cilindro de 20kg de Pó ABC',
      'Caminhão bombeiro pipa com moto-bomba e canhão de alta pressão',
      'Camisa de brim manga longa, perneira de couro e óculos com proteção UV',
    ],
    brigadeTactic:
      'Abafar a base do motor com pó químico e descarregar água do pipa para resfriamento de ferragens e pneus. Nunca jogar água pressurizada direta sobre óleo hidráulico aquecido sem antes abafar com pó.',
    externalSupportTrigger:
      'Fogo propagando para o canavial ao redor com ventos fortes.',
    evacuationRouteDetails:
      'Afastamento a pé por carreador limpo em direção à área já colhida / aceiro.',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Motor desligado e alerta sonoro/buzina emitido', responsibleRole: 'Operador de Colhedora' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'Extintor da máquina e cilindro de 20kg acionados', responsibleRole: 'Operador' },
      { id: 'c3', order: 3, timeframe: '1 - 3 min', action: 'Caminhão-pipa posicionado e jato d\'água iniciado', responsibleRole: 'Motorista Pipa / Brigadista' },
      { id: 'c4', order: 4, timeframe: '3 - 8 min', action: 'Resfriamento de chassi/pneus e comunicação ao gestor', responsibleRole: 'Brigadista Agrícola' },
    ],
    lastReviewDate: '02/09/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente Executivo',
  },
  {
    id: 'pc-agr-incendio-canavial',
    division: 'adm_agricola',
    code: 'SST.AN-042 / §09.2',
    title: 'Incêndio em Canavial, Soja e Vegetações Florestais',
    subArea: 'Talhões de Cana-de-Açúcar, Áreas de Preservação (APP / RL) e Soja',
    scenarioDescription:
      'Propagação descontrolada de fogo em palhada de cana ou lavouras com ventos fortes. Comunicação ao Controle de Tráfego, deslocamento dos caminhões-pipa mais próximos, escalonamento com Sustentabilidade e Jurídico e apoio externo.',
    riskRating: 'critico',
    triggerEvent:
      'Fumaça densa em talhão agrícola, alerta da torre de monitoramento ou rádio de operadores.',
    isolationRadiusMeters: 400,
    containmentProcedures: [
      'Qualquer funcionário que identificar um princípio de incêndio deve comunicar imediatamente ao operador do Controle de Tráfego, à Segurança Patrimonial ou ao brigadista (motorista do caminhão-pipa) por rádio, telefone ou pessoalmente.',
      'ACIONAMENTO DO BRIGADISTA: O Controle de Tráfego aciona imediatamente o caminhão-pipa mais próximo do local do incêndio e informa o gestor do processo agrícola.',
      'ESCALONAMENTO: O Gestor, em conjunto com os setores de Sustentabilidade e Jurídico, define as ações a serem tomadas e a necessidade de comunicar órgãos externos.',
      'COMBATE AO INCÊNDIO: O brigadista avalia a situação e inicia o combate utilizando caminhão-pipa e mangueiras.',
      'Em casos de grandes proporções: acionar caminhões adicionais de outras frentes e solicitar auxílio do Corpo de Bombeiros Militar (193).',
      'Construção de aceiros emergenciais com trator de esteira e grade pesada na rota de avanço das chamas.',
      'Rescaldo obrigatório em toda a extensão do perímetro para garantir ausência de brasas.',
    ],
    shutdownProcedures: [
      'Retirada de colhedoras, tratores e comboios da frente de colheita.',
      'Interrupção de tráfego em carreadores vicinais tomados por fumaça.',
    ],
    requiredPPEAndEquipment: [
      'Caminhões bombeiro pipa de 15.000 L a 20.000 L',
      'Abafadores de incêndio florestal e bombas costais de água 20L',
      'Tratores com grade pesada para abertura de aceiros',
      'Perneiras de couro, óculos com proteção UV e camisa de brim manga longa',
    ],
    brigadeTactic:
      'Nunca atacar a "cabeça do fogo" (frente a favor do vento). Atacar sempre pelas laterais (flancos), estreitando o incêndio contra aceiros largos ou estradas.',
    externalSupportTrigger:
      'Fogo ameaçando reservas ambientais permanentes (APP/RL), residências rurais ou rodovias MT/BR: acionar Bombeiros 193.',
    evacuationRouteDetails:
      'Fuga motorizada pelas estradas principais em direção oposta à fumaça até a Base Agrícola / PEE-02.',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 2 min', action: 'Comunicação ao Controle de Tráfego via Rádio Canal 01', responsibleRole: 'Qualquer Funcionário' },
      { id: 'c2', order: 2, timeframe: '2 - 4 min', action: 'Controle de Tráfego despacha os caminhões-pipa mais próximos', responsibleRole: 'Operador de Tráfego' },
      { id: 'c3', order: 3, timeframe: '4 - 8 min', action: 'Abertura de aceiro emergencial com trator de esteira', responsibleRole: 'Operador de Máquina Pesada' },
      { id: 'c4', order: 4, timeframe: '8 - 30 min', action: 'Ataque pelos flancos e rescaldo do perímetro', responsibleRole: 'Brigadistas Florestais' },
    ],
    lastReviewDate: '02/09/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente Executivo',
  },
  {
    id: 'pc-agr-defensivos-agricolas',
    division: 'adm_agricola',
    code: 'SST.AN-042 / §10',
    title: 'Incêndio em Áreas de Armazenamento de Defensivos Agrícolas',
    subArea: 'Depósito Central de Agroquímicos / Almoxarifado GMA',
    scenarioDescription:
      'Princípio de incêndio em pavilhão de defensivos químicos agrícolas. PROIBIÇÃO CRÍTICA DE USO DE ÁGUA: O combate deve ser realizado exclusivamente com extintores adequados para evitar contaminação química e vapores letais.',
    riskRating: 'critico',
    triggerEvent:
      'Visão de chamas no galpão de defensivos, alarme de fumaça ou aquecimento em pilhas de embalagens.',
    isolationRadiusMeters: 200,
    containmentProcedures: [
      'Acionar imediatamente o Ramal 3737 / Rádio Canal 01 e a Portaria GMA.',
      'REQUISITO OBRIGATÓRIO SST.AN-042: Em áreas de armazenamento de defensivos agrícolas, o combate deverá ser realizado exclusivamente com o uso de extintores adequados (Pó Químico ABC ou CO2).',
      'EM NENHUMA CIRCUNSTÂNCIA este tipo de incêndio deverá ser combatido com água, desde que a extinção seja viável com os extintores disponíveis (evita formação de lamas tóxicas e contaminação de lençóis freáticos).',
      'Caso os recursos se revelem insuficientes: evacuar toda a vizinhança a favor do vento e comunicar imediatamente o Corpo de Bombeiros (193) informando as classes químicas envolvidas.',
      'Fechar ralos, grelhas e diques de contenção ambiental para evitar escoamento de resíduos.',
      'Após a emergência, acondicionamento dos resíduos em tambores lacrados e destinação pelo setor de Sustentabilidade.',
    ],
    shutdownProcedures: [
      'Desligamento do disjuntor elétrico geral do depósito de defensivos.',
      'Fechamento das comportas das canaletas de retenção química.',
    ],
    requiredPPEAndEquipment: [
      'Máscara facial completa com filtro combinado para defensivos e gases tóxicos',
      'Roupa impermeável tipo Tyvek nível B/C',
      'Extintores de Pó Químico ABC de 12kg e Carretas de 50kg',
      'Kits de contenção ambiental (bocais, mantas absorventes e areia)',
    ],
    brigadeTactic:
      'Combate rápido na base do foco exclusivamente com pó químico. Se a temperatura for excessiva e os extintores não debelarem o foco, recuar imediatamente devido ao risco de gases tóxicos mortais.',
    externalSupportTrigger:
      'Fogo generalizado em tambores e embalagens plásticas de defensivos agrícolas: acionar Bombeiros 193.',
    evacuationRouteDetails:
      'Evacuação em sentido transversal ao vento em direção ao PEE-02.',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Ramal 3737 acionado e aviso de fogo em defensivos', responsibleRole: 'Operador / Almoxarife' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'PROIBIÇÃO DE ÁGUA REFORÇADA: Ataque com extintores ABC', responsibleRole: 'Brigadistas' },
      { id: 'c3', order: 3, timeframe: '2 - 4 min', action: 'Fechamento de ralos e diques de contenção ambiental', responsibleRole: 'Sustentabilidade / Brigada' },
      { id: 'c4', order: 4, timeframe: '4 - 15 min', action: 'Isolamento de 200m contra vapores tóxicos', responsibleRole: 'Segurança Patrimonial' },
    ],
    lastReviewDate: '02/09/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente de Meio Ambiente',
  },
  {
    id: 'pc-agr-vazamento-defensivos',
    division: 'adm_agricola',
    code: 'SST.AN-042 / §28',
    title: 'Vazamento e Derramamento de Defensivos Agrícolas (Sólidos/Líquidos)',
    subArea: 'Almoxarifado de Defensivos, Pátio de Preparo de Calda & Transporte',
    scenarioDescription:
      'Rompimento de embalagens, tombamento de caminhão ou vazamento durante abastecimento de pulverizadores. Contenção com kit ambiental, isolamento de ralos/bocas de lobo e comunicação imediata à Sustentabilidade.',
    riskRating: 'alto',
    triggerEvent:
      'Líquido ou pó derramado de defensivo em pátio, canaletas ou solo.',
    isolationRadiusMeters: 40,
    containmentProcedures: [
      'Identificação do vazamento pelo motorista ou funcionário do almoxarifado.',
      'Comunicar o fato com urgência aos brigadistas no local e ao Gestor/Líder do setor.',
      'Garantir isolamento da área e consultar imediatamente a Ficha de Emergência do produto.',
      'Fazer retenção do defensivo agrícola utilizando os kits de emergência (cordões e mantas absorventes).',
      'FECHAR OU ISOLAR RALOS, GRELHAS E BOCAS DE LOBO PRÓXIMAS.',
      'Comunicar ao Controle de Tráfego e Técnico de Segurança do Trabalho para solicitar socorro externo se necessário.',
      'CASO HAJA DERRAMAMENTO EM CORPO D’ÁGUA: comunicar imediatamente pelo rádio/telefone ao Controle de Tráfego e SST, que avisam imediatamente o Gerente de Meio Ambiente para definir ações emergenciais.',
      'A capa superficial do solo contaminado deve ser removida mecanicamente e acondicionada em tambores identificados para descarte ambiental.',
    ],
    shutdownProcedures: [
      'Fechamento imediato de válvulas de tanques de pulverização ou abastecimento.',
      'Bloqueio do acesso de veículos à área contaminada.',
    ],
    requiredPPEAndEquipment: [
      'Luvas de borracha nitrílica de alta espessura',
      'Óculos de proteção ampla visão e respirador com filtro para defensivos',
      'Kit de contenção ambiental com cordões absorventes, almofadas e pá anti-faísca',
      'Tambores metálicos identificados para resíduos químicos perigosos (Classe I)',
    ],
    brigadeTactic:
      'Cercar o líquido antes que atinja a rede de águas pluviais ou terra desprotegida. Recolher com material absorvente e acondicionar nos tambores específicos.',
    externalSupportTrigger:
      'Vazamento de grande porte com atingimento de rios, córregos ou canais de drenagem: acionar IBAMA e Defesa Civil.',
    evacuationRouteDetails:
      'Afastamento a pé por área limpa em direção ao PEE-02.',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Ralos, grelhas e bocas de lobo bloqueados com mantas', responsibleRole: 'Operador / Brigadista' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'Ficha de emergência consultada e área isolada', responsibleRole: 'Técnico de SST' },
      { id: 'c3', order: 3, timeframe: '2 - 5 min', action: 'Retenção do produto com cordões do kit de emergência', responsibleRole: 'Brigadistas' },
      { id: 'c4', order: 4, timeframe: '5 - 20 min', action: 'Remoção mecânica do solo contaminado para tambores', responsibleRole: 'Equipe de Sustentabilidade' },
    ],
    lastReviewDate: '02/09/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente de Meio Ambiente',
  },
  {
    id: 'pc-adm-abandono-gma',
    division: 'adm_agricola',
    code: 'SST.AN-042 / §01',
    title: 'Abandono de Área - GMA, Administrativo e Posto de Combustível',
    subArea: 'Oficinas Mecânicas GMA, Prédio ADM, Posto Interno e Refeitório',
    scenarioDescription:
      'Desocupação coordenada em princípios de incêndio, vazamento em tanques do posto ou sinistros estruturais no complexo administrativo e oficinas.',
    riskRating: 'moderado',
    triggerEvent:
      'Alarme sonoro de emergência agudo, botoeira manual acionada ou aviso verbal da Brigada.',
    isolationRadiusMeters: 40,
    containmentProcedures: [
      'Acionar ramal de emergência (Ramal 3737 / Rádio Canal 01 ou externo 65 3332-3737).',
      'Acionar a Segurança do Trabalho da planta ADM/Agrícola/GMA/Posto de Combustível.',
      'Operador da Portaria Administrativo (Ramal 3564) controla o fluxo de portaria e visitantes.',
      'Abandonar a área seguindo orientação da Brigada pelas rotas de fuga sinalizadas com destino ao PEE-05.',
      'Desligamento dos quadros elétricos pelo Eletricista de Plantão.',
      'Contagem de pessoal realizada no Ponto de Encontro com conferência de lista de visitantes.',
    ],
    shutdownProcedures: [
      'Desligamento do sistema de ar-condicionado central.',
      'Desarme do quadro de distribuição elétrica geral do prédio.',
      'Botoeira de emergência de corte de combustível no posto interno.',
    ],
    requiredPPEAndEquipment: [
      'Extintores portáteis de CO2 6kg e Pó ABC 12kg',
      'Megafones portáteis de evacuação',
      'Placas de rota de fuga e iluminação de emergência autônoma',
    ],
    brigadeTactic:
      'Varredura rápida de salas de reunião, banheiros e copas antes de deixar o edifício. Conduzir os colaboradores sem correria até o PEE-05.',
    externalSupportTrigger:
      'Fogo propagado pelo forro de gesso ou divisórias com perda de visibilidade nos corredores.',
    evacuationRouteDetails:
      'Saídas frontal e posterior pelas portas de emergência em direção ao PEE-05 (Estacionamento ADM).',
    checklist: [
      { id: 'c1', order: 1, timeframe: '0 - 1 min', action: 'Ramal 3737 acionado e alarme de emergência disparado', responsibleRole: 'Recepção / Qualquer Integrante' },
      { id: 'c2', order: 2, timeframe: '1 - 2 min', action: 'Desligamento elétrico e ar-condicionado central', responsibleRole: 'Técnico de Manutenção' },
      { id: 'c3', order: 3, timeframe: '2 - 4 min', action: 'Evacuação completa guiada pelos brigadistas até o PEE-05', responsibleRole: 'Brigada Local' },
      { id: 'c4', order: 4, timeframe: '4 - 6 min', action: 'Conferência nominal de todos os colaboradores', responsibleRole: 'Líder ADM / Portaria' },
    ],
    lastReviewDate: '02/09/2025',
    responsibleManager: 'Coordenador de Segurança do Trabalho / Gerente de SST',
  },
];
