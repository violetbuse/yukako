import { HomeNavbar, HomeNavbarHorizontalPadding } from "@/client/components/navbar";
import { useTRPC } from "@/client/trpc_client";
import { OrganizationProfile, useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

export const AdminHome = () => {

    const { orgId } = useAuth()

    return (
        <div>
            <HomeNavbar />
            <HomeNavbarHorizontalPadding className="mt-4">
                {orgId && <OrganizationProfile />}
            </HomeNavbarHorizontalPadding>
        </div>
    )
}
