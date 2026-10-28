# Modo libre: el video se dibuja a mano

En vez de armar el video con placas del catálogo, se programa **un mundo ilustrado propio** en canvas (`<work>/anim.js`) encima del kit `libre/kit.js`. Voz, música, SFX, subtítulos, mezcla y QC son los mismos de siempre. Ejemplo completo: `reference/ejemplo-libre/` (*GATO_CAMBIOS_LIBRE*, 59 s: `anim.js`, `tratamiento.json`, `storyboard.md`).

## Qué lo hace mejor (no negociable)
1. **Mostrar, no escribir.** Cada frase de la voz se vuelve una imagen que la cuenta: "se esconde" = los ojos bajo la cama, no la palabra "se esconde". El texto en pantalla es poco y acompaña: gancho, palabra clave, rótulo corto.
2. **Un protagonista y un mundo.** Un personaje u objeto ilustrado (el gato, el paciente, el corazón, la agenda) vive en un lugar (la casa, el consultorio, el cuerpo) y **reaparece y se transforma** en todo el video. Nada de placas sueltas.
3. **Una metáfora visual por idea**, inventada para este guion (la silueta punteada = "lo habitual"; la grilla de 9 iguales con 1 distinto = "algo diferente"; la hoja que vuela a la planilla = "información para la consulta").
4. **Cámara y transiciones con sentido**: la cámara entra a cada lugar del mundo; las transiciones son físicas (hoja de papel que entra, zoom a la pupila, iris) y conectan ideas (match cut).
5. **Personajes vivos**: respiran, parpadean, mueven la cola, miran hacia lo que pasa. Nada quieto más de ~2 s.

## Lo que se mantiene de la skill
Marca (`IDENTIDAD.md`/`notes`, solo sus colores y 3 tipografías), voz y `words.json`, música de Envato licenciada, `beats.json`, subtítulos (los dibuja el kit), fondos **claros predominan** (oscuro solo un momento), gancho en los primeros 2 s, cierre sincronizado con el pedido del guion, **nunca @usuario** inventado, SFX suaves sin 'boom' (máx. `sfx_max`), QC, LEEME y cronómetro.

## Pasos (reemplazan 3b–5 del modo placas)
1. **Historial** (`$PY $SK/scripts/timing.py fase "<work>" "Historial y tratamiento"`): `node $SK/scripts/libre.js history <marca>` → no repetir mundo, protagonista ni metáforas de los últimos videos de la marca.
2. **Tratamiento** (`<work>/tratamiento.json`): `{"idea":"…","mundo":"…","protagonista":"…","metaforas":["…"]}`. Antes, 3 ideas madre de una línea y elegir la más audaz que se entienda.
3. **Storyboard visual** (`$PY $SK/scripts/timing.py fase "<work>" "Storyboard y anim.js"`; abarca también los pasos 4–5) (`<work>/storyboard.md`): una línea por beat → **qué se VE** (acción del protagonista, lugar, cámara), el texto en pantalla (si hay) y la transición. Agrupar beats en **5–8 secciones** de 4–12 s.
4. `node $SK/scripts/libre.js init "<work>"` → `anim.js` (plantilla), `libre/` (kit, datos, tipografías).
5. **Programar `anim.js`**: primero los personajes/objetos como funciones con parámetros de pose y estado (`gato(x,y,escala,{t,pose,parpadeo,mirada})`), después una función por sección y `SEC(inicio, draw, {tr, bg, tone})`. Tiempos siempre con `W('palabra')`. SFX con `sfx()`.
6. `$PY $SK/scripts/timing.py fase "<work>" "Chequeo" && node $SK/scripts/libre.js stills "<work>"` → recorre todo el video (errores y textos fuera de cuadro) y arma `sheet.jpg` con un cuadro por beat + uno a mitad de cada transición, con lo que se dice en cada uno. **Mirada 1**: ¿cada cuadro cuenta lo que dice la voz? ¿se lee? ¿se choca con los subtítulos? ¿fondo claro predominante? Corregir.
7. **Revisión de director** (una ronda; `$PY $SK/scripts/timing.py fase "<work>" "Revisión de director"`, los `stills` de la Mirada 2 quedan dentro): puntuar cada sección 1–5 en *idea*, *vida* y *continuidad* en `<work>/direccion.md`; rehacer las 2 peores. `stills` otra vez: **Mirada 2** (máximo 2 miradas; para ver un momento: `--at=12.4,13.1`).
8. Cierre igual que siempre: `bash $SK/scripts/finish.sh "<work>"` (con `"modo":"libre"` en config.json renderiza con `libre.js render`, en paralelo, ~20 s por minuto) + LEEME.

