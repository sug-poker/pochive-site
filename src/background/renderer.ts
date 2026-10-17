import { VERTEX_SOURCE } from './shaderSource'

export type UniformValue = number | readonly number[]

export interface Renderer {
  resize(width: number, height: number): void
  // Sets each uniform by name (1 to 4 floats) and draws a full-screen pass.
  draw(uniforms: Record<string, UniformValue>): void
  dispose(): void
}

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

// transparent: a see-through canvas whose shader writes premultiplied colour (effect layers).
export function createRenderer(
  canvas: HTMLCanvasElement,
  fragmentSource: string,
  options: { transparent?: boolean } = {},
): Renderer | null {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: !!options.transparent,
    premultipliedAlpha: !!options.transparent,
  })
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

  const locations = new Map<string, WebGLUniformLocation | null>()
  const location = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name))
    return locations.get(name) ?? null
  }

  return {
    resize(width, height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    },
    draw(uniforms) {
      for (const [name, value] of Object.entries(uniforms)) {
        const loc = location(name)
        const v = typeof value === 'number' ? [value] : value
        if (v.length === 1) gl.uniform1f(loc, v[0])
        else if (v.length === 2) gl.uniform2f(loc, v[0], v[1])
        else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2])
        else gl.uniform4f(loc, v[0], v[1], v[2], v[3])
      }
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
