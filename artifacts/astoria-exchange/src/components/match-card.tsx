import { useState } from 'react';
import type { Match } from '@workspace/api-client-react';
import { Check, Clock3, MapPin, Package, Send, Undo2 } from 'lucide-react';

type Props = { match: Match; onRequest: (match: Match) => void; onCancel?: (match: Match) => void; pending?: boolean; compact?: boolean; alwaysExpanded?: boolean };

export function MatchCard({ match, onRequest, onCancel, pending = false, compact = false, alwaysExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const requested = match.status !== 'available';
  const score = Math.round(match.score);
  return (
    <article data-testid={`card-match-${match.id}`} className={`group relative overflow-hidden rounded-2xl border border-card-border bg-card shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <div className="absolute inset-y-0 left-0 w-1 bg-primary opacity-80" />
      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-[12px] font-extrabold text-secondary-foreground">{match.partner.initials}</span>
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-extrabold tracking-[-.02em]">{match.partner.name}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{match.partner.type} · {match.partner.neighborhood}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="font-mono-ui text-[11px] font-medium text-primary">{score}%</span>
          <p className="mt-0.5 text-[9px] uppercase tracking-[.12em] text-muted-foreground">match</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border/70 py-3 pl-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 text-foreground/75"><Package size={13} className="text-primary" /> {match.material} · {match.quantity}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {match.distance}</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {match.pickupWindow}</span>
      </div>

      {!compact && (
        <div className="mt-4 pl-2">
          {!alwaysExpanded && <button type="button" data-testid={`button-toggle-breakdown-${match.id}`} onClick={() => setExpanded((value) => !value)} className="focus-ring font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground transition-colors hover:text-foreground">
            {expanded ? 'Hide score details' : 'See why this works'} <span className="ml-1 text-primary">{expanded ? '−' : '+'}</span>
          </button>}
          {(expanded || alwaysExpanded) && (
            <div className="mt-3 grid grid-cols-3 gap-2 animate-rise-in">
              <Score label="Material" value={match.compatibilityScore} />
              <Score label="Distance" value={match.distanceScore} />
              <Score label="Timing" value={match.timingScore} />
            </div>
          )}
        </div>
      )}

      <div className={`${compact ? 'mt-4' : 'mt-5'} flex items-center justify-between gap-3 pl-2`}>
        <p className="truncate text-[11px] text-muted-foreground"><span className="font-semibold text-foreground/70">{match.route}</span></p>
        {requested ? (
          <div className="flex shrink-0 items-center gap-2">
            <span data-testid={`status-match-${match.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-accent/40 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-foreground"><Check size={12} /> {match.status}</span>
            {onCancel && match.status === 'requested' && <button type="button" disabled={pending} onClick={() => onCancel(match)} data-testid={`button-cancel-match-${match.id}`} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-extrabold text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-wait disabled:opacity-60">{pending ? 'Undoing…' : 'Undo request'} <Undo2 size={12} /></button>}
          </div>
        ) : (
          <button type="button" disabled={pending} onClick={() => onRequest(match)} data-testid={`button-request-match-${match.id}`} className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[11px] font-extrabold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_14px_hsl(var(--primary)/.25)] disabled:cursor-wait disabled:opacity-60">
            {pending ? 'Sending…' : 'Request pickup'} <Send size={12} />
          </button>
        )}
      </div>
    </article>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-muted/65 px-2.5 py-2"><div className="flex justify-between font-mono-ui text-[9px] uppercase tracking-[.08em] text-muted-foreground"><span>{label}</span><span className="text-foreground">{value}%</span></div><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div></div>;
}