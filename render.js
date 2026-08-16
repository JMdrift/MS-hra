/* ═══════════ izometrické vykreslování ═══════════ */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let W=0, H=0, DPR=1, Zfit=1, ZU=1, panX=0, panY=0, cx0=0, cy0=0, pulse=0;
const TW=104, TH=52, EL=9;
let MODE = { v:'map' };
let floats = [], upHit = {}, platHit = {};

const HOME = { cx:6.5, cy:6.5 };
function centerCam() { cx0 = W/2; cy0 = H/2 - (HOME.cx+HOME.cy)*(TH/2)*Z(); }
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
  cv.width = W*DPR; cv.height = H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  Zfit = Math.min(W*0.94/(13*TW), H*0.80/(13*TH));
  centerCam();
  if (MODE.v === 'detail') focusOn(PARC[MODE.id], spanOf(MODE.id)); else clampPan();
}
const Z = () => Zfit*ZU;
const iso = (gx,gy,z) => ({ x: cx0+panX+(gx-gy)*(TW/2)*Z(), y: cy0+panY+(gx+gy)*(TH/2)*Z()-(z||0)*Z() });

function worldBounds() {
  let x0=0,x1=13,y0=0,y1=13;
  PLATFORMS.forEach(p => { x0=Math.min(x0,p.ox); y0=Math.min(y0,p.oy);
    x1=Math.max(x1,p.ox+PSZ); y1=Math.max(y1,p.oy+PSZ); });
  return {x0,x1,y0,y1};
}
const WB = worldBounds();
function clampPan() {
  if (MODE.v !== 'map') return;
  const s = Z();
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  [[WB.x0,WB.y0],[WB.x1,WB.y0],[WB.x1,WB.y1],[WB.x0,WB.y1]].forEach(([gx,gy])=>{
    const px = cx0+(gx-gy)*(TW/2)*s, py = cy0+(gx+gy)*(TH/2)*s;
    minX=Math.min(minX,px); maxX=Math.max(maxX,px);
    minY=Math.min(minY,py); maxY=Math.max(maxY,py); });
  const mx = W*0.45, my = H*0.42;
  panX = Math.max(mx-maxX, Math.min(W-mx-minX, panX));
  panY = Math.max(my-maxY, Math.min(H-my-minY, panY));
}
function setZoom(z, ax, ay) {
  const o = Z(), oc = cy0; ZU = Math.max(.42, Math.min(4, z)); const n = Z();
  if (ax !== undefined) { const k = n/o-1; panX -= (ax-cx0-panX)*k; panY -= (ay-cy0-panY)*k; }
  centerCam(); panY += oc-cy0; clampPan();
}
function focusOn(p, sp) {
  sp = sp || 2;
  ZU = Math.min(4, Math.max(1.4, Math.min(W/((sp+2.2)*TW*Zfit), H/((sp+4.4)*TH*Zfit))));
  centerCam();
  const s = Z(), gc = p.gx+sp/2, gr = p.gy+sp/2;
  panX = -(gc-gr)*(TW/2)*s;
  panY = -(gc+gr)*(TH/2)*s + (H*.36-cy0);
}

/* ─── primitiva ─── */
function sh(hex,f) { const n = parseInt(hex.slice(1),16);
  return `rgb(${Math.min(255,((n>>16)&255)*f)|0},${Math.min(255,((n>>8)&255)*f)|0},${Math.min(255,(n&255)*f)|0})`; }
function poly(p,fill) { ctx.beginPath(); ctx.moveTo(p[0].x,p[0].y);
  for (let i=1;i<p.length;i++) ctx.lineTo(p[i].x,p[i].y);
  ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); }
const TOP=1.13, LFT=.66, RGT=.86;
function box(gx,gy,w,d,z0,z1,col) {
  const A=iso(gx,gy,z1),B=iso(gx+w,gy,z1),Cc=iso(gx+w,gy+d,z1),D=iso(gx,gy+d,z1);
  const C0=iso(gx+w,gy+d,z0),D0=iso(gx,gy+d,z0),B0=iso(gx+w,gy,z0);
  poly([D,Cc,C0,D0],sh(col,LFT)); poly([Cc,B,B0,C0],sh(col,RGT)); poly([A,B,Cc,D],sh(col,TOP));
}
function pyr(gx,gy,w,d,z0,z1,col) {
  const c=[iso(gx,gy,z0),iso(gx+w,gy,z0),iso(gx+w,gy+d,z0),iso(gx,gy+d,z0)], ap=iso(gx+w/2,gy+d/2,z1);
  poly([c[0],c[1],ap],sh(col,TOP)); poly([c[1],c[2],ap],sh(col,RGT));
  poly([c[2],c[3],ap],sh(col,LFT)); poly([c[3],c[0],ap],sh(col,.98));
}
function gableR(gx,gy,w,d,z0,z1,col) {
  const rA=iso(gx,gy+d/2,z1), rB=iso(gx+w,gy+d/2,z1);
  const a=iso(gx,gy,z0),b=iso(gx+w,gy,z0),c=iso(gx+w,gy+d,z0),e=iso(gx,gy+d,z0);
  poly([a,b,rB,rA],sh(col,TOP)); poly([e,c,rB,rA],sh(col,LFT));
  poly([a,rA,e],sh(col,.94)); poly([b,rB,c],sh(col,RGT));
}
function shadow(gx,gy,w,d) { const s=Z(), c=iso(gx+w/2,gy+d/2,0);
  ctx.save(); ctx.translate(c.x,c.y); ctx.scale(1,.5);
  ctx.beginPath(); ctx.arc(0,0,Math.max(w,d)*TW*.36*s,0,7);
  ctx.fillStyle='rgba(10,16,8,.3)'; ctx.fill(); ctx.restore(); }
const rnd = (x,y) => { const s = Math.sin(x*127.1+y*311.7)*43758.5453; return s-Math.floor(s); };
function tile(gx,gy,col) { const v = rnd(gx,gy)*.09-.045;
  box(gx,gy,1,1,0,EL,col);
  poly([iso(gx,gy,EL),iso(gx+1,gy,EL),iso(gx+1,gy+1,EL),iso(gx,gy+1,EL)], sh(col,TOP+v)); }
