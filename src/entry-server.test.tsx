import { describe, expect, it } from 'vitest'
import { render } from './entry-server'

describe('prerender output', () => {
  const html = render()
  it('renders the background canvas hidden from assistive tech', () => {
    expect(html).toMatch(/<canvas class="shader-bg" aria-hidden="true"/)
  })
  it('marks the hero phone and all four feature phones', () => {
    expect(html.match(/data-shader-anchor="hero-phone"/g)).toHaveLength(1)
    expect(html.match(/data-shader-anchor="feature"/g)).toHaveLength(4)
  })
  it('renders the hero table scene with six seat labels and both phone screenshots', () => {
    expect(html.match(/data-shader-anchor="hero-table"/g)).toHaveLength(1)
    for (const seat of ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']) expect(html).toContain(`>${seat}</span>`)
    expect(html).toContain('/screenshots/hands.png')
    expect(html).toContain('/screenshots/bankroll.png')
    expect(html).toMatch(/data-shader-anchor="hero-phone"[^>]*data-screen="hands"|data-screen="hands"[^>]*data-shader-anchor="hero-phone"/)
  })
  it('adds the eyebrow labels and feature numbers', () => {
    for (const label of ['FEATURES', 'PRICING', 'CONTACT']) {
      expect(html).toContain(`<span class="eyebrow">${label}</span>`)
    }
    for (const n of ['01 / SESSION', '02 / HAND', '03 / BANKROLL', '04 / TRIP']) {
      expect(html).toContain(`<span class="feature-num">${n}</span>`)
    }
  })
})
