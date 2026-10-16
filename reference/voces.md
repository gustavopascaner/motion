# Voces

- **Por defecto**: `"voice": {"id":"mujer"}` o `{"id":"hombre"}` en `script.json`. Con clave de ElevenLabs usa las voces por defecto de ElevenLabs (Agustina / Manuel, argentinas, o las que fije `~/.config/motion/prefs.json` → `voices`, ver `preferencias.md`); sin clave, Elena / Tomás de edge-tts (gratis). En ese caso mencionar una vez que con una clave de ElevenLabs suena más natural.
- **Elegir otra voz de ElevenLabs**: `tts.py voices eleven argentine` (voces propias, incluida una voz clonada del usuario, y biblioteca rioplatense) → `tts.py samples "<work>/muestras_voz" "<primera frase del guion>" <id1> <id2> …` (3–4 muestras) → dárselas al usuario para escuchar y usar la que elija. Guardarla en la marca (`brand.json` → `"voice": {"engine":"eleven","id":"…","name":"…"}`) para no volver a preguntar.
- **Otro acento**: la voz de ese país (`tts.py voices es` lista las de edge: es-UY, es-MX, es-ES, es-CL, es-CO…; en ElevenLabs, `voices eleven <acento>`).
- **Ritmo**: edge-tts con `"rate"` (p. ej. `"+5%"`, bajar hasta `-5%` si suena apurada); ElevenLabs con `"speed"` (0.9–1.15).

## Clave de ElevenLabs
Nunca va en el repo ni en la skill. Si el usuario quiere ElevenLabs y no hay clave, pedirle que la cree (elevenlabs.io → Developers → API Keys, con permisos *Text to Speech*, *Voices: Read* y *Sound Effects*) y la guarde él mismo:
```bash
mkdir -p ~/.config/motion && printf '%s' 'CLAVE' > ~/.config/motion/elevenlabs_key && chmod 600 ~/.config/motion/elevenlabs_key
```
Si la pega en el chat, guardarla así y sugerir rotarla después.

## Detalles técnicos
- edge-tts usa el servicio de voz de Microsoft Edge (requiere internet, sin clave).
- ElevenLabs: `{"engine":"eleven","id":"<voice_id>"}`; clave en `ELEVENLABS_API_KEY` o `~/.config/motion/elevenlabs_key`. Cada beat se genera con el anterior y el siguiente como contexto (entonación continua) y queda en caché: solo se cobran los beats que cambian (≈1000 caracteres por minuto de guion).
