const { test, expect } = require('@playwright/test');

test.describe('Task Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000');
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should create a new task', async ({ page }) => {
    // Click on create task button
    await page.click('text=New Task');
    
    // Fill in task form
    await page.fill('input[name="title"]', 'Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task');
    await page.fill('input[name="deadline"]', '2024-12-31');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert task was created
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should edit an existing task', async ({ page }) => {
    // Click on edit button for first task
    await page.click('.task-item:first-child .edit-button');
    
    // Update task title
    await page.fill('input[name="title"]', 'Updated Task Title');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Assert task was updated
    await expect(page.locator('text=Updated Task Title')).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // Get initial task count
    const initialCount = await page.locator('.task-item').count();
    
    // Click delete button for first task
    await page.click('.task-item:first-child .delete-button');
    
    // Confirm deletion
    await page.click('text=Confirm');
    
    // Assert task was deleted
    const finalCount = await page.locator('.task-item').count();
    expect(finalCount).toBe(initialCount - 1);
  });
}); 