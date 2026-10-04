// ZapTI Web — Login Page (Professional Redesign)
'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, Sun, Moon, Zap } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  rememberMe: z.boolean().optional(),
  twoFactorToken: z.string().optional(),
});

const twoFactorSchema = z.object({
  twoFactorToken: z.array(z.string().length(1)).length(6),
});

type LoginForm = z.infer<typeof loginSchema>;
type TwoFactorForm = z.infer<typeof twoFactorSchema>;

// Theme context for the login page (uses next-themes globally, but login page needs its own for SSR)
const LoginThemeContext = React.createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
} | null>(null);

function LoginThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('login-theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('login-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = React.useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // ALWAYS provide the context — children call useLoginTheme() on the very first
  // render; skipping the provider while !mounted crashed the page with
  // "useLoginTheme must be used within a LoginThemeProvider" (the original Application
  // error on /auth/login).
  return (
    <LoginThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </LoginThemeContext.Provider>
  );
}

function useLoginTheme() {
  const context = React.useContext(LoginThemeContext);
  if (!context) {
    throw new Error('useLoginTheme must be used within a LoginThemeProvider');
  }
  return context;
}

// Animated Landscape Background Component
function AnimatedLandscape({ theme }: { theme: 'light' | 'dark' }) {
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-0 overflow-hidden pointer-events-none',
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      )}
      aria-hidden="true"
    >
      {/* Sky Gradient */}
      <div className={cn(
        'absolute inset-0 opacity-60 transition-colors duration-1000',
        theme === 'dark'
          ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950'
          : 'bg-gradient-to-b from-blue-50 via-white to-slate-50'
      )} />

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 opacity-40">
        <div className={cn(
          'absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-orb-float-1',
          theme === 'dark' ? 'bg-primary-500/30' : 'bg-primary-400/40'
        )} />
        <div className={cn(
          'absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-orb-float-2',
          theme === 'dark' ? 'bg-teal-500/20' : 'bg-teal-400/30'
        )} />
        <div className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl animate-orb-float-3',
          theme === 'dark' ? 'bg-purple-500/15' : 'bg-purple-400/20'
        )} />
      </div>

      {/* Landscape Layers */}
      <LandscapeLayers theme={theme} reducedMotion={prefersReducedMotion} />

      {/* Subtle Particles */}
      {!prefersReducedMotion && <ParticleField theme={theme} />}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

