# Catálogo de escenas
Pantalla completa; tamaños para 1080 px de ancho (el contenido se escala solo al área segura). Escribir en `story.js` (API: `api.md`). Tiempos internos (`at`, `*At`, `countEnd`) en segundos locales: usar `w('palabra')`.
Comunes: `bg` (`dark|light|accent|accent2`) · `tr` · `cap` · `sfx` · `v` (variante) · `align` · `valign` · `maxScale` · `logo:false` · `grid:false` · `shapes:false` · `decor` (`'sun'`, `['orbit',{k:'stripes',o:.8}]`, `false`) · `frame`. Textos: `H('x')` caja · `A('x')` acento · `<br>`.

| escena | params |
|---|---|
| `title` | `kick, lines:[html], size=170, sub, subAt, at:[por línea]` |
| `kinetic` | `text?` (default: lo dicho), `hl:[palabras con caja]`, `hc:[en color]`, `kick, size=150` · apaga subtítulos |
| `bigword` | `kick, lines:[1–2 palabras] \| word, size=260, at, sub, subAt` |
| `question` | `kick, lines:[html], size=120, at:[…]` |
| `stat` | `kick, value, from?, decimals, prefix, suffix, at, countEnd, label, sub` (número que cuenta) |
| `donut` | `kick, value (0–100), at, label` |
| `bars` | `kick, title, bars:[{l,v,at,hl}], unit, prefix, max` |
| `list` | `kick, title, items:[{t,at,mark:'check'\|'x'\|'num'\|'dot'\|ícono,strikeAt}], mark` |
| `steps` | `kick, title, items:[{t,d?,at,icon?}]` |
| `icons` | `kick, title, items:[{icon,t,at}], cols` |
| `compare` | `kick, left:{title,items:[{t,at}],at}, right:{…}` (izq. apagada, der. resaltada) |
| `quote` | `text?, author, authorAt, font:'display'?, size=104` · apaga subtítulos |
| `phone` | `kick, name, msgs:[{t,at,me}]` (chat con "escribiendo…") |
| `image` | `src, kb:[100,112], origin, kick, lines, at` (Ken Burns) |
| `concept` | `motif, at, seed?, n?` — sin texto, 3–4 s, obligatoria y a medida (`api.md`) |
| `cta` | `kick, lines, handle (solo si el usuario lo pide y dice cuál), action:'follow\|comment\|save\|link\|dm', btnAt, word, btn, done, logo:false` |

**Variantes `v`** (la primera es la clásica; si se omite, `look.variants`): `title` stack·offset·framed·mask · `kinetic` rise·pop·light·slam·track·stackup · `bigword` letters·outline·echo·slam · `stat` bar·giant·ring·split · `list` rows·cards·bignum · `steps` line·cards · `compare` panels·strike·split · `quote` mark·bar · `bars` bars·columns · `donut` ring·dots · `icons` tiles·rows · `question` mark·inline·bubble · `cta` button·card.

**Transiciones `tr`** (dur. s): clásicas `cut` 0 · `wipe` `wipex` .5 · `slide` `push` `zoom` `split` `diag` .55 · `circle` `blinds` .6 · `shape` .65. Modernas: `layers` .7 (2 paneles de la marca barren con borde inclinado) · `iris` .5 (círculo del resaltado; centro `p.cx/p.cy` en %) · `zoomblur` .4 (seca) · `slice` .45 (seca, franjas) · `morph` .65 (match cut: la forma del último `.hlb/.hlc` o `[data-morph]` de la escena anterior crece hasta ser el fondo; ideal si la siguiente tiene `bg` = color de ese resaltado).

Íconos: user users heart clock chat star chart trend phone calendar money check x bolt search target lock idea home mail play shield rocket gift pin camera med eye globe smile alert bookmark send arrow plus.
Subtítulos: automáticos desde `words.json` (≤ 3 palabras, activa en color, `config.keywords` resaltadas); apagados en `kinetic`/`quote` y con `cap:false`.

## Look (`<work>/look.json`, lo genera `look.js new`; la marca fija fuentes, colores y logo)
`concepto` (idea visual, 1 línea) · `concept_idea` (qué cuenta el concept; `--plan` avisa si se parece a uno anterior) · `tratamiento` · `palette` classic·dark·light·blocks·duo·accent2 (rotación de `bg`) · `hlPrefer` accent·accent2 · `hl` box·underline·marker·outline·pill (estilo de `H()`) · `kick` dot·line·number·bracket·tag·plain / `kickFont` mono·accent·body · `panel` soft·outline·solid·offset·flat + `radius` px · `decor` lista de blobs rings dots stripes halftone glyph orbit lines gradient sun grid grain (o `{k,o}`) · `frame` none·border·corners·column · `align` left·center·right·mixed / `valign` / `scale` .85–1.2 · `motion` snappy·smooth·bouncy·punch·elastic · `cam` zoom·pull·drift·none·tilt·orbit · `blur` 0–1 (movimiento; .5–.8 natural) · `depth` 0|1 (perspectiva 3D) · `punch` 0–1 (pulso de cámara en el momento clave) · `transitions` (familia que rota) · `captions` color·box·underline · `variants` {tipo:variante}.
