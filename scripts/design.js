// Diseño por video, compartido por render.js y look.js: paletas, variantes, firmas de scenes.js e historial de looks por marca.
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');

// rotación de fondos según look.palette
exports.PAL={classic:['dark','light','dark','accent'],dark:['dark','dark','accent','dark','light'],light:['light','light','accent','light','dark'],
  blocks:['accent','dark','accent','light'],duo:['dark','light'],accent2:['dark','accent2','light','accent']};
// variantes de layout por escena (la primera es el diseño clásico); tienen que coincidir con engine/engine.html
exports.VARIANTS={title:['stack','offset','framed'],kinetic:['rise','pop','light'],bigword:['letters','outline','echo'],stat:['bar','giant','ring','split'],
  list:['rows','cards','bignum'],steps:['line','cards'],compare:['panels','strike','split'],quote:['mark','bar'],bars:['bars','columns'],donut:['ring','dots'],
  icons:['tiles','rows'],question:['mark','inline','bubble'],cta:['button','card']};
exports.TRANSITIONS=['wipe','slide','circle','push','zoom','cut','wipex','split','diag','shape','blinds'];
exports.DECOR=['blobs','rings','dots','stripes','halftone','glyph','orbit','lines','gradient','sun'];

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

// parecido entre dos looks (0–1) por tokens de diseño
exports.LOOK_KEYS=['align','valign','frame','scale','kick','kickFont','hl','panel','radius','decor','motion','cam','transitions','palette','hlPrefer','captions','variants'];
exports.lookSim=(a,b)=>{let n=0,eq=0;for(const k of exports.LOOK_KEYS){if(a[k]===undefined&&b[k]===undefined)continue;
  if(k==='variants'){const ks=new Set([...Object.keys(a[k]||{}),...Object.keys(b[k]||{})]);for(const t of ks){n+=.25;if((a[k]||{})[t]===(b[k]||{})[t])eq+=.25;}continue;}
  n++;if(JSON.stringify(a[k])===JSON.stringify(b[k]))eq++;}return n?eq/n:1;};
