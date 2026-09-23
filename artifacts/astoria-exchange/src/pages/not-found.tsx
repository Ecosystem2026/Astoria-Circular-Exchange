import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-8 text-center shadow-[var(--shadow-md)]">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Compass size={23} /></span>
        <p className="mt-6 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">A wrong turn in Astoria</p>
        <h1 className="mt-3 font-display text-[36px] leading-none tracking-[-.035em]">This path doesn’t connect.</h1>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">That page isn’t part of the exchange network. Let’s get you back to the useful stuff.</p>
        <Link href="/" data-testid="link-not-found-home" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-extrabold text-primary-foreground"><ArrowLeft size={14} /> Back to overview</Link>
      </div>
    </div>
  );
}
