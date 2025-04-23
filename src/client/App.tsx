import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '@/api/routers';
import React, { useState } from 'react'
import { TRPCProvider } from '@/client/trpc_client';
import { HomeNavbar } from '@/client/components/navbar';
import { Route, Switch } from 'wouter';
import { Home } from '@/client/pages/home';

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

    console.log(trpcURL);

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                <Switch>
                    <Route path="/" component={Home} />
                </Switch>
            </TRPCProvider>
        </QueryClientProvider>
    )
}

export default App 