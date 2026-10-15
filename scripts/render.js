// Arma la línea de tiempo (story.js + words.json + marca) y renderiza el video de motion graphics (sin audio).
// uso: node render.js <work> --plan                → escenas, tiempos, SFX y avisos de dirección (no renderiza)
//      node render.js <work> --test [--at=end]     → un cuadro por escena → <work>/test/*.jpg + hoja <work>/sheet.jpg
//      node render.js <work> [--par=6]             → <work>/video.mp4 (después: mix.py)
//      node render.js --brand-preview=<marca> --out=<png> [--format=9:16]   → muestra de la marca (4 escenas)
const fs=require('fs'),path=require('path'),os=require('os'),{spawn,spawnSync}=require('child_process');
const SK=path.join(__dirname,'..'),ENG=path.join(SK,'engine');
const puppeteer=require(path.join(ENG,'node_modules','puppeteer-core'));
const {CHROME,fileURL,logTime}=require('./platform.js');
const arg=k=>{const a=process.argv.find(x=>x.startsWith('--'+k+'='));return a?a.slice(k.length+3):null;};
const FORMATS={'9:16':[1080,1920],'1:1':[1080,1080],'4:5':[1080,1350],'16:9':[1920,1080]};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9%]/g,'');

function loadBrand(slug){const dir=path.isAbsolute(slug)?slug:path.join(SK,'brands',slug);const f=path.join(dir,'brand.json');
  if(!fs.existsSync(f))throw new Error(`No existe la marca "${slug}" (${f}). Ver: $PY scripts/brand.py list`);
  const b=JSON.parse(fs.readFileSync(f,'utf8'));
  for(const k in b.fonts||{})for(const x of b.fonts[k].files||[]){const p=path.isAbsolute(x.file)?x.file:path.join(dir,x.file);
    if(!fs.existsSync(p))throw new Error(`Falta la tipografía ${p}: correr brand.py setup ${slug}`);x.url=fileURL(p);}
  if(b.logo){const p=path.isAbsolute(b.logo)?b.logo:path.join(dir,b.logo);if(fs.existsSync(p))b.logoURL=fileURL(p);else console.warn('⚠️  no encuentro el logo',p);}
  return b;}

// ───── SFX (librería compartida con la skill edicion) ─────
function sfxDir(){const c=[path.join(SK,'assets','sfx'),...['.claude','.codex'].map(d=>path.join(os.homedir(),d,'skills','edicion','assets','sfx'))];
  return c.find(d=>fs.existsSync(path.join(d,'catalog.json'))&&fs.readdirSync(d).some(x=>{try{return fs.readdirSync(path.join(d,x)).some(f=>f.endsWith('.wav'))}catch(e){return false}}))||c[0];}

