/* ═══════════ UI ═══════════ */
const $ = id => document.getElementById(id);
const sheet=$('sheet'), sbody=$('sheetBody'), detail=$('detail'), dbody=$('detailBody');
const back=$('back'), hintbar=$('hintbar'), banner=$('banner'), bcard=$('bcard');

let openedAt=0, bannerAt=0;
const opn = h => { sbody.innerHTML=h; sheet.classList.add('on'); openedAt=Date.now();
  sheet.querySelector('#sheetIn').scrollTop = 0; };
const cls = () => sheet.classList.remove('on');
sheet.addEventListener('click', e => {
  if (Date.now()-openedAt < 450) return;
  if (e.target===sheet || e.target.dataset.close!==undefined) cls(); });

let tt;
function toast(t) { const el=$('toast'); el.textContent=t; el.classList.add('on');
  clearTimeout(tt); tt=setTimeout(()=>el.classList.remove('on'), 1900); }

/* ─── oznámení ─── */
let evQ=[], evOpen=false, deferred=[];
function showEvent(e) {
  if (e.once) { if (S.seen[e.once]) return; S.seen[e.once]=1; }
  if (MODE.v==='detail') { deferred.push(e); if (e.flash) toast(e.flash); return; }
  evQ.push(e); if (!evOpen) nextEvent();
}
function nextEvent() {
  if (!evQ.length) { evOpen=false; banner.classList.remove('on'); return; }
  evOpen=true; const e=evQ.shift();
  bcard.innerHTML = `<div class="bkick ${e.tone||'am'}">${e.kick}</div>
    <div class="btitle">${e.title}</div>
    ${e.desc?`<div class="bdesc">${e.desc}</div>`:''}
    ${e.lines&&e.lines.length?`<div class="blist">${e.lines.map(l=>
      `<div class="bli"><em>${l[0]}</em><span>${l[1]}</span></div>`).join('')}</div>`:''}
    <button class="btn" id="bok">${e.ok||'Pokračovat'}</button>`;
  banner.classList.add('on'); bannerAt=Date.now();
  $('bok').onclick = () => { banner.classList.remove('on'); setTimeout(nextEvent,140); };
}
banner.addEventListener('click', e => { if (Date.now()-bannerAt<450) return;
  if (e.target===banner) { banner.classList.remove('on'); setTimeout(nextEvent,140); } });
function flushDeferred() { if (!deferred.length) return;
  evQ.push(...deferred); deferred=[]; setTimeout(()=>{ if(!evOpen) nextEvent(); },260); }

/* ─── kousky ─── */
const capBar = (v,max,cl) =>
  `<div class="cap ${v>=max?'full':''}"><i style="width:${Math.min(100,v/max*100)}%;${cl?'background:'+cl:''}"></i></div>`;
const needTxt = n => Object.entries(n).map(([k,v]) =>
  `<span class="mt ${S.res[k]>=v?'':'no'}">${resIcon(k,12)}${v}× ${RL(k).l.toLowerCase()}</span>`).join('');
const missTxt = n => Object.entries(n).filter(([k,v])=>S.res[k]<v)
  .map(([k,v])=>`${v-S.res[k]}× ${RL(k).l.toLowerCase()}`).join(', ');
const stripHTML = (arr,ph) => `<div class="strip">${arr.map((x,i)=>
  `<div class="chip ${i<ph?'done':i===ph?'now':''}">${i<ph?'✓':i+1}</div>`).join('')}</div>`;
const timeLeft = t => Math.max(0,(t-Date.now())/1000).toFixed(0)+' s';
const progBar = (end,dur,id) => {
  const p = Math.max(0,Math.min(100,(1-(end-Date.now())/(dur||1))*100));
  return `<div class="pbar"><i id="${id||'bfill'}" style="width:${p}%"></i></div>`;
};
const speedCost = end => Math.max(20, Math.ceil((end-Date.now())/1000) * 25);

/* ─── HUD ─── */
function resPill(r) {
  const v = S.res[r.k], full = v >= cap();
  return `<div class="res ${full?'full':''}" title="${r.l}">
    ${icon(r.ic,r.c,14)}<div class="n">${v}</div>
    <div class="bar" style="width:${Math.min(100,v/cap()*100)}%"></div></div>`;
}
function renderRes() {
  const showMat = anyFactory(), showHigh = ALL.some(r=>r.tier===2 && S.res[r.k]>0)
    || Object.keys(NODE_DEF).some(id=>S.nodes[id].lvl>=5);
  const list = ALL.filter(r => r.tier===0 || (r.tier===1&&showMat) || (r.tier===2&&showHigh));
  $('resrow').innerHTML =
    `<div class="res capinfo"><div class="cl">max</div><div class="n">${cap()}</div></div>`
    + list.map(resPill).join('')
    + `<div class="res hintend">›</div>`;
  const pw = $('pwbox');
  if (powerMax() > 0) { pw.style.display='flex';
    pw.className = 'moneybox brk pw' + (gridLive()?'':' off');
    pw.innerHTML = `${icon('power',gridLive()?C.amber:C.red,13)}
      <b>${powerUse()}</b><span class="cur">/${powerMax()}</span>`;
    pw.onclick = () => gridSheet();
  } else pw.style.display='none';
}
function renderTop() {
  $('lvl').textContent = S.lvl;
  $('money').textContent = fmtN(S.money);
  const need = LVL[S.lvl]!==undefined?LVL[S.lvl]:LVL[MAXLVL-1], prev = LVL[S.lvl-1]||0;
  $('xpfill').style.width = (S.lvl>=MAXLVL?100:Math.max(0,(S.xp-prev)/(need-prev)*100))+'%';
  $('xptxt').textContent = S.lvl>=MAXLVL ? fmtN(S.xp) : `${fmtN(S.xp)} / ${fmtN(need)}`;
}
let lastQ = null;
function renderQuest() {
  const q = quest();
  $('qTitle').textContent = q.t; $('qDesc').textContent = q.d; $('qProg').textContent = q.p;
  if (lastQ === null) { lastQ = q.t; return; }
  if (q.t !== lastQ) {
    const rew = questReward();
    S.money += rew; renderTop(); save();
    showEvent({ flash:`Úkol splněn · +${fmt(rew)}`, kick:'Úkol splněn', tone:'ok', title:lastQ,
      desc:'Odměna připsána.',
      lines:[['Odměna',fmt(rew)],['Teď',q.t],['Jak',q.d]], ok:'Jdu na to' });
    lastQ = q.t;
  }
}
$('quest').onclick = () => { const q = quest(); if (q.go) q.go(); };

