import { WebContainer } from "@webcontainer/api";
import { validateSyntax, autoFix, formatSyntaxErrors } from "./syntaxValidator";
import { removeDuplicateConsts, replaceInlineFormatters, sanitizeTSXForSWC, replaceRechartsImports } from "./patchEngine";

const VITE_CONFIG_JS = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, './src') } },
});`;

const WCManager = {
  instance: null,
  devProcess: null,
  serverUrl: null,
  booting: false,
  bootPromise: null,
  _serverReadyHandler: null,
  _running: false,

  async getWC() {
    if (this.instance) return this.instance;
    if (this.booting) return this.bootPromise;
    this.booting = true;
    this.bootPromise = Promise.race([
      WebContainer.boot().then(wc => {
        this.instance = wc;
        this.booting = false;
        return wc;
      }),
      new Promise((_, reject) =>
        setTimeout(() => {
          this.booting = false;
          reject(new Error("BOOT_TIMEOUT"));
        }, 30000)
      ),
    ]).catch(err => {
      this.booting = false;
      this.bootPromise = null;
      throw err;
    });
    return this.bootPromise;
  },

  async killDev() {
    this._running = false;
    if (this.devProcess) {
      try { this.devProcess.kill(); } catch {}
      this.devProcess = null;
      await new Promise(r => setTimeout(r, 400));
    }
  },

  buildTree(files) {
    const tree = {};
    for (const [path, contents] of Object.entries(files)) {
      const parts = path.split("/");
      let current = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = { file: { contents } };
        } else {
          if (!current[part]) current[part] = { directory: {} };
          current = current[part].directory;
        }
      }
    }
    return tree;
  },

  // Last validation result — accessible from outside
  lastValidation: null,

  async run(files, onLog, onUrl) {
    // Prevent concurrent runs
    if (this._running) {
      await this.killDev();
    }
    this._running = true;

    const wc = await this.getWC();

    // Remove previous listener
    if (this._serverReadyHandler) {
      try { wc.off?.("server-ready", this._serverReadyHandler); } catch {}
    }
    this.serverUrl = null;

    await this.killDev();
    this._running = true; // reset after killDev

    // ── RENAME .tsx → .jsx, .ts → .js (AI pode ignorar o prompt) ───────
    for (const [path, content] of Object.entries(files)) {
      if (path.endsWith('.tsx') || (path.endsWith('.ts') && !path.endsWith('.d.ts'))) {
        const newPath = path.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');
        files[newPath] = content;
        delete files[path];
      }
    }

    // ── FULL SANITIZATION (ultima camada) ───────────────────────────────
    for (const [path, content] of Object.entries(files)) {
      if (/\.(jsx?|js)$/.test(path) && typeof content === 'string') {
        files[path] = sanitizeTSXForSWC(
          replaceRechartsImports(
            removeDuplicateConsts(replaceInlineFormatters(content))
          )
        );
      }
    }

    // ── SYNTAX VALIDATION ─────────────────────────────────────────────────
    onLog("Validando sintaxe...", "info");
    const validation = validateSyntax(files);
    this.lastValidation = validation;

    if (!validation.valid) {
      const errorSummary = formatSyntaxErrors(validation.errors);
      onLog(`Erros de sintaxe detectados (${validation.errors.length}):\n${errorSummary}`, "warn");

      // Tenta auto-fix
      onLog("Tentando correcao automatica...", "info");
      try {
        const fixResult = await autoFix(files, validation.errors);
        if (fixResult.fixed) {
          files = fixResult.files;
          const recheck = validateSyntax(files);
          this.lastValidation = recheck;
          onLog(`Corrigidos ${fixResult.fixedCount} arquivo(s)!`, "success");
          if (!recheck.valid) {
            onLog(`Ainda restam ${recheck.errors.length} erro(s) — montando mesmo assim`, "warn");
          }
        } else {
          onLog("Auto-fix nao conseguiu corrigir — montando com erros", "warn");
        }
      } catch {
        onLog("Auto-fix indisponivel — montando com erros", "warn");
      }
    } else {
      onLog("Sintaxe OK!", "success");
    }

    onLog("Montando arquivos...", "info");

    const tree = this.buildTree(files);
    tree["vite.config.js"] = { file: { contents: VITE_CONFIG_JS } };

    // ── AUDITORIA: loga tudo antes de montar ───────────────────────────
    console.log("[Zero AUDIT] === vite.config.ts sendo montado ===");
    console.log(VITE_CONFIG_JS);
    console.log("[Zero AUDIT] === package.json sendo montado ===");
    console.log(files["package.json"]);

    // Loga conteudo de todos os .tsx/.ts gerados
    Object.entries(files).forEach(([path, content]) => {
      if (path.endsWith('.tsx') || path.endsWith('.ts')) {
        console.log(`[Zero AUDIT] === arquivo: ${path} ===`);
        console.log(typeof content === 'string' ? content : JSON.stringify(content));
      }
    });

    await wc.mount(tree);
    onLog("Arquivos montados!", "success");

    // ── AUDITORIA: le vite.config.ts de volta do WC filesystem ───────
    try {
      const viteFromWC = await wc.fs.readFile("vite.config.ts", "utf-8");
      console.log("[Zero AUDIT] === vite.config.ts LIDO DO WebContainer ===");
      console.log(viteFromWC);
    } catch (e) {
      console.log("[Zero AUDIT] Erro lendo vite.config.ts do WC:", e.message);
    }

    // ── npm install ──────────────────────────────────────────────────
    onLog("Instalando dependencias...", "info");
    const install = await wc.spawn("npm", ["install"]);
    install.output.pipeTo(new WritableStream({
      write(chunk) { onLog(chunk); }
    }));
    const installCode = await install.exit;
    if (installCode !== 0) throw new Error(`npm install falhou (exit ${installCode})`);
    onLog("Dependencias instaladas!", "success");

    // ── AUDITORIA: npm ls @babel/core — quem puxa Babel? ─────────────
    try {
      console.log("[Zero AUDIT] === npm ls @babel/core --depth=3 ===");
      const ls = await wc.spawn("npm", ["ls", "@babel/core", "--depth=3"]);
      const lsChunks = [];
      await ls.output.pipeTo(new WritableStream({
        write(chunk) { lsChunks.push(chunk); }
      }));
      await ls.exit;
      const lsOutput = lsChunks.join("");
      console.log(lsOutput || "(vazio — Babel nao encontrado)");

      // Bonus: verifica se plugin-react (babel) foi instalado por engano
      console.log("[Zero AUDIT] === npm ls @vitejs/plugin-react --depth=1 ===");
      const ls2 = await wc.spawn("npm", ["ls", "@vitejs/plugin-react", "--depth=1"]);
      const ls2Chunks = [];
      await ls2.output.pipeTo(new WritableStream({
        write(chunk) { ls2Chunks.push(chunk); }
      }));
      await ls2.exit;
      console.log(ls2Chunks.join("") || "(vazio — plugin-react nao encontrado)");

      console.log("[Zero AUDIT] === npm ls @vitejs/plugin-react-swc --depth=1 ===");
      const ls3 = await wc.spawn("npm", ["ls", "@vitejs/plugin-react-swc", "--depth=1"]);
      const ls3Chunks = [];
      await ls3.output.pipeTo(new WritableStream({
        write(chunk) { ls3Chunks.push(chunk); }
      }));
      await ls3.exit;
      console.log(ls3Chunks.join("") || "(vazio — plugin-react-swc nao encontrado)");
    } catch (e) {
      console.log("[Zero AUDIT] Erro no npm ls:", e.message);
    }

    // ── AUDITORIA: le package.json de volta do WC (pos-install) ──────
    try {
      const pkgFromWC = await wc.fs.readFile("package.json", "utf-8");
      console.log("[Zero AUDIT] === package.json LIDO DO WebContainer (pos-install) ===");
      console.log(pkgFromWC);
    } catch (e) {
      console.log("[Zero AUDIT] Erro lendo package.json do WC:", e.message);
    }

    await this._startViteWithTimeout(wc, files, onLog, onUrl);
  },

  async _startViteWithTimeout(wc, files, onLog, onUrl, isRetry = false) {
    onLog(isRetry ? "Reiniciando Vite..." : "Iniciando Vite...", "info");

    this.devProcess = await wc.spawn("npm", ["run", "dev"]);
    this.devProcess.output.pipeTo(new WritableStream({
      write(chunk) { onLog(chunk); }
    }));

    // Race: server-ready vs 30s timeout
    const serverReady = new Promise((resolve) => {
      this._serverReadyHandler = (port, url) => {
        this.serverUrl = url;
        this._running = false;
        resolve(url);
      };
      wc.on("server-ready", this._serverReadyHandler);
    });

    const serverTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("SERVER_TIMEOUT")), 30000)
    );

    try {
      const url = await Promise.race([serverReady, serverTimeout]);
      onLog(`Servidor pronto → ${url}`, "success");
      onUrl(url);
    } catch (e) {
      // Remove listener before retry/error
      if (this._serverReadyHandler) {
        try { wc.off?.("server-ready", this._serverReadyHandler); } catch {}
      }

      if (!isRetry) {
        onLog("Preview demorou demais — reiniciando automaticamente...", "warn");
        await this.killDev();
        this._running = true;
        return this._startViteWithTimeout(wc, files, onLog, onUrl, true);
      }

      // Second timeout — show clear error
      this._running = false;
      onLog("Preview nao conseguiu iniciar. Tente recarregar a pagina.", "error");
      onUrl(""); // signal failure with empty URL
    }
  },
};

export default WCManager;
