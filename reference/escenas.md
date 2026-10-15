# Catálogo de escenas (engine/engine.html)

Todas son a pantalla completa. Tamaños nominales para un ancho de 1080 px: el contenido se escala solo para entrar en el área segura de cada formato.
Colores por escena con `bg`: `dark` · `light` · `accent` · `accent2`. El motor elige solo el color del texto (`--fg`), el de resaltado (`--hl`) y el texto sobre resaltado (`--hlfg`) con buen contraste.
Tiempos internos (`at`, `*At`, `countEnd`) en **segundos locales**; escribirlos con `w('palabra')` para sincronizarlos con la voz.
Comunes: `bg`, `tr`, `cap`, `sfx`, `valign` (`'top'|'center'|'bottom'`), `maxScale`, `logo:false`, `grid:false`, `shapes:false`.
Clases dentro de textos: `H('x')` caja resaltada · `A('x')` color de acento · `<span class="acc">x</span>` tipografía de acento · `<br>`.

| escena | params | para qué |
|---|---|---|
| `title` | `kick, lines:[html], size=170, sub, subAt, at:[por línea], align` | títulos de sección, presentación del tema |
| `kinetic` | `text?` (default: lo que se dice en la escena), `hl:[palabras con caja]`, `hc:[palabras en color]`, `kick, size=150, align` | la frase aparece palabra por palabra al ritmo de la voz (sin subtítulos) |
| `bigword` | `kick, lines:[1–2 palabras] \| word, size=260, at, sub, subAt` | remate, palabra clave letra por letra |
| `question` | `kick, lines:[html], size=120, at:[...]` | pregunta retórica con un "?" gigante |
| `stat` | `kick, value, from?, decimals, prefix, suffix, at, countEnd, label, sub (fuente)` | número que cuenta |
| `donut` | `kick, value (0–100), at, label` | porcentaje en anillo |
| `bars` | `kick, title, bars:[{l, v, at, hl}], unit, prefix, max` | comparar cantidades |
| `list` | `kick, title, items:[{t, at, mark:'check'\|'x'\|'num'\|'dot'\|<ícono>, strikeAt}], mark` | listas que se arman (✓, ✕ tachado, 01/02…) |
| `steps` | `kick, title, items:[{t, d?, at, icon?}]` | proceso paso a paso con línea que avanza |
| `icons` | `kick, title, items:[{icon, t, at}], cols` | 2–4 conceptos con íconos |
| `compare` | `kick, left:{title, items:[{t,at}], at}, right:{title, items, at}` | antes/después, mito/realidad (izquierda ✕ apagada, derecha ✓ resaltada) |
| `quote` | `text?, author, authorAt, font:'display'?, size=104` | cita o frase de alguien; se ilumina palabra por palabra |
| `phone` | `kick, name, msgs:[{t, at, me}]` | chat/mensajes (con "escribiendo…" antes de cada respuesta) |
| `image` | `src (ruta), kb:[100,112], origin, kick, lines, at` | foto a pantalla completa con Ken Burns y título |
| `concept` | `motif, at (momento clave = w('palabra')), seed?, n?` — **sin texto** | animación conceptual de 3–4 s con formas, líneas y partículas (obligatoria: una por video) |
| `cta` | `kick, lines, handle (solo si el usuario lo pide explícitamente; nunca inventarlo ni sacarlo de la marca), action:'follow'\|'comment'\|'save'\|'link'\|'dm', btnAt, word (comment), btn, done, logo:false` | cierre: logo + llamado + botón que se aprieta |

Íconos (`mark`, `icon`): user, users, heart, clock, chat, star, chart, trend, phone, calendar, money, check, x, bolt, search, target, lock, idea, home, mail, play, shield, rocket, gift, pin, camera, med, eye, globe, smile, alert, bookmark, send, arrow, plus.

## Subtítulos
Automáticos desde `words.json` (grupos de hasta 3 palabras, palabra activa en color de resaltado, `config.keywords` siempre resaltadas). Se apagan por defecto en `kinetic` y `quote`; en cualquier otra con `cap:false`. Se pueden desactivar en la marca (`captions.on:false`) o en el video (`config.captions:false`).

