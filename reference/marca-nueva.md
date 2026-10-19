# Marca nueva

Segunda tanda de preguntas (todo junto, en una sola tanda):
- **Nombre de la marca y logo** (ruta a PNG/SVG, o "sin logo"). **No preguntar ni guardar usuario de redes.** Si da logo: `$PY $SK/scripts/brand.py colors <logo>` y proponer la paleta a partir de esos colores; mirarlo también para inspirar el estilo y elegir tipografías afines. **El logo es solo referencia: no aparece en los videos** salvo pedido expreso (`"logo": true` en config.json).
- **Colores** — opciones: *Sacarlos del logo* · *Negro + naranja* (editorial) · *Azul profundo + celeste* (salud/confianza) · *Verde + crema* (bienestar); o hex propios. Se necesitan 4: `dark` (fondo oscuro), `light` (fondo claro), `accent` (resaltado principal), `accent2` (secundario, opcional).
- **Tipografías** — `brand.py fonts` lista combinaciones: *Editorial condensada* · *Moderna geométrica* · *Impacto* · *Elegante* (o cualquier familia de Google Fonts por nombre).
- **Estilo** — subtítulos sí/no (por defecto sí), decorado de fondo: *grano + grilla + manchas de color* (default) · *anillos* · *puntos* · *limpio*.

Armado:
1. Crear `~/.config/motion/brands/<slug>/brand.json` (fuera del repo: sobrevive a reinstalar y actualizar la skill) copiando `$SK/brands/editorial/brand.json`. En cada tipografía dejar solo `family`, `weight`, y para títulos `upper`/`stretch`/`tracking`/`leading`; para acento `italic`. Poner `logo` con la ruta absoluta.
2. `$PY $SK/scripts/brand.py setup <slug>` — baja las fuentes, copia el logo, chequea contraste: corregir los ⚠️.
3. `$PY $SK/scripts/brand.py remember "<carpeta>" <slug>` (así la carpeta queda asociada a la marca para motion y edicion).
4. Muestra: `node $SK/scripts/render.js --brand-preview=<slug> --out=<work>/marca.jpg --format=<formato>` → mirar la imagen y mostrársela al usuario; confirmar antes de seguir (es rápido de ajustar).

La marca queda guardada para la próxima, y también la usa la skill **edicion** (`/edicion` la detecta o la pregunta al empezar y aplica sus colores, tipografías y subtítulos a los motion graphics; ahí no lleva logo). Si una marca tiene que fijar tokens de diseño en todos sus videos: `brand.json` → `"design": {"lock": {…}}` (mismas claves que `look.json`, ver `escenas.md`).
