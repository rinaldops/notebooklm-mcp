<div align="center">

# 📓 notebooklm-mcp

**Servidor MCP (Model Context Protocol) para o Google NotebookLM** — respostas ancoradas
nas suas próprias fontes, com citações, dentro do Claude Code e de qualquer cliente MCP.

[![Versão](https://img.shields.io/badge/vers%C3%A3o-0.1.2-2E75B6)](CHANGELOG.md)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/RinaldoPS.notebooklm-mcp-vscode?label=Marketplace&logo=visualstudiocode&logoColor=white&color=4078C0)](https://marketplace.visualstudio.com/items?itemName=RinaldoPS.notebooklm-mcp-vscode)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-375623)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-1F3864)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6E56CF)](https://modelcontextprotocol.io)

🇧🇷 Português · 🇬🇧 [English](README.md)

</div>

> ⚠️ **Aviso.** Projeto não-oficial, sem afiliação com o Google. A automação de uma sessão
> logada pode ser considerada acesso automatizado sob os Termos do NotebookLM, com risco à
> conta. Use por sua conta e risco. Sujeito a limites de uso (ex.: ~50 perguntas/dia no plano free).

---

## ✨ Destaques

- **Respostas ancoradas nas fontes** — toda resposta vem dos seus documentos (Gemini), reduzindo drasticamente alucinações.
- **Qualquer cliente MCP** — funciona com Claude Code, Cursor e tudo que fala o Model Context Protocol via stdio.
- **Sem API oficial** — automação de browser com [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright), reaproveitando a sessão logada do Google.
- **Smart Add** — o próprio NotebookLM descreve nome, conteúdo e tópicos do notebook, mantendo a biblioteca precisa.
- **Sem atrito de Python** — TypeScript/Node puro, distribuído via `npx`. Sem interpretador, venv ou pip.

## 📋 Pré-requisitos

| Requisito | Observações |
|-----------|-------------|
| **Node.js ≥ 20** | Runtime do servidor e do CLI. |
| **Conta Google** | Com acesso aos seus notebooks do NotebookLM. |
| **Browser baseado em Chromium** | Google Chrome do sistema por padrão; o Chromium do Patchright pode ser instalado sob demanda. |

## 🚀 Instalação e uso

```bash
# 1. Login interativo (uma vez; abre o browser para você logar no Google)
npx @rinaldops/notebooklm-mcp login

# 2. Registrar no Claude Code (consome via stdio)
claude mcp add notebooklm -- npx -y @rinaldops/notebooklm-mcp

# Gerência da biblioteca (opcional, também há tools MCP equivalentes)
npx @rinaldops/notebooklm-mcp notebooks add "<url>" "Meu Notebook" "Descrição" "topico1,topico2"
npx @rinaldops/notebooklm-mcp notebooks list           # biblioteca local
npx @rinaldops/notebooklm-mcp notebooks remote         # todos os notebooks da conta
npx @rinaldops/notebooklm-mcp notebooks describe <url> # Smart Add: descobre metadados do notebook
```

> 💡 Prefere usar pelo editor? Instale a **extensão VS Code** em
> [packages/extension](packages/extension) — ela registra o servidor e auto-configura o
> Claude Code / Cursor no seu workspace.

### Smart Add (catalogar com metadados automáticos)

Fluxo recomendado para popular a biblioteca sem inventar descrições:

1. `notebooks remote` (ou a tool `notebooklm_list_remote_notebooks`) → pega a URL.
2. `notebooks describe <url>` (ou `notebooklm_describe_notebook`) → o próprio NotebookLM
   descreve nome, conteúdo e tópicos.
3. `notebooks add <url> <name> <description> <topics>` com base no passo 2.

## 🧰 Tools expostas

| Tool | Função |
|------|--------|
| `notebooklm_ask` | Pergunta a um notebook (ativo, por id ou por URL) |
| `notebooklm_list_notebooks` | Lista a biblioteca local |
| `notebooklm_list_remote_notebooks` | Descobre **todos** os notebooks da conta (raspa o painel) |
| `notebooklm_describe_notebook` | Smart Add: pergunta ao notebook o que ele contém (nome/descrição/tópicos) |
| `notebooklm_add_notebook` | Adiciona notebook |
| `notebooklm_activate_notebook` | Define o notebook ativo |
| `notebooklm_remove_notebook` | Remove notebook |
| `notebooklm_auth_status` | Status da sessão |

## ⚙️ Configuração (env)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `NOTEBOOKLM_CONFIG_DIR` | `~/.notebooklm-mcp` | Diretório de dados/sessão |
| `NOTEBOOKLM_HEADLESS` | `true` | Browser headless nas perguntas |
| `NOTEBOOKLM_BROWSER_CHANNEL` | `chrome` | Canal do Chromium (`chrome`/`msedge`/...) |
| `NOTEBOOKLM_DEFAULT_NOTEBOOK_URL` | — | Notebook padrão se nenhum ativo |

## 🛠️ Desenvolvimento

Monorepo com npm workspaces:

- [packages/mcp-server](packages/mcp-server) — o servidor MCP (publicável via `npx`).
- [packages/extension](packages/extension) — a extensão VS Code (registra/auto-configura o
  servidor). Build com `tsup`; depurar com **F5** (Extension Development Host).

```bash
npm install                 # instala todos os workspaces (a partir da raiz)
npm run build               # builda todos os packages
npm run typecheck

# Comandos do servidor (rodar dentro do package):
cd packages/mcp-server
npm run dev -- login        # login via tsx, sem build
npm start                   # node dist/cli.js (após build)
```

Veja [PLAN.md](./PLAN.md) para o plano de desenvolvimento e o estado de cada parte, e
[CHANGELOG.md](./CHANGELOG.md) para o histórico de versões.

## 📄 Licença

[MIT](LICENSE) © 2026 Rinaldo Paulino de Souza. Projeto não-oficial, sem afiliação com o
Google — use por sua conta e risco; veja o aviso no topo.