/* ─── detail parcely ─── */
let pickSel = {}, pickVar = {};
function openParcel(id) {
  MODE = { v:'detail', id }; focusOn(PARC[id], spanOf(id));
  back.classList.add('on'); detail.classList.add('on'); hintbar.style.display='none';
  renderDetail();
}
function closeParcel() {
  MODE = { v:'map' }; ZU = 1; panX = 0; panY = 0; resize();
  back.classList.remove('on'); detail.classList.remove('on'); hintbar.style.display='';
  flushDeferred();
}
back.onclick = closeParcel;
function renderDetail() { if (MODE.v!=='detail') return;
  dbody.innerHTML = parcelHTML(MODE.id); bindDetail(); }

function pickHTML(id) {
  const list = PARC[id].accept.filter(k => S.lvl >= (BUILDINGS[k].reqLvl||1));
  if (!list.length) return `<div class="st">${PARC[id].name}</div>
    <div class="ss">Stavba pro tuhle parcelu se odemkne později.</div>`;
  if (!pickSel[id] || list.indexOf(pickSel[id])<0) pickSel[id] = list[0];
  const key = pickSel[id], B = BUILDINGS[key];
  if (pickVar[id] === undefined || pickVar[id] >= B.vars.length) pickVar[id] = 0;
  const vr = pickVar[id], v = B.vars[vr];
  const tot = {}; B.ph.forEach(x => Object.entries(mixNeed(x.need, v.mix))
    .forEach(([r,q]) => tot[r] = (tot[r]||0)+q));
  return `<div class="st">${B.name} — vyber provedení</div>
    <div class="ss">Ťukni na provedení, nad parcelou uvidíš, jak bude vypadat.</div>
    ${list.length>1 ? `<div class="tabs">${list.map(k=>
      `<div class="tab ${k===key?'sel':''}" data-pk="${k}" data-pid="${id}">${BUILDINGS[k].name}</div>`).join('')}</div>`:''}
    <div class="tabs">${B.vars.map((x,i)=>
      `<div class="tab ${i===vr?'sel':''}" data-pv="${i}" data-pid="${id}">${x.n}</div>`).join('')}</div>
    <div class="mats">${Object.entries(tot).map(([r,q])=>
      `<span class="mt ${S.res[r]>=q?'':'no'}">${resIcon(r,12)}${q}× ${RL(r).l.toLowerCase()}</span>`).join('')}</div>
    <div class="ss">${B.ph.length} fází po ${(B.dur/1000)|0} s${B.money?` · odměna ${fmt(B.money)}`:''}${
      B.rent?` · <b style="color:var(--leaf)">nájem ${fmt(B.rent)}/min</b>`:''}${
      B.draw?` · odběr ${B.draw[0]} MW`:''}</div>
    ${B.needPower&&powerFree()<B.draw[0]?`<div class="ss"><b class="no">Nemáš dost volného výkonu.</b>
      Potřebuješ ${B.draw[0]} MW, volných je ${powerFree()} MW.</div>`:''}
    <button class="btn" id="confirmPick" data-pid="${id}" ${
      B.needPower&&powerFree()<B.draw[0]?'disabled':''}>Zvolit a začít stavět</button>`;
}

function parcelHTML(id) {
  const p = PARC[id], st = S.plot[id];
  if (!isOwned(id)) {
    const lvOk = !p.reqLvl || S.lvl >= p.reqLvl, ok = lvOk && canBuy(id);
    return `<div class="st">${p.name}</div>
      <div class="ss">${!lvOk ? `Odemkne se na <b>LVL ${p.reqLvl}</b>.`
        : !canBuy(id) ? lockTxt(id) : 'Volná parcela, připravená ke stavbě.'}</div>
      <button class="btn" id="buy" ${!ok||S.money<p.cost?'disabled':''}>Koupit za ${fmt(p.cost)}</button>
      ${ok&&S.money<p.cost?`<div class="ss" style="margin:6px 0 0">Chybí ${fmt(p.cost-S.money)}.</div>`:''}`;
  }
  if (id==='p1' && !S.mowDone) {
    const d = 40-mowLeftN();
    return `<div class="st">${p.name}</div>
      <div class="ss">Zarostlá parcela. <b>Přejeď prstem po trávě.</b></div>
      ${capBar(d,40)}<div class="ss" style="margin-top:4px">Posekáno ${d} ze 40 trsů</div>`;
  }
  if (isPlant(id)) return plantHTML(id);
  const D = defOf(id);
  if (!D) return pickHTML(id);
  if (st.bEnd) {
    const cur = D.ph[st.phase];
    return `<div class="st">${D.name}<span class="tag sky">staví se</span></div>
      ${stripHTML(D.ph,st.phase)}
      <div class="now-line"><b>${cur.n}</b></div>
      ${progBar(st.bEnd, st.bDur||D.dur)}
      <button class="btn g" id="speed">Urychlit za ${fmt(speedCost(st.bEnd))}</button>`;
  }
  if (st.done) return doneHTML(id,D,st);
  const cur = D.ph[st.phase], need = phaseNeed(id, st.phase);
  return `<div class="st">${D.name}<span class="tag">fáze ${st.phase+1} / ${D.ph.length}</span></div>
    ${stripHTML(D.ph,st.phase)}
    <div class="now-line"><b>${cur.n}</b><span>${(D.dur/1000)|0} s · +${cur.xp} XP</span></div>
    <div class="mats">${needTxt(need)}</div>
    ${D.rent?`<div class="ss">Po dokončení: nájem <b style="color:var(--leaf)">${fmt(D.rent)}/min</b>${
      D.draw?` · odběr ${D.draw[0]} MW`:''}</div>`:''}
    <button class="btn" id="bd">Postavit fázi</button>
    ${st.phase===0?`<button class="btn g" id="reselect">Změnit provedení</button>`:''}`;
}
function lockTxt(id) { const p = PARC[id];
  if (p.after) return `Na prodej bude, až dokončíš ${PARC[p.after].name.toLowerCase()}.`;
  return 'Zatím nedostupné.'; }

