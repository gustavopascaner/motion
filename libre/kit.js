// Kit base del modo libre (canvas 2D). Lo genérico de cualquier video: tiempo, curvas, sincronía con la voz, texto con
// tipografías de la marca, transiciones de sección, cámara, subtítulos y grano. Lo propio de cada video va en <work>/anim.js.
// Regla de oro: todo es función pura del tiempo T (se renderiza en paralelo y en desorden). Nada de estado entre cuadros.
const C=document.getElementById('c'),X=C.getContext('2d'),FW=DATA.W,FH=DATA.H,U=Math.min(FW,FH)/1080,TAU=Math.PI*2;
const BR=DATA.brand,BC=BR.colors||{};
// colores de la marca por rol; tint() mezcla dos colores (para fondos suaves, sombras, papel)
const hex=h=>{h=h.replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
const tint=(a,b,k)=>{const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('');};
const rgba=(h,a)=>{const[r,g,b]=hex(h);return `rgba(${r},${g},${b},${a})`;};
const COL={light:BC.light||'#F7F4EE',dark:BC.dark||'#1E1E1E',accent:BC.accent||'#E85D3F',accent2:BC.accent2||BC.accent||'#F2C14E',mute:BC.mute||'#888888'};

// ---------- tiempo y curvas ----------
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),P=(t,a,d)=>cl((t-a)/d),L=(a,b,x)=>a+(b-a)*x;
const eo=x=>1-Math.pow(1-cl(x),3),ei=x=>Math.pow(cl(x),3),eio=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
// resorte (pasa un poco de 1 y se asienta): spr(t, inicio, duración)
const spr=(t,a,d=.7)=>{const x=(t-a)/d;if(x<=0)return 0;if(x>=1)return 1;return 1-Math.exp(-5.5*x)*Math.cos(10*x);};
// parpadeo / pulso triangular alrededor de cada instante de la lista
const blinkAt=(t,list,d=.09)=>Math.max(0,...list.map(b=>1-Math.abs(t-b)/d));
// azar con semilla (para posiciones, nunca Math.random)
const rnd=(seed=1)=>{let s=seed%2147483647||1;return()=>(s=(s*16807)%2147483647)/2147483647;};

// ---------- sincronía con la voz ----------
const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const WORDS=DATA.words,BEATS=DATA.beats,TOTAL=DATA.total;
// W('palabra', desde) → segundo en que se dice (primera aparición desde `desde`). Busca lo pronunciado y lo escrito.
function W(w,after=0){const n=norm(w),x=WORDS.find(o=>o.s>=after-.05&&(norm(o.w)===n||(o.d&&norm(o.d)===n)));
  if(!x){const y=WORDS.find(o=>o.s>=after-.05&&(norm(o.w).startsWith(n)||(o.d&&norm(o.d).startsWith(n))));if(y)return y.s;throw new Error(`palabra "${w}" no encontrada después de ${after} s`);}return x.s;}
const WE=(w,after=0)=>{const s=W(w,after);return WORDS.find(o=>o.s===s).e;};   // fin de esa palabra
const B=id=>{const b=BEATS.find(x=>x.id===id);if(!b)throw new Error('beat '+id);return b;};   // {s,e,text}

// ---------- texto (solo 3 tipografías: display, body/bold, mono) ----------
const FF=BR.fonts||{},fam=k=>`"${(FF[k]||FF.body||{}).family||'sans-serif'}"`;
const FONT={display:s=>`${(FF.display||{}).weight||400} ${s}px ${fam('display')}`,body:s=>`400 ${s}px ${fam('body')}`,bold:s=>`${Math.max(700,(FF.body||{}).weight||700)} ${s}px ${fam('body')}`,mono:s=>`400 ${s}px ${fam(FF.mono?'mono':'body')}`};
const UPPER=!!(FF.display||{}).upper;   // si la marca escribe títulos en mayúsculas, txt() lo aplica solo a 'display'
const WARN=new Map();let TRANS=false;   // TRANS: dibujando una transición (no avisar textos corridos)
function setF(f,s,track=0){X.font=FONT[f](s);X.letterSpacing=track+'px';}
function tw(s,f='display',size=100,track=0){X.save();setF(f,size,track);const w=X.measureText(f==='display'&&UPPER?s.toUpperCase():s).width;X.restore();return w;}
// txt(texto, x, y, {f, size, col, align, a, track}) — y = línea de base. Avisa si se sale del cuadro.
function txt(s,x,y,o={}){const{f='display',size=100,col=COL.dark,align='left',a=1,track=0}=o;if(a<=0||!s)return;s=f==='display'&&UPPER?s.toUpperCase():s;
  X.save();X.globalAlpha*=a;setF(f,size,track);X.fillStyle=col;X.textAlign=align;X.textBaseline='alphabetic';
  if(!o.free&&!TRANS){const m=X.getTransform(),w=X.measureText(s).width*Math.abs(m.a),x0=m.a*x+m.e-(align==='center'?w/2:align==='right'?w:0);
    if(Math.abs(m.b)<1e-3&&Math.abs(m.a-1)<1e-3&&(x0<-2||x0+w>FW+2)){const k=`texto fuera del cuadro: "${s}"`;if(!OUTF.has(k)){OUTF.add(k);WARN.set(k,(WARN.get(k)||0)+1);}}}
  X.fillText(s,x,y);X.restore();}
