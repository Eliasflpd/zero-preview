// ─── ZERO PREVIEW — TEMPLATE INDEX ───────────────────────────────────────────
// Exporta todos os builders de template.

export { buildDashboard } from "./dashboard";
export { buildLanding } from "./landing";
export { buildForm } from "./form";
export { buildChat } from "./chat";
export { buildCrud } from "./crud";

export const TEMPLATE_TYPES = ["dashboard", "landing", "form", "chat", "crud"];

export function getTemplateBuilder(type) {
  const builders = {
    dashboard: buildDashboard,
    landing: buildLanding,
    form: buildForm,
    chat: buildChat,
    crud: buildCrud,
  };
  return builders[type] || builders.dashboard;
}
