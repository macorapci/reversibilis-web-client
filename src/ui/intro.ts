import { TEXTS } from "../config/texts";
import { el } from "./dom";

/**
 * Görev metni (~10 sn) ve ardından 3 adımlık ipucu balonları.
 * Her adım ilgili paneli çerçeveyle işaretler.
 */
export function showIntro(
  parent: HTMLElement,
  targets: (HTMLElement | null)[],
  onDone: () => void
) {
  let step = -1;
  const text = el("p", { style: "font-size:16px;margin:0 0 12px" }, TEXTS.briefing);
  const next = el("button", { class: "btn btn--primary", type: "button" }, TEXTS.tutorialNext);
  const box = el(
    "div",
    {
      class: "panel panel--dark",
      style:
        "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:min(464px,calc(100vw - 16px));z-index:80",
    },
    text,
    next
  );
  parent.append(box);

  const highlight = (node: HTMLElement | null) => {
    for (const el2 of document.querySelectorAll<HTMLElement>("[data-intro]")) {
      el2.style.outline = "";
      el2.removeAttribute("data-intro");
    }
    if (!node) return;
    node.dataset.intro = "1";
    node.style.outline = "6px solid var(--coin)";
    node.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const advance = () => {
    step++;
    if (step >= TEXTS.tutorial.length) {
      highlight(null);
      box.remove();
      onDone();
      return;
    }
    text.textContent = TEXTS.tutorial[step];
    next.textContent =
      step === TEXTS.tutorial.length - 1 ? TEXTS.tutorialDone : TEXTS.tutorialNext;
    highlight(targets[step] ?? null);
  };

  next.addEventListener("click", advance);
  // ~10 sn sonra görev metni kendiliğinden geçilir
  setTimeout(() => {
    if (step === -1) advance();
  }, 9000);
}
