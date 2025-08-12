// src/data.ts
import type { ParsedRef, RefSpan } from "./parser";

export interface VerseItem { verse: number; text: string; }
export interface BibleDataSource {
  getVerses(ref: ParsedRef): Promise<VerseItem[]>;
  chapterLinkTarget(ref: ParsedRef): string;
}

function mergeSpans(spans: RefSpan[]): RefSpan[] {
  const byV: Set<number> = new Set();
  const out: RefSpan[] = [];
  const items: Array<{v: number}> = [];

  for (const sp of spans) {
    if (sp.v1 == null || sp.v2 == null) {
      return [{ chapter: spans[0].chapter }];
    }
    for (let v = sp.v1; v <= sp.v2; v++) {
      if (!byV.has(v)) {
        byV.add(v);
        items.push({ v });
      }
    }
  }
  items.sort((a,b) => a.v - b.v);
  if (items.length === 0) return [];
  let start = items[0].v, prev = items[0].v;
  for (let i = 1; i <= items.length; i++) {
    const cur = items[i]?.v;
    if (cur !== prev + 1) {
      out.push({ chapter: spans[0].chapter, v1: start, v2: prev });
      if (cur != null) { start = cur; }
    }
    prev = cur ?? prev;
  }
  return out;
}

export class SqliteSource implements BibleDataSource {
  private SQL: any | null = null;
  private db: any | null = null;

  constructor(private sqlitePath: string) {}

  // main.ts sätter: (src as any)._plugin = this;  (d.v.s. hela plugin-instansen)
  private async ensureInit() {
    if (this.SQL && this.db) return;

    const plugin = (this as any)._plugin;
    if (!plugin) throw new Error("Internal: plugin ref missing on SqliteSource.");

    // Hämta en laddningsbar URL till wasm-filen i pluginroten
    const wasmUrl = plugin.app.vault.adapter.getResourcePath(
      plugin.manifest.dir + "/sql-wasm.wasm"
    );

    const initSqlJs = (await import("sql.js")).default;
    this.SQL = await initSqlJs({
      locateFile: () => wasmUrl
    });

    if (!this.sqlitePath) {
      throw new Error("SQLite path saknas. Ange sökväg till Bibel2000.db i Settings.");
    }

    // Läs DB från vaulten via plugin.app
    const ab = await plugin.app.vault.adapter.readBinary(this.sqlitePath);
    const u8 = new Uint8Array(ab);
    this.db = new this.SQL.Database(u8);
  }

  async getVerses(ref: ParsedRef): Promise<VerseItem[]> {
    await this.ensureInit();

    const out: VerseItem[] = [];
    const chapter = ref.spans[0].chapter;

    const q = `SELECT verse, content FROM verse WHERE book = ? AND chapter = ? ORDER BY verse ASC`;
    const stmt = this.db.prepare(q);
    stmt.bind([ref.enFull, chapter]);

    const allVerses: VerseItem[] = [];
    while (stmt.step()) {
      const [verse, content] = stmt.get();
      allVerses.push({ verse, text: String(content) });
    }
    stmt.free();

    const hasAnyRange = ref.spans.some(sp => sp.v1 != null);
    if (!hasAnyRange) return allVerses;

    const merged = mergeSpans(ref.spans);
    for (const m of merged) {
      for (let v = m.v1!; v <= m.v2!; v++) {
        const item = allVerses.find(x => x.verse === v);
        if (item) out.push(item);
      }
    }
    return out;
  }

  chapterLinkTarget(ref: ParsedRef): string {
    const chapter = ref.spans[0].chapter;
    return `${ref.svFull} ${chapter}`;
  }
}

export class MarkdownSource implements BibleDataSource {
  constructor(private root: string) {}
  async getVerses(ref: ParsedRef): Promise<VerseItem[]> {
    const chapter = ref.spans[0].chapter;

    // Viktigt: i Obsidian ska sökvägen normalt vara vault-relativ UTAN ledande "/" (ex: "Bibeln/...")
    const root = this.root.replace(/^\/+/, "").replace(/\/+$/, "");
    const path = `${root}/${ref.svFull}/${ref.svFull} ${chapter}.md`;

    // @ts-ignore
    const adapter = (window as any).app.vault.adapter;
    if (!(await adapter.exists(path))) {
      throw new Error(`Markdown-kapitel hittas ej: ${path}`);
    }

    const content: string = await adapter.read(path);
    const lines = content.split(/\r?\n/);

    const verseBlocks = new Map<number, string>();
    let currentVerse: number | null = null;
    let buf: string[] = [];

    // Matcha både fullnamn OCH förkortning, vilken rubriknivå som helst (###, ##, #),
    // tillåt extra text efter versnumret (om versen ligger på samma rad).
    const namePart = `${escapeReg(ref.svFull)}|${escapeReg(ref.svAbbr)}`;
    const headerRx = new RegExp(
      `^#{1,6}\\s+(?:${namePart})\\s+${chapter}:(\\d+)\\b(.*)$`,
      "i"
    );

    const flush = () => {
      if (currentVerse != null) {
        const text = buf.join("\n").trim();
        verseBlocks.set(currentVerse, text);
      }
      buf = [];
    };

    for (const ln of lines) {
      const m = ln.match(headerRx);
      if (m) {
        // Spara föregående
        flush();

        currentVerse = parseInt(m[1], 10);

        // Om det finns text på samma rad efter rubriken, lägg den direkt i bufferten
        const inline = (m[2] || "").trim();
        if (inline) buf.push(inline);
      } else {
        if (currentVerse != null) buf.push(ln);
      }
    }
    flush();

    // Bygg upp ordnade verser
    const allVerses: VerseItem[] = [...verseBlocks.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([v, t]) => ({ verse: v, text: t }));

    // Kapitelläsning vs. intervall
    const hasAnyRange = ref.spans.some(sp => sp.v1 != null);
    if (!hasAnyRange) return allVerses;

    const out: VerseItem[] = [];
    // slå ihop ev. överlapp i samma kapitel
    const merged = mergeSpans(ref.spans);
    for (const m of merged) {
      for (let v = m.v1!; v <= m.v2!; v++) {
        const item = allVerses.find(x => x.verse === v);
        if (item) out.push(item);
      }
    }
    return out;
  }

  chapterLinkTarget(ref: ParsedRef): string {
    const chapter = ref.spans[0].chapter;
    return `${ref.svFull} ${chapter}`;
  }
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
