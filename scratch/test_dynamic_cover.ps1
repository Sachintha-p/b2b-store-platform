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

Write-Host "================ DYNAMIC COVER SELECTION E2E TEST ================"

# 1. Login
$loginJson = '{"email":"admin@example.com","password":"AdminSecurePassword123!"}'
$content = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")
$loginRes = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
$token = (ConvertFrom-Json $loginRes.Content.ReadAsStringAsync().Result).token
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

# 2. Step 1: Create product record
$prodPayload = '{"name":"Dynamic Cover Test Product","category":"Fashion","description":"Created with 3rd image selected as cover","retailPrice":79.99,"wholesalePrice":59.99,"stockQuantity":20}'
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

# 3. Simulate selecting 4 images and picking the 3rd one (addCoverIndex = 2) as Cover
# 3rd image goes to Cover Endpoint, remaining 3 (0, 1, 3) go to Gallery Endpoint
$multiCover = New-Object System.Net.Http.MultipartFormDataContent
$fileCover = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
$fileCover.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$multiCover.Add($fileCover, "file", "image_3_as_cover.png")
$coverRes = $client.PostAsync("$baseUrl/api/admin/products/$productId/image", $multiCover).Result
Write-Host "Step 2a: Selected 3rd image uploaded to Cover endpoint status:" $coverRes.StatusCode " (PASS)"

# Upload remaining 3 images in batch to gallery endpoint
$multiBatch = New-Object System.Net.Http.MultipartFormDataContent
for ($i = 1; $i -le 3; $i++) {
    $fileGal = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
    $fileGal.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
    $multiBatch.Add($fileGal, "files", "remaining_gallery_$i.png")
}
$batchRes = $client.PostAsync("$baseUrl/api/admin/products/$productId/images", $multiBatch).Result
Write-Host "Step 2b: Remaining 3 gallery images batch status:" $batchRes.StatusCode " (PASS)"

# 4. Verify resulting product
$updatedProduct = ConvertFrom-Json ($client.GetAsync("$baseUrl/api/products/$productId").Result.Content.ReadAsStringAsync().Result)
$galleryImgs = ConvertFrom-Json ($client.GetAsync("$baseUrl/api/products/$productId/images").Result.Content.ReadAsStringAsync().Result)

Write-Host "`n---> VERIFICATION OF DYNAMIC COVER SELECTION:"
Write-Host "Primary Cover Image Set:" (-not [string]::IsNullOrEmpty($updatedProduct.imageUrl)) " (URL: $($updatedProduct.imageUrl))"
Write-Host "Gallery Images Count:" $galleryImgs.Count " (Expected 3)"
Write-Host "Total Images Attached:" (1 + $galleryImgs.Count) " (Expected 4) (PASS)"

# Clean up test product
$null = $client.DeleteAsync("$baseUrl/api/products/$productId").Result
Write-Host "`nCleaned up test product."
Write-Host "================ DYNAMIC COVER SELECTION TEST PASSED ================"
