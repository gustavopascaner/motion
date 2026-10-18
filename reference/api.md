# API: escribir story.js y scenes.js (no hace falta abrir engine.html ni render.js)

## story.js
`module.exports=({S,w,H,A,X,beats,words,brand,cfg})=>{ S(...); … }` (ejemplo: `reference/ejemplo/story.js`).
- `S(tipo, inicio, params)` — una por escena, en orden. `inicio`: segundos (número) · id de beat (`'b03'`: empieza 0,12 s antes de que arranque el beat) · `w('palabra')` (0,12 s antes de esa palabra, buscada desde la escena anterior). La primera escena arranca siempre en 0. Cada escena empieza ≥ 0,3 s después de la anterior (si no, error). Los inicios que no son números se corren al golpe de `beats.json` (≤ 0,15 s; `config.snap_beats:false` lo apaga).
- `w('palabra', n=0)` — tiempo de la n-ésima aparición (0 = primera). Normaliza (sin tildes, mayúsculas ni signos) y compara con la forma hablada y con la escrita (`say`/`text`); primero exacta, después por prefijo. Dentro de `params` (en cualquier profundidad) se vuelve **segundos locales de la escena**; en `inicio` y `X()` es tiempo absoluto. Busca hasta 0,3 s después del fin de la escena; si no la encuentra, error con la palabra.
- `H(t)` caja de resaltado (`<span class="hlb">`) · `A(t)` color de acento (`hlc`) · `X(spec, t, {gain, dur})` SFX suelto: `spec` = id o categoría de la biblioteca, `t` = número o `w()` (ver `sfx.md`).
- `beats` = `[{id,text,s,e}]` · `words` = `[{w,s,e,d?,de?,beat}]` (`d`/`de` = texto escrito si el beat tiene `say`) · `brand` (brand.json) · `cfg` (config.json).
- Defaults por escena: `bg` rota según `look.palette` (`image` → `dark`) · `tr` rota `look.transitions` sin repetir la anterior (la primera escena: `cut`) · `cap` true salvo `kinetic`/`quote` · `sfx` automáticos (ver `sfx.md`).

## Cómo arma el motor cada escena
1. `render.js` resuelve todo en `<work>/timeline.json` (`scenes:[{type,s,e,bg,tr,cap,p,words}]`, `caps`, `look`, `brand`, `custom`).
2. Carga `engine.html`, inyecta `<work>/scenes.js` (después del motor, antes de armar: ve todos sus globales y puede definir `SC.*` y `MOT.*`) y llama `init(timeline)`.
3. Por escena crea `root` (tema de `bg`) → `inner` → `cam` → `fitbox` → `box` (columna flex donde dibujás) y llama **una vez** `SC[tipo](p, c)`, que devuelve el actualizador `t=>{…}`. Después llama `upd(D)` (estado final armado) para medir y `fit` escala `box` hasta entrar en el área segura (`c.area`; sin subtítulos es más alta). Si se achica < 62 % avisa. Tipo inexistente → error "escena desconocida".
4. `frame(T)` muestra las escenas vigentes (incluye la saliente durante la transición) y llama `upd(t)` con **t local** (puede pasar de `D` unos instantes). Tiene que ser función pura de `t`: nada de estado entre cuadros (se renderiza en paralelo y en desorden); para velocidades, calcular en `t` y `t-DT()`.
5. `p` llega con todos los `w()` ya resueltos a números. Colores solo con `var(--fg|bg|hl|hl2|hlfg|hl2fg|sub)` (en SVG: `FG HL HL2 SUB`) para heredar marca y look.
- Globales útiles: `W H U` (U = min(W,H)/1080) · `LOOK` · `BR` (marca) · `CFG` · `CUR` (n.º de escena que se está armando) · `M` (curvas del look).
- Definiciones en `scenes.js`: cada una empieza al principio de una línea (`SC.nombre=` / `MOT.nombre=`). `render.js` las firma (hash sin espacios ni comentarios): un `MOT` de biblioteca o igual a uno ya usado en la marca frena el render. Todo `SC` que no sea del catálogo cuenta como escena a medida.

## `SC.nombre=(p,c)=>{ …; return t=>{…} }` (placa a medida, 1–3 por video)
`c` = `{box, inner, root, D (duración s), words ([{w,s,e}] locales), th (colores), area, port, i (n.º), type, al (alineación del look)}`. Armar el DOM dentro de `c.box`; lo que desborda a propósito (marquesinas, partículas) va fuera del fitbox o `fit` achica la escena.
Construcción: `h(tag,css,parent,html,cls)` crea un elemento · `ml(parent,html,css,cls)` línea con máscara para `rise` · `kick(parent,txt)` antetítulo según el look · `AL(box,p,c,def)` alineación (p.align > look) · `VAR(p,c,'default')` variante · `icon(nombre,sw)` SVG · `split(el)` → spans por letra · `syncWords(tokens,c.words)` → tiempos locales por palabra · `fmtNum(v,dec)` · clase `pnl` = panel del look · SVG: `sv(tag,attrs,parent,css)`, `dash(el,len,x)` dibuja línea, `spop(el,t,a,d)` aparece escalando, `ripple(g,cx,cy)` onda, `rnd(seed)` azar con semilla.
Tiempo y curvas: `P(t,a,d)` progreso 0–1 · `L(a,b,x)` interpola · `cl(x,a,b)` · `E.expo/back/el/o3/io/spring/punch/elastic` · `sp(t,a,d=.6)` resorte · `M.ease/M.pop` (curvas del look) · `DT()` duración de un cuadro · `ST(i,step=.08)` escalonado (`a+ST(i)`).
Entradas (con desenfoque de movimiento y profundidad automáticos según `look.blur`/`look.depth`): `rise(el,t,a)` máscara que sube · `popIn` · `fadeUp` · `flipIn(el,t,a,d)` gira en Y · `fold(el,t,a,d)` se despliega desde arriba. Extras: `shake(t,at,amp=14,dur=.32)` → `[dx,dy]` · `mb(el,dx,dy)` desenfoque manual (dx/dy = px movidos en este cuadro; sin `look.blur` no hace nada).
Recetas listas: `node scripts/receta.js` (índice) y `receta.js R03 R07`.

## `MOT.nombre=(g,p,a,D,r)=>{ …; return t=>{…} }` (concept, siempre nuevo)
`g` = grupo SVG en un lienzo de 1000×1000 (zona visible ≈ 110–890) · `p` = params de la escena `concept` · `a` = momento clave en segundos locales (`p.at`, default mitad de la escena, máx. 1,8 s) · `D` = duración · `r` = `rnd(p.seed||7)`. Dibujar con `sv('circle'|'path'|'line'|…,attrs,g,css)`. Se usa con `S('concept', inicio, {motif:'nombre', at:w('palabra')})`. Sin texto. Probar con `--test --at=0.5,<at>,end`.
Motivos de biblioteca (solo para estudiar el patrón en `engine.html`; **nunca usarlos**): growth network cycle funnel target balance breakthrough order pulse path attract dialog split stack link. Ejemplo propio completo: `reference/ejemplo/scenes.js` (`MOT.eco_devuelto`, `SC.reloj48`).

## Agregar una escena al catálogo del motor (solo si sirve para cualquier video)
`SC.nombre=(p,c)=>…` en `engine/engine.html` (misma API) · sus variantes en `VARIANTS` de `scripts/design.js` (el selftest lo verifica) · su sonido automático en `AUTO` de `render.js` · escala en vertical en `UPS` / centrado fijo en `NOVA` (engine.html) · documentarla en `escenas.md`. Probar con `--check`.
