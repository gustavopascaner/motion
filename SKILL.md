---
name: motion
description: Produce un video de motion graphics (típicamente ~1 minuto; dura lo que dure el guion completo) a partir de un GUION (sin video de cámara) — escenas animadas con la marca del usuario (colores, tipografías, logo), locución con voz IA argentina (mujer u hombre, edge-tts gratis o ElevenLabs), subtítulos dinámicos, música de fondo de Envato con volumen automático y SFX sutiles; entrega un MP4 final + SRT. Al empezar pregunta voz y marca (la música la elige según el guion y el formato es siempre 9:16, salvo que el usuario pida otra cosa). Usar cuando el usuario escribe /motion con un guion (texto o archivo), o pide "hacé un video de motion graphics con este guion", "convertí este guion en video", "video animado con voz en off".
---

# /motion — guion → video de motion graphics con voz en off

Entrada: un **guion** (texto pegado o archivo .txt/.md/.docx). No hay video de cámara: todo son escenas animadas a pantalla completa.
Salida: `<carpeta>/<NAME>_MOTION/` con `<NAME>.mp4` (H.264 + AAC, −14 LUFS), `<NAME>.srt`, **`<NAME>_premiere.xml` (proyecto editable)**, `Assets/{Escenas,Subtitulos,Overlay,Voz,Musica,SFX}`, `LEEME.md` y `.work/` (persistente, permite hacer v2).
Hablarle al usuario en español rioplatense (voseo). Avisar el avance entre pasos largos.

Rutas: `SK` = carpeta de esta skill (Claude Code: `~/.claude/skills/motion`; Codex: `~/.codex/skills/motion`).
`PY` = el Python de la skill: `$SK/.venv/bin/python -I` (Windows: `$SK\.venv\Scripts\python.exe -I`). Usarlo para **todos** los scripts `.py`.
Catálogo de escenas: `$SK/reference/escenas.md` · ejemplo completo: `$SK/reference/ejemplo/` (script.json + story.js).
Si `doctor.py` marca algo con ✗: `bash $SK/scripts/install.sh` (Windows: `powershell -ExecutionPolicy Bypass -File $SK\scripts\install.ps1`).

## 0 · Preguntas iniciales (SIEMPRE, antes de producir)
Leer primero el guion y `$PY $SK/scripts/brand.py list` (marcas guardadas). Después preguntar **todo junto en una sola tanda** (en Claude Code con la herramienta AskUserQuestion; en Codex u otros, un solo mensaje numerado). No preguntar lo que el usuario ya dijo.
**Música: NO preguntarla.** La elige Claude según el guion (paso 3); si el usuario ya dio una música, usar esa.
**Formato: NO preguntarlo.** Siempre vertical **9:16** (`"format": "9:16"`), salvo que el usuario pida otro (1:1, 4:5 o 16:9).
1. **Voz** — si la marca elegida tiene `voice` guardada, ofrecer primero *La de la marca (<nombre>)*. Si no: *Mujer* o *Hombre*, por defecto **argentina**.
   - **Voces por defecto** (elección del usuario): mujer → **Agustina** (ElevenLabs `TZvhlMgMw2P4gPSuD8v7`), hombre → **Manuel** (ElevenLabs `L7pBVwjueW3IPcQt4Ej9`). En `script.json` alcanza con `"voice": {"id":"mujer"}` o `{"id":"hombre"}`: tts.py usa ElevenLabs si hay clave y, si no, Elena / Tomás de edge-tts (gratis); en ese caso mencionar una vez que con una clave de ElevenLabs suena más natural. Ofrecer otras voces solo si el usuario lo pide.
   - Elegir voz de ElevenLabs: `tts.py voices eleven argentine` (voces propias, incluida una voz clonada del usuario, y biblioteca rioplatense), generar 3–4 muestras con `tts.py samples "<work>/muestras_voz" "<primera frase del guion>" <id1> <id2> …`, dárselas al usuario para escuchar y usar la que elija. Guardarla en la marca (`brand.json` → `"voice": {"engine":"eleven","id":"…","name":"…"}`) para no volver a preguntar.
   - Otro acento: la voz de ese país (`tts.py voices es` lista las de edge: es-UY, es-MX, es-ES, es-CL, es-CO…; en ElevenLabs, `voices eleven <acento>`).
   - **Clave de ElevenLabs**: nunca va en el repo ni en la skill. Si el usuario quiere ElevenLabs y no hay clave, pedirle que la cree (elevenlabs.io → Developers → API Keys, con permisos *Text to Speech*, *Voices: Read* y *Sound Effects*) y la guarde él mismo con `mkdir -p ~/.config/motion && printf '%s' 'CLAVE' > ~/.config/motion/elevenlabs_key && chmod 600 ~/.config/motion/elevenlabs_key`; si la pega en el chat, guardarla así y sugerir rotarla después.
