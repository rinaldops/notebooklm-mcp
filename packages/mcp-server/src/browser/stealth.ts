/**
 * Utilitários de interação "humana". Port de `StealthUtils` em browser_utils.py.
 * A API do Patchright-JS espelha a do Patchright-Python, então o port é direto.
 */
import type { Page } from "patchright";

export function randomDelay(minMs = 100, maxMs = 500): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Digita caractere a caractere com jitter, como humanType() no Python. */
export async function humanType(
  page: Page,
  selector: string,
  text: string,
): Promise<void> {
  const element = await page
    .waitForSelector(selector, { timeout: 2000 })
    .catch(() => null);
  if (!element) {
    console.error(`[notebooklm] elemento não encontrado para digitar: ${selector}`);
    return;
  }
  await element.click();
  for (const char of text) {
    await element.type(char, { delay: 25 + Math.random() * 50 });
    if (Math.random() < 0.05) {
      await randomDelay(150, 400); // pausa ocasional de "pensar"
    }
  }
}

/** Clique com micro-movimento de mouse. Port de realistic_click(). */
export async function realisticClick(page: Page, selector: string): Promise<void> {
  const element = await page.$(selector);
  if (!element) return;
  const box = await element.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 5,
    });
  }
  await randomDelay(100, 300);
  await element.click();
  await randomDelay(100, 300);
}
