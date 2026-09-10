$baseUrl = "http://localhost:8080/api"

# 1. Create a simple test order
$orderBody = @{
    name = "Test Buyer"
    email = "testbuyer@example.com"
    shippingAddress = "123 Main St"
    items = @(
        @{ productId = 1; quantity = 1 }
    )
} | ConvertTo-Json

try {
    Write-Host "Step 1: Creating Order via POST /api/orders..."
    $orderRes = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Body $orderBody -ContentType "application/json"
    $orderId = $orderRes.id
    Write-Host "Order Created Successfully! Order ID: $orderId, Total Amount: $($orderRes.totalAmount)"
} catch {
    Write-Host "Order Creation Failed: $_"
    exit 1
}

# 2. Try creating Stripe Checkout Session
try {
    Write-Host "`nStep 2: Creating Checkout Session via POST /api/payments/create-checkout-session..."
    $payBody = @{ orderId = $orderId } | ConvertTo-Json
    $payRes = Invoke-RestMethod -Uri "$baseUrl/payments/create-checkout-session" -Method Post -Body $payBody -ContentType "application/json"
    Write-Host "Stripe Checkout Session URL: $($payRes.url)"
} catch {
    Write-Host "Stripe Checkout Session Failed! Error:`n$_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        Write-Host "Response Body:`n$respBody"
    }
}
