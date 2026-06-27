# dev-sandbox

Pasta de teste aberta automaticamente pelo F5 (Extension Development Host).

Ao ativar a extensão aqui, a auto-config escreve:
- `.mcp.json` (Claude Code) com o servidor `notebooklm`
- `.cursor/mcp.json` (Cursor)

Esses arquivos gerados são ignorados pelo git (ver `.gitignore`). Esta pasta
existe só para validar a extensão em dev; não faz parte do produto.
