$body = @{ email = "admin@example.com"; password = "AdminSecurePassword123!" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

# 1. Create a product
$productBody = @{
    name = "Test Product to Delete"
    description = "desc"
    retailPrice = 10.0
    wholesalePrice = 8.0
    stockQuantity = 100
    category = "Test"
} | ConvertTo-Json
$product = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Post -Body $productBody -ContentType "application/json" -Headers $headers
$productId = $product.id
Write-Host "Created product: $productId"

# 2. Create an order with this product
$orderBody = @{
    customerName = "John Doe"
    customerEmail = "john@example.com"
    shippingAddress = "123 Main St"
    totalAmount = 10.0
    items = @(
        @{
            product = @{ id = $productId }
            quantity = 1
            priceAtPurchase = 10.0
        }
    )
} | ConvertTo-Json
$order = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method Post -Body $orderBody -ContentType "application/json"
Write-Host "Created order: $($order.id)"

# 3. Try to delete the product
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/products/$productId" -Method Delete -Headers $headers
    Write-Host "SUCCESS (Product was hard-deleted!)"
} catch {
    Write-Host "FAILED TO DELETE PRODUCT: $($_.Exception.Message)"
}
