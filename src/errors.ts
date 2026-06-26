/**
 * Mensagens de erro amigáveis (PT) e mapeamento de causas comuns para texto
 * acionável. As tools e o CLI devolvem `friendlyError(err)` em vez de stack
 * traces, para que o usuário saiba o que fazer (logar de novo, esperar, etc.).
 */

export const ERR = {
  notAuthenticated:
    "Não autenticado. Rode `notebooklm-mcp login` uma vez no terminal.",
  sessionExpired:
    "Sessão expirada (o Google pediu login novamente). Rode `notebooklm-mcp login`.",
  rateLimit:
    "Limite de uso do NotebookLM atingido (≈50 perguntas/dia no plano gratuito). " +
    "Tente mais tarde ou use outra conta Google.",
  inputNotFound:
    "Campo de pergunta não encontrado. A página do NotebookLM pode ter mudado, a URL " +
    "pode estar incorreta, ou a sessão expirou (tente `notebooklm-mcp login`).",
  answerTimeout:
    "Tempo esgotado aguardando a resposta do NotebookLM (serviço lento ou sobrecarregado). " +
    "Tente novamente.",
} as const;

const KNOWN = new Set<string>(Object.values(ERR));

/** Converte qualquer erro numa mensagem amigável em PT. */
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (KNOWN.has(msg)) return msg; // já é uma das nossas mensagens

  const lower = msg.toLowerCase();
  if (lower.includes("executable doesn't exist") || lower.includes("looks like patchright")) {
    return "Chromium não encontrado. Rode `npx patchright install chromium` e tente de novo.";
  }
  if (lower.includes("accounts.google.com")) return ERR.sessionExpired;
  if (lower.includes("timeout")) return ERR.answerTimeout;
  return `Erro: ${msg}`;
}
