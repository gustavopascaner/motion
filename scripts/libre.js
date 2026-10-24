#!/usr/bin/env node
// Modo libre: el video se dibuja a mano en canvas (<work>/anim.js + libre/kit.js) en vez de usar el catálogo de placas.
//   node libre.js init <work> [--kit]          → <work>/anim.js (plantilla, si no existe) + <work>/libre/ (index.html, data.js, kit.js)
//   node libre.js stills <work> [--at=1,5.2]   → recorre todo el video buscando errores/avisos + cuadros clave en <work>/stills y <work>/sheet.jpg
//   node libre.js render <work> [--par=8]      → <work>/video.mp4 + timeline.json + sfx.json (después: mix.py, qc.py; o todo con finish.sh)
//   node libre.js log <work>                   → guarda el tratamiento en ~/.config/motion/libre/<marca>.json (historial para no repetir)
//   node libre.js history <marca>              → últimos tratamientos de la marca
// --kit vuelve a copiar el kit de la skill al work (por defecto cada video conserva el kit con el que se hizo).
const fs=require('fs'),path=require('path'),os=require('os'),{spawn,spawnSync}=require('child_process');
const {CHROME,fileURL,logTime}=require('./platform.js');
const SK=path.resolve(__dirname,'..'),ENG=path.join(SK,'engine');
const FORMATS={'9:16':[1080,1920],'1:1':[1080,1080],'4:5':[1080,1350],'16:9':[1920,1080]};
const HIST=path.join(os.homedir(),'.config','motion','libre');
const rj=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const [cmd,WD0,...rest]=process.argv.slice(2);const opt=Object.fromEntries(rest.filter(a=>a.startsWith('--')).map(a=>{const[k,v]=a.slice(2).split('=');return[k,v??true];}));
if(!cmd||!WD0){console.log(fs.readFileSync(__filename,'utf8').split('\n').filter(l=>l.startsWith('//')).join('\n'));process.exit(cmd?1:0);}

function brandOf(slug){const dir=require('./design.js').brandDir(slug),f=path.join(dir,'brand.json');
  if(!fs.existsSync(f))throw new Error(`No existe la marca "${slug}" (${f})`);const b=rj(f),faces=[];
  for(const k in b.fonts||{})for(const x of b.fonts[k].files||[]){const p=path.isAbsolute(x.file)?x.file:path.join(dir,x.file);
    if(!fs.existsSync(p))throw new Error(`Falta la tipografía ${p}: correr brand.py setup ${slug}`);faces.push({family:b.fonts[k].family,weight:x.weight||'400',url:fileURL(p)});}
  return {b,faces};}
