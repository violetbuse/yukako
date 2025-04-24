import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from "@/client/components/ui/sidebar"
import { OrganizationSwitcher, RedirectToSignIn, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react"
import { WorkerSwitcher } from "@/client/components/worker_switcher"
import { useAuth } from "@clerk/clerk-react";
import { ThemeButton } from "@/client/components/theme-button";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
            <SignedIn>
                <SidebarProvider>
                    <AdminSidebar />
                    <SidebarInset className="p-2">
                        <header className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger />
                                <p>/</p>
                                <OrganizationSwitcher />
                                <p>/</p>
                                <WorkerSwitcher />
                            </div>
                            <div>
                                <ThemeButton />
                            </div>
                        </header>
                        {children}
                    </SidebarInset>
                </SidebarProvider>
            </SignedIn>
        </div>
    )
}

const AdminSidebar = () => {

    const { user } = useUser();

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader>

            </SidebarHeader>
            <SidebarContent>

            </SidebarContent>
            <SidebarFooter>
                <div className="flex items-center gap-2">
                    <UserButton />
                    <p className="text-sm text-muted-foreground truncate">{user?.emailAddresses[0].emailAddress}</p>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}