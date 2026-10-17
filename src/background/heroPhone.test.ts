import { describe, expect, it } from 'vitest'
import { applyHeroPhone, resetHeroPhone } from './heroPhone'

const fakePhone = () => {
  const classes = new Set<string>()
  return {
    classList: {
      toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c), on),
      remove: (c: string) => void classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
  }
}

describe('hero phone DOM state', () => {
  it('applies the ping flash', () => {
    const el = fakePhone()
    applyHeroPhone(el as unknown as HTMLElement, true)
    expect(el.classList.contains('is-ping')).toBe(true)
    applyHeroPhone(el as unknown as HTMLElement, false)
    expect(el.classList.contains('is-ping')).toBe(false)
  })
  it('clears the glow when the shader stops (context loss)', () => {
    const el = fakePhone()
    applyHeroPhone(el as unknown as HTMLElement, true)
    resetHeroPhone(el as unknown as HTMLElement)
    expect(el.classList.contains('is-ping')).toBe(false)
  })
})
