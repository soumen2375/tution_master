import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faSun, faMoon, faBell,
  faChevronDown, faGear, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import NotificationDrawer from './NotificationDrawer';
import { cn } from '@/lib/utils';

interface TopBarProps {
  pageTitle: string;
  profileName: string;
  role: 'TEACHER' | 'STUDENT';
  onMobileMenuOpen: () => void;
  onLogout: () => void;
}

export default function TopBar({ pageTitle, profileName, role, onMobileMenuOpen, onLogout }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = profileName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const settingsPath = `/${role.toLowerCase()}/settings`;

  return (
    <>
      <header className="fixed top-0 right-0 left-0 md:left-auto h-16 z-20 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {/* Page title */}
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-none">{pageTitle}</h1>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="text-sm" />
          </button>

          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} className="text-sm" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white dark:border-slate-800">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block max-w-[100px] truncate">
                {profileName.split(' ')[0]}
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={cn('text-xs text-slate-400 transition-transform duration-150', userMenuOpen && 'rotate-180')}
              />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{profileName}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{role === 'TEACHER' ? 'Teacher' : 'Student'}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to={settingsPath}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faGear} className="text-slate-400 w-3.5" />
                      Settings
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setUnreadCount}
      />
    </>
  );
}
