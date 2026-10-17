// Pure layout and timing math for the shader background. Coordinates are CSS
// pixels in the viewport (y down) unless noted otherwise.

export type Point = [number, number]

// Loop time used for the single still frame under reduced motion.
export const REDUCED_MOTION_TIME = 15.8

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

export function renderSettings(env: {
  stacked: boolean
  coarsePointer: boolean
  reducedMotion: boolean
  devicePixelRatio: number
}): { pixelRatio: number; fbmOctaves: number; animate: boolean; maxFps: number } {
  const mobile = env.stacked || env.coarsePointer
  return {
    pixelRatio: Math.min(env.devicePixelRatio, mobile ? 2 : 1.5),
    fbmOctaves: mobile ? 3 : 5,
    animate: !env.reducedMotion,
    // Phones render at 2x for crisp lines and pay for it with half the frame rate.
    maxFps: mobile ? 30 : 60,
  }
}

// Whether to draw this animation frame. While the page scrolls every frame is drawn so the
// effects anchored to phones keep pace with them; otherwise frames are spaced to maxFps.
// A couple of milliseconds of slack keeps 30fps steady on 60Hz timers.
export function frameDue(now: number, lastDrawn: number, maxFps: number, scrolling: boolean): boolean {
  return scrolling || now - lastDrawn >= 1000 / maxFps - 2
}

// Drawing-buffer size for a canvas whose CSS box is width x height. Measuring the canvas itself
// (not the window) keeps it unstretched while iOS Safari's toolbars grow and shrink.
export function canvasSize(width: number, height: number, ratio: number): [number, number] {
  return [Math.round(width * ratio), Math.round(height * ratio)]
}
