import { describe, expect, it } from 'vitest'
import { buildFragmentSource, VERTEX_SOURCE } from './shaderSource'

describe('buildFragmentSource', () => {
  const src = buildFragmentSource({ fbmOctaves: 3 })
  it('starts with a single precision line followed by the octave define', () => {
    expect(src.startsWith('precision highp float;\n#define FBM_OCTAVES 3\n')).toBe(true)
    expect(src.match(/precision /g)).toHaveLength(1)
  })
  it('includes every part exactly once', () => {
    for (const fn of ['float fbm(', 'vec3 heroTable(', 'vec3 featureFx(', 'void main(']) {
      expect(src.split(fn)).toHaveLength(2)
    }
  })
  it('declares the uniform contract', () => {
    for (const u of ['uRes', 'uTime', 'uLight', 'uHero', 'uPhone', 'uTable', 'uStacked', 'uF0', 'uF1', 'uF2', 'uF3', 'uFSide']) {
      expect(src).toMatch(new RegExp(`uniform \\w+ ${u};`))
    }
  })
  it('never draws grid pulses', () => {
    expect(src).not.toMatch(/pulseX/)
  })
  it('lights up the fixed embossed suits instead of a separate suit-node grid', () => {
    expect(src).not.toMatch(/p\*14\./)
    expect(src).toContain('float glow = ')
  })
  it('the hero is a line-art table, not the old card scan', () => {
    expect(src).toContain('float sdTable(')
    expect(src).not.toMatch(/BEAM_FROM|uCards/)
  })
  it('vertex shader passes the full-screen triangle through', () => {
    expect(VERTEX_SOURCE).toContain('gl_Position')
  })
})
