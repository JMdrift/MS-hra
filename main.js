/* ═══════════ herní logika ═══════════ */
const has = n => Object.entries(n).every(([k,v]) => S.res[k] >= v);
const pay = n => Object.entries(n).forEach(([k,v]) => S.res[k] -= v);
const nUp = l => Object.keys(NODE_DEF).filter(id => S.nodes[id].lvl >= l
  && nodeDef(id).kind !== 'coal').length;

function canBuy(id) {
  const p = PARC[id];
  if (isOwned(id) || !visible(id)) return false;
  if (p.reqLvl && S.lvl < p.reqLvl) return false;
  if (p.after && !S.plot[p.after].done) return false;
  return true;
}
function buyParcel(id) {
  const p = PARC[id];
  if (!canBuy(id)) { toast('Zatím nedostupné'); return; }
  if (S.money < p.cost) { toast('Chybí '+fmt(p.cost-S.money)); return; }
  S.money -= p.cost; S.owned[id] = true; addXP(20);
  renderTop(); toast(p.name+' je tvoje'); renderDetail(); save();
}
function addXP(n) {
  S.xp += n;
  while (S.lvl < MAXLVL && S.xp >= LVL[S.lvl]) { S.lvl++; onLevel(S.lvl); }
  renderTop(); renderQuest();
}
function questReward() { return Math.round(120 + S.lvl*S.lvl*2.5); }
function onLevel(l) {
  PLATFORMS.forEach(pl => { if (pl.id && l >= pl.reqLvl && !platOpen(pl.id)) openPlatform(pl.id); });
  const un = UNLOCKS.filter(u => u.lv === l);
  if (un.length) showEvent({ once:'lvl'+l, kick:'Nová úroveň', tone:'am', title:'LVL '+l,
    desc: un.length>1?'Odemklo se několik věcí.':'Něco nového se odemklo.',
    lines: un.map(u=>[u.t,u.d]), flash:`LVL ${l} — něco se odemklo` });
  else toast('LVL '+l);
  renderRes(); save();
}

/* ─── sběr ─── */
function collect(id) {
  const n = S.nodes[id], d = nodeDef(id);
  const room = cap() - S.res[d.res], take = Math.min(room, n.buf);
  if (take <= 0) { toast('Sklad je plný — '+RL(d.res).l.toLowerCase()); return; }
  S.res[d.res] += take; n.buf -= take;
  if (n.auto && n.buf < nodeCap(id)) { n.auto = false; n.on = true; n.tAcc = 0; }
  let g = take*XPC;
  if (!S.first[d.res]) { S.first[d.res] = 1; g += XPFIRST; }
  const c = iso(d.gx+1, d.gy+1, 55);
  floats.push({ x:c.x, y:c.y, t:`+${take} · +${g} XP`, life:1.1, c:C.green });
  addXP(g); renderRes(); save();
}
function collectRent() {
  let t = 0;
  PIDS.forEach(id => { const D = defOf(id), st = S.plot[id];
    if (!D || !st.done || !D.rent) return;
    const a = Math.floor(st.rent); if (a < 1) return; st.rent -= a; t += a; });
  if (t > 0) { S.money += t; renderTop(); save(); }
  return t;
}
const rentReady = () => { let t=0; PIDS.forEach(id => { const D=defOf(id), st=S.plot[id];
  if (D && st.done && D.rent) t += Math.floor(st.rent); }); return t; };

