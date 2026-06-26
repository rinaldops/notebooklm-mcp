/**
 * Biblioteca de notebooks. Port fiel de `scripts/notebook_manager.py`.
 * Persiste em `library.json` (mesmo formato da skill, então a sua biblioteca
 * atual é reaproveitável copiando o arquivo).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { config, ensureDirs } from "../config.js";

export interface Notebook {
  id: string;
  url: string;
  name: string;
  description: string;
  topics: string[];
  tags: string[];
  use_cases: string[];
  created_at: string;
  updated_at: string;
  use_count: number;
  last_used: string | null;
}

interface LibraryFile {
  notebooks: Record<string, Notebook>;
  active_notebook_id: string | null;
  updated_at?: string;
}

export class NotebookLibrary {
  private notebooks: Record<string, Notebook> = {};
  private activeId: string | null = null;

  constructor() {
    ensureDirs();
    this.load();
  }

  private load(): void {
    if (!existsSync(config.libraryFile)) {
      this.save();
      return;
    }
    try {
      const data = JSON.parse(readFileSync(config.libraryFile, "utf8")) as LibraryFile;
      this.notebooks = data.notebooks ?? {};
      this.activeId = data.active_notebook_id ?? null;
    } catch (err) {
      console.error(`[notebooklm] erro ao ler library.json: ${String(err)}`);
    }
  }

  private save(): void {
    const data: LibraryFile = {
      notebooks: this.notebooks,
      active_notebook_id: this.activeId,
      updated_at: new Date().toISOString(),
    };
    writeFileSync(config.libraryFile, JSON.stringify(data, null, 2));
  }

  private slug(name: string): string {
    return name.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-");
  }

  add(input: {
    url: string;
    name: string;
    description: string;
    topics: string[];
    tags?: string[];
    useCases?: string[];
  }): Notebook {
    const id = this.slug(input.name);
    if (this.notebooks[id]) {
      throw new Error(`Já existe um notebook com id '${id}'`);
    }
    const now = new Date().toISOString();
    const notebook: Notebook = {
      id,
      url: input.url,
      name: input.name,
      description: input.description,
      topics: input.topics,
      tags: input.tags ?? [],
      use_cases: input.useCases ?? [],
      created_at: now,
      updated_at: now,
      use_count: 0,
      last_used: null,
    };
    this.notebooks[id] = notebook;
    if (Object.keys(this.notebooks).length === 1) this.activeId = id; // 1º vira ativo
    this.save();
    return notebook;
  }

  remove(id: string): boolean {
    if (!this.notebooks[id]) return false;
    delete this.notebooks[id];
    if (this.activeId === id) {
      this.activeId = Object.keys(this.notebooks)[0] ?? null;
    }
    this.save();
    return true;
  }

  get(id: string): Notebook | undefined {
    return this.notebooks[id];
  }

  list(): Notebook[] {
    return Object.values(this.notebooks);
  }

  search(query: string): Notebook[] {
    const q = query.toLowerCase();
    return this.list().filter((nb) =>
      [nb.name, nb.description, nb.topics.join(" "), nb.tags.join(" "), nb.use_cases.join(" ")]
        .some((field) => field.toLowerCase().includes(q)),
    );
  }

  activate(id: string): Notebook {
    const nb = this.notebooks[id];
    if (!nb) throw new Error(`Notebook não encontrado: ${id}`);
    this.activeId = id;
    this.save();
    return nb;
  }

  getActive(): Notebook | undefined {
    return this.activeId ? this.notebooks[this.activeId] : undefined;
  }

  get activeNotebookId(): string | null {
    return this.activeId;
  }

  /** Resolve a URL alvo a partir de id explícito, ativo ou env. */
  resolveUrl(notebookId?: string): string | undefined {
    if (notebookId) return this.notebooks[notebookId]?.url;
    return this.getActive()?.url ?? (config.defaultNotebookUrl || undefined);
  }

  markUsed(id: string): void {
    const nb = this.notebooks[id];
    if (!nb) return;
    nb.use_count += 1;
    nb.last_used = new Date().toISOString();
    this.save();
  }
}
