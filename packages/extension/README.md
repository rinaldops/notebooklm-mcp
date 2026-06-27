<div align="center">

# 📓 NotebookLM MCP (VS Code extension)

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/RinaldoPS.notebooklm-mcp-vscode?label=Marketplace&logo=visualstudiocode&logoColor=white&color=2E75B6)](https://marketplace.visualstudio.com/items?itemName=RinaldoPS.notebooklm-mcp-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/RinaldoPS.notebooklm-mcp-vscode?label=installs&color=1F3864)](https://marketplace.visualstudio.com/items?itemName=RinaldoPS.notebooklm-mcp-vscode)
[![License](https://img.shields.io/badge/license-MIT-375623)](https://github.com/rinaldops/notebooklm-mcp/blob/main/LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6E56CF)](https://modelcontextprotocol.io)

🇧🇷 [Português](https://github.com/rinaldops/notebooklm-mcp/blob/main/packages/extension/README.pt-br.md) · 🇬🇧 English

</div>

> **⚠️ Experimental — Important notice.** This project is an **unofficial,
> community-maintained** integration for Google NotebookLM. It is **not
> affiliated with, endorsed by, or sponsored by Google**. It automates a
> logged-in browser session, which **may be considered automated access /
> scraping / technical misuse** under NotebookLM's Terms of Service: your Google
> account could be **rate-limited, suspended, or terminated**. Google may change
> or block this behavior at any time. **You are solely responsible** for ensuring
> your use complies with NotebookLM's terms, policies, and applicable law.
> Provided **"as is", without any warranty**. Do not use it for anything where
> reliability, correctness, or policy compliance are critical. Subject to usage
> limits (~50 questions/day on the free plan).

Packages the **Google NotebookLM MCP server** and makes it available inside your
editor: it registers the server in VS Code and **auto-configures** other MCP
clients (Claude Code, Cursor) in the open workspace. Answers are grounded in your
own sources (Gemini), via browser automation (Patchright). No official API.

## What it does

- Registers the `notebooklm` MCP server in VS Code (`mcpServerDefinitionProviders`).
- **Auto-config** on activation: writes `.mcp.json` (Claude Code) and
  `.cursor/mcp.json` (Cursor) in the workspace — the server shows up with no
  manual setup. Can be turned off via `notebooklm.autoConfigureOnActivate`.
- Commands: **Login**, **Status**, **List account notebooks**,
  **Auto-configure MCP clients**, **Install browser (Chromium)**.

## First use

1. Open the Command Palette with **`Ctrl+Shift+P`** (on macOS, `Cmd+Shift+P`),
   type **`NotebookLM: Login`** and press Enter. Complete the Google login in the
   browser window that opens.
2. Done — the `notebooklm` server is now available in your MCP client
   (Claude Code / Cursor), with no manual configuration.
3. To test it, ask your client's agent: **"List all my NotebookLM notebooks"**.
   If it replies with the list, everything is working.

> Every command is run the same way: open the Command Palette
> (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type its name (e.g. `NotebookLM: Status`).

## Browser

The server uses the **system Google Chrome** by default. If Chrome is not
installed, run **`NotebookLM: Install browser (Chromium)`** from the Command
Palette (it downloads Patchright's Chromium on demand — it is **not** bundled in
the `.vsix`).

## Settings

| Setting | Default | Description |
|---|---|---|
| `notebooklm.autoConfigureOnActivate` | `true` | Writes the Claude Code/Cursor MCP config on activation. |

## License & disclaimer

MIT. Unofficial project, not affiliated with Google. Use at your own risk — see
the notice at the top.