/* ─── stavba ─── */
function startPhase(id) {
  const st = S.plot[id];
  if (st.bEnd || st.done) return;
  const plant = isPlant(id), D = plant ? PLANT : defOf(id);
  if (!D) return;
  if (D.needPower && st.phase === 0 && powerFree() < D.draw[0]) {
    toast(`Chybí ${D.draw[0]-powerFree()} MW — posil elektrárnu`); return; }
  if (plant && st.phase === 0) {
    if (S.money < PLANT.cost) { toast('Chybí '+fmt(PLANT.cost-S.money)); return; }
  }
  const need = plant ? D.ph[st.phase].need : phaseNeed(id, st.phase);
  if (!has(need)) { toast('Chybí: '+missTxt(need)); return; }
  if (plant && st.phase === 0) S.money -= PLANT.cost;
  pay(need); st.bEnd = Date.now()+D.dur; st.bDur = D.dur;
  renderTop(); renderRes(); renderDetail(); save();
}
function finishPhase(id) {
  const st = S.plot[id];
  const plant = isPlant(id), D = plant ? PLANT : defOf(id);
  if (!D || st.done) { st.bEnd = 0; return; }
  const p = D.ph[st.phase];
  st.bEnd = 0; st.phase++; addXP(p.xp);
  const c = iso(PARC[id].gx+1, PARC[id].gy+1, 55);
  floats.push({ x:c.x, y:c.y, t:`+${p.xp} XP`, life:1.3, c:C.amber });
  if (st.phase >= D.ph.length) {
    st.done = true;
    if (plant) {
      showEvent({ once:'plant', kick:'Síť je pod proudem', tone:'sk', title:'Elektrárna běží',
        desc:`Dává ${powerMax()} MW. Každá budova na proud si z toho ukrojí svůj díl.`,
        lines:[['Palivo',`1 uhlí za ${(burnRate()/1000)|0} s — bez uhlí síť zhasne`],
               ['Turbíny','Přidáním turbíny zvýšíš výkon, ale chce to chladicí věž'],
               ['Činžák','20 MW za kus, takže dva se do 50 MW vejdou']] });
    } else {
      if (D.money) S.money += D.money;
      if (D.store) { S.skladLvl = 1;
        showEvent({ once:'sklad', flash:'Sklad je hotový', kick:'Nová možnost', tone:'ok',
          title:'Sklad stojí', desc:'Od teď máš kam ukládat.',
          lines:[['Kapacita',`${SKLAD_UP[1].cap} ks od každé suroviny místo 20`],
                 ['Obchod','V záložce Obchod suroviny prodáš i dokoupíš'],
                 ['Stanice','Můžeš vylepšit všechny čtyři těžební stanice']] });
      } else {
        showEvent({ flash:D.name+' je hotový', kick:'Hotovo', tone:'ok', title:D.name+' stojí',
          desc:'Stavba je dokončená.',
          lines:[ D.money?['Odměna',fmt(D.money)]:null,
                  D.needPower?['Odběr',`${D.draw[0]} MW · volných zbývá ${powerFree()} MW`]:null,
                  D.rent?['Nájem',`${fmt(D.rent)}/min do stropu ${fmt(D.rentCap)}`]:null,
                  D.park?['Efekt',`Vilám na předměstí zvedne nájem o ${Math.round(D.boost[0]*100)} %`]:null
                ].filter(Boolean) });
      }
    }
    renderTop(); renderRes();
  } else toast(p.n+' hotová');
  renderRes(); renderDetail(); save();
}
function speedUp(id) {
  const st = S.plot[id];
  const end = st.bEnd || st.uEnd; if (!end) return;
  const c = speedCost(end);
  if (S.money < c) { toast('Chybí '+fmt(c-S.money)); return; }
  S.money -= c;
  if (st.bEnd) st.bEnd = Date.now(); else st.uEnd = Date.now();
  toast('Urychleno'); renderTop(); save();
}
function startHouseUp(id) {
  const st = S.plot[id], up = nextHouseUp(id), D = defOf(id);
  if (!D || !up || st.uEnd) return;
  if (S.lvl < up.reqLvl) { toast('Potřebuješ LVL '+up.reqLvl); return; }
  if (D.draw && D.draw[st.hl]) { const extra = D.draw[st.hl]-D.draw[st.hl-1];
    if (powerFree() < extra) { toast(`Chybí ${extra-powerFree()} MW — posil elektrárnu`); return; } }
  if (S.money < up.cost) { toast('Chybí '+fmt(up.cost-S.money)); return; }
  if (!has(up.need)) { toast('Chybí: '+missTxt(up.need)); return; }
  S.money -= up.cost; pay(up.need); st.uEnd = Date.now()+up.dur; st.uDur = up.dur;
  renderTop(); renderRes(); renderDetail(); save();
}
function finishHouseUp(id) {
  const st = S.plot[id], D = defOf(id), up = D.up[st.hl-1];
  st.uEnd = 0; st.hl++; addXP(up.xp);
  const lines = D.office ? [['Zakázky',`${orderSlots()} najednou`]]
    : D.park ? [['Efekt',`Nájem vilám +${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} %`]]
    : [['Nájem',`${fmt(houseRent(id))}/min`]];
  showEvent({ kick:'Vylepšeno', tone:'ok', title:`${D.name} LVL ${st.hl}`, desc:up.label, lines });
  renderDetail(); save();
}
function startSkladUp() {
  const nx = SKLAD_UP[S.skladLvl+1];
  const id = PIDS.find(x => { const D = defOf(x); return D && D.store && S.plot[x].done; });
  if (!nx || !id) return;
  const st = S.plot[id];
  if (st.uEnd) return;
  if (S.lvl < nx.reqLvl) { toast('Potřebuješ LVL '+nx.reqLvl); return; }
  if (S.money < nx.cost) { toast('Chybí '+fmt(nx.cost-S.money)); return; }
  if (!has(nx.need)) { toast('Chybí: '+missTxt(nx.need)); return; }
  S.money -= nx.cost; pay(nx.need); st.uEnd = Date.now()+16000; st.uDur = 16000; st.upKind = 'sklad';
  renderTop(); renderRes(); renderDetail(); save();
}
function finishSkladUp(id) {
  const st = S.plot[id], nx = SKLAD_UP[S.skladLvl+1];
  st.uEnd = 0; st.upKind = null; S.skladLvl++; addXP(nx.xp||0);
  showEvent({ kick:'Vylepšeno', tone:'ok', title:'Sklad LVL '+S.skladLvl,
    desc:'Sklad se zvětšil i navenek.', lines:[['Kapacita',`${cap()} ks od každé suroviny`]] });
  renderRes(); renderDetail(); save();
}
/* elektrárna */
function startPlantUp(kind) {
  const st = S.plot.e1;
  if (!st.done || st.uEnd) return;
  const u = kind==='turb' ? nextTurbine() : nextCooling();
  if (!u) return;
  if (kind==='turb' && !turbineAllowed()) { toast('Nejdřív postav chladicí věž'); return; }
  if (S.lvl < u.reqLvl) { toast('Potřebuješ LVL '+u.reqLvl); return; }
  if (S.money < u.cost) { toast('Chybí '+fmt(u.cost-S.money)); return; }
  if (!has(u.need)) { toast('Chybí: '+missTxt(u.need)); return; }
  S.money -= u.cost; pay(u.need);
  st.uEnd = Date.now()+u.dur; st.uDur = u.dur; st.upKind = kind;
  renderTop(); renderRes(); renderDetail(); save();
}
function finishPlantUp() {
  const st = S.plot.e1, kind = st.upKind;
  st.uEnd = 0; st.upKind = null;
  if (kind === 'turb') { const u = nextTurbine(); S.plant.turb++; addXP(u.xp);
    showEvent({ kick:'Vylepšeno', tone:'sk', title:`Elektrárna ${powerMax()} MW`,
      desc:'Turbína je osazená.',
      lines:[['Výkon',`${powerMax()} MW · volných ${powerFree()} MW`],
             ['Palivo',`1 uhlí za ${(burnRate()/1000)|0} s`]] }); }
  else { const u = nextCooling(); S.plant.cool++; addXP(u.xp);
    showEvent({ kick:'Vylepšeno', tone:'sk', title:`Chladicí věž ${S.plant.cool}`,
      desc:'Teď uchladíš víc turbín.',
      lines:[['Kapacita chlazení',`${S.plant.cool*2} turbín`]] }); }
  renderTop(); renderRes(); renderDetail(); save();
}
/* stanice */
function startNodePhase(id) {
  const n = S.nodes[id], u = nextStUp(id);
  if (!u || n.uEnd) return;
  const cur = u.ph[n.ph];
  if (n.ph === 0 && S.money < u.cost) { toast('Chybí '+fmt(u.cost-S.money)); return; }
  if (!has(cur.need)) { toast('Chybí: '+missTxt(cur.need)); return; }
  if (n.ph === 0) S.money -= u.cost;
  pay(cur.need); n.uEnd = Date.now()+u.dur; n.uDur = u.dur;
  renderTop(); renderRes(); upgradeSheet(id); save();
}
function finishNodePhase(id) {
  const n = S.nodes[id], u = nextStUp(id), cur = u.ph[n.ph];
  n.uEnd = 0; n.ph++; addXP(cur.xp);
  if (n.ph >= u.ph.length) {
    n.ph = 0; n.lvl++; addXP(u.done); cls();
    const newOut = u.makes.filter(m => !(m in n.make));
    newOut.forEach(m => { n.make[m] = 0; n.mEnd[m] = 0; });
    if (newOut.length) {
      showEvent({ kick:'Nová výroba', tone:'sk', title:u.name,
        desc:`Stanice teď kromě těžby vyrábí ${newOut.map(m=>RL(m).l.toLowerCase()).join(' a ')}.`,
        lines:[['Fronta',`až ${u.queue} kusů najednou`],
               ['Rychlost',`1 kus za ${(makeDur(id)/1000).toFixed(1)} s`],
               ['Kde','Záložka Výroba dole v menu — jde zapnout automat']] });
    } else {
      showEvent({ kick:'Vylepšeno', tone:'ok', title:u.name, desc:'Stanice je na vyšší úrovni.',
        lines:[['Kapacita',`${u.cap} ks`],['Rychlost',`${(nodeTick(id)/1000).toFixed(2)} s na kus`]] });
    }
  } else { toast(cur.n+' hotová · těžba zrychlena'); upgradeSheet(id); }
  renderTop(); renderRes(); save();
}
/* zakázky */
function takeOrder(i) {
  const o = S.orders[i];
  if (!o) return;
  if (S.active.length >= orderSlots()) { toast('Víc zakázek najednou nezvládneš'); return; }
  if (!has(o.need)) { toast('Chybí: '+missTxt(o.need)); return; }
  pay(o.need);
  S.active.push(Object.assign({}, o, { end: Date.now()+o.dur }));
  S.orders.splice(i,1); refreshOrders(true);
  toast('Zakázka přijata — materiál odvezen'); renderRes(); save();
}
function claimOrder(i) {
  const a = S.active[i];
  if (!a || Date.now() < a.end) return;
  S.money += a.pay; addXP(a.xp); S.seen.order1 = 1;
  S.active.splice(i,1);
  toast(`Zakázka splněna · +${fmt(a.pay)}`);
  showEvent({ kick:'Zakázka splněna', tone:'ok', title:a.client,
    desc:'Odběratel zaplatil.', lines:[['Odměna',fmt(a.pay)],['Zkušenosti',fmtN(a.xp)+' XP']] });
  renderTop(); save();
}
function speedOrder(i) {
  const a = S.active[i]; if (!a) return;
  const c = speedCost(a.end);
  if (S.money < c) { toast('Chybí '+fmt(c-S.money)); return; }
  S.money -= c; a.end = Date.now(); toast('Urychleno'); renderTop(); save();
}

