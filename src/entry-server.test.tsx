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
  it('shows a single hand-log screenshot in the hero phone, with no table scene or seat labels', () => {
    const hero = html.slice(html.indexOf('<section id="hero">'), html.indexOf('</section>'))
    expect(hero.match(/<img /g)).toHaveLength(1)
    expect(hero).toContain('/screenshots/hands.png')
    expect(hero).not.toMatch(/hero-table|hero-seat/)
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
