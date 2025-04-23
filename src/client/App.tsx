import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '@/api/routers';
import React, { useState } from 'react'
import { TRPCProvider } from '@/client/trpc_client';
import { HomeNavbar } from '@/client/components/navbar';
import { Route, Switch } from 'wouter';
import { Home } from '@/client/pages/home';
import { WorkOsWidgets } from '@workos-inc/widgets'
import { AccountManagement } from '@/client/pages/account_management';
import { AuthKitProvider } from '@workos-inc/authkit-react';

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
const redirectUri = `${window.location.origin}/login`;

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
                <AuthKitProvider clientId={import.meta.env.VITE_PUBLIC_WORKOS_CLIENT_ID} redirectUri={redirectUri}>
                    <WorkOsWidgets>
                        <Switch>
                            <Route path="/" component={Home} />
                            <Route path="/account" component={AccountManagement} />
                        </Switch>
                    </WorkOsWidgets>
                </AuthKitProvider>
            </TRPCProvider>
        </QueryClientProvider>
    )
}

export default App 