/* výroba */
function enqueue(id, out, amt) {
  const n = S.nodes[id], d = nodeDef(id), qmax = nodeQueueMax(id);
  const used = Object.values(n.make).reduce((a,b)=>a+b,0);
  const room = qmax - used, can = Math.floor(S.res[d.res]/2);
  const q = Math.min(amt, room, can);
  if (q < 1) { toast(room<1?'Fronta je plná':'Málo surovin'); return 0; }
  S.res[d.res] -= q*2;
  if (!(n.make[out]||0)) n.mEnd[out] = Date.now()+makeDur(id);
  n.make[out] = (n.make[out]||0) + q;
  renderRes(); save(); return q;
}

/* ═══════════ vstup ═══════════ */
const stage = $('stage');
const pts = new Map();
let pinchD=0, pinchZ=1, moved=0, downT=0, lastP=null, mowing=false;
const rel = e => { const r = cv.getBoundingClientRect(); return { x:e.clientX-r.left, y:e.clientY-r.top }; };
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('#detail')||e.target.closest('.fab')||e.target.closest('#zoomwrap')) return;
  pts.set(e.pointerId, rel(e)); moved=0; downT=Date.now(); lastP=rel(e);
  mowing = (MODE.v==='detail' && MODE.id==='p1' && !S.mowDone);
  if (pts.size===2) { const a=[...pts.values()];
    pinchD = Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); pinchZ = ZU; }
});
stage.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return;
  const p = rel(e);
  if (pts.size===2) { pts.set(e.pointerId,p); const a=[...pts.values()];
    const d = Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    if (pinchD>4) setZoom(pinchZ*(d/pinchD),(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);
    moved = 99; return; }
  const dx=p.x-lastP.x, dy=p.y-lastP.y; moved += Math.abs(dx)+Math.abs(dy);
  if (mowing) mow(p); else { panX+=dx; panY+=dy; clampPan(); }
  lastP=p; pts.set(e.pointerId,p);
});
function up(e) { if (!pts.has(e.pointerId)) return;
  const p = pts.get(e.pointerId); pts.delete(e.pointerId);
  if (pts.size===0 && moved<10 && Date.now()-downT<450 && !mowing) tap(p);
  mowing = false; }
