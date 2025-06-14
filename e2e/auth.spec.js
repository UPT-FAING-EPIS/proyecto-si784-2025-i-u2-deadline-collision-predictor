const { test, expect } = require('@playwright/test');

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Click on login button
    await page.click('text=Login');
    
    // Fill in login form
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert successful login
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Click on login button
    await page.click('text=Login');
    
    // Fill in login form with invalid credentials
    await page.fill('input[name="username"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert error message
    await expect(page.locator('.error-message')).toBeVisible();
  });
}); 