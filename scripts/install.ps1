# Instala la skill "motion" en Windows para Claude Code y Codex.
# uso:  powershell -ExecutionPolicy Bypass -File scripts\install.ps1 [ruta\a\edicion-sfx.zip]
param([string]$Zip)
$SK = Split-Path -Parent $PSScriptRoot
function Ok($m){ Write-Host "OK  $m" -ForegroundColor Green }; function Info($m){ Write-Host "... $m" -ForegroundColor Cyan }; function Warn($m){ Write-Host "!!  $m" -ForegroundColor Yellow }
function Has($c){ [bool](Get-Command $c -ErrorAction SilentlyContinue) }
if (-not (Has py) -and -not (Has python)) { Info "Instalando Python..."; winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements | Out-Null }
if (-not (Has node)) { Info "Instalando Node..."; winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements | Out-Null }
if (-not (Has ffmpeg)) { Info "Instalando FFmpeg..."; winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements | Out-Null }
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe","${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe","$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ }
if (-not $chrome) { Info "Instalando Google Chrome..."; winget install -e --id Google.Chrome --accept-source-agreements --accept-package-agreements | Out-Null }
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
Info "Entorno de Python para la voz (edge-tts)..."
$py = if (Has py) { "py" } else { "python" }
if (-not (Test-Path "$SK\.venv\Scripts\python.exe")) { & $py -3 -m venv "$SK\.venv" }
& "$SK\.venv\Scripts\python.exe" -m pip install -q --upgrade pip edge-tts; if ($?) { Ok "edge-tts" }
$KF = "$HOME\.config\motion\elevenlabs_key"
if ((Test-Path $KF) -and (Get-Item $KF).Length -gt 10) { Ok "Clave de ElevenLabs ya guardada" }
else { $EK = Read-Host "Clave de ElevenLabs (opcional, voz más natural; Enter para saltear)"
  if ($EK) { New-Item -ItemType Directory -Force (Split-Path $KF) | Out-Null; Set-Content -NoNewline -Path $KF -Value $EK; Ok "Clave de ElevenLabs guardada en $KF" } else { Info "Sin ElevenLabs: se usa edge-tts (gratis)" } }
Info "Instalando dependencias de Node..."; Push-Location "$SK\engine"; npm ci --silent; Pop-Location; Ok "Dependencias de Node"
if ($Zip) { Expand-Archive -Force $Zip "$SK\assets\sfx"; Ok "Efectos de sonido del zip" }
elseif (Test-Path "$HOME\.claude\skills\edicion\assets\sfx\whoosh") { Ok "Efectos de sonido: se usan los de la skill edicion" }
else { Warn "Sin efectos de sonido (opcional): instalá la skill edicion o pasá la ruta a edicion-sfx.zip" }
# marcas propias fuera del repo (~\.config\motion\brands): sobreviven a reinstalar y no se pisan entre copias
$UB = "$HOME\.config\motion\brands"; New-Item -ItemType Directory -Force $UB | Out-Null
function Move-Brands($from) { Get-ChildItem -Directory "$from\brands" -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'editorial' -and (Test-Path "$($_.FullName)\brand.json") } | ForEach-Object {
  if (Test-Path "$UB\$($_.Name)") { Info "Marca $($_.Name) ya está en $UB" } else { Copy-Item -Recurse $_.FullName "$UB\$($_.Name)"; Ok "Marca $($_.Name) → $UB\$($_.Name)" } } }
Move-Brands $SK
foreach ($d in @("$HOME\.claude\skills","$HOME\.codex\skills")) {
  New-Item -ItemType Directory -Force $d | Out-Null
  $it = Get-Item "$d\motion" -ErrorAction SilentlyContinue
  if ($it -and -not $it.LinkType -and $it.FullName -ne (Get-Item $SK).FullName) {
    # una copia aparte se desincroniza del repo: guardar sus marcas, apartarla y enlazar
    Move-Brands $it.FullName; New-Item -ItemType Directory -Force "$HOME\.config\motion\backups" | Out-Null; $bk = "$HOME\.config\motion\backups\motion.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"; Move-Item $it.FullName $bk; Warn "Había una copia aparte de la skill: quedó en $bk (borrala cuando confirmes que todo anda)"; $it = $null }
  if ($it) { Ok "Skill en $d\motion" } else { New-Item -ItemType Junction -Path "$d\motion" -Target $SK | Out-Null; Ok "Skill enlazada en $d\motion" }
}
Write-Host ""; & $py -3 -I "$SK\scripts\doctor.py"
Write-Host ""; Write-Host "Listo. En Claude Code: /motion <guion>   ·   En Codex: `$motion <guion>"
