# motion — guion → video de motion graphics con voz en off

Skill para **Claude Code** y **Codex** (macOS y Windows). Le das un **guion** y produce un video animado con el guion completo (típicamente ~1 minuto; solo propone recortes si pasa los 2 minutos), listo para publicar:

- **Preguntas al empezar**: voz (mujer/hombre, **argentina por defecto**) y marca. La **música la elige Claude según el guion** (o usa la tuya si se la pasás) y el formato es siempre **vertical 9:16**, salvo que pidas otro (1:1, 4:5 o 16:9). Si la marca es nueva, pregunta logo, colores y tipografías, muestra una vista previa y la **guarda** para los próximos videos.
- **Locución IA** con tiempos por palabra: ElevenLabs (más natural, voces rioplatenses o tu voz clonada; con tu clave) o edge-tts gratis (`es-AR-ElenaNeural` / `es-AR-TomasNeural`, y otros acentos). La voz elegida queda guardada en la marca.
- **Motion graphics** a pantalla completa con la marca: 15 escenas con 2–4 variantes de layout cada una (título, texto cinético, palabra gigante, pregunta, dato que cuenta, anillo, barras, lista, pasos, íconos, comparación, cita, chat, foto, CTA) y transiciones, todo **sincronizado con la voz**.
- **Un diseño nuevo en cada video**, aunque sea la misma marca: cada video tiene su propia dirección de arte (`look.json`: uso del color, resaltados, paneles, decorados, marcos, composición, movimiento, transiciones y una variante por placa), generada lejos de los looks anteriores de la marca. Tipografías y colores se respetan siempre. El **logo** de la marca se usa solo como referencia (colores, estilo, tipografías): no aparece en los videos salvo que lo pidas.
- **Un motion graphic conceptual sin texto** (3–4 s) **diseñado desde cero para cada guion** (nunca reciclado: el render se frena si se repite), más 1–3 placas a medida (`scenes.js`).
- **Subtítulos dinámicos** con la palabra activa resaltada, quemados en el video.
- **Música de Envato** con volumen automático (fuerte al inicio, baja bajo la voz, sube al cierre) y **SFX sutiles**: los genéricos salen de la librería de la skill [edicion](https://github.com/gustavopascaner/edicion) y los específicos (notificación, latido, tipeo…) se generan con ElevenLabs una sola vez y quedan en tu biblioteca local (`scripts/sfx.py`).
- **Dirección**: avisa si el ritmo, la variedad o el gancho no están bien, y arma hojas de prueba antes del render.
- Entrega `NOMBRE.mp4` (H.264/AAC, −14 LUFS) y un `LEEME.md` (sin XML de Premiere ni SRT). Lo que baja de Envato se copia a `Assets/Envato` y se borra de Descargas para no duplicar.

Las instrucciones para el agente están en [`SKILL.md`](SKILL.md).

## Instalación

### macOS
```bash
git clone https://github.com/gustavopascaner/motion.git ~/skills/motion
```
```bash
bash ~/skills/motion/scripts/install.sh
```

### Windows (PowerShell)
```powershell
git clone https://github.com/gustavopascaner/motion.git $HOME\skills\motion
```
```powershell
powershell -ExecutionPolicy Bypass -File $HOME\skills\motion\scripts\install.ps1
```

El instalador agrega lo que falte (Node, FFmpeg, Chrome), crea un entorno de Python con `edge-tts`, instala las dependencias y enlaza la skill en `~/.claude/skills/motion` y `~/.codex/skills/motion` (si ahí había una copia aparte, guarda sus marcas en `~/.config/motion/brands`, la aparta en `~/.config/motion/backups/` y pone el enlace: así hay una sola copia y `git pull` la actualiza). Para los efectos de sonido usa los de la skill `edicion` si está instalada (o pasale la ruta a `edicion-sfx.zip`). Chequeo: `python3 -I scripts/doctor.py`.

### Voz con ElevenLabs (opcional, más natural)
Cada persona usa **su propia clave** (nunca se sube al repo). El instalador la pide (Enter para saltear) y la guarda en `~/.config/motion/elevenlabs_key`. También se puede hacer a mano:
```bash
mkdir -p ~/.config/motion && printf '%s' 'TU_CLAVE' > ~/.config/motion/elevenlabs_key && chmod 600 ~/.config/motion/elevenlabs_key
```
La clave se crea en elevenlabs.io → Developers → API Keys, con los permisos *Text to Speech*, *Voices: Read* y *Sound Effects* (este último para generar efectos de sonido). Voces por defecto: **Agustina** (mujer) y **Manuel** (hombre), argentinas. Sin clave, la skill usa Elena y Tomás de edge-tts (gratis). Se puede usar cualquier otra voz, o una voz clonada propia (requiere un plan pago de ElevenLabs), con su `voice_id`.

## Uso
- **Claude Code:** `/motion` y pegá el guion (o `/motion ruta/al/guion.txt`).
- **Codex:** `$motion` + el guion.

## Estructura
| Carpeta | Qué hay |
|---|---|
| `scripts/tts.py` | Locución por beats con caché y tiempos por palabra |
| `scripts/render.js` | Storyboard → línea de tiempo, subtítulos, SFX, avisos de dirección, render en paralelo con Chrome |
| `scripts/mix.py` | Voz + música + SFX → MP4 final |
| `scripts/sfx.py` | Biblioteca de efectos: buscar y generar sonidos con ElevenLabs |
| `scripts/brand.py` | Marcas: Google Fonts, colores desde el logo, contraste |
| `scripts/envato.py` | Búsqueda de música en Envato y reemplazo por la licenciada |
| `engine/engine.html` | Motor de escenas (HTML/CSS/JS) |
| `brands/` | Marca de ejemplo (`editorial`). Las propias se guardan en `~/.config/motion/brands/` (fuera del repo) y las usa también la skill [edicion](https://github.com/gustavopascaner/edicion) |
| `scripts/look.js`, `scripts/design.js` | Dirección de arte por video e historial de looks por marca |
| `reference/` | Catálogo de escenas, guías por tema (marca nueva, voces, Envato, versiones, preferencias) y un ejemplo completo |
| `scripts/finish.sh`, `finish.ps1`, `qc.py`, `receta.js` | Cierre en una corrida (render + mix + QC), control de calidad del MP4 y consulta del recetario por receta |
| `scripts/selftest.sh` | Prueba rápida sin red: plan, hoja de prueba, subtítulos y variantes del motor |

Tipografías de `brands/editorial/fonts` y las que baja `brand.py`: Google Fonts (SIL Open Font License). La música de Envato se **licencia y descarga automáticamente, sin preguntar**, desde tu sesión de Envato en el navegador de la app de Claude: iniciás sesión vos una sola vez (Claude nunca usa tu contraseña) y en cada video se reemplaza la vista previa por el WAV original, sin marca de agua. Si no hay sesión o falla la descarga, el video se entrega igual con la vista previa y te avisa.
