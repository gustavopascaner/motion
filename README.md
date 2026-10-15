# motion — guion → video de motion graphics con voz en off

Skill para **Claude Code** y **Codex** (macOS y Windows). Le das un **guion** y produce un video animado con el guion completo (típicamente ~1 minuto; solo propone recortes si pasa los 2 minutos), listo para publicar:

- **Preguntas al empezar**: voz (mujer/hombre, **argentina por defecto**) y marca. La **música la elige Claude según el guion** (o usa la tuya si se la pasás) y el formato es siempre **vertical 9:16**, salvo que pidas otro (1:1, 4:5 o 16:9). Si la marca es nueva, pregunta logo, colores y tipografías, muestra una vista previa y la **guarda** para los próximos videos.
- **Locución IA** con tiempos por palabra: ElevenLabs (más natural, voces rioplatenses o tu voz clonada; con tu clave) o edge-tts gratis (`es-AR-ElenaNeural` / `es-AR-TomasNeural`, y otros acentos). La voz elegida queda guardada en la marca.
- **Motion graphics** a pantalla completa con la marca: 15 escenas (título, texto cinético, palabra gigante, pregunta, dato que cuenta, anillo, barras, lista, pasos, íconos, comparación, cita, chat, foto, CTA) y transiciones, todo **sincronizado con la voz**.
- **Subtítulos dinámicos** con la palabra activa resaltada (y `.srt` aparte).
- **Música de Envato** con volumen automático (fuerte al inicio, baja bajo la voz, sube al cierre) y **SFX sutiles**: los genéricos salen de la librería de la skill [edicion](https://github.com/gustavopascaner/edicion) y los específicos (notificación, latido, tipeo…) se generan con ElevenLabs una sola vez y quedan en tu biblioteca local (`scripts/sfx.py`).
- **Dirección**: avisa si el ritmo, la variedad o el gancho no están bien, y arma hojas de prueba antes del render.
- Entrega `NOMBRE.mp4` (H.264/AAC, −14 LUFS), `NOMBRE.srt` y un `LEEME.md`.
- **Proyecto editable para Premiere** (`NOMBRE_premiere.xml`): cada escena es un clip, los subtítulos y el logo van en pistas con alfa, la voz va frase por frase, y la música (con su curva de volumen) y los SFX en pistas propias. Para cambiar el texto de un gráfico se le pide a Claude y se re-renderiza solo esa escena.

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

El instalador agrega lo que falte (Node, FFmpeg, Chrome), crea un entorno de Python con `edge-tts`, instala las dependencias y enlaza la skill en `~/.claude/skills/motion` y `~/.codex/skills/motion`. Para los efectos de sonido usa los de la skill `edicion` si está instalada (o pasale la ruta a `edicion-sfx.zip`). Chequeo: `python3 -I scripts/doctor.py`.

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
| `scripts/mix.py` | Voz + música + SFX → MP4 final y SRT |
| `scripts/build_xml.py` | Proyecto XML para Premiere con todas las capas enlazadas |
| `scripts/sfx.py` | Biblioteca de efectos: buscar y generar sonidos con ElevenLabs |
| `scripts/brand.py` | Marcas: Google Fonts, colores desde el logo, contraste |
| `scripts/envato.py` | Búsqueda de música en Envato y reemplazo por la licenciada |
| `engine/engine.html` | Motor de escenas (HTML/CSS/JS) |
| `brands/` | Marcas guardadas (las propias no se suben al repo; `editorial` es la de ejemplo) |
| `reference/` | Catálogo de escenas y un ejemplo completo |

Tipografías de `brands/editorial/fonts` y las que baja `brand.py`: Google Fonts (SIL Open Font License). La música de Envato se licencia y descarga desde tu sesión de Envato en el navegador de la app de Claude (iniciás sesión vos una vez; Claude nunca usa tu contraseña) y se reemplaza la vista previa por el WAV original, sin marca de agua.