function doneHTML(id,D,st) {
  let h = `<div class="st">${D.name}${st.hl>1?`<span class="tag sky">LVL ${st.hl}</span>`:''}<span class="tag ok">hotovo</span></div>`;
  if (D.store) {
    const nx = SKLAD_UP[S.skladLvl+1];
    h += `<div class="ss">Uskladníš <b>${cap()} ks</b> od každé suroviny.
      Přehled a obchodování najdeš v záložce Obchod.</div>`;
    if (st.uEnd) h += `<div class="now-line"><b>Rozšíření skladu</b></div>${progBar(st.uEnd,st.uDur||1)}`;
    else if (nx) { const lvOk = S.lvl >= nx.reqLvl;
      h += `<div class="now-line"><b>Sklad LVL ${S.skladLvl+1}</b>
        <span>${nx.cap} ks · ${fmt(nx.cost)}${lvOk?'':` · <b class="no">od LVL ${nx.reqLvl}</b>`}</span></div>
        <div class="mats">${needTxt(nx.need)}</div>
        <button class="btn" id="su" ${lvOk?'':'disabled'}>Rozšířit sklad</button>`; }
    else h += `<div class="ss">Sklad je na maximální úrovni.</div>`;
    return h;
  }
  if (D.office) {
    const act = S.active.length, sl = orderSlots();
    h += `<div class="ss">Odsud bereš <b>zakázky</b> — objednávky na materiál,
      které platí mnohem líp než obchod.</div>
      <div class="rw"><div class="ric">${icon('coin',C.amber,20)}</div>
        <div class="rt"><b>Zakázky</b><i>${act} rozpracované z ${sl} možných</i>
        ${capBar(act,Math.max(1,sl),'var(--amber)')}</div>
        <div class="ra"><button class="mini" id="goOrd">Otevřít</button></div></div>`;
    const up = nextHouseUp(id);
    if (st.uEnd) h += `<div class="now-line" style="margin-top:7px"><b>Přístavba</b></div>${progBar(st.uEnd,st.uDur||1)}
      <button class="btn g" id="speed">Urychlit za ${fmt(speedCost(st.uEnd))}</button>`;
    else if (up) { const lvOk = S.lvl >= up.reqLvl;
      h += `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
        <span>${sl} → ${sl+1} zakázky najednou${lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
        <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
        <button class="btn" id="hu" ${lvOk?'':'disabled'}>Přistavět</button>`; }
    else h += `<div class="ss">Dvůr je na maximální úrovni.</div>`;
    return h;
  }
  if (D.park) {
    h += `<div class="ss">Zvyšuje nájem všech vil na předměstí o
      <b style="color:var(--leaf)">${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} %</b>.</div>`;
  } else {
    const r = houseRent(id), rc = houseRentCap(id);
    h += `<div class="ss">${D.needPower?`Odběr <b style="color:var(--amber)">${drawOf(id)} MW</b>${
      gridLive()?'':' · <b class="no">bez proudu nevydělává</b>'}<br>`:''}
      Nájem <b style="color:var(--leaf)">${fmt(r)}/min</b> do stropu ${fmt(rc)}.</div>
      ${capBar(st.rent,rc)}
      <div class="ss" style="margin-top:4px">Nastřádáno ${fmt(st.rent)}</div>
      <button class="btn go" id="rent" ${st.rent<1?'disabled':''}>Vybrat nájem ${fmt(st.rent)}</button>`;
  }
  const up = nextHouseUp(id);
  if (st.uEnd) h += `<div class="now-line" style="margin-top:7px"><b>Vylepšení</b></div>${progBar(st.uEnd,st.uDur||1)}
    <button class="btn g" id="speed">Urychlit za ${fmt(speedCost(st.uEnd))}</button>`;
  else if (up) { const lvOk = S.lvl >= up.reqLvl;
    h += `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
      <span>LVL ${st.hl} → ${st.hl+1}${up.rentMul?` · nájem ${fmt(Math.round(D.rent*up.rentMul))}/min`:''}${
        lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
      <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
      <button class="btn" id="hu" ${lvOk?'':'disabled'}>Vylepšit</button>`; }
  return h;
}

