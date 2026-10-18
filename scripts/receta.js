#!/usr/bin/env node
// Recetario sin leer el archivo entero.
// uso: node receta.js            → solo el índice de reference/recetas.md
//      node receta.js R03 R07    → solo esas recetas (también "3", "r3")
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','reference','recetas.md'),'utf8').split('\n');
const starts=[];src.forEach((l,i)=>{const m=l.match(/^<a id="r(\d+)"><\/a>/i);if(m)starts.push({n:+m[1],i});});
const ids=process.argv.slice(2);
if(!ids.length){console.log(src.slice(0,starts.length?starts[0].i:src.length).join('\n').trim());console.log('\n(detalle: node scripts/receta.js R03 R07)');process.exit(0);}
let bad=0;
for(const id of ids){const n=+String(id).replace(/\D/g,'');const k=starts.findIndex(x=>x.n===n);
  if(k<0){console.error(`✗ no existe la receta ${id} (hay R${String(starts[0].n).padStart(2,'0')}–R${String(starts[starts.length-1].n).padStart(2,'0')})`);bad=1;continue;}
  console.log(src.slice(starts[k].i+1,k+1<starts.length?starts[k+1].i:src.length).join('\n').trim()+'\n');}
process.exit(bad);
