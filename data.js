/* ═══════════ MOJE STAVBA — data a konfigurace ═══════════ */

const C = {
  grass:'#6E8A4C', meadow:'#96984C', forest:'#4F6B41', quarry:'#7C817C', clay:'#A3673F',
  road:'#A08659', dirt:'#8A7A50', wood:'#9C7442', woodD:'#77572F', log:'#8A6437',
  stone:'#8E938F', stoneD:'#6E736F', thatch:'#C8AF5A', tile:'#B65A3C', slate:'#5A6470',
  leaf1:'#5E8A45', leaf2:'#6E9A4E', leaf3:'#B0803A', wheat:'#C6AC4E', brick:'#A85B3E',
  concrete:'#A7ABA4', coal:'#33383D', asphalt:'#5E6266', steel:'#8892A0',
  glass:'#7FA8B8', plaster:'#D8CBB0', park:'#5C8A46',
  amber:'#E9A63C', green:'#8FBB5C', red:'#D9584A', sky:'#77AEC9'
};
const CUR = '¤';
const fmt  = n => Math.round(n).toLocaleString('cs-CZ') + ' ' + CUR;
const fmtN = n => Math.round(n).toLocaleString('cs-CZ');

/* ─── suroviny ─── */
const RES = [
  { k:'drevo', l:'Dřevo',  c:C.log,     price:8,  ic:'log',   tier:0 },
  { k:'kamen', l:'Kámen',  c:C.stone,   price:12, ic:'rock',  tier:0 },
  { k:'slama', l:'Sláma',  c:C.wheat,   price:6,  ic:'wheat', tier:0 },
  { k:'hlina', l:'Hlína',  c:C.clay,    price:10, ic:'clay',  tier:0 },
  { k:'uhli',  l:'Uhlí',   c:'#4A5157', price:16, ic:'coal',  tier:0 }
];
const MAT = [
  { k:'prkno', l:'Prkna',  c:'#C09454', price:26, ic:'plank',  tier:1 },
  { k:'sterk', l:'Štěrk',  c:'#A6ABA5', price:34, ic:'gravel', tier:1 },
  { k:'cihla', l:'Cihly',  c:C.brick,   price:30, ic:'brick',  tier:1 },
  { k:'balik', l:'Balíky', c:'#D6C066', price:22, ic:'bale',   tier:1 }
];
const HIGH = [
  { k:'tram',    l:'Trámy',   c:'#B8823E', price:78, ic:'beam',  tier:2 },
  { k:'dlazba',  l:'Dlažba',  c:'#9BA3A8', price:92, ic:'pave',  tier:2 },
  { k:'obklad',  l:'Obklady', c:'#C2705A', price:86, ic:'tileM', tier:2 },
  { k:'izolace', l:'Izolace', c:'#D9CE86', price:70, ic:'insul', tier:2 }
];
const ALL = [...RES, ...MAT, ...HIGH];
const RL = k => ALL.find(r => r.k === k);
const BUY_MUL = 2.4;

/* ─── XP a levely ─── */
const LVL_STEP = [100,140,180,220,280,340,400,460,520,600,700,800,900,1000,
  1200,1400,1600,1800,2000,2400,2800,3200,3600,4000,4600,5200,5800,6400,7000,
  7800,8600,9400,10400,11400,12600,13800,15200,16600,18200];
const LVL = [0];
LVL_STEP.forEach(v => LVL.push(LVL[LVL.length-1] + v));
const MAXLVL = LVL.length;
const XPC = 4, XPFIRST = 25, XPMOW = 25;

/* ═══════════ STAVBY ═══════════ */
const CAB_UP = [
  { reqLvl:12, cost:800,  need:{drevo:20,kamen:12}, dur:12000, rentMul:1.8, xp:260, label:'Přístavba a zápraží' },
  { reqLvl:24, cost:3500, need:{prkno:18,cihla:12}, dur:18000, rentMul:3.0, xp:900, label:'Zděná přístavba a komín' }
];
const BIG_UP = [
  { reqLvl:24, cost:6000,  need:{prkno:25,cihla:20}, dur:20000, rentMul:1.7, xp:1200, label:'Podkroví a terasa' },
  { reqLvl:29, cost:22000, need:{sterk:40,balik:30}, dur:26000, rentMul:2.6, xp:3200, label:'Druhé podlaží' }
];

