import { ANALYTICS_ENABLED } from "../config/texts";

/**
 * Gizlilik dostu ziyaret / tıklama sayımı için yer tutucu.
 * v1'de kapalı ve hiçbir yere istek atmaz.
 */
export function track(
  event: "visit" | "start" | "collapse" | "sign" | "share",
  _data?: Record<string, unknown>
) {
  if (!ANALYTICS_ENABLED) return;
  void event; // Yer tutucu: burada hiçbir harici istek yapılmaz.
}
