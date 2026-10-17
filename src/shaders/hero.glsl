// Hero: a line-art poker table plays one hand (BTN A♠K♠ vs BB) on a 17s loop. Every action
// sends a packet into the hero phone and the won pot pours into it at the end.
// The timeline must match HERO_LOOP / heroPhoneState in src/background/scene.ts.
//
// Drawing happens in "m space", the approved mockup's coordinates: the hero-table anchor
// (centre uTable.xy, unit uTable.z px) maps to a scene .46 m-units tall centred on T_C.

const float T_LOOP = 17.;
const vec2 T_C = vec2(-.2,-.19);
const float T_TILT = .42;   // the table is seen at a tilt: m.y = table-plane y * T_TILT
const float T_L = .22;      // half length of the straight edge
const float T_RR = .30;     // end-cap radius of the felt edge
const float T_RAIL = .07;
const float T_SHOWDOWN = 13.2;
const float T_WIN = 13.7;

float ease(float x){ x=clamp(x,0.,1.); return x*x*(3.-2.*x); }
vec2 toM(vec2 p){ return T_C + (p - toP(uTable.xy)) / (uTable.z/uRes.y) * .46; }
vec2 toT(vec2 m){ vec2 q = m - T_C; q.y /= T_TILT; return q; }
vec2 fromT(vec2 q){ return T_C + vec2(q.x, q.y*T_TILT); }
float sdTable(vec2 q){ return length(vec2(max(abs(q.x)-T_L,0.), q.y)) - T_RR; }
// seats 0..5 = BTN, SB, BB, UTG, HJ, CO
vec2 seatT(float k){
  if(k<.5) return vec2(0.,-.43);
  if(k<1.5) return vec2(.43,-.33);
  if(k<2.5) return vec2(.43,.33);
  if(k<3.5) return vec2(0.,.43);
  if(k<4.5) return vec2(-.43,.33);
  return vec2(-.43,-.33);
}
vec2 seatPos(float k){ return fromT(seatT(k)); }
vec2 betPos(float k){ return fromT(seatT(k)*.52); }
vec2 potPos(){ return fromT(vec2(0.,.12)); }

// timeline: actions (BTN = seat 0, BB = seat 2), bets (seat, placed, collected), board deals
float actTime(int i){ if(i==0) return 1.; if(i==1) return 2.; if(i==2) return 4.6; if(i==3) return 5.4; if(i==4) return 6.3; if(i==5) return 8.6; if(i==6) return 9.4; if(i==7) return 11.; return 11.9; }
float actSeat(int i){ if(i==0||i==3||i==6||i==8) return 0.; return 2.; }
float betSeat(int i){ return (i==0||i==2||i==5) ? 0. : 2.; }
float betT(int i){ if(i==0) return 1.; if(i==1) return 2.; if(i==2) return 5.4; if(i==3) return 6.3; if(i==4) return 11.; return 11.9; }
float betC(int i){ return i<2 ? 2.8 : (i<4 ? 7.1 : 12.6); }
float boardT(int i){ if(i<3) return 3.4 + float(i)*.12; if(i==3) return 7.6; return 10.; }
float boardKind(int i){ if(i==0) return .6; if(i==1) return .9; if(i==2) return .1; if(i==3) return .4; return .1; }
float streetT(int i){ if(i==0) return 3.4; if(i==1) return 7.6; if(i==2) return 10.; return T_SHOWDOWN; }

// a card in gold line art; flip 0..1 turns it face up halfway through
vec3 cardLine(vec2 m, vec2 c, float ang, float kind, float flip, float a){
  if(a <= 0.) return vec3(0.);
  vec2 q = rot(ang)*(m-c);
  q.x /= max(abs(cos(flip*3.1416)), .06);
  float faceUp = step(.5, flip);
  float d = sdRoundBox(q, vec2(.02,.029), .004);
  float pd = suit(q*58., kind)/58.;
  return (GOLD*(line(d,.0012)*1.4 + line(pd,.001)*faceUp*1.1) + vec3(.02,.04,.03)*smoothstep(.0015,-.0015,d)) * a;
}
float chipLine(vec2 m, vec2 c){ return line(length(m-c)-.013, .0015)*.8; }
vec3 packet(vec2 m, vec2 q){ float l = length(m-q); return GOLD*(exp(-l*220.)*2. + exp(-l*40.)*.15); }

