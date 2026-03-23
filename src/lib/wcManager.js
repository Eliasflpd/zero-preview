import { WebContainer } from "@webcontainer/api";

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });`;

/**
 * WCManager — Singleton blindado do WebContainer
 * Zero React. Zero side effects externos.
 * Uma instância por sessão do browser. Nunca reinicia.
 */
const WCManager = {
  instance: null,
  devProcess: null,
  lastPkgJson: null,
  serverUrl: null,
  booting: false,
  bootPromise: null,

  /** Retorna a instância WC, bootando uma única vez */
  async getWC() {
    if (this.instance) return this.instance;
    if (this.booting) return this.bootPromise;

    this.booting = true;
    this.bootPromise = WebContainer.boot().then(wc => {
      this.instance = wc;
      this.booting = false;
      return wc;
    });

    return this.bootPromise;
  },

  /** Mata o processo dev anterior com segurança */
  async killDev() {
    if (this.devProcess) {
      try { this.devProcess.kill(); } catch {}
      this.devProcess = null;
      await new Promise(r => setTimeout(r, 600));
    }
  },

  /**
   * Monta arquivos e inicia o servidor Vite
   * @param {Object} files - mapa path → conteúdo
   * @param {Function} onLog - callback(text, type)
   * @param {Function} onUrl - callback(url) quando server-ready
   */
  async run(files, onLog, onUrl) {
    const wc = await this.getWC();

    await this.killDev();
    onLog("Montando arquivos...", "info");

    // Converter paths flat para FileSystemTree
    const tree = {};
    for (const [path, contents] of Object.entries(files)) {
      const parts = path.split("/");
      if (parts.length === 1) {
        tree[path] = { file: { contents } };
      } else {
        const dir = parts[0];
        if (!tree[dir]) tree[dir] = { directory: {} };
        const filename = parts.slice(1).join("/");
        tree[dir].directory[filename] = { file: { contents } };
      }
    }
    tree["vite.config.js"] = { file: { contents: VITE_CONFIG } };

    await wc.mount(tree);
    onLog("Arquivos montados!", "success");

    // Cache de dependências — só instala se package.json mudou
    const pkg = files["package.json"] || "";
    if (pkg !== this.lastPkgJson) {
      onLog("Instalando dependências...", "info");
      const install = await wc.spawn("npm", ["install"]);
      install.output.pipeTo(new WritableStream({
        write(chunk) { onLog(chunk); }
      }));
      const code = await install.exit;
      if (code !== 0) throw new Error(`npm install falhou (exit ${code})`);
      this.lastPkgJson = pkg;
      onLog("Dependências instaladas!", "success");
    } else {
      onLog("Cache de deps válido — pulando install ⚡", "success");
    }

    onLog("Iniciando Vite...", "info");
    this.devProcess = await wc.spawn("npm", ["run", "dev"]);
    this.devProcess.output.pipeTo(new WritableStream({
      write(chunk) { onLog(chunk); }
    }));

    // server-ready → captura URL e notifica
    wc.on("server-ready", (port, url) => {
      this.serverUrl = url;
      onLog(`Servidor pronto → ${url}`, "success");
      onUrl(url);
    });
  },
};

export default WCManager;
