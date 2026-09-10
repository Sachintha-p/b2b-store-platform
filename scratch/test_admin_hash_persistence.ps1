$baseUrl = "http://localhost:8080/api"

Write-Host "=========================================================="
Write-Host "PART 1: ADMIN PASSWORD PERSISTENCE ACROSS RESTART TEST"
Write-Host "=========================================================="

# 1. Login with current password (either admin123 or current)
$adminToken = $null
$currentPass = $null

foreach ($pwd in @("MyCustomPass123!", "admin123", "adminpassword")) {
    try {
        $body = @{ email = "admin@example.com"; password = $pwd } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
        $adminToken = $res.token
        $currentPass = $pwd
        Write-Host "Current active admin password: '$pwd'"
        break
    } catch {}
}

if (-not $adminToken) {
    Write-Host "Could not login as admin. Exit."
    exit 1
}

# 2. Update Admin Password via /api/users/me/password to 'MyCustomPass123!'
$newPassword = "MyCustomPass123!"
if ($currentPass -ne $newPassword) {
    Write-Host "Changing admin password to '$newPassword' via /api/users/me/password..."
    $headers = @{ "Authorization" = "Bearer $adminToken" }
    $changeBody = @{
        currentPassword = $currentPass
        newPassword = $newPassword
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$baseUrl/users/me/password" -Method Put -Headers $headers -Body $changeBody -ContentType "application/json" | Out-Null
    Write-Host "Password updated to '$newPassword' successfully."
}

# Confirm login with new password
$loginCheck = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = "admin@example.com"; password = $newPassword } | ConvertTo-Json) -ContentType "application/json"
$meCheck = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers @{ "Authorization" = "Bearer $($loginCheck.token)" }
Write-Host "Pre-restart verification: Admin login successful with '$newPassword'. User ID: $($meCheck.id)"

# 3. Kill and restart backend
Write-Host "`nStopping Spring Boot backend..."
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Restarting Spring Boot backend..."
$mvnProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-Command `".\mvnw spring-boot:run`"" -WorkingDirectory "c:\Users\Sachintha Praneeth\Documents\E_Commerce\backend" -PassThru -NoNewWindow
Write-Host "Backend process launched. Waiting for server on port 8080..."

# Wait for 8080 to come back online
$online = $false
for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $testReq = Invoke-WebRequest -Uri "$baseUrl/products" -Method Get -ErrorAction Stop
        if ($testReq.StatusCode -eq 200) {
            $online = $true
            break
        }
    } catch {}
}

if (-not $online) {
    Write-Host "Backend failed to restart within 30 seconds."
    exit 1
}

Write-Host "Backend is ONLINE!"

# 4. Verify post-restart password behavior
Write-Host "`nPost-restart verification:"
try {
    $postLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = "admin@example.com"; password = $newPassword } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "PASS: Admin CAN still log in with updated password '$newPassword' after restart!" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Admin password was overwritten during restart! Cannot log in with '$newPassword'." -ForegroundColor Red
    exit 1
}

# Verify old seed password admin123 is REJECTED (confirming it was NOT reset back)
try {
    $oldCheck = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json) -ContentType "application/json"
    if ($newPassword -ne "admin123") {
        Write-Host "FAIL: Old seed password 'admin123' was accepted! The password WAS reset!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "PASS: Old seed password 'admin123' correctly REJECTED after restart (401 Unauthorized)." -ForegroundColor Green
}

Write-Host "=========================================================="
Write-Host "PART 1 VERIFICATION PASSED PERFECTLY: PASSWORD UNCHANGED!"
Write-Host "=========================================================="
