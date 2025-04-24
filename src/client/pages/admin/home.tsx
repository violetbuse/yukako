import { HomeNavbar, HomeNavbarHorizontalPadding } from "@/client/components/navbar";

export const AdminHome = () => {
    return (
        <div>
            <HomeNavbar />
            <HomeNavbarHorizontalPadding className="mt-4">
                <h1>Admin Home</h1>
            </HomeNavbarHorizontalPadding>
        </div>
    )
}
