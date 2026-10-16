# Premiere, LEEME y versiones

## Proyecto para Premiere
`node $SK/scripts/render.js "<work>" --premiere` (~2–3 min) y `$PY $SK/scripts/build_xml.py "<work>"`.
Pistas: V1 escenas (una por clip, con la transición de entrada ya compuesta) · V2 subtítulos con alfa · V3 logo · A1 voz (una frase por clip) · A2 música con keyframes de volumen (misma curva que el MP4) · A3+ SFX. Marcadores por escena.
Capas: escenas en ProRes 422 HQ (opacas); subtítulos y logo en ProRes 4444 con alfa. El audio en Premiere queda ~2 dB más bajo que el MP4 (el MP4 lleva una normalización final a −14 LUFS).

## LEEME.md (en `out_dir`)
- **Cómo abrirlo en Premiere**: Archivo → Importar → `<NAME>_premiere.xml`; no mover ni renombrar la carpeta; tabla de pistas.
- Qué se edita ahí: cortar/mover/borrar escenas, re-timear frases de la voz, cambiar música y volúmenes, sacar SFX, usar el `.srt` como subtítulos nativos. Qué no: el texto dentro de cada gráfico (se cambia pidiéndoselo a Claude).
- Voz usada, marca, look (el `concepto` de look.json), formato, duración, estructura (tabla escena → texto → tiempo), música (con `envato.py report` y si falta licenciar), SFX, tiempo de procesamiento, cómo pedir cambios.

## Versiones (v2, ajustes)
Reusar `.work`: cambiar `script.json` (voz/texto: solo se regeneran los beats tocados) y/o `story.js`, apuntar `out_dir` a `<NAME>_MOTION_v2` y repetir desde el paso que corresponda:
- cambio de música o volumen → solo `mix.py` + `build_xml.py`;
- cambio visual → render + mix + `render.js --premiere --only=<n.º de escena>` + `build_xml.py`;
- cambio de texto → tts + todo.

**Cambiar un texto de un gráfico ya importado en Premiere**: editar story.js y correr `render.js --premiere --only=N` (re-renderiza solo esa escena con el **mismo nombre de archivo**), el MP4 si se quiere, y avisar al usuario que en Premiere haga clic derecho en el clip → *Reemplazar/Vincular medios* (o cierre y reabra el proyecto). Si cambia la duración de la escena, regenerar el XML y reimportar.
Escenas propias de un video: en `<work>/scenes.js`. Solo si una placa sirve para cualquier video, sumarla (o como variante) a `engine/engine.html` siguiendo `escenas.md`.