const BUILDINGS = {
  chatka: {
    name:'Chatka', dur:5000, money:350, rent:14, rentCap:150, reqLvl:1, span:2, up:CAB_UP,
    vars:[
      { n:'Dřevěná',  style:{ wall:C.wood,    roof:C.thatch, roofT:'gable', chim:false }, mix:{} },
      { n:'Kamenná',  style:{ wall:C.stone,   roof:C.slate,  roofT:'gable', chim:true  }, mix:{drevo:'kamen'} },
      { n:'Hrázděná', style:{ wall:'#C4A46A', roof:C.tile,   roofT:'hip',   chim:true  }, mix:{slama:'hlina'} }],
    ph:[
      { n:'Kamenné patky',  need:{kamen:6}, xp:45 },
      { n:'Trámová kostra', need:{drevo:8}, xp:55 },
      { n:'Stěny',          need:{drevo:8}, xp:65 },
      { n:'Krov',           need:{drevo:6}, xp:65 },
      { n:'Střecha',        need:{slama:8}, xp:85 }]
  },
  sklad: {
    name:'Sklad', dur:10000, money:0, rent:0, reqLvl:5, span:2, store:true,
    vars:[{ n:'Dřevěný', style:{ wall:C.wood, roof:C.thatch, roofT:'gable', chim:false }, mix:{} }],
    ph:[
      { n:'Betonová deska',  need:{kamen:12}, xp:70 },
      { n:'Nosné sloupy',    need:{drevo:10}, xp:80 },
      { n:'Bednění stěn',    need:{drevo:10}, xp:90 },
      { n:'Krov',            need:{drevo:10}, xp:90 },
      { n:'Střecha a vrata', need:{slama:14}, xp:110 }]
  },
  dvur: {
    name:'Stavební dvůr', dur:9000, money:400, rent:0, reqLvl:6, span:3, big:true,
    office:true,
    up:[
      { reqLvl:20, cost:9000,  need:{prkno:30,cihla:24}, dur:18000, xp:2200, label:'Druhá kancelář' },
      { reqLvl:30, cost:45000, need:{sterk:60,dlazba:30}, dur:26000, xp:9000, label:'Dispečink a váha' }],
    vars:[
      { n:'Dřevěný',  style:{ wall:C.wood,    roof:C.thatch, roofT:'gable', chim:false }, mix:{} },
      { n:'Zděný',    style:{ wall:'#C8A070', roof:C.tile,   roofT:'hip',   chim:true  }, mix:{drevo:'kamen'} },
      { n:'Plechový', style:{ wall:C.steel,   roof:C.slate,  roofT:'gable', chim:false }, mix:{slama:'kamen'} }],
    ph:[
      { n:'Zpevněná plocha', need:{kamen:14}, xp:110 },
      { n:'Sklad materiálu', need:{drevo:14}, xp:120 },
      { n:'Kancelář',        need:{drevo:12,slama:8}, xp:130 },
      { n:'Váha a rampa',    need:{kamen:10,drevo:8}, xp:150 }]
  },
  dum: {
    name:'Rodinný dům', dur:15000, money:1200, rent:55, rentCap:560,
    reqLvl:15, span:3, big:true, up:BIG_UP,
    vars:[
      { n:'Omítaný', style:{ wall:'#CFA277', roof:C.tile,   roofT:'hip',   chim:true }, mix:{} },
      { n:'Cihlový', style:{ wall:C.brick,   roof:C.slate,  roofT:'hip',   chim:true }, mix:{hlina:'kamen'} },
      { n:'Roubený', style:{ wall:C.woodD,   roof:C.thatch, roofT:'gable', chim:true }, mix:{kamen:'drevo'} }],
    ph:[
      { n:'Základová deska',  need:{kamen:20}, xp:150 },
      { n:'Nosná konstrukce', need:{drevo:20}, xp:160 },
      { n:'Obvodové zdivo',   need:{drevo:25,hlina:15}, xp:180 },
      { n:'Příčky a komín',   need:{hlina:15,kamen:10}, xp:180 },
      { n:'Krov',             need:{drevo:15}, xp:200 },
      { n:'Střešní krytina',  need:{slama:25}, xp:230 }]
  },
  cinzak: {
    name:'Činžák', dur:18000, money:1500, rent:190, rentCap:1900,
    reqLvl:24, span:2, big:true, draw:[20,35,55], needPower:true,
    up:[
      { reqLvl:26, cost:12000, need:{cihla:40,prkno:30}, dur:22000, rentMul:1.9, xp:2600, label:'Třetí podlaží' },
      { reqLvl:29, cost:38000, need:{cihla:70,sterk:50}, dur:28000, rentMul:3.1, xp:6000, label:'Čtvrté podlaží a výtah' }],
    vars:[
      { n:'Cihlový',  style:{ wall:'#B0674C',  roof:C.tile,  roofT:'hip', chim:true  }, mix:{} },
      { n:'Panelový', style:{ wall:C.concrete, roof:C.slate, roofT:'hip', chim:false }, mix:{cihla:'sterk'} },
      { n:'Omítaný',  style:{ wall:'#C9A878',  roof:C.tile,  roofT:'hip', chim:true  }, mix:{prkno:'cihla'} }],
    ph:[
      { n:'Základová deska',    need:{sterk:20}, xp:400 },
      { n:'Nosné zdivo',        need:{cihla:26}, xp:440 },
      { n:'Stropy',             need:{prkno:22}, xp:470 },
      { n:'Druhé podlaží',      need:{cihla:24}, xp:500 },
      { n:'Střecha',            need:{prkno:16,balik:10}, xp:540 },
      { n:'Rozvody a přípojka', need:{sterk:14,prkno:10}, xp:580 }]
  },
  vila: {
    name:'Vila', dur:24000, money:4000, rent:320, rentCap:3200,
    reqLvl:27, span:3, big:true, draw:[45,70,100], needPower:true,
    up:[
      { reqLvl:31, cost:30000, need:{tram:24,obklad:20},   dur:26000, rentMul:1.8, xp:5200,  label:'Bazén a zimní zahrada' },
      { reqLvl:35, cost:90000, need:{dlazba:40,izolace:34},dur:32000, rentMul:2.8, xp:12000, label:'Druhé křídlo' }],
    vars:[
      { n:'Moderní', style:{ wall:C.plaster,  roof:C.slate,  roofT:'hip',   chim:false }, mix:{} },
      { n:'Cihlová', style:{ wall:C.brick,    roof:C.tile,   roofT:'hip',   chim:true  }, mix:{dlazba:'obklad'} },
      { n:'Dřevěná', style:{ wall:'#A87F49',  roof:C.thatch, roofT:'gable', chim:true  }, mix:{obklad:'tram'} }],
    ph:[
      { n:'Výkop a základy',  need:{sterk:30}, xp:900 },
      { n:'Nosné zdivo',      need:{cihla:36}, xp:960 },
      { n:'Stropy z trámů',   need:{tram:20},  xp:1050 },
      { n:'Příčky a rozvody', need:{obklad:18,prkno:16}, xp:1120 },
      { n:'Zateplení',        need:{izolace:22}, xp:1200 },
      { n:'Fasáda a dlažba',  need:{dlazba:24}, xp:1300 }]
  },
  park: {
    name:'Park', dur:16000, money:0, rent:0, reqLvl:27, span:2, park:true,
    boost:[0.15, 0.30, 0.50],
    up:[
      { reqLvl:30, cost:22000, need:{prkno:30,dlazba:18}, dur:20000, xp:3800, label:'Dětské hřiště' },
      { reqLvl:34, cost:60000, need:{tram:30,izolace:24}, dur:26000, xp:9000, label:'Jezírko a altán' }],
    vars:[
      { n:'Anglický',    style:{ wall:C.park,    roof:C.leaf1, roofT:'hip', chim:false }, mix:{} },
      { n:'Francouzský', style:{ wall:'#6E9A55', roof:C.leaf2, roofT:'hip', chim:false }, mix:{prkno:'dlazba'} },
      { n:'Lesopark',    style:{ wall:'#4F7A3E', roof:C.leaf1, roofT:'hip', chim:false }, mix:{dlazba:'tram'} }],
    ph:[
      { n:'Terénní úpravy', need:{sterk:18},   xp:700 },
      { n:'Cestičky',       need:{dlazba:14},  xp:780 },
      { n:'Výsadba',        need:{izolace:12}, xp:840 },
      { n:'Lavičky a plot', need:{prkno:18},   xp:900 }]
  },
  obchodak: {
    name:'Obchodní centrum', dur:30000, money:12000, rent:1100, rentCap:11000,
    reqLvl:33, span:4, big:true, draw:[160,240,340], needPower:true,
    up:[
      { reqLvl:36, cost:120000, need:{dlazba:60,obklad:50}, dur:32000, rentMul:1.7, xp:16000, label:'Druhé patro a kino' },
      { reqLvl:39, cost:320000, need:{tram:90,izolace:80},  dur:40000, rentMul:2.6, xp:34000, label:'Parkovací dům' }],
    vars:[
      { n:'Skleněné', style:{ wall:C.glass,    roof:C.slate, roofT:'hip', chim:false }, mix:{} },
      { n:'Cihlové',  style:{ wall:C.brick,    roof:C.tile,  roofT:'hip', chim:false }, mix:{dlazba:'obklad'} },
      { n:'Betonové', style:{ wall:C.concrete, roof:C.slate, roofT:'hip', chim:false }, mix:{obklad:'dlazba'} }],
    ph:[
      { n:'Výkop a piloty', need:{sterk:70},  xp:2400 },
      { n:'Skelet',         need:{tram:50},   xp:2600 },
      { n:'Obvodový plášť', need:{cihla:80},  xp:2800 },
      { n:'Podlahy',        need:{dlazba:46}, xp:3000 },
      { n:'Interiér',       need:{obklad:44,prkno:40}, xp:3200 },
      { n:'Vzduchotechnika',need:{izolace:50}, xp:3500 }]
  }
};

