<div align="center">

# 📓 NotebookLM MCP (extensão VS Code)

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/RinaldoPS.notebooklm-mcp-vscode?label=Marketplace&logo=visualstudiocode&logoColor=white&color=2E75B6)](https://marketplace.visualstudio.com/items?itemName=RinaldoPS.notebooklm-mcp-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/RinaldoPS.notebooklm-mcp-vscode?label=installs&color=1F3864)](https://marketplace.visualstudio.com/items?itemName=RinaldoPS.notebooklm-mcp-vscode)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-375623)](https://github.com/rinaldops/notebooklm-mcp/blob/main/LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6E56CF)](https://modelcontextprotocol.io)

🇧🇷 Português · 🇬🇧 [English](https://github.com/rinaldops/notebooklm-mcp/blob/main/packages/extension/README.md)

</div>

> **⚠️ Experimental — Aviso importante.** Este é um projeto **não-oficial,
> mantido pela comunidade**, para o Google NotebookLM. **Não tem afiliação,
> endosso ou patrocínio do Google.** Ele automatiza uma sessão de navegador
> logada, o que **pode ser considerado acesso automatizado / scraping / uso
> técnico indevido** sob os Termos do NotebookLM: sua conta Google pode ser
> **limitada, suspensa ou encerrada**. O Google pode mudar ou bloquear esse
> comportamento a qualquer momento. **A responsabilidade é exclusivamente sua**
> por garantir que seu uso esteja em conformidade com os termos, políticas e a
> legislação aplicável do NotebookLM. Fornecido **"no estado em que se encontra",
> sem qualquer garantia**. Não use onde confiabilidade, correção ou conformidade
> com políticas sejam críticas. Sujeito a limites (~50 perguntas/dia no plano
> gratuito).

Empacota o **servidor MCP do Google NotebookLM** e o disponibiliza no editor:
registra-o no VS Code e **auto-configura** outros clientes MCP (Claude Code,
Cursor) no workspace aberto. Respostas ancoradas nas suas fontes (Gemini), via
automação de browser (Patchright). Sem API oficial.

## O que faz

- Registra o servidor MCP `notebooklm` no VS Code (`mcpServerDefinitionProviders`).
- **Auto-config** na ativação: escreve `.mcp.json` (Claude Code) e
  `.cursor/mcp.json` (Cursor) no workspace — o servidor aparece sem configuração
  manual. Desligável em `notebooklm.autoConfigureOnActivate`.
- Comandos: **Login**, **Status**, **Listar notebooks da conta**,
  **Auto-configurar clientes MCP**, **Instalar navegador (Chromium)**.

## Primeiro uso

1. Abra a paleta de comandos com **`Ctrl+Shift+P`** (no Mac, `Cmd+Shift+P`),
   digite **`NotebookLM: Login`** e pressione Enter. Conclua o login do Google na
   janela do navegador que abrir.
2. Pronto — o servidor `notebooklm` fica disponível no seu cliente MCP
   (Claude Code / Cursor), sem configuração manual.
3. Para testar, peça ao agente do seu cliente: **"Liste todos os meus notebooks
   do NotebookLM"**. Se ele responder com a lista, está funcionando.

> Todo comando é executado da mesma forma: abra a paleta
> (`Ctrl+Shift+P` / `Cmd+Shift+P`) e digite o nome dele (ex.: `NotebookLM: Status`).

## Navegador

O servidor usa o **Google Chrome do sistema** por padrão. Se não houver Chrome,
rode **`NotebookLM: Instalar navegador (Chromium)`** pela paleta de comandos
(baixa o Chromium do Patchright sob demanda — **não** é embarcado no `.vsix`).

## Configurações

| Configuração | Padrão | Descrição |
|---|---|---|
| `notebooklm.autoConfigureOnActivate` | `true` | Escreve a config MCP de Claude Code/Cursor ao ativar. |

## Licença e isenção

MIT. Projeto não-oficial, sem afiliação com o Google. Use por sua conta e risco —
veja o aviso no topo.
