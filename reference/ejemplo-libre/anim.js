// GATO_CAMBIOS_LIBRE · anim.js (modo libre). Mundo: casa de papel en corte; protagonista: el gato.
// Colores por rol a partir de la marca (Veterinaria Suyai): crema de fondo, violeta que manda, amarillo de acento.
const K={cream:COL.light,vio:COL.accent,yel:COL.accent2,dark:COL.dark,mute:COL.mute,vioD:tint(COL.accent,COL.dark,.22),lav:tint(COL.light,COL.accent,.09),
  lav2:tint(COL.light,COL.accent,.24),paper:tint(COL.light,'#FFFFFF',.6),wall1:tint(COL.light,COL.accent2,.12),wall2:tint(COL.light,COL.accent,.05),skin:'#EFCFB2'};
function paw(x,y,ang,s,col,a=1){if(a<=0)return;X.save();X.globalAlpha*=a;X.translate(x,y);X.rotate(ang);X.scale(s,s);X.fillStyle=col;
  X.beginPath();X.ellipse(0,4,13,11,0,0,TAU);X.fill();[[-12,-12],[-4,-19],[4,-19],[12,-12]].forEach(([a,b])=>{X.beginPath();X.arc(a,b,5.5,0,TAU);X.fill();});X.restore();}
// ---------- personajes ----------
// gato sentado de frente (origen = apoyo en el piso)
function catSit(x,y,s,o={}){const t=o.t||0,c=o.col||K.dark,bl=cl(o.blink||0),lk=o.look||0,lu=o.lookUp||0,ef=o.ear||0,G=o.ghost;
  X.save();X.translate(x,y);X.scale(s,s);if(o.a!=null)X.globalAlpha*=o.a;
  const paint=()=>{G?X.stroke():X.fill();};
  if(G){X.setLineDash([12,13]);X.strokeStyle=G;X.lineWidth=6/Math.max(.4,s)*.9;X.lineCap='round';}
  const sw=Math.sin(t*2.1+(o.ph||0))*(o.tail??1);
  X.save();X.strokeStyle=G||c;X.lineWidth=G?X.lineWidth:20;X.lineCap='round';X.beginPath();X.moveTo(42,-14);X.bezierCurveTo(118,-6,128+sw*8,-72,96+sw*26,-112);X.stroke();X.restore();
  X.fillStyle=c;X.beginPath();X.moveTo(-68,0);X.bezierCurveTo(-84,-72,-52,-150,0,-152);X.bezierCurveTo(52,-150,84,-72,68,0);X.closePath();paint();
  if(!G){X.fillStyle=o.bib||K.lav2;X.beginPath();X.ellipse(0,-80,24,42,0,0,TAU);X.fill();X.fillStyle=c;
    [-1,1].forEach(sx=>{X.beginPath();X.ellipse(sx*27,-5,21,12,0,0,TAU);X.fill();});}
  const hy=-190+(o.duck||0)*22;
  [-1,1].forEach(sx=>{X.beginPath();X.moveTo(sx*62,hy-14);X.lineTo(sx*L(48,88,ef),L(hy-86,hy-50,ef));X.lineTo(sx*14,hy-50);X.closePath();paint();
    if(!G){X.save();X.fillStyle=o.inner||K.vio;X.beginPath();X.moveTo(sx*52,hy-24);X.lineTo(sx*L(48,78,ef),L(hy-70,hy-50,ef));X.lineTo(sx*27,hy-45);X.closePath();X.fill();X.restore();}});
  X.fillStyle=c;X.beginPath();X.ellipse(0,hy,68,58,0,0,TAU);paint();
  if(!G){[-1,1].forEach(sx=>{const ex=sx*26,ey=hy-4,ry=16*(1-bl);
      if(ry<2.5){X.save();X.strokeStyle=o.eyeC||K.yel;X.lineWidth=4.5;X.lineCap='round';X.beginPath();X.arc(ex,ey-6,12,.22*Math.PI,.78*Math.PI);X.stroke();X.restore();}
      else{X.save();X.fillStyle=o.eyeC||K.yel;X.beginPath();X.ellipse(ex,ey,14,ry,0,0,TAU);X.fill();X.fillStyle=c;X.beginPath();X.ellipse(ex+lk*5,ey-lu*5,o.pupil||4.5,Math.max(1,ry*.78),0,0,TAU);X.fill();X.restore();}});
    X.fillStyle=o.nose||K.vio;X.beginPath();X.moveTo(-8,hy+14);X.lineTo(8,hy+14);X.lineTo(0,hy+23);X.closePath();X.fill();
    X.save();X.strokeStyle='rgba(239,228,239,.6)';X.lineWidth=3;[-1,1].forEach(sx=>{X.beginPath();X.moveTo(sx*34,hy+18);X.lineTo(sx*96,hy+8);X.moveTo(sx*34,hy+25);X.lineTo(sx*94,hy+31);X.stroke();});X.restore();}
  X.restore();}