stage.addEventListener('pointerup', up);
stage.addEventListener('pointercancel', up);
$('zin').onclick = () => setZoom(ZU*1.35, W/2, H/2);
$('zout').onclick = () => setZoom(ZU/1.35, W/2, H/2);
$('collectAll').onclick = () => {
  Object.keys(NODE_DEF).forEach(id => { if (S.nodes[id].buf > 0) collect(id); });
  const r = collectRent(); if (r > 0) toast('Nájem +'+fmt(r));
};
const hitBox = (gx,gy,span,p) => { const c = iso(gx+span/2,gy+span/2,0), s = Z();
  return Math.abs(p.x-c.x)/(span*TW*s*.5) + Math.abs(p.y-c.y)/(span*TH*s*.5) < 1.05; };
const nearPill = (b,p) => b && Math.abs(p.x-b.x) < b.w/2+6 && Math.abs(p.y-b.y) < b.h/2+8;
function tap(p) {
  if (MODE.v !== 'map') return;
  for (const id in upHit) if (nearPill(upHit[id],p)) { upgradeSheet(id); return; }
  for (const i in platHit) if (nearPill(platHit[i],p)) { platformSheet(+i); return; }
  for (const id in NODE_DEF) {
    const d = nodeDef(id);
    if (d.plat && !platOpen(d.plat)) continue;
    if (hitBox(d.gx,d.gy,2,p)) {
      const n = S.nodes[id];
      if (n.uEnd) { upgradeSheet(id); return; }
      if (n.buf > 0) { collect(id); return; }
      if (d.kind === 'coal' && n.lvl < 1) {
        if (canUpgradeNode(id)) upgradeSheet(id);
        else toast('Sloj se musí nejdřív otevřít — potřebuješ LVL '+stChain(id)[0].reqLvl);
        return; }
      n.on = !n.on; n.tAcc = 0;
      toast(n.on ? nodeName(id)+' těží' : 'Těžba zastavena'); save(); return;
    }
  }
  for (const id of PIDS) { if (!visible(id)) continue;
    if (hitBox(PARC[id].gx,PARC[id].gy,spanOf(id),p)) { openParcel(id); return; } }
}
function mow(p) {
  let h = 0;
  tufts.forEach(t => { if (!t.alive) return;
    const c = iso(t.x,t.y,EL);
    if (Math.hypot(c.x-p.x,(c.y-t.h*Z()/2)-p.y) < 30*Z()) { t.alive=false; h++; } });
  if (h) { renderDetail();
    if (!mowLeftN()) { S.mowDone = true; addXP(XPMOW);
      toast('+25 XP · parcela je vyčištěná'); renderDetail(); save(); } }
}

