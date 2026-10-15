---
name: motion
description: Produce un video de motion graphics de ~1 minuto a partir de un GUION (sin video de cámara) — escenas animadas con la marca del usuario (colores, tipografías, logo), locución con voz IA argentina (mujer u hombre, edge-tts gratis o ElevenLabs), subtítulos dinámicos, música de fondo de Envato con volumen automático y SFX sutiles; entrega un MP4 final + SRT. Al empezar pregunta voz, marca, formato y música. Usar cuando el usuario escribe /motion con un guion (texto o archivo), o pide "hacé un video de motion graphics con este guion", "convertí este guion en video", "video animado con voz en off".
---

# /motion — guion → video de motion graphics con voz en off

Entrada: un **guion** (texto pegado o archivo .txt/.md/.docx). No hay video de cámara: todo son escenas animadas a pantalla completa.
Salida: `<carpeta>/<NAME>_MOTION/` con `<NAME>.mp4` (H.264 + AAC, −14 LUFS), `<NAME>.srt`, `Assets/{voz.wav,musica.*}`, `LEEME.md` y `.work/` (persistente, permite hacer v2).
Hablarle al usuario en español rioplatense (voseo). Avisar el avance entre pasos largos.

Rutas: `SK` = carpeta de esta skill (Claude Code: `~/.claude/skills/motion`; Codex: `~/.codex/skills/motion`).
`PY` = el Python de la skill: `$SK/.venv/bin/python -I` (Windows: `$SK\.venv\Scripts\python.exe -I`). Usarlo para **todos** los scripts `.py`.
Catálogo de escenas: `$SK/reference/escenas.md` · ejemplo completo: `$SK/reference/ejemplo/` (script.json + story.js).
Si `doctor.py` marca algo con ✗: `bash $SK/scripts/install.sh` (Windows: `powershell -ExecutionPolicy Bypass -File $SK\scripts\install.ps1`).

## 0 · Preguntas iniciales (SIEMPRE, antes de producir)
Leer primero el guion y `$PY $SK/scripts/brand.py list` (marcas guardadas). Después preguntar **todo junto en una sola tanda** (en Claude Code con la herramienta AskUserQuestion; en Codex u otros, un solo mensaje numerado). No preguntar lo que el usuario ya dijo.
1. **Voz** — *Mujer* o *Hombre*. Por defecto **argentina** (edge-tts: `es-AR-ElenaNeural` / `es-AR-TomasNeural`). Si el usuario pide otro acento usar la voz de ese país (`tts.py voices es` lista todas: es-UY, es-MX, es-ES, es-CL, es-CO…). Si tiene `ELEVENLABS_API_KEY` y quiere más realismo, ofrecer ElevenLabs (`tts.py voices eleven argentine`).
2. **Marca** — una de las guardadas (mostrarlas por nombre) o *Marca nueva*.
3. **Formato** — *Vertical 9:16* (Reels/TikTok/Shorts, por defecto) · *Cuadrado 1:1* · *4:5* (feed) · *Horizontal 16:9* (YouTube).
4. **Música** — *Enérgica* (Upbeat 110–140 BPM) · *Cálida/inspiradora* (Medium 90–110) · *Corporativa/tranquila* · *Tengo mi música* (pedir la ruta).

**Si es marca nueva**, segunda tanda (también todo junto):
- **Nombre de la marca y logo** (ruta a PNG/SVG, o "sin logo") y usuario de redes (ej. `@consultorio`). Si da logo: `$PY $SK/scripts/brand.py colors <logo>` y proponer la paleta a partir de esos colores.
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
- Partir en **beats** (1 frase o idea, 2–6 s cada uno; 10–18 beats para 1 minuto). Cada beat suele ser una escena.
- `say` (opcional) = cómo se pronuncia cuando el texto escrito confunde a la voz: números grandes ("70 %" → "setenta por ciento"), siglas ("OMS" → "o eme ese"), símbolos, años, abreviaturas. `text` queda como está escrito.
- `pause` = silencio después del beat (default 0,38 s si termina en punto/pregunta, 0,18 s si no). Más pausa (0,6) antes de un remate o del CTA.
- `<work>/script.json`: `{"voice":{"engine":"edge","id":"es-AR-ElenaNeural","rate":"+5%"},"lead":0.35,"target":60,"beats":[{"id":"b01","text":"…"},…]}`
- `$PY $SK/scripts/tts.py "<work>"` → `voice.wav` + `words.json` (tiempo de cada palabra) y la duración. Duración objetivo ≈ 60 s:
  - más de 66 s → subir `rate` (máximo `+15%`); si igual se pasa, **proponer recortes concretos al usuario y esperar respuesta**.
  - más corta → está bien, no estirar el guion (se puede bajar `rate` hasta `-5%` si suena apurada).
- Escuchar mentalmente el ritmo: si un beat queda muy largo (> 7 s), partirlo. Solo se regeneran los beats que cambian (caché).

## 3 · Música
- Si el usuario dio música: `"music": {"path": "/abs/tema.mp3", "offset": 0}`.
- Si no, Envato (siempre instrumental): `$PY $SK/scripts/envato.py search "<work>" music "<estilo en inglés>" --mood <mood> --tempo "<tempo>" [--genre <género>]`. Elegir por tono y por el perfil de energía (parejo, sin caídas largas en el primer minuto) y `$PY $SK/scripts/envato.py use "<work>" music <búsqueda>#<n>`. Poner `offset` (segundo donde entra la parte con energía; mirar el perfil ▁▂▃█).
- Niveles automáticos en mix.py: más fuerte antes de la voz (`intro` −8 dB), baja debajo de la voz (`bed` −21 dB), sube en la cola (`outro` −10 dB) y fade final. Ajustables en `config.music`.
- La vista previa de Envato tiene marca de agua: en la entrega avisar que hay que licenciarla. Con navegador con sesión de Envato: pedir confirmación una vez, licenciar con el nombre del video y descargar en WAV; si no, darle el link al usuario. Luego `$PY $SK/scripts/envato.py collect "<work>"` y volver a correr **solo** `mix.py` (no hace falta re-renderizar).

