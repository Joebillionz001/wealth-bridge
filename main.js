import { initAuth } from './auth.js';
import { initDashboard } from './dashboard.js';
import { initProfilePage } from './profile.js';
import { initPortfolioPage } from './portfolio.js';
import { initSettingsPage } from './settings.js';
import { initContactPage } from './contact.js';
import { initInvestmentsPage } from './investments.js';
import { initTestimonialsPage } from './testimonials.js';
import { getStorageItem, setStorageItem } from './utils.js';
import { apiService } from './api-service.js';

/**
 * Finds all password fields on the page and adds a show/hide toggle button.
 */
function setupPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(passwordInput => {
        // Prevent double-wrapping if the script runs multiple times
        if (passwordInput.parentNode.classList.contains('password-input-wrapper')) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'password-input-wrapper';
        
        // Insert the wrapper and move the input field inside it
        passwordInput.parentNode.insertBefore(wrapper, passwordInput);
        wrapper.appendChild(passwordInput);

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle-btn';
        toggleBtn.innerHTML = '👁️'; // Show icon
        toggleBtn.setAttribute('aria-label', 'Show password');

        toggleBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            toggleBtn.innerHTML = isPassword ? '🙈' : '👁️'; // Toggle icon
            toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });

        wrapper.appendChild(toggleBtn);
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    setupPasswordToggles();

    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = getStorageItem('theme');

    // Apply saved theme on load
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const settingsToggle = document.getElementById('dark-mode-toggle');
            
            if (body.classList.contains('dark-mode')) {
                setStorageItem('theme', 'dark');
                themeToggle.textContent = '☀️';
                if (settingsToggle) settingsToggle.checked = true;
            } else {
                setStorageItem('theme', 'light');
                themeToggle.textContent = '🌙';
                if (settingsToggle) settingsToggle.checked = false;
            }
        });
    }

    // --- Mobile Navigation Toggle ---
    const header = document.querySelector('.main-header');
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');

    if (navToggle && header) {
        navToggle.addEventListener('click', () => {
            header.classList.toggle('nav-open');
            document.body.classList.toggle('nav-open');
        });
    }

    // Close mobile menu automatically when a link is clicked
    if (nav && header) {
        nav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                header.classList.remove('nav-open');
                document.body.classList.remove('nav-open');
            }
        });
    }

    // --- Initialize Session ---
    await apiService.initialize();

    // --- Initialize Modules ---
    
    // 1. Auth (Handles Login, Signup, Navbar state, Page Protection)
    initAuth();

    // 2. Page Specific Logic
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
        initDashboard();
    } else if (path.includes('investments.html')) {
        initInvestmentsPage();
    } else if (path.includes('profile.html')) {
        initProfilePage();
    } else if (path.includes('my-portfolio.html')) {
        initPortfolioPage();
    } else if (path.includes('settings.html')) {
        initSettingsPage();
    } else if (path.includes('contact.html')) {
        initContactPage();
    } else if (path.includes('testimonials.html')) {
        initTestimonialsPage();
    }
});