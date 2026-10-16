---
name: motion
description: Produce un video de motion graphics con voz en off a partir de un GUION (sin video de cámara): escenas animadas con la marca del usuario, locución IA argentina, subtítulos, música y SFX; entrega MP4 + SRT + proyecto de Premiere. Usar cuando el usuario escribe /motion con un guion (texto o archivo), o pide "hacé un video de motion graphics con este guion", "convertí este guion en video", "video animado con voz en off".
---

# /motion — guion → video de motion graphics con voz en off

Entrada: un **guion** (texto pegado o archivo .txt/.md/.docx). No hay video de cámara: todo son escenas animadas a pantalla completa.
Salida: `<carpeta>/<NAME>_MOTION/` con `<NAME>.mp4` (H.264 + AAC, −14 LUFS), `<NAME>.srt`, **`<NAME>_premiere.xml` (proyecto editable)**, `Assets/{Escenas,Subtitulos,Overlay,Voz,Musica,SFX}`, `LEEME.md` y `.work/` (persistente, permite hacer v2).
Hablarle al usuario en español rioplatense (voseo). Avisar el avance entre pasos largos.

Rutas: `SK` = carpeta de esta skill (Claude Code: `~/.claude/skills/motion`; Codex: `~/.codex/skills/motion`).
`PY` = el Python de la skill: `$SK/.venv/bin/python -I` (Windows: `$SK\.venv\Scripts\python.exe -I`). Usarlo para **todos** los scripts `.py`.
Catálogo de escenas: `$SK/reference/escenas.md` · ejemplo completo: `$SK/reference/ejemplo/` (script.json + look.json + scenes.js + story.js).
Leer según haga falta: `reference/marca-nueva.md` · `reference/voces.md` · `reference/envato.md` · `reference/premiere-y-versiones.md` · `reference/preferencias.md` (preferencias del usuario en `~/.config/motion/prefs.json`).
**Cada video tiene un diseño propio** (aunque sea la misma marca): la marca fija tipografías, colores y logo; el look del video (`look.json`), las variantes de cada placa y las escenas a medida (`scenes.js`) cambian siempre. Nunca reutilizar el look ni el concept de un video anterior.
Si `doctor.py` marca algo con ✗ (o avisa que la skill instalada es una copia aparte y no un enlace al repo): `bash $SK/scripts/install.sh` (Windows: `powershell -ExecutionPolicy Bypass -File $SK\scripts\install.ps1`).

## 0 · Preguntas iniciales (SIEMPRE, antes de producir)
Leer primero el guion y `$PY $SK/scripts/brand.py list` (marcas guardadas). Después preguntar **todo junto en una sola tanda** (en Claude Code con la herramienta AskUserQuestion; en Codex u otros, un solo mensaje numerado). No preguntar lo que el usuario ya dijo.
**Música: NO preguntarla.** La elige Claude según el guion (paso 3); si el usuario ya dio una música, usar esa.
**Formato: NO preguntarlo.** Siempre vertical **9:16** (`"format": "9:16"`), salvo que el usuario pida otro (1:1, 4:5 o 16:9).
1. **Voz** — si la marca elegida tiene `voice` guardada, ofrecer primero *La de la marca (<nombre>)*. Si no: *Mujer* o *Hombre*, por defecto **argentina** (`"voice": {"id":"mujer"}` / `{"id":"hombre"}`: ElevenLabs si hay clave, si no edge-tts). Ofrecer otras voces, otro acento o cargar la clave de ElevenLabs solo si el usuario lo pide: ver `reference/voces.md`.
2. **Marca** — una de las guardadas (mostrarlas por nombre) o *Marca nueva*.

**Si es marca nueva**: segunda tanda de preguntas y armado según `reference/marca-nueva.md` (la marca se guarda en `~/.config/motion/brands/<slug>` y sirve también para `/edicion`).

