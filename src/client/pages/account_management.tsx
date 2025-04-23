import { HomeNavbarHorizontalPadding } from "@/client/components/navbar"
import { MainLayout } from "@/client/layouts/main"
import { useTRPC } from "@/client/trpc_client"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@workos-inc/authkit-react"
import { UserProfile } from "@workos-inc/widgets"


export const AccountManagement = () => {

    const { getAccessToken } = useAuth();

    return (
        <MainLayout>
            <HomeNavbarHorizontalPadding>
                <h1>Account Management</h1>
                <UserProfile authToken={getAccessToken} />
            </HomeNavbarHorizontalPadding>
        </MainLayout>
    )
}
