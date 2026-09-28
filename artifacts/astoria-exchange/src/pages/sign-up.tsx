import { useMemo, useState } from 'react';
import { SignUp } from '@clerk/react';
import { ArrowLeft, ArrowRight, Building2, Check, UserRound } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export const SIGNUP_DRAFT_KEY = 'astoria-signup-draft';

type AccountType = 'business' | 'individual';

type SignupDraft = {
  accountType: AccountType;
  categories: string[];
};

type Props = {
  basePath: string;
  appearance: Record<string, unknown>;
};

export default function SignUpPage({ basePath, appearance }: Props) {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [otherCategory, setOtherCategory] = useState('');
  const [showClerk, setShowClerk] = useState(false);

  const canContinue = accountType === 'individual' || categories.length > 0;
  const visibleCategories = useMemo(
    () => BUSINESS_CATEGORIES.filter((category) => category !== 'Other'),
    [],
  );

  const toggleCategory = (category: string, checked: boolean) => {
    setCategories((current) =>
      checked
        ? [...current, category]
        : current.filter((item) => item !== category),
    );
  };

  const continueToAccount = () => {
    if (!accountType || !canContinue) return;
    const normalizedOther = otherCategory.trim();
    const selectedCategories =
      accountType === 'business'
        ? [
            ...categories.filter((category) => category !== 'Other'),
            ...(categories.includes('Other') && normalizedOther
              ? [normalizedOther]
              : []),
          ]
        : [];
    const draft: SignupDraft = {
      accountType,
      categories: selectedCategories,
    };
    window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
    setShowClerk(true);
  };

  if (showClerk) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          appearance={appearance}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[720px]">
        <a href={basePath || '/'} className="focus-ring inline-flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to Astoria Circular Exchange
        </a>
        <div className="mt-12">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Create your exchange account</p>
          <h1 className="mt-3 max-w-[650px] font-display text-[44px] leading-[.98] tracking-[-.035em] sm:text-[58px]">Tell us who is joining the loop.</h1>
          <p className="mt-4 max-w-[570px] text-[14px] leading-relaxed text-muted-foreground">Choose an account type first. Businesses can select every category that describes their work.</p>
        </div>

        <section className="mt-9 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAccountType('business')}
            className={`focus-ring rounded-2xl border p-5 text-left transition-all ${accountType === 'business' ? 'border-primary bg-primary/10 shadow-[var(--shadow-sm)]' : 'border-card-border bg-card hover:-translate-y-0.5 hover:border-primary/50'}`}
          >
            <span className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><Building2 size={19} /></span>
              {accountType === 'business' && <Check size={18} className="text-primary" />}
            </span>
            <span className="mt-5 block text-[16px] font-extrabold">Business</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Share useful materials and find local exchange partners.</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('individual')}
            className={`focus-ring rounded-2xl border p-5 text-left transition-all ${accountType === 'individual' ? 'border-primary bg-primary/10 shadow-[var(--shadow-sm)]' : 'border-card-border bg-card hover:-translate-y-0.5 hover:border-primary/50'}`}
          >
            <span className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><UserRound size={19} /></span>
              {accountType === 'individual' && <Check size={18} className="text-primary" />}
            </span>
            <span className="mt-5 block text-[16px] font-extrabold">Individual</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">Follow local reuse opportunities without a business profile.</span>
          </button>
        </section>

        {accountType === 'business' && (
          <section className="mt-5 rounded-2xl border border-card-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div>
              <p className="text-[14px] font-extrabold">What kind of business are you?</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Choose one or more categories.</p>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {visibleCategories.map((category) => (
                <label key={category} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-[11px] font-semibold transition-colors hover:border-primary/50">
                  <Checkbox checked={categories.includes(category)} onCheckedChange={(checked) => toggleCategory(category, checked === true)} />
                  {category}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-[11px] font-semibold transition-colors hover:border-primary/50">
                <Checkbox checked={categories.includes('Other')} onCheckedChange={(checked) => toggleCategory('Other', checked === true)} />
                Other
              </label>
            </div>
            {categories.includes('Other') && (
              <Input
                value={otherCategory}
                onChange={(event) => setOtherCategory(event.target.value)}
                placeholder="Type your business category"
                className="mt-3 h-11 rounded-xl bg-background text-[12px]"
              />
            )}
          </section>
        )}

        <button
          type="button"
          disabled={!canContinue || (categories.includes('Other') && !otherCategory.trim())}
          onClick={continueToAccount}
          className="focus-ring mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[12px] font-extrabold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_14px_hsl(var(--primary)/.25)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Continue to account creation <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}