// gato hecho bollito, durmiendo (mira a la izquierda)
function catLoaf(x,y,s,o={}){const t=o.t||0,c=o.col||K.dark,br=1+Math.sin(t*2.4)*.03;X.save();X.translate(x,y);X.scale(s,s);if(o.a!=null)X.globalAlpha*=o.a;X.fillStyle=c;
  X.save();X.scale(1,br);X.beginPath();X.ellipse(0,-58,118,60,0,0,TAU);X.fill();X.restore();
  X.strokeStyle=c;X.lineWidth=22;X.lineCap='round';X.beginPath();X.moveTo(100,-22);X.bezierCurveTo(70,10,-50,12,-98,-6);X.stroke();
  const hx=-80,hy=-72;X.beginPath();X.moveTo(hx-42,hy-16);X.lineTo(hx-38,hy-74);X.lineTo(hx-6,hy-40);X.closePath();X.fill();
  X.beginPath();X.moveTo(hx+4,hy-42);X.lineTo(hx+36,hy-74);X.lineTo(hx+44,hy-20);X.closePath();X.fill();
  X.beginPath();X.ellipse(hx,hy,54,46,0,0,TAU);X.fill();
  X.strokeStyle=o.eyeC||K.yel;X.lineWidth=4.5;[-20,18].forEach(ex=>{X.beginPath();X.arc(hx+ex,hy-8,11,.2*Math.PI,.8*Math.PI);X.stroke();});
  X.fillStyle=K.vio;X.beginPath();X.moveTo(hx-6,hy+12);X.lineTo(hx+6,hy+12);X.lineTo(hx,hy+19);X.closePath();X.fill();X.restore();}
// gato caminando de perfil (mira a la derecha; flip = a la izquierda)
function catWalk(x,y,s,o={}){const ph=o.ph||0,c=o.col||K.dark;X.save();X.translate(x,y);X.scale(s*(o.flip?-1:1),s);X.fillStyle=c;X.strokeStyle=c;X.lineCap='round';
  X.lineWidth=19;[[50,0],[66,Math.PI],[-54,Math.PI],[-38,0]].forEach(([hx,o2])=>{const sw=Math.sin(ph+o2),lift=Math.max(0,Math.cos(ph+o2))*10;X.beginPath();X.moveTo(hx,-82);X.lineTo(hx+sw*22,-6-lift);X.stroke();});
  X.translate(0,-Math.abs(Math.sin(ph))*5);
  X.beginPath();X.ellipse(0,-94,90,42,0,0,TAU);X.fill();
  X.lineWidth=18;X.beginPath();X.moveTo(-82,-104);X.bezierCurveTo(-128,-112,-136,-170+Math.sin(ph*.5)*8,-104,-196);X.stroke();
  X.beginPath();X.moveTo(64,-150);X.lineTo(68,-200);X.lineTo(92,-162);X.closePath();X.fill();X.beginPath();X.moveTo(96,-164);X.lineTo(118,-198);X.lineTo(122,-146);X.closePath();X.fill();
  X.beginPath();X.ellipse(92,-130,44,39,0,0,TAU);X.fill();
  X.fillStyle=K.yel;X.beginPath();X.ellipse(110,-134,8,10,0,0,TAU);X.fill();X.fillStyle=c;X.beginPath();X.ellipse(113,-134,3,8,0,0,TAU);X.fill();
  X.fillStyle=K.vio;X.beginPath();X.moveTo(131,-126);X.lineTo(136,-117);X.lineTo(127,-117);X.closePath();X.fill();X.restore();}
// mano que se acerca (dedos hacia la izquierda)
function hand(x,y,s){X.save();X.translate(x,y);X.scale(s,s);X.fillStyle=K.skin;
  X.beginPath();X.roundRect(0,-34,280,68,34);X.fill();X.beginPath();X.ellipse(-8,0,58,46,0,0,TAU);X.fill();
  [-30,-8,14].forEach((dy,i)=>{X.beginPath();X.roundRect(-112+i*6,dy-11,84,22,11);X.fill();});X.beginPath();X.roundRect(-40,-52,60,22,11);X.fill();
  X.fillStyle=K.vio;X.beginPath();X.roundRect(130,-44,240,88,22);X.fill();X.restore();}

// ---------- 1 · gancho (0 – 7.7) ----------
function ann(s,px,py,tx,ty,t,at){const p=spr(t,at,.6);if(p<=0)return;const lp=eo(P(t,at+.15,.45));
  X.save();X.strokeStyle=K.vio;X.lineWidth=5;X.setLineDash([2,12]);X.lineCap='round';X.beginPath();X.moveTo(px,py);X.lineTo(L(px,tx,lp),L(py,ty,lp));X.stroke();X.restore();
  if(lp>.95){X.fillStyle=K.vio;X.beginPath();X.arc(tx,ty,11*spr(t,at+.55,.4),0,TAU);X.fill();}pill(s,px,py,p,{size:46});}
function S1(T){const t=T;bg(K.cream);
  const bp=spr(t,0,1);if(bp>0){X.save();X.fillStyle=K.lav;X.beginPath();blob(540,1290,430*bp,t);X.fill();X.restore();}
  const c0=W('cambios'),sh=eio(P(t,c0-.15,.8)),o1=c0-.35;
  if(sh>0)catSit(540,1560,2.0,{ghost:K.vio,a:sh});
  const pop=spr(t,.05,.8);
  if(pop>.01)catSit(L(540,380,sh),1560,L(2.0,1.7,sh)*pop,{t,blink:blinkAt(t,[1.6,7.0]),look:L(Math.sin(t*.9)*.6,-1,sh),ear:sh*.7,duck:sh*.7,tail:L(1,.25,sh)});
  kicker('tu gato',90,300,t,.15,{a:1-P(t,o1,.3)});
  rise('¿y si algo',90,470,t,.25,{size:128,out:o1});
  const nb=W('no');if(t<o1+.5){X.save();X.globalAlpha*=1-P(t,o1,.35);marker(90,620,tw('no está bien?','display',128),128,eo(P(t,nb+.2,.5)));X.restore();}
  rise('no está bien?',90,620,t,nb,{size:128,out:o1});
  kicker('se nota en sus',90,330,t,c0+.1);
  rise('cambios',90,540,t,c0,{size:200,col:K.vio});
  ann('hábitos',760,760,640,1010,t,W('habitos'));
  ann('comportamiento',300,880,360,1120,t,W('comportamiento'));}

