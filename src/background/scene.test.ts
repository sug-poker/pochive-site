import { describe, expect, it } from 'vitest'
import { REDUCED_MOTION_TIME, featureAmount, heroFade, heroPhoneState, lightTarget, renderSettings, tableSceneRect, textSide } from './scene'

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

describe('tableSceneRect', () => {
  it('centres the scene in the anchor and uses its height as the unit', () => {
    expect(tableSceneRect({ left: 100, top: 600, width: 460, height: 200 })).toEqual({ centerX: 330, centerY: 700, unit: 200 })
  })
  it('shrinks the unit when the anchor is narrower than 2.3:1', () => {
    expect(tableSceneRect({ left: 0, top: 0, width: 230, height: 200 }).unit).toBeCloseTo(100)
  })
})

describe('heroPhoneState', () => {
  it('shows the hand log during the hand and the bankroll after the pot lands', () => {
    expect(heroPhoneState(5).screen).toBe('hands')
    expect(heroPhoneState(14.6).screen).toBe('bankroll')
    expect(heroPhoneState(16.79).screen).toBe('bankroll')
    expect(heroPhoneState(16.8).screen).toBe('hands')
  })
  it('wraps every 17 seconds back to the hand log', () => {
    expect(heroPhoneState(17 + 5).screen).toBe('hands')
    expect(heroPhoneState(17 + 15).screen).toBe('bankroll')
  })
  it('pings for 0.22s when a packet lands: actions +1.0s, streets and showdown +1.2s, the pot at 14.7s', () => {
    expect(heroPhoneState(2.0).ping).toBe(true) // BTN raise at 1.0
    expect(heroPhoneState(2.25).ping).toBe(false)
    expect(heroPhoneState(4.65).ping).toBe(true) // flop at 3.4
    expect(heroPhoneState(14.4).ping).toBe(true) // showdown at 13.2
    expect(heroPhoneState(14.75).ping).toBe(true) // pot
    expect(heroPhoneState(0.5).ping).toBe(false)
  })
  it('the reduced-motion still shows the bankroll without a ping', () => {
    expect(heroPhoneState(REDUCED_MOTION_TIME)).toEqual({ screen: 'bankroll', ping: false })
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
