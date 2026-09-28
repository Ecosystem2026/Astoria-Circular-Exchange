import { useEffect, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignIn, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { HelpChat } from '@/components/help-chat';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import DashboardPage from '@/pages/dashboard';
import MatchesPage from '@/pages/matches';
import ProfilePage from '@/pages/profile';
import SignUpPage, { SIGNUP_DRAFT_KEY } from '@/pages/sign-up';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#ee7953',
    colorForeground: '#163b45',
    colorMutedForeground: '#6d7675',
    colorDanger: '#b53e38',
    colorBackground: '#fffdf8',
    colorInput: '#fffdf8',
    colorInputForeground: '#163b45',
    colorNeutral: '#d8d0c1',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf8] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#163b45] font-extrabold',
    headerSubtitle: 'text-[#6d7675]',
    socialButtonsBlockButtonText: 'text-[#163b45]',
    formFieldLabel: 'text-[#163b45]',
    footerActionLink: 'text-[#d95f3f] font-bold',
    footerActionText: 'text-[#6d7675]',
    dividerText: 'text-[#6d7675]',
    formButtonPrimary: 'bg-[#ee7953] text-[#163b45] hover:bg-[#e76a47]',
    formFieldInput: 'border-[#d8d0c1] bg-[#fffdf8] text-[#163b45]',
    footerAction: 'text-[#6d7675]',
    dividerLine: 'bg-[#d8d0c1]',
    alertText: 'text-[#b53e38]',
    alert: 'bg-[#fff1ef]',
    main: 'bg-[#fffdf8]',
  },
};

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/matches" component={MatchesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpRoute} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpRoute() {
  return <SignUpPage basePath={basePath} appearance={clerkAppearance} />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        previousUserId.current !== undefined &&
        previousUserId.current !== userId
      ) {
        queryClient.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

function SignupMetadataBridge() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    const rawDraft = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as {
        accountType?: 'business' | 'individual';
        categories?: string[];
      };
      if (!draft.accountType) return;
      void user
        .update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            accountType: draft.accountType,
            businessCategories: draft.categories ?? [],
          },
        })
        .then(() => window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY));
    } catch {
      window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
    }
  }, [user]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to access your exchange account',
          },
        },
        signUp: {
          start: {
            title: 'Create your exchange account',
            subtitle: 'Join local reuse in Astoria',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <SignupMetadataBridge />
      <Router />
    </ClerkProvider>
  );
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
        <HelpChat />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
