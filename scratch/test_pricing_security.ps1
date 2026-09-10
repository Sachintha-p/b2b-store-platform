$baseUrl = "http://localhost:8080/api"

Write-Host "========================================================"
Write-Host "FINANCIAL INTEGRITY & PRICING VULNERABILITY TEST SCRIPT"
Write-Host "========================================================"

# 1. Login as Admin to get/set a test user & product
$adminLogin = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
$adminToken = $adminRes.token
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }

# Create a clean test product with retailPrice=100 and wholesalePrice=50
$prodBody = @{
    name = "Pricing Security Test Item"
    category = "SecurityTest"
    description = "Testing vulnerability fix"
    retailPrice = 100.00
    wholesalePrice = 50.00
    stockQuantity = 500
} | ConvertTo-Json

$prodRes = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Headers $adminHeaders -Body $prodBody -ContentType "application/json"
$productId = $prodRes.id
Write-Host "Created Test Product ID $productId (Retail: `$100.00, Wholesale: `$50.00)"

# Register a Retail User
$retailEmail = "retail_test_user_$(Get-Random)@example.com"
$regBody = @{ name = "Retail User"; email = $retailEmail; password = "password123" } | ConvertTo-Json
$retailRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType "application/json"
$retailToken = $retailRes.token
$retailUserId = $retailRes.user.id
$retailHeaders = @{ "Authorization" = "Bearer $retailToken" }

# Register a Wholesale User (Promote via Admin endpoint)
$wholesaleEmail = "wholesale_test_user_$(Get-Random)@example.com"
$wRegRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Wholesale User"; email = $wholesaleEmail; password = "password123" } | ConvertTo-Json) -ContentType "application/json"
$wholesaleToken = $wRegRes.token
$wholesaleUserId = $wRegRes.user.id
$wholesaleHeaders = @{ "Authorization" = "Bearer $wholesaleToken" }

# Promote wholesale user in DB via admin endpoint
$groupBody = @{ customerGroup = "WHOLESALE" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/admin/users/$wholesaleUserId/customer-group" -Method Put -Headers $adminHeaders -Body $groupBody -ContentType "application/json" | Out-Null
Write-Host "Set User $wholesaleUserId customerGroup to WHOLESALE."

# ----------------------------------------------------------------------
# TEST 4A: Retail / Guest User attempts to inject "isB2B": true
# ----------------------------------------------------------------------
Write-Host "`n--- TEST 4A: Retail User Exploit Attempt ('isB2B': true in payload) ---"

$exploitOrderBody = @"
{
    "name": "Attacker",
    "email": "$retailEmail",
    "shippingAddress": "123 Exploit Way",
    "items": [
        {
            "productId": $productId,
            "quantity": 1,
            "isB2B": true
        }
    ]
}
"@

$order4a = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Headers $retailHeaders -Body $exploitOrderBody -ContentType "application/json"
$chargedPrice4a = $order4a.items[0].priceAtPurchase
$totalAmount4a = $order4a.totalAmount

Write-Host "Attempted 'isB2B': true payload for 1 item."
Write-Host "Charged Price at Purchase: `$${chargedPrice4a} (Expected `$100.00 Retail)"
Write-Host "Order Total Amount: `$${totalAmount4a}"

if ($chargedPrice4a -eq 100.00) {
    Write-Host "PASS 4A: Retail user was charged RETAIL price ($100.00). Exploitation prevented!" -ForegroundColor Green
} else {
    Write-Host "FAIL 4A: Retail user was granted wholesale price ($chargedPrice4a)! Vulnerability exists!" -ForegroundColor Red
    exit 1
}

# ----------------------------------------------------------------------
# TEST 4B: Genuine Wholesale User Price & MOQ Check
# ----------------------------------------------------------------------
Write-Host "`n--- TEST 4B: Genuine Wholesale User MOQ & Wholesale Price Verification ---"

# Attempt 1 item (< 5 MOQ limit)
$wOrderSmallBody = @"
{
    "name": "Wholesale Buyer",
    "email": "$wholesaleEmail",
    "shippingAddress": "456 Wholesale Blvd",
    "items": [
        {
            "productId": $productId,
            "quantity": 1
        }
    ]
}
"@

try {
    $resSmall = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Headers $wholesaleHeaders -Body $wOrderSmallBody -ContentType "application/json"
    Write-Host "FAIL 4B: Wholesale order for 1 item should have been rejected by MOQ check!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "PASS 4B (MOQ Check): 1-item wholesale order rejected correctly: $_" -ForegroundColor Green
}

# Attempt 5 items (>= 5 MOQ limit)
$wOrderValidBody = @"
{
    "name": "Wholesale Buyer",
    "email": "$wholesaleEmail",
    "shippingAddress": "456 Wholesale Blvd",
    "items": [
        {
            "productId": $productId,
            "quantity": 5
        }
    ]
}
"@

$order4b = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Headers $wholesaleHeaders -Body $wOrderValidBody -ContentType "application/json"
$chargedPrice4b = $order4b.items[0].priceAtPurchase
$totalAmount4b = $order4b.totalAmount

Write-Host "Wholesale order for 5 items submitted."
Write-Host "Charged Price at Purchase: `$${chargedPrice4b} (Expected `$50.00 Wholesale)"
Write-Host "Order Total Amount: `$${totalAmount4b} (Expected `$250.00)"

if ($chargedPrice4b -eq 50.00 -and $totalAmount4b -eq 250.00) {
    Write-Host "PASS 4B: Genuine Wholesale user correctly charged WHOLESALE price ($50.00) with MOQ enforced!" -ForegroundColor Green
} else {
    Write-Host "FAIL 4B: Wholesale pricing or MOQ failed." -ForegroundColor Red
    exit 1
}

# Cleanup
Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Delete -Headers $adminHeaders | Out-Null
Write-Host "`nCleaned up test product $productId."
Write-Host "========================================================"
Write-Host "ALL PRICING VULNERABILITY TESTS PASSED SUCCESSFULLY!"
Write-Host "========================================================"
