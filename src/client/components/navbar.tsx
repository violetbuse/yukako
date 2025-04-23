import { useAuth } from "@workos-inc/authkit-react";

export const HomeNavbar = () => {
    const { user, isLoading, signIn, signOut } = useAuth();

    console.log("user", user);
    console.log("isLoading", isLoading);

    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <a href="/" className="text-xl font-semibold text-white">
                            Yukako
                        </a>
                    </div>
                    <div className="flex items-center">
                        {!isLoading && !user && (
                            <button onClick={() => signIn()}>
                                Login
                            </button>
                        )}
                        {user && (
                            <button onClick={() => signOut()}>
                                Logout
                            </button>
                        )}
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
