import { HomeNavbar } from "@/client/components/home_navbar"

export const MainLayout = ({ children }: { children?: React.ReactNode | React.ReactNode[] | undefined | null }) => {
    return (
        <div>
            <HomeNavbar />
            {children}
        </div>
    )
}
