import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '@/api/routers';
import React, { useState } from 'react'
import { TRPCProvider } from '@/client/trpc_client';
import { Navbar } from '@/client/components/navbar';

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
                <Navbar />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">

                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Yukako</h1>
                        <p className="text-gray-600">Your React application is ready!</p>
                    </div>
                </div>
            </TRPCProvider>
        </QueryClientProvider>
    )
}

export default App 