/* ─── elektrárna ─── */
function plantHTML(id) {
  const st = S.plot[id];
  if (!st.done) {
    if (st.phase === 0 && !st.bEnd)
      return `<div class="st">Elektrárna</div>
        <div class="ss">Dá proud celému městu. Postavíš ji v šesti fázích, vstupní náklady
          <b>${fmt(PLANT.cost)}</b>.</div>
        <div class="mats">${needTxt(PLANT.ph[0].need)}<span class="mt">${fmt(PLANT.cost)}</span></div>
        <div class="ss">Výkon LVL 1: <b style="color:var(--amber)">${PLANT.turbine[0].mw} MW</b>
          · spálí 1 uhlí za ${(PLANT.burnBase/1000)|0} s</div>
        <button class="btn" id="bd">Zaplatit a postavit základy</button>`;
    if (st.bEnd) {
      const cur = PLANT.ph[st.phase];
      return `<div class="st">Elektrárna<span class="tag sky">staví se</span></div>
        ${stripHTML(PLANT.ph,st.phase)}
        <div class="now-line"><b>${cur.n}</b></div>
        ${progBar(st.bEnd, st.bDur||PLANT.dur)}
        <button class="btn g" id="speed">Urychlit za ${fmt(speedCost(st.bEnd))}</button>`;
    }
    const cur = PLANT.ph[st.phase];
    return `<div class="st">Elektrárna<span class="tag">fáze ${st.phase+1} / 6</span></div>
      ${stripHTML(PLANT.ph,st.phase)}
      <div class="now-line"><b>${cur.n}</b><span>${(PLANT.dur/1000)|0} s · +${cur.xp} XP</span></div>
      <div class="mats">${needTxt(cur.need)}</div>
      <button class="btn" id="bd">Postavit fázi</button>`;
  }
  const t = S.plant.turb, cl = S.plant.cool;
  const nt = nextTurbine(), nc = nextCooling();
  let h = `<div class="st">Elektrárna<span class="tag sky">${t} turbín${t>1?'y':'a'}</span>
    <span class="tag">${cl} věž${cl>1?'e':''}</span></div>
    <div class="ss">Vyrábí <b style="color:var(--amber)">${powerMax()} MW</b>,
      spálí 1 uhlí za ${(burnRate()/1000)|0} s. Odběr sítě ${powerUse()} MW.</div>
    ${capBar(powerUse(), Math.max(1,powerMax()), powerUse()>powerMax()?'var(--red)':'var(--amber)')}
    <div class="ss" style="margin-top:4px">Uhlí ve skladu: ${S.res.uhli} ks${
      burnRate()&&S.res.uhli?` · vydrží ${Math.round(S.res.uhli*burnRate()/60000)} min`:' · <b class="no">došlo</b>'}</div>`;
  if (st.uEnd) { h += `<div class="now-line" style="margin-top:8px"><b>${
      st.upKind==='cool'?'Stavba chladicí věže':'Montáž turbíny'}</b></div>
    ${progBar(st.uEnd,st.uDur||1)}
    <button class="btn g" id="speed">Urychlit za ${fmt(speedCost(st.uEnd))}</button>`;
    return h; }
  if (nt) {
    const ok = turbineAllowed() && S.lvl >= nt.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>Přidat turbínu</b>
      <span>${powerMax()} → ${nt.mw} MW${S.lvl<nt.reqLvl?` · <b class="no">od LVL ${nt.reqLvl}</b>`:''}</span></div>
      <div class="mats">${needTxt(nt.need)}<span class="mt">${fmt(nt.cost)}</span></div>
      ${!turbineAllowed()?`<div class="ss"><b class="no">Chybí chlazení.</b>
        Jedna chladicí věž uchladí dvě turbíny — postav další věž.</div>`:''}
      <button class="btn" id="turb" ${ok?'':'disabled'}>Postavit turbínu</button>`;
  } else h += `<div class="ss" style="margin-top:8px">Všechny turbíny jsou osazené.</div>`;
  if (nc) {
    const ok = S.lvl >= nc.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>Chladicí věž ${cl+1}</b>
      <span>uchladí ${(cl+1)*2} turbín${ok?'':` · <b class="no">od LVL ${nc.reqLvl}</b>`}</span></div>
      <div class="mats">${needTxt(nc.need)}<span class="mt">${fmt(nc.cost)}</span></div>
      <button class="btn g" id="cool" ${ok?'':'disabled'}>Postavit chladicí věž</button>`;
  }
  return h;
}
function gridSheet() {
  const use=powerUse(), max=powerMax(), live=gridLive(), br=burnRate();
  opn(`<div class="st">Elektrická síť ${live?'<span class="tag ok">v provozu</span>'
      :'<span class="tag" style="color:var(--red);border-color:var(--red)">bez uhlí</span>'}</div>
    <div class="ss">${live?'Elektrárna hoří a napájí připojené budovy.'
      : max>0?'<b class="no">Došlo uhlí — budovy na proud nevydělávají.</b> Sesbírej uhlí v dole.'
      :'Zatím nemáš elektrárnu.'}</div>
    <div class="rw"><div class="ric">${icon('power',C.amber,20)}</div>
      <div class="rt"><b>Výkon</b><i>odběr ${use} z ${max} MW · volných ${max-use} MW</i>
      ${capBar(use,Math.max(1,max),use>max?'var(--red)':'var(--amber)')}</div></div>
    <div class="rw"><div class="ric">${icon('coal','#5A6066',20)}</div>
      <div class="rt"><b>Uhlí</b><i>zásoba ${S.res.uhli} ks${
        br?` · spotřeba ${(60000/br).toFixed(1)} ks/min`:''}</i>
      <i class="nx">${br&&S.res.uhli?`vydrží ${Math.round(S.res.uhli*br/60000)} min`:'—'}</i></div></div>
    ${PIDS.filter(id=>{const D=defOf(id);return D&&D.draw&&S.plot[id].done;}).map(id=>{
      const D=defOf(id);
      return `<div class="rw"><div class="ric"><div class="sw" style="background:${styleOf(id).wall}"></div></div>
        <div class="rt"><b>${D.name} <span class="tag sky">LVL ${S.plot[id].hl}</span></b>
        <i>odběr ${drawOf(id)} MW · nájem ${fmt(houseRent(id))}/min</i></div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`);
}

function bindDetail() {
  const q = id => $(id);
  dbody.querySelectorAll('[data-pk]').forEach(el => el.onclick = () => {
    pickSel[el.dataset.pid] = el.dataset.pk; pickVar[el.dataset.pid] = 0; renderDetail(); });
  dbody.querySelectorAll('[data-pv]').forEach(el => el.onclick = () => {
    pickVar[el.dataset.pid] = +el.dataset.pv; renderDetail(); });
  if (q('confirmPick')) q('confirmPick').onclick = () => {
    const id = q('confirmPick').dataset.pid;
    S.plot[id].key = pickSel[id]; S.plot[id].vr = pickVar[id]||0; save();
    toast(BUILDINGS[pickSel[id]].name+' — provedení '+BUILDINGS[pickSel[id]].vars[S.plot[id].vr].n.toLowerCase());
    renderDetail(); renderQuest(); };
  if (q('reselect')) q('reselect').onclick = () => { S.plot[MODE.id].key = null; renderDetail(); };
  if (q('buy'))  q('buy').onclick  = () => buyParcel(MODE.id);
  if (q('bd'))   q('bd').onclick   = () => startPhase(MODE.id);
  if (q('speed'))q('speed').onclick= () => speedUp(MODE.id);
  if (q('rent')) q('rent').onclick = () => { const st = S.plot[MODE.id], a = Math.floor(st.rent);
    if (a < 1) return; S.money += a; st.rent -= a;
    toast('Nájem +'+fmt(a)); renderTop(); renderDetail(); save(); };
  if (q('su'))   q('su').onclick   = () => startSkladUp();
  if (q('hu'))   q('hu').onclick   = () => startHouseUp(MODE.id);
  if (q('goOrd')) q('goOrd').onclick = () => { closeParcel(); scrZakazky(); };
  if (q('turb')) q('turb').onclick = () => startPlantUp('turb');
  if (q('cool')) q('cool').onclick = () => startPlantUp('cool');
}

/* ─── vylepšení stanice ─── */
function upgradeSheet(id) {
  const n = S.nodes[id], u = nextStUp(id);
  if (!u) return;
  if (n.uEnd) { opn(`<div class="st">${u.name}<span class="tag sky">staví se</span></div>
      ${stripHTML(u.ph,n.ph)}
      <div class="now-line"><b>${u.ph[n.ph].n}</b></div>
      ${progBar(n.uEnd, n.uDur||u.dur, 'nfill')}
      <button class="btn g" data-close>Zavřít</button>`); return; }
  const cur = u.ph[n.ph], now = nodeTick(id);
  const nxt = Math.round(nodeDef(id).base_tick * u.mul * Math.pow(0.96, n.ph+1));
  const newOut = u.makes.filter(m => nodeMakes(id).indexOf(m) < 0);
  opn(`<div class="st">${nodeName(id)} → ${u.name}</div>
    <div class="ss">${newOut.length
      ? `<b style="color:var(--sky)">Nově bude vyrábět ${newOut.map(m=>RL(m).l.toLowerCase()).join(' a ')}.</b> `
      : ''}Kapacita ${nodeCap(id)} → ${u.cap} ks${u.queue?`, fronta výroby ${u.queue} kusů`:''}.</div>
    ${stripHTML(u.ph,n.ph)}
    <div class="now-line"><b>${cur.n}</b><span>${(u.dur/1000)|0} s · +${cur.xp} XP</span></div>
    <div class="mats">${needTxt(cur.need)}${n.ph===0?`<span class="mt">${fmt(u.cost)}</span>`:''}</div>
    <div class="ss">Těžba ${(now/1000).toFixed(2)} s → <b style="color:var(--leaf)">${(nxt/1000).toFixed(2)} s</b> na kus</div>
    <button class="btn" id="nu">${n.ph===0?`Zaplatit ${fmt(u.cost)} a začít`:'Postavit fázi'}</button>
    <button class="btn g" data-close>Zavřít</button>`);
  $('nu').onclick = () => startNodePhase(id);
}

/* ─── obrazovky ─── */
const swatch = c => `<div class="sw" style="background:${c}"></div>`;
function scrStavby() {
  const rows = PIDS.filter(visible).map(id => {
    const p = PARC[id], D = defOf(id), st = S.plot[id];
    const nm = isPlant(id) ? 'Elektrárna' : (D ? D.name : 'Volná parcela');
    const col = isPlant(id) ? C.concrete : (D ? styleOf(id).wall : C.dirt);
    let sub;
    if (!isOwned(id)) sub = (p.reqLvl&&S.lvl<p.reqLvl) ? `odemkne se na LVL ${p.reqLvl}` : `nekoupeno · ${fmt(p.cost)}`;
    else if (st.bEnd) sub = 'staví se…';
    else if (st.done) sub = isPlant(id) ? `${powerMax()} MW` : (D.store ? `${cap()} ks na surovinu`
      : D.park ? `+${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} % nájmu vilám`
      : `nájem ${fmt(houseRent(id))}/min`);
    else if (D || isPlant(id)) sub = `fáze ${st.phase} / ${(isPlant(id)?PLANT:D).ph.length}`;
    else sub = 'čeká na výběr stavby';
    return `<div class="rw ${isOwned(id)?'':'lock'}"><div class="ric">${swatch(col)}</div>
      <div class="rt"><b>${nm} ${st.done?'<span class="tag ok">hotovo</span>':''}</b>
      <i>${PLATFORMS[p.plat].name} · ${sub}</i></div>
      <div class="ra"><button class="mini" data-p="${id}">Otevřít</button></div></div>`;
  }).join('');
  opn(`<div class="st">Stavby</div><div class="ss">Ťukni na řádek — otevře se ta parcela.</div>${rows}
    <div class="st sub">Těžební stanice</div>
    ${Object.keys(NODE_DEF).filter(id=>!nodeDef(id).plat||platOpen(nodeDef(id).plat)).map(id=>{
      const n = S.nodes[id], d = nodeDef(id), R = RL(d.res), u = nextStUp(id);
      return `<div class="rw"><div class="ric">${icon(R.ic,R.c,20)}</div>
        <div class="rt"><b>${nodeName(id)} ${n.lvl?`<span class="tag sky">LVL ${n.lvl}</span>`:''}
          ${n.on?'<span class="tag run">těží</span>':''}</b>
        <i>${R.l} · ${n.buf} / ${nodeCap(id)} ks · ${(nodeTick(id)/1000).toFixed(2)} s/ks</i>
        ${capBar(n.buf,nodeCap(id))}${u?`<i class="nx">↑ ${u.name} · od LVL ${u.reqLvl}</i>`:''}</div>
        <div class="ra">${canUpgradeNode(id)?`<button class="mini" data-u="${id}">${
          n.ph?`${n.ph}/3`:'Vylepšit'}</button>`:''}</div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`);
  bindRows();
}
function bindRows() {
  sbody.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{cls();openParcel(b.dataset.p);});
  sbody.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>upgradeSheet(b.dataset.u));
  sbody.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>platformSheet(+b.dataset.x));
}

