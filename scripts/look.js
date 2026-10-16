// Dirección de arte por video: genera <work>/look.json (diseño distinto en cada video, dentro de la marca) y lleva el historial por marca.
// uso: node look.js new <work> [--tono=energico|calido|institucional|humor|sobrio] [--seed=N] [--force]
//      node look.js show <work>     → resume el look y cuánto se parece a los anteriores de la marca
//      node look.js log <work>      → al entregar: guarda look + firmas de scenes.js en ~/.config/motion/looks/<marca>.json
// La tipografía, los colores y el logo vienen siempre de la marca; brand.json → "design": {"lock": {...}} fija tokens que no deben variar.
const fs=require('fs'),path=require('path');
const D=require('./design.js');
const SK=path.join(__dirname,'..');
const arg=k=>{const a=process.argv.find(x=>x.startsWith('--'+k+'='));return a?a.slice(k.length+3):null;};

function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}   // mulberry32
// elección ponderada: opts = {valor: peso}
const pick=(r,opts)=>{const e=Object.entries(opts).filter(([,w])=>w>0),tot=e.reduce((a,[,w])=>a+w,0);let x=r()*tot;for(const [k,w] of e){if((x-=w)<=0)return k;}return e[e.length-1][0];};

// sesgos por tono (multiplican el peso base 1)
const TONE={
  energico:{motion:{snappy:4,bouncy:1.5,smooth:.3},palette:{blocks:3,dark:2},trans:{sharp:3,graphic:2},decor:{stripes:2,glyph:2,lines:1.5},hl:{box:2,pill:1.5},cam:{zoom:2,pull:1.5}},
  calido:{motion:{smooth:4,snappy:.5,bouncy:.4},palette:{light:3,classic:1.5},trans:{fluid:3},decor:{blobs:2,sun:3,gradient:2},hl:{marker:3,pill:2},radius:{56:3,36:2},panel:{soft:2,solid:2}},
  institucional:{motion:{smooth:2,snappy:2,bouncy:.2},palette:{light:2,duo:2},trans:{editorial:3},decor:{grid:0,lines:3,glyph:1.5,orbit:1.5},hl:{underline:3,box:1.5},frame:{column:3,border:2},panel:{outline:3,flat:2},radius:{0:2,12:2}},
  humor:{motion:{bouncy:4,smooth:.5},palette:{blocks:2,accent2:2},trans:{fluid:2,graphic:2},decor:{dots:3,halftone:2,orbit:2},hl:{pill:3,outline:2},panel:{offset:4},captions:{box:3}},
  sobrio:{motion:{snappy:2,smooth:2,bouncy:.2},palette:{dark:3,light:2},trans:{editorial:2,sharp:2},decor:{lines:3,glyph:2,orbit:2},frame:{corners:3},hl:{underline:2,outline:2},panel:{outline:2,flat:2},cam:{drift:2,none:2}}};
const TRANS_FAM={sharp:['cut','wipex','split'],fluid:['circle','zoom','shape'],editorial:['wipe','slide','push'],graphic:['diag','blinds','wipex']};

function candidate(r,tone,brand,prev){const T=TONE[tone]||{},w=(k,base)=>{const o={};for(const x of base)o[x]=((T[k]||{})[x]??1);return o;};
  const has2=!!brand.colors.accent2,L={};
  L.palette=pick(r,w('palette',['classic','dark','light','blocks','duo',...(has2?['accent2']:[])]));
  L.hlPrefer=has2&&r()<.3?'accent2':'accent';
  L.align=pick(r,{left:5,center:2,mixed:1.5,right:.6});
  L.valign=pick(r,{center:6,top:2.5,bottom:1.5});
  L.frame=pick(r,{none:4,...w('frame',['border','corners','column'])});if(L.frame==='column'&&L.align!=='left')L.align='left';
  L.scale=+pick(r,{'0.9':1,'1':2,'1.1':1.5});
  L.kick=pick(r,w('kick',['dot','line','number','bracket','tag','plain']));
  L.kickFont=L.kick==='tag'?'mono':pick(r,{mono:3,accent:1,body:1.5});
  L.hl=pick(r,w('hl',['box','underline','marker','outline','pill']));
  L.panel=pick(r,w('panel',['soft','outline','solid','offset','flat']));
  L.radius=+pick(r,w('radius',['0','12','24','36','56']));
  const shape=pick(r,w('decor',D.DECOR)),busy=['dots','halftone','stripes'].includes(shape);
  L.decor=[shape,...(!busy&&r()<((T.decor||{}).grid??.35)?['grid']:[]),...(r()<.75?['grain']:[])];
  L.motion=pick(r,w('motion',['snappy','smooth','bouncy']));
  L.cam=pick(r,w('cam',['zoom','pull','drift','none']));
  const fam=pick(r,w('trans',Object.keys(TRANS_FAM)));L.transitions=[...TRANS_FAM[fam]];
  if(r()<.4){const extra=D.TRANSITIONS.filter(x=>!L.transitions.includes(x));L.transitions.push(extra[Math.floor(r()*extra.length)]);}
  L.captions=pick(r,w('captions',['color','box','underline']));
  L.variants={};for(const [t,vs] of Object.entries(D.VARIANTS)){const pv=((prev||{}).variants||{})[t];const opts=vs.filter(v=>v!==pv);L.variants[t]=opts[Math.floor(r()*opts.length)];}
  return L;}

