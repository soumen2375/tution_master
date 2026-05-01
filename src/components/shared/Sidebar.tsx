import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChalkboardUser, faAnglesLeft, faAnglesRight,
  faGear, faRightFromBracket, faCopy, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: IconDefinition;
}

interface SidebarProps {
  navItems: NavItem[];
  bottomItems?: NavItem[];
  role: 'TEACHER' | 'STUDENT';
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  profileName: string;
  onLogout: () => void;
  uniqueId?: string;
}

export default function Sidebar({
  navItems, bottomItems = [], role, collapsed, onToggleCollapse,
  mobileOpen, onMobileClose, profileName, onLogout, uniqueId,
}: SidebarProps) {
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  function copyId() {
    if (!uniqueId) return;
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const initials = profileName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const roleColor = role === 'TEACHER'
    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
    : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30';

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    return (
      <Link
        to={item.href}
        onClick={onMobileClose}
        data-tooltip={collapsed ? item.label : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors cursor-pointer relative',
          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
          active
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 nav-active-indicator'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
        )}
        aria-current={active ? 'page' : undefined}
      >
        <FontAwesomeIcon icon={item.icon} className={cn('shrink-0', collapsed ? 'text-base' : 'text-sm w-4')} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <aside
      ref={sidebarRef}
      className={cn(
        'flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-200',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Logo + Collapse toggle */}
      <div className={cn(
        'flex items-center h-16 border-b border-slate-200 dark:border-slate-700 shrink-0',
        collapsed ? 'justify-center px-2' : 'px-4 justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faChalkboardUser} className="text-white text-sm" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight">TutionHut</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faChalkboardUser} className="text-white text-sm" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden md:flex w-7 h-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer',
            collapsed && 'mt-2'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} className="text-xs" />
        </button>
      </div>

      {/* Role badge + Unique ID */}
      {!collapsed && (
        <div className="px-4 py-3 space-y-2 shrink-0">
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider', roleColor)}>
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />
            {role === 'TEACHER' ? 'Teacher Panel' : 'Student Panel'}
          </div>
          {uniqueId && (
            <button onClick={copyId}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors group cursor-pointer"
              title="Click to copy your ID">
              <div className="text-left">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">
                  {role === 'TEACHER' ? 'Teacher ID' : 'Student ID'}
                </p>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wider">{uniqueId}</p>
              </div>
              <FontAwesomeIcon
                icon={copied ? faCheck : faCopy}
                className={cn('text-xs shrink-0 transition-colors', copied ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')}
              />
            </button>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-2 border-t border-slate-200 dark:border-slate-700 space-y-0.5 shrink-0">
        {bottomItems.map(item => <NavLink key={item.href} item={item} />)}

        {/* Settings */}
        <NavLink item={{ label: 'Settings', href: `/${role.toLowerCase()}/settings`, icon: faGear }} />

        {/* Profile preview (expanded only) */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{profileName}</p>
              <p className="text-xs text-slate-500 truncate">{role === 'TEACHER' ? 'Teacher' : 'Student'}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          data-tooltip={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer',
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          )}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className={cn('shrink-0', collapsed ? 'text-base' : 'text-sm w-4')} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar (fixed) */}
      <div
        className={cn(
          'hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-200',
          collapsed ? 'w-16' : 'w-[260px]'
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative w-[260px] animate-slide-in-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
