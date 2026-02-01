import { test, expect } from '@playwright/test';

test.describe('Agent Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the agent dashboard
    await page.goto('/agents');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Agent Dashboard")');
  });

  test('should display agent dashboard header', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'Agent Dashboard' })).toBeVisible();
    await expect(page.getByText('Monitor agents, submit tasks, and track progress')).toBeVisible();
  });

  test('should display agent status cards', async ({ page }) => {
    // Check that agent cards are displayed
    await expect(page.getByText('Ares PM')).toBeVisible();
    await expect(page.getByText('Engineer Agent')).toBeVisible();
    await expect(page.getByText('Tester Agent')).toBeVisible();
    
    // Check status badges
    await expect(page.getByText('Idle')).toHaveCount(2);
    await expect(page.getByText('Offline')).toHaveCount(1);
  });

  test('should display engine status', async ({ page }) => {
    // Check engine status badge
    await expect(page.getByText(/Engine (Running|Stopped)/)).toBeVisible();
    
    // Check engine control buttons
    await expect(page.getByRole('button', { name: /Start|Pause|Stop/ })).toBeVisible();
  });

  test('should display task queue', async ({ page }) => {
    // Check task queue section
    await expect(page.getByRole('heading', { name: 'Task Queue & History' })).toBeVisible();
    
    // Check queue stats badges
    await expect(page.getByText(/\d+ Active/)).toBeVisible();
    await expect(page.getByText(/\d+ Done/)).toBeVisible();
  });

  test('should display activity feed', async ({ page }) => {
    // Check activity feed section
    await expect(page.getByRole('heading', { name: 'Activity Feed' })).toBeVisible();
  });

  test('should display engine stats', async ({ page }) => {
    // Check engine stats section
    await expect(page.getByRole('heading', { name: 'Engine Stats' })).toBeVisible();
    
    // Check stat labels
    await expect(page.getByText('Queue Depth')).toBeVisible();
    await expect(page.getByText('Active Tasks')).toBeVisible();
    await expect(page.getByText('Idle Agents')).toBeVisible();
    await expect(page.getByText('Busy Agents')).toBeVisible();
  });

  test('should open task submission form', async ({ page }) => {
    // Click on submit new task card
    await page.getByText('Submit New Task').click();
    
    // Check that the form is displayed
    await expect(page.getByRole('heading', { name: 'Submit Task to Ares' })).toBeVisible();
    await expect(page.getByLabel('Task Title')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    
    // Check priority buttons
    await expect(page.getByRole('button', { name: 'Critical' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'High' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Medium' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Low' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Minimal' })).toBeVisible();
  });

  test('should navigate to task detail page', async ({ page }) => {
    // This test would require a task to exist
    // For now, just verify navigation structure
    await page.goto('/agents/tasks/test-task-id');
    
    // Check for back button
    await expect(page.getByRole('button', { name: 'Back to Dashboard' })).toBeVisible();
  });

  test('should display agent capabilities', async ({ page }) => {
    // Check that agent capabilities are displayed
    await expect(page.getByText('planning')).toBeVisible();
    await expect(page.getByText('coordination')).toBeVisible();
    await expect(page.getByText('coding')).toBeVisible();
  });

  test('should display agent statistics', async ({ page }) => {
    // Check that agent stats are displayed
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Avg Time')).toBeVisible();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
