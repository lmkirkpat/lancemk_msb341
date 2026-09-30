# Removes the AE Mentor Bridge: the CEP junction and the token file. Leaves PlayerDebugMode
# alone (other unsigned panels, such as the upstream bridge, rely on it), leaves every MCP
# registration alone (ae-mentor lives in the repo's .mcp.json), and leaves this folder in place.
# NOTE: carried from upstream, untested in this project.

$link = Join-Path $env:APPDATA 'Adobe\CEP\extensions\AEMentorBridge'
$item = Get-Item $link -ErrorAction SilentlyContinue
if ($item -and $item.LinkType -eq 'Junction') {
    # Removing the junction itself; the files it points to stay.
    [System.IO.Directory]::Delete($link)
    "Removed junction $link"
} elseif ($item) {
    "Left $link alone: it is not a junction."
}

$cfg = Join-Path $env:APPDATA 'AEMentorBridge'
if (Test-Path $cfg) { Remove-Item $cfg -Recurse -Force; "Removed $cfg" }

"Restart After Effects to unload the bridge."