function build(WD){
  const cfg=JSON.parse(fs.readFileSync(path.join(WD,'config.json'),'utf8'));
  const [W,H]=FORMATS[cfg.format||'9:16']||cfg.size;const FPS=cfg.fps||30;
  const brand=loadBrand(cfg.brand||'editorial');const vo=JSON.parse(fs.readFileSync(path.join(WD,'words.json'),'utf8'));
  const words=vo.words,beats=vo.beats,total=+(vo.voice_end+(cfg.tail??1.6)).toFixed(3);
  const raw=[];const w=(word,n=0)=>({__w:word,n});
  const S=(type,start,p={})=>raw.push({type,start,p});
  const sounds=[];const X=(spec,t,o={})=>sounds.push({spec,t,o,manual:true});
  const H_=t=>`<span class="hlb">${t}</span>`,A_=t=>`<span class="hlc">${t}</span>`;
  delete require.cache[require.resolve(path.join(WD,'story.js'))];
  require(path.join(WD,'story.js'))({S,w,H:H_,A:A_,X,beats,words,brand,cfg});
  if(!raw.length)throw new Error('story.js no definió escenas');
  const beatS=id=>{const b=beats.find(b=>b.id===id);if(!b)throw new Error('no existe el beat '+id);return b.s;};
  const findW=(m,from,to=1e9)=>{const n=norm(m.__w);let k=0;
    for(const pass of['exact','prefix'])for(const x of words){if(x.s<from-.25||x.s>=to)continue;const y=norm(x.w);
      if(pass==='exact'?y===n:y.startsWith(n)){if(k++===m.n)return x.s;}}
    throw new Error(`palabra "${m.__w}"${m.n?' #'+m.n:''} no encontrada después de ${from.toFixed(2)} s`);};
  let prev=0;const sc=raw.map((r,i)=>{let s;
    if(i===0)s=0;else if(typeof r.start==='number')s=r.start;else if(typeof r.start==='string')s=beatS(r.start)-.12;else if(r.start&&r.start.__w)s=findW(r.start,prev)-.12;
    else throw new Error(`escena ${i} (${r.type}): inicio inválido`);prev=s;return {...r,s:+s.toFixed(3)};});
  for(let i=1;i<sc.length;i++)if(sc[i].s<=sc[i-1].s+.3)throw new Error(`escena ${i} (${sc[i].type}) empieza antes o casi junto con la anterior (${sc[i].s} s)`);
  const ROT=['dark','light','dark','accent'],TRS=['wipe','slide','circle','push','zoom'];let ti=0;
  const NOCAP=new Set(['kinetic','quote']);
  sc.forEach((x,i)=>{x.e=i<sc.length-1?sc[i+1].s:total;x.i=i;const p=x.p;
    x.bg=p.bg||(x.type==='image'?'dark':ROT[i%ROT.length]);
    x.tr=i===0?(p.tr||'cut'):p.tr||(()=>{let t;do{t=TRS[ti++%TRS.length]}while(t===sc[i-1].tr);return t;})();
    x.cap=p.cap!==undefined?p.cap:!NOCAP.has(x.type);
    if(x.type==='image'){const src=path.isAbsolute(p.src)?p.src:path.join(WD,p.src);if(!fs.existsSync(src))throw new Error('no existe la imagen '+src);p.url=fileURL(src);}
    const res=v=>v&&v.__w?+(findW(v,x.s,x.e+.3)-x.s).toFixed(3):Array.isArray(v)?v.map(res):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,y])=>[k,res(y)])):v;
    x.p=res(p);x.words=words.filter(y=>y.s>=x.s-.05&&y.s<x.e).map(y=>({w:y.w,s:+(y.s-x.s).toFixed(3),e:+(y.e-x.s).toFixed(3)}));});
  // subtítulos: grupos de hasta 3 palabras (o ~18 caracteres); cortan en pausas y cambios de beat
  const KW=new Set((cfg.keywords||[]).map(norm));const caps=[];let g=null;
  words.forEach((x,i)=>{const pv=words[i-1];
    if(!g||g.words.length>=3||g.words.map(y=>y.w).join(' ').length+x.w.length>18||x.s-pv.e>.35||x.beat!==pv.beat){if(g)caps.push(g);g={s:x.s,words:[]};}
    g.words.push({w:x.w,s:x.s,e:x.e,k:KW.has(norm(x.w))});});if(g)caps.push(g);
  caps.forEach((c,i)=>{c.e=+Math.min(caps[i+1]?caps[i+1].s:total,c.words[c.words.length-1].e+.45).toFixed(3);});
  const capsOn=cfg.captions??(brand.captions||{}).on??true;
  // ───── diseño sonoro automático (pocos y sutiles) ─────
  const SD=sfxDir(),CAT=JSON.parse(fs.readFileSync(path.join(SK,'assets','sfx','catalog.json'),'utf8'));
  const AUTO={bigword:p=>[['hit',p.at??.2,10]],stat:p=>[['ding',p.countEnd??((p.at??.25)+1.2),7]],donut:p=>[['ding',(p.at??.3)+1.3,6]],
    cta:p=>p.action==='comment'?[['click',(p.btnAt??1.4)+.75,8]]:[['click',p.btnAt??1.4,8]],question:()=>[['pop',.1,4]],
    list:p=>p.items.map((it,k)=>[it.mark==='x'?'error':it.mark==='check'?'ding':'pop',it.at??(.4+k*.3),2]),icons:p=>p.items.map((it,k)=>['pop',it.at??(.35+k*.25),2]),
    steps:p=>p.items.map((it,k)=>['pop',it.at??(.4+k*.4),2]),phone:p=>(p.msgs||[]).map((m,k)=>['pop',m.at??(.4+k*.7),3])};
  const ev=[...sounds];
  for(const x of sc){const p=x.p;if(p.sfx===null)continue;
    if(p.sfx){(Array.isArray(p.sfx)?p.sfx:[p.sfx]).forEach(q=>{const [spec,at=0,o={}]=Array.isArray(q)?q:[q];ev.push({spec,t:x.s+at,o,manual:true});});continue;}
    if(x.tr!=='cut'||x.i===0)ev.push({spec:'whoosh',t:x.s+(x.i===0?0:.05),o:{},score:x.i===0?9:5});
    for(const [spec,at,score] of (AUTO[x.type]||(()=>[]))(p))if(at<x.e-x.s)ev.push({spec,t:x.s+at,o:{},score});}
  const MAX=cfg.sfx_max??6,SEP=Math.max(3,Math.min(6,total/(MAX*1.6)));const kept=ev.filter(e=>e.manual);
  for(const e of ev.filter(e=>!e.manual).sort((a,b)=>b.score-a.score||a.t-b.t)){if(kept.length>=MAX)break;if(kept.some(k=>Math.abs(k.t-e.t)<SEP))continue;kept.push(e);}
  const rot={};let lastId=null;const sfx=[],missing=new Set();
  for(const e of kept.sort((a,b)=>a.t-b.t)){
    let id=e.spec;const all=Object.keys(CAT.sounds).filter(k=>CAT.sounds[k].cat===e.spec&&CAT.sounds[k].rotate!==false);
    if(all.length){let k=(rot[e.spec]=(rot[e.spec]??-1)+1)%all.length;if(all.length>1&&all[k]===lastId)k=(k+1)%all.length;id=all[k];}
    const m=CAT.sounds[id];if(!m){console.warn(`⚠️  SFX "${e.spec}" no existe en el catálogo`);continue;}lastId=id;
    const file=path.join(SD,m.file);if(!fs.existsSync(file)){missing.add(id);continue;}
    let start=e.t-m.anchor,sin=0;if(start<0){sin=-start;start=0;}
    sfx.push({id,file,start:+start.toFixed(3),sin:+sin.toFixed(3),dur:+Math.min(e.o.dur||m.dur,m.dur-sin).toFixed(3),gain:e.o.gain??CAT.categories[m.cat].gain,at:+e.t.toFixed(3),auto:!e.manual});}
  if(missing.size)console.warn('⚠️  Faltan sonidos de la librería (se omiten):',[...missing].join(', '));
  const scenes=sc.map(x=>({type:x.type,s:x.s,e:x.e,bg:x.bg,tr:x.tr,cap:x.cap,p:x.p,words:x.words}));
  const tl={W,H,fps:FPS,total,brand,scenes,caps,capsOn,logoCorner:cfg.logo_corner};
  fs.writeFileSync(path.join(WD,'timeline.json'),JSON.stringify(tl,null,1));
  fs.writeFileSync(path.join(WD,'sfx.json'),JSON.stringify(sfx,null,1));
  fs.writeFileSync(path.join(WD,'captions.json'),JSON.stringify(caps,null,1));
  return {cfg,tl,sfx,vo};}

