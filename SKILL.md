---
name: motion
description: Produce un video de motion graphics con voz en off a partir de un GUION (sin video de cámara): escenas animadas con la marca del usuario, locución IA argentina, subtítulos, música y SFX; entrega un MP4. Usar cuando el usuario escribe /motion con un guion (texto o archivo), o pide "hacé un video de motion graphics con este guion", "convertí este guion en video", "video animado con voz en off".
---

# /motion — guion → video con voz en off
Entrada: guion (texto o archivo). Salida: `<carpeta>/<NAME>_MOTION/` (MP4, `Assets/` solo si hay originales de Envato, `LEEME.md`, `.work/`). **No generar XML de Premiere ni SRT.** Español rioplatense (voseo); avisar el avance entre pasos largos.
**Autonomía:** `/motion` autoriza todos los pasos (voz, SFX, música, render, mezcla); tras el paso 0 no pedir confirmaciones. Frenar solo en: voz > 2 min, falla de ElevenLabs, marca nueva.
`SK` = carpeta de la skill (`~/.claude/skills/motion` o `~/.codex/skills/motion`). `PY` = `$SK/.venv/bin/python -I` (Windows `$SK\.venv\Scripts\python.exe -I`) para todos los `.py`. Si `doctor.py` marca ✗: `bash $SK/scripts/install.sh` (Windows: `install.ps1` con `powershell -ExecutionPolicy Bypass -File`).
**No leer `engine.html` ni `render.js`: todo lo necesario está en `reference/api.md`.** Catálogo de escenas y tokens de look: `reference/escenas.md` · estilos: `estilos.md` · ejemplo: `reference/ejemplo/` · recetas: leer el índice (`node $SK/scripts/receta.js`) y como mucho 3 (`receta.js R03 R07`).
Leer solo si aplica: `marca-nueva.md` · `voces.md` (otra voz, ElevenLabs, `say`/`pause`) · `envato.md` · `sfx.md` (SFX literales) · `versiones.md` (LEEME, v2) · `preferencias.md`.
**Cada video tiene diseño propio** aunque sea la misma marca (la marca fija fuentes y colores): nunca reutilizar el look ni el concept de un video anterior.

## 0 · Marca y preguntas
Leer el guion. Carpeta = la del guion o el directorio de trabajo. Salvo que el usuario ya dijo la marca: `$PY $SK/scripts/brand.py detect "<carpeta>"`. Si detecta, usarla sin preguntar y avisarlo en una línea. Si no (exit 2), preguntarla (`brand.py list` o *Marca nueva* → `marca-nueva.md`) y guardarla: `$PY $SK/scripts/brand.py remember "<carpeta>" <slug>` (también si el usuario corrige una detectada).
Preguntar **solo lo que falte, en una sola tanda**; si no falta nada, arrancar. **Música y formato: no preguntar** (formato 9:16 salvo pedido). **Voz:** la de `brand.json` → `voice` sin preguntar; si no hay, *Mujer* o *Hombre* argentina (`{"id":"mujer"}`/`{"id":"hombre"}`).

## 1 · Preparación
`NAME` en MAYÚSCULAS_CON_GUIONES; `work=<carpeta>/<NAME>_MOTION/.work`. `$PY $SK/scripts/timing.py start "<work>"` y `$PY $SK/scripts/doctor.py`. `<work>/config.json`:
```json
{ "name": "NAME", "out_dir": "/abs/<carpeta>/NAME_MOTION", "edit_dir": "/abs/<carpeta>/NAME_MOTION",
  "format": "9:16", "fps": 30, "brand": "<slug>", "tail": 1.6, "keywords": ["palabra","clave"], "sfx_max": 6, "music": {} }
```
`keywords` = 3–6 palabras del guion resaltadas. Opcional: `"captions": false`.
**Logo: nunca va en el video por defecto.** El logo de la marca es solo referencia para sacar colores, estilo y tipografías. Solo si el usuario pide expresamente el logo en el video: `"logo": true` (y `"logo_corner": false` para que no quede en la esquina).

