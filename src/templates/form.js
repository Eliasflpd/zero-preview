// ─── TEMPLATE: FORM ──────────────────────────────────────────────────────────
// Formulario multi-step com validacao.

export function buildForm(intent, palette) {
  const { title, subtitle, fields, sections } = intent;

  const formFields = (fields || []).length > 0 ? fields : [
    { name: "nome", type: "text", label: "Nome Completo", placeholder: "Seu nome" },
    { name: "email", type: "email", label: "E-mail", placeholder: "email@exemplo.com" },
    { name: "telefone", type: "phone", label: "Telefone", placeholder: "(11) 98765-4321" },
    { name: "cpf", type: "text", label: "CPF", placeholder: "000.000.000-00" },
    { name: "assunto", type: "select", label: "Assunto", placeholder: "Selecione" },
    { name: "mensagem", type: "textarea", label: "Mensagem", placeholder: "Descreva sua necessidade..." },
  ];

  // Divide campos em steps de 3
  const step1 = formFields.slice(0, 3);
  const step2 = formFields.slice(3, 6);
  const hasStep2 = step2.length > 0;

  function renderField(f, idx) {
    if (f.type === "textarea") {
      return `          <div key="${f.name}">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">${f.label}</label>
            <textarea
              placeholder="${f.placeholder || ""}"
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] resize-none h-28"
            />
          </div>`;
    }
    if (f.type === "select") {
      return `          <div key="${f.name}">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">${f.label}</label>
            <select className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] bg-white">
              <option value="">${f.placeholder || "Selecione"}</option>
              <option value="1">Opcao 1</option>
              <option value="2">Opcao 2</option>
              <option value="3">Opcao 3</option>
            </select>
          </div>`;
    }
    return `          <div key="${f.name}">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">${f.label}</label>
            <input
              type="${f.type === "phone" ? "tel" : f.type}"
              placeholder="${f.placeholder || ""}"
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            />
          </div>`;
  }

  return `import { useState } from "react";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

export default function Dashboard() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const totalSteps = ${hasStep2 ? 2 : 1};

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enviado com sucesso!</h2>
          <p className="text-gray-500 text-sm mb-6">Recebemos seus dados. Entraremos em contato em breve.</p>
          <button
            onClick={() => { setSubmitted(false); setStep(1); }}
            className="bg-[var(--accent)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Novo cadastro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[var(--border)] p-8 max-w-lg w-full shadow-sm">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">${title || "Cadastro"}</h1>
          <p className="text-sm text-gray-500">${subtitle || "Preencha os campos abaixo"}</p>
        </div>

        {/* Step indicator */}
        ${hasStep2 ? `<div className="flex items-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium \${
                step >= s ? "bg-[var(--accent)] text-white" : "bg-gray-100 text-gray-400"
              }\`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              <span className={\`text-xs \${step >= s ? "text-gray-900 font-medium" : "text-gray-400"}\`}>
                {s === 1 ? "Dados pessoais" : "Detalhes"}
              </span>
              {s < 2 && <div className={\`flex-1 h-0.5 \${step > s ? "bg-[var(--accent)]" : "bg-gray-200"}\`} />}
            </div>
          ))}
        </div>` : ""}

        {/* Fields */}
        <div className="space-y-4">
          {step === 1 && (
            <>
${step1.map((f, i) => renderField(f, i)).join("\n")}
            </>
          )}
          ${hasStep2 ? `{step === 2 && (
            <>
${step2.map((f, i) => renderField(f, i)).join("\n")}
            </>
          )}` : ""}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          ${hasStep2 ? `{step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          )}
          {step === 1 && <div />}` : "<div />"}
          <button
            onClick={() => {
              ${hasStep2 ? `if (step < totalSteps) setStep(step + 1);
              else setSubmitted(true);` : "setSubmitted(true);"}
            }}
            className="bg-[var(--accent)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {step < totalSteps ? "Proximo" : "Enviar"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}`;
}