// ---------- 2 · la casa (7.7 – 19.3) ----------
const HL=90,HR=990,HT=640,HM=1100,HB=1560;
const CAMK=[[7.7,540,1010,1],[11.95,540,1010,1],[12.55,310,990,2.1],[15.2,310,990,2.1],[15.8,300,1420,2.0],[16.8,300,1420,2.0],[17.4,770,920,1.85],[99,770,920,1.85]];
function camAt(t){for(let i=0;i<CAMK.length-1;i++){const[a,x0,y0,z0]=CAMK[i],[b,x1,y1,z1]=CAMK[i+1];if(t<=b){const e=eio((t-a)/(b-a));return[L(x0,x1,e),L(y0,y1,e),L(z0,z1,e)];}}return CAMK[CAMK.length-1].slice(1);}
const WALK=[[860,HB,9.2],[720,HB,9.95],[575,HM,10.6],[760,HM,11.15]];
const PRINTS=(()=>{const out=[];for(let i=0;i<WALK.length-1;i++){const[x0,y0,t0]=WALK[i],[x1,y1,t1]=WALK[i+1],len=Math.hypot(x1-x0,y1-y0),n=Math.floor(len/38),a=Math.atan2(y1-y0,x1-x0);
  for(let k=0;k<n;k++){const u=k/n,side=k%2?1:-1;out.push({x:L(x0,x1,u)+Math.sin(a)*side*8,y:L(y0,y1,u)-Math.cos(a)*side*8-4,a,tt:L(t0,t1,u)});}}return out;})();
function house(t){
  X.fillStyle=K.lav;X.fillRect(-1500,HB,4000,1200);
  X.fillStyle=K.vio;X.beginPath();X.moveTo(HL-46,HT+8);X.lineTo(540,410);X.lineTo(HR+46,HT+8);X.closePath();X.fill();
  X.fillStyle=K.vioD;X.fillRect(780,440,70,120);
  const room=(x0,y0,x1,y1,c)=>{X.fillStyle=c;X.fillRect(x0,y0,x1-x0,y1-y0);};
  room(HL,HT,540,HM,K.wall2);room(540,HT,HR,HM,K.wall1);room(HL,HM,540,HB,K.wall1);room(540,HM,HR,HB,K.wall2);
  // cuarto: cuadro y cama
  X.fillStyle=K.yel;X.fillRect(250,700,140,100);X.strokeStyle=K.dark;X.lineWidth=7;X.strokeRect(250,700,140,100);
  X.fillStyle=K.vio;X.beginPath();X.moveTo(320,778);X.bezierCurveTo(280,748,296,718,320,738);X.bezierCurveTo(344,718,360,748,320,778);X.fill();
  X.fillStyle='rgba(46,26,51,.88)';X.fillRect(166,976,286,HM-976);
  X.fillStyle=K.dark;X.beginPath();X.roundRect(126,830,24,HM-830,8);X.fill();X.fillRect(452,960,16,HM-960);X.beginPath();X.roundRect(140,940,340,38,10);X.fill();
  X.fillStyle=K.lav2;X.beginPath();X.roundRect(150,902,322,44,14);X.fill();
  X.fillStyle=K.vio;X.beginPath();X.roundRect(270,890,206,58,18);X.fill();
  X.fillStyle=K.cream;X.beginPath();X.roundRect(162,872,100,40,18);X.fill();
  // sala de la ventana: ventana y repisa (su lugar preferido)
  X.fillStyle='#FFF6D6';X.fillRect(660,690,240,180);X.fillStyle=K.yel;X.beginPath();X.arc(845,735,26,0,TAU);X.fill();
  X.strokeStyle=K.dark;X.lineWidth=8;X.strokeRect(660,690,240,180);X.beginPath();X.moveTo(780,690);X.lineTo(780,870);X.moveTo(660,780);X.lineTo(900,780);X.stroke();
  X.fillStyle=K.dark;X.beginPath();X.roundRect(630,872,300,22,8);X.fill();
  X.fillStyle=K.vio;X.beginPath();X.roundRect(900,1010,60,HM-1010,10);X.fill();X.fillStyle='#7FA06B';X.beginPath();X.ellipse(930,990,42,38,0,0,TAU);X.fill();
  // living: reloj y sillón
  const ca=t<15.4?.6:.6+(t-15.4)*7;X.fillStyle=K.cream;X.beginPath();X.arc(300,1200,56,0,TAU);X.fill();X.strokeStyle=K.dark;X.lineWidth=7;X.stroke();
  X.lineCap='round';X.lineWidth=6;X.beginPath();X.moveTo(300,1200);X.lineTo(300+Math.sin(ca)*40,1200-Math.cos(ca)*40);X.moveTo(300,1200);X.lineTo(300+Math.sin(ca/12)*26,1200-Math.cos(ca/12)*26);X.stroke();
  X.fillStyle=K.vio;X.beginPath();X.roundRect(140,1330,320,110,30);X.fill();X.fillStyle=K.vioD;X.beginPath();X.roundRect(120,1412,360,96,28);X.fill();
  X.beginPath();X.roundRect(100,1372,60,138,26);X.fill();X.beginPath();X.roundRect(440,1372,60,138,26);X.fill();
  X.fillStyle=K.dark;X.fillRect(140,1508,14,HB-1508);X.fillRect(446,1508,14,HB-1508);
  // cocina: escalera, mesada y plato
  X.fillStyle=K.lav2;X.beginPath();X.moveTo(560,HB);X.lineTo(560,HM);const sw=(740-560)/7,sh=(HB-HM)/7;
  for(let i=0;i<7;i++){X.lineTo(560+(i+1)*sw,HM+i*sh);X.lineTo(560+(i+1)*sw,HM+(i+1)*sh);}X.closePath();X.fill();
  X.strokeStyle=K.dark;X.lineWidth=5;X.beginPath();for(let i=0;i<7;i++){X.moveTo(560+i*sw,HM+i*sh);X.lineTo(560+(i+1)*sw,HM+i*sh);X.lineTo(560+(i+1)*sw,HM+(i+1)*sh);}X.stroke();
  X.fillStyle='#E4D2E4';X.fillRect(820,1360,170,HB-1360);X.fillStyle=K.dark;X.fillRect(800,1344,190,20);
  X.fillStyle=K.dark;X.beginPath();X.ellipse(950,1528,40,12,0,0,TAU);X.fill();X.fillStyle=K.yel;X.beginPath();X.ellipse(950,1528,52,32,0,0,Math.PI);X.fill();
  // contornos
  X.strokeStyle=K.dark;X.lineWidth=10;X.lineCap='butt';X.strokeRect(HL,HT,HR-HL,HB-HT);
  X.beginPath();X.moveTo(540,HT);X.lineTo(540,HM);X.moveTo(540,HM);X.lineTo(540,HB);X.moveTo(HL,HM);X.lineTo(548,HM);X.moveTo(615,HM);X.lineTo(HR,HM);X.moveTo(HL-80,HB);X.lineTo(HR+80,HB);X.stroke();}
