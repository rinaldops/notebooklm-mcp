/**
 * Upsert idempotente de um servidor MCP num arquivo de config JSON que tem a
 * chave `mcpServers` (formato de Claude Code `.mcp.json`, Cursor `mcp.json`,
 * Claude Desktop `claude_desktop_config.json`).
 *
 * Funções PURAS (só fs/path) — sem dependência de `vscode`, para serem testáveis
 * isoladamente. Preservam todo o conteúdo existente do arquivo; só mexem na
 * entrada do nosso servidor.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";

export interface McpServerEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export type UpsertStatus = "created" | "updated" | "unchanged";

function normalize(entry: McpServerEntry): McpServerEntry {
  return {
    command: entry.command,
    args: entry.args,
    ...(entry.env && Object.keys(entry.env).length > 0 ? { env: entry.env } : {}),
  };
}

/**
 * Insere/atualiza `mcpServers[name]` em `configPath`. Cria o arquivo (e dirs) se
 * não existir. Lança se o arquivo existir mas não for JSON válido / objeto, para
 * nunca sobrescrever cegamente config feita à mão.
 */
export function upsertMcpServer(
  configPath: string,
  name: string,
  entry: McpServerEntry,
): UpsertStatus {
  let root: Record<string, unknown> = {};
  const fileExisted = existsSync(configPath);

  if (fileExisted) {
    const raw = readFileSync(configPath, "utf8").trim();
    if (raw.length > 0) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`Config MCP não é JSON válido: ${configPath}`);
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error(`Config MCP inesperada (raiz não é objeto): ${configPath}`);
      }
      root = parsed as Record<string, unknown>;
    }
  }

  const existingServers = root.mcpServers;
  const servers: Record<string, unknown> =
    typeof existingServers === "object" && existingServers !== null && !Array.isArray(existingServers)
      ? (existingServers as Record<string, unknown>)
      : {};

  const prev = servers[name];
  const next = normalize(entry);

  if (prev && JSON.stringify(prev) === JSON.stringify(next)) {
    return "unchanged";
  }

  servers[name] = next;
  root.mcpServers = servers;

  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(root, null, 2) + "\n", "utf8");

  return !fileExisted ? "created" : prev ? "updated" : "updated";
}

/** Remove `mcpServers[name]` se existir. Retorna true se removeu. */
export function removeMcpServer(configPath: string, name: string): boolean {
  if (!existsSync(configPath)) return false;
  const raw = readFileSync(configPath, "utf8").trim();
  if (!raw) return false;
  let root: Record<string, unknown>;
  try {
    root = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return false;
  }
  const servers = root.mcpServers as Record<string, unknown> | undefined;
  if (!servers || !(name in servers)) return false;
  delete servers[name];
  writeFileSync(configPath, JSON.stringify(root, null, 2) + "\n", "utf8");
  return true;
}
