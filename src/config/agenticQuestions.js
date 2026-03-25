// ─── ZERO PREVIEW — AGENTIC QUESTIONS BY NICHE ──────────────────────────────
// Smart questions that the system asks before generating.
// Transforms "app de barbearia" into a complete business brief.

export const AGENTIC_QUESTIONS = {
  beauty: [
    "E salao completo ou especializado (unha, sobrancelha, cabelo)?",
    "Quantas profissionais trabalham?",
    "Vende produtos alem dos servicos?"
  ],
  food: [
    "Delivery, presencial ou os dois?",
    "Tem cardapio fixo ou rotativo?",
    "Quantas mesas aproximadamente?"
  ],
  finance: [
    "E controle pessoal ou de empresa?",
    "Precisa de graficos de investimento?",
    "Importa dados de planilha?"
  ],
  fitness: [
    "Quais modalidades oferece?",
    "Aulas em grupo ou personal trainer?",
    "Controla frequencia dos alunos?"
  ],
  church: [
    "Quantos membros na congregacao?",
    "Tem celulas ou grupos de estudo?",
    "Controla dizimos e ofertas?"
  ],
  retail: [
    "Loja fisica, online ou os dois?",
    "Controla estoque?",
    "Quantos produtos em media?"
  ],
  construction: [
    "Faz obras residenciais ou comerciais?",
    "Precisa de controle de orcamentos?",
    "Quantos projetos simultaneos?"
  ],
  education: [
    "Escola, curso livre ou faculdade?",
    "Controla notas e frequencia?",
    "Quantos alunos em media?"
  ],
  health: [
    "Qual especialidade medica?",
    "Convenios ou particular?",
    "Precisa de prontuario eletronico?"
  ],
  creative: [
    "Agencia, freelancer ou estudio?",
    "Quantos clientes ativos?",
    "Precisa de portfolio online?"
  ],
  law: [
    "Quantos advogados no escritorio?",
    "Quais areas de atuacao?",
    "Controla prazos processuais?"
  ],
  vet: [
    "Atende animais de grande ou pequeno porte?",
    "Tem internacao?",
    "Controla carteira de vacinacao?"
  ],
  languages: [
    "Quais idiomas ensina?",
    "Turmas ou aulas particulares?",
    "Niveis iniciante a avancado?"
  ],
  petshop: [
    "Tem banho e tosa?",
    "Vende racao e acessorios?",
    "Faz agendamento online?"
  ],
  pharmacy: [
    "Farmacia popular ou drogaria?",
    "Tem manipulacao?",
    "Controla estoque de medicamentos?"
  ],
  realestate: [
    "Venda, aluguel ou os dois?",
    "Quantos imoveis em carteira?",
    "Faz avaliacao de imoveis?"
  ],
  ministry: [
    "E ONG, ministerio ou projeto social?",
    "Tem voluntarios cadastrados?",
    "Controla doacoes?"
  ],
  automotive: [
    "Mecanica geral ou especializada?",
    "Faz orcamento antes do servico?",
    "Controla pecas em estoque?"
  ],
  events: [
    "Casamentos, corporativos ou os dois?",
    "Tem cardapio proprio?",
    "Quantos eventos por mes?"
  ],
  crafts: [
    "Vende online ou presencial?",
    "Faz sob encomenda?",
    "Quais materiais principais?"
  ],
  generic: [
    "Me conta mais sobre seu negocio",
    "Qual o maior desafio hoje?",
    "Quem sao seus clientes principais?"
  ],
};

// Detect niche from user's first message (reuses guessNicheLocal logic)
export function detectNicheFromMessage(msg) {
  const p = msg.toLowerCase();
  const map = [
    [["barbearia", "barbeiro", "corte de cabelo"], "beauty"],
    [["salao", "beleza", "cabeleir", "maquia", "unha"], "beauty"],
    [["restaurante", "lanchonete", "pizzaria", "cardapio"], "food"],
    [["banco", "financ", "investim", "fintech"], "finance"],
    [["academia", "fitness", "crossfit", "personal", "treino"], "fitness"],
    [["igreja", "culto", "congreg", "dizimo"], "church"],
    [["loja", "varejo", "comercio", "estoque"], "retail"],
    [["construt", "obra", "engenharia"], "construction"],
    [["escola", "educac", "faculdade", "cursinho"], "education"],
    [["clinica", "hospital", "medic", "saude"], "health"],
    [["agencia", "design", "marketing", "criativ"], "creative"],
    [["advog", "juridic", "escritorio", "direito"], "law"],
    [["veterinar", "vet", "animal"], "vet"],
    [["idioma", "ingles", "espanhol", "lingua"], "languages"],
    [["petshop", "pet shop", "racao", "banho e tosa"], "petshop"],
    [["farmacia", "drogaria", "medicament"], "pharmacy"],
    [["imobiliaria", "corretor", "aluguel", "imovel"], "realestate"],
    [["ong", "voluntari", "social", "ministerio"], "ministry"],
    [["mecanica", "oficina", "automovel", "carro"], "automotive"],
    [["buffet", "evento", "festa", "casamento"], "events"],
    [["artesanato", "handmade", "atelie", "croche"], "crafts"],
  ];
  for (const [keywords, id] of map) {
    if (keywords.some(k => p.includes(k))) return id;
  }
  return "generic";
}

// Build a rich prompt from the briefing
export function buildBriefingPrompt(niche, answers, originalMessage) {
  const lines = [`O usuario quer: ${originalMessage}`];
  lines.push(`Nicho detectado: ${niche}`);
  lines.push(`Informacoes coletadas:`);
  for (const [q, a] of Object.entries(answers)) {
    lines.push(`- ${q}: ${a}`);
  }
  lines.push(`\nCrie um app COMPLETO baseado nessas informacoes.`);
  lines.push(`Use os dados reais que o usuario forneceu nos mockups.`);
  lines.push(`Exemplo: se tem 3 profissionais, mostre 3 na tabela.`);
  return lines.join("\n");
}
