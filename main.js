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
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
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
});