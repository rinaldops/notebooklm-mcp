import * as vscode from "vscode";
import { registerMcpProvider } from "./mcp-provider";
import { registerCommands } from "./commands";
import { autoConfigureWorkspace } from "./auto-config";

/** Ponto de entrada da extensão. Registra o provider MCP e os comandos. */
export function activate(context: vscode.ExtensionContext): void {
  registerMcpProvider(context);
  registerCommands(context);

  // Auto-config dos clientes MCP (Claude Code/Cursor) na ativação, se habilitado.
  // Idempotente e silencioso quando nada muda — não incomoda a cada abertura.
  const enabled = vscode.workspace
    .getConfiguration("notebooklm")
    .get<boolean>("autoConfigureOnActivate", true);
  if (enabled) {
    void autoConfigureWorkspace(true);
  }

  console.log("[notebooklm-mcp] extensão ativada.");
}

export function deactivate(): void {
  // Recursos são liberados via context.subscriptions.
}
