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
  handleVerifyEmail();
  handleGoogleAuth();
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
    const referralCode = form['referral-code'] ? form['referral-code'].value.trim() : null;

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
      balance: 0,
      kycStatus: 'none', // none, pending, verified, rejected
      investments: [],
      favorites: [],
      referralCode: 'WB-' + Math.floor(1000 + Math.random() * 9000),
      referrals: 0,
      referralEarnings: 0,
      transactions: [],
      usedReferralCode: referralCode
    };
    
    showSpinner();
    try {
      const response = await apiService.signup(newUser);
      showToast(`Signup successful! Please check your email for the verification code.`, "success");
      setTimeout(() => { window.location.href = `verify-email.html?email=${encodeURIComponent(email)}`; }, 2000);
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

  // Pre-fill email if "Remember Me" was used previously
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
      form.email.value = savedEmail;
      const rememberMeCheckbox = document.getElementById('remember-me');
      if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value;
    const rememberMe = document.getElementById('remember-me')?.checked;

    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    showSpinner();
    try {
      await apiService.login(email, password);

      if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
      } else {
          localStorage.removeItem('rememberedEmail');
      }

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

  // Check URL for email/token to support email link flow
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  
  if (emailFromUrl) {
      localStorage.setItem('resetEmail', emailFromUrl);
  }
  
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

function handleVerifyEmail() {
  const form = document.getElementById("verify-email-form");
  if (!form) return;

  // Prefill email from URL
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  if (emailParam) form.email.value = emailParam;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const code = form.code.value.trim();

    showSpinner();
    try {
      await apiService.verifyEmail(email, code);
      showToast("Email verified successfully! Redirecting to login...", "success");
      setTimeout(() => { window.location.href = "login.html"; }, 2000);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      hideSpinner();
    }
  });

  const resendBtn = document.getElementById('resend-code-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const email = form.email.value.trim();
      if (!isValidEmail(email)) {
        showToast("Please enter a valid email address first.", "error");
        return;
      }

      resendBtn.disabled = true;
      showSpinner();
      try {
        const code = await apiService.resendVerificationCode(email);
        showToast(`New verification code sent to your email.`, "success", 5000);

        // Countdown Timer
        let countdown = 30;
        const originalText = resendBtn.textContent;
        resendBtn.textContent = `Resend in ${countdown}s`;

        const interval = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(interval);
            resendBtn.textContent = originalText;
            resendBtn.disabled = false;
          } else {
            resendBtn.textContent = `Resend in ${countdown}s`;
          }
        }, 1000);
      } catch (err) {
        showToast(err.message, "error");
        resendBtn.disabled = false;
      } finally {
        hideSpinner();
      }
    });
  }
}

function handleGoogleAuth() {
    const googleBtn = document.getElementById('google-auth-btn');
    if (!googleBtn) return;

    googleBtn.addEventListener('click', () => {
        // In a real production app, you would use the Google Identity Services client
        // to request a token, then send that token to your backend.
        /*
        google.accounts.oauth2.initTokenClient({
            client_id: 'YOUR_GOOGLE_CLIENT_ID',
            scope: 'email profile',
            callback: (response) => {
                // Send response.access_token to backend
            },
        }).requestAccessToken();
        */

        // SIMULATION FOR DEMO:
        showSpinner();
        setTimeout(() => {
            const mockUser = {
                id: 'google-' + Date.now(),
                name: 'Google User',
                email: 'user@gmail.com',
                balance: 500,
                kycStatus: 'verified',
                investments: [],
                favorites: [],
                transactions: []
            };
            apiService.loginWithGoogle(mockUser);
            
            showToast("Google Sign-In successful!", "success");
            window.location.href = "dashboard.html";
            hideSpinner();
        }, 1500);
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
      <li><a href="faq.html">FAQ</a></li>
      <li><a href="contact.html">Contact</a></li>
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
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="login.html">Login</a></li>
            <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
        `;
    } else {
        linksHtml = `
            <li><a href="index.html">Home</a></li>
            <li><a href="testimonials.html">Success Stories</a></li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="contact.html">Contact</a></li>
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
          // Disconnect Google Session if available
          if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
            const user = apiService.getLoggedInUser();
            if (user && user.email) {
                google.accounts.id.revoke(user.email, done => {
                    console.log('Google session revoked');
                });
            }
          }

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