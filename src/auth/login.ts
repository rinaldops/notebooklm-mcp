/**
 * Autenticação Google/NotebookLM. Port de `scripts/auth_manager.py`.
 *
 * O login é interativo e NÃO automatizável (2FA, consent): abrimos o browser
 * VISÍVEL, o usuário loga manualmente, e capturamos os cookies de sessão.
 * Isto roda via CLI (`notebooklm-mcp login`), nunca dentro do servidor MCP.
 */
import { existsSync, statSync, writeFileSync } from "node:fs";
import { BrowserManager } from "../browser/session.js";
import { config, ensureDirs } from "../config.js";

const NOTEBOOKLM_HOME = "https://notebooklm.google.com";

function isOnNotebookLM(url: string): boolean {
  return url.includes("notebooklm.google.com") && !url.includes("accounts.google.com");
}

/** Existe estado de auth salvo? (não garante validade — ver validate()) */
export function isAuthenticated(): boolean {
  return existsSync(config.stateFile);
}

export function authStatus(): { authenticated: boolean; stateAgeHours?: number } {
  if (!existsSync(config.stateFile)) return { authenticated: false };
  const ageHours = (Date.now() - statSync(config.stateFile).mtimeMs) / 3_600_000;
  return { authenticated: true, stateAgeHours: Number(ageHours.toFixed(1)) };
}

/**
 * Login interativo com browser visível. Espera o usuário concluir o login do
 * Google e a URL voltar ao domínio do NotebookLM.
 */
export async function interactiveLogin(): Promise<boolean> {
  ensureDirs();
  const browser = new BrowserManager();
  try {
    const context = await browser.getContext(false); // headed
    const page = context.pages()[0] ?? (await context.newPage());

    await page.goto(NOTEBOOKLM_HOME, { waitUntil: "domcontentloaded" });

    if (isOnNotebookLM(page.url())) {
      console.error("✅ Já autenticado.");
      await browser.saveState();
      saveAuthInfo();
      return true;
    }

    console.error("⏳ Faça login na sua conta Google na janela que abriu...");
    await page.waitForURL(/^https:\/\/notebooklm\.google\.com\//, {
      timeout: config.loginTimeoutMs,
    });

    console.error("✅ Login detectado. Salvando sessão...");
    await browser.saveState();
    saveAuthInfo();
    return true;
  } catch (err) {
    console.error(`❌ Falha no login: ${String(err)}`);
    return false;
  } finally {
    await browser.close();
  }
}

/** Valida a sessão salva abrindo o NotebookLM headless. */
export async function validateAuth(): Promise<boolean> {
  if (!isAuthenticated()) return false;
  const browser = new BrowserManager();
  try {
    const context = await browser.getContext(true);
    const page = await context.newPage();
    await page.goto(NOTEBOOKLM_HOME, {
      waitUntil: "domcontentloaded",
      timeout: config.pageLoadTimeoutMs,
    });
    return isOnNotebookLM(page.url());
  } catch {
    return false;
  } finally {
    await browser.close();
  }
}

function saveAuthInfo(): void {
  writeFileSync(
    config.authInfoFile,
    JSON.stringify({ authenticated_at: new Date().toISOString() }, null, 2),
  );
}