function smoke(gx,gy,z) { const t = pulse/26;
  for (let i=0;i<3;i++) { const p = iso(gx,gy,z+6+i*9+((t+i)%3)*3);
    ctx.beginPath(); ctx.arc(p.x+Math.sin(t+i)*4*Z(), p.y, (3+i*1.6)*Z(), 0, 7);
    ctx.fillStyle = `rgba(220,225,215,${.22-i*.06})`; ctx.fill(); } }

/* ─── dekorace ─── */
function tree(gx,gy,v){ shadow(gx+.18,gy+.18,.64,.64);
  box(gx+.44,gy+.44,.13,.13,EL,EL+10+v*4,C.woodD);
  const h=EL+26+v*12;
  pyr(gx+.14,gy+.14,.72,.72,EL+8,h, v>.6?C.leaf3:v>.3?C.leaf2:C.leaf1);
  if(v>.45) pyr(gx+.24,gy+.24,.52,.52,h-9,h+9, v>.6?C.leaf3:C.leaf1); }
function rock(gx,gy,v){ shadow(gx+.24,gy+.26,.5,.46);
  box(gx+.22,gy+.24,.44,.42,EL,EL+7+v*5,C.stone);
  box(gx+.46,gy+.16,.26,.26,EL,EL+12+v*6,C.stoneD); }
function wheatT(gx,gy,v){ shadow(gx+.2,gy+.2,.6,.6);
  for(let i=0;i<4;i++){const o=i*.19; box(gx+.16+o,gy+.2+o*.6,.12,.12,EL,EL+10+v*5, i%2?C.wheat:sh(C.wheat,.9));} }
function clayT(gx,gy,v){ shadow(gx+.2,gy+.2,.6,.6);
  box(gx+.18,gy+.18,.52,.52,EL-3,EL+2,sh(C.clay,.85));
  box(gx+.42,gy+.4,.28,.28,EL+2,EL+8+v*4,C.clay); }
function bushT(gx,gy){ shadow(gx+.3,gy+.3,.4,.4); pyr(gx+.3,gy+.3,.4,.4,EL,EL+13,C.leaf2); }
function stumpT(gx,gy){ shadow(gx+.34,gy+.34,.32,.32); box(gx+.36,gy+.36,.28,.28,EL,EL+7,C.woodD); }
const DRAW = { tree, rock, wheat:wheatT, clay:clayT, bush:bushT, stump:stumpT };

