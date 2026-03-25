import { useState } from "react";
import { C, SYNE, DM } from "../config/theme";
import { exportToZip } from "../lib/exporter";

export default function DeployModal({ files, projectName, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await exportToZip(files, projectName);
    setDownloading(false);
    setDownloaded(true);
  };

  const Option = ({ step, icon, title, desc, action, actionLabel, highlight }) => (
    <div style={{
      background: highlight ? "rgba(255,208,80,0.04)" : C.bg,
      border: `1px solid ${highlight ? "rgba(255,208,80,0.2)" : C.border}`,
      borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: highlight ? "rgba(255,208,80,0.1)" : C.surface,
          border: `1px solid ${highlight ? "rgba(255,208,80,0.3)" : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, letterSpacing: 0.5 }}>PASSO {step}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: SYNE }}>{title}</div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{desc}</p>
      {action && (
        <button onClick={action} style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          fontFamily: DM, cursor: "pointer", alignSelf: "flex-start",
          background: highlight ? C.yellow : "transparent",
          color: highlight ? C.bg : C.textMuted,
          border: highlight ? "none" : `1px solid ${C.border}`,
        }}>
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,15,30,0.88)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "24px 28px", width: 480,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            Publicar seu app
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>x</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Option
            step="1" icon="Z" highlight={true}
            title="Baixar projeto"
            desc="Baixa um ZIP com todos os arquivos do projeto prontos para deploy. Inclui package.json, TypeScript, Tailwind e todos os componentes."
            action={handleDownload}
            actionLabel={downloading ? "Baixando..." : downloaded ? "Baixado!" : "Baixar ZIP"}
          />

          <Option
            step="2" icon="V"
            title="Deploy no Vercel (recomendado)"
            desc="Arraste o ZIP para vercel.com/new ou conecte um repositorio GitHub. O deploy leva 30 segundos e voce recebe uma URL publica."
            action={() => window.open("https://vercel.com/new", "_blank")}
            actionLabel="Abrir Vercel"
          />

          <Option
            step="3" icon="N"
            title="Deploy no Netlify (alternativa)"
            desc="Arraste a pasta descompactada para app.netlify.com/drop. Sem conta necessaria. Seu app fica online em 10 segundos."
            action={() => window.open("https://app.netlify.com/drop", "_blank")}
            actionLabel="Abrir Netlify Drop"
          />
        </div>

        <div style={{
          marginTop: 16, padding: "10px 14px", borderRadius: 10,
          background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
          fontSize: 10, color: C.info, lineHeight: 1.5,
        }}>
          Dica: O Netlify Drop e o mais rapido — arraste a pasta e pronto, sem criar conta. O Vercel e melhor para projetos que voce vai atualizar depois.
        </div>
      </div>
    </div>
  );
}
