import { App, Modal, Setting, Notice } from "obsidian";

export class InsertBibleModal extends Modal {
  value: string = "";
  onSubmit: (val: string) => void;

  constructor(app: App, onSubmit: (val: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Insert Bible text" });

    const ta = contentEl.createEl("textarea", { cls: "bti-input" });
    ta.rows = 6;
    ta.placeholder = "Ex: 1 Mos 1:1-4; Joh 1:1-3,14";
    ta.value = this.value;
    ta.oninput = () => (this.value = ta.value);

    new Setting(contentEl)
      .addButton(b => b.setButtonText("Insert").setCta().onClick(() => {
        if (!this.value.trim()) {
          new Notice("Please enter one or more references.");
          return;
        }
        this.onSubmit(this.value.trim());
        this.close();
      }))
      .addButton(b => b.setButtonText("Cancel").onClick(() => this.close()));
  }

  onClose() {
    this.contentEl.empty();
  }
}