/* ─── obytné stavby ─── */
function house(gx,gy,ph,st,big,hl,sp) {
  sp = (sp||2)/2;
  const o = big ? {i:.08*sp,w:1.84*sp,H:44*sp,R:34*sp} : {i:.24*sp,w:1.52*sp,H:34*sp,R:26*sp};
  const x=gx+o.i, y=gy+o.i, w=o.w;
  if (ph>=1) { shadow(gx+.1,gy+.1,1.8*sp,1.8*sp);
    [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(x+p[0]*(w-.26),y+p[1]*(w-.26),.26,.26,EL,EL+7,C.stone)); }
  if (ph>=2) {
    [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(x+.03+p[0]*(w-.2),y+.03+p[1]*(w-.2),.15,.15,EL+7,EL+o.H,C.woodD));
    box(x,y,w,.1,EL+o.H-6,EL+o.H,C.woodD); box(x,y+w-.1,w,.1,EL+o.H-6,EL+o.H,C.woodD); }
  if (ph>=3) {
    box(x,y,w,w,EL+7,EL+o.H,st.wall);
    poly([iso(x+w*.34,y+w,EL+o.H*.62),iso(x+w*.62,y+w,EL+o.H*.62),
          iso(x+w*.62,y+w,EL+8),iso(x+w*.34,y+w,EL+8)], sh(st.wall,.34));
    poly([iso(x+w,y+w*.3,EL+o.H*.74),iso(x+w,y+w*.62,EL+o.H*.74),
          iso(x+w,y+w*.62,EL+o.H*.42),iso(x+w,y+w*.3,EL+o.H*.42)], sh(st.wall,.42)); }
  const topZ = EL+o.H + (hl>=3 ? o.H*.62 : 0);
  if (ph>=3 && hl>=3) box(x+.03,y+.03,w-.06,w-.06,EL+o.H,topZ,sh(st.wall,1.06));
  if (ph>=4) {
    ctx.strokeStyle = sh(C.woodD,1.1); ctx.lineWidth = 2.2*Z();
    const cor=[iso(x-.08,y-.08,topZ),iso(x+w+.08,y-.08,topZ),iso(x+w+.08,y+w+.08,topZ),iso(x-.08,y+w+.08,topZ)];
    const ap = iso(x+w/2,y+w/2,topZ+o.R);
    cor.forEach(p=>{ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(ap.x,ap.y);ctx.stroke();});
    ctx.beginPath(); ctx.moveTo(cor[0].x,cor[0].y); cor.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.closePath(); ctx.stroke(); }
  if (ph>=5) {
    if (st.roofT==='gable') gableR(x-.1,y-.1,w+.2,w+.2,topZ,topZ+o.R,st.roof);
    else pyr(x-.1,y-.1,w+.2,w+.2,topZ,topZ+o.R,st.roof);
    if (st.chim||hl>=3) { box(x+w*.7,y+w*.16,.18,.18,topZ+o.R*.4,topZ+o.R+9,C.brick);
      smoke(x+w*.79,y+w*.25,topZ+o.R+9); } }
  if (ph>=6) { box(x-.16,y+w*.3,.16,w*.44,EL+7,EL+9,C.woodD);
    box(x-.14,y+w*.32,.1,.1,EL+9,EL+o.H*.8,C.woodD);
    box(x-.14,y+w*.62,.1,.1,EL+9,EL+o.H*.8,C.woodD); }
  if (ph>=5 && hl>=2) {
    box(x+w,y+w*.24,.52,w*.5,EL,EL+o.H*.62,sh(st.wall,.92));
    gableR(x+w-.06,y+w*.18,.64,w*.62,EL+o.H*.62,EL+o.H*.62+14,st.roof); }
}
function warehouse(gx,gy,ph,st,lvl) {
  house(gx,gy,ph,st,false,1,2);
  if (ph<5) return;
  if (lvl>=2) { box(gx+1.72,gy+.5,.42,.8,EL,EL+26,sh(st.wall,.9));
    gableR(gx+1.66,gy+.44,.54,.92,EL+26,EL+35,st.roof); }
  if (lvl>=3) { box(gx-.3,gy+.5,.5,.5,EL,EL+46,C.concrete);
    pyr(gx-.36,gy+.44,.62,.62,EL+46,EL+55,C.slate); }
  if (lvl>=4) { box(gx-.3,gy+1.1,.44,.44,EL,EL+38,sh(C.concrete,.9));
    pyr(gx-.35,gy+1.05,.54,.54,EL+38,EL+45,C.slate); }
  if (lvl>=5) { box(gx+.2,gy+1.8,1.4,.3,EL,EL+5,C.woodD);
    box(gx+.5,gy+1.85,.3,.2,EL+5,EL+16,C.steel); }
}
function apartment(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const k = sp/2;
  const x=gx+.16*k, y=gy+.16*k, w=(1.68)*k;
  const floors = 2 + Math.max(0,hl-1), fh = 22*k, baseH = EL+6;
  if (ph>=1) { shadow(gx+.08,gy+.08,1.86*k,1.86*k); box(x-.06,y-.06,w+.12,w+.12,0,EL+5,C.concrete); }
  if (ph>=2) box(x,y,w,w,EL+5,baseH+fh,st.wall);
  const shown = Math.min(floors, Math.max(0, ph-2));
  for (let f=0; f<shown; f++) {
    const z0 = baseH+fh*f, z1 = baseH+fh*(f+1);
    box(x,y,w,w,z0,z1, f%2?sh(st.wall,1.05):st.wall);
    for (let i=0;i<3;i++) {
      const wy = y+w*(.16+i*.28);
      poly([iso(x+w,wy,z1-5*k),iso(x+w,wy+w*.15,z1-5*k),
            iso(x+w,wy+w*.15,z0+5*k),iso(x+w,wy,z0+5*k)], 'rgba(240,220,160,.5)');
    }
  }
  const topZ = baseH+fh*Math.max(1,shown);
  if (ph>=5) { pyr(x-.1,y-.1,w+.2,w+.2,topZ,topZ+16*k,st.roof);
    if (st.chim) box(x+w*.66,y+w*.12,.16,.16,topZ+6,topZ+26,C.brick); }
  if (ph>=6) { box(x-.18,y+w*.34,.18,w*.36,EL+5,EL+7,C.woodD);
    const c = iso(x-.05,y+w*.5,EL+16);
    ctx.beginPath(); ctx.arc(c.x,c.y,3.4*Z(),0,7);
    ctx.fillStyle = gridLive()?C.green:C.red; ctx.fill(); }
}
function villa(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-0.5, x = gx+.25, y = gy+.25;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+5,C.concrete); }
  if (ph>=2) box(x+.1,y+.1,w-.2,w*.62,EL+5,EL+32,st.wall);
  if (ph>=3) box(x+.1,y+w*.66,w-.2,w*.28,EL+5,EL+24,sh(st.wall,.94));
  if (ph>=4) { box(x+.1,y+.1,w-.2,w*.62,EL+32,EL+54,sh(st.wall,1.05));
    for (let i=0;i<4;i++) poly([iso(x+w-.1,y+.3+i*(w*.14),EL+50),iso(x+w-.1,y+.4+i*(w*.14),EL+50),
      iso(x+w-.1,y+.4+i*(w*.14),EL+36),iso(x+w-.1,y+.3+i*(w*.14),EL+36)],'rgba(240,230,190,.55)'); }
  if (ph>=5) { box(x-.1,y+w*.2,.22,w*.5,EL+5,EL+7,C.stone);
    for (let i=0;i<3;i++) box(x-.06,y+w*.24+i*(w*.18),.12,.12,EL+7,EL+30,C.plaster); }
  if (ph>=6) {
    pyr(x,y,w,w*.72,EL+54,EL+54+18,st.roof);
    gableR(x+.02,y+w*.64,w-.04,w*.32,EL+24,EL+34,st.roof);
    if (st.chim) box(x+w*.72,y+w*.16,.18,.18,EL+58,EL+76,C.brick);
    if (hl>=2) { box(x+w*.06,y+w*.98,w*.5,.5,EL+5,EL+7,C.glass);
      box(x+w*.62,y+w*.98,.4,.4,EL+5,EL+18,sh(st.wall,.9)); }
    if (hl>=3) { box(x+w,y+.2,.6,w*.5,EL+5,EL+40,sh(st.wall,1.02));
      pyr(x+w-.06,y+.14,.72,w*.6,EL+40,EL+52,st.roof); }
    const c = iso(x+.05,y+w*.45,EL+16);
    ctx.beginPath(); ctx.arc(c.x,c.y,3.4*Z(),0,7);
    ctx.fillStyle = gridLive()?C.green:C.red; ctx.fill();
  }
}
function parkB(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const w = sp-.3, x = gx+.15, y = gy+.15;
  if (ph>=1) { shadow(gx+.1,gy+.1,sp-.2,sp-.2); box(x,y,w,w,0,EL+2,st.wall); }
  if (ph>=2) { const t = w/5;
    for (let i=0;i<3;i++) box(x+.1,y+t*(i*1.6+.5),w-.2,.16,EL+2,EL+3,'#C6B徐'.slice(0,7)==='#C6B徐'?'#C7B98A':'#C7B98A'); }
  if (ph>=3) { const pts=[[.2,.25],[.72,.3],[.35,.72],[.78,.74],[.5,.48]];
    pts.forEach((p,i)=>{ box(x+w*p[0],y+w*p[1],.12,.12,EL+2,EL+9+i*2,C.woodD);
      pyr(x+w*p[0]-.16,y+w*p[1]-.16,.44,.44,EL+8+i*2,EL+22+i*3, i%2?C.leaf1:C.leaf2); }); }
  if (ph>=4) { for (let i=0;i<3;i++) { const bx=x+w*(.2+i*.28), by=y+w*.88;
      box(bx,by,.3,.1,EL+2,EL+5,C.woodD); box(bx,by,.06,.16,EL+5,EL+9,C.woodD); }
    for (let i=0;i<=4;i++) { const t=i/4;
      box(x+t*w,y-.04,.07,.07,EL+2,EL+9,C.woodD); box(x-.04,y+t*w,.07,.07,EL+2,EL+9,C.woodD); } }
  if (ph>=4 && hl>=2) { box(x+w*.14,y+w*.12,.5,.4,EL+2,EL+8,'#C4763F');
    box(x+w*.2,y+w*.16,.1,.1,EL+8,EL+22,C.steel);
    box(x+w*.16,y+w*.14,.42,.1,EL+22,EL+24,'#C4763F'); }
  if (ph>=4 && hl>=3) { box(x+w*.6,y+w*.55,.62,.5,EL+1,EL+3,C.glass);
    [[0,0],[1,0],[0,1],[1,1]].forEach(q=>box(x+w*.62+q[0]*.5,y+w*.57+q[1]*.4,.08,.08,EL+3,EL+20,C.woodD));
    pyr(x+w*.56,y+w*.51,.74,.62,EL+20,EL+30,C.tile); }
}
function mall(gx,gy,ph,hl,st,sp) {
  sp = sp||4; const w = sp-.4, x = gx+.2, y = gy+.2;
  if (ph>=1) { shadow(gx+.1,gy+.1,sp-.2,sp-.2); box(x,y,w,w,0,EL+5,C.asphalt); }
  if (ph>=2) [[0,0],[1,0],[0,1],[1,1]].forEach(p=>
    box(x+.2+p[0]*(w-.6),y+.2+p[1]*(w-.6),.22,.22,EL+5,EL+46,C.steel));
  if (ph>=3) box(x+.1,y+.1,w-.2,w-.2,EL+5,EL+38,st.wall);
  if (ph>=4) { for (let i=0;i<5;i++)
      poly([iso(x+w-.1,y+.4+i*(w*.16),EL+34),iso(x+w-.1,y+.5+i*(w*.16),EL+34),
            iso(x+w-.1,y+.5+i*(w*.16),EL+12),iso(x+w-.1,y+.4+i*(w*.16),EL+12)],'rgba(190,225,240,.5)');
    box(x+.1,y+.1,w-.2,w-.2,EL+38,EL+42,sh(st.wall,.8)); }
  if (ph>=5) { const f = hl>=2 ? 2 : 1;
    for (let i=0;i<f;i++) box(x+.3,y+.3,w-.6,w-.6,EL+42+i*22,EL+62+i*22,sh(st.wall,1.04)); }
  if (ph>=6) {
    const topZ = EL+62+(hl>=2?22:0);
    box(x+.24,y+.24,w-.48,w-.48,topZ,topZ+4,C.slate);
    box(x+w*.2,y+w*.2,.4,.4,topZ+4,topZ+16,C.steel);
    box(x+w*.62,y+w*.24,.34,.34,topZ+4,topZ+13,C.steel);
    box(x-.16,y+w*.36,.28,w*.3,EL+5,EL+8,C.concrete);
    if (hl>=3) box(x+w+.05,y+.3,.7,w-.6,0,EL+30,sh(C.concrete,.86));
    const c = iso(x+.05,y+w*.5,EL+20);
    ctx.beginPath(); ctx.arc(c.x,c.y,4*Z(),0,7);
    ctx.fillStyle = gridLive()?C.green:C.red; ctx.fill();
  }
}

