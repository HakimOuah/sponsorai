"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createIntentPrefetcher,
  isWorkspacePath,
  type ConnectionPreference,
} from "@/lib/navigation";

type NavigateOptions = { scroll?: boolean };
type NavigationContextValue = {
  pendingHref: string | null;
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  prefetch: (href: string) => void;
  registerLoading: () => () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation() {
  return useContext(NavigationContext);
}

export function useNavigationRouter() {
  const router = useRouter();
  const navigation = useNavigation();
  return useMemo(
    () =>
      navigation
        ? { ...router, push: navigation.push, replace: navigation.replace }
        : router,
    [router, navigation],
  );
}

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [destination, setDestination] = useState<string | null>(null);
  const [historyDestination, setHistoryDestination] = useState<string | null>(
    null,
  );
  const [loadingCount, setLoadingCount] = useState(0);
  const committedRoute = useRef("");
  const intentPrefetch = useMemo(
    () => createIntentPrefetcher((href) => router.prefetch(href)),
    [router],
  );

  const navigate = useCallback(
    (href: string, options: NavigateOptions | undefined, replace: boolean) => {
      setDestination(href);
      setHistoryDestination(null);
      startTransition(() => {
        if (replace) router.replace(href, options);
        else router.push(href, options);
      });
    },
    [router],
  );
  const push = useCallback(
    (href: string, options?: NavigateOptions) => navigate(href, options, false),
    [navigate],
  );
  const replace = useCallback(
    (href: string, options?: NavigateOptions) => navigate(href, options, true),
    [navigate],
  );
  const prefetch = useCallback(
    (href: string) => {
      const connection = (
        navigator as Navigator & { connection?: ConnectionPreference }
      ).connection;
      intentPrefetch(href, window.location.href, connection);
    },
    [intentPrefetch],
  );
  const registerLoading = useCallback(() => {
    setLoadingCount((count) => count + 1);
    return () => setLoadingCount((count) => Math.max(0, count - 1));
  }, []);
  const handleCommit = useCallback((route: string) => {
    committedRoute.current = route;
    setHistoryDestination(null);
  }, []);

  useEffect(() => {
    const handleHistory = () => {
      const search = new URLSearchParams(window.location.search).toString();
      const route = window.location.pathname + (search ? `?${search}` : "");
      if (
        isWorkspacePath(window.location.pathname) &&
        route !== committedRoute.current
      ) {
        setHistoryDestination(route);
      }
    };
    window.addEventListener("popstate", handleHistory);
    return () => window.removeEventListener("popstate", handleHistory);
  }, []);

  const pendingHref = isPending ? destination : historyDestination;
  const busy = isPending || Boolean(historyDestination) || loadingCount > 0;
  const value = useMemo(
    () => ({ pendingHref, push, replace, prefetch, registerLoading }),
    [pendingHref, push, replace, prefetch, registerLoading],
  );

  return (
    <NavigationContext.Provider value={value}>
      <Suspense fallback={null}>
        <NavigationCommitObserver onCommit={handleCommit} />
      </Suspense>
      {busy ? (
        <div
          className="app-navigation-progress"
          role="progressbar"
          aria-label="Chargement de la page"
        >
          <span />
        </div>
      ) : null}
      <span role="status" aria-live="polite" className="sr-only">
        {busy ? "Chargement de la page en cours" : ""}
      </span>
      {children}
    </NavigationContext.Provider>
  );
}

function NavigationCommitObserver({
  onCommit,
}: {
  onCommit: (route: string) => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    onCommit(pathname + (search ? `?${search}` : ""));
  }, [pathname, search, onCommit]);
  return null;
}
