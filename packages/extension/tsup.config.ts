import { defineConfig } from "tsup";

// Extension host roda em CommonJS. `vscode` é injetado pelo runtime do VS Code,
// então é sempre external. As deps do servidor (notebooklm-mcp/patchright) NÃO
// são bundladas aqui — serão vendoradas no .vsix (ver Fase 5: empacotamento).
export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"],
  outDir: "dist",
  target: "node20",
  external: ["vscode"],
  sourcemap: true,
  clean: true,
});
