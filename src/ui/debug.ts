import { TEXTS, t } from "../config/texts";
import { el } from "./dom";
import type { GameScreen } from "./game";

/** `?debug=1` paneli: hız ×10, bütçe, yıla atla, çökert, ham durum. */
export function showDebug(game: GameScreen) {
  const box = el("div", { id: "debug" });
  const mk = (label: string, fn: () => void) => {
    const b = el("button", { type: "button" }, label);
    b.addEventListener("click", fn);
    box.append(b);
    return b;
  };

  const speed = mk(t(TEXTS.debugSpeed, { n: 1 }), () => {
    game.debugSpeed = game.debugSpeed === 1 ? 10 : 1;
    speed.textContent = t(TEXTS.debugSpeed, { n: game.debugSpeed });
  });
  mk(TEXTS.debugBudget, () => {
    game.sim.budget += 1000;
    game.render();
  });
  mk(TEXTS.debugJump, () => {
    const answer = prompt("Hangi yıla?", String(game.sim.year + 10));
    const target = Number(answer);
    if (!Number.isFinite(target)) return;
    let guard = 0;
    while (game.sim.year < target && !game.sim.collapsed && guard++ < 2000) game.sim.step();
    game.sim.drainNotices();
    game.render();
  });
  mk(TEXTS.debugCollapse, () => {
    game.sim.queue[4] += game.sim.queueLimit * 2;
    game.sim.step();
    game.render();
  });
  mk(TEXTS.debugState, () => {
    // eslint-disable-next-line no-console
    console.log(game.sim.snapshot(), game.sim.stats);
  });

  document.body.append(box);
  return box;
}