vec3 heroTable(vec2 p, float light){
  vec2 m = toM(p);
  vec2 ph = toM(toP(uPhone));
  float T = mod(uTime, T_LOOP);
  float fadeAll = smoothstep(0.,.4,T) * (1. - smoothstep(16.3,16.9,T));
  vec3 col = vec3(0.);

  // table: felt edge, outer rail line and a dashed betting line
  vec2 tq = toT(m);
  float d = sdTable(tq);
  float feltM = smoothstep(.006,-.006,d);
  col += GOLD*(line(d,.004)*.55 + line(d-T_RAIL,.003)*.22);
  col += GOLD*line(d+.12,.003)*.18*step(.5,fract(atan(tq.y,tq.x)*14.))*feltM;

  // seats light up on each action; folded seats dim
  for(int s=0;s<6;s++){
    float fs = float(s);
    float ds = length(tq - seatT(fs)) - .055;
    float playing = (s==0||s==2) ? 1. : 1. - .6*smoothstep(1.2,1.6,T);
    float act = 0.;
    for(int i=0;i<9;i++){ if(abs(actSeat(i)-fs)<.5){ float dt=T-actTime(i); act += step(0.,dt)*exp(-dt*2.5); } }
    col += mix(GOLD*.28, GOLD*1.1, act) * line(ds,.004) * playing;
    col += GOLD * exp(-max(ds,0.)*25.) * act * .25;
  }
  // dealer button
  col += GOLD*line(length(m - seatPos(0.) - vec2(.06,.035)) - .008, .0012)*.6;

  // hole cards: BTN face up, BB face down until the showdown
  for(int i=0;i<2;i++){
    float fi = float(i);
    float a = ease((T-.3-fi*.1)/.35) * fadeAll;
    col += cardLine(m, mix(T_C, seatPos(0.)+vec2(-.012+fi*.026,.06), a), (fi-.5)*.18, .4, 1., a*.65);
    col += cardLine(m, mix(T_C, seatPos(2.)+vec2(-.07+fi*.026,-.035), a), (fi-.5)*.18, .9, ease((T-T_SHOWDOWN-fi*.1)/.35), a*.65);
  }
  // board
  for(int i=0;i<5;i++){
    float t0 = boardT(i);
    float a = ease((T-t0)/.3) * fadeAll;
    col += cardLine(m, T_C + vec2((float(i)-2.)*.048, -.012 + (1.-a)*.03), 0., boardKind(i), ease((T-t0-.15)/.3), a*.65);
  }
  // bets slide to the bet line, then into the pot at the end of the street
  float potAmt = 0.;
  for(int i=0;i<6;i++){
    float tb = betT(i), tc = betC(i), s = betSeat(i);
    if(T < tb) continue;
    potAmt += step(tc+.4, T);
    if(T > tc+.4) continue;
    vec2 pos = mix(seatPos(s), betPos(s), ease((T-tb)/.4));
    pos = mix(pos, potPos(), ease((T-tc)/.4));
    col += GOLD*chipLine(m, pos)*fadeAll;
  }
  // the pot, until it pours into the phone
  float gone = step(T_WIN, T);
  for(int j=0;j<3;j++){
    float fj = float(j);
    if(fj >= potAmt) break;
    col += GOLD*chipLine(m, potPos() + vec2(fj*.018-.018, fj*.004))*(1.-gone)*fadeAll;
  }

  // every action and every street sends a packet into the phone
  for(int i=0;i<9;i++){
    float dt = T - actTime(i) - .1;
    if(dt < 0. || dt > 1.) continue;
    float s = ease(dt/.9);
    vec2 q = mix(seatPos(actSeat(i)), ph + vec2(0.,-.12), s);
    q.y += sin(s*3.1416)*.14;
    col += packet(m, q) * (1.-smoothstep(.85,1.,dt)) * .6;
  }
  for(int i=0;i<4;i++){
    float dt = T - streetT(i) - .3;
    if(dt < 0. || dt > 1.) continue;
    float s = ease(dt/.9);
    vec2 q = mix(T_C, ph + vec2(0.,-.12), s);
    q.y += sin(s*3.1416)*.16;
    col += packet(m, q) * (1.-smoothstep(.85,1.,dt)) * .6;
  }
  // the won pot pours into the phone as chips turning into light
  for(int j=0;j<16;j++){
    float fj = float(j);
    float dt = T - T_WIN - fj*.05;
    if(dt < 0. || dt > 1.1) continue;
    float s = ease(dt/1.);
    vec2 q = mix(potPos() + vec2(hash(vec2(fj,4.))*.04-.02, 0.), ph + vec2(0.,.08), s);
    q.y += sin(s*3.1416)*(.12+.06*hash(vec2(fj,5.)));
    float dd = length(m-q) - mix(.01, .002, s);
    col += GOLD * (smoothstep(.002,-.002,dd)*1.4 + exp(-max(dd,0.)*120.)*.5) * (1.-smoothstep(.9,1.1,dt));
  }
  return col * (.8 + .4*light);
}
