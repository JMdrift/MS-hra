# Moje Stavba — hra

Izometrický stavitelský tycoon. Vanilla JS + Canvas, žádný build, žádné závislosti.
Nahraj celou složku na GitHub Pages a jede to.

## Soubory

| Soubor | Co dělá |
|---|---|
| `index.html` | kostra stránky, načítá skripty v pořadí |
| `style.css` | veškerý vzhled |
| `data.js` | konfigurace — suroviny, stavby, stanice, parcely, levely |
| `icons.js` | ikony surovin jako inline SVG |
| `state.js` | herní stav, ukládání, doběh času |
| `render.js` | izometrické vykreslování |
| `ui.js` | HUD, panely, oznámení, obrazovky |
| `main.js` | herní logika, ovládání, úkoly, smyčka |
| `sw.js`, `manifest.json` | PWA — offline běh a přidání na plochu |

## Oblasti

Otevírají se levelem a jsou zdarma. Platí se jen parcely a stavby.

| Oblast | LVL | Co v ní je |
|---|---|---|
| Domovský pozemek | 1 | 4 těžební stanice v rozích, 5 parcel |
| Průmyslová zóna | 20 | uhelný důl, elektrárna 3 × 3 |
| Sídliště | 24 | 6 parcel pro činžáky |
| Předměstí | 27 | 4 vily 3 × 3 a 2 parky |
| Obchodní zóna | 33 | obchodní centrum 4 × 4 |

## Zakázky

Hlavní zdroj peněz. Odemkne je **Stavební dvůr** — třetí stavba po skladu,
na parcele 3 od LVL 6 za 400 ¤.
Materiál se odevzdá hned, peníze přijdou po uplynutí času — a zakázka běží,
i když je hra zavřená.

| Typ | Doba | Násobek výkupní ceny |
|---|---|---|
| Rychlá | 45 s | 8× |
| Střední | 4 min | 12× |
| Velká | 15 min | 18× |

Odměna roste s levelem (`ORDER_TIERS` a `lvlMul` ve `state.js`). Nabídka se
obměňuje a každou zakázku jde přehodit.

Dvůr sám nevydělává — funguje jako sklad, je to jen přístup k zakázkám.
Jeho přístavby (LVL 12 a 22) přidávají další slot, takže můžeš mít
až tři zakázky naráz.

## Suroviny

| Stupeň | Suroviny | Odkud |
|---|---|---|
| Základní | dřevo, kámen, sláma, hlína, uhlí | těžební stanice |
| Zpracované | prkna, štěrk, cihly, balíky | stanice od LVL 2 |
| Ušlechtilé | trámy, dlažba, obklady, izolace | závody od LVL 4 |

Stanice mají pět úrovní. Každá zvedne kapacitu, zrychlí těžbu i výrobu
a zvětší frontu (15 → 30 → 45 → 60 kusů). Výroba jednoho kusu klesá
z 9 s na 2,6 s. V záložce Výroba jde zapnout **automat**.

## Elektrická síť

Jedna elektrárna, do které přidáváš **turbíny**. Turbína ale potřebuje
chlazení — jedna chladicí věž uchladí dvě turbíny.

| | 1 turbína | 2 | 3 | 4 |
|---|---|---|---|---|
| Výkon | 50 MW | 110 | 190 | 300 |
| Palivo | 1 uhlí/18 s | 1/9 s | 1/6 s | 1/4,5 s |

Odběr: činžák 20 MW, vila 45 MW, obchodní centrum 160 MW. Vylepšení budovy
odběr zvyšuje. Když dojde uhlí, síť zhasne a budovy na proud nevydělávají.

## Vyvážení

Všechna čísla jsou v `data.js`: `LVL_STEP`, `BUILDINGS`, `ST_UP`, `MAKE_DUR`,
`PLANT`, `SKLAD_UP`, `PARC`, `PLATFORMS`.

## Běh na pozadí

Prohlížeč nedovolí webové stránce počítat, když je zavřená — to platí i pro
aplikaci přidanou na plochu. Hra proto ukládá časové razítko a po návratu
dopočítá, co se mezitím vytěžilo, vyrobilo a nastřádalo na nájmu, nejvýš za
12 hodin (`OFFLINE_MAX` ve `state.js`). Těžba se ale zastaví, jakmile se
stanice naplní — proto se vyplatí zvyšovat kapacitu.
