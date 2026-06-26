# Plano de Desenvolvimento — notebooklm-mcp

Servidor MCP (TS/Node + Patchright, stdio), port da skill Python `notebooklm`, **empacotado
como extensão VS Code** no modelo do VSCode-Perplexity-MCP.

**Distribuição dupla:** (1) extensão VS Code (Marketplace, botão "Install", auto-configura o
servidor) e (2) `npx`/npm para clientes MCP fora do VS Code. O servidor é o mesmo núcleo nos
dois casos.

**SEM dashboard (UI React), COM extensão.** Dashboard e extensão são coisas DIFERENTES (ver
"Contexto da decisão"): o dashboard é a UI visual (descartada); a extensão é o empacotamento +
auto-config (mantida — é a ideia central do projeto).

## Referências de código-fonte (LER ANTES DE COMEÇAR)

Este projeto é um **port**. Os dois códigos de origem são essenciais e ficam FORA deste repo:

1. **Skill Python `notebooklm` (a especificação executável e já validada):**
   `C:\Users\hiper\.claude\skills\notebooklm\scripts\`
   - `config.py`, `browser_utils.py`, `notebook_manager.py`, `auth_manager.py`,
     `ask_question.py`, `browser_session.py`.
   - Cada arquivo TS em `src/` referencia, no cabeçalho, o `.py` que portou. Em caso de
     dúvida sobre comportamento/seletor/timing, **o `.py` é a fonte da verdade.** A lógica
     difícil (limpeza de histórico, baseline, polling estável, cookies #36139) já está
     resolvida lá — não reinvente, traduza.
   - Dados existentes reaproveitáveis: `data/library.json` (mesmo formato deste projeto).

2. **VSCode-Perplexity-MCP (referência de arquitetura da EXTENSÃO — Fase 5):**
   `https://github.com/Automations-Project/VSCode-Perplexity-MCP` (licença MIT).
   - Monorepo com npm workspaces: `packages/mcp-server` (motor), `packages/extension`
     (extension host + registro MCP + auto-config), `packages/webview` (**dashboard React —
     NÃO vamos replicar**), `packages/shared` (tipos/constantes).
   - Referência para: registro do MCP via API do VS Code (`mcpServerDefinitionProviders` +
     `registerMcpServerDefinitionProvider`), auto-config multi-IDE escrevendo `mcp.json`
     (`packages/extension/src/auto-config`), cifrar sessão (`vault.js`, keytar).
   - Empacotamento: **tsup** (2 alvos: extension host CJS + server ESM), `@vscode/vsce` p/ o
     `.vsix`; Patchright fica como dep externa (não bundlar — quebra ao ler `package.json` em
     runtime); Chromium NÃO embarcado no `.vsix` (baixar sob demanda na ativação).
   - **Não** copiar o cliente Perplexity (`client.ts`): é REST/SSE+Cloudflare, paradigma
     OPOSTO ao do NotebookLM (que é DOM-driven). Inútil aqui.

## Contexto da decisão (por quê)

TS e não Python: menor atrito de instalação para o público MCP/Claude Code (sempre tem Node).

**Dashboard ≠ Extensão (correção importante — o plano anterior conflava os dois):**
- **Dashboard** = a UI visual em React (no Perplexity, `packages/webview`). **DESCARTADO** por
  escolha explícita: a configuração por env/CLI/comandos basta; não queremos um painel gráfico.
- **Extensão** = o empacotamento que vira "Install" no VS Code Marketplace, registra o servidor
  MCP no IDE e auto-configura outros clientes (no Perplexity, `packages/extension`). **MANTIDA** —
  é a forma de distribuição desejada desde o início (modelo Perplexity MCP).

Ou seja: cortar o dashboard NÃO implica cortar a extensão. O servidor MCP continua existindo e
sendo reaproveitável via `npx`; a extensão é uma camada de distribuição/UX por cima dele.

## Princípios

- **Reuso conceitual, não literal.** A skill Python é a *especificação executável*; a API do
  Patchright-JS espelha a do Patchright-Python, então o port é mecânico.
