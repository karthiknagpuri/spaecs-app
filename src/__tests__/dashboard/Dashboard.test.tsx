import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/app/dashboard/page';
import DashboardLayout from '@/app/dashboard/layout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  }))
}));

// Mock Sidebar component
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, open, setOpen }: any) => (
    <div data-testid="sidebar" data-open={open}>
      {children}
    </div>
  ),
  SidebarBody: ({ children }: any) => (
    <div data-testid="sidebar-body">{children}</div>
  ),
  SidebarLink: ({ link }: any) => (
    <a href={link.href} data-testid={`sidebar-link-${link.label}`}>
      {link.label}
    </a>
  ),
}));

describe('Dashboard Page', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01'
  };
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        signOut: jest.fn().mockResolvedValue({}),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: mockUnsubscribe } }
        })
      }
    });
  });

  describe('Dashboard Page Component', () => {
    it('should render welcome message with user email', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, test!/)).toBeInTheDocument();
      });
    });

    it('should render welcome message without user', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      });
    });

    it('should display stats cards', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Active Members')).toBeInTheDocument();
        expect(screen.getByText('Virtual Gifts')).toBeInTheDocument();
        expect(screen.getByText('Events This Month')).toBeInTheDocument();
      });
    });

    it('should display quick action buttons', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Community')).toBeInTheDocument();
        expect(screen.getByText('Schedule Event')).toBeInTheDocument();
        expect(screen.getByText('Send Gift')).toBeInTheDocument();
        expect(screen.getByText('View Analytics')).toBeInTheDocument();
      });
    });

    it('should display recent activity section', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
        expect(screen.getByText('Start by creating your first community')).toBeInTheDocument();
      });
    });

    it('should display charts placeholder', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
        expect(screen.getByText('Top Communities')).toBeInTheDocument();
        expect(screen.getByText('Chart coming soon')).toBeInTheDocument();
        expect(screen.getByText('No communities yet')).toBeInTheDocument();
      });
    });

    it('should have view all button for recent activity', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const viewAllButton = screen.getByRole('button', { name: 'View all' });
        expect(viewAllButton).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Layout', () => {
    const mockPush = jest.fn();
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      });

      const mockSupabase = createClient();
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      });
    });

    it('should redirect to home if user is not authenticated', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should render sidebar when user is authenticated', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });
    });

    it('should display all navigation links', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-link-Overview')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-link-Analytics')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-link-Communities')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-link-Payments')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-link-Virtual Gifts')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-link-Events')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-link-Settings')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-link-Support')).toBeInTheDocument();
      });
    });

    it('should have correct href for navigation links', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-link-Overview')).toHaveAttribute('href', '/dashboard');
        expect(screen.getByTestId('sidebar-link-Analytics')).toHaveAttribute('href', '/dashboard/analytics');
        expect(screen.getByTestId('sidebar-link-Communities')).toHaveAttribute('href', '/dashboard/communities');
        expect(screen.getByTestId('sidebar-link-Payments')).toHaveAttribute('href', '/dashboard/payments');
        expect(screen.getByTestId('sidebar-link-Events')).toHaveAttribute('href', '/dashboard/events');
        expect(screen.getByTestId('sidebar-link-Settings')).toHaveAttribute('href', '/dashboard/settings');
      });
    });

    it('should display logout button', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-link-Logout')).toBeInTheDocument();
      });
    });

    it('should handle sign out', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });
      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({});

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        const logoutButton = screen.getByTestId('sidebar-link-Logout');
        expect(logoutButton).toBeInTheDocument();
      });

      const logoutContainer = screen.getByTestId('sidebar-link-Logout').parentElement;
      await userEvent.click(logoutContainer!);

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should display user profile link', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        const userProfileLink = screen.getByTestId('sidebar-link-test');
        expect(userProfileLink).toBeInTheDocument();
        expect(userProfileLink).toHaveAttribute('href', '/dashboard/profile');
      });
    });

    it('should handle auth state changes', async () => {
      const mockSupabase = createClient();
      let authChangeCallback: any;

      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Simulate logout
      authChangeCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should unsubscribe from auth changes on unmount', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      const { unmount } = render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should render children content', async () => {
      const mockSupabase = createClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      render(
        <DashboardLayout>
          <div data-testid="dashboard-content">Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
        expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Stats', () => {
    it('should display correct initial stat values', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Revenue
        const revenueCard = screen.getByText('Total Revenue').closest('div');
        expect(revenueCard).toHaveTextContent('₹0');
        expect(revenueCard).toHaveTextContent('+0%');

        // Members
        const membersCard = screen.getByText('Active Members').closest('div');
        expect(membersCard).toHaveTextContent('0');
        expect(membersCard).toHaveTextContent('+0%');

        // Gifts
        const giftsCard = screen.getByText('Virtual Gifts').closest('div');
        expect(giftsCard).toHaveTextContent('0');
        expect(giftsCard).toHaveTextContent('+0%');

        // Events
        const eventsCard = screen.getByText('Events This Month').closest('div');
        expect(eventsCard).toHaveTextContent('0');
        expect(eventsCard).toHaveTextContent('+0%');
      });
    });
  });
});