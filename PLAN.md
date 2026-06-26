# Plano de Desenvolvimento — notebooklm-mcp

Servidor MCP standalone (TS/Node + Patchright, stdio), port da skill Python `notebooklm`.
Sem dashboard, sem extensão VSCode, configurado por env/CLI. Distribuição via `npx`.

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

2. **VSCode-Perplexity-MCP (inspiração de arquitetura; só para a Fase 4):**
   `https://github.com/Automations-Project/VSCode-Perplexity-MCP` (licença MIT).
   - Referência para: cifrar sessão (`packages/mcp-server/src/vault.js`), persistência de
     cookies (`cookie-jar.js`), e auto-config multi-IDE (`packages/extension/src/auto-config`).
   - **Não** copiar o cliente Perplexity (`client.ts`): é REST/SSE+Cloudflare, paradigma
     OPOSTO ao do NotebookLM (que é DOM-driven). Inútil aqui.

## Contexto da decisão (por quê)

TS e não Python: menor atrito de instalação para o público MCP/Claude Code (sempre tem Node).
Servidor MCP standalone e não fork da extensão Perplexity: o valor do fork estava no
dashboard+extensão, que foram descartados (parametrização via env/CLI basta). Sem dashboard
por escolha explícita. Histórico completo da decisão não é necessário para desenvolver.

## Princípios

- **Reuso conceitual, não literal.** A skill Python é a *especificação executável*; a API do
  Patchright-JS espelha a do Patchright-Python, então o port é mecânico.
- **Browser quente de graça.** O processo MCP é de vida longa → mantém UM contexto
  persistente vivo (`BrowserManager`), eliminando o overhead de abrir/fechar Chromium por
  pergunta que a skill tem hoje.
- **stdout é sagrado.** É o canal do protocolo MCP. Todo log vai para `stderr`.

## Arquitetura

```
src/
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
    └── library.ts      # CRUD da biblioteca (library.json)    ← port notebook_manager.py
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
- [ ] Testar as 6 tools via `claude mcp add` no Claude Code
- [ ] Tratamento de erros amigável (não autenticado, notebook inexistente, rate limit)
- [ ] `bin` com shebang funcionando via `npx`
- [ ] Publicar no npm (`npm publish`) — escolher nome do pacote/escopo

### Fase 4 — Melhorias (opcional)
- [ ] Sessão conversacional persistente (port de `browser_session.py`): manter uma página
      por notebook para follow-ups com memória, em vez de limpar histórico a cada pergunta.
- [ ] Cifrar `state.json` (referência: `vault.js` do Perplexity-MCP, MIT — copiar pontual).
- [ ] Smart Add: descobrir conteúdo do notebook perguntando antes de catalogar.
- [ ] Auto-config opcional para outros IDEs (referência: `auto-config` do Perplexity-MCP).

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

## Verificação

- `npm run typecheck` — compila sem erros.
- `npm run dev -- login` — fluxo de login manual numa conta de teste.
- `npm run dev -- notebooks add/list` — biblioteca persiste em `~/.notebooklm-mcp/data`.
- Teste manual ponta a ponta: `claude mcp add` + perguntar no Claude Code.
- (Fase 3+) testes unitários do `library.ts` e do parsing de resposta com fixtures de DOM.
