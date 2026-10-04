import { el } from "./dom";

/** Üstten çıkan kısa bildirim kartları — oyunu durdurmaz. */
export class Notices {
  private root = el("div", { id: "notices" });

  constructor(parent: HTMLElement) {
    parent.append(this.root);
  }

  show(text: string, ms = 4200) {
    const node = el("div", { class: "notice" }, text);
    this.root.append(node);
    setTimeout(() => node.remove(), ms);
    while (this.root.children.length > 3) this.root.firstElementChild?.remove();
  }

  destroy() {
    this.root.remove();
  }
}