/* ═══════════ smyčka ═══════════ */
let burnAcc = 0, outageWarned = false;
setInterval(() => {
  const now = Date.now();
  Object.keys(NODE_DEF).forEach(id => {
    const n = S.nodes[id], d = nodeDef(id);
    if (n.on) { const tick = nodeTick(id); n.tAcc += 160;
      while (n.tAcc >= tick) { n.tAcc -= tick;
        if (n.buf < nodeCap(id)) n.buf++;
        if (n.buf >= nodeCap(id)) { n.on = false; n.auto = true;
          toast(nodeName(id)+' je plná — sesbírej suroviny'); break; } } }
    const dur = makeDur(id);
    nodeMakes(id).forEach(out => {
      if ((n.make[out]||0) > 0 && now >= (n.mEnd[out]||0)) {
        if (S.res[out] < cap()) { S.res[out]++; n.make[out]--; renderRes();
          if (n.make[out] > 0) n.mEnd[out] = now+dur; }
        else n.mEnd[out] = now+2000;
      }
    });
    if (n.autoMake && nodeMakes(id).length) {
      const used = Object.values(n.make).reduce((a,b)=>a+b,0);
      if (used === 0) nodeMakes(id).forEach(out => enqueue(id, out, 5));
    }
    if (n.uEnd && now >= n.uEnd) finishNodePhase(id);
  });

  const br = burnRate();
  if (br > 0) {
    burnAcc += 160;
    while (burnAcc >= br) { burnAcc -= br;
      if (S.res.uhli > 0) { S.res.uhli--; renderRes(); }
      else { if (!outageWarned) { outageWarned = true;
          toast('Elektrárně došlo uhlí — budovy na proud nevydělávají'); } break; } }
    if (S.res.uhli > 0) outageWarned = false;
  }
  const live = gridLive();

  PIDS.forEach(id => {
    const st = S.plot[id], D = defOf(id);
    if (st.bEnd && now >= st.bEnd) finishPhase(id);
    else if (st.uEnd && now >= st.uEnd) {
      if (isPlant(id)) finishPlantUp();
      else if (D && D.store) finishSkladUp(id);
      else finishHouseUp(id);
    }
    if (D && st.done && D.rent) {
      if (D.needPower && !live) return;
      st.rent = Math.min(houseRentCap(id), st.rent + houseRent(id)*(160/60000));
    }
  });

  const anyBuf = Object.keys(NODE_DEF).some(id => S.nodes[id].buf > 0);
  const rr = rentReady();
  const ca = $('collectAll');
  ca.classList.toggle('on', (anyBuf||rr>0) && MODE.v === 'map');
  if (anyBuf||rr>0) ca.textContent = (rr>0 && !anyBuf) ? `VYBRAT NÁJEM ${fmtN(rr)} ${CUR}` : 'SEBRAT VŠE';
  $('hintbar').style.visibility = ((anyBuf||rr>0) && MODE.v==='map') ? 'hidden' : 'visible';
  back.textContent = deferred.length ? `← MAPA (${deferred.length})` : '← MAPA';
  document.querySelector('[data-s="vyroba"]').classList.toggle('dot',
    Object.keys(NODE_DEF).some(id => nodeMakes(id).length &&
      Object.values(S.nodes[id].make).reduce((a,b)=>a+b,0) === 0 && !S.nodes[id].autoMake));

  const bf = $('bfill');
  if (bf && MODE.v === 'detail') {
    const st = S.plot[MODE.id];
    const e = st.bEnd || st.uEnd, dur = st.bEnd ? st.bDur : st.uDur;
    if (e && dur) bf.style.width = Math.max(0,Math.min(100,(1-(e-now)/dur)*100))+'%';
    else renderDetail();
  }
  const nf = $('nfill');
  if (nf) { const on = Object.keys(NODE_DEF).find(i=>S.nodes[i].uEnd);
    if (on) { const n = S.nodes[on];
      nf.style.width = Math.max(0,Math.min(100,(1-(n.uEnd-now)/(n.uDur||1))*100))+'%'; } }
  document.querySelectorAll('.ofill').forEach(el => {
    const end = +el.dataset.end, dur = +el.dataset.dur;
    el.style.width = Math.max(0,Math.min(100,(1-(end-now)/dur)*100))+'%'; });
  const zb = document.querySelector('[data-s="zakazky"]');
  if (zb) zb.classList.toggle('dot', hasOffice() &&
    (S.active.some(a=>now>=a.end) || (S.active.length<orderSlots() && S.orders.some(o=>has(o.need)))));
  const rb = $('rent');
  if (rb && MODE.v === 'detail') { const st = S.plot[MODE.id];
    rb.textContent = 'Vybrat nájem '+fmt(st.rent); rb.disabled = st.rent < 1; }
  saveSoon();
}, 160);

