// ─── ZERO PREVIEW — MEMORIALISTA + VELOCISTA ─────────────────────────────────
// Memory: tracks successful generations for learning
// Cache: 3-level system to avoid redundant AI calls

const CACHE_KEY = "zp_gen_cache";
const HISTORY_KEY = "zp_gen_history";
const MAX_CACHE = 30;
const MAX_HISTORY = 50;

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─── SIMILARITY ──────────────────────────────────────────────────────────────
// Simple but effective: normalized word overlap (Jaccard-like)
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
}

export function similarity(a, b) {
  const tokA = new Set(tokenize(a));
  const tokB = new Set(tokenize(b));
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let intersection = 0;
  for (const w of tokA) if (tokB.has(w)) intersection++;
  return intersection / Math.max(tokA.size, tokB.size);
}

// ─── CACHE (VELOCISTA) ──────────────────────────────────────────────────────
// Level 1: Exact match (prompt hash) → return cached files directly
// Level 2: Similar prompt (>80%) → return cached files as starting point
// Level 3: Same niche → return cached structure for reuse

export function getCacheEntry(prompt, nicho) {
  const cache = loadJSON(CACHE_KEY, []);

  // Level 1: Exact match
  const exact = cache.find(e => e.prompt === prompt);
  if (exact) {
    return { level: 1, entry: exact, savings: "100% tokens economizados" };
  }

  // Level 2: Similar (>80%)
  let bestSim = 0;
  let bestEntry = null;
  for (const e of cache) {
    const sim = similarity(prompt, e.prompt);
    if (sim > bestSim) { bestSim = sim; bestEntry = e; }
  }
  if (bestSim >= 0.8 && bestEntry) {
    return { level: 2, entry: bestEntry, similarity: bestSim, savings: "~60% tokens (adapta existente)" };
  }

  // Level 3: Same niche
  const nicheMatch = cache.find(e => e.nicho === nicho);
  if (nicheMatch) {
    return { level: 3, entry: nicheMatch, savings: "~30% tokens (reutiliza estrutura)" };
  }

  return null; // cache miss
}

export function setCacheEntry(prompt, nicho, files, score) {
  const cache = loadJSON(CACHE_KEY, []);

  // Only cache good generations (score >= 60)
  if (score < 60) return;

  // Remove old entry for same prompt if exists
  const filtered = cache.filter(e => e.prompt !== prompt);

  filtered.unshift({
    prompt,
    nicho,
    files,
    score,
    at: Date.now(),
  });

  // Keep only MAX_CACHE entries
  saveJSON(CACHE_KEY, filtered.slice(0, MAX_CACHE));
}

// ─── HISTORY (MEMORIALISTA) ──────────────────────────────────────────────────
// Tracks all generations with scores for learning

export function recordGeneration(data) {
  // data: { prompt, nicho, score, duration, success }
  const history = loadJSON(HISTORY_KEY, []);

  history.unshift({
    ...data,
    at: Date.now(),
  });

  saveJSON(HISTORY_KEY, history.slice(0, MAX_HISTORY));
}

// Get top prompts by score (for injecting as examples in system prompt)
export function getTopPrompts(limit = 5) {
  const history = loadJSON(HISTORY_KEY, []);
  return history
    .filter(h => h.success && h.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(h => h.prompt);
}

// Get best niches (most successful)
export function getNicheStats() {
  const history = loadJSON(HISTORY_KEY, []);
  const stats = {};

  for (const h of history) {
    if (!h.nicho) continue;
    if (!stats[h.nicho]) stats[h.nicho] = { total: 0, success: 0, avgScore: 0, scores: [] };
    stats[h.nicho].total++;
    if (h.success) stats[h.nicho].success++;
    if (h.score) stats[h.nicho].scores.push(h.score);
  }

  for (const key of Object.keys(stats)) {
    const s = stats[key];
    s.avgScore = s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
  }

  return stats;
}

// Clear cache and history
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// Get cache stats for display
export function getCacheStats() {
  const cache = loadJSON(CACHE_KEY, []);
  const history = loadJSON(HISTORY_KEY, []);
  const topPrompts = getTopPrompts(3);

  return {
    cacheSize: cache.length,
    historySize: history.length,
    topPrompts,
    nicheStats: getNicheStats(),
  };
}
