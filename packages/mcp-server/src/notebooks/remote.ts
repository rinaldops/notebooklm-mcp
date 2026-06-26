/**
 * Descoberta dos notebooks da CONTA (não da biblioteca local): raspa o dashboard
 * inicial do NotebookLM (https://notebooklm.google.com/) reaproveitando o browser
 * quente + cookies já injetados pelo BrowserManager.
 *
 * Não há API oficial; os cards são web components Angular. O sinal mais estável
 * é o atributo `id="project-<uuid>-title"` de cada card — extraímos o UUID dele
 * (em vez de depender de <a href>, que nem sempre existe). Ver protótipo validado
 * na skill Python (`list_remote_notebooks.py`).
 */
import type { Page } from "patchright";
import { BrowserManager } from "../browser/session.js";
import { config } from "../config.js";

export interface RemoteNotebook {
  id: string;
  url: string;
  title: string;
  sources: number | null;
}

const HOME = "https://notebooklm.google.com/";

/** Executado no contexto da página: varre os cards e devolve {id,title,sources}. */
const EXTRACT = `(() => {
  const UUID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const out = [];
  const seen = new Set();

  // Sinal primário: id="project-<uuid>-title" no elemento de título do card.
  document.querySelectorAll('[id^="project-"][id$="-title"]').forEach((el) => {
    const m = el.id.match(UUID);
    if (!m) return;
    const id = m[1];
    if (seen.has(id)) return;
    seen.add(id);
    const title = (el.innerText || "").trim();
    // Sobe alguns níveis até o card e procura "N fontes" / "N sources".
    let sources = null;
    let node = el;
    for (let i = 0; i < 6 && node; i++) {
      node = node.parentElement;
      if (!node) break;
      const sm = (node.innerText || "").match(/(\\d+)\\s*(fontes?|sources?)/i);
      if (sm) { sources = parseInt(sm[1], 10); break; }
    }
    out.push({ id, title, sources });
  });

  // Fallback: âncoras diretas para /notebook/<uuid> (layouts antigos).
  if (out.length === 0) {
    document.querySelectorAll('a[href*="/notebook/"]').forEach((a) => {
      const m = (a.href || "").match(UUID);
      if (!m) return;
      const id = m[1];
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ id, title: (a.innerText || "").trim(), sources: null });
    });
  }
  return out;
})()`;

/** Força o carregamento preguiçoso de todos os cards rolando a página. */
async function scrollToLoadAll(page: Page): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(800);
  }
  await page.mouse.wheel(0, -30000);
  await page.waitForTimeout(500);
}

/**
 * Lista os notebooks da conta autenticada. Reusa o contexto quente do
 * BrowserManager; abre e fecha apenas uma página.
 */
export async function listRemoteNotebooks(
  browser: BrowserManager,
): Promise<RemoteNotebook[]> {
  const context = await browser.getContext();
  const page = await context.newPage();
  try {
    await page.goto(HOME, {
      waitUntil: "domcontentloaded",
      timeout: config.pageLoadTimeoutMs,
    });
    if (page.url().includes("accounts.google.com")) {
      throw new Error(
        "Sessão expirada (redirecionado ao login). Rode `notebooklm-mcp login`.",
      );
    }

    // Espera ao menos um card hidratar; se nada aparecer, segue assim mesmo
    // (conta pode estar vazia) e o extrator devolve [].
    await page
      .waitForSelector('[id^="project-"][id$="-title"], a[href*="/notebook/"]', {
        timeout: 15_000,
      })
      .catch(() => null);
    await scrollToLoadAll(page);

    const raw = (await page.evaluate(EXTRACT)) as Array<{
      id: string;
      title: string;
      sources: number | null;
    }>;

    return raw.map((nb) => ({
      ...nb,
      url: `https://notebooklm.google.com/notebook/${nb.id}`,
    }));
  } finally {
    await page.close().catch(() => {});
  }
}
