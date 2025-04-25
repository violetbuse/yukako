import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/client/components/ui/sidebar"
import { OrganizationSwitcher, RedirectToSignIn, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react"
import { WorkerSwitcher, useWorkerSelection, NewWorkerButton } from "@/client/components/worker_switcher"
import { useAuth } from "@clerk/clerk-react";
import { ThemeButton } from "@/client/components/theme-button";
import { ChevronRight, Code } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/client/components/ui/collapsible";
import { useTRPC } from "@/client/trpc_client";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { Link as LinkIcon } from "lucide-react";

export const AdminLayout = ({ children }: { children?: React.ReactNode }) => {

    const { selected_worker_id } = useWorkerSelection();

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
                        {selected_worker_id && <>
                            {children}
                        </>}
                        {!selected_worker_id && <>
                            <div className="flex flex-col items-center justify-center h-full">
                                <div>
                                    <h1 className="text-3xl font-bold mb-4">Welcome to Yukako!</h1>
                                    <p className="text-lg text-muted-foreground mb-6">It looks like you haven't selected a worker yet. Let's get started by creating your first worker!</p>
                                    <NewWorkerButton />
                                </div>
                            </div>
                        </>}
                    </SidebarInset>
                </SidebarProvider>
            </SignedIn>
        </div>
    )
}

const AdminSidebar = () => {

    const { user } = useUser();
    const { open } = useSidebar();

    const { selected_worker_name } = useWorkerSelection();

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader>
                {open && <h1 className="text-lg font-semibold truncate">Yukako</h1>}
                <h3 className="text-sm text-muted-foreground truncate">{selected_worker_name || "No worker selected"}</h3>
            </SidebarHeader>
            <SidebarContent>
                <SidebarDeveloper />
            </SidebarContent>
            <SidebarFooter>
                <div className="flex items-center gap-2">
                    <UserButton />
                    {open && <p className="text-sm text-muted-foreground truncate ml-2">{user?.emailAddresses[0].emailAddress}</p>}
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}

const SidebarDeveloper = () => {

    const [code_collapsed, setCodeCollapsed] = useState(() => {
        const savedState = localStorage.getItem('code_collapsed');
        return savedState ? JSON.parse(savedState) : false;
    });

    useEffect(() => {
        localStorage.setItem('code_collapsed', JSON.stringify(code_collapsed));
    }, [code_collapsed]);


    const trpc = useTRPC()
    const files = useQuery(trpc.workers.get_source.queryOptions());

    console.log(files.status)

    const [match_code, code_params] = useRoute("/admin/code/:script_id");
    const [match_hostnames] = useRoute("/admin/hostnames");

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Developers</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible asChild open={!code_collapsed} onOpenChange={() => setCodeCollapsed(!code_collapsed)} className="group/collapsible">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton isActive={match_code && code_collapsed} tooltip="Worker Source Code">
                                <Code />
                                <span className="ml-2 truncate">Source Code</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {files.status === "success" && files.data?.map((file) => (
                                    <SidebarMenuSubItem key={file.id}>
                                        <SidebarMenuSubButton isActive={match_code && code_params?.script_id === file.id} asChild>
                                            <Link href={`/admin/code/${file.id}`}>
                                                <span className="truncate">{file.name}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Domains & Hostnames" isActive={match_hostnames}>
                        <Link href="/admin/hostnames">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            <span className="truncate">Domains &amp; Hostnames</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    )
}