/* ─── elektrárna ─── */
const PLANT = {
  name:'Elektrárna', span:3, reqLvl:20, dur:22000, cost:9000,
  ph:[
    { n:'Betonové základy', need:{kamen:40}, xp:520 },
    { n:'Nosný skelet',     need:{drevo:34}, xp:560 },
    { n:'Kotelna',          need:{cihla:30}, xp:600 },
    { n:'Strojovna',        need:{cihla:22,sterk:16}, xp:640 },
    { n:'Komín',            need:{cihla:26}, xp:700 },
    { n:'Rozvodna',         need:{prkno:18,balik:12}, xp:760 }],
  turbine:[
    { mw:50,  cost:0,      need:{},                     dur:0,     xp:0,     reqLvl:20 },
    { mw:110, cost:9000,  need:{cihla:40,sterk:30},    dur:20000, xp:2600,  reqLvl:26 },
    { mw:190, cost:26000,  need:{tram:26,dlazba:22},    dur:26000, xp:6400,  reqLvl:31 },
    { mw:300, cost:70000, need:{dlazba:50,obklad:40},  dur:32000, xp:15000, reqLvl:36 }],
  cooling:[
    { cost:0,     need:{},                     dur:0,     xp:0,     reqLvl:20 },
    { cost:11000, need:{sterk:40,cihla:30},    dur:22000, xp:3000,  reqLvl:28 },
    { cost:44000, need:{dlazba:44,izolace:30}, dur:30000, xp:11000, reqLvl:34 }],
  burnBase:18000
};

