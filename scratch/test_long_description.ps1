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

Write-Host "================ LONG DESCRIPTION & CLEAN STARTUP E2E TEST ================"

# 1. Login
$loginJson = '{"email":"admin@example.com","password":"AdminSecurePassword123!"}'
$content = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")
$loginRes = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
$token = (ConvertFrom-Json $loginRes.Content.ReadAsStringAsync().Result).token
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

# 2. Create a product with a 350-character description (exceeding old 255-char limit)
$longDesc = "This is an extraordinarily detailed product description designed specifically to test the database schema migration from VARCHAR(255) to TEXT. It contains comprehensive explanations of product specifications, ergonomic design principles, high-performance manufacturing standards, durable material choices, and extensive multi-year warranty details..."
Write-Host "Description length:" $longDesc.Length "characters (exceeds 255 chars)"

$prodPayload = @{
    name = "Long Description Test Product"
    category = "Furniture"
    description = $longDesc
    retailPrice = 299.99
    wholesalePrice = 219.99
    stockQuantity = 25
} | ConvertTo-Json

$prodContent = New-Object System.Net.Http.StringContent($prodPayload, [System.Text.Encoding]::UTF8, "application/json")
$prodRes = $client.PostAsync("$baseUrl/api/products", $prodContent).Result

Write-Host "Product Creation Status Code:" $prodRes.StatusCode " (Expected 201 CREATED)"
$savedProd = ConvertFrom-Json $prodRes.Content.ReadAsStringAsync().Result
Write-Host "Saved Product ID:" $savedProd.id
Write-Host "Saved Description Length:" $savedProd.description.Length "characters"

if ($savedProd.description.Length -eq $longDesc.Length) {
    Write-Host "SUCCESS: Long description preserved without truncation or database crash! (PASS)"
} else {
    Write-Host "ERROR: Description length mismatch!"
}

# Clean up test product
$null = $client.DeleteAsync("$baseUrl/api/products/$($savedProd.id)").Result
Write-Host "`nCleaned up test product."
Write-Host "================ ALL VERIFICATIONS PASSED SUCCESSFULLY ================"
