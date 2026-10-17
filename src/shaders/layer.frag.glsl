// One phone-anchored effect, drawn in a canvas that scrolls with its section so the browser moves
// it in step with the phone. Output is premultiplied with alpha from brightness, to sit over the
// fixed background.
void main(){
  vec2 p = toP(gl_FragCoord.xy);
  vec4 f = vec4(uPhone, 1.);
  bool stacked = uStacked > .5;
  vec3 col;
  if(uKind < .5) col = heroTrack(p, .5);
  else {
    vec2 q = local(p, f, uSide);
    // stacked: shrink the dial so its ring hugs the phone instead of crossing the heading below
    if(uKind < 1.5) col = fxSession(q * (stacked ? 1.38 : 1.));
    else if(uKind < 2.5) col = fxHand(q);
    else if(uKind < 3.5) col = fxBankroll(stacked ? fitBand(q, f, -.2, 2.4, -.05, -.15) : q);
    else col = fxGlobe(q) + fxRoute(stacked ? fitBand(q, f, .35, 2.1, .6, -.35) : q);
  }
  // the same viewport vignette the fixed background applies
  vec2 uv = (gl_FragCoord.xy + uView.xy)/uView.zw;
  col = clamp(col * uAmount * smoothstep(1.4,.2,length(uv-.5)*1.6), 0., 1.);
  float a = max(max(col.r, col.g), col.b);
  gl_FragColor = vec4(col, a);
}