- **Browser quente de graça.** O processo MCP é de vida longa → mantém UM contexto
  persistente vivo (`BrowserManager`), eliminando o overhead de abrir/fechar Chromium por
  pergunta que a skill tem hoje.
- **stdout é sagrado.** É o canal do protocolo MCP. Todo log vai para `stderr`.

## Arquitetura

> Desde a Fase 5, este `src/` vive em `packages/mcp-server/src/` (monorepo). A árvore abaixo
> mostra a estrutura interna do servidor; o `packages/extension/` é detalhado na Fase 5.

```
packages/mcp-server/src/
├── cli.ts              # bin: despacha serve|login|status|validate|notebooks
├── index.ts            # reexports (uso como lib)
├── server.ts           # McpServer + registro das tools notebooklm_*
├── config.ts           # caminhos, seletores, env            ← port config.py
├── ask.ts              # perguntar: limpar histórico+baseline+poll  ← port ask_question.py
├── auth/
│   └── login.ts        # login Google interativo + validate   ← port auth_manager.py
├── browser/
│   ├── session.ts      # BrowserManager (quente) + cookies #36139 ← port browser_utils.py
│   └── stealth.ts      # humanType / delays                   ← port StealthUtils
└── notebooks/
    ├── library.ts      # CRUD da biblioteca (library.json)    ← port notebook_manager.py
    ├── remote.ts       # descobre notebooks da CONTA (raspa o painel)  ← novo (sem origem .py)
    └── smart.ts        # Smart Add: descreve um notebook p/ catalogar  ← port do fluxo SMART ADD
```

## Mapa Python → TypeScript

| Python (skill) | TS (este projeto) | Estado |
|----------------|-------------------|--------|
| `config.py` | `src/config.ts` | ✅ portado (validar seletores ao vivo) |
| `browser_utils.py` :: `StealthUtils` | `src/browser/stealth.ts` | ✅ portado |
| `browser_utils.py` :: `BrowserFactory` | `src/browser/session.ts` | ✅ portado + browser quente |
| `notebook_manager.py` | `src/notebooks/library.ts` | ✅ portado |
| `auth_manager.py` | `src/auth/login.ts` | ✅ portado (esqueleto) |
| `ask_question.py` | `src/ask.ts` | ✅ portado (esqueleto) |
| `run.py` (wrapper venv) | — | ❌ não aplicável (Node não precisa) |
| `browser_session.py` (sessão conversacional) | (Fase 4) | ⬜ futuro |

## Fases

### Fase 0 — Bootstrap ✅ (este esqueleto)
- [x] `package.json`, `tsconfig.json`, `.gitignore`
- [x] Estrutura de pastas e stubs portados
- [x] `npm install` + `npm run typecheck` passando (ajustar versões de deps se preciso)

