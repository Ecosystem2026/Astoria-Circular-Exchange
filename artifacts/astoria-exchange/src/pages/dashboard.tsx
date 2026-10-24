import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ActivityKind, getGetDashboardQueryKey, useCancelMatchRequest, useGetDashboard, useRequestMatch } from '@workspace/api-client-react';
import { ArrowRight, CalendarDays, CheckCircle2, Leaf, MapPinned, PackageCheck, RefreshCw, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { MatchCard } from '@/components/match-card';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const dashboard = useGetDashboard({ query: { staleTime: 20000, queryKey: getGetDashboardQueryKey() } });
  const requestMatch = useRequestMatch();
  const cancelMatchRequest = useCancelMatchRequest();
  const [requestedIds, setRequestedIds] = useState<number[]>([]);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const request = (matchId: number) => {
    setPendingId(matchId);
    requestMatch.mutate({ matchId, data: {} }, {
      onSuccess: () => {
        setRequestedIds((ids) => [...ids, matchId]);
        setPendingId(null);
        void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      },
      onError: () => setPendingId(null),
    });
  };

  const cancel = (matchId: number) => {
    setPendingId(matchId);
    cancelMatchRequest.mutate({ matchId }, {
      onSuccess: () => {
        setRequestedIds((ids) => ids.filter((id) => id !== matchId));
        setPendingId(null);
        void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      },
      onError: () => setPendingId(null),
    });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1340px] px-5 py-8 sm:px-8 lg:px-11 lg:py-10">
        {dashboard.isLoading && <DashboardSkeleton />}
        {dashboard.isError && <ErrorState onRetry={() => void dashboard.refetch()} />}
        {dashboard.data && (
          <>
            <section className="animate-rise-in">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Tuesday, October 8 · Your exchange desk</p>
                  <h1 data-testid="text-dashboard-heading" className="mt-3 max-w-[680px] text-balance font-display text-[42px] leading-[.98] tracking-[-.035em] text-foreground sm:text-[58px]">Good morning, {firstName(dashboard.data.currentBusiness.name)}.</h1>
   <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-muted-foreground">
  Here’s what’s moving around the neighborhood today.
  You’re offering {dashboard.data.currentBusiness.wasteMaterial}
  and looking for {dashboard.data.currentBusiness.wantedMaterial}.
</p>
                </div>
                <Link href="/matches" data-testid="link-view-all-matches" className="focus-ring inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[12px] font-extrabold transition-all hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[var(--shadow-sm)]">View all matches <ArrowRight size={14} /></Link>
              </div>
            </section>

            <section className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Active matches" value={dashboard.data.stats.activeMatches} note="ready to move" icon={PackageCheck} accent="primary" />
              <Stat label="Diverted this month" value={dashboard.data.stats.divertedThisMonth} note="from landfill" icon={Leaf} accent="accent" />
              <Stat label="Local partners" value={dashboard.data.stats.localPartners} note="in your orbit" icon={MapPinned} accent="secondary" />
              <Stat label="Waste avoided" value={dashboard.data.stats.wasteAvoided} note="and put to use" icon={CheckCircle2} accent="primary" />
            </section>

            <div className="mt-10 grid gap-9 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
              <section className="animate-rise-in delay-1">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-primary">Ranked for your shop</p>
                    <h2 className="mt-1.5 text-[21px] font-extrabold tracking-[-.03em]">Strongest matches</h2>
                  </div>
                  <span className="font-mono-ui text-[10px] text-muted-foreground">{dashboard.data.matches.length} nearby leads</span>
                </div>
                <div className="space-y-3">
                  {dashboard.data.matches.slice(0, 3).map((match) => (
                    <MatchCard key={match.id} match={requestedIds.includes(match.id) ? { ...match, status: 'requested' } : match} onRequest={() => request(match.id)} onCancel={() => cancel(match.id)} pending={pendingId === match.id} />
                  ))}
                  {dashboard.data.matches.length === 0 && <EmptyMatches />}
                </div>
              </section>

              <aside className="animate-rise-in delay-2">
                <div className="rounded-2xl bg-secondary p-5 text-secondary-foreground sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-secondary-foreground/55">Your current loop</p><h2 className="mt-2 text-[19px] font-extrabold tracking-[-.03em]">{dashboard.data.currentBusiness.name}</h2></div>
                    <span className="grid size-9 place-items-center rounded-xl bg-secondary-foreground/10 text-[11px] font-extrabold">{dashboard.data.currentBusiness.initials}</span>
                  </div>
                  <div className="mt-6 border-t border-secondary-foreground/15 pt-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold"><span className="size-2 rounded-full bg-accent" /> Offering <span className="ml-auto text-secondary-foreground/65">{dashboard.data.currentBusiness.wasteQuantity}</span></div>
                    <p className="mt-2 text-[16px] font-extrabold">{dashboard.data.currentBusiness.wasteMaterial}</p>
                    <div className="my-4 h-px bg-secondary-foreground/15" />
                    <div className="flex items-center gap-2 text-[11px] font-semibold"><span className="size-2 rounded-full bg-primary" /> Looking for</div>
                    <p className="mt-2 text-[16px] font-extrabold">{dashboard.data.currentBusiness.wantedMaterial}</p>
                  </div>
                  <Link href="/profile" data-testid="link-edit-profile-card" className="focus-ring mt-6 flex items-center justify-between rounded-xl bg-secondary-foreground/10 px-3.5 py-3 text-[11px] font-bold transition-colors hover:bg-secondary-foreground/15">Edit your exchange profile <ArrowRight size={14} /></Link>
                </div>
                <div className="mt-7">
                  <div className="mb-4 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-primary">The paper trail</p><h2 className="mt-1.5 text-[19px] font-extrabold tracking-[-.03em]">Recent activity</h2></div><CalendarDays size={17} className="text-muted-foreground" /></div>
                  <div className="relative space-y-5 pl-7 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
                    {dashboard.data.activity.slice(0, 4).map((item) => <ActivityRow key={item.id} {...item} />)}
                    {dashboard.data.activity.length === 0 && <p className="text-[12px] text-muted-foreground">Your first exchange will appear here.</p>}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function firstName(name: string) { return name.split(' ')[0] || 'there'; }

function Stat({ label, value, note, icon: Icon, accent }: { label: string; value: string | number; note: string; icon: typeof Leaf; accent: 'primary' | 'accent' | 'secondary' }) {
  return <div data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`} className="rounded-2xl border border-card-border bg-card p-4 shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 sm:p-5"><div className="flex items-center justify-between"><span className={`grid size-9 place-items-center rounded-xl ${accent === 'secondary' ? 'bg-secondary text-secondary-foreground' : accent === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-primary/15 text-primary'}`}><Icon size={16} /></span><span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">{note}</span></div><p className="mt-5 text-[26px] font-extrabold tracking-[-.04em]">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>;
}

function ActivityRow({ title, description, time, kind }: { title: string; description: string; time: string; kind: ActivityKind }) {
  const Icon = kind === 'impact' ? Leaf : kind === 'pickup' ? PackageCheck : kind === 'profile' ? Sparkles : NetworkIcon;
  return <div data-testid={`activity-${title.toLowerCase().replaceAll(' ', '-')}`} className="relative"><span className="absolute -left-7 top-0.5 grid size-4 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground"><Icon size={8} /></span><p className="text-[12px] font-bold">{title}</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p><p className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground/70">{time}</p></div>;
}

function NetworkIcon({ size }: { size?: number }) { return <span style={{ fontSize: size ? `${size}px` : undefined }}>↗</span>; }

function EmptyMatches() { return <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center"><Sparkles className="mx-auto text-primary" size={22} /><p className="mt-3 text-[14px] font-bold">The network is listening.</p><p className="mx-auto mt-1 max-w-[300px] text-[12px] leading-relaxed text-muted-foreground">Add a little more detail to your profile and we’ll look for the right local fit.</p><Link href="/profile" data-testid="link-complete-profile-empty" className="focus-ring mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-[11px] font-extrabold text-primary-foreground">Complete profile</Link></div>; }

function DashboardSkeleton() { return <div className="animate-pulse"><div className="h-3 w-52 rounded bg-muted" /><div className="mt-4 h-14 w-[min(620px,80%)] rounded-lg bg-muted" /><div className="mt-4 h-4 w-96 max-w-full rounded bg-muted" /><div className="mt-10 grid gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-2xl bg-muted" />)}</div><div className="mt-10 grid gap-4 xl:grid-cols-[1.35fr,.65fr]"><div className="h-96 rounded-2xl bg-muted" /><div className="h-96 rounded-2xl bg-muted" /></div></div>; }

function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-sm)]"><RefreshCw className="mx-auto text-primary" size={24} /><h1 className="mt-4 text-[19px] font-extrabold">The exchange desk is taking a beat</h1><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">We couldn’t load the latest neighborhood activity. Your profile is safe.</p><button type="button" data-testid="button-retry-dashboard" onClick={onRetry} className="focus-ring mt-5 rounded-full bg-primary px-4 py-2.5 text-[11px] font-extrabold text-primary-foreground">Try again</button></div>; }
