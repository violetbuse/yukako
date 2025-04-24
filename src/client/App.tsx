import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '@/api/routers';
import React, { useEffect, useState } from 'react'
import { TRPCProvider } from '@/client/trpc_client';
import { HomeNavbar } from '@/client/components/navbar';
import { Route, Switch } from 'wouter';
import { Home } from '@/client/pages/home';
import { AdminHome } from '@/client/pages/admin/home';
import { useAuth } from '@clerk/clerk-react';

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

    const { isSignedIn, userId, orgId, orgRole } = useAuth()

    useEffect(() => {
        // when auth state changes, invalidate all queries
        queryClient.invalidateQueries()
    }, [isSignedIn, userId, orgId, orgRole])


    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/admin" component={AdminHome} />
                </Switch>
            </TRPCProvider>
        </QueryClientProvider>
    )
}

export default App 