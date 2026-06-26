/**
 * Fluxo de pergunta ao NotebookLM. Port fiel de `scripts/ask_question.py`.
 *
 * Replicamos a lógica difícil que a skill já resolveu:
 *  1. Limpar o histórico persistente da conversa (senão o poller lê resposta antiga).
 *  2. Registrar um baseline (contagem + texto da última resposta).
 *  3. Digitar, enviar e fazer polling até o texto ficar ESTÁVEL e ser NOVO.
 */
import type { Page } from "patchright";
import { BrowserManager } from "./browser/session.js";
import { humanType, randomDelay } from "./browser/stealth.js";
import { config } from "./config.js";
import { ERR } from "./errors.js";

const FOLLOW_UP_REMINDER =
  "\n\nEXTREMELY IMPORTANT: Is that ALL you need to know? You can always ask " +
  "another question! Before replying to the user, review their original request " +
  "and this answer; if anything is unclear or missing, ask another comprehensive " +
  "question (each question opens a fresh conversation).";

/** Espera o primeiro seletor de uma lista ficar visível. */
async function waitForFirst(
  page: Page,
  selectors: readonly string[],
  timeout: number,
): Promise<string | null> {
  for (const selector of selectors) {
    const el = await page
      .waitForSelector(selector, { timeout, state: "visible" })
      .catch(() => null);
    if (el) return selector;
  }
  return null;
}

/**
 * Apaga o histórico persistente da conversa. Port de clear_chat_history().
 * ATENÇÃO: depende de textos de UI em PT ("Excluir histórico..."). Ver i18n no PLAN.md.
 */