function houseCat(t){
  const fade=1-P(t,11.9,.3);if(fade>0)PRINTS.forEach(q=>{if(t>=q.tt+.08)paw(q.x,q.y,q.a+Math.PI/2,.42,K.vio,.6*fade);});
  if(t<9.2){catSit(860,HB,.42,{t,blink:blinkAt(t,[8.4])});return;}
  if(t<11.15){let k=0;while(k<WALK.length-2&&t>=WALK[k+1][2])k++;const[x0,y0,t0]=WALK[k],[x1,y1,t1]=WALK[k+1],e=P(t,t0,t1-t0);catWalk(L(x0,x1,e),L(y0,y1,e),.42,{ph:t*13,flip:x1<x0});return;}
  if(t<11.5){const e=eio(P(t,11.15,.35));catWalk(L(760,795,e),L(HM,880,e)-Math.sin(e*Math.PI)*80,.42,{ph:2});return;}
  if(t<12.1){catSit(795,880,.42,{t});return;}
  if(t<15.3){// escondido bajo la cama + mano que se acerca
    const ev=W('evita'),ap=eo(P(t,12.25,.4)),ret=eio(P(t,ev+.1,.5)),ex=L(330,232,ret),es=L(1,.78,ret)*ap,bl=blinkAt(t,[13.15],.08);
    if(es>0){X.save();X.fillStyle='rgba(232,210,124,.13)';X.beginPath();X.ellipse(ex,1045,72*es,40*es,0,0,TAU);X.fill();
      [-1,1].forEach(s=>{const x=ex+s*22*es,ry=12*es*(1-bl);X.fillStyle=K.yel;X.beginPath();X.ellipse(x,1045,10*es,Math.max(.6,ry),0,0,TAU);X.fill();
        X.fillStyle=K.dark;X.beginPath();X.ellipse(x-3*ret,1045,3*es,Math.max(.4,ry*.8),0,0,TAU);X.fill();});X.restore();}
    const hin=eio(P(t,ev-.15,.55)),hout=eio(P(t,14.95,.35));if(hin>0&&hout<1)hand(L(820,530,hin*(1-hout)),1050,.6);return;}
  if(t<16.85){catLoaf(290,1416,.56,{t});
    for(let i=0;i<3;i++){const ph=((t-15.3)*.55+i/3)%1;txt('z',372+ph*70+Math.sin(ph*6)*8,1320-ph*150,{size:34+ph*34,col:K.vio,a:Math.sin(ph*Math.PI)*P(t,15.5,.3)});}return;}
  const gp=eo(P(t,16.95,.4));catSit(795,880,.42,{ghost:K.vio,a:gp});
  catSit(690,HM,.42,{t,lookUp:1,look:.7,blink:blinkAt(t,[18.7])});
  const ap=eo(P(t,17.05,.6));X.fillStyle=K.vio;for(let k=0;k<=16;k++){const u=k/16;if(u>ap)break;const x=L(705,790,u),y=(1-u)*(1-u)*990+2*(1-u)*u*700+u*u*850;X.beginPath();X.arc(x,y,6,0,TAU);X.fill();}
  const xp=eo(P(t,W('subir')+.45,.3));if(xp>0){X.save();X.strokeStyle=K.vio;X.lineWidth=12;X.lineCap='round';const mx=748,my=862,r=34;
    X.beginPath();X.moveTo(mx-r,my-r);X.lineTo(mx-r+2*r*cl(xp*2),my-r+2*r*cl(xp*2));if(xp>.5){X.moveTo(mx+r,my-r);X.lineTo(mx+r-2*r*cl(xp*2-1),my-r+2*r*cl(xp*2-1));}X.stroke();X.restore();}}