## SFX automáticos
Entrada de escena con transición → whoosh suave (sin graves) · `bigword` → solo su transición (sin golpes: prohibidos los 'boom') · `stat`/`donut` → ding al terminar de contar · ítems → pop/ding · CTA → click. Se eligen los más importantes, separados, hasta `config.sfx_max` (6). Manual: `sfx` en la escena (`[['id', w('palabra')]]`) o `X('categoría|id', w('palabra') | segundo)` en story.js. Sonidos literales que no estén en la biblioteca: generarlos con `sfx.py gen` (ElevenLabs) — ver SKILL.md 4b.

## Agregar una escena nueva
En engine.html: `SC.nombre=(p,c)=>{ …armar el DOM dentro de c.box con h(), ml(), kick()…; return t=>{ …animar según t… } }`.
`c` = `{box, inner, root, D (duración), words (palabras de la escena, tiempos locales), th (colores), area, port}`.
Helpers: `P(t,a,d)` progreso 0–1 · `E.expo/back/el/o3/io` · `rise(el,t,a)` máscara que sube · `popIn` · `fadeUp` · `split(el)` letras · `syncWords(tokens,words)` · `icon(nombre)` · `fmtNum`.
Usar solo colores `var(--fg)`, `var(--bg)`, `var(--hl)`, `var(--hlfg)`, `var(--sub)` para que funcione con cualquier marca. La función tiene que ser pura del tiempo (se renderiza en paralelo). Sumar su sonido en `AUTO` de render.js. Probar con `--test`.

## Motivos de `concept` (animaciones sin texto)
Todos usan los colores del tema de la escena (`--fg`, `--hl`) y tienen un **momento clave** en `at` (default: mitad de la escena, máx. 1,8 s), que conviene sincronizar con la palabra del concepto.
| motivo | qué muestra | para ideas como |
|---|---|---|
| `growth` | barras que suben + línea de tendencia + punto que late | crecer, mejorar, resultados, más pacientes |
| `network` | nodos que aparecen y se conectan con un centro que se enciende | comunidad, recomendaciones, contactos, sistema |
| `cycle` | flechas en círculo que giran y aceleran | hábitos, repetir, constancia, proceso continuo |
| `funnel` | muchas partículas entran a un embudo y pasan pocas | filtrar, elegir, conversión, los correctos |
| `target` | anillos concéntricos y un dardo que da en el centro | objetivo, foco, precisión, público ideal |
| `balance` | balanza que oscila y se equilibra | equilibrio, decisión, comparar, justo |
| `breakthrough` | pelota que rompe una pared de bloques | superar un obstáculo, romper una barrera |
| `order` | puntos caóticos que se ordenan en una grilla | orden, método, sistema, claridad |
| `pulse` | electrocardiograma que se dibuja + corazón que late | salud, vida, cuidado, emoción |
| `path` | camino curvo con un marcador que llega a la bandera | recorrido, proceso, meta, paso a paso |
| `attract` | partículas atraídas hacia un centro que crece | atraer pacientes, magnetismo, interés |
| `dialog` | dos personas, ondas de ida y vuelta y aparece un corazón | escuchar, comunicar, vínculo, empatía |
| `split` | camino que se bifurca; uno se apaga y el otro se resalta | elegir, decisión, el camino correcto |
| `stack` | bloques que caen y forman una torre | construir, acumular, paso a paso, base |
| `link` | dos nodos unidos por una línea con pulsos de ida y vuelta; en el momento clave se encienden juntos | dos partes relacionadas, conexión entre zonas del cuerpo, influencia mutua |

Nuevo motivo: `MOT.nombre=(g,p,a,D,r)=>{ …dibujar con sv('circle'|'path'|'line'|…, attrs, g, css)… return t=>{…} }` en un lienzo SVG de 1000×1000 (zona visible ≈110–890). Helpers: `spop` (aparecer), `dash` (dibujar líneas), `ripple` (onda), `r()` aleatorio con semilla. Colores solo con `FG`, `HL`, `HL2`, `SUB`. Probar con `--test --at=0.5,<at>,end`.
