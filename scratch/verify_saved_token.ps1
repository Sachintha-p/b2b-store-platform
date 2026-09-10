Add-Type -AssemblyName System.Net.Http

$baseUrl = "http://localhost:8080"
$client = New-Object System.Net.Http.HttpClient

# Wait for backend to be ready
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $res = $client.GetAsync("$baseUrl/api/products").Result
        if ($res.IsSuccessStatusCode) {
            $ready = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Host "Backend server did not start in time."
    exit 1
}

Write-Host "Backend is READY after restart!"

# Read saved token from before restart
$savedToken = Get-Content -Path "$PSScriptRoot\saved_token.txt"
Write-Host "Verifying token saved BEFORE restart:" ($savedToken.Substring(0, 30) + "...")

$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $savedToken)

# Verify /api/auth/me works with token generated before restart!
$meRes = $client.GetAsync("$baseUrl/api/auth/me").Result
Write-Host "`n---> /api/auth/me status after backend restart:" $meRes.StatusCode " (Expected 200 OK)"
$body = $meRes.Content.ReadAsStringAsync().Result
Write-Host "User Email:" (ConvertFrom-Json $body).email

