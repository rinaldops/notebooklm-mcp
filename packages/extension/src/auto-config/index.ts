import * as vscode from "vscode";
import * as path from "node:path";
import { upsertMcpServer, type McpServerEntry, type UpsertStatus } from "./mcp-json";
import { resolveServerCli } from "../server-path";

const SERVER_NAME = "notebooklm";

/**
 * Entrada de servidor que escrevemos nas configs dos clientes. Usa o caminho
 * absoluto do CLI vendorado (não depende de publish no npm). Tradeoff: o caminho
 * muda quando a extensão atualiza de versão — por isso reescrevemos na ativação.
 */
export function buildServerEntry(): McpServerEntry {
  return { command: "node", args: [resolveServerCli()] };
}

interface Target {
  label: string;
  file: string;
}

/** Alvos de config MCP dentro do workspace aberto. */
function workspaceTargets(root: string): Target[] {
  return [
    { label: "Claude Code", file: path.join(root, ".mcp.json") },
    { label: "Cursor", file: path.join(root, ".cursor", "mcp.json") },
  ];
}

/**
 * Escreve/atualiza a config MCP dos clientes no workspace aberto. Idempotente.
 * @param silent não mostra mensagem quando nada mudou (uso na ativação).
 */
export async function autoConfigureWorkspace(silent = false): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    if (!silent) {
      vscode.window.showWarningMessage(
        vscode.l10n.t("NotebookLM: open a folder/workspace to auto-configure the MCP clients."),
      );
    }
    return;
  }

  let entry: McpServerEntry;
  try {
    entry = buildServerEntry();
  } catch (err) {
    vscode.window.showErrorMessage(
      vscode.l10n.t("NotebookLM: could not locate the server ({0}).", String(err)),
    );
    return;
  }

  const results: Array<{ label: string; status: UpsertStatus | "erro" }> = [];
  for (const target of workspaceTargets(folder.uri.fsPath)) {
    try {
      results.push({ label: target.label, status: upsertMcpServer(target.file, SERVER_NAME, entry) });
    } catch (err) {
      console.error(`[notebooklm] auto-config ${target.label}: ${String(err)}`);
      results.push({ label: target.label, status: "erro" });
    }
  }

  const changed = results.some((r) => r.status === "created" || r.status === "updated");
  if (silent && !changed) return;

  const summary = results.map((r) => `${r.label}: ${r.status}`).join(" | ");
  vscode.window.showInformationMessage(vscode.l10n.t("NotebookLM auto-config — {0}", summary));
}