## 1 · Preparación
- `NAME` en MAYÚSCULAS_CON_GUIONES a partir del tema. Carpeta: la del archivo de guion, o el directorio de trabajo si lo pegó. `work=<carpeta>/<NAME>_MOTION/.work`.
- `$PY $SK/scripts/timing.py start "<work>"` (cronómetro) y `$PY $SK/scripts/doctor.py`.
- `config.json`:
```json
{ "name": "NAME", "out_dir": "/abs/<carpeta>/NAME_MOTION", "edit_dir": "/abs/<carpeta>/NAME_MOTION",
  "format": "9:16", "fps": 30, "brand": "<slug>", "tail": 1.6, "keywords": ["palabra","clave"], "sfx_max": 6,
  "music": {} }
```
`keywords` = 3–6 palabras del guion que se resaltan en los subtítulos. Opcionales: `"captions": false`, `"logo_corner": false`.

## 2 · Guion → beats → voz
**El guion es del usuario: no reescribir el contenido.** Solo partirlo y ajustar la pronunciación.
**Una sola voz por video (prohibido mezclar):** todo el video usa la misma voz, el mismo motor, modelo y ajustes. Nunca cambiar de voz entre frases, ni completar con otra voz si ElevenLabs falla (sin créditos, sin clave, error): en ese caso frenar y avisar al usuario. `tts.py` lo hace cumplir: bloquea la voz en `<work>/voice.lock.json` y rechaza otra voz o una voz por beat. Si el usuario pide cambiar la voz, se cambia en **todo** el video con `tts.py "<work>" --cambiar-voz` (regenera la locución completa) y después render + mix.
- Partir en **beats** (1 frase o idea, 2–6 s cada uno; ≈10–18 beats por minuto). Cada beat suele ser una escena.
- `say` (opcional) = cómo se pronuncia cuando el texto escrito confunde a la voz: números grandes ("70 %" → "setenta por ciento"), siglas ("OMS" → "o eme ese"), símbolos, años, abreviaturas. `text` queda como está escrito y es lo que muestran los subtítulos y el SRT ("70 %", no "setenta por ciento"). En story.js `w()` encuentra cualquiera de las dos formas (`w('70')` o `w('setenta')`).
- `pause` = silencio después del beat (default 0,38 s si termina en punto/pregunta, 0,18 s si no). Más pausa (0,6) antes de un remate o del CTA.
- `<work>/script.json`: `{"voice":{"id":"mujer"},"lead":0.35,"beats":[{"id":"b01","text":"…"},…]}` (o la voz guardada en la marca / elegida). Ritmo: `"rate"` (edge) o `"speed"` (ElevenLabs).
- `$PY $SK/scripts/tts.py "<work>"` → `voice.wav` + `words.json` (tiempo de cada palabra) y la duración. **Usar el guion completo, dure lo que dure**: no recortar ni acelerar la voz para llegar a 1 minuto (el ritmo natural de la voz se respeta).
  - Solo si la voz supera los **2 minutos**, proponer recortes concretos al usuario y esperar su respuesta antes de seguir.
  - más corta → está bien, no estirar el guion (se puede bajar `rate` hasta `-5%` si suena apurada).
- Escuchar mentalmente el ritmo: si un beat queda muy largo (> 7 s), partirlo. Solo se regeneran los beats que cambian (caché).

