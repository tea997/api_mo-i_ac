import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

const themes = {
    purple: {
        name: 'Purple',
        description: 'Beautiful purple theme with glass effects',
        class: 'theme-purple'
    },
    light: {
        name: 'Light',
        description: 'Clean white theme for better readability',
        class: 'theme-light'
    }
};

export function ThemeProvider({ children }) {
    const [currentTheme] = useState('light');

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-purple');
        root.classList.add('theme-light');
        localStorage.setItem('app-theme', 'light');
    }, []);

    const switchTheme = () => {};

    const value = {
        currentTheme,
        themes: { light: themes.light },
        switchTheme,
        theme: themes.light
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}