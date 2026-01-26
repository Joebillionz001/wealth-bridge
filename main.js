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

// Form Handling & Interactive Components
import { FormHandler } from './forms-handler.js';
import { UIInteractions } from './ui-interactions.js';
import { ChartRenderer } from './chart-renderer.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Form Handling & UI Interactions
    FormHandler.initAll();
    UIInteractions.initAll();
    ChartRenderer.initAll();

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

    // 5. Initialize Trading Chart
    initTradingChart();
});

// Trading Chart Function
function initTradingChart() {
    const canvas = document.getElementById('marketChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth - 40;
    canvas.height = 300;

    // Generate data points for smooth line
    const generateChartData = () => {
        const points = [];
        let price = 23000;
        for (let i = 0; i < 24; i++) {
            const change = (Math.random() - 0.45) * 500;
            price += change;
            points.push(Math.max(price, 20000));
        }
        return points;
    };

    const prices = generateChartData();
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    const padding = { top: 40, right: 20, bottom: 40, left: 60 };
    const plotWidth = canvas.width - padding.left - padding.right;
    const plotHeight = canvas.height - padding.top - padding.bottom;

    // Draw background
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 109, 66, 0.1)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (i * plotHeight / gridLines);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(canvas.width - padding.right, y);
        ctx.stroke();
    }

    // Draw gradient area under the line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, canvas.height - padding.bottom);
    gradient.addColorStop(0, 'rgba(0, 109, 66, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 109, 66, 0.05)');

    ctx.beginPath();
    ctx.moveTo(padding.left, canvas.height - padding.bottom);
    
    for (let i = 0; i < prices.length; i++) {
        const x = padding.left + (i / (prices.length - 1)) * plotWidth;
        const normalizedPrice = (prices[i] - minPrice) / priceRange;
        const y = canvas.height - padding.bottom - (normalizedPrice * plotHeight);
        
        if (i === 0) {
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line chart
    ctx.strokeStyle = 'var(--primary-color)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (let i = 0; i < prices.length; i++) {
        const x = padding.left + (i / (prices.length - 1)) * plotWidth;
        const normalizedPrice = (prices[i] - minPrice) / priceRange;
        const y = canvas.height - padding.bottom - (normalizedPrice * plotHeight);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = '#006d42';
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#006d42';
    for (let i = 0; i < prices.length; i += 3) {
        const x = padding.left + (i / (prices.length - 1)) * plotWidth;
        const normalizedPrice = (prices[i] - minPrice) / priceRange;
        const y = canvas.height - padding.bottom - (normalizedPrice * plotHeight);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#006d42';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'var(--text-muted)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridLines; i++) {
        const price = minPrice + ((gridLines - i) / gridLines) * priceRange;
        const y = padding.top + (i * plotHeight / gridLines);
        ctx.fillText('$' + price.toFixed(0), padding.left - 10, y);
    }

    // Draw X-axis labels (every 4 hours)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < prices.length; i += 4) {
        const x = padding.left + (i / (prices.length - 1)) * plotWidth;
        ctx.fillText(hours[i], x, canvas.height - padding.bottom + 10);
    }

    // Handle chart period selection
    document.querySelectorAll('.chart-period').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-period').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Regenerate chart with new data
            initTradingChart();
        });
    });
}