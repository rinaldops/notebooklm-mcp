import * as vscode from "vscode";
import * as path from "node:path";
import { resolveServerCli } from "./server-path";

/**
 * Registra o servidor MCP no VS Code via `registerMcpServerDefinitionProvider`.
 * O id ("notebooklm") deve casar com `contributes.mcpServerDefinitionProviders`
 * no package.json. O VS Code faz o spawn (stdio) da definição retornada.
 *
 * ⚠️ Esta API serve o agente do PRÓPRIO VS Code. Para Claude Code/Cursor, a
 * configuração é feita escrevendo os `mcp.json` deles (auto-config — etapa 3).
 */
export function registerMcpProvider(context: vscode.ExtensionContext): void {
  const didChange = new vscode.EventEmitter<void>();
  context.subscriptions.push(didChange);

  const provider: vscode.McpServerDefinitionProvider = {
    onDidChangeMcpServerDefinitions: didChange.event,
    provideMcpServerDefinitions: () => {
      const cli = resolveServerCli();
      // Construtor posicional: (label, command, args?, env?, version?).
      const def = new vscode.McpStdioServerDefinition("NotebookLM MCP", "node", [cli]);
      def.cwd = vscode.Uri.file(path.dirname(cli));
      return [def];
    },
    resolveMcpServerDefinition: (server) => {
      // TODO Fase 5: garantir login + Chromium presentes antes do start
      // (mostrar "NotebookLM: Login" se faltar sessão).
      return server;
    },
  };

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider("notebooklm", provider),
  );
}