## 3 · Música
- Si el usuario dio música: `"music": {"path": "/abs/tema.mp3", "offset": 0}`.
- Si no, **elegirla vos según el guion, sin preguntar**: leer tono, tema y público (dato duro o urgente → enérgica, Upbeat 110–140 BPM; empático, salud, cuidado → cálida/inspiradora, Medium 90–110; institucional o explicativo → corporativa tranquila; humor → juguetona). Buscar en Envato (siempre instrumental): `$PY $SK/scripts/envato.py search "<work>" music "<estilo en inglés>" --mood <mood> --tempo "<tempo>" [--genre <género>]`. Elegir por tono y por el perfil de energía (parejo, sin caídas largas durante el largo del video; si la música es más corta que el video se repite sola) y `$PY $SK/scripts/envato.py use "<work>" music <búsqueda>#<n>`. Poner `offset` (segundo donde entra la parte con energía; mirar el perfil ▁▂▃█).
- Niveles automáticos en mix.py: más fuerte antes de la voz (`intro` −8 dB), baja debajo de la voz (`bed` −21 dB) y sube un poco en los silencios largos (`lift` +4 dB en pausas de más de `gap` 1,2 s), sube en la cola (`outro` −10 dB) y fade final. Ajustables en `config.music`; Premiere recibe la misma curva.
- **Licenciar y descargar la original** (la vista previa tiene marca de agua audible): seguir `reference/envato.md`. Si `prefs.json` → `envato.auto_license` es `true`, hacerlo sin preguntar por video e informarlo en la entrega. Nunca usar usuario y contraseña: solo la sesión del usuario en el navegador de la app. Si falla, seguir con la vista previa y avisar.

## 3b · Dirección de arte → `<work>/look.json` (obligatorio, en cada video)
1. `node $SK/scripts/look.js new "<work>" --tono=<energico|calido|institucional|humor|sobrio>` (el tono que leíste en el guion). Genera un look coherente y **lo más distinto posible de los últimos videos de la marca** (historial en `~/.config/motion/looks/<marca>.json`): paleta y uso del color, estilo de resaltado `H()`, kicks, paneles y radio, decorado de fondo, marco, alineación, escala tipográfica, movimiento, cámara, familia de transiciones, subtítulos y una variante por tipo de placa. Respeta lo que la marca fije en `brand.json` → `"design":{"lock":{…}}`.
2. Leerlo y **ajustarlo a mano** según el guion (tokens en `reference/escenas.md`). Escribir en `"concepto"` la idea visual en una línea (p. ej. "revista editorial: bloques de color grandes, números gigantes, cortes secos") y en `"concept_idea"` qué cuenta el concept sin texto (p. ej. "una onda va y vuelve entre dos burbujas"): queda en el historial y `--plan` avisa si la idea se parece a la de un video anterior.
3. `node $SK/scripts/render.js "<work>" --look-preview` → `<work>/look.jpg` (6 placas con el look). Mirarla: contraste, que se sienta distinto a lo anterior y adecuado al tema. Ajustar y repetir.

## 4 · Storyboard → `<work>/story.js` (+ `<work>/scenes.js`)
Basarse en `reference/escenas.md` y `reference/ejemplo/story.js`. Una llamada `S(tipo, inicio, params)` por escena, en orden:
- `inicio`: id de beat (`'b03'`) o `w('palabra')` (arranca en esa palabra). La escena dura hasta que empieza la siguiente; la primera arranca en 0.
- Dentro de params, **todos los tiempos internos se sincronizan con la voz** usando `w('palabra')` (o `w('palabra', 1)` para la 2ª aparición): ítems de lista, conteos, sellos, mensajes, botón del CTA.
- Comunes a todas: `bg` (`'dark'|'light'|'accent'|'accent2'`; si se omite alterna solo), `tr` (`'wipe'|'slide'|'circle'|'push'|'zoom'|'cut'`; si se omite rota), `cap:false` (sin subtítulos), `sfx` (`null` = sin sonido · `'pop'` · `[['ding',1.2]]`).
- Helpers de texto: `H('texto')` = resaltado en caja de color · `A('texto')` = texto en color de acento.

- Variantes: cada placa acepta `v` (p. ej. `stat` → `bar|giant|ring|split`); si se omite usa la del look. Alternar variantes dentro del video: la misma placa con la misma variante no más de 2 veces.

