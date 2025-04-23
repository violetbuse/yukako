import { useTRPC } from "@/client/trpc_client"
import { useQuery } from "@tanstack/react-query";

export const HomeNavbar = () => {
    const trpc = useTRPC();
    const self_query = useQuery(trpc.user.self.queryOptions());

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
                        {self_query.data ? (
                            <a
                                href="/api/auth/logout"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Logout
                            </a>
                        ) : (
                            <a
                                href="/api/auth/login"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Login
                            </a>
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