// ───── revisión de dirección ─────
function review(tl,vo){const w=[],S=tl.scenes;
  S.forEach((x,i)=>{const D=x.e-x.s,ats=JSON.stringify(x.p).match(/"(at|[a-z]+At|countEnd)":\s*[\d.]+/g)||[];
    const lastAt=Math.max(0,...ats.map(a=>+a.split(':')[1]));
    if(D<1.3)w.push(`escena ${i} (${x.type}) dura ${D.toFixed(1)} s: muy rápida, unirla con la vecina`);
    if(D>7&&lastAt<D-4&&x.type!=='kinetic'&&x.type!=='quote')w.push(`escena ${i} (${x.type}) dura ${D.toFixed(1)} s sin eventos internos después de ${lastAt.toFixed(1)} s: partirla o sumar ítems sincronizados`);
    if(i&&S[i-1].type===x.type&&x.type!=='kinetic')w.push(`escenas ${i-1} y ${i} son ambas "${x.type}": variar`);
    if(i>1&&S[i-1].type==='kinetic'&&S[i-2].type==='kinetic'&&x.type==='kinetic')w.push(`3 "kinetic" seguidas en ${i}: meter una escena gráfica (stat, list, icons…)`);
    if(x.type==='kinetic'&&(x.p.text||x.words.map(y=>y.w).join(' ')).split(/\s+/).length>14)w.push(`escena ${i} (kinetic) tiene más de 14 palabras: usar "text" con la frase clave`);
    if(Object.keys(x.p).some(k=>/^(at|.*At|countEnd)$/.test(k)&&x.p[k]>D))w.push(`escena ${i}: un tiempo interno cae después del final de la escena`);});
  if(S[S.length-1].type!=='cta')w.push('la última escena no es un "cta"');
  if(S[0].e>4)w.push(`el gancho dura ${S[0].e.toFixed(1)} s: el primer cambio de imagen tendría que llegar antes de los 3–4 s`);
  const n=S.length,T=tl.total;if(T/n>5.5)w.push(`${n} escenas en ${T.toFixed(0)} s (una cada ${(T/n).toFixed(1)} s): sumar escenas, el ritmo ideal es una cada 3–5 s`);
  return w;}

