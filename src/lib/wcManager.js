import { WebContainer } from "@webcontainer/api";

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
    this.bootPromise = WebContainer.boot().then(wc => {
      this.instance = wc;
      this.booting = false;
      return wc;
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

    onLog("Iniciando Vite...", "info");
    this.devProcess = await wc.spawn("npm", ["run", "dev"]);
    this.devProcess.output.pipeTo(new WritableStream({
      write(chunk) { onLog(chunk); }
    }));

    this._serverReadyHandler = (port, url) => {
      this.serverUrl = url;
      this._running = false;
      onLog(`Servidor pronto → ${url}`, "success");
      onUrl(url);
    };
    wc.on("server-ready", this._serverReadyHandler);
  },
};

export default WCManager;
