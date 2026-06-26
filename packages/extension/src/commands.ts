import * as vscode from "vscode";
import { resolveServerCli } from "./server-path";

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
  );
}
