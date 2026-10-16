// Diseño a medida de este video (se inyecta en engine.html). Concepto: "repetí con tus palabras" → lo que llega vuelve devuelto.
// MOT.eco_devuelto: una onda sale de una burbuja, llega a la otra y vuelve espejada; en el momento clave las dos quedan llenas y unidas.
MOT.eco_devuelto=(g,p,a,D,r)=>{
 const bub=(x,flip)=>{const e=sv('path',{d:`M${x-150},380 h300 a40,40 0 0 1 40,40 v140 a40,40 0 0 1 -40,40 h${flip?-200:-180} l${flip?-40:-60},70 l${flip?20:0},-70 h-60 a40,40 0 0 1 -40,-40 v-140 a40,40 0 0 1 40,-40 z`},g,`fill:none;stroke:${FG};stroke-width:12;stroke-linejoin:round`);
  e.setAttribute('transform',`translate(${x},0) scale(.62) translate(${-x},0)`);return e;};
 const A=bub(300,false),B=bub(700,true);
 const dots=Array.from({length:9},(_,i)=>sv('circle',{r:13},g,`fill:${i%3?FG:HL};opacity:0`));
 const band=sv('line',{x1:400,y1:500,x2:600,y2:500},g,`stroke:${HL};stroke-width:16;stroke-linecap:round`);
 return t=>{spop(A,t,.05);spop(B,t,.2);
  dots.forEach((d,i)=>{const back=i>=5,st=back?a-.45+(i-5)*.09:.35+i*.1,q=E.io(P(t,st,.55));
   const x=back?L(640,360,q):L(360,640,q),y=500+Math.sin(q*Math.PI)*(back?60:-60);
   d.setAttribute('cx',x);d.setAttribute('cy',y);d.style.opacity=q>0&&q<1?1:0;});
  const on=E.o3(P(t,a,.4));A.style.fill=B.style.fill=on>0?`color-mix(in srgb,var(--hl) ${on*100}%,transparent)`:'none';A.style.stroke=B.style.stroke=t>=a?HL:FG;
  dash(band,200,on);};};

// SC.reloj48: el reloj corre 48 h (dos vueltas) y al final llega la notificación del mensaje.
SC.reloj48=(p,c)=>{const b=c.box;AL(b,p,c);const k=p.kick?kick(b,p.kick):null;
 const wr=h('div','position:relative;width:640px;height:640px;margin:30px 0 0',b);
 wr.innerHTML=`<svg viewBox="0 0 640 640" width="640" height="640"><circle cx="320" cy="320" r="290" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="18"/>${Array.from({length:12},(_,i)=>`<line x1="320" y1="52" x2="320" y2="${i%3?84:104}" stroke="currentColor" stroke-width="10" stroke-linecap="round" transform="rotate(${i*30} 320 320)"/>`).join('')}<circle class="tr" cx="320" cy="320" r="290" fill="none" stroke="var(--hl)" stroke-width="18" stroke-linecap="round" transform="rotate(-90 320 320)"/><line class="hd" x1="320" y1="320" x2="320" y2="120" stroke="var(--hl)" stroke-width="18" stroke-linecap="round"/><circle cx="320" cy="320" r="24" fill="var(--hl)"/></svg>`;
 const hd=wr.querySelector('.hd'),tr=wr.querySelector('.tr'),C=2*Math.PI*290;
 const hrs=h('div','font-size:150px;margin-top:20px;font-variant-numeric:tabular-nums',b,'0 H','disp nw');
 const nt=h('div','position:absolute;left:50%;top:58%;transform-origin:50% 100%;display:flex;align-items:center;gap:18px;padding:22px 30px;border-radius:calc(var(--r)*.6);background:var(--fg);color:var(--bg);font-size:38px;white-space:nowrap',wr,`${icon('chat',2.6)}<span>${p.msg||'Nuevo mensaje'}</span>`,'body');
 nt.firstChild.style.cssText='width:44px;height:44px;color:var(--hl)';
 const a=p.at??.3,e=p.endAt??a+1.6;
 return t=>{if(k)fadeUp(k,t,.05);popIn(wr,t,.05,.5);const q=E.io(P(t,a,e-a));hd.setAttribute('transform',`rotate(${q*720} 320 320)`);
  tr.setAttribute('stroke-dasharray',`${C*((q*2)%1||(q>=1?1:0))} ${C}`);hrs.textContent=Math.round(q*48)+' H';
  const x=M.pop(P(t,e,.45));nt.style.opacity=P(t,e,.08);nt.style.transform=`translateX(-50%) scale(${Math.max(0,x)})`;};};
