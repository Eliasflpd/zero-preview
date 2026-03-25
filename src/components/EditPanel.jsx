import { useState } from "react";
import { C, SYNE, DM } from "../config/theme";

export default function EditPanel({ element, onEdit, onClose }) {
  const [editText, setEditText] = useState(element?.text || "");

  if (!element) return null;

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
      background: C.surface, borderTop: `2px solid ${C.info}`,
      padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.info }}>Editando: </span>
          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{element.tagName} {element.className ? `.${element.className.split(" ")[0]}` : ""}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14 }}>x</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={editText}
          onChange={e => setEditText(e.target.value)}
          placeholder="Texto do elemento..."
          style={{ flex: 1, padding: "8px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text, fontFamily: DM, outline: "none" }}
        />
        <button onClick={() => onEdit(`Muda o texto "${element.text.slice(0, 50)}" para "${editText}"`)} style={{
          padding: "0 16px", background: C.info, border: "none", borderRadius: 8,
          fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: DM,
        }}>Aplicar</button>
      </div>
      <div style={{ fontSize: 9, color: C.textDim }}>
        Ou descreva: "muda a cor pra azul", "aumenta o tamanho", "remove esse elemento"
      </div>
    </div>
  );
}