/* ─── elektrárna: turbíny + chladicí věže ─── */
function powerPlant(gx,gy,ph,sp) {
  sp = sp || 3;
  const x=gx+.08, y=gy+.08, w=sp-.16;
  const live = gridLive();
  if (ph>=1) { shadow(gx+.05,gy+.05,sp-.1,sp-.1); box(x,y,w,w,0,EL+4,C.asphalt); }
  if (ph>=2) [[0,0],[1,0],[0,1],[1,1]].forEach(p=>
    box(x+.1+p[0]*(w-.42),y+.1+p[1]*(w-.42),.22,.22,EL+4,EL+52,C.steel));
  if (ph>=3) box(x+.06,y+.06,w*.54,w-.12,EL+4,EL+46,C.concrete);
  if (ph>=4) { box(x+w*.6,y+.06,w*.36,w*.5,EL+4,EL+34,sh(C.concrete,.92));
    for(let i=0;i<3;i++) box(x+w*.64,y+.2+i*(w*.14),w*.28,.18,EL+34,EL+38,C.steel); }
  if (ph>=5) { const t = plantBuilt() ? S.plant.turb : 1;
    for (let i=0;i<Math.min(t,4);i++) {
      const cx2 = x+w*.1+ (i%2)*w*.22, cy2 = y+w*.12 + ((i/2)|0)*w*.3;
      const hgt = EL+46+50;
      box(cx2,cy2,.3,.3,EL+46,hgt,sh(C.concrete,.86));
      if (live) smoke(cx2+.15,cy2+.15,hgt);
    } }
  if (ph>=6) {
    gableR(x-.04,y-.04,w*.58,w+.08,EL+46,EL+56,C.slate);
    const cl = plantBuilt() ? S.plant.cool : 1;
    for (let i=0;i<Math.min(cl,3);i++) {
      const cx2 = x+w*.62+ i*w*.2, cy2 = y+w*.62;
      box(cx2,cy2,.46,.46,EL+4,EL+30,sh(C.concrete,.8));
      pyr(cx2-.04,cy2-.04,.54,.54,EL+30,EL+40,sh(C.concrete,.7));
      if (live) smoke(cx2+.23,cy2+.23,EL+40);
    }
    for(let i=0;i<4;i++) box(x+w*.62+i*.26,y+w-.3,.12,.12,EL+4,EL+26,C.steel);
    const c = iso(x+w*.84,y+w*.5,EL+40);
    ctx.beginPath(); ctx.arc(c.x,c.y,4.5*Z(),0,7);
    ctx.fillStyle = live?C.green:C.red; ctx.fill();
  }
}