/* ─── sklad ─── */
const SKLAD_UP = [
  { cap:20,  cost:0,      need:{}, reqLvl:1 },
  { cap:60,  cost:0,      need:{}, reqLvl:5 },
  { cap:110, cost:8000,   need:{drevo:60,kamen:60},   reqLvl:22, xp:1400 },
  { cap:180, cost:20000,  need:{prkno:110,cihla:110}, reqLvl:26, xp:4200 },
  { cap:280, cost:45000,  need:{sterk:180,balik:180}, reqLvl:30, xp:9000 },
  { cap:420, cost:120000, need:{tram:120,dlazba:120}, reqLvl:35, xp:22000 }
];

/* ═══════════ TĚŽEBNÍ STANICE ═══════════ */
function stLine(names, out1, out2) {
  return names.map((nm, i) => ({
    name:nm, lvl:i+1,
    cost:   [300, 1200, 5000, 14000, 40000][i],
    reqLvl: [5, 15, 24, 29, 34][i],
    dur:    [8000, 12000, 18000, 24000, 30000][i],
    cap:    [30, 45, 70, 110, 170][i],
    mul:    [.60, .50, .42, .35, .28][i],
    queue:  [0, 15, 30, 45, 60][i],
    done:   [590, 900, 2600, 6800, 16000][i],
    makes:  i === 0 ? [] : (i >= 3 ? [out1, out2] : [out1]),
    ph: [0,1,2].map(j => ({
      n: ['Základ a plocha','Konstrukce','Vybavení'][j],
      need: i < 2 ? { drevo:[8,10,10][j] + i*6, kamen:[5,6,6][j] + i*4 }
          : i < 4 ? { prkno:[16,20,18][j] + i*4, cihla:[10,12,14][j] + i*4 }
                  : { tram:[18,22,20][j], dlazba:[14,16,18][j] },
      xp: Math.round([120,140,160][j] * Math.pow(2.1, i)) }))
  }));
}
const ST_UP = {
  saw:    stLine(['Pila','Katr','Velká pila','Dřevozávod','Dřevařský kombinát'], 'prkno','tram'),
  quarry: stLine(['Kamenolom','Drtírna','Velký lom','Kamenický závod','Kamenický kombinát'], 'sterk','dlazba'),
  field:  stLine(['Pole','Lisovna','Velká lisovna','Zemědělský závod','Agrokombinát'], 'balik','izolace'),
  pit:    stLine(['Hliniště','Cihelna','Velká cihelna','Keramický závod','Keramický kombinát'], 'cihla','obklad'),
  coal:[
    { name:'Uhelný důl', lvl:1, cost:4000, reqLvl:20, dur:14000, cap:40, mul:.6, queue:0, done:1600, makes:[],
      ph:[{ n:'Odkrytí sloje', need:{prkno:16,cihla:10}, xp:420 },
          { n:'Důlní výztuž',  need:{prkno:20,sterk:12}, xp:460 },
          { n:'Těžní věž',     need:{sterk:18,cihla:14}, xp:500 }] },
    { name:'Hlubinný důl', lvl:2, cost:11000, reqLvl:27, dur:20000, cap:80, mul:.42, queue:0, done:4800, makes:[],
      ph:[{ n:'Hlubinná šachta', need:{cihla:34,sterk:26}, xp:1300 },
          { n:'Důlní vozíky',    need:{prkno:30,sterk:24}, xp:1450 },
          { n:'Třídírna uhlí',   need:{cihla:28,balik:18}, xp:1600 }] },
    { name:'Velkodůl', lvl:3, cost:34000, reqLvl:33, dur:28000, cap:150, mul:.32, queue:0, done:14000, makes:[],
      ph:[{ n:'Odstřel skrývky', need:{dlazba:30,tram:22},  xp:4200 },
          { n:'Pásová doprava',  need:{dlazba:26,obklad:20},xp:4600 },
          { n:'Rypadlo',         need:{tram:34,izolace:22}, xp:5200 }] }
  ]
};
const MAKE_DUR = [0, 0, 9000, 6000, 4000, 2600];

