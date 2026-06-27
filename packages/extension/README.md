# NotebookLM MCP (extensão VS Code)

Empacota o servidor **MCP do Google NotebookLM** e o disponibiliza no editor:
registra-o no VS Code e **auto-configura** outros clientes MCP (Claude Code,
Cursor) no workspace aberto. Respostas ancoradas nas suas fontes (Gemini), via
automação de browser (Patchright). Sem API oficial.

> ⚠️ Projeto não-oficial, sem afiliação com o Google. A automação de uma sessão
> logada pode violar os Termos do NotebookLM, com risco à conta. Use por sua
> conta e risco. Sujeito a limites (~50 perguntas/dia no plano gratuito).

## O que faz

- Registra o servidor MCP `notebooklm` no VS Code (`mcpServerDefinitionProviders`).
- **Auto-config** na ativação: escreve `.mcp.json` (Claude Code) e
  `.cursor/mcp.json` (Cursor) no workspace — o servidor aparece sem configuração
  manual. Desligável em `notebooklm.autoConfigureOnActivate`.
- Comandos: **Login**, **Status**, **Listar notebooks da conta**,
  **Auto-configurar clientes MCP**, **Instalar navegador (Chromium)**.

## Primeiro uso

1. Rode **NotebookLM: Login (Google)** e conclua o login na janela do browser.
2. O servidor `notebooklm` fica disponível no seu cliente MCP.
3. Pergunte aos seus notebooks pelo agente do cliente.

## Navegador

O servidor usa o **Google Chrome do sistema** por padrão. Se não houver Chrome,
rode **NotebookLM: Instalar navegador (Chromium)** (baixa o Chromium do
Patchright sob demanda — não é embarcado no `.vsix`).

## Configurações

| Configuração | Padrão | Descrição |
|---|---|---|
| `notebooklm.autoConfigureOnActivate` | `true` | Escreve a config MCP de Claude Code/Cursor ao ativar. |