/* ─── stanice ─── */
function stDeck(d, lvl) {
  const size = [1.9,2.4,2.7,3.0,3.3,3.6][lvl] || 1.9, o = (2-size)/2;
  const g = d.gx+o, y = d.gy+o;
  const base = { saw:C.dirt, quarry:C.quarry, field:C.meadow, pit:C.clay, coal:'#4A4640' }[d.kind];
  box(g,y,size,size,0,EL-1,sh(base,.72));
  poly([iso(g,y,EL-1),iso(g+size,y,EL-1),iso(g+size,y+size,EL-1),iso(g,y+size,EL-1)], sh(base,1.06));
  const r=.1;
  box(g,y,size,r,EL-1,EL+2,C.stoneD); box(g,y+size-r,size,r,EL-1,EL+2,C.stoneD);
  box(g,y,r,size,EL-1,EL+2,C.stoneD); box(g+size-r,y,r,size,EL-1,EL+2,C.stoneD);
  return { g, y, size };
}
function station(id) {
  const d = nodeDef(id), n = S.nodes[id], lv = n.lvl;
  const D = stDeck(d, lv), g = D.g, y = D.y, sz = D.size;
  shadow(d.gx+.1, d.gy+.1, 1.8, 1.8);
  const hall = (ox,oy,w2,h2,col,roof) => { box(g+sz*ox,y+sz*oy,w2,h2,EL+1,EL+24,col);
    gableR(g+sz*ox-.05,y+sz*oy-.05,w2+.1,h2+.1,EL+24,EL+34,roof); };
  if (d.kind === 'saw') {
    for (let i=0;i<3;i++) box(g+.22,y+.3+i*.26,sz*.36,.2,EL+1,EL+10, i%2?C.log:sh(C.log,.88));
    if (lv>=1) {
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(g+sz*.44+p[0]*sz*.4,y+sz*.1+p[1]*sz*.34,.12,.12,EL+1,EL+27,C.woodD));
      gableR(g+sz*.38,y+sz*.04,sz*.58,sz*.5,EL+27,EL+40, lv>=2?C.tile:'#6E8A52');
      const c = iso(g+sz*.66,y+sz*.26,EL+15);
      ctx.beginPath(); ctx.arc(c.x,c.y,6*Z(),0,7); ctx.fillStyle='#B9BEB8'; ctx.fill(); }
    if (lv>=2) { box(g+sz*.08,y+sz*.66,.46,.4,EL+1,EL+24,C.brick);
      box(g+sz*.14,y+sz*.72,.18,.18,EL+24,EL+44,sh(C.brick,.8)); smoke(g+sz*.23,y+sz*.81,EL+44); }
    if (lv>=3) hall(.56,.6,.7,.6,C.concrete,C.slate);
    if (lv>=4) hall(.06,.06,.5,.44,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.58,y+sz*.06,.4,.4,EL+1,EL+40,C.steel);
      pyr(g+sz*.56,y+sz*.04,.46,.46,EL+40,EL+50,C.slate); }
  } else if (d.kind === 'quarry') {
    box(g+.28,y+.28,sz-.56,sz-.56,EL-6,EL-1,sh(C.quarry,.62));
    box(g+.5,y+.5,.42,.42,EL-6,EL+6,C.stone);
    box(g+sz-1.0,y+sz-.9,.36,.36,EL-6,EL+3,C.stoneD);
    if (lv>=1) { const px=g+sz*.42, py=y+sz*.42;
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(px+p[0]*.6,py+p[1]*.6,.11,.11,EL+1,EL+30,C.woodD));
      box(px-.06,py-.06,.82,.11,EL+30,EL+35,C.woodD);
      box(g+sz*.06,y+sz*.08,.56,.4,EL+1,EL+16,'#7C8A6E');
      box(g+sz*.04,y+sz*.06,.62,.44,EL+16,EL+18,C.slate); }
    if (lv>=2) { box(g+sz*.06,y+sz*.64,.5,.46,EL+1,EL+22,C.stoneD);
      pyr(g+sz*.03,y+sz*.61,.6,.54,EL+22,EL+30,'#4E5450');
      box(g+sz*.13,y+sz*.74,.16,.16,EL+28,EL+46,'#4E5450'); smoke(g+sz*.21,y+sz*.82,EL+46); }
    if (lv>=3) { box(g+sz*.42,y+sz*.06,1.0,.16,EL+8,EL+12,C.stoneD); }
    if (lv>=4) hall(.56,.62,.66,.56,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.68,y+sz*.14,.44,.44,EL+1,EL+22,'#8A6E3E');
      box(g+sz*.76,y+sz*.22,.16,.16,EL+22,EL+36,C.woodD); }
  } else if (d.kind === 'field') {
    const rows = [3,5,6,7,8,9][lv] || 3;
    for (let i=0;i<rows;i++) box(g+.22,y+.26+i*((sz-.5)/rows),sz-.44,.13,EL,EL+9, i%2?C.wheat:sh(C.wheat,.9));
    if (lv>=1) { const mx=g+sz-.6, my=y+.22;
      box(mx,my,.18,.18,EL,EL+34,C.woodD);
      const c = iso(mx+.09,my+.09,EL+34);
      ctx.strokeStyle = sh(C.woodD,1.25); ctx.lineWidth = 2.6*Z();
      for (let a=0;a<4;a++) { const an = a*Math.PI/2 + (S.nodes[id].on ? pulse/20 : pulse/320);
        ctx.beginPath(); ctx.moveTo(c.x,c.y);
        ctx.lineTo(c.x+Math.cos(an)*16*Z(), c.y+Math.sin(an)*16*Z()*.85); ctx.stroke(); } }
    if (lv>=2) hall(.06,.66,.6,.5,C.wood,C.tile);
    if (lv>=3) { box(g+sz-.75,y+sz-.75,.44,.44,EL,EL+38,C.concrete);
      pyr(g+sz-.8,y+sz-.8,.54,.54,EL+38,EL+46,C.slate); }
    if (lv>=4) hall(.58,.06,.6,.5,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.06,y+sz*.06,.42,.42,EL,EL+34,C.concrete);
      pyr(g+sz*.04,y+sz*.04,.5,.5,EL+34,EL+42,C.slate); }
  } else if (d.kind === 'pit') {
    box(g+.26,y+.26,sz-.52,sz-.52,EL-7,EL-1,sh(C.clay,.66));
    box(g+.5,y+.5,sz-1.0,sz-1.0,EL-7,EL-4,sh(C.clay,.82));
    for (let i=0;i<3;i++) box(g+.6+i*.34,y+.7,.26,.46,EL-4,EL-1,C.clay);
    if (lv>=1) { const px=g+sz-.8, py=y+.3;
      box(px,py,.13,.13,EL,EL+28,C.woodD); box(px-.5,py,.63,.1,EL+24,EL+28,C.woodD); }
    if (lv>=2) { box(g+sz*.1,y+sz*.56,.66,.54,EL,EL+22,C.brick);
      pyr(g+sz*.07,y+sz*.53,.76,.62,EL+22,EL+34,sh(C.brick,.78));
      box(g+sz*.22,y+sz*.66,.18,.18,EL+30,EL+50,sh(C.brick,.66)); smoke(g+sz*.31,y+sz*.75,EL+50); }
    if (lv>=3) { box(g+sz*.56,y+sz*.56,.6,.5,EL,EL+20,sh(C.brick,.9));
      pyr(g+sz*.53,y+sz*.53,.7,.58,EL+20,EL+30,sh(C.brick,.72)); }
    if (lv>=4) hall(.06,.06,.5,.44,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.6,y+sz*.08,.42,.42,EL,EL+34,C.concrete);
      pyr(g+sz*.58,y+sz*.06,.5,.5,EL+34,EL+44,C.slate); }
  } else {   // uhlí
    box(g+.3,y+.3,sz-.6,sz-.6,EL-8,EL-1,'#2E3134');
    for (let i=0;i<3;i++) box(g+.5+i*.4,y+.6,.32,.32,EL-1,EL+6+i*3,C.coal);
    if (lv>=1) {
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(g+sz*.48+p[0]*.48,y+sz*.14+p[1]*.48,.12,.12,EL,EL+38,C.steel));
      box(g+sz*.46,y+sz*.12,.72,.72,EL+38,EL+42,C.steel);
      const c = iso(g+sz*.48+.3,y+sz*.14+.3,EL+44);
      ctx.beginPath(); ctx.arc(c.x,c.y,6*Z(),0,7);
      ctx.strokeStyle=C.steel; ctx.lineWidth=2.4*Z(); ctx.stroke();
      box(g+sz*.1,y+sz*.58,.56,.4,EL-1,EL+14,'#7C8A6E');
      box(g+sz*.08,y+sz*.56,.62,.44,EL+14,EL+16,C.slate); }
    if (lv>=2) { hall(.56,.58,.58,.48,sh(C.steel,.8),C.slate);
      box(g+sz*.18,y+sz*.3,.9,.14,EL+10,EL+14,C.steel); }
    if (lv>=3) { box(g+sz*.08,y+sz*.08,.5,.44,EL-1,EL+26,'#8A6E3E');
      box(g+sz*.16,y+sz*.16,.16,.16,EL+26,EL+40,C.woodD); }
  }
}

