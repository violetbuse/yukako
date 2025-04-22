import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../api/server";

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();