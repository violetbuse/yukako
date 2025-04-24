import { HomeNavbarHorizontalPadding } from "@/client/components/navbar"
import { MainLayout } from "@/client/layouts/main"

export const Home = () => {
    return (
        <MainLayout>
            <HomeNavbarHorizontalPadding className="py-4">
                <div className="flex justify-center pt-48">
                    <p className="text-8xl font-bold text-center">
                        The Workers Runtime for Developers who Ship
                    </p>
                </div>
            </HomeNavbarHorizontalPadding>
        </MainLayout>
    )
}