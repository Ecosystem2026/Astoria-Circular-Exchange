import { useState, type ReactNode } from 'react';
import { Show, SignOutButton } from '@clerk/react';
import { Link, useLocation } from 'wouter';
import { getHealthCheckQueryKey, useHealthCheck, useGetDashboard } from '@workspace/api-client-react';
import { ArrowRight, CircleUserRound, Github, LayoutDashboard, Menu, Network, X } from 'lucide-react';
const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/matches', label: 'Your matches', icon: Network },
  { href: '/profile', label: 'Business profile', icon: CircleUserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const health = useHealthCheck({ query: { staleTime: 30000, queryKey: getHealthCheckQueryKey() } });
    const dashboard = useGetDashboard({
    query: { staleTime: 20000, retry: false },
  });

  const profileName = dashboard.data?.currentBusiness?.name ?? 'Your profile';

  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  const activeLabel = navItems.find((item) => item.href === location)?.label ?? 'Overview';

  return (
    <div className="grain min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[276px] flex-col bg-sidebar px-5 pb-5 pt-7 text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <Link href="/" onClick={() => setOpen(false)} className="focus-ring flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-primary text-[18px] font-extrabold text-primary-foreground shadow-sm">A</span>
            <span className="pt-0.5">
              <span className="block text-[13px] font-extrabold tracking-[-.02em]">Astoria Circular</span>
              <span className="mt-0.5 block font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">Exchange network</span>
            </span>
          </Link>
          <button type="button" aria-label="Close navigation" data-testid="button-close-navigation" onClick={() => setOpen(false)} className="focus-ring rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden"><X size={18} /></button>
        </div>

        <div className="mt-14">
          <p className="mb-3 px-3 font-mono-ui text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/45">Your workspace</p>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`} className={`focus-ring group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'}`}>
                  <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                  <span>{label}</span>
                  {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${health.isError ? 'bg-primary' : health.isLoading ? 'animate-soft-pulse bg-accent' : 'bg-accent'}`} />
            <span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-sidebar-foreground/62">{health.isError ? 'Offline mode' : 'Network live'}</span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-sidebar-foreground/65">Keep useful things moving through Astoria, one pickup at a time.</p>
          <Link href="/profile" onClick={() => setOpen(false)} className="focus-ring mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:gap-2.5 transition-all">Update your profile <ArrowRight size={13} /></Link>
        </div>
        <div className="mt-4 px-3 font-mono-ui text-[9px] uppercase tracking-[.13em] text-sidebar-foreground/35">Astoria, Queens · NY</div>
      </aside>

      {open && <button type="button" aria-label="Close navigation overlay" data-testid="button-close-navigation-overlay" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-sidebar/35 md:hidden" />}
      <main className="min-h-[100dvh] md:pl-[276px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8 lg:px-11">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open navigation" data-testid="button-open-navigation" onClick={() => setOpen(true)} className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu size={20} /></button>
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Astoria Circular Exchange</p>
              <p className="mt-0.5 text-[12px] font-semibold text-foreground/65">{activeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
  href="https://github.com/Ecosystem2026/Astoria-Circular-Exchange"
  target="_blank"
  rel="noopener noreferrer"
  title="View Open Source Code on GitHub"
  className="focus-ring flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[11px] font-bold text-foreground/75 transition-colors hover:border-primary/50 hover:text-foreground"
>
  <Github size={17} />
  <span className="hidden sm:inline">Open Source</span>
</a>
            <Show when="signed-out">
              <Link href="/sign-up" data-testid="link-create-account" className="focus-ring rounded-full border border-border bg-card px-3 py-2 text-[11px] font-extrabold text-foreground/75 transition-colors hover:border-primary/50 hover:text-foreground">Create account</Link>
            </Show>
            <Show when="signed-in">
              <SignOutButton>
                <button type="button" data-testid="button-sign-out" className="focus-ring rounded-full border border-border bg-card px-3 py-2 text-[11px] font-extrabold text-foreground/75 transition-colors hover:border-primary/50 hover:text-foreground">Sign out</button>
              </SignOutButton>
            </Show>
<Link href="/profile" data-testid="link-header-profile" className="focus-ring flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground/75 transition-colors hover:border-primary/50 hover:text-foreground">
  <span className="grid size-6 place-items-center rounded-full bg-accent text-[10px] font-extrabold text-accent-foreground">
    {profileInitials}
  </span>
  <span className="hidden sm:inline">{profileName}</span>
</Link>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
