import { initAuth } from './auth.js';
import { initUI } from './ui.js';
import { handlePaymentPage } from './page-handlers/payment.js';
import { handlePortfolioPage } from './page-handlers/portfolio.js';
import { handleProfilePage } from './page-handlers/profile.js';
import { handleSettingsPage, handleLogoutEverywhere } from './page-handlers/settings.js';
import { handleSiteSearch } from './page-handlers/search.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Global initializations ---
    initAuth(); // Handles nav links and auth forms
    initUI(); // Handles theme switcher, back-to-top, etc.

    // --- Responsive Navigation ---
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('nav-open');
        });
    }

    // --- Scroll Animations ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once visible
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% of the element is visible
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }


    // --- Page-specific initializations ---
    const page = document.body.id || window.location.pathname.split('/').pop().replace('.html', '');

    switch (page) {
        case 'payment':
            handlePaymentPage();
            break;
        case 'my-portfolio':
            handlePortfolioPage();
            break;
        case 'profile':
            handleProfilePage();
            break;
        case 'settings':
            handleSettingsPage();
            handleLogoutEverywhere();
            break;
    }
});