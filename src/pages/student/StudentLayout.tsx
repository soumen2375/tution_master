import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/shared/Sidebar';
import TopBar from '@/components/shared/TopBar';
import { cn } from '@/lib/utils';
import {
  faChartPie, faBook, faCalendarDays,
  faMoneyBill, faFolder, faArrowRightToBracket, faChartLine, faGear,
} from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from '@/components/shared/Sidebar';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/student/dashboard',  icon: faChartPie },
  { label: 'My Batches', href: '/student/batches',     icon: faBook },
  { label: 'Attendance', href: '/student/attendance',  icon: faCalendarDays },
  { label: 'Fees',       href: '/student/fees',        icon: faMoneyBill },
  { label: 'Materials',  href: '/student/notes',       icon: faFolder },
  { label: 'Progress',   href: '/student/progress',    icon: faChartLine },
  { label: 'Join Batch', href: '/student/join',        icon: faArrowRightToBracket },
  { label: 'Settings',   href: '/student/settings',    icon: faGear },
];

const PAGE_TITLES: Record<string, string> = {
  '/student/dashboard':  'Dashboard',
  '/student/batches':    'My Batches',
  '/student/attendance': 'Attendance',
  '/student/fees':       'Fees',
  '/student/notes':      'Materials',
  '/student/progress':   'Progress',
  '/student/join':       'Join Batch',
  '/student/settings':   'Settings',
};

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileName, setProfileName] = useState('Student');
  const [studentCode, setStudentCode] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('role, full_name').eq('id', user.id).single();
      if (profile?.role !== 'STUDENT') { navigate('/'); return; }
      setProfileName(profile?.full_name || user.user_metadata?.full_name || 'Student');
      const { data: sp } = await supabase
        .from('student_profiles').select('student_code').eq('user_id', user.id).maybeSingle();
      if (sp?.student_code) setStudentCode(sp.student_code);
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

  const pageTitle = PAGE_TITLES[location.pathname] || 'Student';
  const sidebarWidth = collapsed ? 'md:ml-16' : 'md:ml-[260px]';

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <Sidebar
        navItems={NAV_ITEMS}
        role="STUDENT"
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        profileName={profileName}
        onLogout={handleLogout}
        uniqueId={studentCode}
      />

      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-200', sidebarWidth)}>
        <TopBar
          pageTitle={pageTitle}
          profileName={profileName}
          role="STUDENT"
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
