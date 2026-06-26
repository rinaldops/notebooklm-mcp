import * as vscode from "vscode";
import { registerMcpProvider } from "./mcp-provider";
import { registerCommands } from "./commands";

/** Ponto de entrada da extensão. Registra o provider MCP e os comandos. */
export function activate(context: vscode.ExtensionContext): void {
  registerMcpProvider(context);
  registerCommands(context);
  console.log("[notebooklm-mcp] extensão ativada.");
}

export function deactivate(): void {
  // Recursos são liberados via context.subscriptions.
}
