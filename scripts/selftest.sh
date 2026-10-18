#!/bin/bash
# Prueba rápida de la skill, sin red ni claves: sintaxis, texto escrito vs. pronunciado, variantes del motor,
# plan de dirección y hoja de prueba del ejemplo (reference/ejemplo, con su words.json fijo).
# uso: bash scripts/selftest.sh        (sale con código 1 si algo falla)
SK="$(cd "$(dirname "$0")/.." && pwd)"
PY="$SK/.venv/bin/python"; [ -x "$PY" ] || PY=python3
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
fail=0; ok(){ printf "\033[32mOK\033[0m  %s\n" "$1"; }; bad(){ printf "\033[31mFALLA\033[0m %s\n" "$1"; fail=1; }

# 1 · sintaxis
for f in "$SK"/scripts/*.js; do node --check "$f" 2>/dev/null || bad "sintaxis $f"; done
for f in "$SK"/scripts/*.py; do "$PY" -I -c "import ast,sys;ast.parse(open(sys.argv[1],encoding='utf-8').read())" "$f" || bad "sintaxis $f"; done
for f in install.sh finish.sh; do bash -n "$SK/scripts/$f" || bad "sintaxis $f"; done
[ $fail = 0 ] && ok "sintaxis de scripts"

# 2 · subtítulos: lo escrito ("70 %", "OMS") sobre los tiempos de lo pronunciado
"$PY" -I - "$SK/scripts/tts.py" <<'EOF' && ok "texto escrito vs. pronunciado" || bad "texto escrito vs. pronunciado"
import importlib.util,sys
sp=importlib.util.spec_from_file_location('tts',sys.argv[1]);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
ws=[{'w':x,'s':i*.3,'e':i*.3+.25} for i,x in enumerate('El setenta por ciento según la o eme ese'.split())]
d=[w.get('d') for w in m.display('El 70 % según la OMS.',ws)]
assert d==['El','70 %','','','según','la','OMS','',''],d
ws=[{'w':x,'s':i*.3,'e':i*.3+.25} for i,x in enumerate('cuesta treinta segundos'.split())]
assert [w.get('d') for w in m.display('Cuesta 30 segundos',ws)]==['Cuesta','30','segundos']
EOF

# 3 · las variantes de design.js existen en el motor
node -e "
const fs=require('fs'),D=require('$SK/scripts/design.js'),src=fs.readFileSync('$SK/engine/engine.html','utf8');
const miss=[];for(const [t,vs] of Object.entries(D.VARIANTS))vs.slice(1).forEach(v=>{if(!src.includes(\"v==='\"+v+\"'\"))miss.push(t+':'+v)});
if(miss.length){console.error('variantes sin implementar en engine.html:',miss.join(', '));process.exit(1)}" && ok "variantes de design.js en el motor" || bad "variantes de design.js en el motor"

# 4 · plan y hoja de prueba del ejemplo (HOME aparte: sin historial de looks del usuario)
W="$T/work"; mkdir -p "$W" "$T/home"; cp "$SK"/reference/ejemplo/* "$W/"
printf '{"name":"SELFTEST","out_dir":"%s/out","edit_dir":"%s/out","format":"9:16","fps":30,"brand":"editorial","keywords":["vuelven"],"music":{}}' "$T" "$T" > "$W/config.json"
if HOME="$T/home" node "$SK/scripts/render.js" "$W" --plan > "$T/plan.txt" 2>&1; then
  grep -q '✗' "$T/plan.txt" && { bad "plan del ejemplo con errores de dirección"; grep '✗' "$T/plan.txt"; } || ok "plan del ejemplo ($(grep -c '^ *[0-9]* [a-z]' "$T/plan.txt") escenas)"
else bad "render.js --plan"; cat "$T/plan.txt"; fi
"$PY" -I -c "import json,sys;c=json.load(open(sys.argv[1]));assert any(w['w']=='70\u00a0%' for g in c for w in g['words'])" "$W/captions.json" && ok "subtítulos del ejemplo muestran \"70 %\"" || bad "subtítulos del ejemplo no muestran \"70 %\""
if HOME="$T/home" node "$SK/scripts/render.js" "$W" --test --at=end > "$T/test.txt" 2>&1 && [ -s "$W/sheet.jpg" ]; then ok "hoja de prueba ($(ls "$W"/test/*.jpg | wc -l | tr -d ' ') cuadros)"
else bad "render.js --test"; cat "$T/test.txt"; fi

# 5 · --check (plan + hoja en una corrida), hoja ≤ 1400 px, receta.js
if HOME="$T/home" node "$SK/scripts/render.js" "$W" --check --at=0.2,end > "$T/check.txt" 2>&1 && grep -q '^hoja:' "$T/check.txt" && grep -q 'Dirección' "$T/check.txt"; then
  sw=$(ffprobe -v error -show_entries stream=width -of csv=p=0 "$W/sheet.jpg" 2>/dev/null | head -1)
  [ -n "$sw" ] && [ "$sw" -le 1400 ] && ok "render.js --check (hoja ${sw} px de ancho)" || bad "hoja de --check más ancha que 1400 px ($sw)"
else bad "render.js --check"; cat "$T/check.txt"; fi
node "$SK/scripts/receta.js" | grep -q 'R03' && node "$SK/scripts/receta.js" R03 | head -1 | grep -q 'R03' && ! node "$SK/scripts/receta.js" R99 >/dev/null 2>&1 && ok "receta.js (índice y receta suelta)" || bad "receta.js"

echo; [ $fail = 0 ] && echo "Todo bien ✓" || echo "Hay fallas ✗"; exit $fail
