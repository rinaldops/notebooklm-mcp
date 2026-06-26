/**
 * Gerenciador de browser. Combina BrowserFactory (browser_utils.py) com o
 * conceito de "browser quente": mantém UM contexto persistente vivo durante
 * todo o ciclo de vida do processo MCP (que é longo), evitando o overhead de
 * abrir/fechar Chromium a cada pergunta — o ponto fraco da skill atual.
 */
import { chromium, type BrowserContext } from "patchright";
import { existsSync, readFileSync } from "node:fs";
import { config, ensureDirs } from "../config.js";

export class BrowserManager {
  private context: BrowserContext | null = null;

  /**
   * Retorna o contexto persistente, criando-o sob demanda. Reutilizado entre
   * chamadas para manter o browser "quente".
   * @param headless força modo headless; por padrão usa config (login passa false).
   */
  async getContext(headless: boolean = config.headless): Promise<BrowserContext> {
    if (this.context) return this.context;
    ensureDirs();

    const context = await chromium.launchPersistentContext(config.browserProfileDir, {
      channel: config.browserChannel, // "chrome" real
      headless,
      viewport: null,
      ignoreDefaultArgs: ["--enable-automation"],
      userAgent: config.userAgent,
      args: [...config.browserArgs],
    });

    await this.injectCookies(context);
    this.context = context;
    return context;
  }

  /**
   * Workaround do bug do Playwright #36139: cookies de sessão (expires=-1) não
   * persistem no user_data_dir; reinjetamos a partir de state.json salvo no login.
   * Port de BrowserFactory._inject_cookies.
   */
  private async injectCookies(context: BrowserContext): Promise<void> {
    if (!existsSync(config.stateFile)) return;
    try {
      const state = JSON.parse(readFileSync(config.stateFile, "utf8"));
      if (Array.isArray(state.cookies) && state.cookies.length > 0) {
        await context.addCookies(state.cookies);
      }
    } catch (err) {
      console.error(`[notebooklm] não foi possível injetar cookies: ${String(err)}`);
    }
  }

  /** Persiste o estado (cookies + storage) para reuso futuro. */
  async saveState(): Promise<void> {
    if (!this.context) return;
    await this.context.storageState({ path: config.stateFile });
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
  }
}