function emptyPlot(gx,gy,sp) {
  sp = sp || 2; const w = sp-.2;
  box(gx+.1,gy+.1,w,w,0,EL-2,sh(C.dirt,.95));
  const n = sp*2;
  for (let i=0;i<=n;i++) { const t=i/n;
    box(gx+.06+t*w,gy+.02,.09,.09,EL,EL+11,C.woodD);
    box(gx+.02,gy+.06+t*w,.09,.09,EL,EL+11,C.woodD); }
}

/* ─── popisky ─── */
function pill(gx,gy,span,txt,bg,fg,size,lift) {
  const c = iso(gx+span/2,gy+span/2,0), y = c.y-(span*TH/2)*Z()-(lift||5);
  ctx.font = `700 ${size}px Inter,system-ui,sans-serif`;
  const w = ctx.measureText(txt).width+11, h = size+8;
  ctx.fillStyle = bg; ctx.fillRect(c.x-w/2,y-h,w,h);
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; ctx.strokeRect(c.x-w/2,y-h,w,h);
  ctx.fillStyle = fg; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt,c.x,y-h/2+.5);
  return { x:c.x, y:y-h/2, w, h };
}
function progPill(gx,gy,span,label,frac,step) {
  const c = iso(gx+span/2,gy+span/2,0), y = c.y-(span*TH/2)*Z()-5;
  ctx.font = '700 9px Inter,system-ui,sans-serif';
  const w = Math.max(80, ctx.measureText(label).width+16), h = 24;
  const x = c.x-w/2, ty = y-h;
  ctx.fillStyle = 'rgba(10,14,12,.92)'; ctx.fillRect(x,ty,w,h);
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x,ty,w,h);
  ctx.fillStyle = '#DCE3D6'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(label, c.x, ty+8);
  if (step) { ctx.font='700 8px Inter,system-ui,sans-serif'; ctx.fillStyle=C.sky;
    ctx.textAlign='right'; ctx.fillText(step, x+w-4, ty+8); ctx.textAlign='center'; }
  const bx = x+4, by = ty+15, bw = w-8, bh = 5;
  ctx.fillStyle = '#050806'; ctx.fillRect(bx,by,bw,bh);
  ctx.fillStyle = C.sky; ctx.fillRect(bx,by,bw*Math.max(0,Math.min(1,frac)),bh);
  return { x:c.x, y:ty+h/2, w, h };
}
function lockMark(gx,gy,span,col,lv,sym) {
  const c = iso(gx+span/2,gy+span/2,0), y = c.y-(span*TH/2)*Z()-6, r = 9;
  ctx.beginPath(); ctx.arc(c.x,y-r,r,0,7);
  ctx.fillStyle = 'rgba(14,18,16,.92)'; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign='center'; ctx.textBaseline='middle';
  if (lv) { ctx.font='700 8px Inter,system-ui,sans-serif'; ctx.fillText(lv, c.x, y-r+.5); }
  else if (sym) { ctx.font='800 11px Inter,system-ui,sans-serif'; ctx.fillText(sym, c.x, y-r+.5); }
  else { ctx.lineWidth=1.5; ctx.strokeRect(c.x-3, y-r-0.4, 6, 5.4);
    ctx.beginPath(); ctx.arc(c.x, y-r-0.4, 2.2, Math.PI, 0); ctx.stroke(); }
}
function ring(gx,gy,span) {
  const c = iso(gx+span/2,gy+span/2,0), r = (.62+.06*Math.sin(pulse/16))*span*TW*Z()*.5;
  ctx.save(); ctx.translate(c.x,c.y); ctx.scale(1,.5); ctx.beginPath(); ctx.arc(0,0,r,0,7);
  ctx.strokeStyle = C.amber; ctx.lineWidth = 3*Z(); ctx.globalAlpha = .5+.25*Math.sin(pulse/16);
  ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
}

/* ─── zóny a dekorace ─── */
const PARCEL_TILES = new Set();
PIDS.forEach(id => { const p = PARC[id], sp = spanOf(id);
  for (let y=p.gy-1;y<=p.gy+sp;y++) for (let x=p.gx-1;x<=p.gx+sp;x++) PARCEL_TILES.add(x+','+y); });
