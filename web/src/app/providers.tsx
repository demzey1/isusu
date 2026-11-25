"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { publicClient } from "@/lib/client";
import { isConfigured } from "@/lib/config";

function ChainWatcher({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    if (!isConfigured) return;
    const unwatch = publicClient.watchBlocks({
      emitOnBegin: false,
      poll: true,
      onBlock: () => {
        void queryClient.invalidateQueries();
      },
    });
    return () => unwatch();
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 3_000,
            refetchInterval: 6_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ChainWatcher queryClient={queryClient} />
      {children}
    </QueryClientProvider>
  );
}
