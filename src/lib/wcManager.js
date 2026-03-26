import { WebContainer } from "@webcontainer/api";
import { validateSyntax, autoFix, formatSyntaxErrors } from "./syntaxValidator";

const VITE_CONFIG_TS = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
  lastPkgJson: null,
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
    tree["vite.config.ts"] = { file: { contents: VITE_CONFIG_TS } };

    await wc.mount(tree);
    onLog("Arquivos montados!", "success");

    const pkg = files["package.json"] || "";
    if (pkg !== this.lastPkgJson) {
      onLog("Instalando dependencias...", "info");
      const install = await wc.spawn("npm", ["install"]);
      install.output.pipeTo(new WritableStream({
        write(chunk) { onLog(chunk); }
      }));
      const code = await install.exit;
      if (code !== 0) throw new Error(`npm install falhou (exit ${code})`);
      this.lastPkgJson = pkg;
      onLog("Dependencias instaladas!", "success");
    } else {
      onLog("Cache de deps valido", "success");
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