// afinidad del look con el tono (cuántos tokens caen en opciones favorecidas)
function fit(L,tone){const T=TONE[tone];if(!T)return 0;let n=0;const fav=(k,v)=>((T[k]||{})[v]??1)>1;
  for(const k of['motion','palette','hl','panel','frame','cam','captions'])if(fav(k,L[k]))n++;if(fav('radius',String(L.radius)))n++;
  if((L.decor||[]).some(d=>fav('decor',d)))n++;for(const [f,ts] of Object.entries(TRANS_FAM))if(fav('trans',f)&&ts.every(t=>L.transitions.includes(t)))n++;return n;}
function readCfg(WD){const f=path.join(WD,'config.json');if(!fs.existsSync(f))throw new Error('falta '+f);return JSON.parse(fs.readFileSync(f,'utf8'));}
function readBrand(slug){const f=path.join(D.brandDir(slug),'brand.json');return JSON.parse(fs.readFileSync(f,'utf8'));}

function cmdNew(WD){const cfg=readCfg(WD),slug=cfg.brand||'editorial',brand=readBrand(slug),lock=(brand.design||{}).lock||{};
  const out=path.join(WD,'look.json');if(fs.existsSync(out)&&!process.argv.includes('--force'))throw new Error('ya existe look.json (editarlo, o --force para generar otro)');
  const tone=arg('tono')||'',seed=+(arg('seed')||Date.now()%100000),r=rng(seed),hist=D.history(slug,WD),last=hist.slice(-5).map(x=>x.look||{});
  // muchos candidatos coherentes → el más distinto de los últimos looks de la marca
  let best=null;for(let i=0;i<60;i++){const c={...candidate(r,tone,brand,last[last.length-1]),...lock};const s=last.length?Math.max(...last.map(x=>D.lookSim(c,x))):0;
    const sc=s-.08*fit(c,tone);if(!best||sc<best.sc)best={c,s,sc};}
  const look={concepto:'(escribir en una línea la idea visual de este video)',concept_idea:'(qué cuenta el concept sin texto, en una línea: "una onda va y vuelve entre dos burbujas")',tono:tone||null,seed,...best.c};
  fs.writeFileSync(out,JSON.stringify(look,null,1));
  console.log(`✓ ${out}${last.length?` (parecido máx. con los ${last.length} anteriores: ${Math.round(best.s*100)} %)`:''}`);show(look);
  console.log('→ ajustar a mano lo que haga falta según el guion, escribir "concepto" y mirar: node render.js <work> --look-preview');}

function show(L){const v=Object.entries(L.variants||{}).map(([k,x])=>`${k}:${x}`).join(' ');
  console.log(`  paleta ${L.palette} · resaltado ${L.hl} (${L.hlPrefer}) · kick ${L.kick}/${L.kickFont} · paneles ${L.panel} r${L.radius}
  decorado ${(L.decor||[]).join('+')} · marco ${L.frame} · alineación ${L.align}/${L.valign} · escala ${L.scale}
  movimiento ${L.motion} · cámara ${L.cam} · transiciones ${(L.transitions||[]).join(',')} · subtítulos ${L.captions}
  variantes ${v}`);}

function cmdShow(WD){const cfg=readCfg(WD),f=path.join(WD,'look.json');if(!fs.existsSync(f))throw new Error('no hay look.json: node look.js new '+WD);
  const L=JSON.parse(fs.readFileSync(f,'utf8'));console.log(L.concepto||'');show(L);
  for(const x of D.history(cfg.brand||'editorial',WD).slice(-5))console.log(`  ${Math.round(D.lookSim(L,x.look||{})*100).toString().padStart(3)} % parecido a ${x.name} (${x.date})`);}

function cmdLog(WD){const cfg=readCfg(WD),slug=cfg.brand||'editorial',f=path.join(WD,'look.json');
  const look=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};const defs=D.customDefs(path.join(WD,'scenes.js'));
  const hf=D.historyFile(slug);fs.mkdirSync(D.LOOKS_DIR,{recursive:true});
  const all=fs.existsSync(hf)?JSON.parse(fs.readFileSync(hf,'utf8')).filter(x=>path.resolve(x.work||'')!==path.resolve(WD)):[];
  all.push({name:cfg.name,work:path.resolve(WD),date:new Date().toISOString().slice(0,10),look,idea:look.concept_idea||null,
    motifs:defs.filter(d=>d.kind==='MOT').map(({name,hash})=>({name,hash})),scenes:defs.filter(d=>d.kind==='SC').map(({name,hash})=>({name,hash}))});
  fs.writeFileSync(hf,JSON.stringify(all,null,1));console.log(`✓ look de ${cfg.name} guardado en ${hf} (${all.length} videos de la marca)`);}

try{const [cmd,wd]=process.argv.slice(2);if(!wd)throw new Error('uso: node look.js new|show|log <work> [--tono=…] [--seed=N]');const WD=path.resolve(wd);
  ({new:cmdNew,show:cmdShow,log:cmdLog}[cmd]||(()=>{throw new Error('comando desconocido: '+cmd)}))(WD);}
catch(e){console.error('✗',e.message);process.exit(1);}
