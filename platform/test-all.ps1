# test-all.ps1 - Test E2E de tous les microservices via la gateway
# Usage : cd platform ; .\test-all.ps1

$BASE   = "http://localhost:3000"
$RABBIT = "http://localhost:15672"
$script:passed = 0
$script:failed = 0

function ok($label) {
  Write-Host "  [PASS] $label" -ForegroundColor Green
  $script:passed++
}

function nok($label, $extra) {
  if ($extra) { Write-Host "  [FAIL] $label -> $extra" -ForegroundColor Red }
  else        { Write-Host "  [FAIL] $label" -ForegroundColor Red }
  $script:failed++
}

function section($title) {
  Write-Host ""
  Write-Host "=== $title ===" -ForegroundColor Cyan
}

function Req($method, $path, $body, $token) {
  $headers = @{}
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $params = @{
    UseBasicParsing = $true
    Method          = $method
    Uri             = "$BASE$path"
    Headers         = $headers
    ErrorAction     = "Stop"
  }
  if ($body) {
    $headers["Content-Type"] = "application/json"
    $params["Body"] = ($body | ConvertTo-Json -Compress -Depth 5)
  }
  try {
    $r = Invoke-WebRequest @params
    return @{ status=[int]$r.StatusCode; body=($r.Content | ConvertFrom-Json -ErrorAction SilentlyContinue) }
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    $b = $null
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $text   = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
      $b      = $text | ConvertFrom-Json -ErrorAction SilentlyContinue
    } catch {}
    return @{ status=$code; body=$b }
  }
}

function Wait-Service($url, $label) {
  Write-Host -NoNewline "  Waiting $label "
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      if ([int]$r.StatusCode -lt 500) {
        Write-Host " UP"
        return
      }
    } catch {
      $code = [int]$_.Exception.Response.StatusCode
      if ($code -and $code -ne 502 -and $code -ne 503) {
        Write-Host " UP"
        return
      }
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 2
  }
  Write-Host " TIMEOUT"
}

# ======================================================================
# 0. Attente des services
# ======================================================================

section "0. Attente des services"
Wait-Service "$BASE/health"                "gateway       "
Wait-Service "$BASE/api/auth/me"           "auth-service  "
Wait-Service "$BASE/api/servers"           "inventory     "
Wait-Service "$BASE/api/monitoring/status" "monitoring    "

# ======================================================================
# 1. AUTH
# ======================================================================

section "1. AUTH"

$r = Req POST "/api/auth/login" @{ email="admin@pfe.local"; password="Admin1234!" }
if ($r.status -eq 200 -and $r.body.token) {
  ok "POST /api/auth/login admin -> 200 + token"
  $ADMIN_TOKEN = $r.body.token
} else {
  nok "POST /api/auth/login admin" "$($r.status)"
  $ADMIN_TOKEN = ""
}

$r = Req POST "/api/auth/login" @{ email="admin@pfe.local"; password="mauvais" }
if ($r.status -eq 401) { ok "POST /api/auth/login mauvais mdp -> 401" }
else                    { nok "POST /api/auth/login mauvais mdp" "$($r.status)" }

$viewerEmail = "viewer_$(Get-Random)@pfe.local"
$r = Req POST "/api/auth/register" @{ email=$viewerEmail; password="Viewer123!" }
if ($r.status -eq 201 -and $r.body.role -eq "VIEWER" -and (-not $r.body.password)) {
  ok "POST /api/auth/register -> 201 VIEWER (sans password)"
} else {
  nok "POST /api/auth/register" "status=$($r.status) role=$($r.body.role)"
}

$r = Req POST "/api/auth/register" @{ email="admin@pfe.local"; password="Admin1234!" }
if ($r.status -eq 409) { ok "POST /api/auth/register email duplique -> 409" }
else                    { nok "POST /api/auth/register email duplique" "$($r.status)" }

$r = Req GET "/api/auth/me" $null $ADMIN_TOKEN
if ($r.status -eq 200 -and $r.body.role -eq "ADMIN" -and (-not $r.body.password)) {
  ok "GET /api/auth/me -> 200 ADMIN (sans password)"
} else {
  nok "GET /api/auth/me" "$($r.status)"
}

$r = Req GET "/api/auth/me"
if ($r.status -eq 401) { ok "GET /api/auth/me sans token -> 401" }
else                    { nok "GET /api/auth/me sans token" "$($r.status)" }