// línea que sube desde una máscara en `at` (y sale hacia arriba en `out`)
function rise(s,x,y,t,at,o={}){const size=o.size||100,p=eo(P(t,at,o.d||.6));if(p<=0)return;const out=o.out!=null?eio(P(t,o.out,.45)):0;if(out>=1)return;
  X.save();X.beginPath();X.rect(-FW,y-size*1.05,FW*3,size*1.45);X.clip();txt(s,x,y+(1-p)*size*1.2-out*size*1.3,o);X.restore();}
// texto que se escribe de izquierda a derecha (lápiz)
function write(s,x,y,t,at,o={}){const p=eo(P(t,at,o.d||.7));if(p<=0)return;const w=tw(s,o.f||'display',o.size||100,o.track||0);
  X.save();X.beginPath();X.rect(x-10,y-(o.size||100)*1.1,(w+20)*p,(o.size||100)*1.5);X.clip();txt(s,x,y,o);X.restore();}
// resaltador detrás de un texto (dibujarlo ANTES del texto)
function marker(x,y,w,size,p,col=COL.accent2){if(p<=0)return;X.save();X.fillStyle=col;X.beginPath();X.roundRect(x-16*U,y-size*.66,(w+32*U)*p,size*.84,14*U);X.fill();X.restore();}
// antetítulo: filete + texto mono en mayúsculas
function kicker(s,x,y,t,at,o={}){const p=eo(P(t,at,.5));if(p<=0)return;const col=o.col||COL.accent,sz=o.size||34*U;X.save();X.globalAlpha*=p*(o.a??1);
  X.fillStyle=col;X.fillRect(x,y-sz*.38,54*U*p,5*U);txt(s.toUpperCase(),x+74*U,y,{f:'mono',size:sz,col,track:4});X.restore();}
// etiqueta en píldora que aparece con resorte (p = spr(...))
function pill(s,x,y,p,o={}){if(p<=0)return;const size=o.size||40*U,f=o.f||'mono',tr=o.track??2,w=tw(s,f,size,tr)+size*1.5,h=size*2.1;
  X.save();X.translate(x,y);X.scale(p,p);X.rotate((1-cl(p))*(o.rot??-.12));X.globalAlpha*=cl(p*2)*(o.a??1);
  X.fillStyle=o.bg||COL.accent;X.beginPath();X.roundRect(-w/2,-h/2,w,h,h/2);X.fill();txt(s,0,size*.36,{f,size,col:o.col||COL.light,align:'center',track:tr,free:1});X.restore();}

// ---------- formas ----------
function bg(c){X.fillStyle=c;X.fillRect(0,0,FW,FH);}
function blob(x,y,r,t,k=.05){X.moveTo(x+r,y);for(let i=1;i<=72;i++){const a=i/72*TAU,rr=r*(1+k*Math.sin(a*3+t*1.1)+k*.6*Math.sin(a*5-t*.8));X.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}X.closePath();}
// polilínea dibujada hasta el progreso p (0–1): para caminos, flechas, trazos a mano
function trace(pts,p,o={}){if(p<=0)return;const seg=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}
  let left=tot*cl(p);X.save();X.strokeStyle=o.col||COL.accent;X.lineWidth=o.w||8*U;X.lineCap='round';X.lineJoin='round';if(o.dash)X.setLineDash(o.dash);
  X.beginPath();X.moveTo(...pts[0]);for(let i=1;i<pts.length&&left>0;i++){const k=Math.min(1,left/seg[i-1]);X.lineTo(L(pts[i-1][0],pts[i][0],k),L(pts[i-1][1],pts[i][1],k));left-=seg[i-1];}
  X.stroke();X.restore();return tot;}
