import * as path from "node:path";

/**
 * Caminho absoluto do CLI do servidor MCP (`dist/cli.js` do package
 * `notebooklm-mcp`). Em dev (workspace) resolve via node_modules symlinkado;
 * no `.vsix` resolverá o servidor vendorado (ver Fase 5: empacotamento).
 *
 * Usa o `package.json` (sem campo "exports") como âncora — funciona mesmo sem
 * o pacote expor um entrypoint para o CLI.
 */
export function resolveServerCli(): string {
  const pkgJson = require.resolve("notebooklm-mcp/package.json");
  return path.join(path.dirname(pkgJson), "dist", "cli.js");
}
