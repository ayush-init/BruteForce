"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LayoutDashboard, BookOpen, HelpCircle, Users, Trophy, AlertCircle, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from 'next-themes';
import { Select } from '@/components/Select';
import { Sidebar, SidebarNavItems } from '@/components/sidebar/Sidebar';
import { logoutUser } from '@/services/auth.service';
import { getCurrentAdmin } from '@/services/admin.service';
import { useAdminStore } from '@/store/adminStore';
import { isAdminToken, clearAuthTokens } from '@/lib/auth-utils';
import { BruteForceLoader } from '@/components/ui/BruteForceLoader';
import { getAllCities } from '@/services/city.service';
import { getAllBatches } from '@/services/batch.service';
import { Skeleton } from '@/components/ui/skeleton';
import { CitySelection, BatchSelection, ApiError } from '@/types/admin/index.types';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('JWT decode error:', err);
    return null;
  }
}

// Helper functions for localStorage
const getStoredSelections = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('adminSelections');
    return stored ? JSON.parse(stored) : { city: null, batch: null };
  }
  return { city: null, batch: null };
};

const setStoredSelections = (city: CitySelection | null, batch: BatchSelection | null) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminSelections', JSON.stringify({ city, batch }));
  }
};

const clearStoredSelections = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminSelections');
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<{ name: string, role: string } | null>(null);
  const [cities, setCities] = useState<{ id: number, city_name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number, slug: string, batch_name: string, year: number }[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    selectedCity,
    selectedBatch,
    setSelectedCity,
    setSelectedBatch,
    setIsLoadingContext
  } = useAdminStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = (showToast = true) => {
    clearStoredSelections();
    logoutUser(showToast);
    router.push('/admin/login');
  };

  const handleRetry = () => {
    setAuthError(null);
    setAuthLoading(true);
    window.location.reload();
  };

  useEffect(() => {
    // Skip all API calls on login page only
    if (pathname === '/admin/login') {
      return;
    }

    // Check if we have an admin token before making any API calls
    if (!isAdminToken()) {
      clearAuthTokens(); // Clear any invalid tokens (like student tokens)
      handleLogout(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];

    if (!token && !cookieToken) {
      handleLogout(false);
      return;
    }

    const loadUserAndData = async () => {
      setAuthLoading(true);
      setAuthError(null);
      setIsLoadingContext(true);
      try {
        // Get current admin user from API
        const userData = await getCurrentAdmin();
        setUser(userData);

        // Get cities and batches
        const cityList = await getAllCities();
        setCities(cityList);

        // Check if we have stored selections
        const storedSelections = getStoredSelections();

        if (storedSelections.city) {
          // Restore from localStorage (persisted selections)
          setSelectedCity(storedSelections.city);

          const batchList = await getAllBatches(storedSelections.city.name);
          setBatches(batchList);

          if (storedSelections.batch) {
            setSelectedBatch(storedSelections.batch);
          }
        } else {
          // First time visit - use token defaults
          const activeToken = token || cookieToken;
          const payload = decodeJwt(activeToken || '');
          let initialCityId = payload?.cityId;

          let matchingCity = null;
          if (initialCityId) {
            matchingCity = cityList.find((c) => c.id === initialCityId);
          }

          if (!matchingCity && cityList.length > 0) {
            matchingCity = cityList[0];
          }

          if (matchingCity) {
            const cityData = { id: matchingCity.id, name: matchingCity.city_name };
            setSelectedCity(cityData);

            const batchList = await getAllBatches(matchingCity.city_name);
            setBatches(batchList);

            const initialBatchId = payload?.batchId;
            let matchingBatch = null;

            if (initialBatchId) {
              matchingBatch = batchList.find((b) => b.id === initialBatchId);
            }
            if (!matchingBatch && batchList.length > 0) {
              matchingBatch = batchList[0];
            }

            if (matchingBatch) {
              const batchData = {
                id: matchingBatch.id,
                slug: matchingBatch.slug,
                name: matchingBatch.batch_name,
                year: matchingBatch.year
              };
              setSelectedBatch(batchData);
              // Store the initial selections
              setStoredSelections(cityData, batchData);
            }
          }
        }
      } catch (err: unknown) {
        // Error is handled by API client interceptor
        console.error("Failed to load admin data", err);

        // Handle specific error cases
        let errorMessage = 'Authentication failed';
        const error = err as ApiError;
        if (error.response?.status === 403) {
          errorMessage = 'Access forbidden - insufficient permissions';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication failed - token expired';
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error - please check your connection';
        }

        setAuthError(errorMessage);

        // Clear tokens and redirect to login after a delay
        setTimeout(() => {
          handleLogout(false);
        }, 3000);
      } finally {
        setIsLoadingContext(false);
        setAuthLoading(false);
      }
    };

    loadUserAndData();
  }, []); // Remove pathname dependency - only run once on mount

  // Handle City Change
  const handleCityChange = (value: string | number) => {
    const cityId = Number(value);
    const cityObj = cities.find(c => c.id === cityId);

    if (cityObj) {
      const cityData = { id: cityObj.id, name: cityObj.city_name };
      setSelectedCity(cityData);
      setStoredSelections(cityData, null); // Clear batch when city changes
      setIsLoadingContext(true);
      getAllBatches(cityObj.city_name).then((batchList) => {
        setBatches(batchList);
        if (batchList.length > 0) {
          const first = batchList[0];
          const batchData = {
            id: first.id,
            slug: first.slug,
            name: first.batch_name,
            year: first.year
          };
          setSelectedBatch(batchData);
          setStoredSelections(cityData, batchData);
        }
      }).catch(err => {
        console.error("Batch load error:", err);
      }).finally(() => {
        setIsLoadingContext(false);
      });
    }
  };

  const handleBatchChange = (value: string | number) => {
    const batchId = Number(value);
    const batchObj = batches.find(b => b.id === batchId);
    if (batchObj) {
      const batchData = {
        id: batchObj.id,
        slug: batchObj.slug,
        name: batchObj.batch_name,
        year: batchObj.year
      };
      setSelectedBatch(batchData);
      setStoredSelections(selectedCity, batchData);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    // Management section starts here — divider rendered ABOVE this item
    // (same pattern the superadmin layout uses).
    { label: 'Topics & Classes', href: '/admin/topics', icon: BookOpen, showDivider: true, dividerLabel: 'Management' },
    { label: 'Question Bank', href: '/admin/questions', icon: HelpCircle },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
  ];

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }


  // Show error state if authentication fails
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{authError}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRetry} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Retry
            </button>
            <button onClick={() => router.push('/admin/login')} className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
              Login Again
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Redirecting to login in 3 seconds...</p>
        </div>
      </div>
    );
  }
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BruteForceLoader size="lg" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden md:block">
        <Sidebar
          role="admin"
          isOpen={true}
          onClose={() => { }}
          user={user}
          navItems={navItems}
          onLogout={() => handleLogout()}
          portalLabel="Admin Portal"
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden absolute  h-9 w-9 top-5 left-5 z-50 p-2 items-center rounded-md bg-card border border-border hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[85%] sm:w-[80%] max-w-[320px]
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        <div className="h-full glass border-r border-border/20 backdrop-blur-md">
          {/* Mobile Menu Header */}
          <div className="p-4 border-b border-border/20 flex items-center justify-between">
            <h1 className="font-serif text-2xl font-bold text-logo tracking-tight">
              <span className="text-2xl font-bold leading-[1.05] tracking-tight">
                <span className="text-foreground">Brute</span>
                <span className="text-(--accent-primary)">Force</span>
              </span>
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-(--accent-primary)/10 text-(--accent-primary) border-l-4 border-(--accent-primary)'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(204,255,0,0.05)]'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu User Section */}
          <div className="border-t border-border/20 p-4">
            <button
              onClick={() => handleLogout()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[rgba(204,255,0,0.05)] transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center font-bold text-sm uppercase">
                {user.name?.charAt(0) || "A"}
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-medium text-foreground">
                  {user.name || "Admin"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Logout Session
                </div>
              </div>
              <LogOut className="w-5 h-5 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-20 min-w-0 transition-all duration-300 ease-in-out ps-3 mt-3">
        {/* Topbar */}
        <header className="h-14 glass border rounded-2xl border-border/20 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30 w-full">
          {/* Dropdown Selectors */}
          <div className="flex items-center gap-4 ms-6 lg:ms-0">
            {selectedCity ? (
              <Select
                value={selectedCity.id.toString()}
                onChange={handleCityChange}
                options={cities.map(c => ({ label: c.city_name, value: c.id.toString() }))}
                placeholder="Select City"
              />
            ) : (
              <Skeleton className="h-9 w-32 rounded-md" />
            )}

            {selectedCity && (
              selectedBatch ? (
                <Select
                  value={selectedBatch.id.toString()}
                  onChange={handleBatchChange}
                  options={batches.map(b => ({ label: `${b.batch_name} - ${b.year}`, value: b.id.toString() }))}
                  placeholder="Select Batch"
                />
              ) : (
                <Skeleton className="h-9 w-40 rounded-md ml-2" />
              )
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {mounted && (
              <div className="ml-3 hidden sm:block">
                <img
                  src={
                    theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
                      ? '/pwioi_dark.jpg'
                      : '/pwioi_light.png'
                  }
                  alt="PWIO Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Wrapper */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-8 relative">
          <div className="w-[100%] sm:w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
