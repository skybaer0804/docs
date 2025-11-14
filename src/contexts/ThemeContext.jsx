import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';

/**
 * ThemeContext
 * 다크모드/라이트모드 테마 관리를 위한 Context
 */
export const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => {},
});

/**
 * useTheme Hook
 * ThemeContext를 사용하기 위한 Hook
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        console.warn('useTheme must be used within ThemeProvider');
        return { theme: 'light', toggleTheme: () => {} };
    }
    return context;
}

/**
 * ThemeProvider 컴포넌트
 * 테마 상태를 관리하고 localStorage에 저장
 */
export function ThemeProvider({ children }) {
    // localStorage에서 테마 읽기 (없으면 시스템 설정 또는 기본값 'light')
    const getInitialTheme = () => {
        if (typeof window === 'undefined') return 'light';

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }

        // 시스템 설정 확인
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        // body에 data-theme 속성 추가
        if (typeof document !== 'undefined') {
            document.body.setAttribute('data-theme', theme);
            document.documentElement.setAttribute('data-theme', theme);

            // localStorage에 저장
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    // 시스템 테마 변경 감지
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            // localStorage에 저장된 테마가 없을 때만 시스템 설정 따름
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
