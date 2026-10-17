import { describe, expect, it } from 'vitest'
import { buildBackgroundSource, buildLayerSource, VERTEX_SOURCE } from './shaderSource'

const once = (src: string, needle: string) => expect(src.split(needle)).toHaveLength(2)

describe('buildBackgroundSource', () => {
  const src = buildBackgroundSource({ fbmOctaves: 3 })
  it('starts with a single precision line followed by the octave define', () => {
    expect(src.startsWith('precision highp float;\n#define FBM_OCTAVES 3\n')).toBe(true)
    expect(src.match(/precision /g)).toHaveLength(1)
  })
  it('draws only the felt, spotlight and suits: no phone-anchored effects', () => {
    once(src, 'void main(')
    expect(src).not.toMatch(/heroTrack\(|featureFx\(|fxSession\(/)
  })
  it('declares the background uniforms', () => {
    for (const u of ['uRes', 'uTime', 'uLight', 'uHero']) expect(src).toMatch(new RegExp(`uniform \\w+ ${u};`))
  })
  it('lights up the fixed embossed suits instead of a separate suit-node grid', () => {
    expect(src).not.toMatch(/p\*14\./)
    expect(src).toContain('float glow = ')
  })
})

describe('buildLayerSource', () => {
  const src = buildLayerSource({ fbmOctaves: 3 })
  it('includes the hero and feature effects and one main', () => {
    for (const fn of ['float fbm(', 'vec3 heroTrack(', 'vec3 fxSession(', 'void main(']) once(src, fn)
  })
  it('declares the layer uniforms', () => {
    for (const u of ['uRes', 'uTime', 'uPhone', 'uStacked', 'uKind', 'uSide', 'uAmount', 'uView']) {
      expect(src).toMatch(new RegExp(`uniform \\w+ ${u};`))
    }
  })
  it('writes premultiplied colour with alpha from brightness, so it can sit over the fixed background', () => {
    expect(src).toContain('gl_FragColor = vec4(col, a)')
  })
  it('the hero is an abstract table outline around the phone, not a played-out scene', () => {
    expect(src).toContain('float sdTrack(')
    expect(src).not.toMatch(/BEAM_FROM|uCards|uTable|seatT|betPos/)
  })
  it('turns the hero table outline upright on the stacked (portrait) layout', () => {
    const hero = src.slice(src.indexOf('vec3 heroTrack('), src.indexOf('vec2 local('))
    expect(hero).toContain('uStacked')
  })
  it('never draws grid pulses', () => {
    expect(src).not.toMatch(/pulseX/)
  })
})

describe('VERTEX_SOURCE', () => {
  it('passes the full-screen triangle through', () => {
    expect(VERTEX_SOURCE).toContain('gl_Position')
  })
})