function prepare(WD,{kit=false}={}){
  const cfg=rj(path.join(WD,'config.json'));if(!fs.existsSync(path.join(WD,'words.json')))throw new Error('Falta words.json: correr tts.py primero');
  const vo=rj(path.join(WD,'words.json')),[W,H]=FORMATS[cfg.format||'9:16']||cfg.size,fps=cfg.fps||30,total=+(vo.voice_end+(cfg.tail??1.6)).toFixed(3);
  const {b,faces}=brandOf(cfg.brand||'editorial'),LD=path.join(WD,'libre');fs.mkdirSync(LD,{recursive:true});
  const anim=path.join(WD,'anim.js');if(!fs.existsSync(anim))fs.writeFileSync(anim,fs.readFileSync(path.join(SK,'libre','plantilla.js'),'utf8').replace('<NAME>',cfg.name||'VIDEO'));
  if(kit||!fs.existsSync(path.join(LD,'kit.js')))fs.copyFileSync(path.join(SK,'libre','kit.js'),path.join(LD,'kit.js'));
  const data={W,H,fps,total,voice_end:vo.voice_end,words:vo.words.map(w=>({w:w.w,s:w.s,e:w.e,beat:w.beat,...(w.d!=null?{d:w.d}:{})})),
    beats:vo.beats.map(x=>({id:x.id,text:x.text,s:x.s,e:x.e})),brand:{colors:b.colors,fonts:b.fonts,captions:b.captions,style:b.style,name:b.name},
    cfg:{name:cfg.name,keywords:cfg.keywords||[],captions:cfg.captions,grain:cfg.grain}};
  fs.writeFileSync(path.join(LD,'data.js'),'window.DATA='+JSON.stringify(data)+';\n');
  const ff=faces.map(f=>`@font-face{font-family:"${f.family}";src:url("${f.url}");font-weight:${f.weight}}`).join('\n');
  fs.writeFileSync(path.join(LD,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><style>${ff}\nhtml,body{margin:0;background:#000}canvas{display:block}</style></head>
<body><canvas id="c" width="${W}" height="${H}"></canvas><script src="data.js"></script><script src="kit.js"></script><script src="${fileURL(anim)}"></script></body></html>\n`);
  return {cfg,vo,W,H,fps,total,LD};}

async function browser(){const puppeteer=require(path.join(ENG,'node_modules','puppeteer-core'));
  return puppeteer.launch({executablePath:CHROME,headless:true,protocolTimeout:0,args:['--allow-file-access-from-files','--force-device-scale-factor=1','--hide-scrollbars','--disable-web-security']});}
async function page(br,P){const p=await br.newPage();await p.setViewport({width:P.W,height:P.H});await p.goto(fileURL(path.join(P.LD,'index.html')));
  await p.waitForFunction('window.READY===true||!!window.ERR',{timeout:60000});const e=await p.evaluate('window.ERR');if(e)throw new Error('anim.js: '+e);return p;}
const grab=(p,t,q=.95)=>p.evaluate((t,q)=>{try{frame(t);}catch(e){return 'ERR'+(e.stack||e);}return C.toDataURL('image/jpeg',q);},t,q).then(d=>{if(d.startsWith('ERR'))throw new Error(`en ${t.toFixed(2)} s: ${d.slice(3)}`);return Buffer.from(d.slice(d.indexOf(',')+1),'base64');});

// ---------- SFX: misma biblioteca y reglas que render.js (whoosh filtrados, sin nada antes de 0,5 s, máx. sfx_max) ----------
function sfxDir(){const c=[path.join(SK,'assets','sfx'),...['.claude','.codex'].map(d=>path.join(os.homedir(),d,'skills','edicion','assets','sfx'))];
  return c.find(d=>fs.existsSync(path.join(d,'catalog.json'))&&fs.readdirSync(d).some(x=>{try{return fs.readdirSync(path.join(d,x)).some(f=>f.endsWith('.wav'))}catch(e){return false}}))||c[0];}
function resolveSfx(WD,list,max){const SD=sfxDir(),CAT=rj(path.join(SK,'assets','sfx','catalog.json')),LSD=path.join(os.homedir(),'.config','motion','sfx'),LC=path.join(LSD,'catalog.json');
  if(fs.existsSync(LC)){const l=rj(LC);Object.assign(CAT.categories,l.categories||{});for(const[k,v]of Object.entries(l.sounds||{}))CAT.sounds[k]={...v,root:LSD};}
  const rot={},out=[],SOFT=new Set(['whoosh','build','zoom']);let lastId=null;
  if(list.length>max)console.warn(`⚠️  ${list.length} SFX y el máximo es ${max}: quedan los primeros ${max}`);
  for(const[spec,t,o={}]of list.slice().sort((a,b)=>a[1]-b[1]).slice(0,max)){
    let id=spec;const all=Object.keys(CAT.sounds).filter(k=>CAT.sounds[k].cat===spec&&CAT.sounds[k].rotate!==false&&fs.existsSync(path.join(CAT.sounds[k].root||SD,CAT.sounds[k].file)));   // solo los que están
    if(all.length){let k=(rot[spec]=(rot[spec]??-1)+1)%all.length;if(all.length>1&&all[k]===lastId)k=(k+1)%all.length;id=all[k];}
    const m=CAT.sounds[id];if(!m){console.warn(`⚠️  SFX "${spec}" no existe en el catálogo (ver sfx.py list)`);continue;}lastId=id;
    let file=path.join(m.root||SD,m.file);if(!fs.existsSync(file)){console.warn(`⚠️  falta el sonido ${file}`);continue;}
    if(SOFT.has(m.cat)){const f2=path.join(WD,'sfx_soft',id+'.wav');fs.mkdirSync(path.dirname(f2),{recursive:true});
      if(!fs.existsSync(f2))spawnSync('ffmpeg',['-v','error','-y','-i',file,'-af','highpass=f=220:poles=2,highpass=f=220:poles=2,lowpass=f=9000,afade=t=in:d=0.08',f2]);if(fs.existsSync(f2))file=f2;}
    if(t<.5){console.warn(`⚠️  SFX "${id}" en ${t.toFixed(2)} s: se omite (nada de sonidos al arrancar)`);continue;}
    let start=t-m.anchor,sin=0;if(start<0){sin=-start;start=0;}
    out.push({id,file,start:+start.toFixed(3),sin:+sin.toFixed(3),dur:+Math.min(o.dur||m.dur,m.dur-sin).toFixed(3),gain:+(o.gain??CAT.categories[m.cat].gain*(m.gain_adj||1)).toFixed(3),at:+t.toFixed(3),auto:false});}
  return out;}

async function stills(WD){const P=prepare(WD);const br=await browser();try{const p=await page(br,P);
  // recorrido completo (6 cuadros por segundo, sin capturar): errores y textos que quedan fuera del cuadro ≥ 5 muestras (~0,8 s; las entradas animadas no cuentan)
  const scan=await p.evaluate(total=>{const e=[];for(let t=0;t<=total;t+=1/6){try{frame(t);}catch(x){e.push(`${t.toFixed(2)} s: ${x.message}`);if(e.length>5)break;}}
    return {errs:e,warn:[...WARN].filter(([k,n])=>n>=5).map(([k])=>k),secs:SECTS.map(s=>({a:s.a,dur:s.dur,tr:s.tr}))};},P.total);
  const tr=fs.existsSync(path.join(WD,'tratamiento.json'));
  let ts=opt.at&&opt.at!==true?String(opt.at).split(',').map(Number):[...P.vo.beats.map(b=>b.s+(b.e-b.s)*.6),...scan.secs.slice(1).map(s=>s.a+s.dur*.45),P.total-.2];
  ts=[...new Set(ts.map(t=>+Math.max(0,Math.min(P.total-.04,t)).toFixed(2)))].sort((a,b)=>a-b);
  const SD=path.join(WD,'stills');fs.rmSync(SD,{recursive:true,force:true});fs.mkdirSync(SD);
  for(const[i,t]of ts.entries())fs.writeFileSync(path.join(SD,`${String(i+1).padStart(2,'0')}.jpg`),await grab(p,t,.85));
  const port=P.H>P.W,cols=port?8:5,cw=port?170:270;
  spawnSync('ffmpeg',['-v','error','-y','-i',path.join(SD,'%02d.jpg'),'-vf',`scale=${cw}:-1,tile=${cols}x${Math.ceil(ts.length/cols)}:padding=4:color=black`,'-frames:v','1',path.join(WD,'sheet.jpg')]);
  const said=t=>P.vo.words.filter(w=>w.s<=t+.4&&w.e>=t-.8).map(w=>w.w).join(' ');
  console.log(`${scan.secs.length} secciones · ${P.total.toFixed(1)} s · ${P.W}×${P.H}`);
  ts.forEach((t,i)=>console.log(`${String(i+1).padStart(2)}  ${t.toFixed(2).padStart(6)} s  ${said(t)}`));
  scan.errs.forEach(e=>console.log('✗ '+e));scan.warn.forEach(w=>console.log('⚠️  '+w));if(!tr)console.log('⚠️  falta tratamiento.json (idea, mundo, protagonista, metaforas)');
  console.log(`hoja: ${path.join(WD,'sheet.jpg')} (${ts.length} cuadros, en orden; ${cols} por fila)`);if(scan.errs.length)process.exitCode=1;}finally{await br.close();}}

async function render(WD){const t0=Date.now(),P=prepare(WD),N=Math.ceil(P.total*P.fps),K=Math.max(1,Math.min(+(opt.par||8),os.cpus().length));
  const per=Math.ceil(N/K),dir=path.join(WD,'libre','chunks');fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  const br=await browser();let list=[];
  try{await Promise.all(Array.from({length:K},async(_,k)=>{const a=k*per,b=Math.min(N,a+per);if(a>=b)return;const p=await page(br,P),out=path.join(dir,`c${String(k).padStart(2,'0')}.mp4`);
    const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',String(P.fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','23','-pix_fmt','yuv420p','-r',String(P.fps),out],{stdio:['pipe','inherit','inherit']});
    for(let f=a;f<b;f++){const buf=await grab(p,f/P.fps);if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
    ff.stdin.end();await new Promise(r=>ff.on('close',r));
    if(k===0)list=await p.evaluate(()=>SFX);}));}finally{await br.close();}
  const chunks=fs.readdirSync(dir).filter(f=>f.endsWith('.mp4')).sort(),lf=path.join(dir,'list.txt');fs.writeFileSync(lf,chunks.map(f=>`file '${f}'`).join('\n'));
  const r=spawnSync('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',lf,'-c','copy',path.join(WD,'video.mp4')]);if(r.status)throw new Error('falló la unión de segmentos');
  const sfx=resolveSfx(WD,list,P.cfg.sfx_max??6);
  fs.writeFileSync(path.join(WD,'sfx.json'),JSON.stringify(sfx,null,1));
  fs.writeFileSync(path.join(WD,'timeline.json'),JSON.stringify({modo:'libre',total:P.total,W:P.W,H:P.H,fps:P.fps,frames:N},null,1));
  const s=(Date.now()-t0)/1000;logTime(WD,'Render (modo libre)',s);
  console.log(`✓ ${path.join(WD,'video.mp4')} · ${N} cuadros · ${sfx.length} SFX · ${s.toFixed(0)} s`);}

function log(WD){const cfg=rj(path.join(WD,'config.json')),f=path.join(WD,'tratamiento.json');if(!fs.existsSync(f)){console.warn('⚠️  sin tratamiento.json: no se guarda historial');return;}
  const h=path.join(HIST,(cfg.brand||'editorial')+'.json');fs.mkdirSync(HIST,{recursive:true});const all=fs.existsSync(h)?rj(h):[];
  const e={name:cfg.name,work:WD,date:new Date().toISOString().slice(0,10),...rj(f)};const i=all.findIndex(x=>x.work===WD);i>=0?all[i]=e:all.push(e);
  fs.writeFileSync(h,JSON.stringify(all,null,1));console.log(`✓ historial libre de ${cfg.brand}: ${all.length} video(s)`);}
function history(slug){const h=path.join(HIST,slug+'.json');if(!fs.existsSync(h)){console.log(`(sin videos en modo libre para ${slug})`);return;}
  rj(h).slice(-5).forEach(x=>console.log(`- ${x.date} ${x.name}: ${x.idea||''} · mundo: ${x.mundo||''} · protagonista: ${x.protagonista||''}`));}

const WD=cmd==='history'?null:path.resolve(WD0);
({init:async()=>{const P=prepare(WD,{kit:!!opt.kit});console.log(`✓ ${path.join(WD,'anim.js')} · ${P.W}×${P.H} · ${P.total.toFixed(1)} s · kit en ${P.LD}`);},
  stills:()=>stills(WD),render:()=>render(WD),log:async()=>log(WD),history:async()=>history(WD0)}[cmd]||(async()=>{console.error('comando desconocido: '+cmd);process.exit(1);}))()
  .catch(e=>{console.error('✗ '+(e.message||e));process.exit(1);});
