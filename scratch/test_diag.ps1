$loginBody = @{
    email = "admin@example.com"
    password = "AdminSecurePassword123!"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    Write-Host "Admin Token acquired."

    $headers = @{
        Authorization = "Bearer $token"
    }

    Write-Host "`n--- Product 10 BEFORE set-primary ---"
    $pBefore = Invoke-RestMethod -Uri "http://localhost:8080/api/products/10" -Headers $headers -Method Get
    $pBefore | ConvertTo-Json -Depth 5

    Write-Host "`n--- Product 10 Gallery Images BEFORE set-primary ---"
    $imgsBefore = Invoke-RestMethod -Uri "http://localhost:8080/api/products/10/images" -Headers $headers -Method Get
    $imgsBefore | ConvertTo-Json -Depth 5

    if ($imgsBefore.Count -gt 0) {
        $targetImgId = $imgsBefore[0].id
        Write-Host "`n---> Calling PUT /api/admin/products/10/images/$targetImgId/set-primary ..."
        
        $setPrimaryRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/products/10/images/$targetImgId/set-primary" -Headers $headers -Method Put
        
        Write-Host "`n--- Product 10 AFTER set-primary ---"
        $pAfter = Invoke-RestMethod -Uri "http://localhost:8080/api/products/10" -Headers $headers -Method Get
        $pAfter | ConvertTo-Json -Depth 5

        Write-Host "`n--- Product 10 Gallery Images AFTER set-primary ---"
        $imgsAfter = Invoke-RestMethod -Uri "http://localhost:8080/api/products/10/images" -Headers $headers -Method Get
        $imgsAfter | ConvertTo-Json -Depth 5
    } else {
        Write-Host "Product 10 has 0 gallery images! Cannot test swap unless a gallery image exists."
    }
} catch {
    Write-Host "Exception during test:" $_.Exception.ToString()
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Error Body: " $reader.ReadToEnd()
    }
}