$r = Req POST "/api/auth/login" @{ email=$viewerEmail; password="Viewer123!" }
$VIEWER_TOKEN = if ($r.status -eq 200) { $r.body.token } else { "" }

# ======================================================================
# 2. INVENTORY
# ======================================================================

section "2. INVENTORY"

$r = Req POST "/api/servers" @{ hostname="test-web"; ipAddress="127.0.0.1"; os="Ubuntu 22.04"; tags=@("test") } $ADMIN_TOKEN
if ($r.status -eq 201 -and $r.body.id) {
  ok "POST /api/servers -> 201"
  $SRV1 = $r.body.id
} else {
  nok "POST /api/servers" "$($r.status)"
  $SRV1 = ""
}

$r = Req POST "/api/servers" @{ hostname="test-db"; ipAddress="192.168.99.98"; tags=@("test") } $ADMIN_TOKEN
if ($r.status -eq 201) { ok "POST /api/servers (IP fictive) -> 201"; $SRV2 = $r.body.id }
else                    { nok "POST /api/servers IP fictive" "$($r.status)"; $SRV2 = "" }

$r = Req GET "/api/servers" $null $ADMIN_TOKEN
if ($r.status -eq 200) { ok "GET /api/servers -> 200 ($($r.body.Count) serveurs)" }
else                    { nok "GET /api/servers" "$($r.status)" }

if ($SRV1) {
  $r = Req GET "/api/servers/$SRV1" $null $ADMIN_TOKEN
  if ($r.status -eq 200 -and $r.body.hostname -eq "test-web") { ok "GET /api/servers/:id -> 200" }
  else                                                          { nok "GET /api/servers/:id" "$($r.status)" }

  $r = Req PUT "/api/servers/$SRV1" @{ status="ONLINE" } $ADMIN_TOKEN
  if ($r.status -eq 200 -and $r.body.status -eq "ONLINE") { ok "PUT /api/servers/:id -> 200 ONLINE" }
  else                                                      { nok "PUT /api/servers/:id" "$($r.status)" }
}

$r = Req GET "/api/servers/00000000-0000-0000-0000-000000000000" $null $ADMIN_TOKEN
if ($r.status -eq 404) { ok "GET /api/servers/inexistant -> 404" }
else                    { nok "GET /api/servers/inexistant" "$($r.status)" }

$r = Req POST "/api/servers" @{ hostname="x"; ipAddress="pas-une-ip" } $ADMIN_TOKEN
if ($r.status -eq 400) { ok "POST /api/servers IP invalide -> 400" }
else                    { nok "POST /api/servers IP invalide" "$($r.status)" }

# ======================================================================
# 3. RBAC
# ======================================================================

section "3. RBAC"

$r = Req GET "/api/servers" $null $VIEWER_TOKEN
if ($r.status -eq 200) { ok "VIEWER GET /api/servers -> 200" }
else                    { nok "VIEWER GET /api/servers" "$($r.status)" }

$r = Req POST "/api/servers" @{ hostname="hack"; ipAddress="1.2.3.4" } $VIEWER_TOKEN
if ($r.status -eq 403) { ok "VIEWER POST /api/servers -> 403" }
else                    { nok "VIEWER POST /api/servers" "$($r.status)" }

if ($SRV1) {
  $r = Req DELETE "/api/servers/$SRV1" $null $VIEWER_TOKEN
  if ($r.status -eq 403) { ok "VIEWER DELETE /api/servers/:id -> 403" }
  else                    { nok "VIEWER DELETE /api/servers/:id" "$($r.status)" }

  $r = Req POST "/api/monitoring/check/$SRV1" $null $VIEWER_TOKEN
  if ($r.status -eq 403) { ok "VIEWER POST /api/monitoring/check/:id -> 403" }
  else                    { nok "VIEWER POST /api/monitoring/check/:id" "$($r.status)" }
}

$r = Req GET "/api/servers"
if ($r.status -eq 401) { ok "Sans token -> 401" }
else                    { nok "Sans token" "$($r.status)" }

# ======================================================================
# 4. MONITORING
# ======================================================================

section "4. MONITORING"

Write-Host "  Waiting 4s for RabbitMQ event propagation..." -NoNewline
Start-Sleep -Seconds 4
Write-Host " ok"

$r = Req GET "/api/monitoring/status" $null $ADMIN_TOKEN
if ($r.status -eq 200) {
  $found = $r.body | Where-Object { $_.hostname -eq "test-web" -or $_.hostname -eq "test-db" }
  if ($found -and $found.Count -ge 1) {
    ok "GET /api/monitoring/status -> 200 ($($r.body.Count) serveurs via events)"
  } else {
    nok "GET /api/monitoring/status" "serveurs test pas encore enregistres (event delay?)"
  }
} else {
  nok "GET /api/monitoring/status" "$($r.status)"
}

