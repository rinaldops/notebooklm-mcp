/**
 * Servidor MCP: registra as tools `notebooklm_*` e as conecta à biblioteca e
 * ao fluxo de pergunta. Mantém UM BrowserManager vivo (browser quente).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BrowserManager } from "./browser/session.js";
import { NotebookLibrary } from "./notebooks/library.js";
import { askNotebookLM } from "./ask.js";
import { authStatus } from "./auth/login.js";

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

export function buildServer(): McpServer {
  const server = new McpServer({ name: "notebooklm", version: "0.1.0" });
  const library = new NotebookLibrary();
  const browser = new BrowserManager(); // vive enquanto o servidor viver

  server.registerTool(
    "notebooklm_ask",
    {
      title: "Perguntar ao NotebookLM",
      description:
        "Faz uma pergunta a um notebook do Google NotebookLM e retorna a resposta " +
        "ancorada nas fontes (Gemini). Usa o notebook ativo se nenhum for informado.",
      inputSchema: {
        question: z.string().describe("A pergunta, com todo o contexto necessário."),
        notebookId: z
          .string()
          .optional()
          .describe("ID do notebook na biblioteca (opcional; usa o ativo)."),
        notebookUrl: z
          .string()
          .optional()
          .describe("URL direta do notebook (opcional; tem prioridade sobre o id)."),
      },
    },
    async ({ question, notebookId, notebookUrl }) => {
      const { authenticated } = authStatus();
      if (!authenticated) {
        return text("Não autenticado. Rode `notebooklm-mcp login` uma vez no terminal.");
      }
      const url = notebookUrl ?? library.resolveUrl(notebookId);
      if (!url) {
        return text(
          "Nenhum notebook informado e não há notebook ativo. Adicione um com " +
            "notebooklm_add_notebook e ative, ou passe notebookUrl.",
        );
      }
      const answer = await askNotebookLM(browser, question, url);
      if (notebookId && library.get(notebookId)) library.markUsed(notebookId);
      return text(answer);
    },
  );

  server.registerTool(
    "notebooklm_list_notebooks",
    {
      title: "Listar notebooks",
      description: "Lista os notebooks da biblioteca local, marcando o ativo.",
      inputSchema: {},
    },
    async () => {
      const notebooks = library.list();
      if (notebooks.length === 0) return text("Biblioteca vazia.");
      const active = library.activeNotebookId;
      const lines = notebooks.map(
        (nb) =>
          `${nb.id === active ? "* " : "  "}${nb.id} — ${nb.name}` +
          (nb.description ? ` (${nb.description})` : ""),
      );
      return text(lines.join("\n"));
    },
  );

  server.registerTool(
    "notebooklm_add_notebook",
    {
      title: "Adicionar notebook",
      description:
        "Adiciona um notebook à biblioteca. Forneça uma descrição e tópicos úteis " +
        "para que o roteamento de perguntas escolha o notebook certo.",
      inputSchema: {
        url: z.string().describe("URL do notebook (https://notebooklm.google.com/notebook/...)."),
        name: z.string().describe("Nome descritivo."),
        description: z.string().describe("O que este notebook contém."),
        topics: z.array(z.string()).describe("Tópicos cobertos."),
      },
    },
    async ({ url, name, description, topics }) => {
      const nb = library.add({ url, name, description, topics });
      return text(`Notebook adicionado: ${nb.id}`);
    },
  );

  server.registerTool(
    "notebooklm_activate_notebook",
    {
      title: "Ativar notebook",
      description: "Define o notebook ativo (usado por padrão em notebooklm_ask).",
      inputSchema: { notebookId: z.string() },
    },
    async ({ notebookId }) => {
      const nb = library.activate(notebookId);
      return text(`Notebook ativo: ${nb.name}`);
    },
  );

  server.registerTool(
    "notebooklm_remove_notebook",
    {
      title: "Remover notebook",
      description: "Remove um notebook da biblioteca local.",
      inputSchema: { notebookId: z.string() },
    },
    async ({ notebookId }) => {
      const ok = library.remove(notebookId);
      return text(ok ? "Removido." : "Notebook não encontrado.");
    },
  );

  server.registerTool(
    "notebooklm_auth_status",
    {
      title: "Status de autenticação",
      description: "Informa se há sessão salva do Google/NotebookLM e sua idade.",
      inputSchema: {},
    },
    async () => {
      const status = authStatus();
      return text(
        status.authenticated
          ? `Autenticado (sessão com ~${status.stateAgeHours}h).`
          : "Não autenticado. Rode `notebooklm-mcp login`.",
      );
    },
  );

  return server;
}

/** Sobe o servidor MCP no transporte stdio. */
export async function startServer(): Promise<void> {
  const server = buildServer();
  await server.connect(new StdioServerTransport());
  // stdout é reservado ao protocolo MCP; logs sempre via stderr.
  console.error("[notebooklm] servidor MCP pronto (stdio).");
}
