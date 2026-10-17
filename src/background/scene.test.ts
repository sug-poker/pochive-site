import { describe, expect, it } from 'vitest'
import { featureAmount, frameDue, heroFade, lightTarget, renderSettings, textSide } from './scene'

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

describe('renderSettings', () => {
  it('desktop: dpr capped at 1.5, 5 fbm octaves', () => {
    expect(renderSettings({ stacked: false, coarsePointer: false, reducedMotion: false, devicePixelRatio: 2 }))
      .toEqual({ pixelRatio: 1.5, fbmOctaves: 5, animate: true, maxFps: 60 })
  })
  it('mobile (narrow or coarse pointer): dpr capped at 2, 3 fbm octaves, 30fps', () => {
    expect(renderSettings({ stacked: true, coarsePointer: false, reducedMotion: false, devicePixelRatio: 3 }))
      .toEqual({ pixelRatio: 2, fbmOctaves: 3, animate: true, maxFps: 30 })
    expect(renderSettings({ stacked: false, coarsePointer: true, reducedMotion: false, devicePixelRatio: 1 }).pixelRatio).toBe(1)
  })
  it('reduced motion turns animation off', () => {
    expect(renderSettings({ stacked: false, coarsePointer: false, reducedMotion: true, devicePixelRatio: 1 }).animate).toBe(false)
  })
})

describe('frameDue', () => {
  it('draws every animation frame at 60fps', () => {
    expect(frameDue(1016.7, 1000, 60)).toBe(true)
  })
  it('skips every other 60Hz frame at 30fps, with a little slack for timer jitter', () => {
    expect(frameDue(1016.7, 1000, 30)).toBe(false)
    expect(frameDue(1032.5, 1000, 30)).toBe(true)
  })
})
