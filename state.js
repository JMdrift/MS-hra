/* ═══════════ stav hry, ukládání, doběh po zavření ═══════════ */
const SAVE_KEY = 'mojestavba_hra_v2';
const OFFLINE_MAX = 12 * 3600 * 1000;

const newPlot = () => ({ key:null, vr:0, phase:0, done:false, hl:1,
  rent:0, bEnd:0, bDur:0, uEnd:0, uDur:0, upKind:null });
const newNode = () => ({ lvl:0, ph:0, buf:0, on:false, auto:false, tAcc:0,
  uEnd:0, uDur:0, make:{}, mEnd:{}, autoMake:false });

const S = {
  ver:2, lvl:1, xp:0, money:0,
  res: ALL.reduce((o,r)=>(o[r.k]=0,o), {}),
  first:{}, seen:{}, mowDone:false, skladLvl:0,
  plats:{ 0:true }, owned:{ p1:true },
  plot:{}, nodes:{},
  plant:{ turb:1, cool:1 },
  orders:[], active:[], oSeed:0, oRefresh:0,
  t: Date.now()
};
PIDS.forEach(id => S.plot[id] = newPlot());
Object.keys(NODE_DEF).forEach(id => S.nodes[id] = newNode());

/* ─── odvozené ─── */
const cap = () => SKLAD_UP[S.skladLvl].cap;
const skladBuilt = () => S.skladLvl >= 1;
const isOwned = id => !!S.owned[id];
const platOpen = i => !!S.plats[i];
const visible = id => platOpen(PARC[id].plat);
const buildKeyOf = id => S.plot[id].key;
const defOf = id => { const k = S.plot[id].key; return k ? BUILDINGS[k] : null; };
const isPlant = id => !!PARC[id].plant;

/* varianta stavby — jiný vzhled i jiná směs materiálu */
function varOf(id) {
  const D = defOf(id); if (!D) return null;
  return D.vars[Math.min(S.plot[id].vr, D.vars.length-1)];
}
function mixNeed(need, mix) {
  if (!mix) return need;
  const out = {};
  Object.entries(need).forEach(([k,v]) => { const t = mix[k] || k; out[t] = (out[t]||0) + v; });
  return out;
}
const phaseNeed = (id, i) => { const D = defOf(id); if (!D) return {};
  return mixNeed(D.ph[i].need, (D.vars[S.plot[id].vr]||{}).mix); };
const styleOf = id => { const v = varOf(id); return v ? v.style : null; };

/* ─── stanice ─── */
const nodeDef = id => NODE_DEF[id];
const stChain = id => ST_UP[nodeDef(id).kind];
const stCur = id => { const n = S.nodes[id]; return n.lvl ? stChain(id)[n.lvl-1] : null; };
const nodeName = id => { const c = stCur(id); return c ? c.name : nodeDef(id).base; };
const nodeCap = id => { const c = stCur(id); return c ? c.cap : 10; };
const nextStUp = id => { const n = S.nodes[id], c = stChain(id); return n.lvl < c.length ? c[n.lvl] : null; };
const canUpgradeNode = id => { const u = nextStUp(id); return !!u && S.lvl >= u.reqLvl; };
const nodeMakes = id => { const c = stCur(id); return c ? c.makes : []; };
const nodeQueueMax = id => { const c = stCur(id); return c ? c.queue : 0; };
const makeDur = id => MAKE_DUR[Math.min(S.nodes[id].lvl, MAKE_DUR.length-1)] || 9000;
function nodeTick(id) {
  const d = nodeDef(id), c = stCur(id);
  return Math.round(d.base_tick * (c ? c.mul : 1) * Math.pow(0.96, S.nodes[id].ph));
}
const anyFactory = () => Object.keys(NODE_DEF).some(id => nodeMakes(id).length > 0);