async function clearChatHistory(page: Page): Promise<boolean> {
  try {
    const optionsBtn = await page.$(config.conversationOptionsSelector);
    if (!optionsBtn) return false; // chat vazio
    await optionsBtn.click();
    await randomDelay(1200, 1800);

    let deleteClicked = false;
    const items = await page.$$('[role="menuitem"], button[mat-menu-item], .mat-mdc-menu-item');
    for (const item of items) {
      const text = (await item.innerText().catch(() => "")) ?? "";
      const label = text.toLowerCase();
      if (
        label.includes("excluir hist") ||
        label.includes("delete chat") ||
        label.includes("delete conversation")
      ) {
        await item.click();
        await randomDelay(1200, 1800);
        deleteClicked = true;
        break;
      }
    }

    if (!deleteClicked) {
      await page.keyboard.press("Escape").catch(() => {});
      return false;
    }

    // Confirma no diálogo clicando em "Excluir".
    const dialog = await page
      .waitForSelector('mat-dialog-container, [role="dialog"]', { timeout: 3_000 })
      .catch(() => null);
    if (dialog) {
      for (const btn of await dialog.$$("button")) {
        const label = ((await btn.innerText().catch(() => "")) ?? "").trim();
        const normalized = label.toLowerCase();
        if (
          normalized === "excluir" ||
          normalized === "delete" ||
          (normalized.includes("excluir") && !normalized.includes("cancel")) ||
          (normalized.includes("delete") && !normalized.includes("cancel"))
        ) {
          await btn.click();
          await randomDelay(1500, 2500);
          return true;
        }
      }
      await page.keyboard.press("Escape").catch(() => {});
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[notebooklm] clearChatHistory: ${String(err)}`);
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
}

/** Snapshot do estado antes de perguntar: contagem e texto da última resposta. */
async function snapshotBaseline(
  page: Page,
): Promise<{ count: number; text: string | null }> {
  for (const selector of config.responseSelectors) {
    const els = await page.$$(selector);
    if (els.length > 0) {
      const last = els[els.length - 1]!;
      return { count: els.length, text: cleanResponseText(await last.innerText()) };
    }
  }
  return { count: 0, text: null };
}

function cleanResponseText(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "more_horiz");

  return lines
    .join("\n")
    .replace(/\n(\d+)\n([.,;:!?])/g, " [$1]$2")
    .replace(/\n(\d+)(?=\n|$)/g, " [$1]")
    .replace(/\n([.,;:!?])/g, "$1")
    .trim();
}

/**
 * Polling até a resposta ser nova (count cresceu OU texto difere do baseline)
 * E estável por 3 leituras consecutivas. Port do loop de ask_question.py.
 */
async function pollStableAnswer(
  page: Page,
  baselineCount: number,
  baselineText: string | null,
): Promise<string | null> {
  const deadline = Date.now() + config.answerTimeoutMs;
  let lastText: string | null = null;
  let stableCount = 0;

  while (Date.now() < deadline) {
    // Se ainda está "pensando", aguarda.
    const thinking = await page.$(config.thinkingSelector);
    if (thinking && (await thinking.isVisible().catch(() => false))) {
      await randomDelay(800, 1200);
      continue;
    }

    for (const selector of config.responseSelectors) {
      const els = await page.$$(selector);
      if (els.length === 0) continue;
      const text = cleanResponseText(await els[els.length - 1]!.innerText());
      const isNew =
        els.length > baselineCount ||
        (baselineText !== null && text !== baselineText);
      if (text && isNew) {
        if (text === lastText) {
          if (++stableCount >= 3) return text;
        } else {
          stableCount = 0;
          lastText = text;
        }
      }
    }
    await randomDelay(800, 1200);
  }
  return null;
}

/**
 * Detecção best-effort de rate limit / erro do serviço via snackbar/toast.
 * O texto exato varia e pode mudar; cobrimos PT e EN com palavras-chave.
 */
async function detectRateLimit(page: Page): Promise<boolean> {
  const phrases = [
    "limit",
    "limite",
    "máximo",
    "maximum",
    "try again",
    "mais tarde",
    "too many",
    "quota",
  ];
  const toasts = await page.$$(
    'mat-snack-bar-container, .mat-mdc-snack-bar-label, [role="alert"]',
  );
  for (const toast of toasts) {
    const txt = ((await toast.innerText().catch(() => "")) ?? "").toLowerCase();
    if (txt && phrases.some((p) => txt.includes(p))) return true;
  }
  return false;
}

/**
 * Faz uma pergunta a um notebook e devolve a resposta.
 * @param appendReminder anexa o lembrete de follow-up (padrão). Descrições/Smart
 *   Add passam `false` para obter a resposta crua.
 */
export async function askNotebookLM(
  browser: BrowserManager,
  question: string,
  notebookUrl: string,
  appendReminder = true,
): Promise<string> {
  const context = await browser.getContext();
  const page = await context.newPage();
  try {
    await page.goto(notebookUrl, { waitUntil: "domcontentloaded" });
    // Se a sessão caiu, o Google redireciona ao login: erro claro e acionável.
    if (page.url().includes("accounts.google.com")) throw new Error(ERR.sessionExpired);
    await page
      .waitForURL(/^https:\/\/notebooklm\.google\.com\//, { timeout: 10_000 })
      .catch(() => {});
    if (page.url().includes("accounts.google.com")) throw new Error(ERR.sessionExpired);

    const inputSelector = await waitForFirst(page, config.queryInputSelectors, 10_000);
    if (!inputSelector) throw new Error(ERR.inputNotFound);

    await page.waitForTimeout(5_000); // deixa o histórico hidratar antes de limpar
    await clearChatHistory(page);
    await page.waitForSelector(".cdk-overlay-backdrop", { state: "hidden", timeout: 5_000 }).catch(
      () => page.keyboard.press("Escape").catch(() => {}),
    );
    await page.waitForTimeout(1_000);

    const baseline = await snapshotBaseline(page);

    await humanType(page, inputSelector, question);
    await page.keyboard.press("Enter");
    await randomDelay(500, 1500);

    const answer = await pollStableAnswer(page, baseline.count, baseline.text);
    if (!answer) {
      // Sem resposta: distingue rate limit (acionável) de lentidão genérica.
      if (await detectRateLimit(page)) throw new Error(ERR.rateLimit);
      throw new Error(ERR.answerTimeout);
    }
    return appendReminder ? answer + FOLLOW_UP_REMINDER : answer;
  } finally {
    await page.close().catch(() => {});
  }
}
