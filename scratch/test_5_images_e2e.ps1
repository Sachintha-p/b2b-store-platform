$baseUrl = "http://localhost:8080/api"

# 1. Login as Admin
$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    Write-Host "Admin Login Successful. Token acquired."
} catch {
    Write-Host "Login Failed: $_"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# 2. Create Product (5 images test)
$productBody = @{
    name = "5-Image Product Test"
    category = "Testing"
    description = "Testing 5-image upload flow end-to-end"
    retailPrice = 49.99
    wholesalePrice = 29.99
    stockQuantity = 100
} | ConvertTo-Json

Write-Host "Step 1: Creating Product Record..."
$prodRes = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Headers $headers -Body $productBody -ContentType "application/json"
$productId = $prodRes.id
Write-Host "Product Created Successfully! ID: $productId"

# 3. Create 5 sample image files
$tmpDir = Join-Path $PSScriptRoot "tmp_5_images"
if (-not (Test-Path $tmpDir)) { New-Item -ItemType Directory -Path $tmpDir | Out-Null }

$filePaths = @()
for ($i = 1; $i -le 5; $i++) {
    $imgPath = Join-Path $tmpDir "test_img_$i.jpg"
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

# 4. Upload Cover Image (Image #1)
Write-Host "`nStep 2: Uploading Cover Image (1 of 5)..."
$coverPath = $filePaths[0]
$curlCover = "curl.exe -s -w `"\nHTTP_CODE:%{http_code}`" -X POST `"$baseUrl/admin/products/$productId/image`" -H `"Authorization: Bearer $token`" -F `"file=@$coverPath`""
$coverRes = Invoke-Expression $curlCover
Write-Host "Cover Upload Result:`n$coverRes"

# 5. Upload Remaining 4 Gallery Images in Batch
Write-Host "`nStep 3: Uploading 4 Gallery Images in Batch (2-5 of 5)..."
$g1 = $filePaths[1]
$g2 = $filePaths[2]
$g3 = $filePaths[3]
$g4 = $filePaths[4]
$curlBatch = "curl.exe -s -w `"\nHTTP_CODE:%{http_code}`" -X POST `"$baseUrl/admin/products/$productId/images`" -H `"Authorization: Bearer $token`" -F `"files=@$g1`" -F `"files=@$g2`" -F `"files=@$g3`" -F `"files=@$g4`""
$batchRes = Invoke-Expression $curlBatch
Write-Host "Gallery Batch Upload Result:`n$batchRes"

# 6. Verify Product Details & Image Count from GET /api/products/{id}
Write-Host "`nStep 4: Querying Product Details..."
$prodCheck = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Get
Write-Host "Product Cover Image URL: $($prodCheck.imageUrl)"
$coverCount = if ($prodCheck.imageUrl) { 1 } else { 0 }
$totalImages = $coverCount + $prodCheck.additionalImages.Count
Write-Host "TOTAL IMAGES ON PRODUCT: $totalImages / 5"

if ($totalImages -eq 5) {
    Write-Host "`n======================================================="
    Write-Host "SUCCESS: ALL 5 IMAGES UPLOADED & ATTACHED SUCCESSFULLY!"
    Write-Host "======================================================="
} else {
    Write-Host "`nFAILURE: Expected 5 images, but found $totalImages."
}

# Cleanup
Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Delete -Headers $headers | Out-Null
Write-Host "Cleaned up test product $productId."