/* ─── nájem a parky ─── */
function parkBoost(plat) {
  let b = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.park && p.done && PARC[id].plat === plat)
      b += D.boost[Math.min(p.hl, D.boost.length) - 1]; });
  return b;
}
function houseRent(id) {
  const D = defOf(id), p = S.plot[id];
  if (!D || !D.rent) return 0;
  let m = 1;
  if (D.up) for (let i = 1; i < p.hl; i++) if (D.up[i-1] && D.up[i-1].rentMul) m = D.up[i-1].rentMul;
  return Math.round(D.rent * m * (1 + parkBoost(PARC[id].plat)));
}
const houseRentCap = id => { const D = defOf(id); if (!D || !D.rentCap) return 0;
  return Math.round(D.rentCap * (houseRent(id) / D.rent)); };
const nextHouseUp = id => { const D = defOf(id), p = S.plot[id];
  return (D && D.up && D.up[p.hl-1]) ? D.up[p.hl-1] : null; };

/* ─── energie ─── */
const plantBuilt = () => S.plot.e1 && S.plot.e1.done;
const powerMax = () => plantBuilt() ? PLANT.turbine[S.plant.turb-1].mw : 0;
function powerUse() { let t = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.draw && p.done) t += D.draw[Math.min(p.hl, D.draw.length)-1]; });
  return t; }
const powerFree = () => powerMax() - powerUse();
const gridLive = () => powerMax() > 0 && S.res.uhli > 0;
const burnRate = () => plantBuilt() ? Math.round(PLANT.burnBase / S.plant.turb) : 0;
const drawOf = id => { const D = defOf(id), p = S.plot[id];
  return (D && D.draw) ? D.draw[Math.min(p.hl, D.draw.length)-1] : 0; };
const nextTurbine = () => PLANT.turbine[S.plant.turb] || null;
const nextCooling = () => PLANT.cooling[S.plant.cool] || null;
const turbineAllowed = () => S.plant.turb < Math.min(PLANT.turbine.length, S.plant.cool * 2);

/* ─── zakázky ─── */
const officeId = () => PIDS.find(id => { const D = defOf(id); return D && D.office && S.plot[id].done; });
const hasOffice = () => !!officeId();
const orderSlots = () => { const id = officeId(); return id ? Math.min(3, S.plot[id].hl) : 0; };
function orderPool() {
  const out = ['drevo','kamen','slama','hlina'];
  if (Object.keys(NODE_DEF).some(i=>S.nodes[i].lvl>=1 && nodeDef(i).kind==='coal')) out.push('uhli');
  Object.keys(NODE_DEF).forEach(i => nodeMakes(i).forEach(m => { if (out.indexOf(m)<0) out.push(m); }));
  return out;
}
function makeOrder(seed) {
  const pool = orderPool();
  const rnd2 = n => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return (seed >>> 16) % n; };
  const tier = ORDER_TIERS[rnd2(3)];
  const cnt = tier.id === 'fast' ? 1 : (rnd2(10) < 6 ? 1 : 2);
  const lim = Math.max(6, Math.floor(cap()*0.85));
  const need = {}; const picked = [];
  for (let i = 0; i < cnt; i++) {
    let k = pool[rnd2(pool.length)];
    if (picked.indexOf(k) >= 0) k = pool[(pool.indexOf(k)+1) % pool.length];
    picked.push(k);
    const base = tier.qty[0] + rnd2(tier.qty[1]-tier.qty[0]+1);
    let q = Math.max(4, Math.round(base / (RL(k).tier===2?3:RL(k).tier===1?1.8:1)));
    need[k] = Math.min(q, lim);
  }
  let val = 0;
  Object.entries(need).forEach(([k,q]) => val += q * RL(k).price);
  const lvlMul = 1 + S.lvl * 0.04;
  return { id:'o'+seed, tier:tier.id, name:tier.n, dur:tier.dur,
    client: ORDER_CLIENTS[rnd2(ORDER_CLIENTS.length)],
    need, pay: Math.round(val * tier.mul * lvlMul / 10) * 10,
    xp: Math.round(val * tier.xp) };
}
function refreshOrders(force) {
  if (!hasOffice()) { S.orders = []; return; }
  const now = Date.now();
  if (!force && S.orders.length >= ORDER_SLOTS && now < S.oRefresh) return;
  while (S.orders.length < ORDER_SLOTS) S.orders.push(makeOrder(++S.oSeed + S.lvl*7));
  S.oRefresh = now + ORDER_REFRESH;
}
function rerollOrder(i) { S.orders[i] = makeOrder(++S.oSeed + Date.now()%9973); }

