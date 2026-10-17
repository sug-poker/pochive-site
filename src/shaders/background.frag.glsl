// Felt, spotlight and embossed suits for the whole page, with the hero and feature effects on top.
void main(){
  vec2 uv = gl_FragCoord.xy/uRes; vec2 p = toP(gl_FragCoord.xy);
  vec2 lp = toP(uLight);
  // felt + spotlight
  float grain = fbm(gl_FragCoord.xy*.35) * .5 + fbm(p*6.) * .5;
  vec3 col = mix(vec3(.02,.06,.04), vec3(.05,.13,.08), grain);
  float light = exp(-2.2*length((p-lp)*vec2(.8,1.1))) * (.9 + .1*sin(uTime*.7));
  col *= .35 + 1.6*light;
  // embossed suits, only visible under the light
  vec2 tq = p*7.; vec2 ti = floor(tq); vec2 tf = fract(tq)-.5;
  if(mod(ti.x+ti.y,2.)<1.) tf.y = -tf.y;
  float ds = suit(tf*3.6, fract((mod(ti.x,4.))/4.+.01));
  col += vec3(.05,.12,.08) * smoothstep(.03,-.03,ds) * light * .5;
  col -= vec3(.01,.02,.015) * smoothstep(.05,.0,abs(ds)) * light;
  // hero: a hand is dealt, scanned and recorded into the app
  if(uHero > .001) col += heroDeal(p, light) * uHero;
  // suit nodes: sparse and only under the light, outside the hero
  vec2 g = p*14.; vec2 gi = floor(g); vec2 gf = fract(g)-.5;
  float h = hash(gi);
  float phase = fract(uTime*.18 + h*7.);
  float life = smoothstep(0.,.15,phase) * smoothstep(.5,.2,phase) * step(.9, h) * clamp(light*1.2,0.,1.) * (1.-uHero);
  float d = suit(gf*3.2, fract(h*13.7));
  col += GOLD * (smoothstep(.05,.0,abs(d))*1.1 + smoothstep(.03,-.03,d)*.35) * life * (.6 + .8*light) * .5;
  col += featureFx(p);
  col *= smoothstep(1.4,.2,length(uv-.5)*1.6);
  gl_FragColor = vec4(col,1.);
}