const NODE_DEF = {
  les:   { id:'les',   kind:'saw',    base:'Lesík',          res:'drevo', gx:1,  gy:1,  base_tick:2400 },
  hlina: { id:'hlina', kind:'pit',    base:'Hliniště',       res:'hlina', gx:10, gy:1,  base_tick:3000 },
  lom:   { id:'lom',   kind:'quarry', base:'Kamenité místo', res:'kamen', gx:1,  gy:10, base_tick:3200 },
  pole:  { id:'pole',  kind:'field',  base:'Louka',          res:'slama', gx:10, gy:10, base_tick:2600 },
  uhli:  { id:'uhli',  kind:'coal',   base:'Uhelná sloj',    res:'uhli',  gx:14, gy:10, base_tick:5000, plat:1 }
};

/* ═══════════ PLATFORMY A PARCELY ═══════════ */
const PSZ = 13;
const PLATFORMS = [
  { id:0, name:'Domovský pozemek', ox:0,  oy:0,  reqLvl:1 },
  { id:1, name:'Průmyslová zóna',  ox:13, oy:0,  reqLvl:20 },
  { id:2, name:'Sídliště',         ox:0,  oy:13, reqLvl:24 },
  { id:3, name:'Předměstí',        ox:13, oy:13, reqLvl:27 },
  { id:4, name:'Obchodní zóna',    ox:26, oy:0,  reqLvl:33 }
];
const PARC = {
  p1:{ name:'Parcela 1', gx:5, gy:5, span:2, plat:0, cost:0,    accept:['chatka'], free:true },
  p2:{ name:'Parcela 2', gx:5, gy:1, span:2, plat:0, cost:300,  accept:['sklad'],  after:'p1' },
  p3:{ name:'Parcela 3', gx:1, gy:5, span:3, plat:0, cost:400,  accept:['dvur'],   after:'p2' },
  p4:{ name:'Parcela 4', gx:9, gy:5, span:3, plat:0, cost:3000, accept:['dum'],    reqLvl:15 },
  p5:{ name:'Parcela 5', gx:5, gy:9, span:3, plat:0, cost:6000, accept:['chatka','dum'], reqLvl:18 },

  e1:{ name:'Areál elektrárny', gx:17, gy:5, span:3, plat:1, cost:0, plant:true, free:true },

  s1:{ name:'Sídliště 1', gx:1,  gy:14, span:2, plat:2, cost:5000,  accept:['cinzak'], reqLvl:24 },
  s2:{ name:'Sídliště 2', gx:5,  gy:14, span:2, plat:2, cost:8000,  accept:['cinzak'], reqLvl:25 },
  s3:{ name:'Sídliště 3', gx:10, gy:14, span:2, plat:2, cost:12000, accept:['cinzak'], reqLvl:26 },
  s4:{ name:'Sídliště 4', gx:1,  gy:19, span:2, plat:2, cost:17000, accept:['cinzak'], reqLvl:28 },
  s5:{ name:'Sídliště 5', gx:5,  gy:19, span:2, plat:2, cost:24000, accept:['cinzak'], reqLvl:30 },
  s6:{ name:'Sídliště 6', gx:10, gy:19, span:2, plat:2, cost:34000, accept:['cinzak'], reqLvl:32 },

  v1:{ name:'Vila 1', gx:13, gy:14, span:3, plat:3, cost:12000, accept:['vila'], reqLvl:27 },
  v2:{ name:'Vila 2', gx:20, gy:14, span:3, plat:3, cost:20000, accept:['vila'], reqLvl:29 },
  v3:{ name:'Vila 3', gx:13, gy:22, span:3, plat:3, cost:32000, accept:['vila'], reqLvl:32 },
  v4:{ name:'Vila 4', gx:20, gy:22, span:3, plat:3, cost:50000, accept:['vila'], reqLvl:34 },
  k1:{ name:'Park 1', gx:24, gy:14, span:2, plat:3, cost:9000, accept:['park'], reqLvl:27 },
  k2:{ name:'Park 2', gx:24, gy:22, span:2, plat:3, cost:24000, accept:['park'], reqLvl:31 },

  o1:{ name:'Obchodní centrum', gx:31, gy:9, span:4, plat:4, cost:55000, accept:['obchodak'], reqLvl:33 }
};
const PIDS = Object.keys(PARC);
const spanOf = id => PARC[id].span || 2;

