import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "@/pages/home";
const Practice = lazy(() => import("@/pages/practice"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Wegenz...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/practice/:batchId" component={Practice} />
          <Route path="/:batchId" component={Practice} />
        </Switch>
      </Suspense>
    </QueryClientProvider>
  );
}