const SIG=[['señal 1','se esconde','esconderse'],['señal 2','evita el contacto','contacto'],['señal 3','está menos activo','activo'],['señal 4','no sube a sus lugares','subir']];
function signals(t){const ts=SIG.map(s=>W(s[2]));ts.forEach((a,i)=>{const nxt=ts[i+1]??1e9;if(t<a-.02||t>nxt+.5)return;const p=spr(t,a,.6),o=eio(P(t,nxt,.4));
  let size=86;const tw0=tw(SIG[i][1],'display',size);if(tw0>780)size=size*780/tw0;const w=Math.max(tw(SIG[i][1],'display',size),300)+110;
  X.save();X.translate(L(-w-80,0,p),-o*80);X.globalAlpha*=1-o;X.shadowColor='rgba(46,26,51,.2)';X.shadowOffsetY=14;X.shadowBlur=30;
  X.fillStyle=K.cream;X.beginPath();X.roundRect(60,150,w,200,40);X.fill();X.shadowColor='transparent';
  X.fillStyle=K.vio;X.beginPath();X.arc(60+w-50,195,14,0,TAU);X.fill();
  txt(SIG[i][0].toUpperCase(),115,212,{f:'mono',size:32,col:K.vio,track:4});txt(SIG[i][1],115,305,{size});X.restore();});}
function S2(T){const t=T;bg(K.cream);const[cx,cy,z]=camAt(t);
  X.save();X.translate(540,1000);X.scale(z,z);X.translate(-cx,-cy);house(t);houseCat(t);X.restore();
  const hOut=P(t,11.85,.3);if(hOut<1){X.save();X.globalAlpha*=1-hOut;kicker('su recorrido de siempre',90,210,t,7.95);rise('por toda la casa',90,330,t,W('toda'),{size:100});X.restore();}
  signals(t);}

// ---------- 3 · el ojo y el patrón (19.3 – 27.05) ----------
function S3(T){const t=T,zi=eio(P(t,21.7,.62)),rv=eo(P(t,22.22,.6));
  if(rv<1){bg(K.vio);const lx=40*Math.sin((t-19.4)*1.7)*(1-zi);
    X.save();X.translate(540,880);const z=L(1,18,ei(zi));X.scale(z,z);X.translate(-lx*zi,0);
    const open=eo(P(t,19.45,.55))*(1-blinkAt(t,[21.05],.14)*.96);
    const almond=()=>{X.beginPath();X.moveTo(-450,0);X.quadraticCurveTo(0,-340*open,450,0);X.quadraticCurveTo(0,340*open,-450,0);X.closePath();};
    X.save();almond();X.fillStyle=K.yel;X.fill();X.clip();
    X.fillStyle='#D9B84C';X.beginPath();X.arc(lx,0,250,0,TAU);X.fill();
    X.strokeStyle='rgba(133,53,135,.22)';X.lineWidth=5;for(let i=0;i<48;i++){const a=i/48*TAU;X.beginPath();X.moveTo(lx+Math.cos(a)*95,Math.sin(a)*95);X.lineTo(lx+Math.cos(a)*(225+(i%3)*8),Math.sin(a)*(225+(i%3)*8));X.stroke();}
    const dil=Math.max(.15+.85*eio(P(t,20.35,.5))-.6*eio(P(t,21.25,.35)),zi);
    X.fillStyle=K.dark;X.beginPath();X.ellipse(lx,0,L(24,130,dil),220,0,0,TAU);X.fill();
    X.fillStyle=K.cream;X.beginPath();X.arc(lx+72,-92,28,0,TAU);X.fill();X.beginPath();X.arc(lx+34,-44,10,0,TAU);X.fill();X.restore();
    almond();X.strokeStyle=K.dark;X.lineWidth=14;X.stroke();X.restore();
    if(zi<.35){X.save();X.globalAlpha*=1-zi/.35;kicker('es importante',90,1330,t,19.6,{col:K.yel});rise('observalo',90,1500,t,W('observarlo'),{size:180,col:K.cream});X.restore();}}
  if(rv>0){X.save();X.beginPath();X.arc(540,880,rv*1250,0,TAU);X.clip();grid(t);X.restore();}}
function grid(t){bg(K.cream);const a0=22.3,dif=W('diferente'),sw=eo(P(t,dif,.5));
  kicker('lo habitual',90,250,t,a0+.1,{a:1-sw});kicker('lo distinto',90,250,t,dif,{});
  rise('prestá atención',90,380,t,a0+.25,{size:100,out:dif-.1});rise('algo diferente',90,380,t,dif,{size:100,col:K.vio});
  const bl=blinkAt(t,[23.5,25.9]),ring=eo(P(t,dif+.1,.7));
  [0,1,2].forEach(r=>[0,1,2].forEach(c=>{const i=r*3+c,x=[230,540,850][c],y=[790,1150,1510][r],p=spr(t,a0+.15+i*.05,.6);if(p<=0)return;
    if(i===5){if(sw<1)catSit(x,y,.6*p,{t,blink:bl,a:1-sw});if(sw>0)catLoaf(x,y,.5*sw,{t,a:sw});
      if(ring>0){X.save();X.strokeStyle=K.vio;X.lineWidth=12;X.lineCap='round';X.beginPath();X.arc(x,y-80,175,-Math.PI/2,-Math.PI/2+TAU*ring);X.stroke();X.restore();}}
    else catSit(x,y,.6*p,{t,blink:bl,a:L(1,.28,sw)});}));}

