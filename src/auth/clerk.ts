import { createClerkClient } from "@clerk/express";

export const CLERK_PUBLIC_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_PUBLIC_KEY || !CLERK_SECRET_KEY) {
    throw new Error("CLERK_PUBLIC_KEY and CLERK_SECRET_KEY must be set");
}

export const clerk_client = createClerkClient({
    publishableKey: CLERK_PUBLIC_KEY,
    secretKey: CLERK_SECRET_KEY,
})
