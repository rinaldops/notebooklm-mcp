/**
 * Vendoriza o servidor MCP para dentro da extensão, para o `.vsix` ser
 * autossuficiente (o usuário final não roda `npm install`).
 *
 * Copia `packages/mcp-server/dist` + `package.json` para
 * `packages/extension/vendor/mcp-server/` e instala ali as dependências de
 * PRODUÇÃO (@modelcontextprotocol/sdk, patchright, zod) — SEM baixar o Chromium
 * (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD). Patchright fica como arquivos (não é
 * bundlado, pois lê o próprio package.json em runtime).
 *
 * O Chromium NÃO entra no .vsix; em runtime o servidor usa o Chrome do sistema
 * (channel "chrome") ou o comando "NotebookLM: Instalar navegador".
 */
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(here, "..");
const serverDir = path.resolve(extDir, "..", "mcp-server");
const vendorRoot = path.join(extDir, "vendor");
const vendorDir = path.join(vendorRoot, "mcp-server");

console.log("[vendor] build do servidor...");
execSync("npm run build", { cwd: serverDir, stdio: "inherit" });

console.log("[vendor] limpando vendor/ anterior...");
rmSync(vendorRoot, { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });

console.log("[vendor] copiando dist/ e package.json...");
cpSync(path.join(serverDir, "dist"), path.join(vendorDir, "dist"), { recursive: true });

// package.json sem "scripts" (remove o postinstall `patchright install chromium`,
// que baixaria o Chromium ao instalar as deps de produção).
const pkg = JSON.parse(readFileSync(path.join(serverDir, "package.json"), "utf8"));
delete pkg.scripts;
delete pkg.devDependencies;
writeFileSync(path.join(vendorDir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

console.log("[vendor] instalando deps de produção (sem Chromium)...");
execSync("npm install --omit=dev --no-package-lock --no-audit --no-fund", {
  cwd: vendorDir,
  stdio: "inherit",
  env: {
    ...process.env,
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
    PATCHRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
  },
});

console.log("[vendor] OK ->", vendorDir);
