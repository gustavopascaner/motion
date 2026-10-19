# LEEME y versiones

No se genera proyecto de Premiere (XML) ni SRT: la entrega es el MP4.

## LEEME.md (en `out_dir`)
- Voz usada, marca, look (el `concepto` de look.json), formato, duración, estructura (tabla escena → texto → tiempo), música (con `envato.py report` y si falta licenciar), SFX, tiempo de procesamiento, cómo pedir cambios (el texto de un gráfico se cambia pidiéndoselo a Claude y se re-renderiza).

## Versiones (v2, ajustes)
Reusar `.work`: cambiar `script.json` (voz/texto: solo se regeneran los beats tocados) y/o `story.js`, apuntar `out_dir` a `<NAME>_MOTION_v2` y repetir desde el paso que corresponda:
- cambio de música o volumen → solo `mix.py`;
- cambio visual → render + mix;
- cambio de texto → tts + todo.

Escenas propias de un video: en `<work>/scenes.js`. Solo si una placa sirve para cualquier video, sumarla (o como variante) a `engine/engine.html` siguiendo `api.md`.

## Cierre en una corrida
`bash $SK/scripts/finish.sh "<work>"` (Windows: `powershell -ExecutionPolicy Bypass -File $SK\scripts\finish.ps1 "<work>"`) hace render final + `mix.py` + `qc.py` + `look.js log` + `timing.py report`. Salida mínima (MP4, QC, tiempo total); el detalle va a `<work>/finish.log`. Si falla, muestra las últimas líneas del log.

## Notas técnicas
- Motor: `engine/engine.html` renderizado cuadro a cuadro con Chrome (puppeteer-core) en paralelo, H.264 yuv420p; todas las escenas son funciones puras del tiempo. El contenido se escala solo al área segura (avisa si se achica mucho).
- `render.js` imprime solo inicio/fin y errores; `--verbose` muestra el progreso por cuadro.
- No usar `rm -rf` con globs relativos.