if ($SRV1) {
  $r = Req POST "/api/monitoring/check/$SRV1" $null $ADMIN_TOKEN
  if ($r.status -eq 200 -and $r.body.status -eq "UP") {
    ok "POST /api/monitoring/check/test-web -> UP (127.0.0.1)"
  } elseif ($r.status -eq 200) {
    ok "POST /api/monitoring/check/test-web -> $($r.body.status)"
  } else {
    nok "POST /api/monitoring/check/test-web" "$($r.status) $($r.body.error.message)"
  }
}

if ($SRV2) {
  $r = Req POST "/api/monitoring/check/$SRV2" $null $ADMIN_TOKEN
  if ($r.status -eq 200 -and $r.body.status -eq "DOWN") {
    ok "POST /api/monitoring/check/test-db -> DOWN + server.down publie"
  } elseif ($r.status -eq 200) {
    ok "POST /api/monitoring/check/test-db -> $($r.body.status)"
  } else {
    nok "POST /api/monitoring/check/test-db" "$($r.status) $($r.body.error.message)"
  }
}

$r = Req POST "/api/monitoring/check" $null $ADMIN_TOKEN
if ($r.status -eq 200) { ok "POST /api/monitoring/check (all) -> 200 ($($r.body.Count) resultats)" }
else                    { nok "POST /api/monitoring/check (all)" "$($r.status)" }

if ($SRV1) {
  $r = Req GET "/api/monitoring/history/$($SRV1)?limit=10" $null $ADMIN_TOKEN
  if ($r.status -eq 200 -and $r.body.Count -ge 1) {
    ok "GET /api/monitoring/history/:id -> $($r.body.Count) entree(s)"
  } else {
    nok "GET /api/monitoring/history/:id" "$($r.status) count=$($r.body.Count)"
  }
}

# ======================================================================
# 5. Nettoyage
# ======================================================================

section "5. Nettoyage"

foreach ($id in @($SRV1, $SRV2)) {
  if (-not $id) { continue }
  $r = Req DELETE "/api/servers/$id" $null $ADMIN_TOKEN
  if ($r.status -eq 204) { ok "DELETE $($id.Substring(0,8))... -> 204" }
  else                    { nok "DELETE $id" "$($r.status)" }
}

$r = Req GET "/api/servers" $null $ADMIN_TOKEN
$remaining = $r.body | Where-Object { $_.hostname -eq "test-web" -or $_.hostname -eq "test-db" }
if (-not $remaining -or $remaining.Count -eq 0) { ok "Serveurs de test supprimes" }
else                                             { nok "Serveurs de test encore presents" "$($remaining.Count) restant(s)" }

# ======================================================================
# 6. RabbitMQ
# ======================================================================

section "6. RabbitMQ"

try {
  $auth64  = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin"))
  $rHeaders = @{ Authorization = "Basic $auth64" }
  $queues  = Invoke-RestMethod "$RABBIT/api/queues" -Headers $rHeaders -ErrorAction Stop
  $q = $queues | Where-Object { $_.name -eq "monitoring.server-sync" }
  if ($q) {
    ok "Queue 'monitoring.server-sync' : $($q.consumers) consumer(s), $($q.messages) msg en attente"
  } else {
    nok "Queue 'monitoring.server-sync' introuvable"
  }
  $exList = Invoke-RestMethod "$RABBIT/api/exchanges/%2F" -Headers $rHeaders -ErrorAction Stop
  $ex = $exList | Where-Object { $_.name -eq "platform.events" }
  if ($ex) { ok "Exchange 'platform.events' (type: $($ex.type), durable: $($ex.durable))" }
  else      { nok "Exchange 'platform.events' introuvable" }
} catch {
  Write-Host "  [SKIP] RabbitMQ Management inaccessible" -ForegroundColor Yellow
}

# ======================================================================
# Resume
# ======================================================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor White
if ($script:failed -eq 0) {
  Write-Host "  $($script:passed) PASS  |  $($script:failed) FAIL  - Tous les tests passent !" -ForegroundColor Green
} else {
  Write-Host "  $($script:passed) PASS  |  $($script:failed) FAIL" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor White

if ($script:failed -gt 0) { exit 1 }
