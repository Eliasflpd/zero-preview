// ─── TEMPLATE: DASHBOARD ─────────────────────────────────────────────────────
// Painel admin com sidebar, stats cards, grafico e tabela.
// Gera codigo TSX 100% valido a partir do JSON de intencao.

export function buildDashboard(intent, palette) {
  const { title, subtitle, sections, mockData } = intent;
  const names = mockData?.names || ["Maria Silva", "Joao Santos", "Ana Oliveira", "Carlos Souza"];
  const values = mockData?.values || [2450, 1890, 3200, 980, 4100];

  // Extrai secoes
  const stats = sections.find(s => s.type === "stats");
  const chart = sections.find(s => s.type === "chart");
  const table = sections.find(s => s.type === "table");

  const statsCards = (stats?.items || [
    { label: "Receita", value: `R$ ${values[0]?.toLocaleString("pt-BR")}`, icon: "DollarSign" },
    { label: "Clientes", value: "384", icon: "Users" },
    { label: "Pedidos", value: "47", icon: "ShoppingCart" },
    { label: "Crescimento", value: "+12.5%", icon: "TrendingUp" },
  ]).slice(0, 4);

  const chartData = (chart?.items || [
    { label: "Jan", value: "2450" }, { label: "Fev", value: "3200" },
    { label: "Mar", value: "2800" }, { label: "Abr", value: "4100" },
    { label: "Mai", value: "3600" }, { label: "Jun", value: "4800" },
  ]).slice(0, 6);

  const tableRows = (table?.items || [
    { label: names[0], value: `R$ ${values[0]}`, icon: "CheckCircle" },
    { label: names[1], value: `R$ ${values[1]}`, icon: "Clock" },
    { label: names[2], value: `R$ ${values[2]}`, icon: "CheckCircle" },
    { label: names[3], value: `R$ ${values[3]}`, icon: "AlertCircle" },
  ]).slice(0, 6);

  // Coleta todos os icones usados
  const allIcons = new Set(["LayoutDashboard", "Search", "Bell", "Settings", "LogOut", "Home", "BarChart2", "Users", "FileText"]);
  statsCards.forEach(s => s.icon && allIcons.add(s.icon));
  tableRows.forEach(r => r.icon && allIcons.add(r.icon));

  const iconImport = [...allIcons].join(", ");

  const menuItems = [
    { icon: "Home", label: "Inicio" },
    { icon: "BarChart2", label: "Relatorios" },
    { icon: "Users", label: "Clientes" },
    { icon: "FileText", label: "Pedidos" },
    { icon: "Settings", label: "Configuracoes" },
  ];

  return `import { useState } from "react";
import { ${iconImport} } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
${chartData.map(d => `  { name: "${d.label}", value: ${parseInt(d.value) || 0} },`).join("\n")}
];

const tableData = [
${tableRows.map((r, i) => `  { id: ${i + 1}, name: "${r.label}", value: "${r.value}", status: "${r.icon === "CheckCircle" ? "Ativo" : r.icon === "Clock" ? "Pendente" : "Inativo"}" },`).join("\n")}
];

const menuItems = [
${menuItems.map(m => `  { icon: ${m.icon}, label: "${m.label}" },`).join("\n")}
];

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = tableData.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-[var(--sidebar)] text-[var(--sidebar-text)] flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <LayoutDashboard size={18} color="#fff" />
            </div>
            <span className="font-semibold text-sm">${title || "Dashboard"}</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveMenu(i)}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors \${
                activeMenu === i
                  ? "bg-[var(--accent)] text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }\`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-[var(--border)] bg-white flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">${title || "Dashboard"}</h1>
            ${subtitle ? `<p className="text-xs text-gray-500">${subtitle}</p>` : ""}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] w-64"
              />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
${statsCards.map((s, i) => `              { label: "${s.label}", value: "${s.value}", icon: ${s.icon || "BarChart2"}, trend: ${i % 2 === 0 ? '"+5.2%"' : '"-1.8%"'}, up: ${i % 2 === 0} },`).join("\n")}
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-[var(--border)] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{stat.label}</span>
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <stat.icon size={18} className="text-[var(--accent)]" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className={\`text-xs mt-1 \${stat.up ? "text-emerald-600" : "text-red-500"}\`}>
                  {stat.trend} vs mes anterior
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">${chart?.title || "Visao Geral"}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }}
                    formatter={(v) => ["R$ " + Number(v).toLocaleString("pt-BR"), "Valor"]}
                  />
                  <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[var(--border)]">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">${table?.title || "Registros Recentes"}</h2>
              <span className="text-xs text-gray-400">{filtered.length} resultados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">#</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Nome</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Valor</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-400">{row.id}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{row.value}</td>
                      <td className="px-5 py-3">
                        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                          row.status === "Ativo" ? "bg-emerald-50 text-emerald-700" :
                          row.status === "Pendente" ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }\`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}`;
}
