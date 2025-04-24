import { OrganizationSwitcher, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "wouter";
import { WorkerSwitcher } from "./worker_switcher";
import { useTheme } from "@/client/components/theme-provider";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/client/components/ui/button";

export const HomeNavbar = () => {

    const { theme, setTheme } = useTheme();

    return (
        <nav className="">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-lg font-semibold text-primary">
                            Yukako
                        </Link>
                        <SignedIn>
                            <p className="text-primary text-lg ml-4 mr-3">/</p>
                            <OrganizationSwitcher afterCreateOrganizationUrl="/admin" />
                            <p className="text-primary text-lg ml-4 mr-3">/</p>
                            <WorkerSwitcher />
                        </SignedIn>
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" className="px-2 mr-4" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                            {theme === "dark" ? <MoonIcon /> : <SunIcon />}
                        </Button>
                        <SignedOut>
                            <SignInButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
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
