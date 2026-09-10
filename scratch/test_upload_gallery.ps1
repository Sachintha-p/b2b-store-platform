$loginBody = @{
    email = "admin@example.com"
    password = "AdminSecurePassword123!"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    Write-Host "Admin Token acquired:" ($token.Substring(0, 20) + "...")

    $headers = @{
        Authorization = "Bearer $token"
    }

    # Create dummy image file for upload test
    $testImgPath = "$PSScriptRoot\test_image.png"
    if (-not (Test-Path $testImgPath)) {
        $bytes = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
        [System.IO.File]::WriteAllBytes($testImgPath, $bytes)
    }

    $form = @{
        files = Get-Item -Path $testImgPath
    }

    Write-Host "`n---> Uploading gallery image via Invoke-RestMethod..."
    $uploadRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/products/10/images" -Headers $headers -Method Post -Form $form
    Write-Host "Uploaded image response:"
    $uploadRes | ConvertTo-Json -Depth 5

} catch {
    Write-Host "Exception during test:" $_.Exception.ToString()
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Error Body: " $reader.ReadToEnd()
    }
}
