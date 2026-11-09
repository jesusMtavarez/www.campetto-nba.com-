param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Crea soltanto il pacchetto locale. Non invia file e non pubblica il sito.
$projectFolder = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$projectRoot = [System.IO.Path]::GetFullPath($projectFolder)
$releaseRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'dist\campetto'))
$projectPrefix = $projectRoot.TrimEnd('\') + '\'
if (-not $releaseRoot.StartsWith($projectPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'La destinazione del pacchetto deve essere dentro il progetto.'
}

function Get-ProjectFile([string]$RelativePath) {
    $resolved = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $RelativePath))
    if (-not $resolved.StartsWith($projectPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Percorso esterno al progetto: $RelativePath"
    }
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "Risorsa mancante: $RelativePath"
    }
    return $resolved
}

$frontEndFiles = @(
    'index.html',
    'styles.css',
    'app-overrides.css',
    'campetto-preferences.css',
    'app.js',
    'supabase-config.js',
    'news-it.json',
    'ads.txt',
    'privacy.html',
    'contatti.html'
)
$frontEndFiles += @(Get-ChildItem -LiteralPath $projectRoot -Filter 'campetto-*.js' -File | ForEach-Object { $_.Name })
$frontEndFiles = @($frontEndFiles | Sort-Object -Unique)
foreach ($relativePath in $frontEndFiles) { $null = Get-ProjectFile $relativePath }

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) {
    throw 'Node.js non disponibile: serve per verificare la sintassi degli script prima di creare il pacchetto.'
}
foreach ($relativePath in @($frontEndFiles | Where-Object { $_.EndsWith('.js') })) {
    $sourcePath = Get-ProjectFile $relativePath
    $syntaxOutput = & $nodeCommand.Source --check $sourcePath 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Sintassi JavaScript non valida: $relativePath. Il pacchetto non e stato aggiornato."
    }
}
Write-Host 'OK - Sintassi di tutti gli script verificata.'

$newsPath = Get-ProjectFile 'news-it.json'
try { $null = Get-Content -LiteralPath $newsPath -Raw -Encoding UTF8 | ConvertFrom-Json }
catch { throw 'news-it.json non contiene JSON valido.' }

$imageManifestPath = Get-ProjectFile 'assets\cards\sources.json'
try { $cardPhotos = @(Get-Content -LiteralPath $imageManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json) }
catch { throw 'Il file delle fonti delle immagini non contiene JSON valido.' }
if ($cardPhotos.Count -eq 0) { throw 'Nessuna immagine delle carte presente nel manifest.' }
$cardFiles = @('assets\cards\sources.json')
foreach ($photo in $cardPhotos) {
    $fileName = [string]$photo.file
    if ([System.IO.Path]::GetFileName($fileName) -ne $fileName -or
        $fileName -notmatch '\.(jpg|jpeg|png|webp|gif|avif|svg)$') {
        throw 'Il manifest immagini contiene un nome di file non consentito.'
    }
    $relativePath = Join-Path 'assets\cards' $fileName
    $null = Get-ProjectFile $relativePath
    $cardFiles += $relativePath
}
$allowedFiles = @($frontEndFiles + $cardFiles | Sort-Object -Unique)

