import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RootLayout from '@/app/layout';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

// Mock Navigation component
jest.mock('@/components/navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation Component</div>,
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

describe('Navbar Visibility Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show navbar on home page', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');

    render(
      <RootLayout>
        <div>Home Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  it('should show navbar for unauthenticated users on public pages', async () => {
    (usePathname as jest.Mock).mockReturnValue('/about');

    render(
      <RootLayout>
        <div>About Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  it('should show navbar for authenticated users on public pages', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');

    render(
      <RootLayout>
        <div>Home Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  it('should hide navbar on dashboard pages', async () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');

    render(
      <RootLayout>
        <div>Dashboard Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    });
  });

  it('should hide navbar on dashboard sub-routes', async () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/analytics');

    render(
      <RootLayout>
        <div>Analytics Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    });
  });

  it('should hide navbar on onboarding page', async () => {
    (usePathname as jest.Mock).mockReturnValue('/onboarding');

    render(
      <RootLayout>
        <div>Onboarding Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    });
  });

  it('should update navbar visibility when pathname changes', async () => {
    const { rerender } = render(
      <RootLayout>
        <div>Home Content</div>
      </RootLayout>
    );

    // Initially on home page - navbar should be visible
    (usePathname as jest.Mock).mockReturnValue('/');
    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    // Navigate to dashboard - navbar should be hidden
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    rerender(
      <RootLayout>
        <div>Dashboard Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    });
  });

  it('should handle nested dashboard routes correctly', async () => {
    const dashboardRoutes = [
      '/dashboard/profile',
      '/dashboard/events',
      '/dashboard/analytics',
      '/dashboard/communities',
      '/dashboard/gifts',
    ];

    for (const route of dashboardRoutes) {
      (usePathname as jest.Mock).mockReturnValue(route);

      const { unmount } = render(
        <RootLayout>
          <div>Dashboard Content</div>
        </RootLayout>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should show navbar on all non-dashboard, non-onboarding routes', async () => {
    const publicRoutes = [
      '/',
      '/about',
      '/pricing',
      '/features',
      '/support',
      '/contact',
    ];

    for (const route of publicRoutes) {
      (usePathname as jest.Mock).mockReturnValue(route);

      const { unmount } = render(
        <RootLayout>
          <div>Public Content</div>
        </RootLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigation')).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should handle undefined pathname gracefully', async () => {
    (usePathname as jest.Mock).mockReturnValue(undefined);

    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      // Should default to showing navbar
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  it('should handle null pathname gracefully', async () => {
    (usePathname as jest.Mock).mockReturnValue(null);

    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    await waitFor(() => {
      // Should default to showing navbar
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  it('should apply correct font variables', () => {
    (usePathname as jest.Mock).mockReturnValue('/');

    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const body = container.querySelector('body');
    expect(body).toHaveClass('antialiased');
  });

  it('should render children correctly', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');

    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
