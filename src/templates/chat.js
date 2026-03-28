// ─── TEMPLATE: CHAT ──────────────────────────────────────────────────────────
// Interface de chat/mensagens estilo WhatsApp.

export function buildChat(intent, palette) {
  const { title, subtitle, sections, mockData } = intent;
  const names = mockData?.names || ["Maria Silva", "Joao Santos", "Ana Oliveira", "Carlos Souza"];

  const sidebarSection = sections.find(s => s.type === "sidebar");
  const contacts = (sidebarSection?.items || [
    { label: names[0], value: "Oi, tudo bem?", icon: "MessageCircle" },
    { label: names[1], value: "Enviei o orcamento", icon: "MessageCircle" },
    { label: names[2], value: "Quando fica pronto?", icon: "MessageCircle" },
    { label: names[3] || "Pedro Costa", value: "Obrigado!", icon: "MessageCircle" },
  ]).slice(0, 6);

  return `import { useState } from "react";
import { Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, Check, CheckCheck } from "lucide-react";

const contacts = [
${contacts.map((c, i) => `  { id: ${i + 1}, name: "${c.label}", lastMsg: "${c.value}", time: "${10 + i * 3}:${String(20 + i * 7).padStart(2, "0")}", unread: ${i === 0 ? 2 : 0}, online: ${i % 2 === 0} },`).join("\n")}
];

const initialMessages = [
  { id: 1, from: "them", text: "Oi! Tudo bem?", time: "10:20" },
  { id: 2, from: "me", text: "Tudo otimo! E voce?", time: "10:21" },
  { id: 3, from: "them", text: "Queria saber sobre o orcamento que pedi semana passada", time: "10:22" },
  { id: 4, from: "me", text: "Claro! Ja esta pronto. Vou enviar agora.", time: "10:23" },
  { id: 5, from: "them", text: "Perfeito, obrigada! 🙏", time: "10:24" },
];

export default function Dashboard() {
  const [activeContact, setActiveContact] = useState(0);
  const [messages, setMessages] = useState(initialMessages);
  const [newMsg, setNewMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = () => {
    if (!newMsg.trim()) return;
    const now = new Date();
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      from: "me",
      text: newMsg.trim(),
      time: now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0"),
    }]);
    setNewMsg("");
  };

  const active = contacts[activeContact];

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      {/* Contacts Sidebar */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-[var(--border)] flex flex-col">
        <div className="p-4 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold text-gray-900 mb-3">${title || "Mensagens"}</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.map((contact, i) => (
            <button
              key={contact.id}
              onClick={() => setActiveContact(i)}
              className={\`w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] transition-colors \${
                activeContact === i ? "bg-[var(--accent)]/5" : "hover:bg-gray-50"
              }\`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
                  {contact.name.charAt(0)}
                </div>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">{contact.name}</span>
                  <span className="text-xs text-gray-400">{contact.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{contact.lastMsg}</span>
                  {contact.unread > 0 && (
                    <span className="bg-[var(--accent)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
              {active?.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{active?.name}</div>
              <div className="text-xs text-emerald-500">{active?.online ? "Online" : "Offline"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Phone size={18} className="text-gray-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Video size={18} className="text-gray-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical size={18} className="text-gray-500" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50">
          {messages.map(msg => (
            <div key={msg.id} className={\`flex \${msg.from === "me" ? "justify-end" : "justify-start"}\`}>
              <div className={\`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm \${
                msg.from === "me"
                  ? "bg-[var(--accent)] text-white rounded-br-sm"
                  : "bg-white border border-[var(--border)] text-gray-900 rounded-bl-sm"
              }\`}>
                <p>{msg.text}</p>
                <div className={\`flex items-center justify-end gap-1 mt-1 \${
                  msg.from === "me" ? "text-white/60" : "text-gray-400"
                }\`}>
                  <span className="text-[10px]">{msg.time}</span>
                  {msg.from === "me" && <CheckCheck size={12} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Smile size={20} className="text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Paperclip size={20} className="text-gray-400" />
            </button>
            <input
              type="text"
              placeholder="Digite uma mensagem..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            />
            <button
              onClick={handleSend}
              className="bg-[var(--accent)] text-white p-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}`;
}