/* ─── ukládání ─── */
let saveT = 0;
function save() { S.t = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function saveSoon() { const now = Date.now();
  if (now - saveT > 2000) { saveT = now; save(); } }
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); }
function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
  if (!raw) return 0;
  let d; try { d = JSON.parse(raw); } catch (e) { return 0; }
  if (!d || d.ver !== S.ver) return 0;
  ['lvl','xp','money','mowDone','skladLvl','t'].forEach(k => { if (d[k] !== undefined) S[k] = d[k]; });
  Object.assign(S.res, d.res||{}); Object.assign(S.first, d.first||{}); Object.assign(S.seen, d.seen||{});
  Object.assign(S.plats, d.plats||{}); Object.assign(S.owned, d.owned||{});
  Object.assign(S.plant, d.plant||{});
  if (Array.isArray(d.orders)) S.orders = d.orders;
  if (Array.isArray(d.active)) S.active = d.active;
  S.oSeed = d.oSeed||0; S.oRefresh = d.oRefresh||0;
  PIDS.forEach(id => { if (d.plot && d.plot[id]) Object.assign(S.plot[id], d.plot[id]); });
  Object.keys(NODE_DEF).forEach(id => { if (d.nodes && d.nodes[id]) Object.assign(S.nodes[id], d.nodes[id]); });
  return Math.min(OFFLINE_MAX, Math.max(0, Date.now() - (d.t || Date.now())));
}

/* ─── doběh času, když byla hra zavřená ─── */
function catchUp(ms) {
  if (ms < 5000) return null;
  const rep = { ms, gained:{}, made:{}, rent:0, burned:0, outage:false };
  const now = Date.now();

  Object.keys(NODE_DEF).forEach(id => {
    const n = S.nodes[id], d = nodeDef(id);
    if (n.on) {
      const tick = nodeTick(id);
      const add = Math.floor((n.tAcc + ms) / tick);
      n.tAcc = (n.tAcc + ms) % tick;
      const got = Math.max(0, Math.min(nodeCap(id) - n.buf, add));
      if (got > 0) { n.buf += got; rep.gained[d.res] = (rep.gained[d.res]||0) + got; }
      if (n.buf >= nodeCap(id)) { n.on = false; n.auto = true; }
    }
    const dur = makeDur(id);
    nodeMakes(id).forEach(out => {
      let q = n.make[out] || 0; if (!q) return;
      const can = Math.floor(ms / dur);
      let done = 0;
      for (let i = 0; i < Math.min(can, q); i++) {
        if (S.res[out] >= cap()) break;
        S.res[out]++; q--; done++;
      }
      n.make[out] = q;
      if (done) rep.made[out] = (rep.made[out]||0) + done;
      if (q > 0) n.mEnd[out] = now + dur;
    });
    if (n.uEnd && now >= n.uEnd) n.uEnd = 0;
  });

  rep.orders = 0;
  S.active.forEach(a => { if (now >= a.end) rep.orders++; });

  const br = burnRate();
  if (br > 0 && S.res.uhli > 0) {
    const want = Math.floor(ms / br);
    const burned = Math.min(S.res.uhli, want);
    S.res.uhli -= burned; rep.burned = burned;
    rep.outage = burned < want;
  }
  const live = powerMax() > 0 && (S.res.uhli > 0 || rep.burned > 0);

  PIDS.forEach(id => {
    const p = S.plot[id], D = defOf(id);
    if (p.bEnd && now >= p.bEnd) p.bEnd = 0;
    if (p.uEnd && now >= p.uEnd) p.uEnd = 0;
    if (!D || !p.done || !D.rent) return;
    if (D.needPower && !live) return;
    const rc = houseRentCap(id), before = p.rent;
    p.rent = Math.min(rc, p.rent + houseRent(id) * (ms/60000));
    rep.rent += p.rent - before;
  });
  return rep;
}
