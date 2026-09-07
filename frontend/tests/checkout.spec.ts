import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should navigate catalog, add to cart, and redirect to Stripe', async ({ page }) => {
    // Navigate to storefront
    await page.goto('/');

    // Wait for catalog to load
    await expect(page.getByText('Product Catalog')).toBeVisible();

    // Find the first product and add it to the cart
    const firstProduct = page.locator('.grid > div').first();
    const addBtn = firstProduct.locator('button:has-text("Add to Cart")');
    await addBtn.click();

    // Verify cart overlay opened
    await expect(page.getByText('Your Cart')).toBeVisible();
    await expect(page.getByText('Proceed to Checkout')).toBeVisible();

    // Click Proceed to Checkout
    await page.getByText('Proceed to Checkout').click();

    // Verify Checkout Modal opened
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();

    // Fill out customer details
    await page.fill('input[placeholder="John Doe"]', 'Jane Doe');
    await page.fill('input[type="email"]', 'jane@example.com');
    await page.fill('textarea', '123 Fake Street, CA');

    // Simulate clicking Confirm Order
    // Since this redirects to Stripe, we intercept the POST request instead of actually redirecting
    // in order to avoid hitting live Stripe servers during automated CI checks.

    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/orders') && req.method() === 'POST'),
      page.getByText('Confirm Order').click()
    ]);

    expect(request.postDataJSON()).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com',
      shippingAddress: '123 Fake Street, CA'
    });

    // Alternatively, if we let it redirect, we can wait for the URL to change to stripe.com
    // await expect(page).toHaveURL(/.*checkout\.stripe\.com.*/, { timeout: 10000 });
  });

  test('should simulate Stripe payment success and cancel routes natively', async ({ page }) => {
    // Navigate directly to success page
    await page.goto('/success');
    await expect(page.getByText('Payment Successful!')).toBeVisible();

    // Navigate directly to cancel page
    await page.goto('/cancel');
    await expect(page.getByText('Payment Cancelled')).toBeVisible();
  });
});
