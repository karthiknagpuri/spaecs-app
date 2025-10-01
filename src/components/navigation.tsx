"use client";

import { useState, useEffect, useRef } from 'react';
import { Home, Users, Rocket, CreditCard, HelpCircle, User, LogOut } from 'lucide-react';
import { NavBar } from "./ui/tubelight-navbar";
import { AuthModal } from "./auth/AuthModal";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export function Navigation() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        setUser(user);
      })
      .catch(() => {
        // Silently handle auth errors, treat as not authenticated
        setUser(null);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    // Click outside handler for user menu
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleAuthClick = () => {
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
  };

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Communities', url: '#communities', icon: Users },
    { name: 'Features', url: '#features', icon: Rocket },
    { name: 'Pricing', url: '#pricing', icon: CreditCard },
    { name: 'Support', url: '#support', icon: HelpCircle }
  ];

  const authButtons = user ? (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors min-h-[44px]"
      >
        <User className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {user.email?.split('@')[0]}
        </span>
      </button>

      {showUserMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
          <a
            href="/dashboard"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors min-h-[44px]"
          >
            Dashboard
          </a>
          <a
            href="/profile"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors min-h-[44px]"
          >
            Profile
          </a>
          <hr className="border-white/10" />
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  ) : (
    <button
      onClick={handleAuthClick}
      className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors min-h-[44px]"
    >
      Sign In
    </button>
  );

  return (
    <>
      <NavBar items={navItems} authButtons={authButtons} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}