function scrVyroba() {
  const facts = Object.keys(NODE_DEF).filter(id => nodeMakes(id).length > 0);
  if (!facts.length) {
    opn(`<div class="st">Výroba</div>
      <div class="ss">Zpracované materiály — prkna, štěrk, cihly a balíky — potřebuješ na lepší stavby
      a prodávají se několikanásobně dráž než surovina. Vyrábět je začnou těžební stanice,
      až je <b>vylepšíš na LVL 2</b>.</div>
      ${Object.keys(NODE_DEF).filter(id=>nodeDef(id).kind!=='coal').map(id=>{
        const n=S.nodes[id], c=stChain(id)[1], O=RL(c.makes[0]);
        const can = n.lvl===1 && S.lvl>=c.reqLvl;
        return `<div class="rw ${can?'':'lock'}"><div class="ric">${icon(O.ic,O.c,20)}</div>
          <div class="rt"><b>${c.name} → ${O.l}</b>
          <i>prodej ${fmt(O.price)}/ks · fronta ${c.queue} kusů</i>
          <i class="nx">${n.lvl<1?'nejdřív vylepši stanici na LVL 1':can?`k dispozici · ${fmt(c.cost)}`:`od LVL ${c.reqLvl}`}</i></div>
          <div class="ra">${can?`<button class="mini" data-u="${id}">Vylepšit</button>`:''}</div></div>`;}).join('')}
      <button class="btn g" data-close>Zavřít</button>`);
    bindRows(); return;
  }
  opn(`<div class="st">Výroba</div>
    <div class="ss">Fabriky mění suroviny na stavební materiál. Zapni automat a nemusíš klikat.</div>
    ${facts.map(id=>{
      const n=S.nodes[id], d=nodeDef(id), dur=makeDur(id), qmax=nodeQueueMax(id);
      const used = Object.values(n.make).reduce((a,b)=>a+b,0);
      return `<div class="rw col"><div class="rwtop">
        <div class="ric">${icon(RL(d.res).ic,RL(d.res).c,20)}</div>
        <div class="rt"><b>${nodeName(id)} <span class="tag sky">LVL ${n.lvl}</span></b>
          <i>1 kus za ${(dur/1000).toFixed(1)} s · fronta ${used} / ${qmax}</i></div>
        <div class="ra"><button class="mini ${n.autoMake?'':'o'}" data-auto="${id}">${
          n.autoMake?'Automat ✓':'Automat'}</button></div></div>
        ${nodeMakes(id).map(out=>{
          const O=RL(out), q=n.make[out]||0;
          const need = d.res, per = 2;
          const canN = Math.floor(S.res[need]/per), room = qmax-used;
          const prog = q>0 ? Math.max(0,Math.min(1,1-((n.mEnd[out]||0)-Date.now())/dur)) : 0;
          return `<div class="mkrow">
            <div class="mkhead">${icon(O.ic,O.c,16)}<b>${O.l}</b>
              <span>${per}× ${RL(need).l.toLowerCase()} → 1 ks</span>
              <span class="mkq">${q}×</span></div>
            <div class="pbar sm"><i style="width:${prog*100}%"></i></div>
            <div class="mkbtn">
              <button class="mini o" data-mk="${id}" data-o="${out}" data-a="5" ${canN<5||room<5?'disabled':''}>+5</button>
              <button class="mini" data-mk="${id}" data-o="${out}" data-a="max" ${canN<1||room<1?'disabled':''}>+${Math.min(canN,room)}</button>
            </div></div>`;}).join('')}
      </div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`);
  sbody.querySelectorAll('[data-auto]').forEach(b=>b.onclick=()=>{
    const n = S.nodes[b.dataset.auto]; n.autoMake = !n.autoMake;
    toast(n.autoMake?'Automatická výroba zapnuta':'Automat vypnut'); save(); scrVyroba(); });
  sbody.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{
    enqueue(b.dataset.mk, b.dataset.o, b.dataset.a==='max'?9999:5); scrVyroba(); });
}

function scrObchod() {
  const list = ALL.filter(r => r.tier===0 || (r.tier===1&&anyFactory())
    || (r.tier===2 && (S.res[r.k]>0 || Object.keys(NODE_DEF).some(i=>S.nodes[i].lvl>=5))));
  opn(`<div class="st">Obchod</div>
    <div class="ss">Prodávej přebytky, dokup, co ti chybí. Nákup je dražší než výkup —
      pohodlí za peníze.</div>
    <div class="sellhead"><span>Surovina</span><span>Prodat · Koupit</span></div>
    ${list.map(r=>{
      const buy = Math.round(r.price*BUY_MUL);
      return `<div class="rw"><div class="ric">${icon(r.ic,r.c,20)}</div>
        <div class="rt"><b>${r.l} <span class="tag">${fmt(r.price)} / ${fmt(buy)}</span></b>
        <i>${S.res[r.k]} / ${cap()} ks</i>${capBar(S.res[r.k],cap())}</div>
        <div class="ra">
          <button class="mini o" data-sell="${r.k}" data-a="10" ${S.res[r.k]<10?'disabled':''}>−10</button>
          <button class="mini o" data-sell="${r.k}" data-a="all" ${S.res[r.k]<1?'disabled':''}>vše</button>
          <button class="mini" data-buy="${r.k}" data-a="10" ${
            S.money<buy*10||S.res[r.k]+10>cap()?'disabled':''}>+10</button>
        </div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`);
  sbody.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.sell, r=RL(k), a=b.dataset.a==='all'?S.res[k]:Math.min(10,S.res[k]);
    if (a<1) return; S.res[k]-=a; S.money+=a*r.price;
    toast(`Prodáno ${a}× ${r.l.toLowerCase()} za ${fmt(a*r.price)}`);
    renderTop(); renderRes(); scrObchod(); save(); });
  sbody.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.buy, r=RL(k), price=Math.round(r.price*BUY_MUL);
    const a=Math.min(10, cap()-S.res[k], Math.floor(S.money/price));
    if (a<1) { toast('Nemáš peníze nebo místo ve skladu'); return; }
    S.res[k]+=a; S.money-=a*price;
    toast(`Koupeno ${a}× ${r.l.toLowerCase()} za ${fmt(a*price)}`);
    renderTop(); renderRes(); scrObchod(); save(); });
}

