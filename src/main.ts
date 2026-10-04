import "./styles.css";
import { GameScreen } from "./ui/game";
import { showTitle } from "./ui/title";
import { showResult } from "./ui/result";
import { showIntro } from "./ui/intro";
import { showDebug } from "./ui/debug";
import { TEXTS, t } from "./config/texts";
import { el } from "./ui/dom";
import { track } from "./ui/analytics";

const app = document.getElementById("app")!;
const debugOn = new URLSearchParams(location.search).get("debug") === "1";

function reset() {
  app.replaceChildren();
  document.getElementById("debug")?.remove();
  document.getElementById("notices")?.remove();
  document.getElementById("collapse")?.remove();
}

function startGame() {
  reset();
  const seed = (Math.random() * 2 ** 32) >>> 0;
  const game = new GameScreen(app, seed, () => collapse(game));

  if (debugOn) {
    showDebug(game);
    // hata ayıklama kancası: konsoldan simülasyon sürülebilsin
    (window as unknown as { game: GameScreen }).game = game;
  } else {
    const panels = app.querySelectorAll<HTMLElement>(".panel");
    showIntro(document.body, [panels[0], panels[3], panels[2]], () => {});
  }
}

/** Çöküş anı: ekran kararır, IRREVERSIBILIS düşer, sonra sonuç ekranı. */
function collapse(game: GameScreen) {
  track("collapse", { year: game.sim.collapseYear });
  const sim = game.sim;
  const year = sim.collapseYear ?? sim.year;
  const reason =
    sim.collapseReason === "dis" ? TEXTS.collapseReasonTeeth : TEXTS.collapseReasonQueue;
  const overlay = el(
    "div",
    { id: "collapse" },
    el(
      "div",
      {},
      el("div", { class: "word" }, TEXTS.irreversibilis),
      el("p", {}, t(TEXTS.collapseLine, { year })),
      el("p", { class: "tiny" }, reason)
    )
  );
  document.body.append(overlay);

  setTimeout(() => {
    game.destroy();
    overlay.remove();
    reset();
    showResult(app, sim, startGame);
  }, 2800);
}

showTitle(app, startGame);