function plan(WD){const {tl,sfx,vo}=build(WD);
  console.log(`Formato ${tl.W}×${tl.H} · duración ${tl.total.toFixed(1)} s · ${tl.scenes.length} escenas · subtítulos ${tl.capsOn?'sí':'no'}`);
  tl.scenes.forEach((x,i)=>console.log(`${String(i).padStart(2)} ${x.type.padEnd(9)} ${x.s.toFixed(2).padStart(6)}–${x.e.toFixed(2).padStart(6)} (${(x.e-x.s).toFixed(1)} s)  bg ${x.bg.padEnd(7)} tr ${x.tr.padEnd(6)}${x.cap?'':' sin subt.'}  ${(x.p.lines||[x.p.kick||x.p.text||x.p.word||x.p.title||''])[0].toString().replace(/<[^>]+>/g,'').slice(0,40)}`));
  console.log('SFX:\n'+(sfx.map(x=>`  ${x.at.toFixed(2).padStart(6)}  ${x.id.padEnd(16)} gain ${x.gain}${x.auto?'  (auto)':''}`).join('\n')||'  (ninguno)'));
  const w=review(tl,vo);console.log(w.length?'\nDirección:\n'+w.map(x=>'⚠️  '+x).join('\n'):'\nDirección: ✓ sin avisos');}

async function withPages(tl,n,fn){if(!CHROME)throw new Error('No encuentro Chrome. Instalalo o definí CHROME=/ruta');
  const br=await puppeteer.launch({executablePath:CHROME,headless:true,args:['--allow-file-access-from-files','--force-device-scale-factor=1','--hide-scrollbars','--disable-web-security']});
  try{return await Promise.all(Array.from({length:n},async(_,k)=>{const pg=await br.newPage();await pg.setViewport({width:tl.W,height:tl.H,deviceScaleFactor:1});
    pg.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.warn('  [engine]',m.text());});
    await pg.goto(fileURL(path.join(ENG,'engine.html')));const fits=await pg.evaluate(c=>init(c),tl);const r=await fn(pg,k,fits);await pg.close();return r;}));}
  finally{await br.close();}}

async function test(WD){const {tl}=build(WD);const dir=path.join(WD,'test');fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  const at=arg('at')||'end';
  await withPages(tl,1,async(pg,k,fits)=>{fits.filter(f=>f.scale<.62).forEach(f=>console.warn(`⚠️  escena ${f.i} (${f.type}) se achicó al ${Math.round(f.scale*100)} %: demasiado texto, acortar`));
    for(const [i,x] of tl.scenes.entries()){const D=x.e-x.s;const ts=at==='end'?[x.e-.12]:at.split(',').map(v=>x.s+(v==='mid'?D/2:v==='end'?D-.12:+v));
      for(const [j,t] of ts.entries()){await pg.evaluate(t=>frame(t),t);await pg.screenshot({path:path.join(dir,`${String(i).padStart(2,'0')}${ts.length>1?'_'+j:''}.jpg`),type:'jpeg',quality:80});}}});
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.jpg')).sort();const cols=Math.min(6,files.length),sw=tl.W>tl.H?480:300;
  const list=path.join(dir,'list.txt');fs.writeFileSync(list,files.map(f=>`file '${path.join(dir,f).replace(/'/g,"'\\''")}'`).join('\n'));
  const out=path.join(WD,'sheet.jpg');spawnSync('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',list,'-vf',`scale=${sw}:-2,tile=${cols}x${Math.ceil(files.length/cols)}:padding=6:color=0x222222`,'-frames:v','1','-update','1',out]);
  console.log('hoja:',out,`(${files.length} cuadros, en orden de escena)`);}

