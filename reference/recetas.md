# Recetario de animación (`<work>/scenes.js`)

Recetas probadas en el motor para adaptar en `scenes.js` (placas `SC.*` y concepts `MOT.*`). **Leer solo el índice** y después solo las 2–4 recetas que sirvan para el tratamiento del video; adaptarlas (tamaños, colores de rol, tiempos, forma), nunca copiarlas tal cual. Todas son funciones puras del tiempo, usan solo `var(--fg|bg|hl|hl2|hlfg|sub)` / `FG HL HL2 SUB` y heredan el look (`M.ease`, `M.pop`, `look.blur`, `look.depth`).
Helpers que usan (detalle en `api.md`): `sp(t,a,d)` resorte · `ST(i,step)` escalonado · `shake(t,at,amp,dur)` → `[dx,dy]` · `mb(el,dx,dy)` desenfoque de movimiento (dx/dy = px movidos en este cuadro: calcular en `t` y `t-DT()`) · `flipIn` / `fold` giros 3D · `rise` / `popIn` / `fadeUp` · `split` · `rnd(seed)`.

| receta | qué cuenta | para ideas como… |
|---|---|---|
| [R01 · Contador con slam](#r01) | el número cae desde 2,4x desenfocado, sacude, cuenta y vuelve a golpear al llegar | porcentajes, cifras de impacto, “7 de cada 10” |
| [R02 · Línea de tiempo que se llena](#r02) | una barra avanza y cada hito salta con resorte en su palabra | plazos, etapas, “a las 48 h”, antes/durante/después |
| [R03 · Objeto héroe que reaparece](#r03) | la misma forma (píldora del resaltado) vuelve en varias escenas y pasa de una a otra con `tr:'morph'` | hilo conductor del video: un turno, un mensaje, una pastilla, el paciente |
| [R04 · Reveal por capas](#r04) | tres paneles de color barren escalonados y el texto sube encima | títulos de sección, remates, cambio de tema |
| [R05 · Texto que se arma y se rompe](#r05) | las letras llegan desde lejos con resorte y en `breakAt` estallan | “romper un mito”, caos → orden, algo que se desarma |
| [R06 · Máscara con forma](#r06) | un círculo del resaltado revela la palabra llena sobre su fantasma y se vuelve rectángulo | foco, lupa, “lo importante es…” |
| [R07 · Parallax de 3 capas](#r07) | fondo lejano lento, anillos medios más rápidos y el texto adelante el más rápido | viajes, recorridos, profundidad, momentos de respiro |
| [R08 · Gráfico que se construye en 3D](#r08) | barras con canto que crecen con resorte sobre un plano en perspectiva que gira lento | crecimiento, comparar años, resultados |
| [R09 · Tarjetas que giran](#r09) | una grilla de tarjetas entra girando en Y, escalonadas | pilares, beneficios, 4 conceptos |
| [R10 · Lista que se despliega](#r10) | cada ítem se despliega desde arriba como un papel | pasos, checklist, requisitos |
| [R11 · Palabra tachada y reemplazada](#r11) | la idea vieja se tacha y la nueva cae encima con slam y sacudida | mito/realidad, “no es X, es Y” |
| [R12 · Concept: órbita que encaja](#r12) | puntos que giran sueltos y en el momento clave encajan con resorte en un anillo; el centro late | orden, sistema, equipo, “todo encaja” |
| [R13 · Antes / después con cortina](#r13) | una cortina con filete barre y revela el “después” sobre el “antes” | transformaciones, resultados, comparaciones |
| [R14 · Marquesina cinética](#r14) | tres filas de texto gigante corren en sentidos opuestos (la del medio en color) | cierres, CTA, frases-mantra, energía |

**Reglas:** el desenfoque explícito (`filter:blur()`) solo mientras el elemento se mueve (si no, `''`) · nada de estado entre cuadros (se renderiza en paralelo y en desorden) · lo que desborda a propósito (marquesinas, partículas) va fuera del fitbox (`c.inner.insertBefore(host,c.box.parentNode.parentNode)`) para que `fit` no achique la escena · probar con `node render.js <work> --test --at=0.2,<momento clave>,end`.

<a id="r01"></a>
## R01 · Contador con slam
el número cae desde 2,4x desenfocado, sacude, cuenta y vuelve a golpear al llegar. Técnica: `shake` dos veces (impacto y llegada) · resorte `sp` en el golpe final · desenfoque solo durante la caída.
```js
SC.contador_slam=(p,c)=>{const b=c.box;AL(b,p,c);const k=p.kick?kick(b,p.kick):null;
 const n=h('div',`font-size:${p.size||420}px;color:var(--hl);line-height:.9;font-variant-numeric:tabular-nums;display:inline-block;transform-origin:30% 70%`,h('div','',b),'0','disp nw');
 const lab=p.label?ml(b,p.label,'font-size:90px;margin-top:20px','disp'):null;
 const a=p.at??.3,e=p.countEnd??a+1.1;   // cae en "a", cuenta hasta "e" y golpea otra vez al llegar
 return t=>{if(k)fadeUp(k,t,.05);const q=P(t,a,.18);n.style.opacity=P(t,a,.04);
  n.style.transform=`scale(${q<1?L(2.4,1,q*q):1+.08*(1-sp(t,e,.5))*(t>=e)})`;n.style.filter=q>0&&q<1?`blur(${(12*(1-q)).toFixed(1)}px)`:'';
  n.textContent=(p.prefix||'')+fmtNum(E.o3(P(t,a,e-a))*p.value)+(p.suffix||'');
  const [x1,y1]=shake(t,a+.18,16),[x2,y2]=shake(t,e,10);b.style.translate=`${x1+x2}px ${y1+y2}px`;if(lab)rise(lab,t,a+.25);};};
```
Uso: `S('contador_slam','b03',{kick:'PACIENTES',value:70,suffix:'%',at:w('setenta'),countEnd:w('pacientes'),label:'NO VUELVEN'})`

<a id="r02"></a>
## R02 · Línea de tiempo que se llena
una barra avanza y cada hito salta con resorte en su palabra. Técnica: `ST` escalona los hitos si no hay `at` · los rótulos se corren a `-x%` para no desbordar (si no, `fit` achica la escena).
```js
SC.linea_tiempo=(p,c)=>{const b=c.box;AL(b,p,c);const k=p.kick?kick(b,p.kick):null;
 const tr=h('div','position:relative;height:16px;margin:200px 40px 60px;border-radius:8px;background:color-mix(in srgb,var(--fg) 15%,transparent)',b);
 const fill=h('div','position:absolute;inset:0;border-radius:8px;background:var(--hl);transform-origin:left',tr);
 const ms=p.items.map((it,i)=>{const x=p.items.length>1?i/(p.items.length-1)*100:50,a=it.at??(.4+ST(i,.5));
  const d=h('div',`position:absolute;left:${x}%;top:50%;width:60px;height:60px;margin:-30px;border-radius:50%;background:var(--bg);border:10px solid var(--hl)`,tr);
  const l=h('div',`position:absolute;left:${x}%;bottom:70px;transform:translateX(-${x}%);font-size:46px;white-space:nowrap`,tr,it.t,'body');return {d,l,a};});
 const a0=ms[0].a,a1=ms[ms.length-1].a;
 return t=>{if(k)fadeUp(k,t,.05);fill.style.transform=`scaleX(${E.io(P(t,a0,a1-a0+.2))})`;
  ms.forEach(o=>{const x=sp(t,o.a,.6);o.d.style.scale=String(Math.max(0,x));o.d.style.background=t>=o.a?'var(--hl)':'var(--bg)';
   o.l.style.opacity=P(t,o.a,.15);o.l.style.translate=`0 ${(1-cl(x))*30}px`;});};};
```
Uso: `S('linea_tiempo','b07',{kick:'EL PLAN',items:[{t:'Día 1',at:w('hoy')},{t:'48 h',at:w('cuarenta')},{t:'1 mes',at:w('mes')}]})`

<a id="r03"></a>
## R03 · Objeto héroe que reaparece
la misma forma (píldora del resaltado) vuelve en varias escenas y pasa de una a otra con `tr:'morph'`. Técnica: `data-morph` marca el origen del match cut · la siguiente escena con `bg` = color de resaltado hace que la forma *se vuelva* el fondo.
```js
SC.heroe=(p,c)=>{const b=c.box;b.style.alignItems='center';b.style.setProperty('--kal','center');
 // la misma forma (píldora del color de resaltado) en cada escena: data-morph la marca como origen del próximo tr:'morph'
 const o=h('div','width:520px;height:260px;border-radius:130px;background:var(--hl);color:var(--hlfg);display:flex;align-items:center;justify-content:center;font-size:110px',b,p.word||'',`disp`);
 o.dataset.morph='1';const sub=p.sub?ml(b,p.sub,'font-size:70px;margin-top:40px;text-align:center','disp'):null;const a=p.at??.2;
 return t=>{const x=sp(t,a,.7);o.style.transform=`scale(${Math.max(0,x)}) rotate(${(1-cl(x))*-8}deg)`;
  o.style.translate=`0 ${Math.sin(t*2)*8}px`;if(sub)rise(sub,t,a+.35);};};
```
Uso: `S('heroe','b02',{word:'TURNO'}); S('stat','b03',{tr:'morph',bg:'accent',…})`

<a id="r04"></a>
## R04 · Reveal por capas
tres paneles de color barren escalonados y el texto sube encima. Técnica: `ST(i,.12)` + `M.ease` del look · `mb` con la velocidad calculada en `t` y `t-DT()`.
```js
SC.capas=(p,c)=>{const b=c.box;AL(b,p,c);const st=h('div','position:relative;padding:60px 50px',b);
 const cols=['var(--hl2)','var(--fg)','var(--hl)'],ps=cols.map((col,i)=>h('div',`position:absolute;inset:0;border-radius:var(--r);background:${col}`,st));
 const tx=ml(st,p.text,`position:relative;font-size:${p.size||130}px;color:var(--hlfg)`,'disp');const a=p.at??.2;
 return t=>{ps.forEach((e,i)=>{const s=a+ST(i,.12),x=M.ease(P(t,s,.5*M.d)),x0=M.ease(P(t-DT(),s,.5*M.d));
   e.style.clipPath=`inset(0 ${(1-cl(x))*100}% 0 0 round var(--r))`;e.style.translate=`${i*-14}px ${i*-14}px`;mb(e,(x-x0)*900,0);});
  rise(tx,t,a+.45);};};
```
Uso: `S('capas','b04',{text:'3 HÁBITOS<br>SIMPLES',at:w('tres')})`

<a id="r05"></a>
## R05 · Texto que se arma y se rompe
las letras llegan desde lejos con resorte y en `breakAt` estallan. Técnica: `split` + `rnd(seed)` para que sea puro · `sp` por letra · desenfoque por letra según su velocidad.
```js
SC.rompe=(p,c)=>{const b=c.box;AL(b,p,c);const el=h('div',`font-size:${p.size||200}px;color:var(--hl)`,b,p.word,'disp nw');
 const r=rnd(p.seed||3),ch=split(el).map(e=>({e,dx:(r()-.5)*900,dy:(r()-.5)*1200,rot:(r()-.5)*240}));
 const a=p.at??.3,br=p.breakAt??a+1.2;   // arma en "a" (resorte) y se rompe en "br"
 return t=>{ch.forEach((o,i)=>{const s=a+ST(i,.04),x=sp(t,s,.7),y=E.o3(P(t,br+ST(i,.02),.6)),u=(1-x)+y*1.4;
  o.e.style.transform=`translate(${o.dx*u}px,${o.dy*u}px) rotate(${o.rot*u}deg)`;o.e.style.opacity=P(t,s,.1)*(1-P(t,br+.3,.3));
  mb(o.e,(sp(t-DT(),s,.7)-x)*o.dx,(sp(t-DT(),s,.7)-x)*o.dy);});};};
```
Uso: `S('rompe','b02',{word:'MITO',at:.2,breakAt:w('falso')})`

<a id="r06"></a>
## R06 · Máscara con forma
un círculo del resaltado revela la palabra llena sobre su fantasma y se vuelve rectángulo. Técnica: dos copias del texto (fantasma + llena) y `clip-path` animado: `circle()` → `inset(… round …)`.
```js
SC.mascara=(p,c)=>{const b=c.box;b.style.alignItems='center';const w=h('div','position:relative;width:860px;height:860px;flex:0 0 auto',b);
 const back=h('div','position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:210px;color:var(--fg);opacity:.15',w,p.word,'disp nw');
 const front=h('div','position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:210px;background:var(--hl);color:var(--hlfg)',w,p.word,'disp nw');
 const a=p.at??.4;   // un círculo del resaltado revela la palabra "llena" y después se vuelve rectángulo
 return t=>{fadeUp(back,t,.05);const x=E.io(P(t,a,.6)),y=E.expo(P(t,a+.7,.5));
  front.style.clipPath=y>0?`inset(${(1-y)*30}% 0 round ${L(430,40,y)}px)`:`circle(${x*43}% at 50% 50%)`;};};
```
Uso: `S('mascara','b05',{word:'OJOS',at:w('ojos')})`

<a id="r07"></a>
## R07 · Parallax de 3 capas
fondo lejano lento, anillos medios más rápidos y el texto adelante el más rápido. Técnica: las capas van en un `host` insertado antes de la cámara (detrás del contenido, fuera del ajuste de tamaño).
```js
SC.parallax=(p,c)=>{const b=c.box;AL(b,p,c);const r=rnd(5),host=h('div','position:absolute;inset:0',null);c.inner.insertBefore(host,c.box.parentNode.parentNode);   // capas detrás de la cámara
 const far=Array.from({length:14},()=>h('div',`position:absolute;width:24px;height:24px;border-radius:50%;background:color-mix(in srgb,var(--fg) 18%,transparent);left:${r()*100}%;top:${r()*100}%`,host));
 const mid=[0,1,2,3].map(i=>h('div',`position:absolute;width:${300+i*80}px;height:${300+i*80}px;border-radius:50%;border:14px solid color-mix(in srgb,var(--hl) 45%,transparent);left:${[-10,60,15,70][i]}%;top:${[10,30,65,80][i]}%`,host));
 const tx=ml(b,p.text,`font-size:${p.size||150}px`,'disp');
 return t=>{const T=t-c.D/2;far.forEach(e=>{e.style.translate=`${T*-20}px ${T*-12}px`;});   // lejos lento, medio más rápido, frente (texto) el más rápido
  mid.forEach((e,i)=>{e.style.translate=`${T*-(60+i*15)}px ${T*-30}px`;});b.style.translate=`${T*-110}px 0`;rise(tx,t,.2);};};
```
Uso: `S('parallax','b06',{text:'PASO<br>A PASO'})`

<a id="r08"></a>
## R08 · Gráfico que se construye en 3D
barras con canto que crecen con resorte sobre un plano en perspectiva que gira lento. Técnica: `perspective()` en el plano + `sp` en `scaleY` (sobrepasa y se asienta) · sombra dura como canto.
```js
SC.barras3d=(p,c)=>{const b=c.box;b.style.alignItems='center';const k=p.kick?kick(b,p.kick):null;
 const pl=h('div','display:flex;align-items:flex-end;gap:36px;height:700px;margin-top:60px;transform-style:preserve-3d',b);
 const mx=Math.max(...p.bars.map(x=>x.v)),bs=p.bars.map((x,i)=>{const col=h('div','display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;width:150px',pl);
  const v=h('div','font-size:60px;margin-bottom:12px',col,'0','disp');const f=h('div',`width:100%;height:${x.v/mx*80}%;transform-origin:bottom;border-radius:18px 18px 0 0;background:${x.hl?'var(--hl)':'color-mix(in srgb,var(--fg) 40%,transparent)'};box-shadow:18px -14px 0 color-mix(in srgb,var(--fg) 25%,transparent)`,col);
  h('div','font-size:36px;margin-top:14px',col,x.l,'body');return {v,f,x,a:x.at??(.4+ST(i,.25))};});
 return t=>{if(k)fadeUp(k,t,.05);const o=E.io(P(t,0,c.D));pl.style.transform=`perspective(1600px) rotateX(${L(24,12,o)}deg) rotateY(${L(-22,-8,o)}deg)`;
  bs.forEach(o=>{const g=sp(t,o.a,.8);o.f.style.transform=`scaleY(${Math.max(0,g)})`;o.v.textContent=fmtNum(cl(g)*o.x.v)+(p.unit||'');});};};
```
Uso: `S('barras3d','b10',{kick:'CRECE',unit:'%',bars:[{l:'2023',v:20},{l:'2024',v:45,at:w('después')},{l:'2025',v:90,hl:true,at:w('hoy')}]})`

<a id="r09"></a>
## R09 · Tarjetas que giran
una grilla de tarjetas entra girando en Y, escalonadas. Técnica: `flipIn` + `ST(i,.18)`; con `motion:'elastic'` el giro rebota.
```js
SC.tarjetas=(p,c)=>{const b=c.box;AL(b,p,c);const k=p.kick?kick(b,p.kick):null;
 const g=h('div','display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:40px',b);
 const cs=p.items.map((it,i)=>{const e=h('div','padding:44px 34px;border-radius:var(--r);display:flex;flex-direction:column;gap:22px',g,null,'pnl');
  h('div','width:110px;height:110px;border-radius:50%;background:var(--hl);color:var(--hlfg);display:flex;align-items:center;justify-content:center',e,icon(it.icon||'star'),'ic');
  h('div','font-size:48px',e,it.t,'body');return {e,a:it.at??(.3+ST(i,.18))};});
 return t=>{if(k)fadeUp(k,t,.05);cs.forEach(o=>flipIn(o.e,t,o.a,.7));};};
```
Uso: `S('tarjetas','b05',{kick:'PILARES',items:[{icon:'eye',t:'Mirar',at:w('mirá')},{icon:'chat',t:'Repetir'}, …]})`

<a id="r10"></a>
## R10 · Lista que se despliega
cada ítem se despliega desde arriba como un papel. Técnica: `fold` (rotateX desde −92° con origen arriba).
```js
SC.despliegue=(p,c)=>{const b=c.box;AL(b,p,c);const ttl=p.title?ml(b,p.title,'font-size:110px','disp'):null;
 const its=p.items.map((s,i)=>{const r=h('div','margin-top:18px;padding:30px 36px;border-radius:calc(var(--r)*.5);font-size:56px;display:flex;gap:24px;align-items:center',b,null,'pnl');
  h('div','font-size:64px;color:var(--hl)',r,String(i+1).padStart(2,'0'),'disp');h('div','',r,s.t||s,'body');return {r,a:s.at??(.45+ST(i,.3))};});
 return t=>{if(ttl)rise(ttl,t,.1);its.forEach(o=>fold(o.r,t,o.a,.55));};};
```
Uso: `S('despliegue','b09',{title:'CÓMO',items:[{t:'Escuchar',at:w('escuchar')},{t:'Repetir',at:w('repetir')}]})`

<a id="r11"></a>
## R11 · Palabra tachada y reemplazada
la idea vieja se tacha y la nueva cae encima con slam y sacudida. Técnica: slam = escala con aceleración (`q*q`) + desenfoque + `shake` al tocar.
```js
SC.reemplazo=(p,c)=>{const b=c.box;AL(b,p,c);const k=p.kick?kick(b,p.kick):null;
 const old=h('div',`position:relative;display:inline-block;font-size:${p.size||170}px;color:var(--sub)`,h('div','',b),p.from,'disp nw');
 const ln=h('div','position:absolute;left:-3%;right:-3%;top:46%;height:.1em;background:var(--hl);border-radius:8px;transform-origin:left',old);
 const nw=h('div',`display:inline-block;font-size:${(p.size||170)*1.15}px;color:var(--hl);transform-origin:20% 60%`,h('div','',b),p.to,'disp nw');
 const a=p.strikeAt??.6,s=p.at??a+.5;
 return t=>{if(k)fadeUp(k,t,.05);fadeUp(old,t,.1);ln.style.transform=`scaleX(${E.expo(P(t,a,.3))})`;old.style.opacity=L(1,.5,P(t,s,.2));
  const q=P(t,s,.18);nw.style.opacity=P(t,s,.04);nw.style.transform=`scale(${q<1?L(2.5,1,q*q):1})`;nw.style.filter=q>0&&q<1?`blur(${(10*(1-q)).toFixed(1)}px)`:'';
  const [dx,dy]=shake(t,s+.18,14);b.style.translate=`${dx}px ${dy}px`;};};
```
Uso: `S('reemplazo','b02',{kick:'NO ES',from:'EL PRECIO',to:'EL TRATO',strikeAt:w('precio'),at:w('trato')})`

<a id="r12"></a>
## R12 · Concept: órbita que encaja
puntos que giran sueltos y en el momento clave encajan con resorte en un anillo; el centro late. Técnica: concept (`MOT`) con `sp` en el radio y la velocidad · **solo referencia: el concept de cada video se diseña desde cero**.
```js
MOT.orbita_snap=(g,p,a,D,r)=>{const N=p.n||10,core=sv('circle',{cx:500,cy:500,r:70},g,`fill:${HL}`);
 const ds=Array.from({length:N},(_,i)=>({an:i/N*Math.PI*2,rr:220+r()*160,el:sv('circle',{r:22},g,`fill:${i%3?FG:HL}`)}));
 const ring=sv('circle',{cx:500,cy:500,r:260},g,`fill:none;stroke:${HL};stroke-width:10;opacity:0`);
 // giran sueltos; en "a" se acomodan con resorte en un anillo perfecto y el centro late
 return t=>{spop(core,t,.05);const s=sp(t,a,.8);ds.forEach((o,i)=>{const an=o.an+t*(1.4-cl(s))*1.1,rr=L(o.rr,260,s);
   o.el.setAttribute('cx',500+Math.cos(an)*rr);o.el.setAttribute('cy',500+Math.sin(an)*rr);o.el.style.opacity=P(t,.05+ST(i,.04),.1);});
  ring.style.opacity=.5*P(t,a+.2,.3);core.setAttribute('r',70+16*(1-cl(sp(t,a,.5)))*(t>=a));};};
```
Uso: `S('concept',w('juntos'),{motif:'orbita_snap',at:w('juntos'),bg:'accent'})`

<a id="r13"></a>
## R13 · Antes / después con cortina
una cortina con filete barre y revela el “después” sobre el “antes”. Técnica: `clip-path: inset()` + filete con `mb` horizontal.
```js
SC.antes_despues=(p,c)=>{const b=c.box;const w=h('div','position:relative;height:1100px;border-radius:var(--r);overflow:hidden',b);
 const A=h('div','position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:140px;background:color-mix(in srgb,var(--fg) 12%,transparent);color:var(--sub)',w,p.before,'disp');
 const B=h('div','position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:150px;background:var(--hl);color:var(--hlfg)',w,p.after,'disp');
 const bar=h('div','position:absolute;top:0;bottom:0;width:14px;margin-left:-7px;background:var(--fg)',w);const a=p.at??1;
 return t=>{popIn(w,t,.05,.5);const f=q=>E.io(P(q,a,.7)),x=f(t);B.style.clipPath=`inset(0 0 0 ${(1-x)*100}%)`;bar.style.left=`${(1-x)*100}%`;
  bar.style.opacity=x>0&&x<1?1:0;mb(bar,(f(t)-f(t-DT()))*900,0);};};
```
Uso: `S('antes_despues','b09',{before:'RECETA',after:'CUIDADO',at:w('ahora')})`

<a id="r14"></a>
## R14 · Marquesina cinética
tres filas de texto gigante corren en sentidos opuestos (la del medio en color). Técnica: las filas van fuera del fitbox (no achican la escena) · bucle exacto con el ancho de una repetición · `mb` horizontal.
```js
SC.marquesina=(p,c)=>{const host=h('div','position:absolute;left:0;right:0;top:30%;display:flex;flex-direction:column;gap:10px',null);c.inner.insertBefore(host,c.box.parentNode.parentNode);   // fuera del fitbox: no achica la escena
 const rows=[0,1,2].map(i=>h('div',`font-size:${p.size||200}px;white-space:nowrap;${i===1?'color:var(--hl)':'color:var(--fg);opacity:.22'}`,host,(p.text+' · ').repeat(6),'disp'));
 const v=p.speed||520;   // px/s; la fila del medio va al revés
 return t=>{rows.forEach((r,i)=>{const per=r._p||(r._p=r.scrollWidth/6),f=q=>-((((q*v*(i===1?-1:1+i*.15))%per)+per)%per);
  r.style.transform=`translateX(${f(t)}px)`;const d=f(t)-f(t-DT());if(Math.abs(d)<per/2)mb(r,d,0);});};};
```
Uso: `S('marquesina','b11',{text:'SEGUIME',speed:520})`
