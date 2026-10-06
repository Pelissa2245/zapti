// ZapTI Web — Header Component
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '@/store/auth';
import { useTheme } from 'next-themes';

export function Header() {
  const { user, currentTenant, logout, setCurrentTenant } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 right-0 z-30 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex h-full items-center gap-4 px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="hidden md:flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar conversas, contatos..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              aria-label="Buscar"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
            aria-pressed={theme === 'dark'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />
            )}
          </button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Tenant switcher (if multiple tenants) */}
          {user && user.tenants.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 hidden sm:flex">
                  <Building2 className="h-4 w-4" />
                  <span>{currentTenant?.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Selecionar empresa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.tenants.map((tenant) => (
                  <DropdownMenuItem
                    key={tenant.id}
                    onSelect={() => setCurrentTenant(tenant)}
                    className={currentTenant?.id === tenant.id ? 'bg-primary-50 text-primary-600' : ''}
                  >
                    {tenant.name}
                    {currentTenant?.id === tenant.id && <Check className="ml-auto h-4 w-4 text-primary-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium dark:bg-primary-900 dark:text-primary-300">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-slate-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="flex w-full items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void logout().finally(() => {
                    router.push('/auth/login');
                    router.refresh();
                  });
                }}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