// ---------- 4 · no siempre es salud (27.05 – 30.85) ----------
function S4(T){const t=T;bg(K.yel);
  kicker('tranqui',90,330,t,27.2,{col:K.vio});
  rise('no siempre',90,510,t,W('siempre'),{size:160});rise('es un problema',90,660,t,W('problema'),{size:104});rise('de salud',90,790,t,W('salud'),{size:104,col:K.vio});
  const pr=eo(P(t,27.2,3.4)),y0=1020;X.save();X.strokeStyle=K.vio;X.lineWidth=9;X.lineJoin='round';X.lineCap='round';X.beginPath();let lx=60,ly=y0;
  for(let x=60;x<=60+960*pr;x+=6){const ph=((x-60)%320)/320;let y=y0;if(ph>.40&&ph<.46)y=y0-L(0,70,(ph-.40)/.06);else if(ph>=.46&&ph<.52)y=y0-L(70,-40,(ph-.46)/.06);else if(ph>=.52&&ph<.56)y=y0+L(40,0,(ph-.52)/.04);
    x===60?X.moveTo(x,y):X.lineTo(x,y);lx=x;ly=y;}X.stroke();X.fillStyle=K.vio;X.beginPath();X.arc(lx,ly,15,0,TAU);X.fill();X.restore();
  catSit(540,1580,1.25,{t,blink:blinkAt(t,[28.7],.3),bib:K.cream,tail:.6});}

// ---------- 5 · las etiquetas (30.85 – 37.7) ----------
function note(s,x,y,rot,t,at,fall,dir){const p=spr(t,at,.6);if(p<=0)return;const fp=Math.max(0,t-fall),size=62,w=tw(s,'display',size)+100,h=150;
  X.save();X.translate(x+fp*170*dir,y+fp*fp*2800);X.rotate(rot+fp*2*dir);const sc=L(1.7,1,p);X.scale(sc,sc);X.globalAlpha*=cl(p*3);
  X.shadowColor='rgba(46,26,51,.22)';X.shadowOffsetY=12;X.shadowBlur=24;X.fillStyle=K.yel;X.fillRect(-w/2,-h/2,w,h);X.shadowColor='transparent';
  X.fillStyle='rgba(239,228,239,.9)';X.fillRect(-55,-h/2-18,110,36);txt(s,0,22,{size,align:'center'});
  const sp=eo(P(t,fall-.5,.35));if(sp>0){X.strokeStyle=K.vio;X.lineWidth=10;X.lineCap='round';X.beginPath();X.moveTo(-w/2+28,6);X.lineTo(-w/2+28+(w-56)*sp,0);X.stroke();}X.restore();}
function S5(T){const t=T,r=W('raro'),pz=W('personalidad'),fall=pz+1.0;bg(K.cream);
  X.save();X.fillStyle=K.lav;X.beginPath();blob(540,1330,400,t);X.fill();X.restore();
  kicker('pero tampoco',90,300,t,31.05);rise('asumas que…',90,440,t,W('asumir'),{size:124});
  const shk=t>fall?Math.sin((t-fall)*45)*14*(1-P(t,fall,.5)):0;
  catSit(540+shk,1580,1.9,{t,ear:.55*eo(P(t,r,.3))*(1-P(t,fall,.6)),blink:blinkAt(t,[32.6,35.3]),look:-.5*eo(P(t,r,.3))+.9*eo(P(t,pz,.3))});
  note('está raro',400,1350,-.12,t,r,fall,-1);note('es su personalidad',680,1140,.08,t,pz,fall+.12,1);}

// ---------- 6 · el cuaderno y la consulta (37.7 – 49.3) ----------
function pageBase(){X.save();X.shadowColor='rgba(46,26,51,.16)';X.shadowOffsetX=14;X.shadowOffsetY=20;X.fillStyle=K.paper;X.beginPath();X.roundRect(110,300,860,1270,28);X.fill();X.restore();
  X.save();X.strokeStyle='rgba(133,53,135,.12)';X.lineWidth=3;for(let y=640;y<1540;y+=100){X.beginPath();X.moveTo(150,y);X.lineTo(930,y);X.stroke();}X.restore();}
function icon(k,x,y,s=1){X.save();X.translate(x,y);X.scale(s,s);X.fillStyle=K.vio;X.strokeStyle=K.vio;X.lineWidth=7;X.lineCap='round';
  if(k==='bowl'){X.fillStyle=K.dark;X.beginPath();X.ellipse(0,-2,26,8,0,0,TAU);X.fill();X.fillStyle=K.vio;X.beginPath();X.ellipse(0,-2,34,24,0,0,Math.PI);X.fill();}
  if(k==='sun'){X.fillStyle=K.yel;X.beginPath();X.arc(0,0,18,0,TAU);X.fill();X.strokeStyle=K.yel;for(let i=0;i<8;i++){const a=i/8*TAU;X.beginPath();X.moveTo(Math.cos(a)*26,Math.sin(a)*26);X.lineTo(Math.cos(a)*36,Math.sin(a)*36);X.stroke();}}
  if(k==='heart'){X.beginPath();X.moveTo(0,22);X.bezierCurveTo(-40,-6,-18,-34,0,-14);X.bezierCurveTo(18,-34,40,-6,0,22);X.fill();}X.restore();}
