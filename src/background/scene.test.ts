import { describe, expect, it } from 'vitest'
import { REDUCED_MOTION_TIME, featureAmount, heroFade, heroPhonePing, lightTarget, renderSettings, textSide } from './scene'

describe('heroFade', () => {
  it('is 1 while the hero still fills most of the viewport', () => {
    expect(heroFade(1000, 1000)).toBe(1)
    expect(heroFade(700, 1000)).toBe(1)
  })
  it('is 0 once the hero bottom is within 20% of the viewport top (desktop: 80% scrolled)', () => {
    expect(heroFade(200, 1000)).toBe(0)
    expect(heroFade(-500, 1000)).toBe(0)
  })
  it('eases with smoothstep in between', () => {
    expect(heroFade(450, 1000)).toBeCloseTo(0.5)
    expect(heroFade(325, 1000)).toBeCloseTo(0.15625)
  })
  it('keeps the effect up on a tall stacked hero while its cards are on screen', () => {
    // Mobile hero ~1.6 viewports tall, scrolled so the card scene sits mid-screen.
    expect(heroFade(0.64 * 844, 844)).toBeGreaterThan(0.9)
  })
})

describe('featureAmount', () => {
  it('peaks when the phone is at the viewport centre and is 0 beyond 55% of a viewport', () => {
    expect(featureAmount(500, 1000)).toBe(1)
    expect(featureAmount(500 + 550, 1000)).toBe(0)
    expect(featureAmount(500 - 275, 1000)).toBeCloseTo(0.5)
  })
})

describe('textSide', () => {
  it('points away from the phone side, or 0 when stacked', () => {
    expect(textSide(300, 1280, false)).toBe(1)
    expect(textSide(1000, 1280, false)).toBe(-1)
    expect(textSide(195, 390, true)).toBe(0)
  })
})

describe('lightTarget', () => {
  const viewport = { width: 1280, height: 900 }
  it('follows the mouse in the hero', () => {
    expect(lightTarget({ scrollY: 0, viewport, mouse: [100, 200], heroPhone: [1000, 450], featurePhones: [] })).toEqual([100, 200])
  })
  it('defaults to the hero phone without a mouse (touch devices)', () => {
    expect(lightTarget({ scrollY: 0, viewport, mouse: null, heroPhone: [1000, 450], featurePhones: [] })).toEqual([1000, 450])
  })
  it('falls back to 70% / 45% of the viewport with neither', () => {
    expect(lightTarget({ scrollY: 0, viewport, mouse: null, heroPhone: null, featurePhones: [] })).toEqual([896, 405])
  })
  it('ignores the hero phone once it has scrolled off screen (touch, past the hero)', () => {
    expect(lightTarget({ scrollY: 3000, viewport, mouse: null, heroPhone: [1000, -2500], featurePhones: [] })).toEqual([896, 405])
  })
  it('locks onto the feature phone nearest the centre once past half a viewport', () => {
    const featurePhones: Array<[number, number]> = [[300, 100], [900, 480]]
    expect(lightTarget({ scrollY: 2000, viewport, mouse: [5, 5], heroPhone: null, featurePhones })).toEqual([900, 480])
  })
  it('ignores feature phones further than 40% of a viewport from the centre', () => {
    expect(lightTarget({ scrollY: 2000, viewport, mouse: [5, 5], heroPhone: null, featurePhones: [[300, 900]] })).toEqual([5, 5])
  })
})

describe('heroPhonePing', () => {
  it('flashes for 0.22s each time a light drops into the phone (every 3.2s, landing at 55% of the cycle)', () => {
    expect(heroPhonePing(1.77)).toBe(true)
    expect(heroPhonePing(1.75)).toBe(false)
    expect(heroPhonePing(1.97)).toBe(true)
    expect(heroPhonePing(1.99)).toBe(false)
    expect(heroPhonePing(3.2 * 4 + 1.8)).toBe(true)
    expect(heroPhonePing(0.5)).toBe(false)
  })
  it('does not flash in the reduced-motion still', () => {
    expect(heroPhonePing(REDUCED_MOTION_TIME)).toBe(false)
  })
})

describe('renderSettings', () => {
  it('desktop: dpr capped at 1.5, 5 fbm octaves', () => {
    expect(renderSettings({ stacked: false, coarsePointer: false, reducedMotion: false, devicePixelRatio: 2 }))
      .toEqual({ pixelRatio: 1.5, fbmOctaves: 5, animate: true, maxFps: 60 })
  })
  it('mobile (narrow or coarse pointer): dpr 1, 3 fbm octaves', () => {
    expect(renderSettings({ stacked: true, coarsePointer: false, reducedMotion: false, devicePixelRatio: 3 }).pixelRatio).toBe(1)
    expect(renderSettings({ stacked: false, coarsePointer: true, reducedMotion: false, devicePixelRatio: 3 }).fbmOctaves).toBe(3)
  })
  it('reduced motion turns animation off', () => {
    expect(renderSettings({ stacked: false, coarsePointer: false, reducedMotion: true, devicePixelRatio: 1 }).animate).toBe(false)
  })
})
