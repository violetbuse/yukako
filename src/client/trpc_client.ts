import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@/api/routers";

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();