function page1(t){rise('su rutina',170,470,t,37.9,{size:96,col:K.vio});txt('vos la conocés mejor que nadie',172,545,{f:'mono',size:30,col:K.mute,a:P(t,38.1,.4)});
  [['07:00','desayuno','rutinas','bowl'],['13:00','sol en la ventana','mejor','sun'],['20:00','sillón con vos','nadie','heart']].forEach(([h,l,wd,ic],i)=>{const at=W(wd),y=720+i*220,p=spr(t,at-.1,.6);
    if(p>0){X.save();X.translate(230,y+30);X.scale(p,p);X.fillStyle=K.lav;X.beginPath();X.arc(0,0,58,0,TAU);X.fill();icon(ic,0,0,1.2);X.restore();}
    X.save();X.beginPath();X.rect(310,y-60,700*eo(P(t,at,.7)),190);X.clip();txt(h,320,y,{f:'mono',size:44,col:K.vio});txt(l,320,y+80,{size:64});X.restore();});
  catSit(830,1520,.45,{t,blink:blinkAt(t,[39.4])});}
function page2(t){rise('esta semana',170,470,t,41.1,{size:96,col:K.vio});
  const xs=[0,1,2,3,4,5,6].map(i=>192+i*116),ch=W('cambia'),hp=eio(P(t,W('mantiene'),.8));
  xs.forEach((x,i)=>{txt('LMMJVSD'[i],x,620,{f:'mono',size:40,col:K.mute,align:'center'});X.fillStyle='rgba(220,198,220,.45)';X.beginPath();X.roundRect(x-50,660,100,160,24);X.fill();});
  if(hp>0){X.fillStyle='rgba(232,210,124,.9)';X.beginPath();X.roundRect(xs[2]-58,700,(xs[6]-xs[2]+116)*hp,90,45);X.fill();}
  xs.forEach((x,i)=>{const c=i>=2?spr(t,ch+(i-2)*.12,.5):0;if(c<1)catSit(x,800,.27*(1-c*.5),{t,ph:i,a:1-cl(c)});if(c>0)catLoaf(x,800,.27*c,{t});});
  rise('y se mantiene',170,1010,t,W('mantiene'),{size:100});rise('en el tiempo',170,1125,t,W('tiempo'),{size:100,col:K.vio});
  const ap=eo(P(t,W('tiempo')+.2,.6));if(ap>0){X.save();X.strokeStyle=K.vio;X.lineWidth=8;X.lineCap='round';X.beginPath();X.moveTo(175,1210);X.lineTo(175+620*ap,1210);
    X.moveTo(175+620*ap-26,1188);X.lineTo(175+620*ap,1210);X.lineTo(175+620*ap-26,1232);X.stroke();X.restore();}}
function rings(){X.save();X.strokeStyle=K.dark;X.lineWidth=9;X.lineCap='round';for(let i=0;i<9;i++){const x=200+i*85;X.beginPath();X.moveTo(x,282);X.lineTo(x,330);X.stroke();}X.restore();}
function consulta(t,fly){const by=L(1100,0,eo(P(t,W('informacion')+.05,.75)));
  kicker('información valiosa',90,250,t,W('valiosa'),{col:K.yel});
  X.save();X.translate(0,by);X.fillStyle=K.dark;X.beginPath();X.roundRect(170,380,740,1150,44);X.fill();X.restore();
  // la hoja del cuaderno vuela y se vuelve la hoja de la consulta
  const rx=L(110,220,fly),ry=L(300,470,fly),rw=L(860,640,fly),rh=L(1270,1000,fly),rot=Math.sin(fly*Math.PI)*-.12;
  X.save();X.translate(rx+rw/2,ry+rh/2+by*(1-fly));X.rotate(rot);X.fillStyle=K.paper;X.shadowColor='rgba(46,26,51,.25)';X.shadowOffsetY=16;X.shadowBlur=30;X.beginPath();X.roundRect(-rw/2,-rh/2,rw,rh,22);X.fill();X.restore();
  X.save();X.translate(0,by);X.fillStyle=K.yel;X.beginPath();X.roundRect(400,340,280,96,26);X.fill();X.fillStyle=K.dark;X.beginPath();X.arc(540,372,14,0,TAU);X.fill();X.restore();
  if(fly>.85){const a=P(fly,.85,.15);X.save();X.globalAlpha*=a;txt('para la consulta',270,600,{size:64});X.fillStyle=K.lav2;X.fillRect(270,640,540,5);X.restore();
    [['qué cambió','informacion'],['desde cuándo','valiosa'],['cuánto dura','consulta']].forEach(([s,wd],i)=>{const at=W(wd)+(i?0:.45),y=780+i*150,p=spr(t,at,.5);
      X.save();X.globalAlpha*=a;X.fillStyle=t>=at?K.vio:K.lav;X.beginPath();X.arc(310,y-20,36*(t>=at?Math.max(.01,p):1),0,TAU);X.fill();
      if(t>=at){X.strokeStyle=K.cream;X.lineWidth=8;X.lineCap='round';X.lineJoin='round';X.beginPath();X.moveTo(294,y-20);X.lineTo(306,y-6);X.lineTo(328,y-34);X.stroke();}
      txt(s,370,y,{size:58,a:t>=at?1:.25});X.restore();});
    X.save();X.globalAlpha*=a;[0,1,2,3,4,5,6].forEach(i=>{X.fillStyle=i>=2?K.vio:K.lav2;X.beginPath();X.arc(300+i*76,1250,20,0,TAU);X.fill();});
    txt('L M M J V S D',300-12,1310,{f:'mono',size:30,col:K.mute,track:22});X.restore();}
  const sp=eo(P(t,W('informacion')+.6,1.2));if(sp>0){X.save();X.strokeStyle=K.cream;X.lineWidth=16;X.lineCap='round';X.setLineDash([1500*sp,3000]);
    X.beginPath();X.moveTo(130,560);X.bezierCurveTo(60,800,60,1300,150,1420);X.bezierCurveTo(200,1490,260,1500,300,1500);X.stroke();X.restore();
    const cp=spr(t,W('informacion')+1.5,.6);if(cp>0){X.save();X.translate(330,1500);X.scale(cp,cp);X.fillStyle=K.yel;X.beginPath();X.arc(0,0,52,0,TAU);X.fill();X.strokeStyle=K.dark;X.lineWidth=10;X.stroke();X.restore();}}}
