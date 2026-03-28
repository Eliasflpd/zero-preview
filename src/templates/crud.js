// ─── TEMPLATE: CRUD ──────────────────────────────────────────────────────────
// Lista com criar, editar, deletar. Tabela + modal de formulario.

export function buildCrud(intent, palette) {
  const { title, subtitle, sections, fields, mockData } = intent;
  const names = mockData?.names || ["Maria Silva", "Joao Santos", "Ana Oliveira", "Carlos Souza", "Fernanda Lima"];
  const values = mockData?.values || [2450, 1890, 3200, 980, 4100];

  const stats = sections.find(s => s.type === "stats");
  const tableSection = sections.find(s => s.type === "table");

  const statsItems = (stats?.items || [
    { label: "Total", value: String(names.length * 30 + 6), icon: "Database" },
    { label: "Ativos", value: String(names.length * 25 + 2), icon: "CheckCircle" },
    { label: "Pendentes", value: String(names.length * 3), icon: "Clock" },
  ]).slice(0, 4);

  const formFields = (fields || []).length > 0 ? fields : [
    { name: "nome", type: "text", label: "Nome", placeholder: "Nome completo" },
    { name: "email", type: "email", label: "E-mail", placeholder: "email@exemplo.com" },
    { name: "telefone", type: "phone", label: "Telefone", placeholder: "(11) 98765-4321" },
  ];

  const allIcons = new Set(["Plus", "Search", "Edit", "Trash2", "X", "ChevronLeft", "ChevronRight", "Filter"]);
  statsItems.forEach(s => s.icon && allIcons.add(s.icon));
  const iconImport = [...allIcons].join(", ");

  const tableRows = names.map((n, i) => ({
    name: n,
    email: n.toLowerCase().replace(" ", ".") + "@email.com",
    phone: `(11) 9${String(8000 + i * 111).slice(0, 4)}-${String(1000 + i * 333).slice(0, 4)}`,
    value: `R$ ${values[i % values.length]?.toLocaleString("pt-BR")}`,
    status: i % 3 === 0 ? "Pendente" : "Ativo",
  }));

  return `import { useState } from "react";
import { ${iconImport} } from "lucide-react";

const initialData = [
${tableRows.map((r, i) => `  { id: ${i + 1}, name: "${r.name}", email: "${r.email}", phone: "${r.phone}", value: "${r.value}", status: "${r.status}" },`).join("\n")}
];

export default function Dashboard() {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = data.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = (id) => {
    setData(prev => prev.filter(r => r.id !== id));
  };

  const handleEdit = (row) => {
    setEditing(row);
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const obj = Object.fromEntries(form.entries());

    if (editing) {
      setData(prev => prev.map(r => r.id === editing.id ? { ...r, ...obj } : r));
    } else {
      setData(prev => [...prev, { id: Date.now(), ...obj, status: "Ativo", value: "R$ 0" }]);
    }
    setShowModal(false);
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">${title || "Gerenciamento"}</h1>
            <p className="text-sm text-gray-500">${subtitle || "Gerencie todos os registros"}</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="bg-[var(--accent)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Registro
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-${Math.min(statsItems.length, 4)} gap-4">
          {[
${statsItems.map(s => `            { label: "${s.label}", value: "${s.value}", icon: ${s.icon || "Database"} },`).join("\n")}
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                  <stat.icon size={16} className="text-[var(--accent)]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[var(--border)]">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Filter size={14} />
                Filtrar
              </button>
              <span className="text-xs text-gray-400">{filtered.length} registros</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Nome</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">E-mail</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Telefone</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(row => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{row.email}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{row.phone}</td>
                    <td className="px-5 py-3">
                      <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                        row.status === "Ativo" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }\`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Edit size={14} className="text-gray-400" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-gray-400">Pagina {page} de {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl border border-[var(--border)] p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Registro" : "Novo Registro"}
              </h2>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
${formFields.map(f => {
  if (f.type === "select") {
    return `              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">${f.label}</label>
                <select name="${f.name}" defaultValue={editing?.${f.name} || ""} className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 bg-white">
                  <option value="">${f.placeholder || "Selecione"}</option>
                  <option value="1">Opcao 1</option>
                  <option value="2">Opcao 2</option>
                </select>
              </div>`;
  }
  if (f.type === "textarea") {
    return `              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">${f.label}</label>
                <textarea name="${f.name}" defaultValue={editing?.${f.name} || ""} placeholder="${f.placeholder || ""}" className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 resize-none h-24" />
              </div>`;
  }
  return `              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">${f.label}</label>
                <input type="${f.type === "phone" ? "tel" : f.type}" name="${f.name}" defaultValue={editing?.${f.name} || ""} placeholder="${f.placeholder || ""}" className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20" />
              </div>`;
}).join("\n")}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="bg-[var(--accent)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  {editing ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`;
}
