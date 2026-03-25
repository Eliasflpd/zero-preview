// ─── ZERO PREVIEW — FILE SPLITTER ────────────────────────────────────────────
// Takes a monolithic Dashboard.tsx and extracts components into separate files.
// The AI generates everything in 1 file. We split it deterministically.
// This avoids the AI needing to coordinate imports across files.

/**
 * Splits a monolithic component file into multiple files.
 * Returns a map of { path: contents } to merge into the files object.
 *
 * Strategy:
 * 1. Find all top-level function/const component declarations (PascalCase)
 * 2. Keep Dashboard (or the default export) in the main file
 * 3. Extract other components to src/components/{Name}.tsx
 * 4. Add import statements to the main file
 * 5. Add export default to each extracted file
 */
export function splitComponents(code, mainPath = "src/pages/Dashboard.tsx") {
  if (!code || code.length < 200) return { [mainPath]: code };

  // Find all component declarations with their full bodies
  const components = extractComponents(code);

  if (components.length <= 1) {
    // Nothing to split — single component or couldn't parse
    return { [mainPath]: code };
  }

  // Find the default export component name
  const defaultExportMatch = code.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  const mainComponent = defaultExportMatch?.[1] || "Dashboard";

  // Separate: main component stays, others get extracted
  const toExtract = components.filter(c => c.name !== mainComponent && c.name !== "App");
  const toKeep = components.filter(c => c.name === mainComponent || c.name === "App");

  if (toExtract.length === 0) return { [mainPath]: code };

  // Build the extracted files
  const result = {};
  const importLines = [];

  for (const comp of toExtract) {
    const filePath = `src/components/${comp.name}.tsx`;

    // Build the extracted file: imports from original + component + export
    const extractedCode = buildExtractedFile(comp, code);
    result[filePath] = extractedCode;

    importLines.push(`import ${comp.name} from "@/components/${comp.name}";`);
  }

  // Rebuild the main file: remove extracted components, add imports
  let mainCode = code;

  // Remove extracted component bodies from main file
  for (const comp of toExtract) {
    mainCode = mainCode.replace(comp.fullMatch, "");
  }

  // Add import lines after existing imports
  const lastImportIndex = findLastImportIndex(mainCode);
  if (lastImportIndex >= 0) {
    const lines = mainCode.split("\n");
    lines.splice(lastImportIndex + 1, 0, ...importLines);
    mainCode = lines.join("\n");
  }

  // Clean up multiple blank lines
  mainCode = mainCode.replace(/\n{3,}/g, "\n\n");

  result[mainPath] = mainCode;
  return result;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function extractComponents(code) {
  const components = [];

  // Match: function ComponentName(...) { ... }
  // or: const ComponentName = (...) => { ... }
  // We use a simple brace-counting approach for the body

  const patterns = [
    /(?:export\s+)?(?:default\s+)?function\s+([A-Z][a-zA-Z]+)\s*\([^)]*\)\s*\{/g,
    /(?:export\s+)?(?:default\s+)?const\s+([A-Z][a-zA-Z]+)\s*[=:][^{]*(?:=>|function)\s*\{/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1];
      const startIndex = match.index;

      // Find the closing brace by counting
      const body = findClosingBrace(code, match.index + match[0].length - 1);
      if (body) {
        const fullMatch = code.slice(startIndex, body.end + 1);
        // Only extract if it's a real component (returns JSX)
        if (fullMatch.includes("return") && (fullMatch.includes("<") || fullMatch.includes("jsx"))) {
          components.push({ name, startIndex, fullMatch });
        }
      }
    }
  }

  // Also catch class components
  const classPattern = /(?:export\s+)?(?:default\s+)?class\s+([A-Z][a-zA-Z]+)\s+extends\s+\S+\s*\{/g;
  let classMatch;
  while ((classMatch = classPattern.exec(code)) !== null) {
    const name = classMatch[1];
    const body = findClosingBrace(code, classMatch.index + classMatch[0].length - 1);
    if (body) {
      components.push({ name, startIndex: classMatch.index, fullMatch: code.slice(classMatch.index, body.end + 1) });
    }
  }

  return components;
}

function findClosingBrace(code, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < code.length; i++) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") {
      depth--;
      if (depth === 0) return { end: i };
    }
  }
  return null;
}

function findLastImportIndex(code) {
  const lines = code.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("import ")) lastImport = i;
  }
  return lastImport;
}

function buildExtractedFile(comp, originalCode) {
  // Collect imports the component might need
  const usedImports = [];

  // Check if component uses React hooks
  if (/useState|useEffect|useRef|useCallback|useMemo/.test(comp.fullMatch)) {
    const hooks = [];
    if (comp.fullMatch.includes("useState")) hooks.push("useState");
    if (comp.fullMatch.includes("useEffect")) hooks.push("useEffect");
    if (comp.fullMatch.includes("useRef")) hooks.push("useRef");
    if (comp.fullMatch.includes("useCallback")) hooks.push("useCallback");
    if (hooks.length) usedImports.push(`import { ${hooks.join(", ")} } from "react";`);
  }

  // Check for lucide icons
  const iconMatches = comp.fullMatch.match(/<([A-Z][a-zA-Z]+)\s+(?:size|className)/g) || [];
  const icons = [...new Set(iconMatches.map(m => m.match(/<([A-Z][a-zA-Z]+)/)?.[1]).filter(Boolean))];
  // Filter to likely Lucide icons (exclude our own components)
  const lucideIcons = icons.filter(i => !["Button", "Card", "Badge", "Input", "CardHeader", "CardTitle", "CardContent"].includes(i));
  if (lucideIcons.length) usedImports.push(`import { ${lucideIcons.join(", ")} } from "lucide-react";`);

  // Check for Shadcn components
  if (comp.fullMatch.includes("<Button")) usedImports.push(`import { Button } from "@/components/ui/button";`);
  if (comp.fullMatch.includes("<Card")) usedImports.push(`import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";`);
  if (comp.fullMatch.includes("<Badge")) usedImports.push(`import { Badge } from "@/components/ui/badge";`);
  if (comp.fullMatch.includes("<Input")) usedImports.push(`import { Input } from "@/components/ui/input";`);

  // Check for utils
  if (comp.fullMatch.includes("cn(")) usedImports.push(`import { cn } from "@/lib/utils";`);
  if (comp.fullMatch.includes("formatCurrency")) usedImports.push(`import { formatCurrency } from "@/lib/utils";`);
  if (comp.fullMatch.includes("formatDate")) usedImports.push(`import { formatDate } from "@/lib/utils";`);

  // Check for recharts
  const rechartsUsed = ["BarChart", "Bar", "LineChart", "Line", "PieChart", "Pie", "Cell", "XAxis", "YAxis", "CartesianGrid", "Tooltip", "Legend", "ResponsiveContainer", "AreaChart", "Area"]
    .filter(name => comp.fullMatch.includes(name));
  if (rechartsUsed.length) usedImports.push(`import { ${rechartsUsed.join(", ")} } from "recharts";`);

  // Deduplicate and merge utils imports
  const uniqueImports = [...new Set(usedImports)];

  // Build the file
  let file = uniqueImports.join("\n");
  if (file) file += "\n\n";

  // Add the component, ensuring export default
  let compCode = comp.fullMatch;
  if (!compCode.includes("export default")) {
    compCode = compCode.replace(
      /^(function|const)\s+/,
      "export default $1 "
    );
    // If that didn't work, add export at the end
    if (!compCode.includes("export default")) {
      compCode += `\n\nexport default ${comp.name};`;
    }
  }

  file += compCode + "\n";
  return file;
}