function scrRozvoj() {
  const UL = UNLOCKS;
  const nxt = UL.find(u => u.lv > S.lvl);
  const rows = [];
  PIDS.filter(visible).forEach(id => {
    const p = PARC[id], D = defOf(id), st = S.plot[id];
    if (!isOwned(id)) { rows.push({ ic:swatch(C.dirt), n:p.name, lv:'—',
      s:(p.reqLvl&&S.lvl<p.reqLvl)?`odemkne se na LVL ${p.reqLvl}`:`nekoupeno · ${fmt(p.cost)}`,
      btn:canBuy(id)?['Otevřít','p',id]:null }); return; }
    if (isPlant(id)) { rows.push({ ic:swatch(C.concrete), n:'Elektrárna',
      lv: st.done?`${S.plant.turb} T / ${S.plant.cool} V`:'staví se',
      s: st.done?`${powerMax()} MW · odběr ${powerUse()} MW`:`fáze ${st.phase} / 6`,
      next: st.done&&nextTurbine()?`Turbína ${S.plant.turb+1} · od LVL ${nextTurbine().reqLvl}`:null,
      btn:['Otevřít','p',id] }); return; }
    if (!D) { rows.push({ ic:swatch(C.dirt), n:p.name, lv:'—', s:'čeká na výběr stavby',
      btn:['Otevřít','p',id] }); return; }
    const up = D.store ? SKLAD_UP[S.skladLvl+1] : nextHouseUp(id);
    rows.push({ ic:swatch(styleOf(id).wall), n:D.name,
      lv: st.done?`LVL ${D.store?S.skladLvl:st.hl}`:`fáze ${st.phase}/${D.ph.length}`,
      s: st.done ? (D.store?`${cap()} ks na surovinu`
        : D.park?`+${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} % nájmu vilám`
        : `nájem ${fmt(houseRent(id))}/min`) : PLATFORMS[p.plat].name,
      next: st.done&&up ? `${up.label||('Sklad LVL '+(S.skladLvl+1))} · od LVL ${up.reqLvl} · ${fmt(up.cost)}` : null,
      btn:['Otevřít','p',id] });
  });
  Object.keys(NODE_DEF).filter(id=>!nodeDef(id).plat||platOpen(nodeDef(id).plat)).forEach(id => {
    const n=S.nodes[id], d=nodeDef(id), u=nextStUp(id);
    rows.push({ ic:icon(RL(d.res).ic,RL(d.res).c,20), n:nodeName(id),
      lv:n.lvl?`LVL ${n.lvl}`:'základ',
      s:`${RL(d.res).l.toLowerCase()} · ${nodeCap(id)} ks · ${(nodeTick(id)/1000).toFixed(2)} s/ks`
        + (nodeMakes(id).length?` · vyrábí ${nodeMakes(id).map(m=>RL(m).l.toLowerCase()).join(', ')}`:''),
      next: u?`${u.name} · od LVL ${u.reqLvl} · ${fmt(u.cost)}`:null,
      btn: canUpgradeNode(id)?['Vylepšit','u',id]:null });
  });
  PLATFORMS.forEach(pl => { if (pl.id===0 || platOpen(pl.id)) return;
    rows.push({ ic:swatch(C.dirt), n:pl.name, lv:'zamčeno', s:'další část mapy',
      next:`otevře se zdarma na LVL ${pl.reqLvl}`, btn:['Detail','x',''+pl.id] }); });

  opn(`<div class="st">Rozvoj</div>
    <div class="ss">Co máš, na jaké je to úrovni a kdy to půjde vylepšit.</div>
    ${rows.map(r=>`<div class="rw"><div class="ric">${r.ic}</div>
      <div class="rt"><b>${r.n} <span class="tag ${String(r.lv).indexOf('LVL')===0?'sky':''}">${r.lv}</span></b>
        <i>${r.s}</i>${r.next?`<i class="nx">↑ ${r.next}</i>`:''}</div>
      <div class="ra">${r.btn?`<button class="mini" data-${r.btn[1]}="${r.btn[2]}">${r.btn[0]}</button>`:''}</div></div>`).join('')}
    <div class="st sub">Co se kdy odemkne</div>
    ${nxt?`<div class="ss">Do LVL ${nxt.lv} zbývá ${fmtN(Math.max(0,LVL[nxt.lv-1]-S.xp))} XP.</div>`
      :`<div class="ss">Všechno je odemčené.</div>`}
    <div class="tl">${UL.map(u=>{
      const done=S.lvl>=u.lv, now=!done&&nxt&&u.lv===nxt.lv;
      return `<div class="tli ${done?'done':now?'now':''}"><div class="dot">${done?'✓':''}</div>
        <div class="lv">LVL ${u.lv}</div><div class="un">${u.t}</div><div class="xr">${u.d}</div></div>`;}).join('')}</div>
    <button class="btn g" data-close>Zavřít</button>`);
  bindRows();
}