2. **Marca** — una de las guardadas (mostrarlas por nombre) o *Marca nueva*.

**Si es marca nueva**, segunda tanda (también todo junto):
- **Nombre de la marca y logo** (ruta a PNG/SVG, o "sin logo"). **No preguntar ni guardar usuario de redes.** Si da logo: `$PY $SK/scripts/brand.py colors <logo>` y proponer la paleta a partir de esos colores.
- **Colores** — opciones: *Sacarlos del logo* · *Negro + naranja* (editorial) · *Azul profundo + celeste* (salud/confianza) · *Verde + crema* (bienestar); o hex propios. Se necesitan 4: `dark` (fondo oscuro), `light` (fondo claro), `accent` (resaltado principal), `accent2` (secundario, opcional).
- **Tipografías** — `brand.py fonts` lista combinaciones: *Editorial condensada* · *Moderna geométrica* · *Impacto* · *Elegante* (o cualquier familia de Google Fonts por nombre).
- **Estilo** — subtítulos sí/no (por defecto sí), decorado de fondo: *grano + grilla + manchas de color* (default) · *anillos* · *puntos* · *limpio*.
Crear `$SK/brands/<slug>/brand.json` copiando `brands/editorial/brand.json` (en cada tipografía dejar solo `family`, `weight`, y para títulos `upper`/`stretch`/`tracking`/`leading`; para acento `italic`), poner `logo` con la ruta absoluta y correr `$PY $SK/scripts/brand.py setup <slug>` (baja las fuentes, copia el logo, chequea contraste: corregir los ⚠️). Mostrar la muestra: `node $SK/scripts/render.js --brand-preview=<slug> --out=<work>/marca.jpg --format=<formato>` → mirar la imagen y mostrársela al usuario; confirmar antes de seguir (es rápido de ajustar). La marca queda guardada para la próxima.

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
- `say` (opcional) = cómo se pronuncia cuando el texto escrito confunde a la voz: números grandes ("70 %" → "setenta por ciento"), siglas ("OMS" → "o eme ese"), símbolos, años, abreviaturas. `text` queda como está escrito.
- `pause` = silencio después del beat (default 0,38 s si termina en punto/pregunta, 0,18 s si no). Más pausa (0,6) antes de un remate o del CTA.
- `<work>/script.json`: `{"voice":{"id":"mujer"},"lead":0.35,"beats":[{"id":"b01","text":"…"},…]}` (o la voz guardada en la marca / elegida). Con ElevenLabs el ritmo se ajusta con `"speed"` (0.9–1.15) en vez de `"rate"`.
- `$PY $SK/scripts/tts.py "<work>"` → `voice.wav` + `words.json` (tiempo de cada palabra) y la duración. **Usar el guion completo, dure lo que dure**: no recortar ni acelerar la voz para llegar a 1 minuto (el ritmo natural de la voz se respeta).
  - Solo si la voz supera los **2 minutos**, proponer recortes concretos al usuario y esperar su respuesta antes de seguir.
  - más corta → está bien, no estirar el guion (se puede bajar `rate` hasta `-5%` si suena apurada).
- Escuchar mentalmente el ritmo: si un beat queda muy largo (> 7 s), partirlo. Solo se regeneran los beats que cambian (caché).

