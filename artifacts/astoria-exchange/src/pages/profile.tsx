import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { getGetBusinessQueryKey, getGetDashboardQueryKey, getListBusinessesQueryKey, useCreateBusiness, useGetBusiness, useGetDashboard, useListBusinesses, useUpdateBusiness } from '@workspace/api-client-react';
import { Check, CircleHelp, MapPin, Save, Store, UsersRound } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const profileSchema = z.object({
  name: z.string().min(2, 'Add the name your neighbors know.'),
  type: z.string().min(2, 'Tell the network what kind of place you are.'),
  address: z.string().min(5, 'Add a pickup address.'),
  wasteMaterial: z.string().min(2, 'What useful material do you have?'),
  wasteQuantity: z.string().min(1, 'A rough amount helps us match well.'),
  wantedMaterial: z.string().min(2, 'What would make your work easier?'),
  pickupWindow: z.string().min(2, 'Give neighbors a window for pickup.'),
});
type ProfileValues = z.infer<typeof profileSchema>;
const emptyProfile: ProfileValues = { name: '', type: '', address: '', wasteMaterial: '', wasteQuantity: '', wantedMaterial: '', pickupWindow: '' };

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const dashboard = useGetDashboard({ query: { staleTime: 20000, queryKey: getGetDashboardQueryKey() } });
  const businessId = dashboard.data?.currentBusiness.id ?? 0;
  const businessDetail = useGetBusiness(businessId, { query: { enabled: businessId > 0, queryKey: getGetBusinessQueryKey(businessId), staleTime: 30000 } });
  const businesses = useListBusinesses({ query: { staleTime: 30000, queryKey: getListBusinessesQueryKey() } });
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const [saved, setSaved] = useState(false);
  const initialized = useRef(false);
  const business = businessDetail.data ?? dashboard.data?.currentBusiness;
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: emptyProfile });
  const partnerCount = businesses.data?.length ?? dashboard.data?.stats.localPartners ?? 0;

  useEffect(() => {
    if (business && !initialized.current) {
      initialized.current = true;
      form.reset({
        name: business.name,
        type: business.type,
        address: business.address,
        wasteMaterial: business.wasteMaterial,
        wasteQuantity: business.wasteQuantity,
        wantedMaterial: business.wantedMaterial,
        pickupWindow: business.pickupWindow,
      });
    }
  }, [business, form]);

  const onSaved = (values: ProfileValues, nextId?: number) => {
    setSaved(true);
    initialized.current = true;
    form.reset(values);
    void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
    if (nextId) void queryClient.invalidateQueries({ queryKey: getGetBusinessQueryKey(nextId) });
    window.setTimeout(() => setSaved(false), 3500);
  };

  const onSubmit = (values: ProfileValues) => {
    setSaved(false);
    if (businessId > 0) {
      updateBusiness.mutate({ businessId, data: values }, {
        onSuccess: (nextBusiness) => onSaved(values, nextBusiness.id),
      });
      return;
    }
    createBusiness.mutate({ data: values }, {
      onSuccess: (nextBusiness) => onSaved(values, nextBusiness.id),
    });
  };

  const fields = useMemo(() => [
    { name: 'name' as const, label: 'Business name', placeholder: 'Bean & Bloom Coffee', description: 'The name shown to local partners.' },
    { name: 'type' as const, label: 'What kind of place?', placeholder: 'Coffee shop', description: 'A simple category is perfect.' },
    { name: 'address' as const, label: 'Pickup address', placeholder: '31-18 34th Street', description: 'Keep it specific enough for a neighbor to find.' },
    { name: 'wasteMaterial' as const, label: 'Material you can offer', placeholder: 'Spent coffee grounds', description: 'What is left over that someone else can use?' },
    { name: 'wasteQuantity' as const, label: 'Typical quantity', placeholder: 'About 18 kg / week', description: 'An honest estimate beats a perfect number.' },
    { name: 'wantedMaterial' as const, label: 'Material you want', placeholder: 'Compost for the roof garden', description: 'Name the useful input you are looking for.' },
    { name: 'pickupWindow' as const, label: 'Pickup timing', placeholder: 'Weekdays, 2–5 pm', description: 'When can a partner collect or drop off?' },
  ], []);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 lg:px-11 lg:py-10">
        <section className="animate-rise-in">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Make the handoff legible</p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><h1 data-testid="text-profile-heading" className="font-display text-[42px] leading-none tracking-[-.035em] sm:text-[54px]">Your exchange profile</h1><p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-muted-foreground">A little context makes a better match. Tell Astoria what you have, what you need, and when a neighbor can reach you.</p></div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[11px] font-semibold text-muted-foreground"><UsersRound size={14} className="text-primary" /> {partnerCount} local partners nearby</div>
          </div>
        </section>

        <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="animate-rise-in delay-1 rounded-2xl border border-card-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
              <div className="mb-7 flex items-center gap-3 border-b border-border/70 pb-5"><span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><Store size={18} /></span><div><h2 className="text-[17px] font-extrabold tracking-[-.02em]">The useful details</h2><p className="mt-0.5 text-[11px] text-muted-foreground">This is what neighbors see when we introduce you.</p></div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field, index) => <FormField key={field.name} control={form.control} name={field.name} render={({ field: control }) => <FormItem className={index === 2 || index > 2 ? 'sm:col-span-2' : ''}><FormLabel className="text-[11px] font-extrabold">{field.label}</FormLabel><FormControl><Input {...control} data-testid={`input-profile-${field.name}`} placeholder={field.placeholder} className="mt-1 h-11 rounded-xl border-input bg-background px-3.5 text-[13px] shadow-none focus-visible:ring-primary" /></FormControl><FormDescription className="text-[10px]">{field.description}</FormDescription><FormMessage className="text-[10px]" /></FormItem>} />)}
              </div>
              <div className="mt-8 flex flex-col justify-between gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center">
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><CircleHelp size={14} className="mt-0.5 shrink-0 text-primary" /> Your exact address is only used to estimate routes.</p>
                <button type="submit" disabled={createBusiness.isPending || updateBusiness.isPending} data-testid="button-save-profile" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[12px] font-extrabold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_14px_hsl(var(--primary)/.25)] disabled:cursor-wait disabled:opacity-60">{createBusiness.isPending || updateBusiness.isPending ? 'Saving your loop…' : saved ? <><Check size={15} /> Profile saved</> : <><Save size={15} /> Save profile</>}</button>
              </div>
              {(createBusiness.isError || updateBusiness.isError) && <p data-testid="status-profile-error" className="mt-3 text-right text-[11px] font-semibold text-destructive">We couldn’t save that just now. Check your connection and try again.</p>}
            </form>
          </Form>

          <aside className="animate-rise-in delay-2 space-y-4">
            <div className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
              <p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-secondary-foreground/55">Why these questions?</p>
              <h2 className="mt-3 text-[21px] font-display leading-tight">Specific beats impressive.</h2>
              <p className="mt-3 text-[12px] leading-relaxed text-secondary-foreground/70">“Some grounds” is hard to plan around. “18 kg every week, after 2 pm” gives a neighbor a real reason to say yes.</p>
              <div className="mt-5 border-t border-secondary-foreground/15 pt-4 text-[11px] leading-relaxed text-secondary-foreground/65"><MapPin size={14} className="mb-2 text-primary" /> Astoria businesses are matched by material fit, distance, and a pickup time that respects the workday.</div>
            </div>
            {business && <div className="rounded-2xl border border-card-border bg-card p-5 shadow-[var(--shadow-sm)]"><p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-primary">Current location</p><p data-testid="text-profile-location" className="mt-3 text-[13px] font-bold">{business.address}</p><p className="mt-1 text-[11px] text-muted-foreground">{business.neighborhood}, Queens</p><button type="button" data-testid="button-back-dashboard" onClick={() => setLocation('/')} className="focus-ring mt-4 inline-flex items-center text-[11px] font-bold text-primary hover:underline">Back to overview</button></div>}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}