// Pure layout and timing math for the shader background. Coordinates are CSS
// pixels in the viewport (y down) unless noted otherwise.

export type Point = [number, number]

// Loop time used for the single still frame under reduced motion.
export const REDUCED_MOTION_TIME = 15.8

// The hero table outline drops one light into the phone every HERO_DROP_PERIOD seconds;
// it lands at HERO_DROP_LANDING of the cycle (must match hero.glsl).
const HERO_DROP_PERIOD = 3.2
const HERO_DROP_LANDING = 0.55
const PING_LENGTH = 0.22

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

// Whether the hero phone frame flashes: right after a light from the table lands in it.
export function heroPhonePing(time: number): boolean {
  const t = time % HERO_DROP_PERIOD
  const landing = HERO_DROP_PERIOD * HERO_DROP_LANDING
  return t >= landing && t < landing + PING_LENGTH
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