async function full(WD){const t0=Date.now();const {tl}=build(WD);const par=+(arg('par')||Math.min(6,Math.max(2,os.cpus().length-2)));
  const nf=Math.ceil(tl.total*tl.fps),per=Math.ceil(nf/par),dir=path.join(WD,'chunks');fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  let done=0;const tick=setInterval(()=>process.stdout.write(`\r  ${done}/${nf} cuadros`),2000);
  await withPages(tl,par,async(pg,k)=>{const a=k*per,b=Math.min(nf,a+per);if(a>=b)return;
    const out=path.join(dir,`c${String(k).padStart(2,'0')}.mp4`);
    const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(tl.fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r',String(tl.fps),out]);
    const end=new Promise(r=>ff.on('close',r));
    for(let f=a;f<b;f++){await pg.evaluate(t=>frame(t),f/tl.fps);const buf=await pg.screenshot({type:'jpeg',quality:93,optimizeForSpeed:true});
      if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));done++;}
    ff.stdin.end();await end;});
  clearInterval(tick);const chunks=fs.readdirSync(dir).filter(f=>f.endsWith('.mp4')).sort();const list=path.join(dir,'list.txt');
  fs.writeFileSync(list,chunks.map(f=>`file '${path.join(dir,f).replace(/'/g,"'\\''")}'`).join('\n'));
  const out=path.join(WD,'video.mp4');const r=spawnSync('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',list,'-c','copy',out]);
  if(r.status)throw new Error('falló la unión de partes');fs.rmSync(dir,{recursive:true,force:true});
  const secs=(Date.now()-t0)/1000;console.log(`\n✓ ${out} (${nf} cuadros en ${secs.toFixed(0)} s)`);logTime(WD,'Render de video',secs);}

async function brandPreview(slug,out,fmt){const [W,H]=FORMATS[fmt||'9:16'];const brand=loadBrand(slug);
  const sc=[{type:'title',bg:'dark',p:{kick:'TU MARCA',lines:['TÍTULO','CON <span class="hlb">ESTILO</span>'],sub:'y un acento elegante'}},
    {type:'stat',bg:'light',p:{kick:'DATO',value:73,suffix:'%',label:'DE TUS CLIENTES',sub:'Fuente: ejemplo'}},
    {type:'list',bg:'accent',p:{kick:'PASOS',title:'CÓMO EMPEZAR',items:[{t:'Definí tu objetivo',mark:'check'},{t:'Medí lo que hacés',mark:'check'},{t:'Repetí lo que funciona',mark:'check'}]}},
    {type:'cta',bg:'dark',p:{kick:'¿TE SIRVIÓ?',lines:['SEGUIME'],btnAt:.5}}];
  const tl={W,H,fps:30,total:12,brand,capsOn:(brand.captions||{}).on!==false,caps:[],scenes:sc.map((x,i)=>({...x,s:i*3,e:i*3+3,tr:'cut',cap:true,words:[]}))};
  tl.caps=sc.map((x,i)=>({s:i*3,e:i*3+3,words:'así se ven los subtítulos'.split(' ').map((w,k)=>({w,s:i*3+k*.2,e:i*3+k*.2+.2,k:k===3}))}));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bp'));
  await withPages(tl,1,async pg=>{for(let i=0;i<4;i++){await pg.evaluate(t=>frame(t),i*3+2.9);await pg.screenshot({path:path.join(dir,`${i}.jpg`),type:'jpeg',quality:85});}});
  spawnSync('ffmpeg',['-v','error','-y','-i',path.join(dir,'%d.jpg'),'-vf',`scale=${W>H?640:400}:-2,tile=${W>H?2:4}x${W>H?2:1}:padding=8:color=0x222222`,'-frames:v','1','-update','1',out]);
  console.log('muestra:',out);}

(async()=>{const bp=arg('brand-preview');if(bp)return brandPreview(bp,arg('out')||path.join(process.cwd(),`marca_${path.basename(bp)}.jpg`),arg('format'));
  const WD=path.resolve(process.argv[2]);
  if(process.argv.includes('--plan'))plan(WD);else if(process.argv.includes('--test'))await test(WD);else await full(WD);})().catch(e=>{console.error('✗',e.message);process.exit(1);});
