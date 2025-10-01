import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '@/components/auth/AuthModal';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}));

// Mock window.location
delete (global as any).window;
(global as any).window = {
  location: { href: '/', origin: 'http://localhost:3000', reload: jest.fn() }
};

describe('AuthModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithOAuth: jest.fn(),
      }
    });
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<AuthModal isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('Welcome to Spaecs')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Welcome to Spaecs')).toBeInTheDocument();
      expect(screen.getByText('Build your community, monetize your passion')).toBeInTheDocument();
    });

    it('should display close button', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should display Google sign in button', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      expect(googleButton).toBeInTheDocument();
    });

    it('should display Terms of Service and Privacy Policy links', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    });
  });

  describe('Google OAuth Sign In', () => {
    it('should handle successful Google sign in', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ error: null });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: 'http://localhost:3000/auth/callback',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        });
      });
    });

    it('should pass correct OAuth parameters for offline access', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ error: null });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        const callArgs = (mockSupabase.auth.signInWithOAuth as jest.Mock).mock.calls[0][0];
        expect(callArgs.options.queryParams.access_type).toBe('offline');
        expect(callArgs.options.queryParams.prompt).toBe('consent');
      });
    });

    it('should handle OAuth error', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        error: new Error('OAuth authentication failed')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('OAuth authentication failed')).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        error: new Error('Network error')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show loading state during OAuth process', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      // Check for loading state
      expect(screen.getByText('Connecting...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled();
      });
    });

    it('should disable button during loading', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      // Button should be disabled during loading
      const loadingButton = screen.getByRole('button');
      expect(loadingButton).toBeDisabled();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close');
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking outside', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const backdrop = screen.getByText('Welcome to Spaecs').closest('div')?.parentElement?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should not close modal when clicking inside modal content', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const modalContent = screen.getByText('Welcome to Spaecs').closest('div');
      if (modalContent) {
        fireEvent.click(modalContent);
        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('Error Display', () => {
    it('should clear error when retrying authentication', async () => {
      const mockSupabase = createClient();
      let callCount = 0;
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ error: new Error('First attempt failed') });
        }
        return Promise.resolve({ error: null });
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });

      // First attempt - should show error
      await userEvent.click(googleButton);
      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeInTheDocument();
      });

      // Second attempt - error should be cleared
      await userEvent.click(googleButton);
      await waitFor(() => {
        expect(screen.queryByText('First attempt failed')).not.toBeInTheDocument();
      });
    });

    it('should display error message in styled container', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        error: new Error('Test error message')
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      await userEvent.click(googleButton);

      await waitFor(() => {
        const errorElement = screen.getByText('Test error message');
        expect(errorElement).toBeInTheDocument();
        // Error should be in a styled container with specific classes
        expect(errorElement.closest('div')).toHaveClass('bg-red-50');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have minimum touch target size for mobile', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toHaveClass('min-h-[44px]');
      expect(closeButton).toHaveClass('min-w-[44px]');
    });

    it('should support keyboard navigation', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close');
      closeButton.focus();

      expect(document.activeElement).toBe(closeButton);
    });
  });
});
