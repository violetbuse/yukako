import { HomeNavbar, HomeNavbarHorizontalPadding } from "@/client/components/navbar";
import { useTRPC } from "@/client/trpc_client";
import { OrganizationProfile, useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

export const AdminHome = () => {

    const { orgId } = useAuth()

    const trpc = useTRPC()
    const { data } = useQuery(trpc.me.queryOptions())

    console.log({
        user_id: data?.user_id,
        org_id: data?.organization_id,
        org_role: data?.org_role,
        org_slug: data?.org_slug
    })

    return (
        <div>
            <HomeNavbar />
            <HomeNavbarHorizontalPadding className="mt-4">
                {orgId && <OrganizationProfile />}
            </HomeNavbarHorizontalPadding>
        </div>
    )
}
