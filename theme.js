/**
 * HabitFlow Theme Management
 * Handles Light/Dark mode switching and persistence
 */

(function() {
    // 1. Theme State Management
    const THEME_KEY = 'habitflow_theme';
    const darkThemeClass = 'dark-theme';
    
    // Detect saved theme or system preference
    const getSavedTheme = () => localStorage.getItem(THEME_KEY);
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Apply theme to document
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add(darkThemeClass);
        } else {
            document.documentElement.classList.remove(darkThemeClass);
        }
    };

    // Initialize theme immediately to prevent flicker
    const initialTheme = getSavedTheme() || getSystemTheme();
    // Default to light if no preference as per requirement
    const finalInitialTheme = getSavedTheme() ? initialTheme : 'light'; 
    applyTheme(finalInitialTheme);

    // 2. Toggle Logic
    window.toggleTheme = function() {
        const isDark = document.documentElement.classList.contains(darkThemeClass);
        const newTheme = isDark ? 'light' : 'dark';
        
        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        
        // Update icons if they exist (Lucide)
        if (window.lucide) {
            lucide.createIcons();
        }
    };

    // 3. UI Integration
    document.addEventListener('DOMContentLoaded', () => {
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        
        toggleButtons.forEach(btn => {
            btn.innerHTML = `
                <i data-lucide="sun" class="sun-icon" style="width:14px;height:14px;"></i>
                <i data-lucide="moon" class="moon-icon" style="width:14px;height:14px;"></i>
            `;
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.toggleTheme();
            });
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    });
})();
