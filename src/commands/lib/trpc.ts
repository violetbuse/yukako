import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/api/routers";
import { cli_yukako_url } from "@/commands/lib/invariants";
import { get_auth_token } from "@/commands/lib/config";

const url = `${cli_yukako_url}/api/trpc`

export const trpc = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url,
            async headers() {
                const token = await get_auth_token();

                return {
                    Authorization: `Bearer ${token}`
                }
            }
        }),
    ],
});
