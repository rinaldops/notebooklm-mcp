# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The `notebooklm-mcp` server and the VS Code extension share a single version.

## [0.1.1] — 2026-06-26

Initial public release.

### Added
- **MCP server** for Google NotebookLM via Patchright browser automation, distributed via `npx`.
- Tools: `notebooklm_ask`, `notebooklm_list_notebooks`, `notebooklm_list_remote_notebooks`, `notebooklm_describe_notebook` (Smart Add), `notebooklm_add_notebook`, `notebooklm_activate_notebook`, `notebooklm_remove_notebook`, `notebooklm_auth_status`.
- Interactive Google login and a local notebook library with Smart Add (auto-discovered metadata).
- **VS Code extension** (`RinaldoPS.notebooklm-mcp-vscode`), packaged as `.vsix` with the server **vendored** — Chromium is **not** bundled (installed on demand). Registers the server and auto-configures Claude Code / Cursor in the workspace.
- Internationalization: English-primary documentation with a Portuguese companion (`README.pt-br.md`), plus localized extension UI (`package.nls*.json`, `l10n/`).

[0.1.1]: https://github.com/rinaldops/notebooklm-mcp/releases/tag/v0.1.1
