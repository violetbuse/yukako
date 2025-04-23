import { public_procedure, router } from "@/api/server";
import { sync_user } from "@/auth/workos";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const user_router = router({
    self: public_procedure.output(z.object({
        id: z.string(),
        email: z.string(),
        organizations: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    }).nullable()).query(async ({ ctx }) => {
        if (!ctx.user) {
            return null;
        }

        const db_user = await db.query.users.findFirst({
            where: eq(users.id, ctx.user),
        });

        if (!db_user) {
            await sync_user(ctx.user);
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, ctx.user),
            with: {
                organization_memberships: {
                    with: {
                        organization: true,
                    }
                }
            }
        });

        if (!user) {
            return null;
        }

        const organizations = user.organization_memberships.map((membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
        }));

        return {
            id: user.id,
            email: user.email,
            organizations,
        }
    })
})
