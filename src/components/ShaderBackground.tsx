import { useEffect, useRef } from 'react'
import {
  REDUCED_MOTION_TIME,
  canvasSize,
  featureAmount,
  frameDue,
  heroFade,
  layerBox,
  lightTarget,
  renderSettings,
  textSide,
  type Point,
} from '../background/scene'
import { buildBackgroundSource, buildLayerSource } from '../background/shaderSource'
import { createRenderer, watchContextLoss, type Renderer } from '../background/renderer'

const center = (r: DOMRect): Point => [r.left + r.width / 2, r.top + r.height / 2]

// A phone-anchored effect drawn in its own canvas inside its section, so the browser scrolls it
// in step with the phone (a fixed canvas measured from JS lags a frame behind on iOS).
interface Layer {
  canvas: HTMLCanvasElement
  kind: number // 0 hero outline, 1..4 features 01..04
  container: HTMLElement
  phone: HTMLElement
  renderer: Renderer
  phoneUniform: [number, number, number]
  side: number
  visible: boolean
  lastAmount: number
}

// Fixed full-page WebGL background plus the effect layers. Everything touching window/document
// runs in the effect so the prerendered markup is just the canvases; the CSS felt shows without WebGL.
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
    const renderer = createRenderer(canvas, buildBackgroundSource({ fbmOctaves: settings.fbmOctaves }))
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

    // Effect layers: a failed or lost layer is hidden on its own; the rest keep running.
    const layerSource = buildLayerSource({ fbmOctaves: settings.fbmOctaves })
    const layers: Layer[] = []
    const stopWatchingLayers: Array<() => void> = []
    let featureIndex = 0
    for (const el of document.querySelectorAll<HTMLCanvasElement>('canvas[data-shader-layer]')) {
      const kind = el.dataset.shaderLayer === 'hero' ? 0 : ++featureIndex
      const container = el.parentElement
      const phone = container?.querySelector<HTMLElement>('[data-shader-anchor]')
      const layerRenderer = container && phone ? createRenderer(el, layerSource, { transparent: true }) : null
      if (!container || !phone || !layerRenderer) {
        el.hidden = true
        continue
      }
      const layer: Layer = { canvas: el, kind, container, phone, renderer: layerRenderer, phoneUniform: [0, 0, 1], side: 0, visible: false, lastAmount: 0 }
      layers.push(layer)
      stopWatchingLayers.push(
        watchContextLoss(el, () => {
          el.hidden = true
          layers.splice(layers.indexOf(layer), 1)
        }),
      )
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
      const featurePhones = featureEls.map((el) => center(el.getBoundingClientRect()))

      const target = lightTarget({ scrollY: window.scrollY, viewport: { width: vw, height: vh }, mouse, heroPhone, featurePhones })
      // Ease the spotlight towards its target; snap when nothing animates.
      light = light && settings.animate
        ? [light[0] + (target[0] - light[0]) * 0.05, light[1] + (target[1] - light[1]) * 0.05]
        : target

      const time = settings.animate ? (now - t0) / 1000 : REDUCED_MOTION_TIME
      const hero = heroSection ? heroFade(heroSection.getBoundingClientRect().bottom, vh) : 0
      renderer.draw({ uRes: [canvas.width, canvas.height], uTime: time, uLight: toDevice(light), uHero: hero })

      for (const layer of layers) {
        if (!layer.visible) continue
        const amount = layer.kind === 0 ? hero : featureAmount(center(layer.phone.getBoundingClientRect())[1], vh)
        // Skip layers that stay faded out; draw once more on the way out so nothing lingers.
        if (amount <= 0.001 && layer.lastAmount <= 0.001) continue
        layer.lastAmount = amount
        const r = layer.canvas.getBoundingClientRect()
        layer.renderer.draw({
          uRes: [layer.canvas.width, layer.canvas.height],
          uTime: time,
          uPhone: layer.phoneUniform,
          uStacked: stacked ? 1 : 0,
          uKind: layer.kind,
          uSide: layer.side,
          uAmount: amount,
          uView: [r.left * ratio, (vh - r.bottom) * ratio, vw * ratio, vh * ratio],
        })
      }
    }

    let lastDrawn = -Infinity
    const loop = (now: number) => {
      if (frameDue(now, lastDrawn, settings.maxFps)) {
        lastDrawn = now
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

    // Place each layer inside its section. Only layout changes move it; scrolling never does.
    const layout = () => {
      const vw = canvas.clientWidth
      const stacked = narrow.matches
      for (const layer of layers) {
        const box = layerBox(layer.container.getBoundingClientRect(), layer.phone.getBoundingClientRect(), vw)
        const style = layer.canvas.style
        style.left = `${box.left}px`
        style.top = `${box.top}px`
        style.width = `${box.width}px`
        style.height = `${box.height}px`
        const [w, h] = canvasSize(box.width, box.height, ratio)
        if (w !== layer.canvas.width || h !== layer.canvas.height) layer.renderer.resize(w, h)
        const [cx, cy, ph] = box.phone
        layer.phoneUniform = [cx * ratio, (box.height - cy) * ratio, ph * ratio]
        layer.side = layer.kind === 0 ? 0 : textSide(cx, vw, stacked)
      }
    }
    // Images loading late or fonts settling change the layout without a window resize.
    const resizeObserver = new ResizeObserver(() => {
      layout()
      drawStill()
    })
    for (const layer of layers) {
      resizeObserver.observe(layer.container)
      resizeObserver.observe(layer.phone)
    }
    // Only layers on screen are drawn.
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const layer = layers.find((l) => l.canvas === entry.target)
        if (layer) layer.visible = entry.isIntersecting
      }
      drawStill()
    })
    for (const layer of layers) intersectionObserver.observe(layer.canvas)

    const resize = () => {
      fitCanvas()
      layout()
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
      for (const unwatch of stopWatchingLayers) unwatch()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', drawStill)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.dispose()
      for (const layer of layers) layer.renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="shader-bg" aria-hidden="true" />
}
