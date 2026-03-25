// ─── ZERO PREVIEW — PROJECT EXPORTER ─────────────────────────────────────────
// Generates a downloadable ZIP with all project files ready for Vercel deploy

export async function exportToZip(files, projectName) {
  // Build a complete project structure
  const exportFiles = { ...files };

  // Add vercel.json with required headers for WebContainers
  exportFiles["vercel.json"] = JSON.stringify({
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
        ]
      }
    ]
  }, null, 2);

  // Add README with deploy instructions
  const safeName = (projectName || "meu-app").replace(/[^a-zA-Z0-9-_ ]/g, "").slice(0, 40);
  exportFiles["README.md"] = `# ${safeName}

Gerado com [Zero Preview](https://zero-preview-six.vercel.app)

## Deploy no Vercel em 3 passos

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Arraste esta pasta ou conecte o repositorio
3. Clique "Deploy" — pronto!

## Rodar localmente

\`\`\`bash
npm install
npm run dev
\`\`\`

## Stack
- React 18
- Vite 5
- Recharts (graficos)
- Lucide React (icones)
`;

  // Generate ZIP using JSZip-like manual approach (no dependency needed)
  // We use a simple approach: create a data URI with the files as a downloadable blob
  const blob = await createZipBlob(exportFiles);

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
}

// Minimal ZIP creator (no external dependencies)
// Creates a valid ZIP file with stored (uncompressed) entries
async function createZipBlob(files) {
  const entries = Object.entries(files);
  const parts = [];
  const centralDir = [];
  let offset = 0;

  for (const [path, content] of entries) {
    const data = new TextEncoder().encode(content);
    const pathBytes = new TextEncoder().encode(path);
    const crc = crc32(data);

    // Local file header
    const local = new Uint8Array(30 + pathBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression: stored
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true); // crc32
    lv.setUint32(18, data.length, true); // compressed size
    lv.setUint32(22, data.length, true); // uncompressed size
    lv.setUint16(26, pathBytes.length, true); // filename length
    lv.setUint16(28, 0, true); // extra length
    local.set(pathBytes, 30);

    // Central directory entry
    const central = new Uint8Array(46 + pathBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, crc, true); // crc32
    cv.setUint32(20, data.length, true); // compressed
    cv.setUint32(24, data.length, true); // uncompressed
    cv.setUint16(28, pathBytes.length, true); // filename length
    cv.setUint16(30, 0, true); // extra length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk start
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // local header offset
    central.set(pathBytes, 46);

    parts.push(local, data);
    centralDir.push(central);
    offset += local.length + data.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const c of centralDir) {
    parts.push(c);
    centralDirSize += c.length;
  }

  // End of central directory
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); // signature
  ev.setUint16(4, 0, true); // disk
  ev.setUint16(6, 0, true); // central dir disk
  ev.setUint16(8, entries.length, true); // entries on disk
  ev.setUint16(10, entries.length, true); // total entries
  ev.setUint32(12, centralDirSize, true); // central dir size
  ev.setUint32(16, centralDirOffset, true); // central dir offset
  ev.setUint16(20, 0, true); // comment length
  parts.push(end);

  return new Blob(parts, { type: "application/zip" });
}

// CRC32 lookup table
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
