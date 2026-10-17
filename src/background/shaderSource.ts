import common from '../shaders/common.glsl?raw'
import hero from '../shaders/hero.glsl?raw'
import features from '../shaders/features.glsl?raw'
import background from '../shaders/background.frag.glsl?raw'

export const VERTEX_SOURCE = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }'

// GLSL ES 1.0 has no includes, so the parts are concatenated in dependency order.
// FBM_OCTAVES must be a compile-time constant because it bounds a loop.
export function buildFragmentSource(opts: { fbmOctaves: number }): string {
  return [`precision highp float;\n#define FBM_OCTAVES ${opts.fbmOctaves}\n`, common, hero, features, background].join('\n')
}
