import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { GraduationCap, Sun, Moon, Globe, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const languages: { code: Locale; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'EN' },
    { code: 'bn', label: 'বাংলা', native: 'বাং' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        scrolled
          ? 'border-b shadow-sm backdrop-blur-lg'
          : 'border-b border-transparent',
      )}
      style={{
        backgroundColor: scrolled ? 'var(--nav-bg)' : 'transparent',
        borderColor: scrolled ? 'var(--nav-border)' : 'transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-1.5 rounded-xl shadow-md">
            <GraduationCap size={20} />
          </div>
          <span className="hidden sm:block">TutionHut</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <a href="#features" className="hover:text-rose-500 transition-colors">{t.nav.features}</a>
          <a href="#pricing" className="hover:text-rose-500 transition-colors">{t.nav.pricing}</a>
          <Link to="/about" className="hover:text-rose-500 transition-colors">{t.nav.about}</Link>
          <Link to="/contact" className="hover:text-rose-500 transition-colors">Contact</Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:text-rose-500 transition-all"
              aria-label="Change language"
            >
              <Globe size={14} />
              <span>{languages.find(l => l.code === locale)?.native}</span>
              <ChevronDown size={12} className={cn('transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLocale(lang.code); setLangOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950',
                      locale === lang.code && 'text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950'
                    )}
                  >
                    {lang.label}
                    {locale === lang.code && <span className="ml-auto text-rose-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:text-rose-500 transition-all"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          {/* Auth Buttons */}
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">{t.nav.login}</Button>
          </Link>
          <Link to="/signup">
            <Button variant="gradient" size="sm">{t.nav.getStarted}</Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-2 backdrop-blur-lg"
          style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
        >
          <a href="#features" className="block py-2 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setMobileOpen(false)}>{t.nav.features}</a>
          <a href="#pricing" className="block py-2 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setMobileOpen(false)}>{t.nav.pricing}</a>
          <Link to="/about" className="block py-2 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setMobileOpen(false)}>{t.nav.about}</Link>
          <Link to="/contact" className="block py-2 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setMobileOpen(false)}>Contact</Link>
          <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--nav-border)' }}>
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full" onClick={() => setMobileOpen(false)}>{t.nav.login}</Button>
            </Link>
            <Link to="/signup" className="block">
              <Button variant="gradient" className="w-full" onClick={() => setMobileOpen(false)}>{t.nav.getStarted}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
