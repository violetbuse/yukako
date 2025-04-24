import { HomeNavbar, HomeNavbarHorizontalPadding } from "@/client/components/home_navbar";
import { AdminLayout } from "@/client/layouts/admin";
import { useTRPC } from "@/client/trpc_client";
import { OrganizationProfile, useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

export const AdminHome = () => {

    const { orgId } = useAuth()

    return (
        <AdminLayout>
        </AdminLayout>
    )
}
