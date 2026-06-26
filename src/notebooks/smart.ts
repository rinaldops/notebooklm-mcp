/**
 * Smart Add: descoberta de metadados de um notebook perguntando ao próprio
 * NotebookLM o que ele contém, para catalogá-lo sem metadados manuais.
 * Port conceitual do fluxo "SMART ADD" da skill Python (SKILL.md).
 *
 * Mantém-se de propósito único: NÃO grava na biblioteca. Devolve a auto-descrição
 * (nome/descrição/tópicos sugeridos) para o agente revisar e então chamar
 * notebooklm_add_notebook. Compõe com notebooklm_list_remote_notebooks.
 */
import { BrowserManager } from "../browser/session.js";
import { askNotebookLM } from "../ask.js";

/**
 * Prompt de descoberta. Pede explicitamente nome curto, descrição e tópicos,
 * ancorando a resposta apenas nas fontes do notebook.
 */
export const DISCOVERY_QUESTION =
  "Faça um overview conciso do conteúdo DESTE notebook, baseado apenas nas suas " +
  "fontes, para catalogá-lo. Responda exatamente neste formato:\n" +
  "Nome: <um nome curto e descritivo>\n" +
  "Descrição: <1-2 frases sobre o que o notebook contém>\n" +
  "Tópicos: <lista separada por vírgulas dos principais temas>";

/**
 * Pergunta ao notebook sobre seu próprio conteúdo e devolve a resposta crua
 * (sem o lembrete de follow-up).
 */
export async function describeNotebook(
  browser: BrowserManager,
  notebookUrl: string,
): Promise<string> {
  return askNotebookLM(browser, DISCOVERY_QUESTION, notebookUrl, false);
}
