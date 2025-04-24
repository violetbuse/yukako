import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import App from './App'
import { ThemeProvider } from '@/client/components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider defaultTheme="dark">
            <App />
        </ThemeProvider>
    </React.StrictMode>,
) 