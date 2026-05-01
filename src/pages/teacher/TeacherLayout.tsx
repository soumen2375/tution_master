import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/shared/Sidebar';
import TopBar from '@/components/shared/TopBar';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie, faChalkboard, faUsers, faMoneyBill,
  faCalendarDays, faFolder, faBullhorn,
} from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from '@/components/shared/Sidebar';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/teacher/dashboard',     icon: faChartPie },
  { label: 'Batches',       href: '/teacher/batches',       icon: faChalkboard },
  { label: 'Students',      href: '/teacher/students',      icon: faUsers },
  { label: 'Fees',          href: '/teacher/fees',          icon: faMoneyBill },
  { label: 'Attendance',    href: '/teacher/attendance',    icon: faCalendarDays },
  { label: 'Materials',     href: '/teacher/materials',     icon: faFolder },
  { label: 'Announcements', href: '/teacher/announcements', icon: faBullhorn },
];

const PAGE_TITLES: Record<string, string> = {
  '/teacher/dashboard':     'Dashboard',
  '/teacher/batches':       'Batches',
  '/teacher/students':      'Students',
  '/teacher/fees':          'Fees',
  '/teacher/attendance':    'Attendance',
  '/teacher/materials':     'Materials',
  '/teacher/announcements': 'Announcements',
  '/teacher/settings':      'Settings',
};

export default function TeacherLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileName, setProfileName] = useState('Teacher');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('role, full_name').eq('id', user.id).single();
      if (profile?.role !== 'TEACHER') { navigate('/'); return; }
      setProfileName(profile?.full_name || user.user_metadata?.full_name || 'Teacher');
    }
    checkAuth();
  }, [navigate]);

  function handleToggleCollapse() {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const pageTitle = PAGE_TITLES[location.pathname] ||
    Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] || 'Teacher';

  const sidebarWidth = collapsed ? 'md:ml-16' : 'md:ml-[260px]';

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <Sidebar
        navItems={NAV_ITEMS}
        role="TEACHER"
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        profileName={profileName}
        onLogout={handleLogout}
      />

      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-200', sidebarWidth)}>
        <TopBar
          pageTitle={pageTitle}
          profileName={profileName}
          role="TEACHER"
          onMobileMenuOpen={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 pt-16 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
