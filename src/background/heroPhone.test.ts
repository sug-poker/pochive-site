import { describe, expect, it } from 'vitest'
import { applyHeroPhone, resetHeroPhone } from './heroPhone'

const fakePhone = () => {
  const classes = new Set<string>()
  return {
    dataset: { screen: 'hands' } as DOMStringMap,
    classList: {
      toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c), on),
      remove: (c: string) => void classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
  }
}

describe('hero phone DOM state', () => {
  it('applies the screen and the ping flash', () => {
    const el = fakePhone()
    applyHeroPhone(el as unknown as HTMLElement, { screen: 'bankroll', ping: true })
    expect(el.dataset.screen).toBe('bankroll')
    expect(el.classList.contains('is-ping')).toBe(true)
  })
  it('resets to the static hand log without a glow when the shader stops (context loss)', () => {
    const el = fakePhone()
    applyHeroPhone(el as unknown as HTMLElement, { screen: 'bankroll', ping: true })
    resetHeroPhone(el as unknown as HTMLElement)
    expect(el.dataset.screen).toBe('hands')
    expect(el.classList.contains('is-ping')).toBe(false)
  })
})