# Controlla anche i riferimenti HTML: una nuova dipendenza va inclusa esplicitamente.
$html = Get-Content -LiteralPath (Get-ProjectFile 'index.html') -Raw -Encoding UTF8
$references = [regex]::Matches($html, '(?:src|href)\s*=\s*["'']([^"'']+)["'']', 'IgnoreCase')
foreach ($reference in $references) {
    $value = $reference.Groups[1].Value
    if ($value -match '^(?:[a-z][a-z0-9+.-]*:|//|#)') { continue }
    $relativePath = [System.Uri]::UnescapeDataString(($value -split '[?#]', 2)[0]).Replace('/', '\')
    $null = Get-ProjectFile $relativePath
    if ($allowedFiles -notcontains $relativePath) {
        throw "Risorsa HTML non inclusa nella lista di pubblicazione: $relativePath"
    }
}
Write-Host "OK - Risorse HTML, JSON e $($cardPhotos.Count) immagini delle carte verificate."

# Legge solo le stringhe pubbliche della configurazione, senza eseguirla e senza stamparle.
$config = Get-Content -LiteralPath (Get-ProjectFile 'supabase-config.js') -Raw -Encoding UTF8
$urlMatch = [regex]::Match($config, '(?m)^\s*url\s*:\s*[''"]([^''"]*)[''"]')
$keyMatch = [regex]::Match($config, '(?m)^\s*anonKey\s*:\s*[''"]([^''"]*)[''"]')
$accountUrl = if ($urlMatch.Success) { $urlMatch.Groups[1].Value.Trim() } else { '' }
$publicKey = if ($keyMatch.Success) { $keyMatch.Groups[1].Value.Trim() } else { '' }
if ($publicKey -match '^sb_secret_' -or $publicKey -match 'service_role') {
    throw 'Chiave privata rilevata nella configurazione pubblica. Rimuoverla prima di preparare il sito.'
}
if (($publicKey -split '\.').Count -eq 3) {
    try {
        $payloadBase64 = ($publicKey -split '\.')[1].Replace('-', '+').Replace('_', '/')
        $payloadBase64 = $payloadBase64.PadRight([int]([Math]::Ceiling($payloadBase64.Length / 4.0) * 4), '=')
        $payloadText = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payloadBase64))
        $payload = $payloadText | ConvertFrom-Json
        if ($payload.PSObject.Properties.Name -contains 'role' -and $payload.role -eq 'service_role') {
            throw 'PRIVATE_ROLE'
        }
    } catch {
        if ($_.Exception.Message -eq 'PRIVATE_ROLE') {
            throw 'Chiave service_role rilevata. Non puo essere distribuita nel sito.'
        }
        throw 'La chiave pubblica JWT non e leggibile. Controllare supabase-config.js.'
    }
}
$configuredUrl = $null
$urlValid = [System.Uri]::TryCreate($accountUrl, [System.UriKind]::Absolute, [ref]$configuredUrl)
$accountsConfigured = $urlValid -and $configuredUrl.Scheme -eq 'https' -and $publicKey.Length -ge 20
if ($accountsConfigured) {
    Write-Host 'ACCOUNT CONFIGURATI - Parametri presenti. Registrazione, accesso, recupero e isolamento utenti vanno provati sul progetto reale.'
} else {
    Write-Warning 'ACCOUNT NON CONFIGURATI - Il pacchetto si puo creare, ma registrazione, accesso, recupero password e salvataggio cloud non sono attivi.'
}

# Non elimina cartelle o file. Arresta il lavoro se trova materiale estraneo.
$manifestName = 'release-manifest.json'
$releasePrefix = $releaseRoot.TrimEnd('\') + '\'
if (Test-Path -LiteralPath $releaseRoot) {
    if (-not (Test-Path -LiteralPath $releaseRoot -PathType Container)) {
        throw 'La destinazione del pacchetto esiste e non e una cartella.'
    }
    $foreignFiles = @(Get-ChildItem -LiteralPath $releaseRoot -File -Recurse -Force | ForEach-Object {
        $relativePath = $_.FullName.Substring($releasePrefix.Length)
        if ($allowedFiles -notcontains $relativePath -and $relativePath -ne $manifestName) { $relativePath }
    })
    if ($foreignFiles.Count -gt 0) {
        throw "File estranei nella cartella di pubblicazione; controllarli manualmente prima di continuare: $($foreignFiles -join ', ')"
    }
}

$null = New-Item -ItemType Directory -Path $releaseRoot -Force
foreach ($relativePath in $allowedFiles) {
    $destination = [System.IO.Path]::GetFullPath((Join-Path $releaseRoot $relativePath))
    if (-not $destination.StartsWith($releasePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'Destinazione non valida durante la copia.'
    }
    $null = New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($destination)) -Force
    Copy-Item -LiteralPath (Get-ProjectFile $relativePath) -Destination $destination -Force
}
$fileDetails = @($allowedFiles | ForEach-Object {
    $destination = Join-Path $releaseRoot $_
    [ordered]@{
        path = $_.Replace('\', '/')
        bytes = (Get-Item -LiteralPath $destination).Length
        sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    }
})
$releaseManifest = [ordered]@{
    builtAtUtc = [DateTime]::UtcNow.ToString('o')
    accountsConfigured = [bool]$accountsConfigured
    accountFlowVerified = $false
    cardsUpdate = 'manual'
    files = $fileDetails
}
$releaseManifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $releaseRoot $manifestName) -Encoding UTF8
Write-Host "PACCHETTO CREATO - $releaseRoot"
Write-Host "$($allowedFiles.Count) file di sito copiati, piu il manifest di verifica. Nessun deploy eseguito."
Write-Host 'Leggere RELEASE-CHECKLIST.md prima della pubblicazione.'
