// Feature effects drawn behind each feature phone. f = (centre px, phone height px, amount);
// side says where the description text lies (1 right, -1 left, 0 below) so effects reach toward it.
vec2 local(vec2 p, vec4 f, float side){
  vec2 q = (p - toP(f.xy))/(f.z/uRes.y);
  if(side != 0.) q.x *= side;
  return q;
}

// Stacked (mobile) layout: there is no room beside the phone, so a wide effect is fitted
// across 90% of the viewport in a band whose top lands at phone-local y = top, keeping its
// aspect ratio. [a, b] is the effect's x domain and yTop the top of its y range.
vec2 fitBand(vec2 q, vec4 f, float a, float b, float yTop, float top){
  float w = uRes.x/f.z;
  float s = (b - a)/(.9*w);
  return vec2(a + (q.x + .45*w)*s, yTop + (q.y - top)*s);
}

// 01 Session: a clock dial around the phone, the elapsed-time arc sweeping round
vec3 fxSession(vec2 q){
  float r = length(q);
  float a = fract(atan(q.x,q.y)/6.2831);
  float prog = fract(uTime*.06);
  float ring = line(r-.68, .004);
  float tick = step(.985, fract(a*60.)) * step(.645,r) * step(r,.665);
  float major = step(.993, fract(a*12.+.003)) * step(.61,r) * step(r,.665);
  float arc = line(r-.72, .006) * step(a, prog);
  float tail = line(r-.72, .03) * step(a, prog) * smoothstep(prog-.25, prog, a) * .4;
  vec2 head = .72*vec2(sin(prog*6.2831), cos(prog*6.2831));
  float dotH = exp(-length(q-head)*40.);
  return GOLD * (ring*.35 + tick*.3 + major*.6 + arc*1.2 + tail + dotH*1.5);
}
// 02 Hand: five cards fanned behind the phone, dealt flop / turn / river
vec3 fxHand(vec2 q){
  vec3 col = vec3(0.);
  float cyc = fract(uTime*.08) * 7.;
  for(int i=0;i<5;i++){
    float fi = float(i);
    float ang = (fi-2.)*.32;
    vec2 cq = rot(ang) * (q - vec2(0.,-.7)) - vec2(0.,1.02);
    float d = sdRoundBox(cq, vec2(.2,.29), .03);
    float shown = (fi<3.) ? step(1.,cyc) : step(fi, cyc);
    shown *= step(cyc, 6.4);
    float edge = line(d, .006);
    float pip = smoothstep(.02,-.02, suit((cq-vec2(-.12,.19))*14., fract(fi*.27+.1))/14.);
    col += GOLD * (edge*(.25 + .9*shown) + pip*shown*.9 + smoothstep(0.,-.02,d)*shown*.04);
  }
  return col;
}
// 03 Bankroll: a P&L line drawing itself from the phone out under the description
float pnl(float x){ return -.5 + .38*(x+.2)/2.6 + .15*(fbm(vec2(x*2.2, 3.))-.5) + .04*sin(x*9.); }
vec3 fxBankroll(vec2 q){
  float x = q.x;
  float y = pnl(x);
  float prog = -.2 + 2.6*smoothstep(0.,.8,fract(uTime*.07));
  float span = step(-.2,x) * smoothstep(2.4,1.9,x);
  float on = span * step(x,prog);
  float curve = line(q.y-y, .008) * on;
  float fill = step(q.y,y) * smoothstep(-.65, y, q.y) * on * .12;
  float grid = 0.;
  for(int i=0;i<4;i++){ grid += line(q.y-(-.6+float(i)*.15), .002); }
  grid *= span;
  float head = exp(-length(q-vec2(prog, pnl(prog)))*35.) * step(prog,2.3);
  return GOLD * (curve*1.3 + fill + grid*.12 + head*1.4);
}
// 04 Trip: a wireframe globe behind the phone and a dashed flight arc out toward the text
vec3 fxGlobe(vec2 q){
  float R = .78;
  vec2 g = q/R; float rr = dot(g,g);
  float globe = 0.;
  if(rr < 1.){
    float lat = asin(g.y); float cl = cos(lat);
    float lon = asin(clamp(g.x/cl, -1., 1.)) + uTime*.12;
    globe += line(fract(lon/.5236+.5)-.5, .02);
    globe += line(fract(lat/.3491+.5)-.5, .03);
  }
  return GOLD * (globe*.3 + line(sqrt(rr)-1., .006)*.5);
}
vec3 fxRoute(vec2 q){
  float u = (q.x-.35)/1.75;
  float fy = .2 + .4*sin(3.1416*u);
  float dfy = .4*3.1416/1.75*cos(3.1416*u);
  float d = (q.y - fy)/sqrt(1.+dfy*dfy);
  float inRange = step(0.,u) * step(u,1.);
  float dash = step(.5, fract(u*24. - uTime*.8));
  float arc = line(d, .006) * dash * inRange;
  float pu = fract(uTime*.09);
  float plane = exp(-length(q-vec2(.35+1.75*pu, .2+.4*sin(3.1416*pu)))*40.);
  float pins = exp(-length(q-vec2(.35,.2))*45.) + exp(-length(q-vec2(2.1,.2))*45.);
  return GOLD * (arc*.9 + plane*1.6 + pins*1.2);
}

vec3 featureFx(vec2 p){
  vec3 c = vec3(0.);
  bool stacked = uStacked > .5;
  // stacked: shrink the dial so its ring hugs the phone instead of crossing the heading below
  if(uF0.w > .001) c += fxSession(local(p,uF0,uFSide.x) * (stacked ? 1.38 : 1.)) * uF0.w;
  if(uF1.w > .001) c += fxHand(local(p,uF1,uFSide.y)) * uF1.w;
  if(uF2.w > .001){
    vec2 q = local(p,uF2,uFSide.z);
    c += fxBankroll(stacked ? fitBand(q, uF2, -.2, 2.4, -.05, -.15) : q) * uF2.w;
  }
  if(uF3.w > .001){
    vec2 q = local(p,uF3,uFSide.w);
    c += (fxGlobe(q) + fxRoute(stacked ? fitBand(q, uF3, .35, 2.1, .6, -.35) : q)) * uF3.w;
  }
  return c;
}
