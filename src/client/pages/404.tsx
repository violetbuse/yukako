import { SignedIn } from '@clerk/clerk-react';
import { Link } from 'wouter';

export function NotFound() {

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-gray-900">404</h1>
                <h2 className="mt-4 text-3xl font-semibold text-gray-800">Page Not Found</h2>
                <p className="mt-2 text-lg text-gray-600">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="mt-6 flex flex-col gap-2 w-fit justify-center items-center mx-auto">
                    <Link
                        href="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Go back home
                    </Link>
                    <SignedIn>
                        <Link
                            href="/admin"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to Dashboard
                        </Link>
                    </SignedIn>
                </div>
            </div>
        </div>
    );
} 