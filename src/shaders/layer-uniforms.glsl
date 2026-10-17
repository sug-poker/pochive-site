// Uniforms of an effect layer canvas (see layer.frag.glsl). Positions are this canvas's device px, y up.
uniform vec3 uPhone;    // the phone: centre and height
uniform float uStacked; // 1 on the stacked (portrait) layout
uniform float uKind;    // 0 hero outline, 1..4 features 01..04
uniform float uSide;    // where the description text lies: 1 right, -1 left, 0 below
uniform float uAmount;  // strength from scrolling (hero fade / feature amount)
uniform vec4 uView;     // this canvas's bottom-left on screen and the viewport size, for the vignette
