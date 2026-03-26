/**
 * CSS Enforcer — converte hex hardcoded para CSS variables
 * Roda apos EXECUTOR e antes do CRITICO
 * Zero tokens, zero chamada de IA, roda em <1ms
 */

// Mapa de hex comuns → CSS variable mais proxima
const HEX_TO_VAR = {
  // Azuis
  '#1565C0': 'var(--accent)',
  '#1976D2': 'var(--accent)',
  '#2196F3': 'var(--accent)',
  '#0D47A1': 'var(--accent)',
  '#003366': 'var(--accent)',
  '#002244': 'var(--accent)',
  '#0D1B4B': 'var(--accent)',
  '#F0F4FF': 'var(--bg)',
  // Marrons/laranjas
  '#4A2C0A': 'var(--accent)',
  '#8B4513': 'var(--accent)',
  '#D2691E': 'var(--accent)',
  '#E65100': 'var(--accent)',
  '#E64A19': 'var(--accent)',
  '#B45309': 'var(--accent)',
  '#D97706': 'var(--accent)',
  '#92400E': 'var(--accent)',
  // Cinzas
  '#333': 'var(--text)',
  '#333333': 'var(--text)',
  '#666': 'var(--text)',
  '#666666': 'var(--text)',
  '#999': 'var(--text)',
  '#999999': 'var(--text)',
  '#f5f5f5': 'var(--bg)',
  '#F5F5F5': 'var(--bg)',
  '#ffffff': 'var(--bg)',
  '#FFFFFF': 'var(--bg)',
  '#fff': 'var(--bg)',
  '#FFF': 'var(--bg)',
  '#000000': 'var(--text)',
  '#000': 'var(--text)',
  // Verdes
  '#2E7D32': 'var(--accent)',
  '#388E3C': 'var(--accent)',
  '#4CAF50': 'var(--accent)',
  '#059669': 'var(--accent)',
  '#2D6A4F': 'var(--accent)',
  // Vermelhos
  '#C62828': 'var(--accent)',
  '#D32F2F': 'var(--accent)',
  '#F44336': 'var(--accent)',
  '#DC2626': 'var(--accent)',
  '#C2185B': 'var(--accent)',
  '#BE185D': 'var(--accent)',
  // Roxos
  '#6366f1': 'var(--accent)',
  '#7C3AED': 'var(--accent)',
  '#8B5CF6': 'var(--accent)',
  '#7B1FA2': 'var(--accent)',
  '#3D1C52': 'var(--accent)',
  '#2D0040': 'var(--accent)',
  // Amarelos
  '#F9A825': 'var(--accent)',
  '#8B6914': 'var(--accent)',
  // Sidebars escuras (nichos)
  '#1A0A00': 'var(--sidebar)',
  '#1A1400': 'var(--sidebar)',
  '#1A0E00': 'var(--sidebar)',
  '#1A237E': 'var(--sidebar)',
  '#0A2E0A': 'var(--sidebar)',
  '#1A1A2E': 'var(--sidebar)',
  '#1B4332': 'var(--sidebar)',
  '#1E3A5F': 'var(--sidebar)',
  '#4A1942': 'var(--sidebar)',
  '#3B1F0B': 'var(--sidebar)',
  '#1C1917': 'var(--sidebar)',
  '#004D66': 'var(--sidebar)',
  // Fundos claros (nichos)
  '#FDF6F0': 'var(--bg)',
  '#FFFBF5': 'var(--bg)',
  '#F0FFF4': 'var(--bg)',
  '#FFFEF5': 'var(--bg)',
  '#F8F9FF': 'var(--bg)',
  '#FFF8F5': 'var(--bg)',
  '#F0FBFF': 'var(--bg)',
  '#F0FAFF': 'var(--bg)',
  '#FFF5FF': 'var(--bg)',
  '#F0FFF8': 'var(--bg)',
  '#FFFAF0': 'var(--bg)',
  '#FFF5F7': 'var(--bg)',
  '#FFFBF0': 'var(--bg)',
  '#FFF8F0': 'var(--bg)',
};

/**
 * Remove hex hardcoded do codigo gerado.
 * Substitui por CSS variable mais proxima.
 * Para hex nao mapeados usa heuristica de luminosidade.
 */
export function enforceCSS(code) {
  if (!code) return code;

  let result = code;

  // 1. Substituir hex mapeados primeiro (mais especifico)
  for (const [hex, variable] of Object.entries(HEX_TO_VAR)) {
    result = result.replaceAll(hex, variable);
  }

  // 2. Substituir hex de 6 digitos nao mapeados em contextos de estilo
  // Alvo: fill="...", stroke="...", bg-[...], text-[...], border-[...], className com hex
  result = result.replace(
    /#([0-9a-fA-F]{6})\b/g,
    (match, hex, offset) => {
      // Preservar hex em comentarios
      const lineStart = result.lastIndexOf('\n', offset) + 1;
      const linePrefix = result.slice(lineStart, offset).trim();
      if (linePrefix.startsWith('//') || linePrefix.startsWith('*')) return match;

      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const luminance = (r * 299 + g * 587 + b * 114) / 1000;

      if (luminance > 200) return 'var(--bg)';
      if (luminance < 50) return 'var(--sidebar)';
      return 'var(--accent)';
    }
  );

  // 3. Substituir hex de 3 digitos nao mapeados
  result = result.replace(
    /#([0-9a-fA-F]{3})\b/g,
    (match, hex, offset) => {
      const lineStart = result.lastIndexOf('\n', offset) + 1;
      const linePrefix = result.slice(lineStart, offset).trim();
      if (linePrefix.startsWith('//') || linePrefix.startsWith('*')) return match;

      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const luminance = (r * 299 + g * 587 + b * 114) / 1000;

      if (luminance > 200) return 'var(--bg)';
      if (luminance < 50) return 'var(--text)';
      return 'var(--accent)';
    }
  );

  return result;
}

/**
 * Conta quantos hex existem no codigo (para log)
 */
export function countHex(code) {
  if (!code) return 0;
  const matches = code.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g);
  return matches ? matches.length : 0;
}
