import type { heroPhoneState } from './scene'

type PhoneState = ReturnType<typeof heroPhoneState>

// The hero phone is driven by DOM attributes only, so the prerendered markup still hydrates as-is.
export function applyHeroPhone(el: HTMLElement, state: PhoneState): void {
  if (el.dataset.screen !== state.screen) el.dataset.screen = state.screen
  el.classList.toggle('is-ping', state.ping)
}

// Back to the static hand-log screenshot, as without WebGL.
export function resetHeroPhone(el: HTMLElement): void {
  applyHeroPhone(el, { screen: 'hands', ping: false })
}
