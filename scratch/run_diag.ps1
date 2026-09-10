Add-Type -AssemblyName System.Net.Http

$baseUrl = "http://localhost:8080"
$client = New-Object System.Net.Http.HttpClient

# 1. Login
$loginJson = '{"email":"admin@example.com","password":"AdminSecurePassword123!"}'
$content = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")
$response = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
$resStr = $response.Content.ReadAsStringAsync().Result
$loginObj = ConvertFrom-Json $resStr
$token = $loginObj.token

Write-Host "Admin Token acquired:" ($token.Substring(0, 25) + "...")
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

# Test GET /api/auth/me
Write-Host "`n================ GET /api/auth/me ================"
$meRes = $client.GetAsync("$baseUrl/api/auth/me").Result
Write-Host "Me status:" $meRes.StatusCode
Write-Host "Me content:" $meRes.Content.ReadAsStringAsync().Result

# 2. GET product 10 before
Write-Host "`n================ GET /api/products/10 BEFORE ================"
$pBeforeRes = $client.GetAsync("$baseUrl/api/products/10").Result.Content.ReadAsStringAsync().Result
Write-Host $pBeforeRes

# 3. GET product 10 images before
Write-Host "`n================ GET /api/products/10/images BEFORE ================"
$imgsBeforeRes = $client.GetAsync("$baseUrl/api/products/10/images").Result.Content.ReadAsStringAsync().Result
Write-Host $imgsBeforeRes

# 4. Upload gallery image using MultipartFormDataContent
Write-Host "`n================ UPLOADING SECOND GALLERY IMAGE ================"
$testImgPath = "$PSScriptRoot\test_image.png"
if (-not (Test-Path $testImgPath)) {
    $bytes = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
    [System.IO.File]::WriteAllBytes($testImgPath, $bytes)
}

$fileBytes = [System.IO.File]::ReadAllBytes($testImgPath)
$multiContent = New-Object System.Net.Http.MultipartFormDataContent
$fileContent = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$multiContent.Add($fileContent, "files", "sample.png")

$uploadRes = $client.PostAsync("$baseUrl/api/admin/products/10/images", $multiContent).Result
Write-Host "Status Code:" $uploadRes.StatusCode
Write-Host "Upload Result:" $uploadRes.Content.ReadAsStringAsync().Result

# 5. GET product 10 images after upload
Write-Host "`n================ GET /api/products/10/images AFTER UPLOAD ================"
$imgsAfterUpload = $client.GetAsync("$baseUrl/api/products/10/images").Result.Content.ReadAsStringAsync().Result
Write-Host $imgsAfterUpload

# 6. Test set-primary if gallery images exist
$imgsObj = ConvertFrom-Json $imgsAfterUpload
if ($imgsObj -and $imgsObj.Count -gt 0) {
    $targetImgId = $imgsObj[0].id
    Write-Host "`n================ CALLING PUT /api/admin/products/10/images/$targetImgId/set-primary ================"
    $emptyContent = New-Object System.Net.Http.StringContent("", [System.Text.Encoding]::UTF8, "application/json")
    $setPrimaryRes = $client.PutAsync("$baseUrl/api/admin/products/10/images/$targetImgId/set-primary", $emptyContent).Result
    Write-Host "Set-Primary Status:" $setPrimaryRes.StatusCode
    Write-Host "Set-Primary Result:" $setPrimaryRes.Content.ReadAsStringAsync().Result

    Write-Host "`n================ GET /api/products/10 AFTER SET-PRIMARY ================"
    Write-Host $client.GetAsync("$baseUrl/api/products/10").Result.Content.ReadAsStringAsync().Result

    Write-Host "`n================ GET /api/products/10/images AFTER SET-PRIMARY ================"
    Write-Host $client.GetAsync("$baseUrl/api/products/10/images").Result.Content.ReadAsStringAsync().Result
}