function S6(T){const t=T,c0=W('informacion')-.15,fly=eio(P(t,c0,.85)),vio=eo(P(t,c0+.05,.7));bg(K.lav);
  if(vio>0){X.save();X.fillStyle=K.vio;X.beginPath();X.arc(540,960,vio*1260,0,TAU);X.fill();X.restore();}
  if(t>=c0){consulta(t,fly);return;}
  const flip=eio(P(t,40.95,.55));
  if(flip>0){pageBase();page2(t);}
  if(flip<1){X.save();X.translate(-flip*1250,-flip*90);X.rotate(-flip*.3);pageBase();page1(t);X.restore();}
  rings();}

// ---------- 7 · cierre (49.3 – fin) ----------
function bubble(s,x,y,p,o){if(p<=0)return;const size=42,w=tw(s,'bold',size)+128,h=100;
  X.save();X.translate(x,y);X.scale(p,p);X.globalAlpha*=cl(p*2)*(o.a??1);X.shadowColor='rgba(46,26,51,.16)';X.shadowOffsetY=10;X.shadowBlur=26;
  X.fillStyle='#FFFFFF';X.beginPath();X.roundRect(0,-h/2,w,h,50);X.fill();X.beginPath();X.moveTo(64,h/2-6);X.lineTo(52,h/2+30);X.lineTo(98,h/2-6);X.fill();X.shadowColor='transparent';
  X.fillStyle=o.av;X.beginPath();X.arc(50,0,26,0,TAU);X.fill();txt(s,92,15,{f:'bold',size,col:K.dark});X.restore();}
function S7(T){const t=T;bg(K.cream);
  X.save();X.fillStyle=K.lav;X.beginPath();blob(540,1380,360,t);X.fill();X.restore();
  rise('contanos en',90,330,t,49.5,{size:124});const cw=tw('comentarios','display',124);
  const up=eo(P(t,W('comentarios')+.25,.5));if(up>0){X.fillStyle=K.yel;X.beginPath();X.roundRect(84,486,(cw+12)*up,26,13);X.fill();}
  rise('comentarios',90,470,t,W('comentarios'),{size:124,col:K.vio});
  const outAt=W('algo',55.5)-.2;
  const B=[['se esconde',90,650,W('cambio',51),K.vio],['duerme más',560,720,W('comportamiento',51),K.yel],['no come igual',120,850,W('gato',52.5),K.yel],['maúlla distinto',520,940,W('cuenta'),K.vio]];
  let look=0;B.forEach(([s,x,y,at,av],i)=>{const p=spr(t,at,.6),o=eio(P(t,outAt+i*.06,.4));if(t>=at)look=x<400?-1:1;
    bubble(s,x,y+Math.sin(t*1.6+i)*6-o*120,p,{av,a:1-o});});
  const bp=spr(t,outAt+.3,.7),press=Math.max(0,1-Math.abs(t-(W('bien',56.5)+.35))/.12);
  if(bp>0){X.save();X.translate(540,830);X.scale(bp*(1-.07*press),bp*(1-.07*press));X.fillStyle=K.vio;X.beginPath();X.roundRect(-270,-75,540,150,75);X.fill();
    X.fillStyle=K.cream;X.beginPath();X.roundRect(-200,-34,74,56,16);X.fill();X.beginPath();X.moveTo(-186,20);X.lineTo(-196,40);X.lineTo(-166,20);X.fill();
    txt('comentá',-100,20,{f:'bold',size:60,col:K.cream});X.restore();
    const rp=P(t,W('bien',56.5)+.35,.7);if(rp>0&&rp<1){X.save();X.strokeStyle=K.vio;X.globalAlpha=1-rp;X.lineWidth=6;X.beginPath();X.roundRect(270-rp*60,755-rp*60,540+rp*120,150+rp*120,75+rp*60);X.stroke();X.restore();}
    txt('te leemos',540,975,{f:'mono',size:32,col:K.mute,align:'center',a:P(t,outAt+.8,.4),track:4});}
  catSit(540,1580,1.45,{t,look,lookUp:t<outAt?.6:.2,blink:Math.max(blinkAt(t,[50.7,53.9]),blinkAt(t,[57.9],.35))});}


// ---------- secciones ----------
SEC(0,S1);
SEC(7.7,S2,{tr:'up'});
SEC(19.3,S3,{tr:'left',bg:K.vio,tone:'accent'});
SEC(W('no',27)-.15,S4,{tr:'up',bg:K.yel,tone:'accent2'});
SEC(30.85,S5,{tr:'right'});
SEC(37.7,S6,{tr:'up',bg:K.lav});
SEC(49.3,S7,{tr:'left'});
// el ojo es violeta hasta que se abre la grilla; la consulta es violeta
function TONE(T){if(T>=19.3&&T<22.35)return'accent';if(T>=SECTS[3].a&&T<30.85)return'accent2';if(T>=W('informacion')&&T<49.3)return'accent';return'light';}

// ---------- sonidos ----------
// máximo 6 (config.sfx_max): tres cambios de mundo + las etiquetas + el botón
[7.55,19.15,37.55].forEach(t=>sfx('whoosh',t));
sfx('pop',W('raro'));sfx('pop',W('personalidad'));sfx('click',W('bien',56.5)+.35);
