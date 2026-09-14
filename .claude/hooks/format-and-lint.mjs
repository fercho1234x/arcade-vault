// PostToolUse hook (Write|Edit): formatea con Prettier y corrige con ESLint
// los archivos de React/TS/JS y Markdown que Claude crea o edita.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PRETTIER_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".md", ".mdx"]);
const ESLINT_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const filePath = input.tool_input?.file_path ?? input.tool_response?.filePath;
if (!filePath || !existsSync(filePath)) process.exit(0);

const ext = path.extname(filePath).toLowerCase();
if (!PRETTIER_EXTS.has(ext)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const run = (bin, args) =>
  spawnSync(process.execPath, [path.join(root, bin), ...args], { cwd: root, encoding: "utf8" });

const prettier = run("node_modules/prettier/bin/prettier.cjs", ["--write", filePath]);
if (prettier.status !== 0) {
  process.stderr.write(`Prettier falló en ${filePath}:\n${prettier.stderr}`);
  process.exit(2);
}

if (ESLINT_EXTS.has(ext)) {
  const eslint = run("node_modules/eslint/bin/eslint.js", ["--fix", "--no-warn-ignored", filePath]);
  if (eslint.status !== 0) {
    // Exit 2 devuelve los errores restantes a Claude para que los corrija.
    process.stderr.write(`ESLint encontró problemas en ${filePath}:\n${eslint.stdout}${eslint.stderr}`);
    process.exit(2);
  }
}
