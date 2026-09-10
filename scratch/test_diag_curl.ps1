$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body (@{email="admin@example.com"; password="AdminSecurePassword123!"} | ConvertTo-Json) -ContentType "application/json"
$token = $loginRes.token

Write-Host "Admin Token acquired:" ($token.Substring(0, 20) + "...")

# 1. Fetch Product 10 before
Write-Host "`n================ GET /api/products/10 BEFORE ================"
curl.exe -s http://localhost:8080/api/products/10

# 2. Upload gallery image to Product 10
$testImgPath = "$PSScriptRoot\test_image.png"
if (-not (Test-Path $testImgPath)) {
    $bytes = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
    [System.IO.File]::WriteAllBytes($testImgPath, $bytes)
}

Write-Host "`n`n================ UPLOADING SECOND GALLERY IMAGE ================"
$uploadOutput = curl.exe -s -X POST "http://localhost:8080/api/admin/products/10/images" -H "Authorization: Bearer $token" -F "files=@$testImgPath;type=image/png"
Write-Host "Upload output: $uploadOutput"

# 3. Fetch gallery images
Write-Host "`n`n================ GET /api/products/10/images ================"
curl.exe -s -H "Authorization: Bearer $token" http://localhost:8080/api/products/10/images

