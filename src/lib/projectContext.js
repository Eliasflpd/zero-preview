/**
 * MECANISMO 4 — Contexto Persistente do Projeto
 *
 * "Arquivo de memoria" do projeto reinjetado em toda request.
 * O AI nunca "esquece" a arquitetura, arquivos existentes,
 * pacotes instalados ou convencoes do projeto.
 *
 * Persiste no localStorage por projectId.
 */

const STORAGE_PREFIX = 'zero-preview-project-context';

const DEFAULT_CONTEXT = {
  projectName: '',
  description: '',
  techStack: [
    'React 18',
    'TypeScript',
    'Vite',
    'Tailwind CSS',
    'shadcn/ui',
    'React Router v6',
    'Supabase (auth + database)',
  ],
  existingFiles: [],
  conventions: [
    'Componentes em PascalCase',
    'Hooks comecam com "use"',
    'Arquivos de tipos terminam em .types.ts',
    'Imports de @/ para src/',
    'Estilizacao com Tailwind CSS',
    'Formularios com react-hook-form',
    'Validacao com zod',
  ],
  installedPackages: [],
  supabaseTables: [],
  lastGeneratedFiles: [],
  errors: [],
};

class ProjectContextManager {
  constructor() {
    this._context = { ...DEFAULT_CONTEXT };
    this._projectId = null;
  }

  /**
   * Carrega contexto do localStorage para um projeto especifico.
   * @param {string} projectId
   * @returns {typeof DEFAULT_CONTEXT}
   */
  load(projectId) {
    this._projectId = projectId;
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}-${projectId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        this._context = { ...DEFAULT_CONTEXT, ...parsed };
      } else {
        this._context = { ...DEFAULT_CONTEXT };
      }
    } catch {
      this._context = { ...DEFAULT_CONTEXT };
    }
    return this._context;
  }

  /**
   * Salva contexto atual no localStorage.
   * @param {string} [projectId]
   */
  save(projectId) {
    const id = projectId || this._projectId;
    if (!id) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}-${id}`, JSON.stringify(this._context));
    } catch {
      // Storage cheio — tenta limpar entradas antigas
      this._cleanOldEntries();
      try {
        localStorage.setItem(`${STORAGE_PREFIX}-${id}`, JSON.stringify(this._context));
      } catch {
        // Nao tem jeito — ignora
      }
    }
  }

  /**
   * Atualiza campos do contexto.
   * @param {Partial<typeof DEFAULT_CONTEXT>} updates
   */
  update(updates) {
    this._context = { ...this._context, ...updates };
  }

  /**
   * Adiciona arquivo a lista de existentes e registra como ultimo gerado.
   * @param {string} filename
   */
  addGeneratedFile(filename) {
    if (!this._context.existingFiles.includes(filename)) {
      this._context.existingFiles.push(filename);
    }
    this._context.lastGeneratedFiles = [
      filename,
      ...this._context.lastGeneratedFiles.filter(f => f !== filename),
    ].slice(0, 10);
  }

  /**
   * Registra um erro no contexto para informar o AI no proximo retry.
   * @param {string} error
   */
  addError(error) {
    this._context.errors = [error, ...this._context.errors].slice(0, 5);
  }

  /**
   * Limpa erros (apos geracao bem-sucedida).
   */
  clearErrors() {
    this._context.errors = [];
  }

  /**
   * Adiciona pacote a lista de instalados.
   * @param {string} packageName
   */
  addPackage(packageName) {
    if (!this._context.installedPackages.includes(packageName)) {
      this._context.installedPackages.push(packageName);
    }
  }

  /**
   * Adiciona tabela Supabase ao contexto.
   * @param {string} tableName
   */
  addSupabaseTable(tableName) {
    if (!this._context.supabaseTables.includes(tableName)) {
      this._context.supabaseTables.push(tableName);
    }
  }

  /**
   * Gera o bloco de contexto que sera injetado no inicio de toda request.
   * @returns {string}
   */
  buildContextBlock() {
    const ctx = this._context;

    const sections = [
      '## CONTEXTO DO PROJETO',
      '',
      `**Nome:** ${ctx.projectName || 'Projeto React'}`,
      `**Descricao:** ${ctx.description || 'Aplicacao web React + TypeScript'}`,
      '',
      '**Stack tecnologica:**',
      ...ctx.techStack.map(t => `- ${t}`),
      '',
      '**Pacotes instalados alem do padrao:**',
      ctx.installedPackages.length > 0
        ? ctx.installedPackages.map(p => `- ${p}`).join('\n')
        : '- (padrao Vite + React)',
      '',
      '**Arquivos ja existentes no projeto:**',
      ctx.existingFiles.length > 0
        ? ctx.existingFiles.slice(-20).map(f => `- ${f}`).join('\n')
        : '- (projeto novo)',
      '',
    ];

    if (ctx.supabaseTables.length > 0) {
      sections.push(
        '**Tabelas Supabase disponiveis:**',
        ...ctx.supabaseTables.map(t => `- ${t}`),
        '',
      );
    }

    sections.push(
      '**Convencoes do projeto:**',
      ...ctx.conventions.map(c => `- ${c}`),
      '',
      '**IMPORTANTE:** Ao gerar codigo, respeite todos os arquivos existentes listados acima. Nao recrie arquivos que ja existem a menos que seja explicitamente solicitado.',
    );

    if (ctx.errors.length > 0) {
      sections.push(
        '',
        '**Erros recentes (CORRIGIR!):**',
        ...ctx.errors.map(e => `- ${e}`),
      );
    }

    return sections.join('\n');
  }

  /**
   * Retorna o contexto atual.
   * @returns {typeof DEFAULT_CONTEXT}
   */
  get() {
    return this._context;
  }

  /**
   * Limpa entradas de contexto antigas do localStorage.
   * @private
   */
  _cleanOldEntries() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    // Remove as mais antigas (mantem as 5 mais recentes e impossivel saber a ordem, remove metade)
    const half = Math.floor(keysToRemove.length / 2);
    for (let i = 0; i < half; i++) {
      localStorage.removeItem(keysToRemove[i]);
    }
  }
}

export const projectContext = new ProjectContextManager();
