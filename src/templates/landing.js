// ─── TEMPLATE: LANDING PAGE ──────────────────────────────────────────────────
// Pagina de vendas com hero, features, CTA e footer.

export function buildLanding(intent, palette) {
  const { title, subtitle, sections, features } = intent;

  const hero = sections.find(s => s.type === "hero");
  const feats = sections.find(s => s.type === "features");
  const cta = sections.find(s => s.type === "cta");

  const featureItems = feats?.items || [
    { label: "Rapido", value: "Resultados em minutos", icon: "Zap" },
    { label: "Seguro", value: "Protecao total", icon: "Shield" },
    { label: "Suporte", value: "Atendimento 24/7", icon: "Headphones" },
    { label: "Integracao", value: "Conecte tudo", icon: "Link" },
    { label: "Relatorios", value: "Dados em tempo real", icon: "BarChart2" },
    { label: "Mobile", value: "Acesse de qualquer lugar", icon: "Smartphone" },
  ];

  const allIcons = new Set(["ArrowRight", "CheckCircle", "Star", "Menu", "X"]);
  featureItems.forEach(f => f.icon && allIcons.add(f.icon));
  const iconImport = [...allIcons].join(", ");

  const ctaText = cta?.items?.[0]?.label || hero?.items?.[0]?.value || "Comece Agora";

  return `import { useState } from "react";
import { ${iconImport} } from "lucide-react";

const features = [
${featureItems.slice(0, 6).map(f => `  { icon: ${f.icon || "Star"}, title: "${f.label}", desc: "${f.value}" },`).join("\n")}
];

const testimonials = [
  { name: "Maria Silva", role: "Empresaria", text: "Transformou completamente nosso negocio. Resultados incriveis!" },
  { name: "Joao Santos", role: "Gerente", text: "Interface intuitiva e suporte excelente. Recomendo muito." },
  { name: "Ana Oliveira", role: "Diretora", text: "Melhor investimento que fizemos. ROI em menos de 30 dias." },
];

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Nav */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">${title || "Meu App"}</span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Depoimentos</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Precos</a>
            <button className="bg-[var(--accent)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              ${ctaText}
            </button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border)] p-4 space-y-3 bg-white">
            <a href="#features" className="block text-sm text-gray-600">Funcionalidades</a>
            <a href="#testimonials" className="block text-sm text-gray-600">Depoimentos</a>
            <a href="#pricing" className="block text-sm text-gray-600">Precos</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--accent)]/10 text-[var(--accent)] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star size={14} />
            Novo
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            ${hero?.title || title || "Transforme seu negocio"}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            ${subtitle || "Solucao completa para gestao do seu negocio. Simples, rapida e poderosa."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[var(--accent)] text-white px-8 py-3.5 rounded-xl text-base font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/20">
              ${ctaText}
              <ArrowRight size={18} />
            </button>
            <button className="border border-[var(--border)] text-gray-700 px-8 py-3.5 rounded-xl text-base font-medium hover:bg-gray-50 transition-colors">
              Ver demonstracao
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo que voce precisa</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Ferramentas poderosas para transformar a gestao do seu negocio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <div key={i} className="p-6 rounded-xl border border-[var(--border)] hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent)] transition-colors">
                  <feat.icon size={22} className="text-[var(--accent)] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">O que dizem nossos clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-[var(--border)] hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[var(--sidebar)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">${cta?.title || "Pronto para comecar?"}</h2>
          <p className="text-white/60 mb-8">Junte-se a milhares de empresas que ja transformaram sua gestao.</p>
          <button className="bg-[var(--accent)] text-white px-8 py-3.5 rounded-xl text-base font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            ${ctaText}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">&copy; 2026 ${title || "Meu App"}. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Termos</a>
            <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Privacidade</a>
            <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}`;
}
