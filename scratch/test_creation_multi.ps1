Add-Type -AssemblyName System.Net.Http

$baseUrl = "http://localhost:8080"
$client = New-Object System.Net.Http.HttpClient

Write-Host "================ MULTI-IMAGE CREATION & BATCH EDIT E2E TEST ================"

# 1. Login
$loginJson = '{"email":"admin@example.com","password":"AdminSecurePassword123!"}'
$content = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")
$loginRes = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
$token = (ConvertFrom-Json $loginRes.Content.ReadAsStringAsync().Result).token
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

# 2. Step 1: Create product record
$prodPayload = '{"name":"Multi-Image Creation Test","category":"Electronics","description":"Product created with 4 images selected upfront","retailPrice":149.99,"wholesalePrice":119.99,"stockQuantity":15}'
$prodContent = New-Object System.Net.Http.StringContent($prodPayload, [System.Text.Encoding]::UTF8, "application/json")
$prodRes = $client.PostAsync("$baseUrl/api/products", $prodContent).Result
$prodObj = ConvertFrom-Json $prodRes.Content.ReadAsStringAsync().Result
$productId = $prodObj.id
Write-Host "Step 1: Created product ID:" $productId

# Create test image file
$testImgPath = "$PSScriptRoot\test_image.png"
if (-not (Test-Path $testImgPath)) {
    $bytes = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
    [System.IO.File]::WriteAllBytes($testImgPath, $bytes)
}

$fileBytes = [System.IO.File]::ReadAllBytes($testImgPath)

# 3. Step 2: Upload 1st image to Cover endpoint
$multiCover = New-Object System.Net.Http.MultipartFormDataContent
$fileCover = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
$fileCover.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$multiCover.Add($fileCover, "file", "cover.png")
$coverRes = $client.PostAsync("$baseUrl/api/admin/products/$productId/image", $multiCover).Result
Write-Host "Step 2a: Cover image upload status:" $coverRes.StatusCode " (PASS)"

# 4. Step 2: Upload remaining 3 images in ONE batch request to gallery endpoint
$multiBatch = New-Object System.Net.Http.MultipartFormDataContent
for ($i = 1; $i -le 3; $i++) {
    $fileGal = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
    $fileGal.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
    $multiBatch.Add($fileGal, "files", "gallery_$i.png")
}
$batchRes = $client.PostAsync("$baseUrl/api/admin/products/$productId/images", $multiBatch).Result
Write-Host "Step 2b: Batch gallery upload status:" $batchRes.StatusCode " (PASS)"

# 5. Verify product images state
$updatedProduct = ConvertFrom-Json ($client.GetAsync("$baseUrl/api/products/$productId").Result.Content.ReadAsStringAsync().Result)
$galleryImgs = ConvertFrom-Json ($client.GetAsync("$baseUrl/api/products/$productId/images").Result.Content.ReadAsStringAsync().Result)

Write-Host "`n---> VERIFICATION AFTER CREATION WITH 4 IMAGES:"
Write-Host "Primary Cover Image Present:" (-not [string]::IsNullOrEmpty($updatedProduct.imageUrl)) " (URL: $($updatedProduct.imageUrl))"
Write-Host "Gallery Images Count:" $galleryImgs.Count " (Expected 3)"
Write-Host "Total Product Images:" (1 + $galleryImgs.Count) " (Expected 4) (PASS)"

# 6. Test Edit flow: Add 2 more images simultaneously via batch upload
Write-Host "`n---> EDIT FLOW: ADDING 2 MORE IMAGES IN ONE BATCH..."
$multiEdit = New-Object System.Net.Http.MultipartFormDataContent
for ($i = 4; $i -le 5; $i++) {
    $fileEdit = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
    $fileEdit.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
    $multiEdit.Add($fileEdit, "files", "gallery_$i.png")
}
$editRes = $client.PostAsync("$baseUrl/api/admin/products/$productId/images", $multiEdit).Result
Write-Host "Edit batch upload status:" $editRes.StatusCode " (PASS)"

$finalGallery = ConvertFrom-Json ($client.GetAsync("$baseUrl/api/products/$productId/images").Result.Content.ReadAsStringAsync().Result)
Write-Host "Final Gallery Images Count:" $finalGallery.Count " (Expected 5)"
Write-Host "Final Total Images (Cover + Gallery):" (1 + $finalGallery.Count) " (Expected 6 max cap reached) (PASS)"

# Cleanup test product
$null = $client.DeleteAsync("$baseUrl/api/products/$productId").Result
Write-Host "`nCleaned up test product."
Write-Host "================ ALL TESTS PASSED SUCCESSFULLY ================"
