import { authed_procedure, public_procedure } from "@/api/server";
import { router } from "@/api/server";
import { db } from "@/db";
import { sync_organization, workos } from '@/auth/workos'
import { organizations } from "@/db/schema";
import { z } from "zod";

export const organization_router = router({
    create_organization: authed_procedure.input(z.object({
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const new_org = await workos.organizations.createOrganization({
            name: input.name,
        })

        await workos.userManagement.createOrganizationMembership({
            userId: ctx.user_id,
            organizationId: new_org.id,
            roleSlug: 'admin'
        })

        await sync_organization(new_org.id);

        return new_org.id;
    }),
});
