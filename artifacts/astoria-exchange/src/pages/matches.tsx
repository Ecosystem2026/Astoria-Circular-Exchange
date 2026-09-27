import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetDashboardQueryKey, getListMatchesQueryKey, useCancelMatchRequest, useGetDashboard, useListMatches, useRequestMatch } from '@workspace/api-client-react';
import { ArrowDownUp, Filter, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { MatchCard } from '@/components/match-card';

export default function MatchesPage() {
  const queryClient = useQueryClient();
  const dashboard = useGetDashboard({ query: { staleTime: 20000, queryKey: getGetDashboardQueryKey() } });
  const businessId = dashboard.data?.currentBusiness.id ?? 0;
  const matches = useListMatches(businessId, { query: { enabled: businessId > 0, queryKey: getListMatchesQueryKey(businessId), staleTime: 20000 } });
  const requestMatch = useRequestMatch();
  const cancelMatchRequest = useCancelMatchRequest();
  const [requestedIds, setRequestedIds] = useState<number[]>([]);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [sortHigh, setSortHigh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'requested'>('all');

  const allMatches = matches.data ?? dashboard.data?.matches ?? [];
  const visibleMatches = allMatches
    .filter((match) => filter === 'all' || (filter === 'requested' ? requestedIds.includes(match.id) || match.status !== 'available' : match.status === 'available'))
    .filter((match) => `${match.partner.name} ${match.material} ${match.partner.neighborhood}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortHigh ? b.score - a.score : a.score - b.score);

  const request = (matchId: number) => {
    setPendingId(matchId);
    requestMatch.mutate({ matchId, data: {} }, {
      onSuccess: () => {
        setRequestedIds((ids) => [...ids, matchId]);
        setPendingId(null);
        void queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(businessId) });
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
        void queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(businessId) });
        void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      },
      onError: () => setPendingId(null),
    });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1340px] px-5 py-8 sm:px-8 lg:px-11 lg:py-10">
        <section className="animate-rise-in">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">The neighborhood shortlist</p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><h1 data-testid="text-matches-heading" className="font-display text-[42px] leading-none tracking-[-.035em] sm:text-[54px]">Your matches</h1><p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-muted-foreground">Not just a score. See the material, the mile, and the timing behind every possible handoff.</p></div>
            <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground">{visibleMatches.length} of {allMatches.length} shown</div>
          </div>
        </section>

        <section className="mt-9 rounded-2xl border border-card-border bg-card p-3 shadow-[var(--shadow-sm)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block flex-1 lg:max-w-[360px]"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-search-matches" placeholder="Search partners or materials" className="focus-ring h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-[12px] outline-none placeholder:text-muted-foreground/70" /></label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-muted p-1">
                {(['all', 'available', 'requested'] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} data-testid={`button-filter-${value}`} className={`focus-ring rounded-lg px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.08em] transition-colors ${filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{value}</button>)}
              </div>
              <button type="button" onClick={() => setSortHigh((value) => !value)} data-testid="button-sort-matches" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-input px-3 text-[11px] font-bold text-foreground/75 transition-colors hover:border-primary/50"><ArrowDownUp size={14} /> {sortHigh ? 'Best fit' : 'Lowest score'}</button>
              <span className="hidden text-muted-foreground sm:inline"><SlidersHorizontal size={16} /></span>
            </div>
          </div>
        </section>

        {matches.isLoading && <div className="mt-6 grid gap-3 lg:grid-cols-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
        {(matches.isError || dashboard.isError) && <div className="mt-6"><ErrorMatches onRetry={() => void matches.refetch()} /></div>}
        {!matches.isLoading && !matches.isError && (
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {visibleMatches.map((match, index) => <div key={match.id} className={`animate-rise-in delay-${Math.min(index + 1, 4)}`}><MatchCard alwaysExpanded match={requestedIds.includes(match.id) ? { ...match, status: 'requested' } : match} onRequest={() => request(match.id)} onCancel={() => cancel(match.id)} pending={pendingId === match.id} /></div>)}
            {visibleMatches.length === 0 && <EmptyState query={query} onClear={() => { setQuery(''); setFilter('all'); }} />}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) { return <div className="lg:col-span-2 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"><Filter className="mx-auto text-primary" size={24} /><h2 className="mt-4 text-[17px] font-extrabold">{query ? 'No matches with that name' : 'No matches in this view'}</h2><p className="mt-2 text-[12px] text-muted-foreground">Try widening the filter. New local businesses join the network every week.</p><button type="button" data-testid="button-clear-match-filters" onClick={onClear} className="focus-ring mt-5 rounded-full border border-border bg-card px-4 py-2 text-[11px] font-bold">Clear filters</button></div>; }
function SkeletonCard() { return <div className="h-[270px] animate-pulse rounded-2xl bg-muted" />; }
function ErrorMatches({ onRetry }: { onRetry: () => void }) { return <div className="rounded-2xl border border-border bg-card p-10 text-center"><RefreshCw className="mx-auto text-primary" size={23} /><p className="mt-3 text-[14px] font-bold">The shortlist could not load.</p><button type="button" data-testid="button-retry-matches" onClick={onRetry} className="focus-ring mt-4 rounded-full bg-primary px-4 py-2 text-[11px] font-extrabold text-primary-foreground">Try again</button></div>; }