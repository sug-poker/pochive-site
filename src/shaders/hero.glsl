// Hero: an abstract racetrack table outline around the hero phone, in the same line-art
// manner as the feature effects. Three lights circle the rail and every DROP_PERIOD
// one leaves it and drops into the phone.
// q is phone-local: the phone centre is the origin and 1 unit is the phone height (uPhone.z).

// Track shape (half length of the straight edge, end-cap radius). Landscape it lies around the
// phone; on the stacked portrait layout it stands upright and hugs the phone so it stays readable.
const vec2 TRACK_WIDE = vec2(.42,.42);
const vec2 TRACK_UPRIGHT = vec2(.2,.34);
const float DROP_PERIOD = 3.2;
const float DROP_LANDING = .55;

float ease(float x){ x=clamp(x,0.,1.); return x*x*(3.-2.*x); }
float sdTrack(vec2 q, vec2 k){ return length(vec2(max(abs(q.x)-k.x,0.), q.y)) - k.y; }
// where a ray from the centre at loop position t (0..1) meets the track
vec2 onTrack(float t, vec2 k){
  float a = t*6.2831; vec2 dir = vec2(cos(a), sin(a));
  float s = k.y/max(abs(dir.y), 1e-3);
  if(abs(s*dir.x) <= k.x) return s*dir;
  vec2 c = vec2(sign(dir.x)*k.x, 0.);
  float b = dot(dir,c); return dir*(b + sqrt(max(b*b - (dot(c,c) - k.y*k.y), 0.)));
}

vec3 heroTrack(vec2 p, float light){
  vec2 q = (p - toP(uPhone.xy))/(uPhone.z/uRes.y);
  bool upright = uStacked > .5;
  if(upright) q = q.yx;
  vec2 k = upright ? TRACK_UPRIGHT : TRACK_WIDE;
  float d = sdTrack(q, k);
  float ang = fract(atan(q.y,q.x)/6.2831);
  // felt edge, outer rail and a dashed betting line
  float outline = line(d,.004)*.4 + line(d-.055,.003)*.2 + line(d+.1,.003)*.16*step(.5,fract(ang*28.));
  // three lights circling the rail, each with a short tail behind it
  float heads = 0., tails = 0.;
  for(int i=0;i<3;i++){
    float pk = fract(uTime*.045 + float(i)/3.);
    heads += exp(-length(q-onTrack(pk, k))*45.);
    float du = fract(ang - pk + .5) - .5;
    tails += line(d,.006) * smoothstep(-.12,0.,du) * step(du,0.);
  }
  // one light leaves the rail and drops into the phone each period
  float cyc = uTime/DROP_PERIOD; float tt = fract(cyc);
  float s = ease(tt/DROP_LANDING);
  vec2 pq = mix(onTrack(fract(floor(cyc)*.37 + .1), k), upright ? vec2(-.05,0.) : vec2(0.,-.05), s);
  float drop = exp(-length(q-pq)*60.) * step(tt, DROP_LANDING) * (1.-s*.5);
  return GOLD*(outline + heads*1.3 + tails*.35 + drop*1.6) * (.8 + .4*light);
}
