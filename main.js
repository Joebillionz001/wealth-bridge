import { initAuth } from './auth.js';
import { initDashboard } from './dashboard.js';
import { initInvestmentsPage } from './investments.js';
import { initPortfolioPage } from './portfolio.js';
import { initProfilePage } from './profile.js';
import { initSettingsPage } from './settings.js';
import { initKycPage } from './kyc.js';
import { initAdminPage } from './admin.js';
import { initContactPage } from './contact.js';
import { initTestimonialsPage } from './testimonials.js';
import { initPlanDetailsPage } from './plan-details.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Authentication & Global Navigation
    initAuth();

    // 2. Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Check saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // 3. Mobile Menu Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    // Create overlay dynamically
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    if (navToggle && mainNav) {
        const toggleMenu = (forceClose = false) => {
            const isOpening = !mainNav.classList.contains('active');
            
            if (forceClose && !mainNav.classList.contains('active')) return;

            if (forceClose) {
                mainNav.classList.remove('active');
                navToggle.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                mainNav.classList.toggle('active');
                navToggle.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = isOpening ? 'hidden' : '';
            }
        };

        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close when clicking overlay
        overlay.addEventListener('click', () => toggleMenu(true));

        // Close when clicking a link inside the menu
        mainNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') toggleMenu(true);
        });

        // Close menu if window is resized to desktop view
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) toggleMenu(true);
        });
    }

    // 4. Route-Specific Initialization
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
        initDashboard();
    } else if (path.includes('investments.html')) {
        initInvestmentsPage();
    } else if (path.includes('my-portfolio.html')) {
        initPortfolioPage();
    } else if (path.includes('profile.html')) {
        initProfilePage();
    } else if (path.includes('settings.html')) {
        initSettingsPage();
    } else if (path.includes('kyc.html')) {
        initKycPage();
    } else if (path.includes('admin.html')) {
        initAdminPage();
    } else if (path.includes('contact.html')) {
        initContactPage();
    } else if (path.includes('testimonials.html')) {
        initTestimonialsPage();
    } else if (path.includes('plan-details.html')) {
        initPlanDetailsPage();
    }

    // 5. Sticky Header Scroll Effect
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }

    // 6. Hero Parallax Effect
    const heroVisual = document.querySelector('.hero-visual');
    const heroSection = document.querySelector('.hero');

    if (heroVisual && heroSection) {
        window.addEventListener('scroll', () => {
            // Only animate on desktop to prevent layout jumps on mobile
            if (window.innerWidth > 768) {
                const scrollPosition = window.scrollY;
                if (scrollPosition < heroSection.offsetHeight) {
                    // Move the visual element at 40% of the scroll speed
                    heroVisual.style.transform = `translateY(${scrollPosition * 0.4}px)`;
                }
            } else {
                heroVisual.style.transform = 'none';
            }
        });
    }
});