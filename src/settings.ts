import { App, PluginSettingTab, Setting } from "obsidian";

export interface BibleInserterSettings {
  sourceMode: "sqlite" | "markdown";
  sqlitePath: string;
  markdownRoot: string;
  calloutType: string;
  showVerseNumbers: boolean;
  lineBreakPerVerse: boolean;
  debug: boolean;
}

export const DEFAULT_SETTINGS: BibleInserterSettings = {
  sourceMode: "sqlite",
  sqlitePath: "",
  markdownRoot: "/Bibeln",
  calloutType: "[!bible]+",
  showVerseNumbers: true,
  lineBreakPerVerse: false,
  debug: false
};

export class BibleInserterSettingTab extends PluginSettingTab {
  plugin: any;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Bible Text Inserter – Settings" });

    new Setting(containerEl)
      .setName("Primary Source")
      .setDesc("Choose where to fetch Bible text from.")
      .addDropdown(dd => dd
        .addOption("sqlite", "SQLite (Bibel2000.db)")
        .addOption("markdown", "Markdown files")
        .setValue(this.plugin.settings.sourceMode)
        .onChange(async (v: "sqlite" | "markdown") => {
          this.plugin.settings.sourceMode = v;
          await this.plugin.saveSettings();
          this.display();
        }));

    new Setting(containerEl)
      .setName("SQLite path")
      .setDesc("Absolute or vault-relative path to Bibel2000.db")
      .addText(t => t
        .setPlaceholder("e.g. assets/Bibel2000.db")
        .setValue(this.plugin.settings.sqlitePath)
        .onChange(async v => {
          this.plugin.settings.sqlitePath = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Markdown root")
      .setDesc("Root folder of your Bible Markdown (default /Bibeln)")
      .addText(t => t
        .setPlaceholder("/Bibeln")
        .setValue(this.plugin.settings.markdownRoot)
        .onChange(async v => {
          this.plugin.settings.markdownRoot = v || "/Bibeln";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Callout type")
      .setDesc("Callout marker used when inserting text, e.g. [!bible]+")
      .addText(t => t
        .setPlaceholder("[!bible]+")
        .setValue(this.plugin.settings.calloutType)
        .onChange(async v => {
          this.plugin.settings.calloutType = v || "[!bible]+";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Show verse numbers")
      .setDesc("Include ^1, ^2, … before each verse.")
      .addToggle(tog => tog
        .setValue(this.plugin.settings.showVerseNumbers)
        .onChange(async v => {
          this.plugin.settings.showVerseNumbers = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Line break per verse")
      .setDesc("If ON, each verse is on a separate line; otherwise concatenated into a single paragraph.")
      .addToggle(tog => tog
        .setValue(this.plugin.settings.lineBreakPerVerse)
        .onChange(async v => {
          this.plugin.settings.lineBreakPerVerse = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Debug logging")
      .setDesc("If ON, logs parser and data events to the console.")
      .addToggle(tog => tog
        .setValue(this.plugin.settings.debug)
        .onChange(async v => {
          this.plugin.settings.debug = v;
          await this.plugin.saveSettings();
        }));
  }
}
