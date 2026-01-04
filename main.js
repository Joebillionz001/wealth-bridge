import { initAuth } from './auth.js';
import { initDashboard } from './dashboard.js';
import { initProfilePage } from './profile.js';
import { initPortfolioPage } from './portfolio.js';
import { initKycPage } from './kyc.js';
import { initSettingsPage } from './settings.js';
import { initContactPage } from './contact.js';
import { initInvestmentsPage } from './investments.js';
import { initTestimonialsPage } from './testimonials.js';
import { initPlanDetailsPage } from './plan-details.js';
import { initAdminPage } from './admin.js';
import { getStorageItem, setStorageItem, showToast } from './utils.js';
import { apiService } from './api-service.js';
import { INVESTMENT_PLANS } from './config.js';

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
        setupPlanInteractions();
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
    } else if (path.includes('plan-details.html')) {
        initPlanDetailsPage();
    } else if (path.includes('admin.html')) {
        initAdminPage();
    } else if (path.includes('kyc.html')) {
        initKycPage();
    }

    initLandingCarousel();
    initGoogleAuth();
    initSmoothScrolling();
});

/**
 * Sets up interactions for Investment Plans on the Dashboard.
 * Makes plans clickable to show details in a modal.
 */
function setupPlanInteractions() {
    const plansContainer = document.getElementById('investment-plans');
    // Modal elements removed as we are now redirecting to a page

    if (!plansContainer) return;

    // Event Delegation: Listen for clicks on the container
    plansContainer.addEventListener('click', (e) => {
        // Prevent modal if clicking the invest button
        if (e.target.classList.contains('invest-btn')) {
            return;
        }

        // Find the closest card element (specifically .plan-card)
        const card = e.target.closest('.plan-card');
        
        if (card) {
            // Extract details from the card
            const title = card.querySelector('h4')?.innerText || card.querySelector('h3')?.innerText || 'Investment Plan';
            
            // Redirect to details page
            window.location.href = `plan-details.html?plan=${encodeURIComponent(title)}`;
        }
    });
}

/**
 * Initializes the Testimonials Carousel on the landing page.
 */
function initLandingCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    let currentSlide = 0;

    if (slides.length === 0) return;

    const showSlide = (index) => {
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    };

    const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    };

    const prevSlide = () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    };

    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Auto play every 5 seconds
    setInterval(nextSlide, 5000);
}

/**
 * Initializes the Google Auth simulation.
 */
function initGoogleAuth() {
    const googleBtn = document.getElementById('google-auth-btn');
    if (!googleBtn) return;

    // --- Real Google Auth Implementation ---
    const renderGoogleButton = () => {
        if (typeof google !== 'undefined' && google.accounts) {
            // 1. Initialize Google Client
            google.accounts.id.initialize({
                // NOTE: Ensure your local URL (e.g., http://127.0.0.1:5500) is added to "Authorized JavaScript origins" in Google Cloud Console to avoid 403 errors
                client_id: "921557363174-jdcndrmm3g11hlegdsjbmjl1umsv8ag5.apps.googleusercontent.com",
                callback: handleGoogleCallback
            });

            // 2. Create a container for the button if it doesn't exist
            let buttonContainer = document.getElementById('google-btn-container');
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.id = 'google-btn-container';
                buttonContainer.style.width = '100%';
                buttonContainer.style.display = 'flex';
                buttonContainer.style.justifyContent = 'center';
                buttonContainer.style.marginBottom = '1rem';
                // Insert before the custom button
                googleBtn.parentNode.insertBefore(buttonContainer, googleBtn);
            }

            // 3. Render the Official Google Button
            google.accounts.id.renderButton(
                buttonContainer,
                { theme: "outline", size: "large", width: "350", text: "continue_with" } 
            );

            // 4. Hide the custom simulation button
            googleBtn.style.display = 'none';
            return true;
        }
        return false;
    };

    // Attempt to render immediately, or retry if script is loading
    if (!renderGoogleButton()) {
        const checkInterval = setInterval(() => {
            if (renderGoogleButton()) clearInterval(checkInterval);
        }, 500);
        // Stop checking after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
    }

    // --- Fallback: Simulation Mode (If script fails or ID not set) ---
    googleBtn.addEventListener('click', async () => {
        try {
            // Visual feedback
            const originalHTML = googleBtn.innerHTML;
            googleBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Connecting...';
            googleBtn.disabled = true;
            googleBtn.style.opacity = '0.7';

            // Simulate Google Auth Popup
            // In a real app, this would be handled by the Google Identity Services SDK
            const email = prompt("Google Auth Simulation\n\nEnter an email address to simulate login/signup:", "alex.google@example.com");
            
            if (!email) {
                throw new Error("User cancelled login");
            }

            const mockGoogleUser = {
                name: email.split('@')[0], // Generate name from email
                email: email
            };

            await apiService.loginWithGoogle(mockGoogleUser);
            
            showToast("Successfully authenticated with Google!", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            if (error.message !== "User cancelled login") {
                showToast("Google authentication failed.", "error");
            }
            googleBtn.innerHTML = originalHTML;
            googleBtn.disabled = false;
            googleBtn.style.opacity = '1';
        }
    });
}

/**
 * Handles the response from the real Google Sign-In.
 * Decodes the JWT token and logs the user in.
 */
async function handleGoogleCallback(response) {
    try {
        // Decode the JWT credential
        const responsePayload = parseJwt(response.credential);
        
        const googleUser = {
            name: responsePayload.name,
            email: responsePayload.email,
            picture: responsePayload.picture
        };

        await apiService.loginWithGoogle(googleUser);
        
        showToast(`Welcome, ${googleUser.name}!`, "success");
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        showToast("Google login failed: " + error.message, "error");
    }
}

/**
 * Helper to decode JWT token from Google
 */
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

/**
 * Initializes smooth scrolling for anchor links with header offset.
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || !targetId.startsWith('#')) return;
            
            try {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    
                    const header = document.querySelector('.main-header');
                    const headerOffset = header ? header.offsetHeight : 0;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - headerOffset;
            
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            } catch (err) {
                // Ignore invalid selectors
            }
        });
    });
}