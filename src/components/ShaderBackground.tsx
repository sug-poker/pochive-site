import { useEffect, useRef } from 'react'
import {
  REDUCED_MOTION_TIME,
  cardSceneRect,
  featureAmount,
  heroFade,
  lightTarget,
  renderSettings,
  textSide,
  type Point,
} from '../background/scene'
import { buildFragmentSource } from '../background/shaderSource'
import { createRenderer, watchContextLoss, type Uniforms } from '../background/renderer'

const center = (r: DOMRect): Point => [r.left + r.width / 2, r.top + r.height / 2]

// Fixed full-page WebGL background. Everything touching window/document runs in the
// effect so the prerendered markup is just the canvas; the CSS felt shows without WebGL.
export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const root = document.documentElement
    const narrow = matchMedia('(max-width: 768px)')
    const settings = renderSettings({
      stacked: narrow.matches,
      coarsePointer: matchMedia('(pointer: coarse)').matches,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      devicePixelRatio: window.devicePixelRatio,
    })
    const renderer = createRenderer(canvas, buildFragmentSource({ fbmOctaves: settings.fbmOctaves }))
    if (!renderer) {
      root.classList.add('no-webgl')
      return
    }

    const ratio = settings.pixelRatio
    const heroPhoneEl = document.querySelector('[data-shader-anchor="hero-phone"]')
    const heroCardsEl = document.querySelector('[data-shader-anchor="hero-cards"]')
    const featureEls = [...document.querySelectorAll('[data-shader-anchor="feature"]')]
    // Device pixels, y up, as the shader expects.
    const toDevice = ([x, y]: Point): [number, number] => [x * ratio, (window.innerHeight - y) * ratio]

    let mouse: Point | null = null
    let light: Point | null = null
    let raf = 0
    let running = false
    let lost = false
    const t0 = performance.now()

    const draw = (now: number) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const stacked = narrow.matches
      const heroPhone = heroPhoneEl ? center(heroPhoneEl.getBoundingClientRect()) : null
      const featureRects = featureEls.map((el) => el.getBoundingClientRect())
      const featurePhones = featureRects.map(center)

      const target = lightTarget({ scrollY: window.scrollY, viewport: { width: vw, height: vh }, mouse, heroPhone, featurePhones })
      // Ease the spotlight towards its target; snap when nothing animates.
      light = light && settings.animate
        ? [light[0] + (target[0] - light[0]) * 0.05, light[1] + (target[1] - light[1]) * 0.05]
        : target

      const cards = heroCardsEl
        ? cardSceneRect(heroCardsEl.getBoundingClientRect(), stacked)
        : { left: 0, centerY: 0, unit: 1 }
      const [cardsX, cardsY] = toDevice([cards.left, cards.centerY])
      const sides = featurePhones.map((c) => textSide(c[0], vw, stacked))

      const uniforms: Uniforms = {
        res: [canvas.width, canvas.height],
        time: settings.animate ? (now - t0) / 1000 : REDUCED_MOTION_TIME,
        light: toDevice(light),
        hero: heroFade(window.scrollY, vh),
        phone: toDevice(heroPhone ?? [vw / 2, vh / 2]),
        cards: [cardsX, cardsY, cards.unit * ratio],
        stacked: stacked ? 1 : 0,
        features: featureRects.map((r, i) => {
          const [x, y] = toDevice(featurePhones[i])
          return [x, y, r.height * ratio, featureAmount(featurePhones[i][1], vh)]
        }),
        featureSides: [sides[0] ?? 0, sides[1] ?? 0, sides[2] ?? 0, sides[3] ?? 0],
      }
      renderer.draw(uniforms)
    }

    const loop = (now: number) => {
      draw(now)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || lost || document.hidden || !settings.animate) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    // With reduced motion there is no loop: redraw a single still frame on demand.
    const drawStill = () => {
      if (!settings.animate && !lost) requestAnimationFrame(draw)
    }

    const resize = () => {
      renderer.resize(Math.round(window.innerWidth * ratio), Math.round(window.innerHeight * ratio))
      drawStill()
    }
    const onMouseMove = (e: MouseEvent) => {
      mouse = [e.clientX, e.clientY]
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    const stopWatching = watchContextLoss(canvas, () => {
      lost = true
      stop()
      root.classList.add('no-webgl')
    })

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', drawStill, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    start()
    drawStill()

    return () => {
      stop()
      stopWatching()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', drawStill)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="shader-bg" aria-hidden="true" />
}
