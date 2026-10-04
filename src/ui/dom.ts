/** Küçük DOM yardımcıları — çerçeve kullanılmaz. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

export function clear(node: HTMLElement) {
  node.replaceChildren();
}

export function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