**Diseño a medida (obligatorio): `<work>/scenes.js`** — código que se inyecta en el motor solo para este video (API en `reference/escenas.md`).
- **El concept se diseña SIEMPRE desde cero para este guion: un motion graphic SIN TEXTO de 3–4 s.** Elegir la idea del guion que más gane vista como imagen (un proceso, una relación, un cambio, una metáfora concreta del tema) y escribir `MOT.<nombre_propio>` en `scenes.js`; usarlo con `S('concept', …, {motif:'<nombre_propio>', at: w('palabra clave')})` para que el momento fuerte caiga en esa palabra. Los motivos del motor (`growth`, `network`, `dialog`…) son **solo referencia** para estudiar el patrón: nunca usarlos ni copiarlos. `render.js` frena el render si el concept es de la biblioteca, idéntico a uno ya usado en la marca o si falta (en videos de menos de 30 s, falta de concept es solo un aviso). Sin kick ni títulos: la imagen cuenta sola (los subtítulos siguen abajo). Probarlo con `--test --at=0.5,<at>,end`.
- **1–3 placas a medida** (`SC.<nombre>`): las ideas del guion que ninguna placa del catálogo cuenta bien (un reloj que corre 48 h, una receta que se transforma, un termómetro, una agenda que se llena…). Usan los colores y helpers del motor, así heredan la marca y el look.

**Criterio de dirección (obligatorio):**
- **Gancho en los primeros 2 s**: `question`, `bigword`, `kinetic` o `title` fuerte, en fondo `accent`. El primer cambio de escena antes de los 3–4 s.
- **Ritmo**: una escena cada 3–5 s (12–18 escenas por minuto). Nada quieto más de ~5 s: si la escena es larga, que se vaya armando (ítems sincronizados).
- **Variedad**: no repetir el tipo de escena seguido; máximo 2 `kinetic` seguidas; alternar escenas de texto con gráficas (`stat`, `bars`, `donut`, `icons`, `steps`, `compare`, `phone`).
- **Mostrar, no repetir**: el texto en pantalla son palabras clave, datos y estructura, no la frase entera (salvo `kinetic`/`quote`, que muestran la frase mientras se dice y apagan los subtítulos).
- Datos → `stat`/`bars`/`donut`. Enumeraciones → `list`/`steps`/`icons`. Contrastes (mito/realidad, antes/después) → `compare`. Preguntas → `question`. Conversaciones/mensajes → `phone`. Remates → `bigword`. Fotos del usuario → `image`.
- **Cierre con `cta`** (seguir / comentar una palabra / guardar / link) sincronizado con lo que dice el guion.
- **Nunca poner un usuario de redes (@…) en la placa final ni en ninguna escena**, salvo que el usuario lo pida explícitamente y diga cuál es (no inventarlo, no deducirlo, no sacarlo de la marca).
- Textos cortos: títulos de 1–3 palabras por línea, ítems de ≤ 6 palabras.

## 4b · Diseño sonoro (biblioteca + ElevenLabs)
- **Genéricos, automáticos** (biblioteca): whoosh **suave** en transiciones (se le filtran los graves y el ataque), ding al terminar un conteo, pop/ding en ítems, click en el CTA.
- **El video arranca sin SFX**: nada de sonidos en el primer medio segundo (ni whoosh en la primera escena, ni manuales en 0); `render.js` los omite solo. El arranque lo hacen la voz y la música.
- **Prohibido usar golpes graves ('boom')**: nada de hits, bass drops, risers que explotan, impactos ni sonidos con mucho grave como remate. El usuario quiere transiciones suaves. Tampoco generarlos con ElevenLabs (al generar transiciones pedir *soft, airy, no bass, no impact*). Se eligen solos los más importantes y separados; en total como máximo `config.sfx_max` (6) contando los manuales.
- **Literales, a propósito**: 1–2 por video cuando algo que se ve o se dice tiene un sonido propio (llega un mensaje, latido, tipeo, alarma, caja registradora, puerta, aplauso…). Nunca para decorar.
  1. Buscar si ya existe: `$PY $SK/scripts/sfx.py list <palabra>` (biblioteca y generados).
  2. Si no existe y hay clave de ElevenLabs: `$PY $SK/scripts/sfx.py gen "<descripción concreta en inglés>" --id <id-en-español> --cat <categoría> --dur <0.5–3> [--anchor peak]` (anchor `peak` para golpes/latidos, `onset` —default— para lo que arranca en el evento). Se genera **una sola vez** (gasta créditos) y queda en la biblioteca local `~/.config/motion/sfx` para todos los videos; si el id existe, se reusa gratis. Sin clave: usar solo la biblioteca.
  3. Ubicarlo sincronizado: en la escena `sfx:[['<id>', w('palabra')]]` (reemplaza los automáticos de esa escena) o suelto `X('<id>', w('palabra'))`. Volumen: `{gain: 0.3}` como tercer elemento si hace falta.
