import { GAME_TITLE, TEXTS } from "../config/texts";
import { el } from "./dom";
import { num } from "./format";
import { readBestScore } from "./storage";
import { isSoundOn, setSoundOn } from "./sound";
import { track } from "./analytics";

/** Başlık ekranı. Konuyu açık etmez; merak korunur. */
export function showTitle(parent: HTMLElement, onStart: () => void) {
  track("visit");
  const root = el("div", { class: "screen" });

  const start = el("button", { class: "btn btn--primary btn--big", type: "button" }, TEXTS.start);
  start.addEventListener("click", () => {
    track("start");
    onStart();
  });

  const sound = el(
    "button",
    { class: "btn", type: "button" },
    isSoundOn() ? TEXTS.soundOn : TEXTS.soundOff
  );
  sound.addEventListener("click", () => {
    setSoundOn(!isSoundOn());
    sound.textContent = isSoundOn() ? TEXTS.soundOn : TEXTS.soundOff;
  });

  const best = readBestScore();
  root.append(
    el("div", { style: "height:40px" }),
    el("h1", { class: "title" }, GAME_TITLE.toUpperCase()),
    el("p", { class: "sub" }, TEXTS.tagline),
    el("div", { class: "panel", style: "margin-top:28px" }, start),
    ...(best > 0
      ? [
          el(
            "div",
            { class: "panel center" },
            el("span", { class: "tiny" }, TEXTS.bestScore),
            el("div", { class: "pixel" }, num(best))
          ),
        ]
      : []),
    el("div", { class: "panel center" }, sound),
    el("p", { class: "footnote center" }, "10binatama.com")
  );
  parent.append(root);
  return root;
}
