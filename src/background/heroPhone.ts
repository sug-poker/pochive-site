// The hero phone is driven by a DOM class only, so the prerendered markup still hydrates as-is.
export function applyHeroPhone(el: HTMLElement, ping: boolean): void {
  el.classList.toggle('is-ping', ping)
}

// No glow once the shader stops, as without WebGL.
export function resetHeroPhone(el: HTMLElement): void {
  applyHeroPhone(el, false)
}
