import { GAME_TITLE, SHARE_TAG, SHARE_TEXT, SITE_URL, TEXTS, t } from "../config/texts";
import { big } from "./format";

export interface ShareData {
  year: number;
  lostTeeth: number;
}

const W = 1080;
const H = 1350;
const PIXEL = '"Press Start 2P", monospace';
const UI = '"Pixelify Sans", monospace';

const TOOTH = [
  "..TTTTTTTTTTTT..",
  ".TTTTTTTTTTTTTT.",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTT......TTTTT",
  "TTTT........TTTT",
  "TTT..........TTT",
  "TTT..........TTT",
  "TTT..........TTT",
  ".TT..........TT.",
  ".TT..........TT.",
];

/** 1080×1350 paylaşım kartı — oyunla aynı 8-bit dil. */
export function drawShareCard(data: ShareData): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  c.textAlign = "center";

  // gökyüzü ve tuğla zemin
  c.fillStyle = "#5c94fc";
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#c84c0c";
  c.fillRect(0, H - 110, W, 110);
  c.fillStyle = "#883000";
  for (let x = 0; x < W; x += 54) c.fillRect(x, H - 110, 7, 110);
  for (let y = H - 110; y < H; y += 54) c.fillRect(0, y, W, 7);

  // logo
  c.fillStyle = "#000000";
  c.fillRect(W / 2 - 132, 70, 264, 264);
  c.fillStyle = "#0058f8";
  c.fillRect(W / 2 - 120, 82, 240, 240);
  const scale = 12;
  c.fillStyle = "#fcfcfc";
  for (let r = 0; r < TOOTH.length; r++) {
    for (let q = 0; q < TOOTH[r].length; q++) {
      if (TOOTH[r][q] !== ".") {
        c.fillRect(W / 2 - 96 + q * scale, 106 + r * scale, scale, scale);
      }
    }
  }

  // başlık
  c.fillStyle = "#000000";
  c.fillRect(48, 370, W - 96, 112);
  c.fillStyle = "#fcfcfc";
  c.font = `64px ${PIXEL}`;
  c.fillText(GAME_TITLE.toUpperCase(), W / 2, 444);

  // IRREVERSIBILIS damgası
  c.font = `34px ${PIXEL}`;
  const stampW = Math.ceil(c.measureText(TEXTS.irreversibilis).width) + 56;
  c.fillStyle = "#000000";
  c.fillRect((W - stampW) / 2, 516, stampW, 74);
  c.strokeStyle = "#d82800";
  c.lineWidth = 6;
  c.strokeRect((W - stampW) / 2 + 3, 519, stampW - 6, 68);
  c.fillStyle = "#d82800";
  c.fillText(TEXTS.irreversibilis, W / 2, 566);

  // taşınan yıl
  c.fillStyle = "#000000";
  c.fillRect(140, 630, W - 280, 250);
  c.fillStyle = "#fcfcfc";
  c.fillRect(152, 642, W - 304, 226);
  c.fillStyle = "#0058f8";
  c.font = `130px ${PIXEL}`;
  c.fillText(String(data.year), W / 2, 790);
  c.fillStyle = "#000000";
  c.font = `700 36px ${UI}`;
  c.fillText(t(TEXTS.shareSurvived, { year: data.year }), W / 2, 844);

  // kaybedilen diş
  c.fillStyle = "#000000";
  c.fillRect(70, 910, W - 140, 90);
  c.fillStyle = "#fcd800";
  c.font = `700 40px ${UI}`;
  c.fillText(t(TEXTS.shareLost, { n: big(data.lostTeeth) }), W / 2, 968);

  // ana mesaj
  c.fillStyle = "#000000";
  c.fillRect(48, 1026, W - 96, 108);
  c.fillStyle = "#fcfcfc";
  c.font = `700 44px ${UI}`;
  c.fillText(TEXTS.lockMomentMain, W / 2, 1094);

  // alt bilgi
  c.fillStyle = "#fcfcfc";
  c.font = `26px ${PIXEL}`;
  c.fillText(SITE_URL.replace("https://", "").toUpperCase(), W / 2, 1218);
  c.fillStyle = "#fcd800";
  c.font = `700 30px ${UI}`;
  c.fillText(SHARE_TAG, W / 2, 1282);

  return cv;
}

function toBlob(cv: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => cv.toBlob((b) => res(b), "image/png"));
}

export type ShareOutcome = "shared" | "downloaded" | "failed";

/**
 * Mobilde Web Share API (dosya destekleniyorsa görselle, değilse metin + link).
 * Desteklenmiyorsa PNG indirilir ve paylaşım metni panoya kopyalanır.
 */
export async function shareScore(data: ShareData): Promise<ShareOutcome> {
  const text = t(SHARE_TEXT, { yil: data.year });
  const blob = await toBlob(drawShareCard(data));

  try {
    if (blob && typeof navigator.canShare === "function") {
      const file = new File([blob], "reversibilis.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: GAME_TITLE });
        return "shared";
      }
    }
    if (typeof navigator.share === "function") {
      await navigator.share({ text, title: GAME_TITLE, url: SITE_URL });
      return "shared";
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "failed";
  }

  try {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reversibilis.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    await navigator.clipboard?.writeText(text);
    return "downloaded";
  } catch {
    return "failed";
  }
}
