// ZapTI Web — Sidebar Component
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Users2,
  MessageSquare,
  Ticket,
  GitBranch,
  Zap,
  Settings,
  Building2,
  Shield,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Conversas', href: '/conversations', icon: MessageSquare },
  { title: 'Tickets', href: '/tickets', icon: Ticket },
  {
    title: 'Automação',
    href: '/flows',
    icon: GitBranch,
    children: [
      { title: 'Fluxos', href: '/flows', icon: GitBranch },
      { title: 'Regras do Bot', href: '/bot-rules', icon: Zap },
      { title: 'Automações', href: '/automations', icon: Zap },
    ],
  },
  {
    title: 'Gestão',
    href: '/users',
    icon: Users,
    children: [
      { title: 'Usuários', href: '/users', icon: Users },
      { title: 'Equipes', href: '/teams', icon: Users2 },
      { title: 'Sessões', href: '/sessions', icon: Shield },
    ],
  },
  { title: 'WhatsApp', href: '/settings/whatsapp', icon: MessageSquare },
  { title: 'Configurações', href: '/settings', icon: Settings },
];

const superadminNavigation: NavItem[] = [
  { title: 'Visão Geral', href: '/superadmin', icon: LayoutDashboard },
  { title: 'Tenants', href: '/superadmin/tenants', icon: Building2 },
  { title: 'Usuários', href: '/superadmin/users', icon: Users },
  { title: 'Auditoria', href: '/superadmin/audit', icon: Shield },
  { title: 'Backups', href: '/superadmin/backups', icon: Database },
  { title: 'Sistema', href: '/superadmin/system', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isSuperadmin } = useAuthStore();
  const [collapsed, setCollapsed] = React.useState(false);

  const navItems = isSuperadmin ? superadminNavigation : navigation;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700', collapsed && 'justify-center')}>
        <Link href={isSuperadmin ? '/superadmin' : '/dashboard'} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          {!collapsed && <span className="font-semibold text-xl text-slate-900 dark:text-white">ZapTI</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('h-8 w-8', collapsed && 'ml-auto')}
          aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" role="navigation" aria-label="Navegação principal">
        <ul className="space-y-1" role="list">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>

      {/* User info at bottom */}
      {!collapsed && user && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium dark:bg-primary-900 dark:text-primary-300">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function NavItemComponent({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  const isActive = pathname === item.href || (item.children && item.children.some((c) => pathname.startsWith(c.href)));
  const [isOpen, setIsOpen] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (item.children && item.children.length > 0) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  if (collapsed) {
    return (
      <li>
        <Link
          href={item.href}
          className={cn(
            'flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-colors',
            isActive ? 'bg-primary-100 text-primary-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            'dark: hover:bg-slate-800 dark:hover:text-slate-100'
          )}
          title={item.title}
          aria-current={isActive ? 'page' : undefined}
        >
          <item.icon className="h-5 w-5" />
        </Link>
      </li>
    );
  }

  if (item.children && item.children.length > 0) {
    return (
      <li>
        <button
          onClick={handleClick}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive ? 'bg-primary-100 text-primary-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          )}
          aria-expanded={isOpen}
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{item.title}</span>
          <ChevronRight className={cn('h-4 w-4 ml-auto transition-transform', isOpen && 'rotate-90')} />
        </button>
        {isOpen && (
          <ul className="mt-1 ml-8 space-y-1 border-l border-slate-200 dark:border-slate-700" role="list">
            {item.children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === child.href
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  )}
                  aria-current={pathname === child.href ? 'page' : undefined}
                >
                  <child.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{child.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-primary-100 text-primary-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span className="truncate">{item.title}</span>
      </Link>
    </li>
  );
}