/* ─── mapy ─── */
function homeMap() {
  const m = [];
  for (let y=0;y<PSZ;y++) { let r='';
    for (let x=0;x<PSZ;x++) {
      if (x===4||x===8||y===4||y===8) r += 'R';
      else if (x<4 && y<4) r += 'f';
      else if (x>8 && y<4) r += 'h';
      else if (x<4 && y>8) r += 'S';
      else if (x>8 && y>8) r += 'm';
      else r += '.';
    } m.push(r); }
  return m;
}
function gridMap(g, rows, cols) {
  const m = [];
  for (let y=0;y<PSZ;y++) { let r='';
    for (let x=0;x<PSZ;x++) r += (rows.indexOf(y)>=0 || cols.indexOf(x)>=0) ? 'R' : g;
    m.push(r); }
  return m;
}
const MAP0 = homeMap();
const MAPS = { 0:MAP0, 1:gridMap('D',[4,8],[3,10]), 2:gridMap('.',[4,8],[4,8]),
               3:gridMap('.',[4,8],[3,10]), 4:gridMap('D',[4,8],[3,10]) };
const TCOL = { '.':C.grass, 'm':C.meadow, 'f':C.forest, 'S':C.quarry, 'h':C.clay,
  'R':C.road, 'D':'#6A6B63' };

