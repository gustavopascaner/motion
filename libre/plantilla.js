// <NAME> · anim.js del modo libre. Todo lo propio de este video: su mundo, su protagonista y sus secciones.
// API del kit (libre/kit.js, ver reference/libre.md): W('palabra',desde) · B('b03') · P eo eio spr blinkAt · txt rise write marker kicker pill
// bg blob trace along · cam withCam · SEC(inicio, draw, {tr, bg, tone}) · sfx(spec, t) · COL.light/dark/accent/accent2/mute · tint() rgba() · FW FH U
// Reglas: función pura de T · fondos claros predominan · mostrar lo que dice la voz (no escribirlo) · el protagonista reaparece y se transforma.

// ---------- personajes y objetos de este video ----------
function heroe(x,y,s,o={}){const t=o.t||0;X.save();X.translate(x,y);X.scale(s,s);
  X.fillStyle=COL.accent;X.beginPath();blob(0,-120,120,t,.08);X.fill();   // reemplazar por el protagonista del video
  X.restore();}

// ---------- secciones ----------
function S1(T){const t=T;bg(COL.light);
  kicker('antetítulo',90*U,300*U,t,.15);
  rise('título',90*U,470*U,t,.3,{size:130*U});
  heroe(FW/2,FH*.78,1.4*spr(t,.1,.8),{t});}
SEC(0,S1,{tone:'light'});

// ---------- sonidos (opcionales; máx. config.sfx_max) ----------
// sfx('whoosh', 7.5) · sfx('pop', W('raro')) · sfx('click', W('comentarios')+.3)