## 2 · Guion → beats → voz
**El guion es del usuario: no reescribir el contenido**, solo partirlo (beats de 1 frase, 2–6 s, ≈10–18 por minuto) y ajustar pronunciación (`say`, `pause`: `voces.md`). **Una sola voz por video**: mismo motor, modelo y ajustes; nunca mezclar ni completar con otra si ElevenLabs falla (frenar y avisar; `tts.py` lo hace cumplir con `voice.lock.json`; cambiar = `tts.py "<work>" --cambiar-voz`).
`<work>/script.json`: `{"voice":{"id":"mujer"},"lead":0.35,"beats":[{"id":"b01","text":"…"},…]}`. Luego `$PY $SK/scripts/tts.py "<work>"` → `voice.wav` + `words.json`. Guion completo, sin recortar ni acelerar; si la voz supera **2 min**, proponer recortes y esperar respuesta.

## 3 · Música (sin preguntar)
Si el usuario dio una: `"music": {"path": "/abs/tema.mp3", "offset": 0}`. Si no, elegirla según tono, tema y público (mapa tono → mood/tempo en `envato.md`), siempre instrumental: `$PY $SK/scripts/envato.py search "<work>" music "<estilo en inglés>" --mood <mood> --tempo "<tempo>" [--genre <género>]`, elegir por tono y energía pareja, y `$PY $SK/scripts/envato.py use "<work>" music <búsqueda>#<n>`; `offset` = segundo donde entra la parte con energía. Licenciar y descargar la original (la preview tiene marca de agua): `envato.md` (si `prefs.json` → `envato.auto_license` es `true`, sin preguntar; nunca usuario/contraseña; si falla, seguir con la preview y avisar).
Después: `$PY $SK/scripts/beats.py "<work>"` → `beats.json` (los cortes caen en el golpe).

## 3b · Tratamiento (obligatorio, corto)
Escribir **3 ideas madre de una línea** (metáfora visual que atraviese todo) y elegir la más audaz que se entienda. De ahí salen el **objeto héroe** (reaparece y se transforma en 3+ escenas), los **3–4 momentos fuertes** (gancho, giro, dato, remate: slam, punch, `layers`/`morph`, concept) y los match cut entre temas. Va en `look.json` → `"tratamiento"` (2–3 líneas); no mostrárselo al usuario.

## 3c · Dirección de arte (obligatorio)
1. `node $SK/scripts/look.js new "<work>" --tono=<energico|calido|institucional|humor|sobrio> --estilo=<slug|auto>`: el estilo curado que sirva al tratamiento (`estilos.md`; `auto` = uno que la marca no usó en sus últimos 3 videos). Aplicar sus `estilo_reglas`.
2. Ajustarlo a mano según el guion (tokens en `escenas.md`). Escribir `"concepto"` (idea visual en una línea) y `"concept_idea"` (qué cuenta el concept sin texto).
3. `node $SK/scripts/render.js "<work>" --look-preview` → `look.jpg`. **Mirada 1**: contraste, que se sienta distinto y adecuado al tema.

## 4 · Storyboard → `<work>/story.js` + `<work>/scenes.js`
API en `reference/api.md`. `S(tipo, inicio, params)` por escena, en orden; `inicio` = id de beat o `w('palabra')`; tiempos internos también con `w()` (sincronizados con la voz).  Variantes `v`: la misma placa con la misma variante no más de 2 veces.
**A medida (obligatorio) en `scenes.js`:**
- **Concept SIEMPRE nuevo, desde cero**: motion graphic SIN TEXTO de 3–4 s con la idea del guion que más gane como imagen. `MOT.<nombre_propio>` y `S('concept', …, {motif:'<nombre_propio>', at: w('palabra clave')})`. Los motivos del motor son solo referencia: nunca usarlos ni copiarlos (`render.js` frena el render si es de biblioteca, repetido en la marca o falta; en videos < 30 s falta es solo aviso).
- **1–3 placas `SC.<nombre>`** para el objeto héroe y las ideas que el catálogo no cuenta. **Meta: ≥ 40 % del tiempo en escenas a medida** (concept + SC propias; una placa puede repetirse con otros params). Adaptar las recetas, no copiarlas.

