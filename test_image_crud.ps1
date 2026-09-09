# Full CRUD + Image Upload Verification Script

$body = @{ email = "admin@example.com"; password = "AdminSecurePassword123!" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

Write-Host "=== CRUD VERIFICATION ==="

# 1. CREATE
$productBody = @{ name = "Image Test Product"; description = "test"; retailPrice = 19.99; wholesalePrice = 14.99; stockQuantity = 50; category = "Electronics" } | ConvertTo-Json
$product = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Post -Body $productBody -ContentType "application/json" -Headers $headers
$productId = $product.id
Write-Host "[CREATE] Product created: ID=$productId, isArchived=$($product.isArchived)"

# 2. READ
$readProduct = Invoke-RestMethod -Uri "http://localhost:8080/api/products/$productId" -Method Get
Write-Host "[READ] Product fetched: $($readProduct.name)"

# 3. UPDATE
$updateBody = @{ name = "Updated Image Test Product"; description = "updated"; retailPrice = 24.99; wholesalePrice = 18.99; stockQuantity = 45; category = "Electronics" } | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "http://localhost:8080/api/products/$productId" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
Write-Host "[UPDATE] Product updated: $($updated.name)"

Write-Host ""
Write-Host "=== IMAGE UPLOAD VERIFICATION ==="

# 4. Upload image (create a small test PNG in memory)
$pngBytes = [byte[]](0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,0xDE,0x00,
    0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,0x00,0x00,0x02,0x00,
    0x01,0xE2,0x21,0xBC,0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82)
$tempFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.png'
[System.IO.File]::WriteAllBytes($tempFile, $pngBytes)

try {
    $boundary = "----FormBoundary$(Get-Random)"
    $fileBytes = [System.IO.File]::ReadAllBytes($tempFile)
    $enc = [System.Text.Encoding]::UTF8
    $bodyParts = @()
    $bodyParts += $enc.GetBytes("--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"test.png`"`r`nContent-Type: image/png`r`n`r`n")
    $bodyParts += $fileBytes
    $bodyParts += $enc.GetBytes("`r`n--$boundary--`r`n")
    $multipartBody = New-Object System.Byte[] ($bodyParts | Measure-Object -Property Length -Sum).Sum
    $offset = 0
    foreach ($part in $bodyParts) { [System.Buffer]::BlockCopy($part, 0, $multipartBody, $offset, $part.Length); $offset += $part.Length }

    $uploadResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/products/$productId/image" `
        -Method Post -Headers $headers -Body $multipartBody `
        -ContentType "multipart/form-data; boundary=$boundary"
    
    Write-Host "[IMAGE UPLOAD] imageUrl: $($uploadResponse.imageUrl)"
    
    # Verify the file is on disk
    $filename = $uploadResponse.imageUrl -replace ".*/"
    $diskPath = "backend\uploads\products\$filename"
    if (Test-Path $diskPath) {
        Write-Host "[FILE ON DISK] Confirmed: $diskPath"
    } else {
        Write-Host "[FILE ON DISK] WARNING: File not found at $diskPath"
    }
    
    # 5. DELETE image via API
    $deleteImgResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/products/$productId/image" -Method Delete -Headers $headers
    Write-Host "[IMAGE DELETE] imageUrl after delete: $($deleteImgResponse.imageUrl)"
    if (-not (Test-Path $diskPath)) {
        Write-Host "[FILE REMOVED] Confirmed file deleted from disk"
    } else {
        Write-Host "[FILE REMOVED] WARNING: File still exists on disk!"
    }
} finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== VALIDATION TESTS ==="

# 6. Test invalid content type rejection
$txtContent = [System.Text.Encoding]::UTF8.GetBytes("this is plain text")
$boundary2 = "----FormBoundary$(Get-Random)"
$enc = [System.Text.Encoding]::UTF8
$bodyParts2 = @()
$bodyParts2 += $enc.GetBytes("--$boundary2`r`nContent-Disposition: form-data; name=`"file`"; filename=`"bad.txt`"`r`nContent-Type: text/plain`r`n`r`n")
$bodyParts2 += $txtContent
$bodyParts2 += $enc.GetBytes("`r`n--$boundary2--`r`n")
$multipartBody2 = New-Object System.Byte[] ($bodyParts2 | Measure-Object -Property Length -Sum).Sum
$offset2 = 0
foreach ($part in $bodyParts2) { [System.Buffer]::BlockCopy($part, 0, $multipartBody2, $offset2, $part.Length); $offset2 += $part.Length }

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/admin/products/$productId/image" `
        -Method Post -Headers $headers -Body $multipartBody2 `
        -ContentType "multipart/form-data; boundary=$boundary2"
    Write-Host "[VALIDATION] FAIL: txt file should have been rejected!"
} catch {
    Write-Host "[VALIDATION] PASS: txt rejected with: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== SOFT DELETE VERIFICATION ==="

# 7. Delete product (soft delete) and verify it's archived
Invoke-RestMethod -Uri "http://localhost:8080/api/products/$productId" -Method Delete -Headers $headers
$archivedProduct = Invoke-RestMethod -Uri "http://localhost:8080/api/products/$productId" -Method Get
Write-Host "[SOFT DELETE] isArchived=$($archivedProduct.isArchived), imageUrl=$($archivedProduct.imageUrl)"

# Verify it's excluded from list
$allProducts = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Get
$stillInList = $allProducts | Where-Object { $_.id -eq $productId }
if ($stillInList) {
    Write-Host "[SOFT DELETE] FAIL: Archived product still appears in product list!"
} else {
    Write-Host "[SOFT DELETE] PASS: Archived product hidden from public product list"
}

Write-Host ""
Write-Host "=== ALL TESTS COMPLETE ==="
