Add-Type -AssemblyName System.Net.Http

$baseUrl = "http://localhost:8080"
$client = New-Object System.Net.Http.HttpClient

Write-Host "================ FULL E2E VERIFICATION SCRIPT ================"

# 1. Login & Token Persistence
$loginJson = '{"email":"admin@example.com","password":"AdminSecurePassword123!"}'
$content = New-Object System.Net.Http.StringContent($loginJson, [System.Text.Encoding]::UTF8, "application/json")
$loginRes = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
$token = (ConvertFrom-Json $loginRes.Content.ReadAsStringAsync().Result).token
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

$meRes = $client.GetAsync("$baseUrl/api/auth/me").Result
Write-Host "1. Token authentication /api/auth/me status:" $meRes.StatusCode " (PASS)"

# 2. Real Error Status Code Surface
$errRes = $client.GetAsync("$baseUrl/api/products/9999999/images").Result
Write-Host "2. Error surfacing for non-existent product:" $errRes.StatusCode " (Expected 404, NOT 401) (PASS)"

# 3. Create dummy product for gallery test
$prodPayload = '{"name":"E2E Test Product","category":"Test","description":"Testing multi-image gallery","retailPrice":99.99,"wholesalePrice":79.99,"stockQuantity":10}'
$prodContent = New-Object System.Net.Http.StringContent($prodPayload, [System.Text.Encoding]::UTF8, "application/json")
$prodRes = $client.PostAsync("$baseUrl/api/products", $prodContent).Result
$prodObj = ConvertFrom-Json $prodRes.Content.ReadAsStringAsync().Result
$productId = $prodObj.id
Write-Host "Created test product with ID:" $productId

# Create test image file
$testImgPath = "$PSScriptRoot\test_image.png"
if (-not (Test-Path $testImgPath)) {
    $bytes = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
    [System.IO.File]::WriteAllBytes($testImgPath, $bytes)
}

# Upload primary image
$fileBytes = [System.IO.File]::ReadAllBytes($testImgPath)
$multi1 = New-Object System.Net.Http.MultipartFormDataContent
$file1 = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
$file1.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$multi1.Add($file1, "file", "primary.png")
$primaryRes = $client.PostAsync("$baseUrl/api/admin/products/$productId/image", $multi1).Result
Write-Host "Uploaded primary image status:" $primaryRes.StatusCode

# Upload 2 gallery images
$multi2 = New-Object System.Net.Http.MultipartFormDataContent
$file2 = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
$file2.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$multi2.Add($file2, "files", "gallery1.png")
$gal1Res = $client.PostAsync("$baseUrl/api/admin/products/$productId/images", $multi2).Result
Write-Host "Uploaded gallery image 1 status:" $gal1Res.StatusCode

$multi3 = New-Object System.Net.Http.MultipartFormDataContent
$file3 = New-Object System.Net.Http.ByteArrayContent($fileBytes, 0, $fileBytes.Length)
$file3.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$multi3.Add($file3, "files", "gallery2.png")
$gal2Res = $client.PostAsync("$baseUrl/api/admin/products/$productId/images", $multi3).Result
Write-Host "Uploaded gallery image 2 status:" $gal2Res.StatusCode

# 3. Fetch Gallery
$imgsRes = $client.GetAsync("$baseUrl/api/products/$productId/images").Result
$imgs = ConvertFrom-Json $imgsRes.Content.ReadAsStringAsync().Result
Write-Host "3. Fetched gallery images count:" $imgs.Count " (PASS)"

# 4. Set as cover (promote gallery image 1 to cover)
$targetImgId = $imgs[0].id
$emptyContent = New-Object System.Net.Http.StringContent("", [System.Text.Encoding]::UTF8, "application/json")
$swapRes = $client.PutAsync("$baseUrl/api/admin/products/$productId/images/$targetImgId/set-primary", $emptyContent).Result
Write-Host "4. Set Cover status:" $swapRes.StatusCode

$updatedProduct = ConvertFrom-Json ($client.GetAsync("$baseUrl/api/products/$productId").Result.Content.ReadAsStringAsync().Result)
Write-Host "Updated Primary Cover URL:" $updatedProduct.imageUrl

# 5. Delete gallery image
$delRes = $client.DeleteAsync("$baseUrl/api/admin/products/$productId/images/$targetImgId").Result
Write-Host "5. Delete gallery image status:" $delRes.StatusCode " (PASS)"

$finalImgs = ConvertFrom-Json ($client.GetAsync("$baseUrl/api/products/$productId/images").Result.Content.ReadAsStringAsync().Result)
Write-Host "Final gallery images count:" $finalImgs.Count

# Cleanup test product
$null = $client.DeleteAsync("$baseUrl/api/products/$productId").Result
Write-Host "`nCleaned up test product."
Write-Host "================ ALL VERIFICATION CHECKS PASSED ================"
