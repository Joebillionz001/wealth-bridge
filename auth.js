import { showToast } from './notifications.js';

// --- Form Validation Helpers ---
export const showError = (input, message) => {
    const formGroup = input.parentElement;
    const errorText = formGroup.querySelector('.error-text');
    input.classList.add('invalid');
    if (errorText) {
        errorText.textContent = message;
    }
};

export const clearError = (input) => {
    const formGroup = input.parentElement;
    const errorText = formGroup.querySelector('.error-text');
    input.classList.remove('invalid');
    if (errorText) {
        errorText.textContent = '';
    }
};

// --- Authentication Logic (DEMO ONLY - NOT SECURE) ---

const handleAuthNav = () => {
    const userAuthLinks = document.getElementById('user-auth-links');
    const userProfileLinks = document.getElementById('user-profile-links');
    const portfolioLink = document.getElementById('portfolio-link');
    const logoutLink = document.getElementById('logout-link');

    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        if (userAuthLinks) userAuthLinks.style.display = 'none';
        if (userProfileLinks) userProfileLinks.style.display = 'flex';
        if (portfolioLink) portfolioLink.style.display = 'block';
    } else {
        if (userAuthLinks) userAuthLinks.style.display = 'flex';
        if (userProfileLinks) userProfileLinks.style.display = 'none';
    }

    // Only add the logout listener if the user is logged in, to avoid issues on auth pages.
    if (logoutLink && loggedInUser) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            showToast('You have been logged out.', 'info');
            setTimeout(() => window.location.href = 'index.html', 1000);
        });
    }
};

const handleSignupForm = () => {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = e.target.username;
        const emailInput = e.target.email;
        const passwordInput = e.target.password;
        const submitButton = e.target.querySelector('.submit-button');
        const confirmPasswordInput = e.target['confirm-password'];
        let isValid = true;

        [usernameInput, emailInput, passwordInput, confirmPasswordInput].forEach(clearError);

        if (usernameInput.value.trim().length < 3) {
            showError(usernameInput, 'Username must be at least 3 characters.');
            isValid = false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address.');
            isValid = false;
        }
        if (passwordInput.value.length < 8) {
            showError(passwordInput, 'Password must be at least 8 characters long.');
            isValid = false;
        }
        if (passwordInput.value !== confirmPasswordInput.value) {
            showError(confirmPasswordInput, 'Passwords do not match.');
            isValid = false;
        }

        if (!isValid) return;

        // Show spinner
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        // Simulate network delay
        setTimeout(() => {
            const user = { username: usernameInput.value, email: emailInput.value, password: passwordInput.value };
            localStorage.setItem('user', JSON.stringify(user));
            showToast('You have successfully created an account with Wealth Bridge!', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        }, 1000);


    });
};

const handleLoginForm = () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    // Check for and pre-fill remembered email on page load
    const emailInput = loginForm.querySelector('#email');
    const rememberMeCheckbox = loginForm.querySelector('#remember-me');
    const rememberedEmail = localStorage.getItem('rememberedEmail');

    if (rememberedEmail && emailInput && rememberMeCheckbox) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }

    const errorMessage = document.getElementById('error-message');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const submitButton = e.target.querySelector('.submit-button');
        const rememberMe = e.target['remember-me'].checked;
        const storedUser = JSON.parse(localStorage.getItem('user'));

        // Show spinner
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        // Simulate network delay
        setTimeout(() => {
            if (storedUser && storedUser.email === email && storedUser.password === password) {
                // Handle "Remember Me" logic
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                localStorage.setItem('loggedInUser', storedUser.username);
                window.location.href = 'profile.html';
            } else {
                showToast('Invalid email or password.', 'error');
                // Hide spinner on failure
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        }, 1000);
    });
};

const handleForgotPasswordForm = () => {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (!forgotPasswordForm) return;

    forgotPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('.submit-button');
        const emailInput = e.target.email;
        clearError(emailInput);

        const storedUser = JSON.parse(localStorage.getItem('user'));

        if (storedUser && storedUser.email === emailInput.value) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            showToast('Success! Redirecting to password reset page...', 'success');
            
            setTimeout(() => {
                window.location.href = `reset-password.html?email=${encodeURIComponent(emailInput.value)}`;
            }, 2000);

        } else {
            showError(emailInput, 'No account found with that email address.');
        }
    });
};

const handleResetPasswordForm = () => {
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (!resetPasswordForm) return;

    resetPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('.submit-button');
        const newPasswordInput = e.target['new-password'];
        const confirmNewPasswordInput = e.target['confirm-new-password'];
        let isValid = true;

        [newPasswordInput, confirmNewPasswordInput].forEach(clearError);

        if (newPasswordInput.value.length < 8) {
            showError(newPasswordInput, 'Password must be at least 8 characters long.');
            isValid = false;
        }
        if (newPasswordInput.value !== confirmNewPasswordInput.value) {
            showError(confirmNewPasswordInput, 'Passwords do not match.');
            isValid = false;
        }

        if (!isValid) return;

        submitButton.classList.add('loading');
        submitButton.disabled = true;

        setTimeout(() => {
            // In a real app, you'd validate a secure token first.
            const storedUser = JSON.parse(localStorage.getItem('user'));
            storedUser.password = newPasswordInput.value;
            localStorage.setItem('user', JSON.stringify(storedUser));
            showToast('Password reset successfully! Please log in.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        }, 1000);
    });
};

export function initAuth() {
    handleAuthNav();
    handleSignupForm();
    handleLoginForm();
    handleForgotPasswordForm();
    handleResetPasswordForm();
}