**Criterio de dirección:**
- **Gancho en los primeros 2 s** (`question`, `bigword`, `kinetic` o `title` fuerte, `bg` accent); primer cambio antes de 3–4 s.
- **Ritmo**: una escena cada 3–5 s, cortes en el golpe, 1–2 respiros entre escenas secas. Nada quieto > ~5 s: que se vaya armando con ítems sincronizados.
- **Variedad**: no repetir tipo seguido; máx. 2 `kinetic` seguidas; alternar texto y gráficas.
- **Mostrar, no repetir**: en pantalla palabras clave, datos y estructura (salvo `kinetic`/`quote`). Datos → `stat`/`bars`/`donut`; enumeraciones → `list`/`steps`/`icons`; contrastes → `compare`; preguntas → `question`; mensajes → `phone`; remates → `bigword`; fotos del usuario → `image`.
- **Cierre con `cta`** sincronizado con el guion. **Nunca un usuario de redes (@…) en ninguna escena**, salvo que el usuario lo pida y diga cuál (no inventarlo ni sacarlo de la marca). Textos cortos: títulos de 1–3 palabras por línea, ítems ≤ 6. **Nunca partir una palabra con guion entre renglones** (`"INTELI-"` / `"GENCIA"`): si no entra, cambiar la palabra o repartir el texto de otra forma; `render.js` frena el render si lo detecta.

## 4b · Sonido
Automático (whoosh suave, ding/pop/click); el video arranca sin SFX. **Prohibido el 'boom'**: golpes graves, hits, bass drops, impactos (tampoco generados con ElevenLabs). Máximo `config.sfx_max` (6) contando los manuales. Literales (1–2 por video, solo si algo suena de verdad): `sfx.md`.

## 5 · Chequeo, director y entrega
1. `node $SK/scripts/render.js "<work>" --check` → plan (escenas, SFX, avisos de **Dirección**) + `sheet.jpg` (5 cuadros por escena; los primeros muestran cómo ENTRA). Corregir todos los ✗ (frenan el render) y ⚠️, textos achicados ("se achicó al N %"), superposiciones con subtítulos, poco contraste y escenas vacías a la mitad. **Mirada 2.**
2. **Revisión de director (una sola ronda, máx. 2 escenas rehechas):** puntuar cada escena 1–5 en *potencia* (movimiento con intención), *idea* (cuenta algo o decora) y *continuidad* (objeto héroe / estilo); rehacer las **2 peores** (más movimiento, otra receta, otra transición) sin iterar más; puntajes en `<work>/direccion.md` (una línea por escena). Correr de nuevo `--check` y mirar la hoja: **Mirada 3** (solo 3 miradas por video).
3. **Cierre** (en segundo plano): `bash $SK/scripts/finish.sh "<work>"` (Windows: `finish.ps1`). Hace render + `mix.py` + `qc.py` (duración vs. voz, audio, cuadros negros/congelados) + `look.js log` + `timing.py report`; detalle en `<work>/finish.log`. Si el QC avisa algo, corregir y repetir el paso afectado. No mirar cuadros del MP4.
4. `LEEME.md` en `out_dir` (contenido en `versiones.md` → *LEEME.md*).
5. Responder corto: ruta del MP4, duración, voz y música (una línea de por qué y "música licenciada: <tema> de <autor>" más el aviso de Claim Clear si corresponde; o que quedó la preview y por qué), escenas destacadas, tiempo total.

## Versiones (v2, ajustes)
Reusar `.work` y repetir desde el paso que cambia (música → `mix.py`; visual → render + mix; texto → tts + todo): `versiones.md`.
