// Pure layout and timing math for the shader background. Coordinates are CSS
// pixels in the viewport (y down) unless noted otherwise.

export type Point = [number, number]

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

// Width-to-height ratio of the hero table scene.
export const TABLE_SCENE_ASPECT = 2.3

// Length of the hero hand loop in seconds (must match hero.glsl).
export const HERO_LOOP = 17

// Loop time after the hand is settled and the phone shows the bankroll.
export const REDUCED_MOTION_TIME = 15.8

// When a packet from the table lands in the hero phone (must match hero.glsl):
// actions arrive 1.0s after they happen, street deals and the showdown 1.2s after, the pot at 14.7s.
const ACTION_TIMES = [1.0, 2.0, 4.6, 5.4, 6.3, 8.6, 9.4, 11.0, 11.9]
const STREET_TIMES = [3.4, 7.6, 10.0, 13.2]
const PHONE_ARRIVALS = [...ACTION_TIMES.map((t) => t + 1.0), ...STREET_TIMES.map((t) => t + 1.2), 14.7]
const PING_LENGTH = 0.22
const BANKROLL_FROM = 14.6
const BANKROLL_UNTIL = 16.8

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smoothstep = (t: number) => t * t * (3 - 2 * t)

// Strength of the hero effect from where the hero section ends on screen: full while
// its bottom is below 70% of the viewport height, gone once within 20% of the top
// (a one-viewport desktop hero is gone after 80% of a viewport of scrolling).
export function heroFade(heroBottom: number, viewportHeight: number): number {
  return smoothstep(clamp01((heroBottom - viewportHeight * 0.2) / (viewportHeight * 0.5)))
}

// Strength of a feature effect: 1 when its phone sits at the viewport centre.
export function featureAmount(centerY: number, viewportHeight: number): number {
  return smoothstep(1 - Math.min(1, Math.abs(centerY - viewportHeight / 2) / (viewportHeight * 0.55)))
}

// Which way the description text lies from the phone: 1 right, -1 left, 0 below (stacked layout).
export function textSide(phoneCenterX: number, viewportWidth: number, stacked: boolean): 1 | -1 | 0 {
  if (stacked) return 0
  return phoneCenterX < viewportWidth / 2 ? 1 : -1
}

export function lightTarget(input: {
  scrollY: number
  viewport: { width: number; height: number }
  mouse: Point | null
  heroPhone: Point | null
  featurePhones: Point[]
}): Point {
  const { scrollY, viewport, mouse, heroPhone, featurePhones } = input
  // Past the hero, the spotlight picks out the feature phone nearest the viewport centre.
  if (scrollY > viewport.height * 0.5) {
    let best: Point | null = null
    let bestDistance = viewport.height * 0.4
    for (const phone of featurePhones) {
      const d = Math.abs(phone[1] - viewport.height / 2)
      if (d < bestDistance) {
        bestDistance = d
        best = phone
      }
    }
    if (best) return best
  }
  // The hero phone is only a useful default while it is on screen.
  const heroOnScreen = heroPhone && heroPhone[1] >= 0 && heroPhone[1] <= viewport.height ? heroPhone : null
  return mouse ?? heroOnScreen ?? [viewport.width * 0.7, viewport.height * 0.45]
}

export function tableSceneRect(anchor: Rect): { centerX: number; centerY: number; unit: number } {
  return {
    centerX: anchor.left + anchor.width / 2,
    centerY: anchor.top + anchor.height / 2,
    unit: Math.min(anchor.height, anchor.width / TABLE_SCENE_ASPECT),
  }
}

// What the hero phone shows at a point in the loop, and whether its frame flashes.
export function heroPhoneState(time: number): { screen: 'hands' | 'bankroll'; ping: boolean } {
  const t = time % HERO_LOOP
  return {
    screen: t >= BANKROLL_FROM && t < BANKROLL_UNTIL ? 'bankroll' : 'hands',
    ping: PHONE_ARRIVALS.some((at) => t >= at && t < at + PING_LENGTH),
  }
}

export function renderSettings(env: {
  stacked: boolean
  coarsePointer: boolean
  reducedMotion: boolean
  devicePixelRatio: number
}): { pixelRatio: number; fbmOctaves: number; animate: boolean; maxFps: number } {
  const mobile = env.stacked || env.coarsePointer
  return {
    pixelRatio: mobile ? 1 : Math.min(env.devicePixelRatio, 1.5),
    fbmOctaves: mobile ? 3 : 5,
    animate: !env.reducedMotion,
    maxFps: 60,
  }
}
