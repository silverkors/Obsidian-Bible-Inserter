import { App, Editor, Notice, Plugin } from "obsidian";
import { BibleInserterSettings, BibleInserterSettingTab, DEFAULT_SETTINGS } from "./settings";
import { splitRefList, parseReference } from "./parser";
import { SqliteSource, MarkdownSource, BibleDataSource } from "./data";
import { InsertBibleModal } from "./ui/insert-modal";

export default class BibleTextInserterPlugin extends Plugin {
  settings: BibleInserterSettings;
  dataSource: BibleDataSource;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new BibleInserterSettingTab(this.app, this));
    this.dataSource = this.makeDataSource();

    this.addCommand({
      id: "insert-bible-text-modal",
      name: "Insert Bible text (modal)",
      editorCallback: (editor) => this.openModal(editor),
    });

    this.addCommand({
      id: "insert-bible-text-from-selection",
      name: "Insert Bible text from selection",
      editorCallback: (editor) => this.fromSelection(editor),
    });

    if (this.settings.debug) console.log("[BibleInserter] Loaded", this.settings);
  }

  onunload() {
    if (this.settings.debug) console.log("[BibleInserter] Unloaded");
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.dataSource = this.makeDataSource();
    if (this.settings.debug) console.log("[BibleInserter] Settings saved", this.settings);
  }

  makeDataSource(): BibleDataSource {
    if (this.settings.sourceMode === "sqlite") {
      const src = new SqliteSource(this.settings.sqlitePath);
      // Viktigt: injicera hela pluginet, så källan kan nå manifest.dir och app
      (src as any)._plugin = this;
      return src;
    }
    return new MarkdownSource(this.settings.markdownRoot);
  }

  openModal(editor: Editor) {
    const m = new InsertBibleModal(this.app, async (val) => {
      await this.insertForInput(editor, val);
    });
    m.open();
  }

  async fromSelection(editor: Editor) {
    const sel = editor.getSelection().trim();
    if (!sel) {
      new Notice("No selection. Open the modal or select references.");
      return;
    }
    await this.insertForInput(editor, sel);
  }

  async insertForInput(editor: Editor, input: string) {
    if (this.settings.debug) console.log("[BibleInserter] Input:", input);
    const blocks = splitRefList(input);
    const outputs: string[] = [];

    for (const block of blocks) {
      const parsed = parseReference(block);
      if (!parsed) {
        outputs.push([
          `> [!error]- Ogiltig referens`,
          `> ${block}`,
          `> Kontrollera boknamn/förkortning och format (ex: "1 Mos 1:1-4", "Joh 1:1–3,14").`
        ].join("\n"));
        continue;
      }
      if (this.settings.debug) console.log("[BibleInserter] Parsed:", parsed);

      let verses: { verse: number; text: string }[] = [];
      let linkTarget = "";
      try {
        verses = await this.dataSource.getVerses(parsed);
        linkTarget = this.dataSource.chapterLinkTarget(parsed);
        if (!verses?.length) {
          outputs.push([
            `> [!warning]- Inga verser hittades`,
            `> ${block}`,
            `> Kapitlet finns men versintervallet verkar tomt.`
          ].join("\n"));
          continue;
        }
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        outputs.push([
          `> [!error]- Kunde inte hämta bibeltext`,
          `> ${block}`,
          `> ${msg.includes("not found") ? "Sökväg saknas eller filen hittas inte." : msg}`
        ].join("\n"));
        continue;
      }

      const heading = this.makeHeading(parsed, linkTarget);
      const text = this.formatVerses(verses)
        .split("\n")
        .map(line => `> ${line}`)
        .join("\n");

      outputs.push(`> ${this.settings.calloutType} ${heading}\n${text}\n`);
    }

    const toInsert = outputs.join("\n");
    editor.replaceSelection(toInsert);
    if (this.settings.debug) console.log("[BibleInserter] Inserted:", toInsert);
  }

  makeHeading(parsed: any, chapterLink: string): string {
    const left = `${parsed.bookLabel} (Bibel 2000)`;
    return `[[${chapterLink}|${left}]]`;
  }

  formatVerses(verses: { verse: number; text: string }[]): string {
    const showNums = this.settings.showVerseNumbers;
    const perLine = this.settings.lineBreakPerVerse;

    if (perLine) {
      return verses
        .map(v => (showNums ? `^${v.verse} ${v.text}` : v.text).trim())
        .join("\n");
    }
    const parts = verses.map(v => (showNums ? `^${v.verse} ${v.text}` : v.text).trim());
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }
}
