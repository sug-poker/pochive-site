// Hero: a hand is dealt, a beam scans it into gold wireframe, and data points
// rise from the recorded cards into the hero phone. Loops every 11 seconds.
// Card coordinates are local to the card scene: 1 unit = one card height (uCards.z px).

// card i: 0-1 hole cards, 2-6 board (flop, turn, river)
vec2 cardPos(float i){ return i < 2. ? vec2(.35 + i*.58, 0.) : vec2(1.73 + (i-2.)*.846, 0.); }
float cardRot(float i){ return i < 1. ? .14 : (i < 2. ? -.08 : 0.); }
float cardDealt(float i){ return i < 2. ? i*.3 : (i < 5. ? 1. + (i-2.)*.25 : (i < 6. ? 2.3 : 3.1)); }

const float BEAM_FROM = -.3;
const float BEAM_TO = 5.9;

vec3 heroDeal(vec2 p, float light){
  vec2 origin = toP(uCards.xy);
  float unit = uCards.z/uRes.y;
  vec2 l = (p - origin)/unit;
  float T = mod(uTime, 11.);
  float fadeAll = 1. - smoothstep(9.8, 10.8, T);
  float beamX = mix(BEAM_FROM, BEAM_TO, smoothstep(4., 6.5, T));
  float beamOn = smoothstep(3.6,4.,T) * (1. - smoothstep(6.5,7.,T));
  vec2 ph = toP(uPhone);
  vec3 col = vec3(0.);
  for(int k=0;k<7;k++){
    float i = float(k);
    float td = cardDealt(i);
    float a = smoothstep(td, td+.45, T);
    if(a <= 0.) continue;
    vec2 pos = cardPos(i) + vec2(0., (1.-a)*.92);
    vec2 cq = rot(cardRot(i)*a) * (l - pos);
    float d = sdRoundBox(cq, vec2(.346,.5), .06);
    float kind = fract(i*.37 + .3);
    float pd = suit(cq*3.12, kind)/3.12;
    // physical card in the site palette: dark green face, cream pip, muted edge, lit by the spotlight
    float face = smoothstep(.015,-.015,d);
    vec3 phys = mix(vec3(.075,.12,.09), vec3(.94,.9,.78), smoothstep(.015,-.015,pd)) * face * (.45 + 1.1*light);
    phys += vec3(.54,.61,.56) * line(d,.014) * (.35 + .6*light);
    phys -= vec3(.03) * smoothstep(.23,.0,d) * (1.-face);
    // recorded card: gold wireframe with scanlines
    float wire = line(d,.012)*1.3 + line(pd,.012)*1.1 + face*line(fract(cq.y*11.7)-.5,.12)*.18;
    float scanned = step(l.x, beamX);
    col += mix(phys, GOLD*wire, scanned) * a * fadeAll;
    // data points rising from the recorded card into the phone (p space)
    float tr = (beamX >= pos.x) ? T - mix(4., 6.5, (pos.x-BEAM_FROM)/(BEAM_TO-BEAM_FROM)) : -1.;
    if(tr > 0.){
      vec2 start = origin + pos*unit;
      for(int j=0;j<6;j++){
        float fj = float(j);
        float s = fract(tr*.28 + fj/6.);
        float on = step(fj/6., tr*.28);
        vec2 q = mix(start, ph + vec2(-.05 + .1*hash(vec2(i,fj)), -.1 + .2*hash(vec2(fj,i))), s*s*(3.-2.*s));
        q.y += sin(s*3.1416)*(.12 + .08*hash(vec2(i+fj,3.)));
        col += GOLD * exp(-length(p-q)*260.) * (1.-s) * on * 1.6 * fadeAll;
      }
    }
  }
  // the scanning beam
  float band = smoothstep(-1.15,-.7,l.y) * smoothstep(1.3,.77,l.y);
  float dx = abs(l.x-beamX);
  col += GOLD * (exp(-dx*52.)*1.4 + exp(-dx*5.2)*.15) * band * beamOn;
  return col;
}
