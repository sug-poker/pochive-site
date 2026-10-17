import { describe, expect, it, vi } from 'vitest'
import { createRenderer, watchContextLoss } from './renderer'

describe('createRenderer', () => {
  it('returns null when WebGL is unavailable', () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement
    expect(createRenderer(canvas, 'void main(){}')).toBeNull()
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
