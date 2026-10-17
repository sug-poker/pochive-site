import { describe, expect, it, vi } from 'vitest'
import { createRenderer, watchContextLoss } from './renderer'

describe('createRenderer', () => {
  it('returns null when WebGL is unavailable', () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement
    expect(createRenderer(canvas, 'void main(){}')).toBeNull()
  })
})

describe('createRenderer context attributes', () => {
  it('asks for a transparent, premultiplied context for effect layers', () => {
    const asked: unknown[] = []
    const canvas = { getContext: (_: string, attrs: unknown) => (asked.push(attrs), null) } as unknown as HTMLCanvasElement
    createRenderer(canvas, 'void main(){}', { transparent: true })
    createRenderer(canvas, 'void main(){}')
    expect(asked[0]).toMatchObject({ alpha: true, premultipliedAlpha: true })
    expect(asked[1]).toMatchObject({ alpha: false })
  })
})

describe('watchContextLoss', () => {
  it('calls onLost once on webglcontextlost and stops after unsubscribe', () => {
    const target = new EventTarget()
    const onLost = vi.fn()
    const off = watchContextLoss(target, onLost)
    target.dispatchEvent(new Event('webglcontextlost'))
    expect(onLost).toHaveBeenCalledTimes(1)
    off()
    target.dispatchEvent(new Event('webglcontextlost'))
    expect(onLost).toHaveBeenCalledTimes(1)
  })
})
