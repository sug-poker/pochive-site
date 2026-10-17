// Shared uniforms and helpers. Coordinates are device pixels with y up (gl_FragCoord).
// uRes is the size of whichever canvas is drawing: the fixed background or an effect layer.
uniform vec2 uRes;
uniform float uTime;

const vec3 GOLD = vec3(.79,.66,.30);

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<FBM_OCTAVES;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }

float sdHeart(vec2 p){ p.x=abs(p.x); p.y+=.5;
  if(p.y+p.x>1.) return sqrt(dot(p-vec2(.25,.75),p-vec2(.25,.75)))-sqrt(2.)/4.;
  return sqrt(min(dot(p-vec2(0,1),p-vec2(0,1)), dot(p-.5*max(p.x+p.y,0.),p-.5*max(p.x+p.y,0.))))*sign(p.x-p.y); }
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
float sdRoundBox(vec2 p, vec2 b, float r){ vec2 d=abs(p)-b+r; return length(max(d,0.))+min(max(d.x,d.y),0.)-r; }
// suit SDF: k < .25 heart, < .5 spade, < .75 diamond, else club
float suit(vec2 p, float k){
  float stem = sdBox(p-vec2(0,-.55), vec2(.06,.25));
  if(k<.25) return sdHeart(p*1.2)/1.2;
  if(k<.5) return min(sdHeart(vec2(p.x,-p.y-.15)*1.3)/1.3, stem);
  if(k<.75) return (abs(p.x)*1.3+abs(p.y)-.75)*.6;
  float c = min(min(length(p-vec2(0,.32)), length(p-vec2(-.33,-.12))), length(p-vec2(.33,-.12)))-.3;
  return min(c, stem);
}
float line(float d, float w){ return smoothstep(w,0.,abs(d)); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
// screen position (device px) to aspect-corrected space centred on the viewport
vec2 toP(vec2 px){ return (px - .5*uRes)/uRes.y; }
