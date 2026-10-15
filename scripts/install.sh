#!/bin/bash
# Instala la skill "motion" en macOS para Claude Code y Codex.
# uso (desde la carpeta clonada del repo):  bash scripts/install.sh [ruta/a/edicion-sfx.zip]
# Instala lo que falte (Homebrew, Node, FFmpeg, Chrome), crea el entorno de Python con edge-tts, instala las dependencias
# de Node, usa los efectos de sonido de la skill edicion (o del zip) y enlaza la skill en ~/.claude y ~/.codex.
SK="$(cd "$(dirname "$0")/.." && pwd)"
ok(){ printf "\033[32mOK\033[0m  %s\n" "$1"; }; info(){ printf "\033[36m...\033[0m %s\n" "$1"; }; warn(){ printf "\033[33m!!\033[0m  %s\n" "$1"; }
if ! xcode-select -p >/dev/null 2>&1; then warn "Faltan las herramientas de desarrollador de Apple: se abre el instalador. Cuando termine, volvé a correr este script."; xcode-select --install; exit 1; fi
if ! command -v brew >/dev/null; then for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)"; done; fi
if ! command -v brew >/dev/null; then
  info "Instalando Homebrew (te va a pedir la contraseña de la Mac)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || { warn "No se pudo instalar Homebrew"; exit 1; }
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)"; done
fi
ok "Homebrew"
for p in node ffmpeg; do if command -v "$p" >/dev/null; then ok "$p ya instalado"; else info "Instalando $p..."; brew install "$p" >/dev/null && ok "$p"; fi; done
if [ -d "/Applications/Google Chrome.app" ] || [ -n "$CHROME" ]; then ok "Google Chrome ya instalado"; else info "Instalando Google Chrome..."; brew install --cask google-chrome >/dev/null && ok "Google Chrome"; fi
info "Entorno de Python para la voz (edge-tts)..."
[ -x "$SK/.venv/bin/python" ] || python3 -m venv "$SK/.venv"
"$SK/.venv/bin/pip" install -q --upgrade pip edge-tts && ok "edge-tts"
KF="$HOME/.config/motion/elevenlabs_key"
if [ -s "$KF" ]; then ok "Clave de ElevenLabs ya guardada"
elif [ -t 0 ]; then printf "Clave de ElevenLabs (opcional, voz más natural; Enter para saltear): "; read -rs EK; echo
  if [ -n "$EK" ]; then mkdir -p "$(dirname "$KF")"; (umask 077; printf '%s' "$EK" > "$KF"); ok "Clave de ElevenLabs guardada en $KF"; else info "Sin ElevenLabs: se usa edge-tts (gratis)"; fi; fi
info "Instalando dependencias de Node..."; (cd "$SK/engine" && npm ci --silent) && ok "Dependencias de Node"
if [ -n "$1" ]; then unzip -o -q "$1" -d "$SK/assets/sfx" && ok "Efectos de sonido del zip"
elif ls "$HOME/.claude/skills/edicion/assets/sfx"/*/*.wav >/dev/null 2>&1; then ok "Efectos de sonido: se usan los de la skill edicion"
else warn "Sin efectos de sonido (opcional): instalá la skill edicion o pasá la ruta a edicion-sfx.zip"; fi
for d in "$HOME/.claude/skills" "$HOME/.codex/skills"; do
  mkdir -p "$d"
  if [ -e "$d/motion" ] && [ ! -L "$d/motion" ]; then [ "$(cd "$d/motion" && pwd -P)" = "$(cd "$SK" && pwd -P)" ] && ok "Skill en $d/motion" || warn "$d/motion ya existe y no es un enlace: lo dejo como está"; continue; fi
  ln -sfn "$SK" "$d/motion" && ok "Skill enlazada en $d/motion"
done
echo; python3 -I "$SK/scripts/doctor.py"
echo; echo "Listo. En Claude Code: /motion <guion>   ·   En Codex: \$motion <guion>"
