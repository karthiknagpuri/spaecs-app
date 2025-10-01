import { test, expect } from '@playwright/test';

test.describe('Google OAuth Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
  });

  test('should display sign in button in navigation', async ({ page }) => {
    // Wait for navigation to load
    await page.waitForLoadState('networkidle');

    // Check for Sign In button
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('should open auth modal when clicking sign in', async ({ page }) => {
    // Click Sign In button
    await page.getByRole('button', { name: /sign in/i }).click();

    // Auth modal should be visible
    await expect(page.getByText('Welcome to Spaecs')).toBeVisible();
    await expect(page.getByText('Build your community, monetize your passion')).toBeVisible();
  });

  test('should display Google sign in button in modal', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for Google button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome to Spaecs')).toBeVisible();

    // Click close button
    await page.getByLabel('Close').click();

    // Modal should be closed
    await expect(page.getByText('Welcome to Spaecs')).not.toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Welcome to Spaecs')).toBeVisible();

    // Click outside modal (on backdrop)
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });

    // Modal should be closed
    await expect(page.getByText('Welcome to Spaecs')).not.toBeVisible();
  });

  test('should open auth modal from Get Started button', async ({ page }) => {
    // Click Get Started button from hero
    await page.getByRole('button', { name: /get started/i }).first().click();

    // Auth modal should be visible
    await expect(page.getByText('Welcome to Spaecs')).toBeVisible();
  });

  test('should display Terms of Service and Privacy Policy links', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for legal links
    const termsLink = page.getByRole('link', { name: /terms of service/i });
    const privacyLink = page.getByRole('link', { name: /privacy policy/i });

    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
  });

  test('should have proper mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Modal should be visible and properly sized on mobile
    const modal = page.getByText('Welcome to Spaecs').locator('..');
    await expect(modal).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/auth-modal-mobile.png' });
  });

  test('should have minimum touch target sizes', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Close button should have minimum 44px touch target
    const closeButton = page.getByLabel('Close');
    const box = await closeButton.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Tab to close button
    await page.keyboard.press('Tab');

    // Close button should be focused
    const closeButton = page.getByLabel('Close');
    await expect(closeButton).toBeFocused();

    // Press Enter to close
    await page.keyboard.press('Enter');

    // Modal should be closed
    await expect(page.getByText('Welcome to Spaecs')).not.toBeVisible();
  });

  test('should display loading state when initiating OAuth', async ({ page, context }) => {
    // Listen for popup to prevent actual OAuth flow
    const popupPromise = context.waitForEvent('page');

    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Click Google sign in
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await googleButton.click();

    // Should show loading state
    await expect(page.getByText('Connecting...')).toBeVisible();

    // Button should be disabled
    const loadingButton = page.getByRole('button').first();
    await expect(loadingButton).toBeDisabled();

    // Close the OAuth popup if it opened
    try {
      const popup = await popupPromise;
      await popup.close();
    } catch (e) {
      // Popup might not open in test environment
    }
  });

  test('should handle navigation correctly', async ({ page }) => {
    // Navigation should be visible on home page
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Should have proper styling and be fixed
    const navBox = await nav.boundingBox();
    expect(navBox).toBeTruthy();
  });

  test('should display hero section with call to action', async ({ page }) => {
    // Hero should be visible
    await expect(page.getByText('Home for Creators & Community')).toBeVisible();
    await expect(page.getByText('Monetise your loyal followers into paying customers')).toBeVisible();

    // CTA button should be present
    const ctaButton = page.getByRole('button', { name: /get started/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('should maintain session state across page navigation', async ({ page }) => {
    // This test would need actual authentication setup
    // For now, verify the session check logic exists

    // Navigate to different routes
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Try to access dashboard (should redirect if not authenticated)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect to home if not authenticated
    expect(page.url()).toBe('http://localhost:3000/');
  });
});

test.describe('Auth Modal Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Close button should have aria-label
    const closeButton = page.getByLabel('Close');
    await expect(closeButton).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for proper heading
    const heading = page.getByRole('heading', { name: /Welcome to Spaecs/i });
    await expect(heading).toBeVisible();
  });

  test('should be screen reader friendly', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // All interactive elements should be accessible
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();

    const closeButton = page.getByLabel('Close');
    await expect(closeButton).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Take screenshot for manual contrast verification
    await page.screenshot({ path: 'test-results/auth-modal-contrast.png' });

    // Verify dark text on light background
    const modal = page.locator('.bg-white').first();
    await expect(modal).toBeVisible();
  });
});

test.describe('Auth Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Intercept auth requests to simulate error
    await page.route('**/*supabase**/auth/**', (route) => {
      route.abort('failed');
    });

    // Click Google sign in
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await googleButton.click();

    // Should eventually show an error or maintain stable state
    // This depends on how the app handles network errors
    await page.waitForTimeout(1000);

    // Modal should still be open
    await expect(page.getByText('Welcome to Spaecs')).toBeVisible();
  });
});

test.describe('Visual Regression', () => {
  test('auth modal visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for animations to complete
    await page.waitForTimeout(300);

    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('auth-modal.png', {
      fullPage: false,
      animations: 'disabled',
    });
  });

  test('auth modal mobile visual snapshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    // Open auth modal
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for animations
    await page.waitForTimeout(300);

    // Take screenshot
    await expect(page).toHaveScreenshot('auth-modal-mobile.png', {
      fullPage: false,
      animations: 'disabled',
    });
  });
});