## 4 · Storyboard → `<work>/story.js`
Basarse en `reference/escenas.md` y `reference/ejemplo/story.js`. Una llamada `S(tipo, inicio, params)` por escena, en orden:
- `inicio`: id de beat (`'b03'`) o `w('palabra')` (arranca en esa palabra). La escena dura hasta que empieza la siguiente; la primera arranca en 0.
- Dentro de params, **todos los tiempos internos se sincronizan con la voz** usando `w('palabra')` (o `w('palabra', 1)` para la 2ª aparición): ítems de lista, conteos, sellos, mensajes, botón del CTA.
- Comunes a todas: `bg` (`'dark'|'light'|'accent'|'accent2'`; si se omite alterna solo), `tr` (`'wipe'|'slide'|'circle'|'push'|'zoom'|'cut'`; si se omite rota), `cap:false` (sin subtítulos), `sfx` (`null` = sin sonido · `'pop'` · `[['ding',1.2]]`).
- Helpers de texto: `H('texto')` = resaltado en caja de color · `A('texto')` = texto en color de acento.

**Criterio de dirección (obligatorio):**
- **Gancho en los primeros 2 s**: `question`, `bigword`, `kinetic` o `title` fuerte, en fondo `accent`. El primer cambio de escena antes de los 3–4 s.
- **Ritmo**: una escena cada 3–5 s (12–18 escenas por minuto). Nada quieto más de ~5 s: si la escena es larga, que se vaya armando (ítems sincronizados).
- **Variedad**: no repetir el tipo de escena seguido; máximo 2 `kinetic` seguidas; alternar escenas de texto con gráficas (`stat`, `bars`, `donut`, `icons`, `steps`, `compare`, `phone`).
- **Mostrar, no repetir**: el texto en pantalla son palabras clave, datos y estructura, no la frase entera (salvo `kinetic`/`quote`, que muestran la frase mientras se dice y apagan los subtítulos).
- Datos → `stat`/`bars`/`donut`. Enumeraciones → `list`/`steps`/`icons`. Contrastes (mito/realidad, antes/después) → `compare`. Preguntas → `question`. Conversaciones/mensajes → `phone`. Remates → `bigword`. Fotos del usuario → `image`.
- **Cierre con `cta`** (seguir / comentar una palabra / guardar / link) sincronizado con lo que dice el guion.
- Textos cortos: títulos de 1–3 palabras por línea, ítems de ≤ 6 palabras.

## 5 · Plan, prueba y render
1. `node $SK/scripts/render.js "<work>" --plan` → escenas con tiempos, SFX y avisos de **Dirección**. Corregir todos los ⚠️ y repetir.
2. `node $SK/scripts/render.js "<work>" --test --at=0.3,mid,end` → `<work>/sheet.jpg` (3 cuadros por escena: entrando, a la mitad, armada). **Mirar la hoja** y corregir: textos que se achican de más (aviso "se achicó al N %"), cortes, superposiciones con los subtítulos, colores con poco contraste, escenas vacías a la mitad (el contenido tiene que aparecer rápido).
3. Render final (en segundo plano, ~1 min por minuto de video): `node $SK/scripts/render.js "<work>"` → `<work>/video.mp4`.
4. `$PY $SK/scripts/mix.py "<work>"` → `<NAME>.mp4` + `<NAME>.srt` en `out_dir`.
5. Mirar 3–4 cuadros del MP4 final (`ffmpeg -ss <t> -i <mp4> -frames:v 1 x.jpg`) para confirmar.

## 6 · Entrega
- `$PY $SK/scripts/timing.py report "<work>"`.
- `LEEME.md` en `out_dir`: voz usada, marca, formato, duración, estructura (tabla escena → texto → tiempo), música (con `envato.py report` y si falta licenciar), SFX, tiempo de procesamiento, cómo pedir cambios.
- Responder corto: ruta del MP4, duración, voz y música elegidas (avisar si la música es vista previa sin licenciar), escenas destacadas, tiempo total.

## Versiones (v2, ajustes)
Reusar `.work`: cambiar `script.json` (voz/texto: solo se regeneran los beats tocados) y/o `story.js`, apuntar `out_dir` a `<NAME>_MOTION_v2` y repetir desde el paso que corresponda (cambio de música o volumen → solo `mix.py`; cambio visual → render + mix; cambio de texto → tts + render + mix). Escenas nuevas: agregarlas a `engine/engine.html` siguiendo `escenas.md`.

## Notas técnicas
- Motor: `engine/engine.html` renderizado cuadro a cuadro con Chrome (puppeteer-core) en paralelo, H.264 yuv420p. Todas las escenas son funciones puras del tiempo.
- El contenido de cada escena se escala solo para entrar en el área segura (por formato) sin desbordar; si se achica mucho, avisa.
- SFX: usa la librería de la skill `edicion` si está instalada (o `assets/sfx` propia con el mismo `catalog.json`); si no hay sonidos, sigue sin ellos.
- Voz: edge-tts usa el servicio de voz de Microsoft Edge (requiere internet, sin clave). ElevenLabs: `{"engine":"eleven","id":"<voice_id>"}` + variable `ELEVENLABS_API_KEY`.
- No usar `rm -rf` con globs relativos.
