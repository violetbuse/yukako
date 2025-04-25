import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '@/api/routers';
import React, { useEffect, useState } from 'react'
import { TRPCProvider } from '@/client/trpc_client';
import { HomeNavbar } from '@/client/components/home_navbar';
import { Route, Switch } from 'wouter';
import { Home } from '@/client/pages/home';
import { AdminHome } from '@/client/pages/admin/main';
import { ClerkProvider } from '@clerk/clerk-react';
import { useTheme } from '@/client/components/theme-provider';
import { dark } from '@clerk/themes';
import { QueryInvalidator } from '@/client/components/query-invalidator';
import { NotFound } from '@/client/pages/404';
import { WorkerProvider } from '@/client/components/worker_switcher';
import { MainLayout } from '@/client/layouts/main';
import { AdminCodeSource } from '@/client/pages/admin/view_source';
import { AdminHostnames } from '@/client/pages/admin/hostnames';
import { Toaster } from '@/client/components/ui/sonner';

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    throw new Error('CLERK_PUBLISHABLE_KEY is not set');
}

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            }
        }
    })
}

let browserQueryClient: QueryClient | null = null;

function getQueryClient() {
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

const trpcURL = `${window.location.origin}/api/trpc`;

function App() {
    const queryClient = getQueryClient();
    const [trpcClient] = useState(() => createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                url: trpcURL,
            })
        ]
    }));

    const { theme } = useTheme();

    return (
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} appearance={{ baseTheme: theme === "dark" ? dark : undefined }}>
            <QueryClientProvider client={queryClient}>
                <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                    <WorkerProvider>
                        <QueryInvalidator />
                        <Toaster />
                        <Switch>
                            <Route path="/" component={Home} />
                            <Route path="/admin" component={AdminHome} />
                            <Route path="/admin/code/:script_id" component={AdminCodeSource} />
                            <Route path="/admin/hostnames" component={AdminHostnames} />
                            <Route component={NotFound} />
                        </Switch>
                    </WorkerProvider>
                </TRPCProvider>
            </QueryClientProvider>
        </ClerkProvider>
    )
}

export default App 