import { useState } from "react";
import { safeSetItem } from "../lib/storage";

export default function useLocalStorage(key, init) {
  const [v, setV] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; } catch { return init; }
  });

  const set = val => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next);
    try { safeSetItem(key, JSON.stringify(next)); } catch {}
  };

  return [v, set];
}