/* ─── zakázky ─── */
const tierCol = t => t==='fast'?C.leaf2 : t==='mid'?C.amber : C.sky;
function orderCard(o, i) {
  const can = has(o.need), full = S.active.length >= orderSlots();
  return `<div class="rw col ord ${o.tier}">
    <div class="rwtop">
      <div class="ric" style="border-color:${tierCol(o.tier)}">
        <div class="sw" style="background:${tierCol(o.tier)}"></div></div>
      <div class="rt"><b>${o.name} zakázka <span class="tag">${
        o.dur<60000?`${(o.dur/1000)|0} s`:`${Math.round(o.dur/60000)} min`}</span></b>
        <i>${o.client}</i></div>
      <div class="ra"><b class="pay">${fmt(o.pay)}</b></div>
    </div>
    <div class="mats">${needTxt(o.need)}</div>
    <div class="ordbtn">
      <button class="mini o" data-roll="${i}">Jiná</button>
      <button class="mini" data-take="${i}" ${can&&!full?'':'disabled'}>${
        full?'Máš plno':can?'Přijmout':'Chybí materiál'}</button>
    </div></div>`;
}
function activeCard(a, i) {
  const left = Math.max(0, a.end-Date.now()), done = left <= 0;
  return `<div class="rw col ord ${a.tier}">
    <div class="rwtop">
      <div class="ric" style="border-color:${tierCol(a.tier)}">
        <div class="sw" style="background:${tierCol(a.tier)}"></div></div>
      <div class="rt"><b>${a.name} zakázka ${done?'<span class="tag ok">hotovo</span>':''}</b>
        <i>${a.client} · ${Object.entries(a.need).map(([k,v])=>`${v}× ${RL(k).l.toLowerCase()}`).join(' · ')}</i></div>
      <div class="ra"><b class="pay">${fmt(a.pay)}</b></div>
    </div>
    ${done ? `<button class="btn go" data-claim="${i}">Vyzvednout ${fmt(a.pay)} a ${fmtN(a.xp)} XP</button>`
      : `<div class="pbar sm"><i class="ofill" data-end="${a.end}" data-dur="${a.dur}"
           style="width:${(1-left/a.dur)*100}%"></i></div>
         <div class="ordbtn"><button class="mini o" data-speed="${i}">Urychlit za ${fmt(speedCost(a.end))}</button></div>`}
  </div>`;
}
function scrZakazky() {
  if (!hasOffice()) {
    opn(`<div class="st">Zakázky</div>
      <div class="ss">Lidé kolem shánějí materiál a zaplatí za něj <b>mnohem líp než obchod</b>.
      Abys mohl zakázky brát, potřebuješ <b>Stavební dvůr</b> — postavíš ho na parcele 4 od LVL 8.</div>
      <div class="bli"><em>Rychlá</em><span>malá dodávka, hotovo do minuty</span></div>
      <div class="bli"><em>Střední</em><span>víc materiálu, čtyři minuty</span></div>
      <div class="bli"><em>Velká</em><span>velká dodávka, čtvrt hodiny — a nejvyšší odměna</span></div>
      <div class="ss" style="margin-top:8px">Materiál se odečte hned při přijetí. Zakázka pak běží
      sama, i když hru zavřeš.</div>
      <button class="btn g" data-close>Zavřít</button>`);
    return;
  }
  refreshOrders();
  opn(`<div class="st">Zakázky <span class="tag">${S.active.length} / ${orderSlots()}</span></div>
    <div class="ss">Materiál odevzdáš hned, peníze dostaneš po uplynutí času.
      Zakázka běží, i když hru zavřeš.</div>
    ${S.active.length ? `<div class="st sub">Rozpracované</div>${S.active.map(activeCard).join('')}` : ''}
    <div class="st sub">Nabídka</div>
    ${S.orders.map(orderCard).join('')}
    <button class="btn g" data-close>Zavřít</button>`);
  sbody.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>{ takeOrder(+b.dataset.take); scrZakazky(); });
  sbody.querySelectorAll('[data-roll]').forEach(b=>b.onclick=()=>{ rerollOrder(+b.dataset.roll); save(); scrZakazky(); });
  sbody.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{ claimOrder(+b.dataset.claim); scrZakazky(); });
  sbody.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{ speedOrder(+b.dataset.speed); scrZakazky(); });
}

