$baseUrl = "http://localhost:8080/api"

# 1. Login as Admin
$token = $null
foreach ($pwd in @("admin123", "adminpassword")) {
    try {
        $loginBody = @{ email = "admin@example.com"; password = $pwd } | ConvertTo-Json
        $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
        $token = $loginRes.token
        Write-Host "Admin Login Successful with password '$pwd'."
        break
    } catch {}
}

if (-not $token) {
    Write-Host "Login Failed with both passwords."
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# 2. Create a test product
$productBody = @{
    name = "Batch Upload Test Product"
    category = "Test"
    description = "Testing multi-image batch upload"
    retailPrice = 29.99
    wholesalePrice = 19.99
    stockQuantity = 50
} | ConvertTo-Json

$prodRes = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Headers $headers -Body $productBody -ContentType "application/json"
$productId = $prodRes.id
Write-Host "Created Test Product ID: $productId"

# 3. Create 4 dummy image files
$tmpDir = Join-Path $PSScriptRoot "tmp_images"
if (-not (Test-Path $tmpDir)) { New-Item -ItemType Directory -Path $tmpDir | Out-Null }

$filePaths = @()
for ($i = 1; $i -le 4; $i++) {
    $imgPath = Join-Path $tmpDir "img_$i.jpg"
    # Create a valid minimal 1x1 JPEG byte array
    $jpgBytes = [byte[]]@(
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
        0x00, 0xBF, 0x00, 0xFF, 0xD9
    )
    [System.IO.File]::WriteAllBytes($imgPath, $jpgBytes)
    $filePaths += $imgPath
}

# 4. Upload Cover Image first (Simulating UI flow)
$coverPath = $filePaths[0]
Write-Host "Uploading Cover Image..."
$curlCover = "curl.exe -s -w `"\nHTTP_CODE:%{http_code}`" -X POST `"$baseUrl/admin/products/$productId/image`" -H `"Authorization: Bearer $token`" -F `"file=@$coverPath`""
$coverRes = Invoke-Expression $curlCover
Write-Host "Cover Upload Result:`n$coverRes"

# 5. Upload Remaining 3 Gallery Images in 1 Batch Request
Write-Host "`nUploading 3 Gallery Images in Batch..."
$gal1 = $filePaths[1]
$gal2 = $filePaths[2]
$gal3 = $filePaths[3]
$curlBatch = "curl.exe -s -w `"\nHTTP_CODE:%{http_code}`" -X POST `"$baseUrl/admin/products/$productId/images`" -H `"Authorization: Bearer $token`" -F `"files=@$gal1`" -F `"files=@$gal2`" -F `"files=@$gal3`""
$batchRes = Invoke-Expression $curlBatch
Write-Host "Batch Gallery Upload Result:`n$batchRes"

# Cleanup
Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Delete -Headers $headers | Out-Null
Write-Host "`nCleaned up test product $productId."
