import { OrganizationSwitcher, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "wouter";
import { WorkerSwitcher } from "./worker_switcher";
import { useTheme } from "@/client/components/theme-provider";
import { ExternalLink, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import { ThemeButton } from "./theme-button";

export const HomeNavbar = () => {

    const { theme, setTheme } = useTheme();
    const is_admin = window.location.pathname.includes("/admin");

    return (
        <nav className="">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-lg font-semibold text-primary">
                            Yukako
                        </Link>
                        <SignedIn>
                            <div className="ml-4">
                                <Link href="/admin" className="text-muted-foreground text-sm flex items-center">
                                    Dashboard
                                    <ExternalLink className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        </SignedIn>
                    </div>
                    <div className="flex items-center">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button>Sign In</Button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton showName={true} />
                        </SignedIn>
                        <ThemeButton className="ml-4" />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export const HomeNavbarHorizontalPadding = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
            {children}
        </div>
    )
}