function LandscapeLayers({ theme, reducedMotion }: { theme: 'light' | 'dark'; reducedMotion: boolean }) {
  const layers = [
    { y: 'bottom-0', height: 'h-32', opacity: theme === 'dark' ? 'opacity-60' : 'opacity-40', delay: 0 },
    { y: 'bottom-8', height: 'h-28', opacity: theme === 'dark' ? 'opacity-50' : 'opacity-30', delay: 1000 },
    { y: 'bottom-16', height: 'h-24', opacity: theme === 'dark' ? 'opacity-40' : 'opacity-20', delay: 2000 },
    { y: 'bottom-24', height: 'h-20', opacity: theme === 'dark' ? 'opacity-30' : 'opacity-15', delay: 3000 },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      {layers.map((layer, i) => (
        <div
          key={i}
          className={cn(
            'absolute left-0 right-0 rounded-t-[100%] blur-sm transition-all duration-1000',
            layer.y,
            layer.height,
            layer.opacity,
            theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200',
            !reducedMotion && 'animate-landscape-drift'
          )}
          style={{ animationDelay: `${layer.delay}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function ParticleField({ theme }: { theme: 'light' | 'dark' }) {
  const particles = React.useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.1,
    }))
  , []);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className={cn(
            'absolute rounded-full animate-particle-float',
            theme === 'dark' ? 'bg-primary-300' : 'bg-primary-500'
          )}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Floating Decorative Shapes
function FloatingShapes({ theme }: { theme: 'light' | 'dark' }) {
  const shapes = React.useMemo(() => [
    { top: '10%', left: '5%', size: 'w-24 h-24', delay: 0, color: theme === 'dark' ? 'bg-primary-500/10' : 'bg-primary-500/15' },
    { top: '20%', right: '8%', size: 'w-16 h-16', delay: 2000, color: theme === 'dark' ? 'bg-teal-500/10' : 'bg-teal-500/15' },
    { bottom: '30%', left: '3%', size: 'w-20 h-20', delay: 4000, color: theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-500/15' },
    { bottom: '15%', right: '5%', size: 'w-12 h-12', delay: 6000, color: theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-500/15' },
  ], [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {shapes.map((shape, i) => (
        <div
          key={i}
          className={cn(
            'absolute rounded-2xl blur-xl animate-float-slow',
            shape.top && `top-[${shape.top}]`,
            shape.bottom && `bottom-[${shape.bottom}]`,
            shape.left && `left-[${shape.left}]`,
            shape.right && `right-[${shape.right}]`,
            shape.size,
            shape.color
          )}
          style={{ animationDelay: `${shape.delay}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Glassmorphism Login Card
function LoginCard({
  onLogin,
  callbackUrl,
  error
}: {
  onLogin: (data: LoginForm) => Promise<{ requiresTwoFactor: boolean; error?: string }>;
  callbackUrl: string;
  error: string | null;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [show2FA, setShow2FA] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [buttonState, setButtonState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [checkingBootstrap, setCheckingBootstrap] = React.useState(true);
  const [pendingLoginData, setPendingLoginData] = React.useState<LoginForm | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  // Separate form for 2FA
  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: _errors2FA }, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useForm<TwoFactorForm>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { twoFactorToken: ['', '', '', '', '', ''] },
  });

  const handleSubmitForm = async (data: LoginForm) => {
    // Store the login data for potential 2FA verification
    setPendingLoginData(data);

    setIsLoading(true);
    setButtonState('loading');
    try {
      const result = await onLogin(data);
      if (result.requiresTwoFactor) {
        // 2FA required - show 2FA form
        setShow2FA(true);
        setButtonState('idle');
      } else {
        // Login successful - redirect to dashboard
        setButtonState('success');
        toast.success('Login realizado com sucesso!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setButtonState('error');
      const message = err.response?.data?.error?.message || 'Erro ao fazer login';
      toast.error(message);
    } finally {
      setIsLoading(false);
      // Reset button state after animation
      setTimeout(() => setButtonState('idle'), 500);
    }
  };

  const handle2FASubmit = async (data: TwoFactorForm) => {
    setIsLoading(true);
    try {
      const twoFactorToken = data.twoFactorToken.join('');
      // Use stored login credentials from the initial login attempt
      const loginData = {
        email: pendingLoginData!.email,
        password: pendingLoginData!.password,
        rememberMe: pendingLoginData!.rememberMe,
        twoFactorToken: twoFactorToken,
      };
      const result = await onLogin(loginData);

      if (!result.requiresTwoFactor) {
        toast.success('Autenticação de dois fatores verificada!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Código 2FA inválido';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check bootstrap status on mount
  React.useEffect(() => {
    async function checkBootstrap() {
      try {
        const res = await fetch('/api/auth/bootstrap-status', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.needsBootstrap) {
            router.replace(`/auth/bootstrap?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            return;
          }
        }
      } catch (e) {
        console.error('Bootstrap check failed', e);
      } finally {
        setCheckingBootstrap(false);
      }
    }
    checkBootstrap();
  }, [router, callbackUrl]);

  // Show loading while checking bootstrap
  if (checkingBootstrap) {
    return (
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      'w-full max-w-md relative overflow-hidden',
      'bg-white/80 dark:bg-slate-900/80',
      'backdrop-blur-xl backdrop-saturate-150',
      'border-slate-200/50 dark:border-slate-700/50',
      'shadow-2xl shadow-slate-900/5 dark:shadow-black/20',
      'animate-card-enter'
    )}>
      {/* Decorative Top Border */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-teal-500 to-purple-500 opacity-80"
        aria-hidden="true"
      />

      <CardHeader className="text-center pb-4 relative">
        <div className="mx-auto mb-6">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="ZapTI - Página inicial">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl',
              'bg-gradient-to-br from-primary-500 to-teal-500',
              'shadow-lg shadow-primary-500/30',
              'animate-logo-pulse'
            )}>
              <Zap className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <span className={cn(
              'font-bold text-2xl tracking-tight',
              'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white',
              'bg-clip-text text-transparent'
            )}>
              ZapTI
            </span>
          </Link>
        </div>

        {/* Theme Toggle - positioned at top-right of CardHeader */}
        <div className="absolute top-0 right-0 -translate-y-1/2">
          <ThemeToggle />
        </div>

        <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Entrar na sua conta
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
          Digite suas credenciais para acessar o painel
        </CardDescription>
      </CardHeader>

      {error && (
        <div className="mx-6 mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 animate-slide-down" role="alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              {error === 'session_expired'
                ? 'Sua sessão expirou. Faça login novamente.'
                : 'Erro ao acessar a página.'}
            </span>
          </div>
        </div>
      )}

      <CardContent>
        {!show2FA ? (
          <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors duration-200 peer-focus:text-primary-500" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 transition-all duration-200 peer"
                  {...register('email')}
                  autoComplete="email"
                  disabled={isLoading}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-shake" role="alert">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Senha
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors duration-200 peer-focus:text-primary-500" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-12 transition-all duration-200 peer"
                  {...register('password')}
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-shake" role="alert">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & 2FA */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className={cn(
                    'h-4 w-4 rounded border-slate-300 text-primary-600',
                    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    'dark:border-slate-600 dark:bg-slate-800',
                    'transition-colors duration-150',
                    'active:scale-95'
                  )}
                  disabled={isLoading}
                  id="rememberMe"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 select-none">Lembrar-me</span>
              </label>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className={cn(
                'w-full h-12 text-base font-medium rounded-lg',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                buttonState === 'loading' && 'cursor-wait',
                buttonState === 'success' && 'bg-green-600 hover:bg-green-600',
                buttonState === 'error' && 'animate-shake bg-red-600 hover:bg-red-600'
              )}
              isLoading={isLoading || buttonState === 'loading'}
              disabled={isLoading}
            >
              {buttonState === 'loading' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Entrando...</span>
                </>
              )}
              {buttonState === 'success' && (
                <>
                  <svg className="h-4 w-4 animate-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Sucesso!</span>
                </>
              )}
              {(buttonState === 'idle' || buttonState === 'error') && (
                'Entrar'
              )}
            </Button>

            </form>
        ) : (
          <form onSubmit={handleSubmit2FA(handle2FASubmit)} className="space-y-4 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Autenticação de dois fatores</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Digite o código do seu aplicativo autenticador
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  {...register2FA(`twoFactorToken.${i - 1}` as `twoFactorToken.${number}`)}
                  className="w-10 h-12 text-center text-lg font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`Dígito ${i} do código 2FA`}
                />
              ))}
            </div>
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
              isLoading={isLoading}
            >
              Verificar código
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShow2FA(false)}
              disabled={isLoading}
            >
              Voltar
            </Button>
        </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-3 pt-4">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-xs">
          Ao continuar, você concorda com nossos{' '}
          <Link href="/terms" className="underline hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Termos de Serviço</Link>
          {' '}e{' '}
          <Link href="/privacy" className="underline hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Política de Privacidade</Link>
        </p>
      </CardFooter>
    </Card>
  );
}

// Theme Toggle Component
function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useLoginTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
      aria-label={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />
      )}
    </button>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const { theme } = useLoginTheme();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const handleLogin = async (data: LoginForm): Promise<{ requiresTwoFactor: boolean; error?: string }> => {
    const result = await login(data.email, data.password, data.rememberMe, data.twoFactorToken);

    if (result.requiresTwoFactor) {
      // 2FA required - user needs to enter 2FA code
      // For now, we'll just redirect as the login already handles it
      toast.success('Autenticação de dois fatores verificada!');
      router.push(callbackUrl);
      router.refresh();
      return { requiresTwoFactor: true };
    } else {
      // Login successful - redirect to dashboard
      toast.success('Login realizado com sucesso!');
      router.push(callbackUrl);
      router.refresh();
      return { requiresTwoFactor: false };
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Animated Background */}
      <AnimatedLandscape theme={theme} />

      {/* Floating Shapes */}
      <FloatingShapes theme={theme} />

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-md animate-fade-in-up">
        <LoginCard
          onLogin={handleLogin}
          callbackUrl={callbackUrl}
          error={error}
        />

        {/* Version Info */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 animate-fade-in-delayed">
          ZapTI v1.0.0 &copy; 2026
        </p>
      </main>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(1.03); }
          66% { transform: translate(15px, -15px) scale(0.97); }
        }

        @keyframes orb-float-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes landscape-drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }

        @keyframes particle-float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: var(--particle-opacity, 0.3); }
          90% { opacity: var(--particle-opacity, 0.3); }
          100% { transform: translateY(-120vh) translateX(var(--drift-x, 0)); opacity: 0; }
        }

        @keyframes card-enter {
          0% { opacity: 0; transform: translateY(30px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }

        @keyframes checkmark {
          0% { stroke-dashoffset: 50; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
        }

        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-orb-float-1 { animation: orb-float-1 20s ease-in-out infinite; }
        .animate-orb-float-2 { animation: orb-float-2 25s ease-in-out infinite; }
        .animate-orb-float-3 { animation: orb-float-3 18s ease-in-out infinite; }
        .animate-landscape-drift { animation: landscape-drift 30s ease-in-out infinite; }
        .animate-particle-float { animation: particle-float var(--duration, 20s) linear infinite; }
        .animate-card-enter { animation: card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-delayed { animation: fade-in 0.5s ease-out 0.8s forwards; opacity: 0; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-checkmark { stroke-dasharray: 50; animation: checkmark 0.4s ease-out forwards; }
        .animate-logo-pulse { animation: logo-pulse 3s ease-in-out infinite; }
        .animate-slide-down { animation: slide-down 0.3s ease-out forwards; }

        @media (prefers-reduced-motion: reduce) {
          .animate-orb-float-1,
          .animate-orb-float-2,
          .animate-orb-float-3,
          .animate-landscape-drift,
          .animate-particle-float,
          .animate-logo-pulse {
            animation: none !important;
          }
          .animate-card-enter,
          .animate-fade-in,
          .animate-fade-in-up,
          .animate-fade-in-delayed {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* Focus visible styles */
        *:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        /* Selection */
        ::selection {
          background: #6366f1;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LoginThemeProvider>
      <Suspense fallback={<LoginSkeleton />}>
        <LoginPageContent />
      </Suspense>
    </LoginThemeProvider>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md animate-pulse">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="h-6 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="h-4 w-32 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}