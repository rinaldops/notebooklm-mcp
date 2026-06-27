import * as path from "node:path";
import { existsSync } from "node:fs";

/**
 * Caminho absoluto do CLI do servidor MCP (`dist/cli.js` do package
 * `notebooklm-mcp`).
 *
 * Duas situações:
 *  1. Produção (`.vsix` instalado): o servidor é VENDORADO em
 *     `<extension>/vendor/mcp-server/` (ver `scripts/vendor-server.mjs`).
 *     `__dirname` aqui é `<extension>/dist`, então subimos um nível.
 *  2. Dev (workspace): resolve via node_modules symlinkado pelo workspace.
 */
export function resolveServerCli(): string {
  const vendored = path.join(__dirname, "..", "vendor", "mcp-server", "dist", "cli.js");
  if (existsSync(vendored)) return vendored;

  // Fallback de desenvolvimento.
  const pkgJson = require.resolve("@rinaldops/notebooklm-mcp/package.json");
  return path.join(path.dirname(pkgJson), "dist", "cli.js");
}