## 3 · Música
- Si el usuario dio música: `"music": {"path": "/abs/tema.mp3", "offset": 0}`.
- Si no, **elegirla vos según el guion, sin preguntar**: leer tono, tema y público (dato duro o urgente → enérgica, Upbeat 110–140 BPM; empático, salud, cuidado → cálida/inspiradora, Medium 90–110; institucional o explicativo → corporativa tranquila; humor → juguetona). Buscar en Envato (siempre instrumental): `$PY $SK/scripts/envato.py search "<work>" music "<estilo en inglés>" --mood <mood> --tempo "<tempo>" [--genre <género>]`. Elegir por tono y por el perfil de energía (parejo, sin caídas largas durante el largo del video; si la música es más corta que el video se repite sola) y `$PY $SK/scripts/envato.py use "<work>" music <búsqueda>#<n>`. Poner `offset` (segundo donde entra la parte con energía; mirar el perfil ▁▂▃█).
- Niveles automáticos en mix.py: más fuerte antes de la voz (`intro` −8 dB), baja debajo de la voz (`bed` −21 dB), sube en la cola (`outro` −10 dB) y fade final. Ajustables en `config.music`.
- **Licenciar y descargar la original (siempre, para entregar sin marca de agua)** — la vista previa de Envato tiene marca de agua audible:
  1. **Nunca iniciar sesión con usuario y contraseña** (ni aunque el usuario los pase). Se usa la sesión del usuario en el **navegador de la app** (built-in browser, sesión persistente). Si no está logueado: abrir la página del tema y pedirle que inicie sesión él (una sola vez).
  2. **Autorización permanente del usuario: licenciar y descargar SIN pedir confirmación.** El usuario lo decidió explícitamente (15/10/2026): licenciar y bajar la música elegida es parte del pedido `/motion` (su cuenta de Envato licencia automáticamente al descargar, dentro de su suscripción). No preguntar "¿dale?" ni pedir OK por video: hacerlo y solo informar en la entrega qué tema se licenció. Lo único que frena el flujo es que no haya sesión iniciada (pedirle que la inicie él). Si algo falla (sin sesión, error de descarga, enlace vencido), seguir con la vista previa y avisarlo en la entrega, sin bloquear el video.
  3. Abrir el link del ítem (`config.music.envato.url`) → redirige a `app.envato.com` → clic en **Descargar**. La cuenta del usuario tiene **licencia automática** ("Licenciado automáticamente"); si en otra cuenta aparece un diálogo de proyecto, licenciar con el nombre del video.
  4. El navegador de la app no guarda archivos en la Mac: leer las solicitudes de red (`read_network_requests` con patrón `download`), abrir la respuesta de `download.data` y tomar el `downloadUrl` firmado (vence en minutos). Bajarlo con `curl -sSL --fail -o <scratchpad>/envato_dl/<slug>.zip "<downloadUrl>"` (carpeta nueva y vacía).
  5. `$PY $SK/scripts/envato.py collect "<work>" --file music <zip>` (elige el WAV del zip) → volver a correr **solo** `mix.py` y `build_xml.py` (no hace falta re-renderizar). Verificar con `envato.py report` que diga ✅ licenciado.
  6. Avisar si la página dice **"No está listo para ver Claim Clear"**: en YouTube puede aparecer un reclamo de Content ID que se resuelve con la licencia (en Instagram/TikTok no afecta).
  - Si no hay navegador o el usuario no quiere: darle el link para que lo baje él y después `envato.py collect "<work>"` (busca en ~/Downloads).

## 4 · Storyboard → `<work>/story.js`
Basarse en `reference/escenas.md` y `reference/ejemplo/story.js`. Una llamada `S(tipo, inicio, params)` por escena, en orden:
- `inicio`: id de beat (`'b03'`) o `w('palabra')` (arranca en esa palabra). La escena dura hasta que empieza la siguiente; la primera arranca en 0.
- Dentro de params, **todos los tiempos internos se sincronizan con la voz** usando `w('palabra')` (o `w('palabra', 1)` para la 2ª aparición): ítems de lista, conteos, sellos, mensajes, botón del CTA.
- Comunes a todas: `bg` (`'dark'|'light'|'accent'|'accent2'`; si se omite alterna solo), `tr` (`'wipe'|'slide'|'circle'|'push'|'zoom'|'cut'`; si se omite rota), `cap:false` (sin subtítulos), `sfx` (`null` = sin sonido · `'pop'` · `[['ding',1.2]]`).
- Helpers de texto: `H('texto')` = resaltado en caja de color · `A('texto')` = texto en color de acento.

