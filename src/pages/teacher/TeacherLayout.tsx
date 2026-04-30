import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Users, Calendar, IndianRupee, BookOpen, Bell,
  Settings, LogOut, GraduationCap, Menu, X, Sun, Moon, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TeacherLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [profileName, setProfileName] = useState('T');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'TEACHER') { navigate('/'); return; }

      setUser(user as unknown as Record<string, unknown>);
      const name = (profile?.full_name as string) || user.user_metadata?.full_name as string || 'Teacher';
      setProfileName(name);
    }
    checkAuth();
  }, [navigate]);

  const navItems = [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Batches', href: '/teacher/batches', icon: Calendar },
    { name: 'Students', href: '/teacher/students', icon: Users },
    { name: 'Fees', href: '/teacher/fees', icon: IndianRupee },
    { name: 'Materials', href: '/teacher/materials', icon: BookOpen },
    { name: 'Announcements', href: '/teacher/announcements', icon: Bell },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const currentPage = navItems.find(i => i.href === location.pathname)?.name || 'Dashboard';
  const initials = profileName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const sidebarBg = 'bg-white dark:bg-[#0f1623]';
  const sidebarBorder = 'border-slate-200 dark:border-slate-800';
  const topbarBg = 'bg-white/80 dark:bg-[#0f1623]/80';

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── Sidebar ── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
        sidebarBg, sidebarBorder,
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className={cn('px-5 h-16 flex items-center gap-2.5 font-bold text-xl tracking-tight border-b shrink-0', sidebarBorder)}>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-1.5 rounded-xl shadow-md">
            <GraduationCap size={18} />
          </div>
          <span className="gradient-text">TutionHut</span>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Teacher Panel
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200 dark:shadow-rose-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                )}
              >
                <item.icon size={18} />
                {item.name}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={cn('px-3 py-3 border-t space-y-0.5 shrink-0', sidebarBorder)}>
          <Link
            to="/teacher/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
          >
            <Settings size={18} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className={cn(
          'h-16 flex items-center justify-between px-4 md:px-6 shrink-0 border-b sticky top-0 z-40 backdrop-blur-md',
          topbarBg, sidebarBorder
        )}>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-base font-bold leading-none">{currentPage}</h1>
              <p className="text-xs mt-0.5 hidden md:block" style={{ color: 'var(--color-muted-foreground)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900" />
            </Button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {initials}
                </div>
                <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">
                  {profileName.split(' ')[0]}
                </span>
                <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border shadow-xl overflow-hidden z-50"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <p className="text-sm font-bold truncate">{profileName}</p>
                    <p className="text-xs text-rose-500 font-semibold">Teacher</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link to="/teacher/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
                      onClick={() => setUserMenuOpen(false)}>
                      <Settings size={15} /> Settings
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* User menu overlay */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}