const stationZone = (x,y) => Object.values(NODE_DEF).some(d =>
  x>=d.gx-1 && x<=d.gx+2 && y>=d.gy-1 && y<=d.gy+2);
const inZone = (x,y) => stationZone(x,y) && !PARCEL_TILES.has(x+','+y);

const DECO = [];
for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++) {
  const c = MAP0[y][x], r = rnd(x,y);
  if (c==='R' || inZone(x,y) || PARCEL_TILES.has(x+','+y)) continue;
  if (c==='f') DECO.push({x,y,t:'tree',v:r});
  else if (c==='S') DECO.push({x,y,t:'rock',v:r});
  else if (c==='m') DECO.push({x,y,t:'wheat',v:r});
  else if (c==='h') DECO.push({x,y,t:'clay',v:r});
  else if (r>.9) DECO.push({x,y,t:r>.95?'bush':'stump',v:r});
}
let tufts = [];
for (let i=0;i<40;i++) tufts.push({
  x:PARC.p1.gx+.15+Math.random()*1.7, y:PARC.p1.gy+.15+Math.random()*1.7,
  h:9+Math.random()*10, w:3+Math.random()*3,
  c:Math.random()<.35?'#9DAC55':'#87994B', alive:true });
const mowLeftN = () => tufts.filter(t=>t.alive).length;

const inSel = (x,y,id) => { const p = PARC[id], sp = spanOf(id);
  return x>=p.gx-1 && x<p.gx+sp+1 && y>=p.gy-1 && y<p.gy+sp+1; };

function drawBuilding(k) {
  const D = defOf(k), st = S.plot[k], p = PARC[k], sp = spanOf(k);
  if (isPlant(k)) {
    if (st.phase < 1) { emptyPlot(p.gx,p.gy,sp); return; }
    powerPlant(p.gx,p.gy,st.phase,sp); return;
  }
  if (!isOwned(k) || !D || st.phase < 1) {
    emptyPlot(p.gx,p.gy,sp);
    const prev = (MODE.v==='detail' && MODE.id===k && isOwned(k) && !D && pickSel[k])
      ? BUILDINGS[pickSel[k]] : null;
    if (prev) { ctx.save(); ctx.globalAlpha = .5+.13*Math.sin(pulse/20);
      const vs = prev.vars[pickVar[k]||0].style;
      drawByKind(prev, p.gx, p.gy, prev.ph.length, 1, vs, sp);
      ctx.restore(); }
    return;
  }
  drawByKind(D, p.gx, p.gy, st.phase, st.hl, styleOf(k), sp);
}
function yard(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.5, x = gx+.25, y = gy+.25;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+3,C.asphalt);
    for (let i=0;i<3;i++) box(x+.15,y+w*.62+i*.2,w-.3,.1,EL+3,EL+4,sh(C.asphalt,1.3)); }
  if (ph>=2) { for (let i=0;i<3;i++) box(x+.2+i*.42,y+.2,.34,w*.42,EL+3,EL+11+i*4,
      [C.log,C.stone,C.wheat][i]); }
  if (ph>=3) { box(x+w*.5,y+w*.5,w*.44,w*.4,EL+3,EL+26,st.wall);
    if (st.roofT==='gable') gableR(x+w*.46,y+w*.46,w*.52,w*.48,EL+26,EL+36,st.roof);
    else pyr(x+w*.46,y+w*.46,w*.52,w*.48,EL+26,EL+36,st.roof);
    poly([iso(x+w*.5,y+w*.9,EL+20),iso(x+w*.66,y+w*.9,EL+20),
          iso(x+w*.66,y+w*.9,EL+5),iso(x+w*.5,y+w*.9,EL+5)], sh(st.wall,.34));
    if (st.chim) box(x+w*.82,y+w*.56,.16,.16,EL+30,EL+44,C.brick); }
  if (ph>=4) { box(x+w*.06,y+w*.86,w*.36,.16,EL+3,EL+8,C.steel);
    box(x+w*.06,y+w*.84,.12,.12,EL+8,EL+26,C.steel);
    box(x+w*.02,y+w*.8,.5,.1,EL+26,EL+28,C.steel);
    for (let i=0;i<=3;i++) { const t=i/3;
      box(x-.06+t*w,y-.06,.1,.1,EL+3,EL+13,C.woodD);
      box(x-.06,y-.06+t*w,.1,.1,EL+3,EL+13,C.woodD); }
    if (hl>=2) { box(x+w*.06,y+w*.16,.5,.44,EL+3,EL+22,sh(st.wall,.95));
      gableR(x+w*.02,y+w*.12,.6,.54,EL+22,EL+30,st.roof); }
    if (hl>=3) { box(x+w*.62,y+w*.06,.44,.36,EL+3,EL+30,C.concrete);
      pyr(x+w*.6,y+w*.04,.5,.42,EL+30,EL+38,C.slate); } }
}
function drawByKind(D, gx, gy, ph, hl, st, sp) {
  if (D.office) yard(gx,gy,ph,hl,st,sp);
  else if (D.store) warehouse(gx,gy,ph,st,S.skladLvl);
  else if (D.park) parkB(gx,gy,ph,hl,st,sp);
  else if (D.name === 'Obchodní centrum') mall(gx,gy,ph,hl,st,sp);
  else if (D.name === 'Vila') villa(gx,gy,ph,hl,st,sp);
  else if (D.name === 'Činžák') apartment(gx,gy,ph,hl,st,sp);
  else house(gx,gy,ph,st,D.big,hl,sp);
}

