import { useEffect } from "react";

import useLocalStorageState from "use-local-storage-state";

import type { ColorTheme } from "@/context/colorThemeContext";
import { isColorTheme } from "@/context/colorThemeContext";

export default function useColorTheme(): [ColorTheme, (colorTheme: ColorTheme) => void] {
    const [theme, setTheme] = useLocalStorageState<ColorTheme>("theme", { defaultValue: "system" });

    useEffect(() => {
        const injectedColorTheme = document.documentElement.dataset.theme;
        if (isColorTheme(injectedColorTheme)) {
            setTheme(injectedColorTheme);
        }
    }, [setTheme]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    return [theme, setTheme];
}
