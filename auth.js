import { showToast, showSpinner, hideSpinner } from './ui.js';
import { apiService } from './api-service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function initAuth() {
  updateNavbar(); // This should be called on every page load
  handleSignup();
  handleLogin();
  handleForgotPassword();
  handleResetPassword();
  protectPages();
  // Add a single, delegated event listener for the logout link
  initLogoutHandler();
}

/**
 * Checks the strength of a password based on a scoring system.
 * @param {string} password The password to check.
 * @returns {{level: string, text: string}} An object with the strength level and text.
 */
function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // Check for special characters

    switch (score) {
        case 5:
        case 4:
            return { level: 'strong', text: 'Strong' };
        case 3:
            return { level: 'medium', text: 'Medium' };
        default:
            return { level: 'weak', text: 'Weak (use letters, numbers, and symbols)' };
    }
}

function handleSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const passwordInput = form.password;
  const strengthContainer = document.getElementById('password-strength-container');
  const strengthBar = strengthContainer ? strengthContainer.querySelector('.strength-bar') : null;
  const strengthText = document.getElementById('password-strength-text');

  if (passwordInput && strengthBar && strengthText) {
      passwordInput.addEventListener('input', () => {
          const password = passwordInput.value;
          const strength = checkPasswordStrength(password);
          strengthBar.className = `strength-bar ${password.length > 0 ? strength.level : ''}`;
          strengthText.textContent = password.length > 0 ? `Strength: ${strength.text}` : '';
      });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form['confirm-password'].value;

    if (!name || !email || !password || !confirmPassword) {
      showToast("All fields are required.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    // In a real app, hash the password. For this prototype, plaintext is fine per requirements.
    const newUser = {
      id: Date.now(), // Simple unique ID
      name,
      email,
      password,
      balance: 1000, // Starting balance for demo
      investments: [],
      favorites: [],
      referralCode: 'WB-' + Math.floor(1000 + Math.random() * 9000),
      referrals: 0,
      referralEarnings: 0,
      transactions: [{
        id: 'DEP-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'Deposit',
        amount: 1000,
        status: 'Completed'
      }]
    };
    
    showSpinner();
    try {
      await apiService.signup(newUser);
      showToast("Signup successful! Redirecting to login...", "success");
      setTimeout(() => { window.location.href = "login.html"; }, 2000);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      hideSpinner();
    }
  });
}

function handleLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    showSpinner();
    try {
      await apiService.login(email, password);
      showToast("Login successful! Redirecting...", "success");
      window.location.href = "dashboard.html";
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      hideSpinner();
    }
  });
}

function handleForgotPassword() {
  const form = document.getElementById("forgot-password-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showSpinner();
    const email = form.email.value.trim();

    try {
        await apiService.requestPasswordReset(email);
        // Show the same message for security to prevent email enumeration
        showToast("If an account with that email exists, a password reset link has been sent.", "success");
    } catch (err) {
        showToast("Error sending reset link.", "error");
    } finally {
        hideSpinner();
    }
  });
}

function handleResetPassword() {
  const form = document.getElementById("reset-password-form");
  if (!form) return;

  // In a real app, you would extract the token from the URL query params
  // const urlParams = new URLSearchParams(window.location.search);
  // const token = urlParams.get('token');
  // For this prototype transition, we'll assume the user enters their email again or it's handled by session
  
  const resetEmail = localStorage.getItem('resetEmail');

  if (!resetEmail) {
    showToast("Invalid or missing reset token. Please request a new link.", "error");
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = form['new-password'].value;
    const confirmPassword = form['confirm-new-password'].value;

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    if (!resetEmail) {
        showToast("Cannot reset password without a valid token.", "error");
        return;
    }

    showSpinner();
    try {
      // Pass null as token, the mock service uses localStorage
      await apiService.updateUserPassword(null, newPassword); 
      showToast("Password reset successfully! Redirecting...", "success");
      setTimeout(() => { window.location.href = "login.html"; }, 3000);
    } catch (err) {
      showToast(err.message || "Error resetting password.", "error");
    } finally {
      hideSpinner();
    }
  });
}

function protectPages() {
  const protectedPages = ["dashboard.html", "profile.html", "my-portfolio.html", "settings.html", "investments.html"];
  const currentPage = window.location.pathname.split("/").pop();

  if (protectedPages.includes(currentPage)) {
    const loggedInUser = apiService.getLoggedInUser();
    if (!loggedInUser) {
      window.location.href = "login.html";
    }
  }
}

function updateNavbar() {
  const navLinksContainer = document.getElementById('main-nav-links');
  if (!navLinksContainer) return;

  const loggedInUser = apiService.getLoggedInUser();

  const path = window.location.pathname;

  let linksHtml = '';

  if (loggedInUser) {
    // Logged-in user links
    linksHtml = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="investments.html">Investments</a></li>
      <li><a href="my-portfolio.html">Portfolio</a></li>
      <li><a href="testimonials.html">Success Stories</a></li>
      <li><a href="profile.html">Profile</a></li>
      <li><a href="settings.html">Settings</a></li>
      <li><a href="#" id="logout-link">Logout</a></li>
    `;
  } else {
    // Logged-out user links
    if (path.includes('index.html') || path === '/' || path.endsWith('/wealth%20bridge/')) {
        linksHtml = `
            <li><a href="#features">Features</a></li>
            <li><a href="testimonials.html">Success Stories</a></li>
            <li><a href="login.html">Login</a></li>
            <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
        `;
    } else {
        linksHtml = `
            <li><a href="index.html">Home</a></li>
            <li><a href="testimonials.html">Success Stories</a></li>
            <li><a href="login.html">Login</a></li>
            <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
        `;
    }
  }

  navLinksContainer.innerHTML = linksHtml;

  // The logout listener is now handled by event delegation in initLogoutHandler()
}

function initLogoutHandler() {
  document.body.addEventListener("click", async (e) => {
    if (e.target && e.target.id === "logout-link") {
      e.preventDefault();
      // Add a confirmation dialog before logging out
      if (confirm("Are you sure you want to log out?")) {
        showSpinner();
        try {
          await apiService.logout();
          showToast("You have been logged out.", "info");
          setTimeout(() => { window.location.href = "login.html"; }, 1500);
        } finally {
          hideSpinner();
        }
      }
    }
  });
}