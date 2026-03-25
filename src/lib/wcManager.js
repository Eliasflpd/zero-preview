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

/**
 * WCManager — Singleton blindado do WebContainer
 * Suporta diretórios aninhados de qualquer profundidade.
 */
const WCManager = {
  instance: null,
  devProcess: null,
  lastPkgJson: null,
  serverUrl: null,
  booting: false,
  bootPromise: null,

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
    if (this.devProcess) {
      try { this.devProcess.kill(); } catch {}
      this.devProcess = null;
      await new Promise(r => setTimeout(r, 600));
    }
  },

  /**
   * Converts flat path map to WebContainer FileSystemTree.
   * Supports ANY depth: "src/components/ui/button.tsx" → nested tree
   */
  buildTree(files) {
    const tree = {};
    for (const [path, contents] of Object.entries(files)) {
      const parts = path.split("/");
      let current = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          // Last part = file
          current[part] = { file: { contents } };
        } else {
          // Directory
          if (!current[part]) current[part] = { directory: {} };
          current = current[part].directory;
        }
      }
    }
    return tree;
  },

  async run(files, onLog, onUrl) {
    const wc = await this.getWC();
    await this.killDev();
    onLog("Montando arquivos...", "info");

    const tree = this.buildTree(files);
    // Add vite config (TypeScript-aware with @ alias)
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

    wc.on("server-ready", (port, url) => {
      this.serverUrl = url;
      onLog(`Servidor pronto → ${url}`, "success");
      onUrl(url);
    });
  },
};

export default WCManager;
