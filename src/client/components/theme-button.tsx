import { SunIcon } from "lucide-react"
import { Button } from "@/client/components/ui/button";
import { MoonIcon } from "lucide-react";
import { useTheme } from "@/client/components/theme-provider";

export const ThemeButton = () => {

    const { theme, setTheme } = useTheme();

    return (
        <Button variant="outline" className="px-2 mr-4 shadow-xs" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
        </Button>
    )
}