### Fase 1 — Login e sessão (caminho crítico)
- [x] `npx notebooklm-mcp login` abre Chrome visível e captura cookies → `state.json`
- [x] Validar o workaround de cookies (#36139) com sessão Google real
- [x] `validate` confirma sessão headless
- [x] **Risco**: 2FA / consent / "verifique que é você" do Google. Testar conta real.

### Fase 2 — Pergunta ponta a ponta
- [x] `askNotebookLM` responde via browser quente num notebook real
- [x] **Validar seletores ao vivo** (`queryInputSelectors`, `responseSelectors`,
      `conversationOptionsSelector`) — provavelmente diferem do PT/EN; ajustar.
- [x] Resolver i18n do `clearChatHistory` (ver Riscos) — PT validado ao vivo; fallback EN.
- [x] Confirmar polling estável não pega resposta antiga

### Fase 3 — Tools MCP + empacotamento
- [x] **Testar as 8 tools** (eram 6; +list_remote +describe) — validado via cliente MCP stdio
      real (`@modelcontextprotocol/sdk` Client): `tools/list` mostra as 8, `auth_status`,
      `list_notebooks` e `list_remote_notebooks` (browser quente) respondem pelo protocolo.
      Falta só o teste no IDE de fato (`claude mcp add`), mas o servidor está provado.
- [x] **Tratamento de erros amigável** (não autenticado, sessão expirada, rate limit,
      timeout, Chromium ausente, notebook inexistente, id duplicado) — ver `src/errors.ts`.
- [x] **`bin` com shebang funcionando** — `dist/cli.js` tem `#!/usr/bin/env node`; o cliente
      stdio sobe o servidor via `node dist/cli.js` sem ajustes.
- [ ] Publicar no npm (`npm publish`) — escolher nome do pacote/escopo. PRONTO para publicar;
      aguarda decisão do nome e conta npm.

### Fase 4 — Melhorias (opcional)
- [x] **Descoberta de notebooks da conta** (`notebooklm_list_remote_notebooks` + CLI
      `notebooks remote`): raspa o painel inicial e extrai `{id,title,sources}` de cada card
      (UUID do atributo `id="project-<uuid>-title"`). Sem origem em `.py` — capacidade nova,
      validada ao vivo. Cruza com a biblioteca local marcando `[na biblioteca]`. Ver `remote.ts`.
- [ ] Sessão conversacional persistente (port de `browser_session.py`): manter uma página
      por notebook para follow-ups com memória, em vez de limpar histórico a cada pergunta.
- [ ] Cifrar `state.json` (referência: `vault.js` do Perplexity-MCP, MIT — copiar pontual).
- [x] **Smart Add** (`notebooklm_describe_notebook` + CLI `notebooks describe`): pergunta ao
      próprio notebook o que ele contém (nome/descrição/tópicos) para catalogar com metadados
      precisos. Propósito único (não grava); compõe com `list_remote_notebooks` e `add_notebook`.
      `askNotebookLM` ganhou `appendReminder` p/ resposta crua. Validado ao vivo. Ver `smart.ts`.
- [ ] Auto-config para outros IDEs → movido para a Fase 5 (parte central da extensão).

### Fase 5 — Extensão VS Code (modelo Perplexity) ⭐ objetivo principal

Migrar para monorepo e empacotar o servidor como extensão. O servidor atual (`src/`) vira
`packages/mcp-server`; nasce `packages/extension`. SEM `packages/webview` (dashboard).

Arquitetura alvo:
```
packages/
├── mcp-server/     # o código de hoje (src/), publicável no npm + embarcado na extensão
└── extension/      # extension host VS Code (CJS via tsup)
    ├── src/extension.ts        # activate(): registra o provider MCP + comandos
    ├── src/mcp-provider.ts     # registerMcpServerDefinitionProvider → McpStdioServerDefinition
    ├── src/auto-config/        # escreve mcp.json de Cursor/Claude Code/etc.
    └── src/browser/ensure.ts   # baixa Chromium sob demanda (globalStorage) se faltar
```

- [x] **Monorepo**: npm workspaces; `src/` → `packages/mcp-server` (via git mv, histórico
      preservado); root `package.json` com `workspaces: ["packages/*"]` e scripts agregados
      (`build`/`typecheck --workspaces`). Build/typecheck/smoke (8 tools via stdio) revalidados.
      `bin`/`npx` do servidor intactos (name `notebooklm-mcp` mantido no package).
- [x] **Registro MCP no VS Code**: `contributes.mcpServerDefinitionProviders` (id `notebooklm`)
      + `vscode.lm.registerMcpServerDefinitionProvider` retornando `McpStdioServerDefinition`.
      ⚠️ Construtor é POSICIONAL `(label, command, args?, env?, version?)` e `cwd` é propriedade
      (a forma de objeto da pesquisa estava errada — verificado no `@types/vscode` 1.125).
      `engines.vscode`: `^1.102.0`. Ver `packages/extension/src/mcp-provider.ts`.
- [~] **resolveMcpServerDefinition (lazy)**: stub presente (retorna o server); falta garantir
      login + Chromium antes do start.
- [x] **Comandos** (substituem o dashboard): `NotebookLM: Login`, `Status`, `Listar notebooks
      da conta` — rodam o CLI do servidor num terminal integrado. Ver `commands.ts`.
      (Falta `Adicionar notebook (Smart Add)`.)
- [ ] **Auto-config p/ clientes não-VS-Code** (Claude Code é o nosso caso!): escrever o
      `mcp.json`/config de Cursor, Claude Code, etc. entre marcadores (upsert idempotente).
      ⚠️ A API do VS Code (`registerMcpServerDefinitionProvider`) só serve o agente do PRÓPRIO
      VS Code; Claude Code/Cursor usam seus próprios arquivos de config.
- [ ] **Empacotamento**: tsup (extension host CJS + server ESM); Patchright como **external**
      (não bundlar — lê `package.json` em runtime); vendorizar `node_modules` de produção no
      `.vsix`; `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` no build (Chromium NÃO entra no `.vsix`).
- [ ] **Chromium sob demanda**: `postinstall` NÃO roda em extensão → baixar via código na
      ativação/resolve, para `globalStorage`; preferir Chrome/Edge do sistema quando existir.
- [ ] **Publicar**: `@vscode/vsce` → VS Code Marketplace (+ Open VSX). Escolher `publisher`.

Riscos novos da Fase 5: ver itens 7–9 em "Riscos".

## Superfície de tools (contrato)

`notebooklm_ask(question, notebookId?, notebookUrl?)` — resolução de alvo: `notebookUrl` >
`notebookId` > notebook ativo > `NOTEBOOKLM_DEFAULT_NOTEBOOK_URL`. Demais tools: CRUD da
biblioteca + status. Toda resposta de `ask` inclui o lembrete de follow-up da skill.

## Riscos e questões abertas

1. **Seletores frágeis (alto).** A SPA Angular do NotebookLM muda; os seletores são a
   manutenção recorrente. Centralizados em `config.ts`. Mitigação: múltiplos fallbacks +
   detecção por texto.
2. **i18n do `clearChatHistory` (médio).** Implementado com strings PT validadas ao vivo e
   fallbacks EN ("delete chat"/"delete conversation"/"delete"). Para novos locales, ampliar
   a lista ou migrar para detecção por ícone/posição.
3. **Login Google (alto).** 2FA/consent não automatizáveis — por isso login é manual/visível
   e isolado no CLI. Validar persistência da sessão entre execuções headless.
4. **Rate limit (médio).** ~50/dia no free. Tool deve reportar o erro de forma clara.
5. **ToS / conta (aceito).** Mesmo risco do Perplexity-MCP; documentado no README.
6. **Versões de deps (baixo).** As versões em `package.json` são estimadas; ajustar ao rodar
   `npm install` (em especial `@modelcontextprotocol/sdk` e `patchright`).
7. **Chromium em extensão (alto — Fase 5).** Sem `postinstall`, o download tem de ser código
   explícito na ativação; cuidado com firewall corporativo, disco e UX do 1º run. Mitigar
   reusando browser do sistema + barra de progresso. Não embarcar no `.vsix` (~150–300 MB).
8. **Bundle quebrando Patchright (médio — Fase 5).** esbuild/tsup quebram libs que leem o
   próprio `package.json` em runtime (playwright/patchright). Manter como dep externa.
9. **Fragmentação de clientes MCP (médio — Fase 5).** A API nativa só cobre o VS Code; para
   Claude Code/Cursor é preciso escrever os `mcp.json` deles. Não há atalho único.
10. **API MCP do VS Code nova (baixo).** Houve regressão pontual em 1.102.0; travar `engines`
    em versão testada e degradar com mensagem clara.

## Verificação

- `npm run typecheck` — compila sem erros.
- `npm run dev -- login` — fluxo de login manual numa conta de teste.
- `npm run dev -- notebooks add/list` — biblioteca persiste em `~/.notebooklm-mcp/data`.
- Teste manual ponta a ponta: `claude mcp add` + perguntar no Claude Code.
- (Fase 3+) testes unitários do `library.ts` e do parsing de resposta com fixtures de DOM.
