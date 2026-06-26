#!/usr/bin/env node
/**
 * Entrypoint único (campo `bin`). Despacha:
 *   notebooklm-mcp [serve]      -> sobe o servidor MCP (stdio) — é o default
 *   notebooklm-mcp login        -> login interativo (browser visível)
 *   notebooklm-mcp status       -> status de autenticação
 *   notebooklm-mcp validate     -> valida a sessão salva (headless)
 *   notebooklm-mcp notebooks ...-> list | add | activate | remove
 *
 * O Claude Code roda `npx notebooklm-mcp` (sem args) => modo serve.
 */
import { startServer } from "./server.js";
import { interactiveLogin, authStatus, validateAuth } from "./auth/login.js";
import { NotebookLibrary } from "./notebooks/library.js";
import { listRemoteNotebooks } from "./notebooks/remote.js";
import { describeNotebook } from "./notebooks/smart.js";
import { BrowserManager } from "./browser/session.js";

async function main(): Promise<number> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case undefined:
    case "serve":
      await startServer();
      return -1; // mantém o processo vivo (stdio); não sai

    case "login":
      return (await interactiveLogin()) ? 0 : 1;

    case "status": {
      const s = authStatus();
      console.error(
        s.authenticated
          ? `Autenticado (sessão ~${s.stateAgeHours}h).`
          : "Não autenticado. Rode: notebooklm-mcp login",
      );
      return 0;
    }

    case "validate":
      console.error((await validateAuth()) ? "Sessão válida." : "Sessão inválida/expirada.");
      return 0;

    case "notebooks":
      return await notebooksCommand(rest);

    default:
      console.error(`Comando desconhecido: ${command}`);
      printUsage();
      return 1;
  }
}

async function notebooksCommand(args: string[]): Promise<number> {
  const lib = new NotebookLibrary();
  const [sub, ...rest] = args;
  switch (sub) {
    case "remote": {
      const { authenticated } = authStatus();
      if (!authenticated) {
        console.error("Não autenticado. Rode: notebooklm-mcp login");
        return 1;
      }
      const browser = new BrowserManager();
      try {
        const remote = await listRemoteNotebooks(browser);
        if (remote.length === 0) {
          console.error("Nenhum notebook encontrado na conta.");
          return 0;
        }
        const knownUrls = new Set(lib.list().map((nb) => nb.url));
        for (const nb of remote) {
          const inLib = knownUrls.has(nb.url) ? " [na biblioteca]" : "";
          const src = nb.sources != null ? ` (${nb.sources} fontes)` : "";
          console.error(`${nb.id}: ${nb.title || "(sem título)"}${src}${inLib}`);
        }
        return 0;
      } catch (err) {
        console.error(`Falha ao listar notebooks da conta: ${String(err)}`);
        return 1;
      } finally {
        await browser.close();
      }
    }
    case "describe": {
      // notebooks describe <url|id>
      const [target] = rest;
      const { authenticated } = authStatus();
      if (!authenticated) {
        console.error("Não autenticado. Rode: notebooklm-mcp login");
        return 1;
      }
      const url = target?.startsWith("http") ? target : lib.resolveUrl(target);
      if (!url) {
        console.error("Uso: notebooklm-mcp notebooks describe <url|id>");
        return 1;
      }
      const browser = new BrowserManager();
      try {
        console.error(await describeNotebook(browser, url));
        return 0;
      } catch (err) {
        console.error(`Falha ao descrever: ${String(err)}`);
        return 1;
      } finally {
        await browser.close();
      }
    }
    case "list": {
      const items = lib.list();
      if (items.length === 0) {
        console.error("Biblioteca vazia.");
        return 0;
      }
      for (const nb of items) {
        const mark = nb.id === lib.activeNotebookId ? " [ATIVO]" : "";
        console.error(`${nb.id}: ${nb.name}${mark}`);
      }
      return 0;
    }
    case "add": {
      // notebooks add <url> <name> <description> <topic1,topic2>
      const [url, name, description, topicsCsv] = rest;
      if (!url || !name || !description) {
        console.error("Uso: notebooklm-mcp notebooks add <url> <name> <description> [t1,t2]");
        return 1;
      }
      const topics = (topicsCsv ?? "").split(",").map((t) => t.trim()).filter(Boolean);
      const nb = lib.add({ url, name, description, topics });
      console.error(`Adicionado: ${nb.id}`);
      return 0;
    }
    case "activate": {
      const [id] = rest;
      if (!id) {
        console.error("Uso: notebooklm-mcp notebooks activate <id>");
        return 1;
      }
      console.error(`Ativo: ${lib.activate(id).name}`);
      return 0;
    }
    case "remove": {
      const [id] = rest;
      if (!id) {
        console.error("Uso: notebooklm-mcp notebooks remove <id>");
        return 1;
      }
      console.error(lib.remove(id) ? "Removido." : "Não encontrado.");
      return 0;
    }
    default:
      console.error("Subcomandos: list | remote | describe | add | activate | remove");
      return 1;
  }
}

function printUsage(): void {
  console.error(
    "Uso: notebooklm-mcp [serve|login|status|validate|notebooks <list|add|activate|remove>]",
  );
}

main()
  .then((code) => {
    if (code >= 0) process.exit(code);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
