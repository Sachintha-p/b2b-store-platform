Add-Type -AssemblyName System.Net.Http

$baseUrl = "http://localhost:8080"
$client = New-Object System.Net.Http.HttpClient

# Use the token acquired earlier
$token = "eyJhbGciOiJIUzUxMiJ9.eyJyYW5kb21GZWVkYmFjayI6ZmFsc2UsInVzZXJJZCI6Miwicm9sZSI6IkFETUlOIiwic3ViIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3ODkwMTg2ODUsImV4cCI6MTc4OTEwNTA4NX0.dummy"

# Or acquire token first, restart server, then verify token is valid!
$loginJson = '{"email":"admin@example.com","password":"AdminSecurePassword123!"}'
$content = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")
$response = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
$resStr = $response.Content.ReadAsStringAsync().Result
$loginObj = ConvertFrom-Json $resStr
$capturedToken = $loginObj.token

Write-Host "Captured Token before restart:" ($capturedToken.Substring(0, 30) + "...")

# Save token to scratch file
Set-Content -Path "$PSScriptRoot\saved_token.txt" -Value $capturedToken
Write-Host "Token saved to saved_token.txt"
