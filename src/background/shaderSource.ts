import common from '../shaders/common.glsl?raw'
import background from '../shaders/background.frag.glsl?raw'
import layerUniforms from '../shaders/layer-uniforms.glsl?raw'
import hero from '../shaders/hero.glsl?raw'
import features from '../shaders/features.glsl?raw'
import layer from '../shaders/layer.frag.glsl?raw'

export const VERTEX_SOURCE = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }'

// GLSL ES 1.0 has no includes, so the parts are concatenated in dependency order.
// FBM_OCTAVES must be a compile-time constant because it bounds a loop.
const header = (fbmOctaves: number) => `precision highp float;\n#define FBM_OCTAVES ${fbmOctaves}\n`

// The fixed full-page background.
export function buildBackgroundSource(opts: { fbmOctaves: number }): string {
  return [header(opts.fbmOctaves), common, background].join('\n')
}

// A phone-anchored effect layer (hero outline or one of the feature effects).
export function buildLayerSource(opts: { fbmOctaves: number }): string {
  return [header(opts.fbmOctaves), common, layerUniforms, hero, features, layer].join('\n')
}