- Revisar en `render.js --plan` la lista final de SFX: cada uno tiene que sumar; si no, sacarlo (`sfx: null` en la escena).

## 5 · Plan, prueba y render
1. `node $SK/scripts/render.js "<work>" --plan` → escenas con tiempos, variante, SFX y avisos de **Dirección**. Corregir todos los ✗ (frenan el render) y los ⚠️, y repetir.
2. `node $SK/scripts/render.js "<work>" --test --at=0.3,mid,end` → `<work>/sheet.jpg` (3 cuadros por escena: entrando, a la mitad, armada). **Mirar la hoja** y corregir: textos que se achican de más (aviso "se achicó al N %"), cortes, superposiciones con los subtítulos, colores con poco contraste, escenas vacías a la mitad (el contenido tiene que aparecer rápido).
3. Render final (en segundo plano, ~1 min por minuto de video): `node $SK/scripts/render.js "<work>"` → `<work>/video.mp4`.
4. `$PY $SK/scripts/mix.py "<work>"` → `<NAME>.mp4` + `<NAME>.srt` en `out_dir`.
5. **Proyecto para Premiere** (por defecto siempre; saltear solo si `config.premiere` es `false`): `node $SK/scripts/render.js "<work>" --premiere` (en segundo plano, ~2–3 min) y `$PY $SK/scripts/build_xml.py "<work>"`. Pistas y detalles: `reference/premiere-y-versiones.md`.
6. Mirar 3–4 cuadros del MP4 final (`ffmpeg -ss <t> -i <mp4> -frames:v 1 x.jpg`) para confirmar.

## 6 · Entrega
- `node $SK/scripts/look.js log "<work>"` (guarda el look y las firmas de scenes.js en el historial de la marca: el próximo video sale distinto y no puede repetir el concept).
- `$PY $SK/scripts/timing.py report "<work>"`.
- `LEEME.md` en `out_dir` con el contenido de `reference/premiere-y-versiones.md` → *LEEME.md* (cómo abrirlo en Premiere, voz, marca, look, estructura, música, SFX, tiempos, cómo pedir cambios).
- Responder corto: ruta del MP4 y del XML, duración, voz y música elegidas (con una línea de por qué esa música y "música licenciada: <tema> de <autor>", más el aviso de Claim Clear si corresponde; o avisar si quedó la vista previa y por qué), escenas destacadas, tiempo total.

## Versiones (v2, ajustes)
Reusar `.work` y repetir solo desde el paso que cambia (música → `mix.py` + `build_xml.py`; visual → render + mix + `--premiere --only=N`; texto → tts + todo). Detalle y cómo reemplazar un gráfico ya importado en Premiere: `reference/premiere-y-versiones.md`.

## Notas técnicas
- Motor: `engine/engine.html` renderizado cuadro a cuadro con Chrome (puppeteer-core) en paralelo, H.264 yuv420p. Todas las escenas son funciones puras del tiempo.
- El contenido de cada escena se escala solo para entrar en el área segura (por formato) sin desbordar; si se achica mucho, avisa.
- SFX: biblioteca de la skill `edicion` si está instalada (o `assets/sfx` propia con el mismo `catalog.json`) + generados con ElevenLabs en `~/.config/motion/sfx` (catálogo propio, compensación de volumen por sonido). Si falta un sonido, avisa y sigue sin él.
- No usar `rm -rf` con globs relativos.
