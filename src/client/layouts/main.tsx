import { HomeNavbar } from "@/client/components/navbar"

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <HomeNavbar />
            {children}
        </div>
    )
}
