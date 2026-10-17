import { VERTEX_SOURCE } from './shaderSource'

export type Vec2 = [number, number]
type Vec4 = [number, number, number, number]

// Positions are device pixels with y up, matching gl_FragCoord.
export type Uniforms = {
  res: Vec2
  time: number
  light: Vec2
  hero: number
  phone: Vec2
  cards: [number, number, number]
  stacked: number
  features: Vec4[]
  featureSides: Vec4
}

export interface Renderer {
  resize(width: number, height: number): void
  draw(u: Uniforms): void
  dispose(): void
}

const UNIFORM_NAMES = ['uRes', 'uTime', 'uLight', 'uHero', 'uPhone', 'uCards', 'uStacked', 'uF0', 'uF1', 'uF2', 'uF3', 'uFSide'] as const
const NO_FEATURE: Vec4 = [0, 0, 1, 0]

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function createRenderer(canvas: HTMLCanvasElement, fragmentSource: string): Renderer | null {
  const gl = canvas.getContext('webgl', { antialias: false })
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  gl.useProgram(program)

  // One oversized triangle covers the whole viewport.
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const loc = Object.fromEntries(UNIFORM_NAMES.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<
    (typeof UNIFORM_NAMES)[number],
    WebGLUniformLocation | null
  >

  return {
    resize(width, height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    },
    draw(u) {
      gl.uniform2f(loc.uRes, ...u.res)
      gl.uniform1f(loc.uTime, u.time)
      gl.uniform2f(loc.uLight, ...u.light)
      gl.uniform1f(loc.uHero, u.hero)
      gl.uniform2f(loc.uPhone, ...u.phone)
      gl.uniform3f(loc.uCards, ...u.cards)
      gl.uniform1f(loc.uStacked, u.stacked)
      gl.uniform4f(loc.uF0, ...(u.features[0] ?? NO_FEATURE))
      gl.uniform4f(loc.uF1, ...(u.features[1] ?? NO_FEATURE))
      gl.uniform4f(loc.uF2, ...(u.features[2] ?? NO_FEATURE))
      gl.uniform4f(loc.uF3, ...(u.features[3] ?? NO_FEATURE))
      gl.uniform4f(loc.uFSide, ...u.featureSides)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}

export function watchContextLoss(canvas: EventTarget, onLost: () => void): () => void {
  const handler = () => onLost()
  canvas.addEventListener('webglcontextlost', handler)
  return () => canvas.removeEventListener('webglcontextlost', handler)
}
