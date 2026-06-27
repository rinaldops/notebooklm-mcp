import * as vscode from "vscode";
import * as path from "node:path";
import { resolveServerCli } from "./server-path";
import { autoConfigureWorkspace } from "./auto-config";

/**
 * Roda um subcomando do CLI do servidor num terminal integrado. O login precisa
 * de browser visível e os comandos têm saída em tempo real — o terminal é a UX
 * mais simples e robusta (substitui o dashboard descartado).
 */
function runInTerminal(args: string[], name: string): void {
  const cli = resolveServerCli();
  const terminal = vscode.window.createTerminal({ name });
  terminal.show();
  terminal.sendText(`node "${cli}" ${args.join(" ")}`);
}

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("notebooklm.login", () =>
      runInTerminal(["login"], "NotebookLM: Login"),
    ),
    vscode.commands.registerCommand("notebooklm.status", () =>
      runInTerminal(["status"], "NotebookLM: Status"),
    ),
    vscode.commands.registerCommand("notebooklm.listRemote", () =>
      runInTerminal(["notebooks", "remote"], "NotebookLM: Notebooks da conta"),
    ),
    vscode.commands.registerCommand("notebooklm.autoConfigure", () =>
      autoConfigureWorkspace(false),
    ),
    vscode.commands.registerCommand("notebooklm.installBrowser", () => {
      // O servidor usa o Chrome do sistema (channel "chrome") por padrão; este
      // comando baixa o Chromium do Patchright como fallback. Roda no diretório
      // do servidor (vendorado ou dev), onde o Patchright está instalado.
      const serverDir = path.dirname(path.dirname(resolveServerCli()));
      const terminal = vscode.window.createTerminal({
        name: "NotebookLM: Instalar navegador",
        cwd: serverDir,
      });
      terminal.show();
      terminal.sendText("npx patchright install chromium");
    }),
  );
}
