// Diseño por video, compartido por render.js y look.js: paletas, variantes, firmas de scenes.js e historial de looks por marca.
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');

// rotación de fondos según look.palette
exports.PAL={classic:['light','accent','light','dark','light','accent3'],dark:['dark','light','accent','light','dark','light','accent3'],light:['light','accent','light','light','dark','light','accent3'],
  blocks:['light','accent','light','dark','accent','light','accent3'],duo:['light','dark','light','light'],accent2:['light','accent2','light','accent','light','dark','accent3']};
// accent3 (opcional, tercer color de marca): va al final de cada rotación, así las marcas sin accent3 quedan exactamente igual
// fondos: predominan los claros y el oscuro entra de vez en cuando (≈ 1 de cada 4-5); render.js evita repetir el mismo fondo en escenas seguidas
// variantes de layout por escena (la primera es el diseño clásico); tienen que coincidir con engine/engine.html
exports.VARIANTS={title:['stack','offset','framed','mask'],kinetic:['rise','pop','light','slam','track','stackup'],bigword:['letters','outline','echo','slam'],stat:['bar','giant','ring','split'],
  list:['rows','cards','bignum'],steps:['line','cards'],compare:['panels','strike','split'],quote:['mark','bar'],bars:['bars','columns'],donut:['ring','dots'],
  icons:['tiles','rows'],question:['mark','inline','bubble'],cta:['button','card']};
exports.TRANSITIONS=['wipe','slide','circle','push','zoom','cut','wipex','split','diag','shape','blinds','layers','iris','zoomblur','slice','morph'];
exports.DECOR=['blobs','rings','dots','stripes','halftone','glyph','orbit','lines','gradient','sun'];

// marcas: las propias en ~/.config/motion/brands/<marca> (fuera del repo, sobreviven a reinstalar); las de ejemplo en <skill>/brands
exports.USER_BRANDS=path.join(os.homedir(),'.config','motion','brands');
exports.brandDir=slug=>{if(path.isAbsolute(String(slug)))return slug;const u=path.join(exports.USER_BRANDS,slug);
  return fs.existsSync(path.join(u,'brand.json'))?u:path.join(__dirname,'..','brands',slug);};

// look.json del work + lo que la marca fija (brand.design.lock le gana al look)
exports.loadLook=(WD,brand)=>{const f=path.join(WD,'look.json');const lk=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};
  return {...lk,...((brand.design||{}).lock||{})};};

// definiciones de <work>/scenes.js: cada SC.x= / MOT.x= al principio de una línea, con la firma (hash) de su código
exports.customDefs=file=>{if(!file||!fs.existsSync(file))return [];const src=fs.readFileSync(file,'utf8'),ms=[...src.matchAll(/^(SC|MOT)\.(\w+)\s*=/gm)];
  return ms.map((m,i)=>{const code=src.slice(m.index,i+1<ms.length?ms[i+1].index:src.length)
      .replace(/\/\/[^\n]*/g,'').replace(/\s+/g,'').replace(/^(SC|MOT)\.\w+=/,'');   // sin comentarios, espacios ni nombre: renombrar no lo hace "nuevo"
    return {kind:m[1],name:m[2],hash:crypto.createHash('sha1').update(code).digest('hex').slice(0,12)};});};

// historial de looks por marca (fuera del repo): ~/.config/motion/looks/<marca>.json
exports.LOOKS_DIR=path.join(os.homedir(),'.config','motion','looks');
exports.historyFile=slug=>path.join(exports.LOOKS_DIR,path.basename(String(slug))+'.json');
exports.history=(slug,WD)=>{const f=exports.historyFile(slug);if(!fs.existsSync(f))return [];
  try{return JSON.parse(fs.readFileSync(f,'utf8')).filter(x=>!WD||path.resolve(x.work||'')!==path.resolve(WD));}catch(e){return [];}};

// parecido entre dos ideas de concept (palabras con contenido en común, 0–1): el hash del código no alcanza para saber si la idea es nueva
const STOP=new Set('el la los las un una unos unas de del y o que en con por para se su sus al lo como entre sin hacia desde'.split(' '));
const toks=s=>new Set(String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(w=>w.length>2&&!STOP.has(w)).map(w=>w.replace(/(es|s)$/,'')));
exports.ideaSim=(a,b)=>{const A=toks(a),B=toks(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.min(A.size,B.size);};

// parecido entre dos looks (0–1) por tokens de diseño
exports.LOOK_KEYS=['estilo','blur','depth','punch','align','valign','frame','scale','kick','kickFont','hl','panel','radius','decor','motion','cam','transitions','palette','hlPrefer','captions','variants'];
exports.lookSim=(a,b)=>{let n=0,eq=0;for(const k of exports.LOOK_KEYS){if(a[k]===undefined&&b[k]===undefined)continue;
  if(k==='variants'){const ks=new Set([...Object.keys(a[k]||{}),...Object.keys(b[k]||{})]);for(const t of ks){n+=.25;if((a[k]||{})[t]===(b[k]||{})[t])eq+=.25;}continue;}
  n++;if(JSON.stringify(a[k])===JSON.stringify(b[k]))eq++;}return n?eq/n:1;};