## API del kit (`libre/kit.js`, globales)
- **Lienzo**: `X` (contexto 2D), `FW FH` (tamaño), `U` (escala: 1 en 1080 de ancho; multiplicar medidas si el formato no es 9:16), `TAU`.
- **Colores**: `COL.light/dark/accent/accent2/mute` (de la marca) · `tint(a,b,k)` mezcla (fondos suaves, papel, sombras) · `rgba(hex,a)`. No usar colores fuera de la marca salvo neutros naturales (piel, planta) en poca superficie.
- **Tiempo**: `P(t,a,d)` progreso 0–1 · `L` · `cl` · `eo ei eio` · `spr(t,a,d)` resorte · `blinkAt(t,[…],d)` · `rnd(seed)`.
- **Voz**: `W('palabra', desde)` segundo en que se dice (lo escrito o lo pronunciado; con `desde` para la 2.ª aparición) · `WE()` fin · `B('b03')` beat `{s,e,text}` · `WORDS BEATS TOTAL`.
- **Texto** (3 tipografías: `display` títulos, `body`/`bold` lectura, `mono` etiquetas): `txt(s,x,y,{f,size,col,align,a})` · `rise(s,x,y,t,at,{size,out})` sube desde una máscara · `write(...)` se escribe · `marker(x,y,w,size,p)` resaltador (antes del texto) · `kicker(s,x,y,t,at)` antetítulo · `pill(s,x,y,p)` · `tw(s,f,size)` ancho. Si la marca usa títulos en mayúsculas, `txt` los pasa solo.
- **Formas**: `bg(c)` · `blob(x,y,r,t)` (dentro de `beginPath`) · `trace(pts,p,{col,w,dash})` línea que se dibuja · `along(pts,paso)` puntos sobre un camino (huellas, puntos).
- **Cámara**: `cam([[t,cx,cy,zoom],…], t)` → `withCam(c, ()=>{…})` dibuja en coordenadas del mundo.
- **Secciones**: `SEC(inicio, draw, {tr:'up'|'left'|'right'|'down'|'iris'|'fade'|'cut', bg, tone:'light'|'dark'|'accent'|'accent2'})`. Durante la transición se dibujan las dos (la anterior sigue animándose). `tone` define el color de los subtítulos; si cambia dentro de una sección, definir `TONE(T)`. `OVERLAY(T)` (opcional) dibuja encima de todo.
- **SFX**: `sfx('whoosh'|'pop'|'click'|'ding'|<id>, t, {gain})` (catálogo: `sfx.py list`).

## Reglas técnicas
- `draw(T)` es **función pura del tiempo**: nada de variables que se acumulen entre cuadros ni `Math.random` (usar `rnd(seed)`); cada cuadro se dibuja suelto, en paralelo y en desorden.
- Cada `draw` pinta su fondo completo (`bg(...)`) y usa `X.save()/X.restore()` alrededor de cada transformación.
- Zona útil: contenido entre ~8 % y ~83 % del alto; los subtítulos van al 87 %. Márgenes laterales ≥ 80 px.
- Personajes con formas simples y planas (elipses, curvas, triángulos) en los colores de la marca; definirlos una vez y reusarlos con poses.
- Texto en pantalla: títulos de 1–4 palabras por línea; nunca cortar palabras con guion.
- `libre.js stills` avisa textos fuera del cuadro y errores con el segundo exacto: corregir todo antes del cierre.