setInterval(renderQuest, 900);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);
addEventListener('blur', save);

/* ═══════════ úkoly ═══════════ */
function quest() {
  const T = (p,sp) => [p.gx, p.gy, sp || spanOf(Object.keys(PARC).find(k=>PARC[k]===p))];
  const firstFree = l => Object.keys(NODE_DEF).find(id =>
    nodeDef(id).kind!=='coal' && S.nodes[id].lvl === l);
  const anyOn = Object.keys(NODE_DEF).some(id => S.nodes[id].on);
  const q = (t,d,p,target,go) => ({t,d,p,target,go});

  if (!S.mowDone) return q('Poseč trávu na parcele 1','Ťukni na parcelu a přejeď prstem',
    `${40-mowLeftN()} / 40`, T(PARC.p1), ()=>openParcel('p1'));
  if (!defOf('p1')) return q('Vyber si první chatku','Tři provedení, každé chce jiný materiál',
    '', T(PARC.p1), ()=>openParcel('p1'));
  if (!anyOn && !S.plot.p1.done) return q('Spusť těžbu na stanicích',
    'Ťukni na les, lom, louku i hliniště v rozích pozemku', '', null, ()=>scrStavby());
  if (!S.plot.p1.done) return q('Postav chatku','Suroviny sesbíráš ťuknutím na stanici',
    `${S.plot.p1.phase} / ${defOf('p1').ph.length}`, T(PARC.p1), ()=>openParcel('p1'));
  if (!isOwned('p2')) return q('Kup parcelu 2 za '+fmt(PARC.p2.cost),
    S.money>=PARC.p2.cost?'Ťukni sem a kup ji':'Prodej přebytek nebo vyber nájem',
    fmtN(S.money)+' '+CUR, T(PARC.p2), ()=>openParcel('p2'));
  if (S.lvl < 5) return q('Dostaň se na LVL 5','Sklad se odemkne na LVL 5','LVL '+S.lvl,null,()=>scrRozvoj());
  if (!S.plot.p2.done) return q('Postav sklad','Kapacita 20 → 60 ks a otevře se obchod',
    `${S.plot.p2.phase} / 5`, T(PARC.p2), ()=>openParcel('p2'));
  if (S.lvl < 6) return q('Dostaň se na LVL 6','Odemkne stavební dvůr a s ním zakázky',
    'LVL '+S.lvl, null, ()=>scrRozvoj());
  if (!isOwned('p3')) return q('Kup parcelu 3 za '+fmt(PARC.p3.cost),'Místo na stavební dvůr',
    fmtN(S.money)+' '+CUR, T(PARC.p3), ()=>openParcel('p3'));
  if (!S.plot.p3.done) return q('Postav stavební dvůr','Odemkne zakázky — hlavní zdroj peněz',
    `${S.plot.p3.phase} / 4`, T(PARC.p3), ()=>openParcel('p3'));
  if (!S.seen.order1) return q('Vyřiď první zakázku','Odevzdej materiál a počkej na peníze',
    '', T(PARC.p3), ()=>scrZakazky());
  if (nUp(1) < 4) return q('Vylepši všechny čtyři stanice','Kapacita 10 → 30 a rychlejší těžba',
    `${nUp(1)} / 4`, firstFree(0)?[nodeDef(firstFree(0)).gx,nodeDef(firstFree(0)).gy,2]:null,
    ()=>firstFree(0)?upgradeSheet(firstFree(0)):scrRozvoj());
  if (S.lvl < 15) return q('Dostaň se na LVL 15','Odemkne rodinný dům a výrobu materiálu',
    'LVL '+S.lvl, null, ()=>scrRozvoj());
  if (nUp(2) < 4) return q('Vylepši stanice na LVL 2','Teprve pak vyrobí prkna, štěrk, cihly a balíky',
    `${nUp(2)} / 4`, firstFree(1)?[nodeDef(firstFree(1)).gx,nodeDef(firstFree(1)).gy,2]:null,
    ()=>firstFree(1)?upgradeSheet(firstFree(1)):scrVyroba());
  if (!isOwned('p4')) return q('Kup parcelu 4 za '+fmt(PARC.p4.cost),'Místo na rodinný dům',
    fmtN(S.money)+' '+CUR, T(PARC.p4), ()=>openParcel('p4'));
  if (!S.plot.p4.done) return q('Postav rodinný dům','Šest fází ze základních surovin',
    `${S.plot.p4.phase} / 6`, T(PARC.p4), ()=>openParcel('p4'));
  if (S.lvl < 20) return q('Dostaň se na LVL 20','Zdarma se otevře průmyslová zóna',
    'LVL '+S.lvl, null, ()=>platformSheet(1));
  if (!S.nodes.uhli.lvl) return q('Otevři uhelný důl','Bez uhlí elektrárna nevyrábí proud',
    `${S.nodes.uhli.ph} / 3`, [NODE_DEF.uhli.gx,NODE_DEF.uhli.gy,2], ()=>upgradeSheet('uhli'));
  if (!S.plot.e1.done) return q('Postav elektrárnu','Šest fází · dá 50 MW do sítě',
    `${S.plot.e1.phase} / 6`, T(PARC.e1), ()=>openParcel('e1'));
  if (S.lvl < 24) return q('Dostaň se na LVL 24','Zdarma se otevře sídliště s činžáky',
    'LVL '+S.lvl, null, ()=>platformSheet(2));
  if (!isOwned('s1')) return q('Kup první parcelu na sídlišti','Za '+fmt(PARC.s1.cost),
    fmtN(S.money)+' '+CUR, T(PARC.s1), ()=>openParcel('s1'));
  if (!S.plot.s1.done) return q('Postav činžák',
    'Odběr 20 MW · nájem '+fmt(BUILDINGS.cinzak.rent)+'/min',
    `${S.plot.s1.phase} / 6`, T(PARC.s1), ()=>openParcel('s1'));
  if (S.lvl < 27) return q('Dostaň se na LVL 27','Zdarma se otevře předměstí s vilami',
    'LVL '+S.lvl, null, ()=>platformSheet(3));
  if (!isOwned('v1')) return q('Kup první parcelu na předměstí','Za '+fmt(PARC.v1.cost),
    fmtN(S.money)+' '+CUR, T(PARC.v1), ()=>openParcel('v1'));
  if (!S.plot.v1.done) return q('Postav vilu','Chce trámy, obklady, izolaci i dlažbu',
    `${S.plot.v1.phase} / 6`, T(PARC.v1), ()=>openParcel('v1'));
  if (!S.plot.k1.done) return q('Postav park','Zvedne nájem všem vilám na předměstí',
    `${S.plot.k1.phase} / 4`, T(PARC.k1), ()=>openParcel('k1'));
  if (S.lvl < 33) return q('Dostaň se na LVL 33','Zdarma se otevře obchodní zóna',
    'LVL '+S.lvl, null, ()=>platformSheet(4));
  if (!S.plot.o1.done) return q('Postav obchodní centrum','Největší stavba ve hře · odběr 160 MW',
    `${S.plot.o1.phase} / 6`, T(PARC.o1), ()=>openParcel('o1'));
  return q('Rozvíjej město','Kupuj parcely, stavěj a vylepšuj','LVL '+S.lvl,null,()=>scrRozvoj());
}

