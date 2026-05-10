// theme.js
document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.theme-toggle');
    const STORAGE_KEY = 'theme-pref';

    const getPreferredTheme = () => {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        document.querySelectorAll('.theme-label').forEach(label => {
            label.textContent = theme === 'dark' ? 'Dark' : 'Light';
        });
    };

    setTheme(getPreferredTheme());

    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode');
            const newTheme = isDark ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem(STORAGE_KEY, newTheme);
        });
    });
});
