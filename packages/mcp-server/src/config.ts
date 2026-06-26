/**
 * Configuração central: caminhos, seletores, args de browser e opções via env.
 * Port de `scripts/config.py` da skill Python.
 *
 * Os seletores do NotebookLM são a parte mais frágil (Google muda a SPA com
 * frequência) — mantenha-os aqui centralizados, exatamente como na skill.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

// Diretório de config: por padrão ~/.notebooklm-mcp (análogo a ~/.perplexity-mcp).
const CONFIG_DIR =
  process.env.NOTEBOOKLM_CONFIG_DIR ?? join(homedir(), ".notebooklm-mcp");
const DATA_DIR = join(CONFIG_DIR, "data");
const BROWSER_STATE_DIR = join(DATA_DIR, "browser_state");

export const config = {
  // --- Caminhos (espelham a estrutura data/ da skill) ---
  configDir: CONFIG_DIR,
  dataDir: DATA_DIR,
  browserStateDir: BROWSER_STATE_DIR,
  browserProfileDir: join(BROWSER_STATE_DIR, "browser_profile"),
  stateFile: join(BROWSER_STATE_DIR, "state.json"),
  authInfoFile: join(DATA_DIR, "auth_info.json"),
  libraryFile: join(DATA_DIR, "library.json"),

  // --- Opções via env ---
  headless: bool(process.env.NOTEBOOKLM_HEADLESS, true),
  browserChannel: process.env.NOTEBOOKLM_BROWSER_CHANNEL ?? "chrome",
  defaultNotebookUrl: process.env.NOTEBOOKLM_DEFAULT_NOTEBOOK_URL ?? "",

  // --- Browser ---
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  browserArgs: [
    "--disable-blink-features=AutomationControlled", // remove navigator.webdriver
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
  ],

  // --- Seletores do NotebookLM (port de config.py; VALIDAR ao vivo) ---
  queryInputSelectors: [
    "textarea.query-box-input", // primário
    'textarea[aria-label="Feld für Anfragen"]', // fallback alemão
    'textarea[aria-label="Input for queries"]', // fallback inglês
    // TODO: adicionar fallback PT-BR observado ao vivo (ex.: "Campo de consultas")
  ],
  responseSelectors: [
    ".to-user-container .message-text-content", // primário
    "[data-message-author='bot']",
    "[data-message-author='assistant']",
  ],
  // Botão de menu de opções da conversa e item de excluir histórico.
  // ATENÇÃO: hoje dependem do locale (PT). Ver nota de i18n no PLAN.md.
  conversationOptionsSelector: 'button[aria-label="Opções de conversa"]',
  thinkingSelector: "div.thinking-message",

  // --- Timeouts (ms) ---
  loginTimeoutMs: 10 * 60 * 1000,
  answerTimeoutMs: 180 * 1000,
  pageLoadTimeoutMs: 30 * 1000,
} as const;

/** Garante que os diretórios de dados existam antes de usar o browser. */
export function ensureDirs(): void {
  mkdirSync(config.browserProfileDir, { recursive: true });
  mkdirSync(config.dataDir, { recursive: true });
}
