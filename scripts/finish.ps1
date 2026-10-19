# Cierre del video en una sola corrida (Windows): render final + mix + QC + look log + timing.
# uso: powershell -ExecutionPolicy Bypass -File finish.ps1 <work>     (logs completos en <work>\finish.log)
param([Parameter(Mandatory=$true)][string]$Work)
$ErrorActionPreference = "Stop"
$W = (Resolve-Path $Work).Path; $SK = Split-Path -Parent $PSScriptRoot
$PY = Join-Path $SK ".venv\Scripts\python.exe"; if (-not (Test-Path $PY)) { $PY = "python" }
$LOG = Join-Path $W "finish.log"; "" | Set-Content $LOG
function Run($label, [scriptblock]$cmd) { "== $label" | Add-Content $LOG; & $cmd *>> $LOG; if ($LASTEXITCODE -ne 0) { Write-Host "x $label fallo (log: $LOG)"; Get-Content $LOG -Tail 12; exit 1 } }
$cfg = Get-Content (Join-Path $W "config.json") -Raw | ConvertFrom-Json
Run "render" { node "$SK\scripts\render.js" $W }
Run "mix" { & $PY -I "$SK\scripts\mix.py" $W }
Run "look" { node "$SK\scripts\look.js" log $W }
Run "timing" { & $PY -I "$SK\scripts\timing.py" report $W }
Write-Host "MP4: $($cfg.out_dir)\$($cfg.name).mp4"
& $PY -I "$SK\scripts\qc.py" $W
