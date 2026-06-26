# notebooklm-mcp

Servidor **MCP** (Model Context Protocol) para o **Google NotebookLM**, em TypeScript/Node,
via automação de browser com **Patchright**. Respostas ancoradas nas suas fontes (Gemini),
sem API oficial. Pensado para o Claude Code e qualquer cliente MCP.

> ⚠️ **Aviso.** Projeto não-oficial, sem afiliação com o Google. A automação de uma sessão
> logada pode ser considerada acesso automatizado sob os Termos do NotebookLM, com risco à
> conta. Use por sua conta e risco. Sujeito a limites de uso (ex.: ~50 perguntas/dia no plano free).

## Por que TS e não Python

O público de MCP/Claude Code sempre tem Node; Python adiciona atrito de instalação
(interpretador, venv, pip). Este projeto é um **port** da skill `notebooklm` (Python) para
TS, mantendo a lógica de automação já validada. Distribuição via `npx`, sem dashboard.

## Instalação e uso

```bash
# 1. Login interativo (uma vez; abre o browser para você logar no Google)
npx notebooklm-mcp login

# 2. Registrar no Claude Code (consome via stdio)
claude mcp add notebooklm -- npx -y notebooklm-mcp

# Gerência da biblioteca (opcional, também há tools MCP equivalentes)
npx notebooklm-mcp notebooks add "<url>" "Meu Notebook" "Descrição" "topico1,topico2"
npx notebooklm-mcp notebooks list
```

## Tools expostas

| Tool | Função |
|------|--------|
| `notebooklm_ask` | Pergunta a um notebook (ativo, por id ou por URL) |
| `notebooklm_list_notebooks` | Lista a biblioteca |
| `notebooklm_add_notebook` | Adiciona notebook |
| `notebooklm_activate_notebook` | Define o notebook ativo |
| `notebooklm_remove_notebook` | Remove notebook |
| `notebooklm_auth_status` | Status da sessão |

## Configuração (env)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `NOTEBOOKLM_CONFIG_DIR` | `~/.notebooklm-mcp` | Diretório de dados/sessão |
| `NOTEBOOKLM_HEADLESS` | `true` | Browser headless nas perguntas |
| `NOTEBOOKLM_BROWSER_CHANNEL` | `chrome` | Canal do Chromium (`chrome`/`msedge`/...) |
| `NOTEBOOKLM_DEFAULT_NOTEBOOK_URL` | — | Notebook padrão se nenhum ativo |

Veja [PLAN.md](./PLAN.md) para o plano de desenvolvimento e o estado de cada parte.

## Dev

```bash
npm install
npm run dev -- login     # roda via tsx, sem build
npm run build && npm start
```