function drawWorld(only) {
  if (!only) {
    PLATFORMS.forEach(pl => {
      if (!platOpen(pl.id)) return;
      const m = MAPS[pl.id];
      for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++) {
        const gx=x+pl.ox, gy=y+pl.oy;
        if (inZone(gx,gy)) continue;
        tile(gx,gy,TCOL[m[y][x]]||C.grass);
      }
    });
  } else {
    const p = PARC[only], pl = PLATFORMS[p.plat], m = MAPS[p.plat];
    for (let y=-1;y<=PSZ;y++) for (let x=-1;x<=PSZ;x++) {
      const gx=x+pl.ox, gy=y+pl.oy;
      if (!inSel(gx,gy,only)) continue;
      const row = m[y], ch = (row && row[x]) || (p.plat===0?'.':'D');
      tile(gx,gy,TCOL[ch]||C.grass);
    }
  }
  const objs = [];
  if (!only) {
    DECO.forEach(d => objs.push({ z:d.x+d.y, f:()=>DRAW[d.t](d.x,d.y,d.v) }));
    Object.keys(NODE_DEF).forEach(id => { const d = nodeDef(id);
      if (d.plat && !platOpen(d.plat)) return;
      objs.push({ z:d.gx+d.gy+1.4, f:()=>station(id) }); });
  }
  if (!only || only === 'p1')
    tufts.forEach(t => { if (t.alive) objs.push({ z:t.x+t.y+.3, f:()=>{
      const p = iso(t.x,t.y,EL); ctx.fillStyle = t.c;
      ctx.fillRect(p.x-t.w/2*Z(), p.y-t.h*Z(), t.w*Z(), t.h*Z()); }}); });
  PIDS.forEach(k => { if (only && only !== k) return;
    if (!visible(k)) return;
    const p = PARC[k], sp = spanOf(k);
    objs.push({ z:p.gx+p.gy+sp*.75, f:()=>drawBuilding(k) }); });
  objs.sort((a,b)=>a.z-b.z).forEach(o=>o.f());
}

function draw() {
  pulse++;
  ctx.clearRect(0,0,W,H);
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#1B231C'); g.addColorStop(1,'#0C100D');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  upHit = {}; platHit = {};

  if (MODE.v === 'map') {
    PLATFORMS.forEach(pl => {
      if (platOpen(pl.id)) return;
      const m = MAPS[pl.id];
      ctx.save(); ctx.globalAlpha=.12;
      for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++)
        tile(x+pl.ox,y+pl.oy, m[y][x]==='R'?C.road:C.grass);
      ctx.restore();
      platHit[pl.id] = pill(pl.ox+5, pl.oy+5, 2,
        ZU>.9 ? `${pl.name.toUpperCase()} · LVL ${pl.reqLvl}` : `LVL ${pl.reqLvl}`,
        'rgba(14,18,16,.9)', '#9FAC96', 9, 5);
    });
    drawWorld(null);
    const q = quest(); if (q.target) ring(q.target[0], q.target[1], q.target[2]||2);
    const big = ZU > 1.2;

    Object.keys(NODE_DEF).forEach(id => {
      const d = nodeDef(id), n = S.nodes[id];
      if (d.plat && !platOpen(d.plat)) return;
      if (n.uEnd) {
        const u = nextStUp(id);
        progPill(d.gx,d.gy,2, u.ph[n.ph].n, 1-(n.uEnd-Date.now())/(n.uDur||u.dur), (n.ph+1)+'/3');
      } else if (n.buf > 0) {
        pill(d.gx,d.gy,2, `+${n.buf}`, n.buf>=nodeCap(id)?C.red:C.amber, '#1B1305', 13, 6);
      } else if (big) {
        pill(d.gx,d.gy,2, nodeName(id)+(n.on?' ●':''), 'rgba(14,18,16,.88)', n.on?C.green:'#B9C4AE', 9, 5);
      } else if (n.on) pill(d.gx,d.gy,2,'●','rgba(14,18,16,.88)',C.green,8,5);
      if (canUpgradeNode(id) && !n.uEnd)
        upHit[id] = pill(d.gx,d.gy,2, '↑ '+nextStUp(id).name, 'rgba(14,18,16,.94)', C.amber, 9,
          (n.buf>0||big)?26:19);
    });

    PIDS.forEach(k => {
      if (!visible(k)) return;
      const p = PARC[k], st = S.plot[k], D = defOf(k), sp = spanOf(k);
      const isTarget = q.target && q.target[0]===p.gx && q.target[1]===p.gy;
      if (!isOwned(k)) {
        const lvOk = !p.reqLvl || S.lvl >= p.reqLvl, avail = lvOk && canBuy(k);
        if (!big && !isTarget) lockMark(p.gx,p.gy,sp, avail&&S.money>=p.cost?C.amber:'#7C8578', !lvOk?p.reqLvl:0);
        else pill(p.gx,p.gy,sp, !lvOk?`LVL ${p.reqLvl}`:!canBuy(k)?'zamčeno':fmt(p.cost),
          avail&&S.money>=p.cost?C.amber:'rgba(14,18,16,.88)',
          avail&&S.money>=p.cost?'#1B1305':'#9FAC96', 9, 5);
      } else if (st.bEnd) {
        const def = isPlant(k) ? PLANT : D;
        progPill(p.gx,p.gy,sp, def.ph[st.phase].n,
          1-(st.bEnd-Date.now())/(st.bDur||def.dur), (st.phase+1)+'/'+def.ph.length);
      } else if (st.uEnd) {
        progPill(p.gx,p.gy,sp, 'Vylepšení', 1-(st.uEnd-Date.now())/(st.uDur||1));
      } else if (isPlant(k)) {
        if (!st.done) { if (big||isTarget) pill(p.gx,p.gy,sp,'Elektrárna',C.amber,'#1B1305',9,5);
          else lockMark(p.gx,p.gy,sp,C.amber,0,'+'); }
        else if (big) pill(p.gx,p.gy,sp, `${powerUse()}/${powerMax()} MW`,
          'rgba(14,18,16,.88)', gridLive()?C.amber:C.red, 9, 5);
      } else if (!D) {
        if (big||isTarget) pill(p.gx,p.gy,sp,'vyber stavbu',C.amber,'#1B1305',9,5);
        else lockMark(p.gx,p.gy,sp,C.amber,0,'+');
      } else if (st.done && D.rent && st.rent>=1) {
        pill(p.gx,p.gy,sp, fmt(st.rent), C.green, '#132009', 10, 5);
      }
    });
  } else drawWorld(MODE.id);

  floats = floats.filter(f=>f.life>0);
  floats.forEach(f => { f.life-=.013; f.y-=.8;
    ctx.globalAlpha = Math.max(0,Math.min(1,f.life));
    ctx.font = '800 13px "Bricolage Grotesque",system-ui,sans-serif';
    ctx.fillStyle = f.c; ctx.textAlign = 'center';
    ctx.fillText(f.t,f.x,f.y); ctx.globalAlpha = 1; });
  requestAnimationFrame(draw);
}
