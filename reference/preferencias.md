# Preferencias del usuario (`~/.config/motion/prefs.json`)

Decisiones personales que no van en el repo (la skill es pública y otros la instalan). Si el archivo no existe, se usan los valores por defecto.

```json
{
 "voices": {
  "eleven": {"mujer": ["<voice_id>", "Nombre"], "hombre": ["<voice_id>", "Nombre"]},
  "edge":   {"mujer": ["es-AR-ElenaNeural", "Elena"]}
 },
 "envato": {"auto_license": true, "decided": "AAAA-MM-DD"},
 "modo": "libre"
}
```

- `voices`: qué voz usa `"voice": {"id":"mujer"|"hombre"}` en cada motor (lo lee `tts.py`). Lo que falte usa el default de la skill.
- `envato.auto_license`: `true` = licenciar y descargar la música elegida sin preguntar en cada video (ver `envato.md`). Si falta o es `false`, preguntar una vez y ofrecer guardarlo acá.

- `modo`: `libre` (dibujado a mano, `libre.md`) o `placas` (catálogo del motor). Es el default cuando el usuario no pide uno para el video; si falta, `placas`.

Las marcas propias viven en `~/.config/motion/brands/`, el historial de looks en `~/.config/motion/looks/` (modo libre: `~/.config/motion/libre/`) y los SFX generados en `~/.config/motion/sfx/`.
