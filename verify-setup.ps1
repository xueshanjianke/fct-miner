Param(
  [switch]$Install,
  [switch]$InitEnv,
  [ValidateSet('sepolia','mainnet')]
  [string]$Network
)

function Fail($msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

function Warn($msg) {
  Write-Host "WARN:  $msg" -ForegroundColor Yellow
}

function Ok($msg) {
  Write-Host "OK:    $msg" -ForegroundColor Green
}

function Has-Cmd($name) {
  return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Read-PlainFromSecure([Security.SecureString]$sec) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Init-EnvFile {
  param(
    [string]$EnvPath,
    [string]$DefaultNetwork = 'sepolia',
    [switch]$NoPromptNetwork
  )
  Write-Host "Creating/updating .env..." -ForegroundColor Cyan
  $pkSecure = Read-Host -AsSecureString "Enter PRIVATE_KEY (0x + 64 hex)"
  $pkPlain = Read-PlainFromSecure $pkSecure
  if (-not $pkPlain -or $pkPlain.Trim().Length -eq 0) { Fail "PRIVATE_KEY cannot be empty" }
  if ($pkPlain -notmatch '^0x[0-9a-fA-F]{64}$') { Warn "PRIVATE_KEY format unusual (expect 0x + 64 hex)" }

  $net = $DefaultNetwork
  if (-not $NoPromptNetwork) {
    $inputNet = Read-Host "Network [sepolia|mainnet] (default: $DefaultNetwork)"
    if ($inputNet) { $net = $inputNet }
    # Normalize and validate; fall back to default on invalid input
    $net = $net.Trim().ToLower()
    if (@('sepolia','mainnet') -notcontains $net) {
      Warn "Invalid network input '$net'. Using default: $DefaultNetwork"
      $net = $DefaultNetwork
    }
  } else {
    # Ensure provided default is normalized
    $net = $DefaultNetwork.Trim().ToLower()
  }

  $content = @(
    "PRIVATE_KEY=$pkPlain",
    "NETWORK=$net",
    "GAS_PRICE_MULTIPLIER=1.5",
    "# L1_RPC_URL=",
    "# FACET_RPC_URL="
  ) -join "`n"

  Set-Content -Path $EnvPath -Value $content -NoNewline -Encoding UTF8
  Ok ".env written (keys set: PRIVATE_KEY, NETWORK)."
}

Push-Location $PSScriptRoot
try {
  Write-Host "=== FCT Miner Setup Verification ===" -ForegroundColor Cyan

  # Node.js check
  if (-not (Has-Cmd node)) { Fail "Node.js not found. Install Node 18+ from https://nodejs.org/" }
  $nodeVer = (& node -v) -replace '^v',''
  $nodeMajor = [int]($nodeVer.Split('.')[0])
  if ($nodeMajor -lt 18) { Fail "Node.js 18+ required. Detected v$nodeVer" } else { Ok "Node.js v$nodeVer" }

  # pnpm check (recommended)
  $hasPnpm = Has-Cmd pnpm
  if ($hasPnpm) {
    $pnpmVer = (& pnpm -v)
    Ok "pnpm v$pnpmVer"
  } else {
    Warn "pnpm not found. Recommended to enable via 'corepack enable; corepack prepare pnpm@latest --activate' or install 'npm i -g pnpm'"
  }

  # .env presence
  $envPath = Join-Path $PSScriptRoot ".env"
  $examplePath = Join-Path $PSScriptRoot ".env.example"
  if ($InitEnv -or -not (Test-Path $envPath)) {
    if ($Network) { Init-EnvFile -EnvPath $envPath -DefaultNetwork $Network -NoPromptNetwork }
    else { Init-EnvFile -EnvPath $envPath }
  } else { Ok ".env found" }

  # Parse and validate .env
  $pk = $null; $net = $null
  if (Test-Path $envPath) {
    $lines = Get-Content $envPath -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
      if ($line -match '^\s*#') { continue }
      if ($line -match '^\s*$') { continue }
      $pair = $line -split '=', 2
      if ($pair.Count -eq 2) {
        $key = $pair[0].Trim()
        $val = $pair[1].Trim()
        switch -Exact ($key) {
          'PRIVATE_KEY' { $pk = $val }
          'NETWORK'     { $net = $val }
        }
      }
    }
  }

  if (-not $pk) { Warn "PRIVATE_KEY missing in .env" }
  elseif ($pk -notmatch '^0x[0-9a-fA-F]{64}$') { Warn "PRIVATE_KEY format unusual (expect 0x + 64 hex chars)" } else { Ok "PRIVATE_KEY format looks valid" }

  if (-not $net) { Warn "NETWORK missing in .env (sepolia | mainnet)" }
  elseif (@('sepolia','mainnet') -notcontains $net) { Warn "NETWORK should be 'sepolia' or 'mainnet' (current: $net)" } else { Ok "NETWORK=$net" }

  # Optional install
  if ($Install) {
    Write-Host "\nInstalling dependencies..." -ForegroundColor Cyan
    if ($hasPnpm) {
      pnpm install
      if ($LASTEXITCODE -ne 0) { Fail "pnpm install failed" }
    } else {
      if (-not (Has-Cmd npm)) { Fail "Neither pnpm nor npm found. Install Node.js which provides npm." }
      npm install
      if ($LASTEXITCODE -ne 0) { Fail "npm install failed" }
    }
    Ok "Dependencies installed"
  } else {
    Write-Host "\nSkip installing dependencies (run with -Install to install)." -ForegroundColor DarkGray
  }

  Write-Host "\nNext steps:" -ForegroundColor Cyan
  Write-Host " - Edit .env to adjust settings if needed"
  Write-Host " - Show current network: pnpm run network:show"
  Write-Host " - Start mining on Sepolia: pnpm run mine:sepolia"
  Write-Host " - Start mining on Mainnet:  pnpm run mine:mainnet"

} finally {
  Pop-Location
}