/* ═══════════ start ═══════════ */
new ResizeObserver(resize).observe(stage);
const away = load();
resize(); renderRes(); renderTop(); renderQuest(); draw();

const rep = catchUp(away);
if (rep) {
  const mins = Math.round(rep.ms/60000), lines = [];
  Object.entries(rep.gained).forEach(([k,v]) => lines.push(['+'+v, RL(k).l+' na stanici']));
  Object.entries(rep.made).forEach(([k,v]) => lines.push(['+'+v, RL(k).l+' z výroby']));
  if (rep.burned) lines.push(['−'+rep.burned,'uhlí spálila elektrárna']);
  if (rep.outage) lines.push(['Pozor','elektrárně došlo uhlí, budovy na proud stály']);
  if (rep.rent >= 1) lines.push([fmt(rep.rent),'nájem čeká na vybrání']);
  if (lines.length) showEvent({ kick:'Než ses vrátil', tone:'ok',
    title: mins < 60 ? `${mins} minut práce` : `${(mins/60).toFixed(1)} hodiny práce`,
    desc:'Stanice, výrobny i nájem běžely dál.', lines, ok:'Sebrat' });
  renderRes(); renderTop();
} else if (!S.mowDone) {
  setTimeout(() => showEvent({ once:'intro', kick:'Jak se to hraje', tone:'am',
    title:'Vítej na svém pozemku', desc:'Všechno se točí kolem tří kroků.',
    lines:[['1','Ťukni na těžební stanici v rohu pozemku a spusť těžbu'],
           ['2','Až se nad ní objeví oranžové číslo, ťukni znovu a sesbíráš'],
           ['3','Ťukni na parcelu a postav z toho stavbu, fázi po fázi']],
    ok:'Rozumím' }), 700);
}
