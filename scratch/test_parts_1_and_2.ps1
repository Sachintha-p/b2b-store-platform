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

Write-Host "Backend is READY!"

# 1. Login as admin and acquire token
$loginJson = '{"email":"admin@example.com","password":"AdminSecurePassword123!"}'
$content = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")
$response = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
$resStr = $response.Content.ReadAsStringAsync().Result
$loginObj = ConvertFrom-Json $resStr
$token = $loginObj.token
Write-Host "`nCaptured Admin Token:" ($token.Substring(0, 25) + "...")

# Add Bearer Token
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

# Verify /api/auth/me works
$meRes = $client.GetAsync("$baseUrl/api/auth/me").Result
Write-Host "Initial /api/auth/me status:" $meRes.StatusCode

# 2. Test Error Masking fix (Part 2)
# Call GET /api/products/999999/images (which returns 404 Not Found)
Write-Host "`n---> Testing Error Surface (Part 2): GET /api/products/999999/images ..."
$errRes = $client.GetAsync("$baseUrl/api/products/999999/images").Result
Write-Host "Status Code:" $errRes.StatusCode " (Expected 404, NOT 401!)"
Write-Host "Body:" $errRes.Content.ReadAsStringAsync().Result

