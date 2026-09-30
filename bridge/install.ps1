# Installs the AE Mentor Bridge panel on Windows. Non-interactive and safe to re-run.
#   powershell -ExecutionPolicy Bypass -File bridge\install.ps1
# 1. links cep\ into the user's CEP extensions folder (a junction: updates here apply after an AE restart)
# 2. lets After Effects load unsigned CEP extensions (PlayerDebugMode, current user only)
# Unlike upstream, it does not register an MCP server: the repo's .mcp.json registers ae-mentor.
# NOTE: carried from upstream, untested in this project (macOS only for now).
# Undo with uninstall.ps1. Check with: node bridge\scripts\doctor.mjs

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# 0. Node 18+
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Write-Error "Node.js is not installed. Install Node 18+ from https://nodejs.org and re-run."; exit 1 }
$ver = (& node -p "process.versions.node").Trim()
if ([int]($ver.Split('.')[0]) -lt 18) { Write-Error "Node $ver is too old. Install Node 18+ and re-run."; exit 1 }
"OK   Node $ver"

# 1. CEP extension
$extDir = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$link = Join-Path $extDir 'AEMentorBridge'
$target = Join-Path $root 'cep'
New-Item -ItemType Directory -Force $extDir | Out-Null
$existing = Get-Item $link -ErrorAction SilentlyContinue
if ($existing -and $existing.LinkType -eq 'Junction' -and $existing.Target -contains $target) {
    "OK   CEP extension already linked: $link"
} elseif ($existing -and $existing.LinkType -eq 'Junction') {
    [System.IO.Directory]::Delete($link)
    New-Item -ItemType Junction -Path $link -Target $target | Out-Null
    "OK   CEP extension re-linked: $link -> $target (it pointed elsewhere)"
} elseif ($existing) {
    Write-Error "$link exists and is not a junction. Move it aside and re-run."; exit 1
} else {
    New-Item -ItemType Junction -Path $link -Target $target | Out-Null
    "OK   CEP extension linked: $link -> $target"
}

# 2. PlayerDebugMode for CSXS 9-14 (After Effects 2019 to current)
foreach ($v in 9..14) {
    $key = "HKCU:\Software\Adobe\CSXS.$v"
    if (-not (Test-Path $key)) { New-Item -Path $key | Out-Null }
    Set-ItemProperty -Path $key -Name PlayerDebugMode -Value '1'
}
"OK   PlayerDebugMode=1 for CSXS.9 to CSXS.14"

""
"NEXT STEPS (a person has to do these):"
"  1. Restart After Effects (quit fully, then open it). The bridge starts with AE."
"  2. In AE: Edit > Preferences > Scripting & Expressions > tick 'Allow Scripts to Write Files and Access Network'."
"  3. Start a new Claude Code session in the repo so it loads ae-mentor from .mcp.json."
"Then verify:  node bridge\scripts\doctor.mjs   (bridge checks pass once AE is open)"
