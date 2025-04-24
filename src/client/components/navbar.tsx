import { OrganizationSwitcher, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "wouter";

export const HomeNavbar = () => {

    const isAdminPage = window.location.pathname.startsWith("/admin");

    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-lg font-semibold text-white">
                            Yukako
                        </Link>
                        <SignedIn>
                            {!isAdminPage && (
                                <Link href="/admin" className="text-white ml-4">
                                    Dashboard
                                </Link>
                            )}
                            {isAdminPage && (<>
                                <p className="text-white text-lg mx-4">/</p>
                                <OrganizationSwitcher afterCreateOrganizationUrl="/admin" />
                            </>)}
                        </SignedIn>
                    </div>
                    <div className="flex items-center">
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
