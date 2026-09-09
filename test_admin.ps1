$body = @{
    email = "admin@example.com"
    password = "AdminSecurePassword123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $loginResponse.token
$adminId = $loginResponse.user.id
$headers = @{ Authorization = "Bearer $token" }

Write-Host "Admin logged in successfully. Token: $token. Admin ID: $adminId"

# 1. Test Stats
$stats = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/stats" -Headers $headers
Write-Host "Stats:"
$stats | ConvertTo-Json

# 2. Test fetching paginated users
$users = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users?page=0&size=5" -Headers $headers
Write-Host "Users retrieved:"
$users.content.Length

# 3. Try to disable myself (expect 400 Bad Request)
try {
    $statusBody = @{ isActive = $false } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users/$adminId/status" -Method Put -Headers $headers -Body $statusBody -ContentType "application/json"
    Write-Host "FAIL: Was able to disable myself!"
} catch {
    Write-Host "Self-disable blocked with: $($_.Exception.Message)"
}

# 4. Try to demote myself (expect 400 Bad Request)
try {
    $roleBody = @{ role = "USER" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users/$adminId/role" -Method Put -Headers $headers -Body $roleBody -ContentType "application/json"
    Write-Host "FAIL: Was able to demote myself!"
} catch {
    Write-Host "Self-demote blocked with: $($_.Exception.Message)"
}