// puntos a lo largo de una polilínea cada `step` px → [{x,y,a}] (a = dirección)
function along(pts,step){const out=[];let acc=0;for(let i=1;i<pts.length;i++){const[x0,y0]=pts[i-1],[x1,y1]=pts[i],len=Math.hypot(x1-x0,y1-y0),a=Math.atan2(y1-y0,x1-x0);
  for(let d=acc;d<len;d+=step)out.push({x:x0+(x1-x0)*d/len,y:y0+(y1-y0)*d/len,a});acc=((acc-len)%step+step)%step;}return out;}

// ---------- cámara ----------
// cam([[t,cx,cy,zoom],…], t) → [cx,cy,z] interpolado con eio · withCam(c, fn): dibuja fn() en coordenadas de mundo
function cam(keys,t){for(let i=0;i<keys.length-1;i++){const[a,x0,y0,z0]=keys[i],[b,x1,y1,z1]=keys[i+1];if(t<=b){const e=eio((t-a)/Math.max(.001,b-a));return[L(x0,x1,e),L(y0,y1,e),L(z0,z1,e)];}}return keys[keys.length-1].slice(1);}
function withCam([cx,cy,z],fn,fy=.52){X.save();X.translate(FW/2,FH*fy);X.scale(z,z);X.translate(-cx,-cy);fn();X.restore();}

// ---------- secciones y transiciones ----------
// SEC(inicio, draw(T), {tr, bg, tone}) — tr: 'up' | 'left' | 'right' | 'down' (hoja de papel que entra) · 'iris' · 'fade' · 'cut'
// tone = fondo dominante para el color de los subtítulos: 'light' | 'dark' | 'accent' | 'accent2' (o definir TONE(T) en anim.js)
const SECTS=[];function SEC(a,draw,o={}){SECTS.push({a,draw,tr:o.tr||'up',bg:o.bg||COL.light,tone:o.tone||'light',dur:o.dur||.6,cx:o.cx??.5,cy:o.cy??.5});SECTS.sort((x,y)=>x.a-y.a);}
const SFX=[];function sfx(spec,t,o={}){SFX.push([spec,t,o]);}   // sonidos manuales: sfx('whoosh', 7.5) · sfx('pop', W('raro'), {gain:.3})
function secAt(T){let i=0;while(i<SECTS.length-1&&T>=SECTS[i+1].a)i++;return i;}
function drawSections(T){const i=secAt(T),s=SECTS[i],p=i>0&&s.tr!=='cut'?P(T,s.a,s.dur):1;
  if(p>=1){s.draw(T);return;}
  const e=eio(p);TRANS=true;try{drawTrans(T,i,s,e);}finally{TRANS=false;}}
function drawTrans(T,i,s,e){SECTS[i-1].draw(T);
  if(s.tr==='fade'){X.save();X.globalAlpha=e;s.draw(T);X.restore();return;}
  if(s.tr==='iris'){X.save();X.beginPath();X.arc(FW*s.cx,FH*s.cy,e*Math.hypot(FW,FH),0,TAU);X.clip();s.draw(T);X.restore();return;}
  X.fillStyle=rgba(COL.dark,.28*e);X.fillRect(0,0,FW,FH);
  const d=s.tr;X.save();X.translate(d==='left'?(1-e)*FW:d==='right'?-(1-e)*FW:0,d==='up'?(1-e)*FH:d==='down'?-(1-e)*FH:0);X.rotate((1-e)*(d==='right'?-.05:.05));
  X.shadowColor=rgba(COL.dark,.4);X.shadowBlur=70*U;X.fillStyle=s.bg;X.beginPath();X.roundRect(0,0,FW,FH+120*U,Math.max(1,80*U*(1-e)));X.fill();X.shadowColor='transparent';X.clip();s.draw(T);X.restore();}

// ---------- subtítulos ----------
const CAP=Object.assign({on:true,size:62,upper:false},BR.captions||{},DATA.cfg.captions===false?{on:false}:{});
const CAPY=FH*(FH>FW?.871:.9);
const CHUNKS=(()=>{const ws=WORDS.map(w=>({...w,t:w.d!=null?w.d:w.w})).filter(w=>w.t!=='');const out=[];let cur=[];
  ws.forEach((w,i)=>{const pv=ws[i-1];if(cur.length&&(cur.length>=3||w.beat!==pv.beat||w.s-pv.e>.3||w.t.length>12||cur.some(y=>y.t.length>12))){out.push(cur);cur=[];}cur.push(w);});if(cur.length)out.push(cur);
  return out.map((c,k)=>({ws:c,s:c[0].s-.04,e:Math.min(c[c.length-1].e+.4,out[k+1]?out[k+1][0].s-.04:1e9)}));})();