/* ─── odemykání ─── */
const UNLOCKS = [
  { lv:5,  t:'Sklad',             d:'Postavíš ho na parcele 2 · kapacita 20 → 60 ks' },
  { lv:5,  t:'Vylepšení stanic',  d:'Kapacita 10 → 30 a rychlejší těžba' },
  { lv:12, t:'Přístavba chatek',  d:'Zvýší nájem téměř na dvojnásobek' },
  { lv:6,  t:'Stavební dvůr',     d:'Třetí stavba · odemkne zakázky, hlavní zdroj peněz' },
  { lv:15, t:'Rodinný dům',       d:'Vlastní parcela 3 × 3 na domovském pozemku' },
  { lv:15, t:'Zpracovny surovin', d:'Stanice začnou vyrábět prkna, štěrk, cihly a balíky' },
  { lv:20, t:'Druhá kancelář',    d:'Dvě zakázky najednou' },
  { lv:30, t:'Dispečink a váha',  d:'Tři zakázky najednou' },
  { lv:18, t:'Parcela 5',         d:'Chatka nebo druhý rodinný dům' },
  { lv:20, t:'Průmyslová zóna',   d:'Nová část mapy, otevře se zdarma' },
  { lv:22, t:'Sklad LVL 2',       d:'Kapacita 60 → 110 ks' },
  { lv:24, t:'Sídliště',          d:'Nová část mapy, otevře se zdarma' },
  { lv:24, t:'Velké provozy',     d:'Stanice LVL 3 — dvojnásobná fronta výroby' },
  { lv:26, t:'Sklad LVL 3',       d:'Kapacita 110 → 180 ks' },
  { lv:27, t:'Předměstí',         d:'Nová část mapy s vilami a parky' },
  { lv:30, t:'Sklad LVL 4',       d:'Kapacita 180 → 280 ks' },
  { lv:29, t:'Závody LVL 4',      d:'Nové suroviny — trámy, dlažba, obklady a izolace' },
  { lv:33, t:'Obchodní zóna',     d:'Nová část mapy s obchodním centrem' },
  { lv:34, t:'Kombináty LVL 5',   d:'Největší kapacita a nejrychlejší výroba' }
];


/* ═══════════ ZAKÁZKY ═══════════
   Objednávky na materiál. Platí líp než prodej a dávají hře cíl
   i ve chvíli, kdy zrovna nemáš na co stavět.                       */
const ORDER_TIERS = [
  { id:'fast', n:'Rychlá',  dur:45000,  mul:8,  qty:[10,18], xp:0.9 },
  { id:'mid',  n:'Střední', dur:240000, mul:12, qty:[24,40], xp:1.6 },
  { id:'slow', n:'Velká',   dur:900000, mul:18, qty:[50,90], xp:2.6 }
];
const ORDER_CLIENTS = [
  'Obecní úřad','Stavební firma Novák','Truhlářství U Lípy','Statek Na Kopci',
  'Sousední vesnice','Kamenictví Skála','Cihlářský spolek','Zahradnictví Kvítek',
  'Krajská správa silnic','Družstvo Rozvoj'
];
const ORDER_SLOTS = 4;          // kolik nabídek je vidět
const ORDER_REFRESH = 90000;    // ms než se nabídka obmění
