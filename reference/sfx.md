# SFX: detalle (leer solo si vas a usar sonidos literales o tocar el diseño sonoro)

## Automáticos (biblioteca, sin hacer nada)
Whoosh suave en cada transición (filtrado sin graves ni ataque; cada transición con su momento: `iris` abre más tarde, `zoomblur` y `slice` son secos) · `bigword`: solo su transición · `stat`/`donut`: ding al terminar de contar · ítems de `list`/`icons`/`steps`/`phone`: pop/ding · `cta`: click. Se eligen los más importantes y separados, hasta `config.sfx_max` (6) contando los manuales. Nada antes de 0,5 s (`render.js` los omite).
`sfx` por escena: `null` = ninguno · `'pop'` · `[['ding',1.2]]` · `[['<id>', w('palabra'), {gain:.3}]]` (reemplaza los automáticos de esa escena). Suelto en story.js: `X('categoría|id', w('palabra') | segundo, {gain, dur})`.

## Literales (1–2 por video, solo si algo que se ve o se dice suena: mensaje que llega, latido, tipeo, alarma, caja registradora, puerta, aplauso…)
1. Buscar: `$PY $SK/scripts/sfx.py list <palabra>` (biblioteca y generados).
2. Si no existe y hay clave de ElevenLabs: `$PY $SK/scripts/sfx.py gen "<descripción concreta en inglés>" --id <id-en-español> --cat <categoría> --dur <0.5–3> [--anchor peak]` (`peak` para golpes/latidos, `onset` —default— para lo que arranca en el evento). Gasta créditos **una sola vez**: queda en `~/.config/motion/sfx` para todos los videos y, si el id existe, se reusa gratis. Sin clave: solo biblioteca.
3. Ubicarlo sincronizado con `sfx` de la escena o `X()` (arriba). Al generar transiciones pedir *soft, airy, no bass, no impact*.
4. Revisar la lista final de SFX en `render.js --check`/`--plan`: si uno no suma, `sfx: null` en esa escena.

## Prohibido
Golpes graves ('boom'): hits, bass drops, risers que explotan, impactos o sonidos con mucho grave como remate, tampoco generados con ElevenLabs.

## Técnico
Biblioteca de la skill `edicion` si está instalada (o `assets/sfx` propia, mismo `catalog.json`) + generados en `~/.config/motion/sfx` (catálogo propio, compensación de volumen por sonido). Si falta un sonido, avisa y sigue sin él.
