# Direcciones de arte (estilos curados)

Cada estilo es una combinación coherente de tokens de `look.json` (movimiento, cámara, transiciones, desenfoque, profundidad, resaltado, paneles, decorado y variantes) que funciona junta. Colores y tipografías siguen siendo los de la marca. Definición exacta: `scripts/estilos.js` · lista rápida: `node $SK/scripts/look.js estilos`.
`look.js new <work> --tono=<t> --estilo=<slug>` (o `auto`: elige por tono uno que la marca no haya usado en sus últimos 3 videos). Después se puede ajustar a mano, pero **sin romper la lógica del estilo** (no mezclar `elastic` con `slice`, ni `depth` con un estilo plano).

| estilo | tonos | se siente como | usarlo para |
|---|---|---|---|
| `suizo-cinetico` | institucional, sobrio, enérgico | grilla, tipografía enorme, cortes secos en franjas | datos duros, explicaciones claras, autoridad |
| `impacto` | enérgico, humor | bloques plenos, slam + punch, sombras duras | mitos, errores, urgencia, ganchos fuertes |
| `profundidad` | institucional, enérgico, sobrio | tarjetas en el espacio, cámara que se inclina | procesos, tecnología, "cómo funciona" |
| `papel` | cálido, humor | recortes de papel, resortes, colores planos | infancia, familia, hábitos, cercanía |
| `data` | institucional, sobrio | gráficos que se construyen, anotaciones mono | estadísticas, estudios, comparaciones |
| `liquido` | cálido, sobrio | todo fluye (morph), formas redondas | salud emocional, cuidado, embarazo, duelo |
| `pop` | humor, enérgico | saturado, tramas, rebotes, chiste visual | contenido liviano, tips rápidos |
| `cine` | sobrio, cálido, institucional | oscuro, aire, cámara lenta, cortes en compás | historias, testimonios, reflexiones |

Cada estilo trae sus **reglas** (quedan en `look.estilo_reglas`): leerlas antes del storyboard y aplicarlas también en las escenas a medida (`scenes.js`).
