# Envato: licenciar y descargar la música original

La vista previa de Envato tiene marca de agua audible: siempre intentar entregar con el WAV original.

1. **Nunca iniciar sesión con usuario y contraseña** (ni aunque el usuario los pase). Se usa la sesión del usuario en el **navegador de la app** (built-in browser, sesión persistente). Si no está logueado: abrir la página del tema y pedirle que inicie sesión él (una sola vez).
2. **Permiso**: leer `~/.config/motion/prefs.json` → `envato.auto_license`.
   - `true`: el usuario decidió que licenciar y bajar la música elegida es parte del pedido `/motion` (su cuenta licencia automáticamente al descargar, dentro de su suscripción). No preguntar por video; informar en la entrega qué tema se licenció. Si el agente igual pide confirmación por sus propias reglas (descargas, licencias), es normal: el usuario la da una vez.
   - falta o `false`: antes de licenciar, decir qué tema y pedir OK; ofrecer guardar `"auto_license": true` para los próximos.
   - Si algo falla (sin sesión, error de descarga, enlace vencido), seguir con la vista previa y avisarlo en la entrega, sin bloquear el video.
3. Abrir el link del ítem (`config.music.envato.url`) → redirige a `app.envato.com` → clic en **Descargar**. Con licencia automática aparece "Licenciado automáticamente"; si en otra cuenta aparece un diálogo de proyecto, licenciar con el nombre del video.
4. **Bajar el archivo**:
   - Si la descarga llega a `~/Downloads`: `$PY $SK/scripts/envato.py collect "<work>"` (busca ahí, copia el original a `Assets/Envato` y **borra de Descargas** el archivo o zip bajado para no duplicar).
   - Si el navegador de la app no guarda archivos: leer las solicitudes de red (`read_network_requests` con patrón `download`), abrir la respuesta de `download.data` y tomar el `downloadUrl` firmado (vence en minutos). Bajarlo con `curl -sSL --fail -o <scratchpad>/envato_dl/<slug>.zip "<downloadUrl>"` (carpeta nueva y vacía) y `$PY $SK/scripts/envato.py collect "<work>" --file music <zip>` (elige el WAV del zip).
5. Volver a correr **solo** `mix.py` (no hace falta re-renderizar). Verificar con `envato.py report` que diga ✅ licenciado.
6. Avisar si la página dice **"No está listo para ver Claim Clear"**: en YouTube puede aparecer un reclamo de Content ID que se resuelve con la licencia (en Instagram/TikTok no afecta).

Si no hay navegador o el usuario no quiere: darle el link para que lo baje él y después `envato.py collect "<work>"`.

## Elegir la música según el tono
Mapa tono → filtros de `envato.py search … music` (valores exactos que acepta hoy Envato; el script corrige mayúsculas y alias, y si un valor no existe avisa y busca sin ese filtro):

| Tono del guion | `--mood` | `--tempo` | `--genre` (opcional) |
|---|---|---|---|
| Urgente, dato duro, alerta | `upbeat` | `"Upbeat (110-140 BPM)"` | `electronic` |
| Empático, salud, cuidado | `inspiring` | `"Medium (90-110 BPM)"` | `ambient` / `cinematic` |
| Institucional, explicativo | `inspiring` | `"Medium (90-110 BPM)"` | `corporate` |
| Calmo, bienestar, reflexivo | `relaxing` | `"Slow (60-90 BPM)"` | `ambient` / `lofi` |
| Positivo, celebración, logro | `happy` | `"Upbeat (110-140 BPM)"` | `pop` |
| Humor, juguetón | `funny` | `"Upbeat (110-140 BPM)"` | `children` / `pop` |
| Épico, lanzamiento, impacto | `epic` | `"Upbeat (110-140 BPM)"` | `cinematic` |
| Serio, dramático, testimonio | `dramatic` | `"Slow (60-90 BPM)"` | `cinematic` |

Valores válidos — mood: `happy sad inspiring dramatic dark upbeat chill funny angry relaxing romantic epic` · tempo: `Very Slow (Below 60 BPM)`, `Slow (60-90 BPM)`, `Medium (90-110 BPM)`, `Upbeat (110-140 BPM)`, `Fast (140-160 BPM)`, `Very Fast (160+ BPM)` (también sirve `--tempo medium` o `--tempo 100`). `calm` ya no existe: usar `relaxing`.

Preferir energía pareja (sin caídas largas); si la música es más corta que el video se repite sola. `offset` = segundo donde entra la parte con energía (mirar el perfil ▁▂▃█ de la búsqueda).