function toneAt(T){return typeof TONE==='function'?TONE(T):SECTS.length?SECTS[secAt(T)].tone:'light';}
function captions(T){if(!CAP.on)return;const c=CHUNKS.find(c=>T>=c.s&&T<c.e);if(!c)return;const tn=toneAt(T),onDark=tn==='dark'||tn==='accent';
  const base=onDark?COL.light:COL.dark,act=tn==='accent'?COL.accent2:tn==='dark'?COL.accent2:COL.accent;
  const ws=c.ws.map(w=>{let s=w.t.replace(/[.,:;]+$/,'');return CAP.upper?s.toUpperCase():s;}),size=(CAP.size||62)*U;
  X.save();setF('bold',size);const sp=X.measureText(' ').width,wd=ws.map(s=>X.measureText(s).width);
  // si no entra en el 84% del ancho: achica hasta el 75%; si igual no entra, dos líneas parejas (y achica lo que haga falta)
  const lw=(a,b)=>wd.slice(a,b).reduce((x,y)=>x+y,0)+sp*(b-a-1),fit=FW*.84,tot=lw(0,ws.length);let cut=ws.length,k=Math.min(1,fit/tot);
  if(k<.75&&ws.length>1){cut=1;for(let i=2;i<ws.length;i++)if(Math.max(lw(0,i),lw(i,ws.length))<Math.max(lw(0,cut),lw(cut,ws.length)))cut=i;
   k=Math.min(1,fit/Math.max(lw(0,cut),lw(cut,ws.length)));}
  if(k<1)setF('bold',size*k);const lines=cut<ws.length?[[0,cut],[cut,ws.length]]:[[0,ws.length]];
  const p=eo(P(T,c.s,.18));X.translate(0,(1-p)*14*U);
  lines.forEach(([a,b],j)=>{let x=FW/2-lw(a,b)*k/2;const y=CAPY-(lines.length-1-j)*size*k*1.1;
   for(let i=a;i<b;i++){const on=T>=c.ws[i].s,cur=on&&(i===ws.length-1||T<c.ws[i+1].s);X.fillStyle=cur?act:base;X.globalAlpha=p*(on?1:.55);X.fillText(ws[i],x,y);x+=(wd[i]+sp)*k;}});X.restore();}

// ---------- grano de papel ----------
const NZ=document.createElement('canvas');NZ.width=NZ.height=256;{const g=NZ.getContext('2d'),im=g.createImageData(256,256),r=rnd(7);
  for(let i=0;i<im.data.length;i+=4){const v=r()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}g.putImageData(im,0,0);}
let PAT=null;function grain(T){if((BR.style||{}).grain===false||DATA.cfg.grain===false)return;if(!PAT)PAT=X.createPattern(NZ,'repeat');const f=Math.floor(T*30);
  X.save();X.globalAlpha=.05;X.globalCompositeOperation='overlay';X.translate(-((f*97)%256),-((f*57)%256));X.fillStyle=PAT;X.fillRect(0,0,FW+256,FH+256);X.restore();}

// ---------- cuadro ----------
const OUTF=new Set();   // textos fuera del cuadro en este cuadro (cada uno cuenta una vez por cuadro)
function frame(T){OUTF.clear();X.setTransform(1,0,0,1,0,0);X.globalAlpha=1;X.globalCompositeOperation='source-over';X.letterSpacing='0px';
  if(!SECTS.length)throw new Error('anim.js no definió secciones con SEC()');drawSections(T);
  if(typeof OVERLAY==='function')OVERLAY(T);captions(T);grain(T);}
window.ERR=null;window.onerror=(m,src,line)=>{window.ERR=`${m} (${(src||'').split('/').pop()}:${line})`;};
window.addEventListener('load',()=>{if(window.ERR)return;const fl=['display','body','bold','mono'].map(k=>FONT[k](100));
  Promise.all(fl.map(f=>document.fonts.load(f))).then(()=>{try{frame(0);window.READY=true;}catch(e){window.ERR=String(e.stack||e);}});});
