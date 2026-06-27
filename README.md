<div align="center">

# 📓 notebooklm-mcp

**MCP (Model Context Protocol) server for Google NotebookLM** — source-grounded,
citation-backed answers from your own documents, inside Claude Code and any MCP client.

[![Version](https://img.shields.io/badge/version-0.1.2-2E75B6)](CHANGELOG.md)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/RinaldoPS.notebooklm-mcp-vscode?label=Marketplace&logo=visualstudiocode&logoColor=white&color=4078C0)](https://marketplace.visualstudio.com/items?itemName=RinaldoPS.notebooklm-mcp-vscode)
[![License](https://img.shields.io/badge/license-MIT-375623)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-1F3864)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6E56CF)](https://modelcontextprotocol.io)

🇬🇧 English · 🇧🇷 [Português](README.pt-br.md)

</div>

> ⚠️ **Notice.** Unofficial project, not affiliated with Google. Automating a logged-in
> session may be considered automated access under NotebookLM's Terms, with risk to your
> account. Use at your own risk. Subject to usage limits (e.g. ~50 questions/day on the free plan).

---

## ✨ Highlights

- **Source-grounded answers** — every reply comes from your uploaded documents (Gemini), drastically reducing hallucinations.
- **Any MCP client** — works with Claude Code, Cursor, and anything that speaks the Model Context Protocol over stdio.
- **No official API** — browser automation with [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright), reusing a logged-in Google session.
- **Smart Add** — NotebookLM itself describes a notebook's name, content, and topics so your library stays accurate.
- **Zero Python friction** — pure TypeScript/Node, distributed via `npx`. No interpreter, venv, or pip.

## 📋 Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js ≥ 20** | Runtime for the server and CLI. |
| **Google account** | With access to your NotebookLM notebooks. |
| **Chromium-based browser** | System Google Chrome by default; Patchright's Chromium can be installed on demand. |

## 🚀 Installation & usage

```bash
# 1. Interactive login (once; opens the browser for you to log in to Google)
npx notebooklm-mcp login

# 2. Register with Claude Code (consumed over stdio)
claude mcp add notebooklm -- npx -y notebooklm-mcp

# Library management (optional; equivalent MCP tools also exist)
npx notebooklm-mcp notebooks add "<url>" "My Notebook" "Description" "topic1,topic2"
npx notebooklm-mcp notebooks list           # local library
npx notebooklm-mcp notebooks remote         # all notebooks in the account
npx notebooklm-mcp notebooks describe <url> # Smart Add: discovers the notebook's metadata
```

> 💡 Prefer the editor experience? Install the **VS Code extension** in
> [packages/extension](packages/extension) — it registers the server and auto-configures
> Claude Code / Cursor in your workspace.

### Smart Add (catalog with automatic metadata)

Recommended flow to populate the library without making up descriptions:

1. `notebooks remote` (or the `notebooklm_list_remote_notebooks` tool) → get the URL.
2. `notebooks describe <url>` (or `notebooklm_describe_notebook`) → NotebookLM itself
   describes the name, content, and topics.
3. `notebooks add <url> <name> <description> <topics>` based on step 2.

## 🧰 Exposed tools

| Tool | Purpose |
|------|---------|
| `notebooklm_ask` | Ask a notebook (active, by id, or by URL) |
| `notebooklm_list_notebooks` | List the local library |
| `notebooklm_list_remote_notebooks` | Discover **all** notebooks in the account (scrapes the panel) |
| `notebooklm_describe_notebook` | Smart Add: ask the notebook what it contains (name/description/topics) |
| `notebooklm_add_notebook` | Add a notebook |
| `notebooklm_activate_notebook` | Set the active notebook |
| `notebooklm_remove_notebook` | Remove a notebook |
| `notebooklm_auth_status` | Session status |

## ⚙️ Configuration (env)

| Variable | Default | Description |
|----------|---------|-------------|
| `NOTEBOOKLM_CONFIG_DIR` | `~/.notebooklm-mcp` | Data/session directory |
| `NOTEBOOKLM_HEADLESS` | `true` | Headless browser for questions |
| `NOTEBOOKLM_BROWSER_CHANNEL` | `chrome` | Chromium channel (`chrome`/`msedge`/...) |
| `NOTEBOOKLM_DEFAULT_NOTEBOOK_URL` | — | Default notebook when none is active |

## 🛠️ Development

Monorepo with npm workspaces:

- [packages/mcp-server](packages/mcp-server) — the MCP server (publishable via `npx`).
- [packages/extension](packages/extension) — the VS Code extension (registers/auto-configures
  the server). Built with `tsup`; debug with **F5** (Extension Development Host).

```bash
npm install                 # install all workspaces (from the root)
npm run build               # build all packages
npm run typecheck

# Server commands (run inside the package):
cd packages/mcp-server
npm run dev -- login        # login via tsx, no build
npm start                   # node dist/cli.js (after build)
```

See [PLAN.md](./PLAN.md) for the development plan and the status of each part, and
[CHANGELOG.md](./CHANGELOG.md) for release history.

## 📄 License

[MIT](LICENSE) © 2026 Rinaldo Paulino de Souza. Unofficial project, not affiliated with
Google — use at your own risk; see the notice at the top.
