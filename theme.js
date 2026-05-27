/**
 * HabitFlow Theme Management
 * Handles Light/Dark mode switching and persistence
 */

(function() {
    // 1. Theme State Management
    const THEME_KEY = 'habitflow_theme';
    const darkThemeClass = 'dark-mode';
    
    // Detect saved theme or system preference
    const getSavedTheme = () => localStorage.getItem(THEME_KEY);
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Apply theme to document
    const applyTheme = (theme) => {
        const target = document.body || document.documentElement;
        if (theme === 'dark') {
            target.classList.add(darkThemeClass);
        } else {
            target.classList.remove(darkThemeClass);
        }
    };

    // Initialize theme immediately to prevent flicker
    const initialTheme = getSavedTheme() || getSystemTheme();
    // Default to light if no preference as per requirement
    const finalInitialTheme = getSavedTheme() ? initialTheme : 'light'; 
    applyTheme(finalInitialTheme);

    // 2. Toggle Logic
    window.toggleTheme = function() {
        const isDark = (document.body || document.documentElement).classList.contains(darkThemeClass);
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
        
        // Update theme label text
        const updateLabels = () => {
            const isDark = document.body.classList.contains(darkThemeClass);
            document.querySelectorAll('.theme-label').forEach(label => {
                label.textContent = isDark ? 'Dark' : 'Light';
            });
        };

        toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.toggleTheme();
                updateLabels();
            });
        });

        // Set initial label
        updateLabels();

        if (window.lucide) {
            lucide.createIcons();
        }

        // --- Mobile Menu Toggle logic ---
        const toggleBtn = document.getElementById('mobileMenuToggle');
        const drawer = document.getElementById('mobileMenuDrawer');
        const overlay = document.getElementById('mobileMenuOverlay');
        const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-menu-drawer .btn');

        if (toggleBtn && drawer && overlay) {
            const toggleMobileMenu = () => {
                toggleBtn.classList.toggle('active');
                drawer.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
            };

            const closeMobileMenu = () => {
                toggleBtn.classList.remove('active');
                drawer.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            };

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMobileMenu();
            });

            overlay.addEventListener('click', closeMobileMenu);

            mobileLinks.forEach(link => {
                link.addEventListener('click', closeMobileMenu);
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && drawer.classList.contains('active')) {
                    closeMobileMenu();
                }
            });
        }
    });
})();

