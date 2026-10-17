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
  // a few of those embossed suits light up in gold now and then; held back in the hero
  float h = hash(ti);
  float phase = fract(uTime*.12 + h*7.);
  float glow = smoothstep(0.,.2,phase) * smoothstep(.55,.25,phase) * step(.88, h) * (1. - .7*uHero);
  col += GOLD * (smoothstep(.04,.0,abs(ds))*.9 + smoothstep(.03,-.03,ds)*.18 + exp(-max(ds,0.)*12.)*.12)
       * glow * (.35 + .9*light);
  // hero: a hand is dealt, scanned and recorded into the app
  if(uHero > .001) col += heroDeal(p, light) * uHero;
  col += featureFx(p);
  col *= smoothstep(1.4,.2,length(uv-.5)*1.6);
  gl_FragColor = vec4(col,1.);
}