**Criterio de dirección (obligatorio):**
- **Una escena `concept` por video (obligatoria): un motion graphic SIN TEXTO de 3–4 s.** Elegir el concepto del guion que más gane visto como imagen (un proceso, una relación, un cambio, una idea abstracta) y animarlo con formas, líneas y partículas: crecimiento, red, ciclo, filtro, foco, equilibrio, romper una barrera, del caos al orden, latido, camino, atracción, diálogo, bifurcación, acumulación (`motif`, ver `reference/escenas.md`). Ubicarla donde la idea se dice, con `at: w('palabra clave')` para que el momento fuerte de la animación caiga en esa palabra. Si ningún motivo representa bien la idea, crear uno nuevo en `engine.html` (`MOT.nombre`, siguiendo el patrón de los existentes) en vez de forzar uno que no corresponde. Sin kick ni títulos: la imagen cuenta sola (los subtítulos siguen abajo).
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
- **Prohibido usar golpes graves ('boom')**: nada de hits, bass drops, risers que explotan, impactos ni sonidos con mucho grave como remate. El usuario quiere transiciones suaves. Tampoco generarlos con ElevenLabs (al generar transiciones pedir *soft, airy, no bass, no impact*). Se eligen solos los más importantes y separados; en total como máximo `config.sfx_max` (6) contando los manuales.
- **Literales, a propósito**: 1–2 por video cuando algo que se ve o se dice tiene un sonido propio (llega un mensaje, latido, tipeo, alarma, caja registradora, puerta, aplauso…). Nunca para decorar.
  1. Buscar si ya existe: `$PY $SK/scripts/sfx.py list <palabra>` (biblioteca y generados).
  2. Si no existe y hay clave de ElevenLabs: `$PY $SK/scripts/sfx.py gen "<descripción concreta en inglés>" --id <id-en-español> --cat <categoría> --dur <0.5–3> [--anchor peak]` (anchor `peak` para golpes/latidos, `onset` —default— para lo que arranca en el evento). Se genera **una sola vez** (gasta créditos) y queda en la biblioteca local `~/.config/motion/sfx` para todos los videos; si el id existe, se reusa gratis. Sin clave: usar solo la biblioteca.
  3. Ubicarlo sincronizado: en la escena `sfx:[['<id>', w('palabra')]]` (reemplaza los automáticos de esa escena) o suelto `X('<id>', w('palabra'))`. Volumen: `{gain: 0.3}` como tercer elemento si hace falta.
- Revisar en `render.js --plan` la lista final de SFX: cada uno tiene que sumar; si no, sacarlo (`sfx: null` en la escena).

## 5 · Plan, prueba y render
1. `node $SK/scripts/render.js "<work>" --plan` → escenas con tiempos, SFX y avisos de **Dirección**. Corregir todos los ⚠️ y repetir.
2. `node $SK/scripts/render.js "<work>" --test --at=0.3,mid,end` → `<work>/sheet.jpg` (3 cuadros por escena: entrando, a la mitad, armada). **Mirar la hoja** y corregir: textos que se achican de más (aviso "se achicó al N %"), cortes, superposiciones con los subtítulos, colores con poco contraste, escenas vacías a la mitad (el contenido tiene que aparecer rápido).
3. Render final (en segundo plano, ~1 min por minuto de video): `node $SK/scripts/render.js "<work>"` → `<work>/video.mp4`.
4. `$PY $SK/scripts/mix.py "<work>"` → `<NAME>.mp4` + `<NAME>.srt` en `out_dir`.
5. **Proyecto para Premiere** (por defecto siempre; saltear solo si `config.premiere` es `false`): `node $SK/scripts/render.js "<work>" --premiere` (en segundo plano, ~2–3 min) y `$PY $SK/scripts/build_xml.py "<work>"`. Pistas: V1 escenas (una por clip, con la transición de entrada ya compuesta) · V2 subtítulos con alfa · V3 logo · A1 voz (una frase por clip) · A2 música con keyframes de volumen · A3+ SFX. Marcadores por escena.
6. Mirar 3–4 cuadros del MP4 final (`ffmpeg -ss <t> -i <mp4> -frames:v 1 x.jpg`) para confirmar.

