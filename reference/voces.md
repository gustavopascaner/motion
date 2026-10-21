# Voces

- **Por defecto**: `"voice": {"id":"mujer"}` o `{"id":"hombre"}` en `script.json`. Con clave de ElevenLabs usa las voces por defecto de ElevenLabs (Agustina / Manuel, argentinas, o las que fije `~/.config/motion/prefs.json` → `voices`, ver `preferencias.md`); sin clave, Elena / Tomás de edge-tts (gratis). En ese caso mencionar una vez que con una clave de ElevenLabs suena más natural.
- **Elegir otra voz de ElevenLabs**: `tts.py voices eleven argentine` (voces propias, incluida una voz clonada del usuario, y biblioteca rioplatense) → `tts.py samples "<work>/muestras_voz" "<primera frase del guion>" <id1> <id2> …` (3–4 muestras) → dárselas al usuario para escuchar y usar la que elija. Guardarla en la marca (`brand.json` → `"voice": {"engine":"eleven","id":"…","name":"…"}`) para no volver a preguntar.
- **Otro acento**: la voz de ese país (`tts.py voices es` lista las de edge: es-UY, es-MX, es-ES, es-CL, es-CO…; en ElevenLabs, `voices eleven <acento>`).
- **Ritmo**: por defecto toda voz sale **10 % más rápida** que la normal, con la velocidad nativa del motor (ElevenLabs `"speed": 1.1`, edge-tts `"rate": "+10%"`; nunca acelerar el audio después con atempo). Lo aplica `tts.py`; un `"speed"`/`"rate"` explícito en la voz manda (bajar a 1.05 / `+5%` solo si en algún caso suena apurada).

## Clave de ElevenLabs
Nunca va en el repo ni en la skill. Si el usuario quiere ElevenLabs y no hay clave, pedirle que la cree (elevenlabs.io → Developers → API Keys, con permisos *Text to Speech*, *Voices: Read* y *Sound Effects*) y la guarde él mismo:
```bash
mkdir -p ~/.config/motion && printf '%s' 'CLAVE' > ~/.config/motion/elevenlabs_key && chmod 600 ~/.config/motion/elevenlabs_key
```
Si la pega en el chat, guardarla así y sugerir rotarla después.

## Detalles técnicos
- edge-tts usa el servicio de voz de Microsoft Edge (requiere internet, sin clave).
- ElevenLabs: `{"engine":"eleven","id":"<voice_id>"}`; modelo por defecto `eleven_v4` (lo pone `tts.py`; los videos ya bloqueados sin modelo siguen con `eleven_multilingual_v2`); clave en `ELEVENLABS_API_KEY` o `~/.config/motion/elevenlabs_key`. Cada beat se genera con el anterior y el siguiente como contexto (entonación continua) y queda en caché: solo se cobran los beats que cambian (≈1000 caracteres por minuto de guion).

## tts.py: detalles del paso 2 (leer solo si hace falta)
- **Voz > 2 min**: no recortar ni acelerar solos; proponer recortes concretos al usuario y esperar respuesta. Más corta está bien (no estirar el guion; no bajar del ritmo por defecto +10 % salvo que suene apurada).
- **Una sola voz**: `tts.py` bloquea la voz en `<work>/voice.lock.json` y rechaza otra voz o una voz por beat. Si ElevenLabs falla (sin créditos, sin clave, error): frenar y avisar, nunca completar con otra voz. Cambiar de voz = `tts.py "<work>" --cambiar-voz` (regenera todo) y después render + mix.
- **Beats**: 1 frase o idea, 2–6 s (≈10–18 por minuto); partir los de más de 7 s. `say` = pronunciación (números "70 %" → "setenta por ciento", siglas "OMS" → "o eme ese", años, símbolos); `text` queda como está escrito y es lo que muestran los subtítulos; `w()` encuentra ambas formas. `pause` = silencio tras el beat (default 0,38 s si termina en punto/pregunta, 0,18 s si no; 0,6 antes de un remate o del CTA).
- `script.json`: `{"voice":{"id":"mujer"},"lead":0.35,"beats":[{"id":"b01","text":"…","say":"…","pause":0.6},…]}`; ritmo con `"rate"` (edge) o `"speed"` (ElevenLabs). Solo se regeneran los beats que cambian (caché).
