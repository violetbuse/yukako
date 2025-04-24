import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import App from './App'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
    throw new Error('CLERK_PUBLISHABLE_KEY is not set');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={{
            baseTheme: dark,
            variables: {
                colorBackground: '#111827',
            }
        }}>
            <App />
        </ClerkProvider>
    </React.StrictMode>,
) 