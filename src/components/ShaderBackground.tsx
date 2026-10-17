import { useEffect, useRef } from 'react'
import {
  REDUCED_MOTION_TIME,
  canvasSize,
  featureAmount,
  frameDue,
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
    const heroPhoneEl = document.querySelector<HTMLElement>('[data-shader-anchor="hero-phone"]')
    const heroSection = document.getElementById('hero')
    const featureEls = [...document.querySelectorAll('[data-shader-anchor="feature"]')]
    // Device pixels, y up, as the shader expects. The fixed canvas sits at the viewport origin,
    // so its own CSS box (not window.innerHeight, which lags iOS toolbar changes) is the frame.
    const toDevice = ([x, y]: Point): [number, number] => [x * ratio, (canvas.clientHeight - y) * ratio]
    // Match the drawing buffer to the canvas box whenever it changes size.
    const fitCanvas = () => {
      const [w, h] = canvasSize(canvas.clientWidth, canvas.clientHeight, ratio)
      if (w !== canvas.width || h !== canvas.height) renderer.resize(w, h)
    }

    let mouse: Point | null = null
    let light: Point | null = null
    let raf = 0
    let running = false
    let lost = false
    const t0 = performance.now()

    const draw = (now: number) => {
      fitCanvas()
      const vw = canvas.clientWidth
      const vh = canvas.clientHeight
      const stacked = narrow.matches
      const heroPhoneRect = heroPhoneEl?.getBoundingClientRect()
      const heroPhone = heroPhoneRect ? center(heroPhoneRect) : null
      const featureRects = featureEls.map((el) => el.getBoundingClientRect())
      const featurePhones = featureRects.map(center)

      const target = lightTarget({ scrollY: window.scrollY, viewport: { width: vw, height: vh }, mouse, heroPhone, featurePhones })
      // Ease the spotlight towards its target; snap when nothing animates.
      light = light && settings.animate
        ? [light[0] + (target[0] - light[0]) * 0.05, light[1] + (target[1] - light[1]) * 0.05]
        : target

      const time = settings.animate ? (now - t0) / 1000 : REDUCED_MOTION_TIME
      const sides = featurePhones.map((c) => textSide(c[0], vw, stacked))

      const uniforms: Uniforms = {
        res: [canvas.width, canvas.height],
        time,
        light: toDevice(light),
        hero: heroSection ? heroFade(heroSection.getBoundingClientRect().bottom, vh) : 0,
        phone: [...toDevice(heroPhone ?? [vw / 2, vh / 2]), (heroPhoneRect?.height ?? 1) * ratio],
        stacked: stacked ? 1 : 0,
        features: featureRects.map((r, i) => {
          const [x, y] = toDevice(featurePhones[i])
          return [x, y, r.height * ratio, featureAmount(featurePhones[i][1], vh)]
        }),
        featureSides: [sides[0] ?? 0, sides[1] ?? 0, sides[2] ?? 0, sides[3] ?? 0],
      }
      renderer.draw(uniforms)
    }

    let lastDrawn = -Infinity
    let lastScrollY = window.scrollY
    const loop = (now: number) => {
      const scrolling = window.scrollY !== lastScrollY
      if (frameDue(now, lastDrawn, settings.maxFps, scrolling)) {
        lastDrawn = now
        lastScrollY = window.scrollY
        draw(now)
      }
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
      fitCanvas()
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