## 6 · Entrega
- `$PY $SK/scripts/timing.py report "<work>"`.
- `LEEME.md` en `out_dir`: **cómo abrirlo en Premiere** (Archivo → Importar → `<NAME>_premiere.xml`; no mover ni renombrar la carpeta; tabla de pistas; qué se edita ahí — cortar/mover/borrar escenas, re-timear frases de la voz, cambiar música y volúmenes, sacar SFX, usar el `.srt` como subtítulos nativos — y qué no: el texto dentro de cada gráfico, que se cambia pidiéndoselo a Claude), voz usada, marca, formato, duración, estructura (tabla escena → texto → tiempo), música (con `envato.py report` y si falta licenciar), SFX, tiempo de procesamiento, cómo pedir cambios.
- Responder corto: ruta del MP4 y del XML, duración, voz y música elegidas (con una línea de por qué esa música y "música licenciada: <tema> de <autor>", más el aviso de Claim Clear si corresponde; o avisar si quedó la vista previa y por qué), escenas destacadas, tiempo total.

## Versiones (v2, ajustes)
Reusar `.work`: cambiar `script.json` (voz/texto: solo se regeneran los beats tocados) y/o `story.js`, apuntar `out_dir` a `<NAME>_MOTION_v2` y repetir desde el paso que corresponda (cambio de música o volumen → solo `mix.py` + `build_xml.py`; cambio visual → render + mix + `render.js --premiere --only=<n.º de escena>` + `build_xml.py`; cambio de texto → tts + todo).
**Cambiar un texto de un gráfico ya importado en Premiere**: editar story.js y correr `render.js --premiere --only=N` (re-renderiza solo esa escena con el **mismo nombre de archivo**), el MP4 si se quiere, y avisar al usuario que en Premiere haga clic derecho en el clip → *Reemplazar/Vincular medios* (o cierre y reabra el proyecto) para ver el cambio. Si cambia la duración de la escena, regenerar el XML y reimportar. Escenas nuevas: agregarlas a `engine/engine.html` siguiendo `escenas.md`.

## Notas técnicas
- Capas para Premiere: escenas en ProRes 422 HQ (opacas); subtítulos y logo en ProRes 4444 con alfa. El audio en Premiere queda ~2 dB más bajo que el MP4 (el MP4 lleva una normalización final a −14 LUFS).
- Motor: `engine/engine.html` renderizado cuadro a cuadro con Chrome (puppeteer-core) en paralelo, H.264 yuv420p. Todas las escenas son funciones puras del tiempo.
- El contenido de cada escena se escala solo para entrar en el área segura (por formato) sin desbordar; si se achica mucho, avisa.
- SFX: biblioteca de la skill `edicion` si está instalada (o `assets/sfx` propia con el mismo `catalog.json`) + generados con ElevenLabs en `~/.config/motion/sfx` (catálogo propio, compensación de volumen por sonido). Si falta un sonido, avisa y sigue sin él.
- Voz: edge-tts usa el servicio de voz de Microsoft Edge (requiere internet, sin clave). ElevenLabs: `{"engine":"eleven","id":"<voice_id>"}` en script.json; clave en `ELEVENLABS_API_KEY` o `~/.config/motion/elevenlabs_key`. Cada beat se genera con el anterior y el siguiente como contexto (entonación continua) y queda en caché: solo se cobran los beats que cambian (≈1000 caracteres por minuto de guion).
- No usar `rm -rf` con globs relativos.
