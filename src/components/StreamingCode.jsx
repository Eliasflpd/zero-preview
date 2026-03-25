import { C, SYNE, MONO } from "../config/theme";

export default function StreamingCode({ code }) {
  if (!code) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
        <div style={{ width: 20, height: 20, background: C.yellow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
        </div>
        <span style={{ fontSize: 11, color: C.yellow, fontWeight: 600 }}>Escrevendo codigo...</span>
      </div>
      <pre style={{
        background: "#020810", border: `1px solid ${C.border}`, borderRadius: 8,
        padding: "10px 12px", fontSize: 10.5, color: "#7A9FBA", fontFamily: MONO,
        lineHeight: 1.6, maxHeight: 200, overflowY: "auto",
        whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
      }}>
        {code.slice(-2000)}
        <span style={{ background: C.yellow, width: 2, display: "inline-block", animation: "pulse 1s ease-in-out infinite" }}>&nbsp;</span>
      </pre>
    </div>
  );
}
