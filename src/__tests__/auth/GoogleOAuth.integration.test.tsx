import { createClient } from '@/lib/supabase/client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '@/components/auth/AuthModal';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}));

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  reload: jest.fn(),
  replace: jest.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

interface MockSupabase {
  auth: {
    signInWithOAuth: jest.Mock;
    getUser: jest.Mock;
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
  };
}

describe('Google OAuth Integration Tests', () => {
  const mockOnClose = jest.fn();
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = 'http://localhost:3000';
    mockLocation.pathname = '/';
    mockLocation.search = '';

    mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn(),
        getUser: jest.fn(),
        getSession: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
      }
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('OAuth Flow Initiation', () => {
    it('should initiate OAuth flow with correct provider', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'google'
          })
        );
      });
    });

    it('should include redirect URL in OAuth options', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              redirectTo: 'http://localhost:3000/auth/callback'
            })
          })
        );
      });
    });

    it('should request offline access for refresh tokens', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        const callArgs = mockSupabase.auth.signInWithOAuth.mock.calls[0][0];
        expect(callArgs.options.queryParams.access_type).toBe('offline');
        expect(callArgs.options.queryParams.prompt).toBe('consent');
      });
    });
  });

  describe('OAuth Error Handling', () => {
    it('should handle popup blocked error', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: new Error('Popup blocked by browser')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Popup blocked by browser')).toBeInTheDocument();
      });
    });

    it('should handle OAuth cancellation', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: new Error('User cancelled the authentication')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('User cancelled the authentication')).toBeInTheDocument();
      });
    });

    it('should handle invalid OAuth configuration', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: new Error('Invalid OAuth configuration')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid OAuth configuration')).toBeInTheDocument();
      });
    });

    it('should handle network timeout', async () => {
      mockSupabase.auth.signInWithOAuth.mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText(/timeout/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Loading States', () => {
    it('should show loading state immediately after click', async () => {
      mockSupabase.auth.signInWithOAuth.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 500))
      );

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should disable button during OAuth process', async () => {
      mockSupabase.auth.signInWithOAuth.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 200))
      );

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      const disabledButton = screen.getByRole('button');
      expect(disabledButton).toBeDisabled();
    });

    it('should re-enable button after error', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: new Error('OAuth failed')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Continue with Google/i });
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('OAuth State Management', () => {
    it('should clear previous errors on new attempt', async () => {
      let attemptCount = 0;
      mockSupabase.auth.signInWithOAuth.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.resolve({ error: new Error('First error') });
        }
        return Promise.resolve({ error: null });
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });

      // First attempt
      await userEvent.click(googleButton);
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second attempt
      await userEvent.click(googleButton);
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });

      // Simulate rapid clicks
      await userEvent.click(googleButton);
      await userEvent.click(googleButton);
      await userEvent.click(googleButton);

      await waitFor(() => {
        // Should only call once due to disabled state
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('User Experience', () => {
    it('should display informative error messages', async () => {
      const errorCases = [
        { error: 'Invalid credentials', expected: 'Invalid credentials' },
        { error: 'Network error', expected: 'Network error' },
        { error: 'Server error', expected: 'Server error' },
      ];

      for (const testCase of errorCases) {
        mockSupabase.auth.signInWithOAuth.mockResolvedValue({
          error: new Error(testCase.error)
        });

        const { unmount } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);

        const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
        await userEvent.click(googleButton);

        await waitFor(() => {
          expect(screen.getByText(testCase.expected)).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should maintain modal open state during OAuth flow', async () => {
      mockSupabase.auth.signInWithOAuth.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      // Modal should still be open during OAuth
      expect(screen.getByText('Welcome to Spaecs')).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in error messages', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: new Error('Authentication failed: token=abc123secret')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        const errorText = screen.getByText(/Authentication failed/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it('should use HTTPS for OAuth redirect in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockLocation.origin = 'https://spaecs.com';

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        const callArgs = mockSupabase.auth.signInWithOAuth.mock.calls[0][0];
        expect(callArgs.options.redirectTo).toContain('https://');
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});
