import { HomeNavbarHorizontalPadding } from "@/client/components/navbar"
import { MainLayout } from "@/client/layouts/main"

export const Home = () => {
    return (
        <MainLayout>
            <HomeNavbarHorizontalPadding className="py-4">
                <h1>Home</h1>
            </HomeNavbarHorizontalPadding>
        </MainLayout>
    )
}