const PLAT_INFO = {
  1:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Průmyslová zóna. Otevřeš tu <b>uhelný důl</b> a postavíš <b>elektrárnu</b>, která dá proud celému městu.',
      lines:[['Důl','těží uhlí — palivo pro elektrárnu'],
             ['Elektrárna','areál 3 × 3, turbíny a chladicí věže']] },
  2:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Sídliště. Šest parcel pro <b>činžáky</b> — vysoký nájem, ale potřebují proud.',
      lines:[['Činžák','odběr 20 MW, nájem '+fmt(BUILDINGS.cinzak.rent)+'/min'],
             ['Provedení','cihlový, panelový nebo omítaný']] },
  3:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Předměstí. Velké <b>vily</b> a <b>parky</b>, které zvednou nájem všem vilám kolem.',
      lines:[['Vila','3 × 3 pole, odběr 45 MW, nájem '+fmt(BUILDINGS.vila.rent)+'/min'],
             ['Park','zvedne nájem vilám o 15 až 50 %'],
             ['Materiál','trámy, dlažba, obklady a izolace z kombinátů']] },
  4:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Obchodní zóna. Jedna obrovská stavba — <b>obchodní centrum</b>.',
      lines:[['Odběr','160 MW — bez pořádné elektrárny to nerozsvítíš'],
             ['Nájem',fmt(BUILDINGS.obchodak.rent)+'/min'],
             ['Materiál','všechno, co umíš vyrobit']] }
};
function platformSheet(i) {
  const p = PLATFORMS[i], I = PLAT_INFO[i], op = platOpen(i);
  opn(`<div class="st">${p.name}${op?'<span class="tag ok">otevřeno</span>':''}</div>
    <div class="ss">${op ? I.desc : I.teaser}</div>
    ${(op ? I.lines : [['Zdarma','Otevře se sama na LVL '+p.reqLvl]]).map(l=>
      `<div class="bli"><em>${l[0]}</em><span>${l[1]}</span></div>`).join('')}
    ${op?'':`<div class="ss" style="margin-top:8px">Zbývá ${
      fmtN(Math.max(0,LVL[p.reqLvl-1]-S.xp))} XP.</div>`}
    <button class="btn g" data-close>Zavřít</button>`);
}
function openPlatform(i) {
  if (platOpen(i)) return;
  const p = PLATFORMS[i], I = PLAT_INFO[i];
  S.plats[i] = true;
  if (i === 1) S.owned.e1 = true;
  renderRes(); save();
  showEvent({ once:'plat'+i, kick:'Nová oblast', tone:'ok', title:p.name,
    desc:'Otevřela se ti nová část mapy — zdarma.', lines:I.lines });
}

/* ─── restart ─── */
$('logo').onclick = () => {
  opn(`<div class="st">Začít znovu</div>
    <div class="ss">Smaže celý postup — level, peníze, stavby i suroviny. Nejde to vrátit.
      Pro potvrzení napiš <b>RESTART</b>.</div>
    <input class="inp" id="rw" placeholder="RESTART" autocapitalize="characters">
    <button class="btn" id="rgo" style="background:var(--red);color:#fff">Smazat a začít znovu</button>
    <button class="btn g" data-close>Zrušit</button>`);
  $('rgo').onclick = () => {
    if (($('rw').value||'').trim().toUpperCase() !== 'RESTART') { toast('Napiš RESTART'); return; }
    wipe(); };
};

/* ─── navigace ─── */
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => {
  const s = b.dataset.s;
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x===b));
  if (s === 'mapa') { cls(); closeParcel(); return; }
  ({ stavby:scrStavby, rozvoj:scrRozvoj, vyroba:scrVyroba, obchod:scrObchod,
     zakazky:scrZakazky })[s]();
  setTimeout(()=>document.querySelectorAll('#nav button')
    .forEach(x=>x.classList.toggle('on', x.dataset.s==='mapa')), 350);
});
