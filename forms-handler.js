/**
 * COMPREHENSIVE FORM HANDLING & VALIDATION
 * Handles all form submissions, validation, and interactivity
 */

import { showToast } from './utils.js';
import { apiService } from './api-service.js';

export class FormHandler {
    /**
     * VALIDATION FUNCTIONS
     */
    static validate = {
        email(email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        password(password) {
            // Min 8 chars, 1 uppercase, 1 number, 1 special char
            const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            return regex.test(password);
        },

        passwordStrength(password) {
            let strength = 0;
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[@$!%*?&]/.test(password)) strength++;
            return strength; // 0-4
        },

        phone(phone) {
            const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            return regex.test(phone);
        },

        amount(amount) {
            const num = parseFloat(amount);
            return !isNaN(num) && num > 0;
        },

        minAmount(amount, min) {
            const num = parseFloat(amount);
            return num >= min;
        },

        creditCard(cardNumber) {
            const regex = /^[0-9]{13,19}$/;
            return regex.test(cardNumber.replace(/\s/g, ''));
        },

        cvv(cvv) {
            return /^[0-9]{3,4}$/.test(cvv);
        },

        url(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        }
    };

    /**
     * LOGIN FORM HANDLER
     */
    static initLoginForm() {
        const loginForm = document.querySelector('form[class*="login"]') || 
                         document.querySelector('form[id*="login"]');
        
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = loginForm.querySelector('input[type="email"]').value.trim();
            const password = loginForm.querySelector('input[type="password"]').value;
            const rememberMe = loginForm.querySelector('input[type="checkbox"]')?.checked;

            // Validation
            if (!this.validate.email(email)) {
                showToast('Please enter a valid email', 'error');
                return;
            }

            if (!password) {
                showToast('Password is required', 'error');
                return;
            }

            try {
                FormHandler.showLoading(loginForm);
                const user = await apiService.login(email, password);
                
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('rememberedEmail', email);
                }

                showToast('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } catch (error) {
                showToast(error.message || 'Login failed', 'error');
            } finally {
                FormHandler.hideLoading(loginForm);
            }
        });

        // Load remembered email
        if (localStorage.getItem('rememberMe')) {
            const email = localStorage.getItem('rememberedEmail');
            const emailInput = loginForm.querySelector('input[type="email"]');
            const checkbox = loginForm.querySelector('input[type="checkbox"]');
            if (emailInput) emailInput.value = email;
            if (checkbox) checkbox.checked = true;
        }
    }

    /**
     * SIGNUP FORM HANDLER
     */
    static initSignupForm() {
        const signupForm = document.querySelector('form[class*="signup"]') || 
                          document.querySelector('form[id*="signup"]');
        
        if (!signupForm) return;

        const passwordInput = signupForm.querySelector('input[name="password"]');
        const strengthBar = signupForm.querySelector('[class*="strength"]');

        // Real-time password strength
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                const strength = this.validate.passwordStrength(e.target.value);
                if (strengthBar) {
                    strengthBar.style.width = (strength * 25) + '%';
                    strengthBar.style.background = 
                        strength <= 1 ? '#dc3545' : 
                        strength === 2 ? '#ffc107' : 
                        strength === 3 ? '#17a2b8' : '#28a745';
                }
            });
        }

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                fullName: signupForm.querySelector('input[name="fullName"]')?.value.trim(),
                email: signupForm.querySelector('input[type="email"]')?.value.trim(),
                password: signupForm.querySelector('input[name="password"]')?.value,
                confirmPassword: signupForm.querySelector('input[name="confirmPassword"]')?.value,
                phone: signupForm.querySelector('input[type="tel"]')?.value.trim(),
                referralCode: signupForm.querySelector('input[name="referralCode"]')?.value.trim(),
                agreeToTerms: signupForm.querySelector('input[type="checkbox"]')?.checked,
            };

            // Validation
            if (!formData.fullName) {
                showToast('Full name is required', 'error');
                return;
            }

            if (!this.validate.email(formData.email)) {
                showToast('Invalid email address', 'error');
                return;
            }

            if (!this.validate.password(formData.password)) {
                showToast('Password must be 8+ chars with uppercase, number, and special char', 'error');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }

            if (!formData.agreeToTerms) {
                showToast('You must agree to the terms', 'error');
                return;
            }

            try {
                FormHandler.showLoading(signupForm);
                
                const newUser = await apiService.signup({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    usedReferralCode: formData.referralCode,
                    balance: 0,
                    transactions: [],
                    investments: [],
                    referrals: 0,
                    referralEarnings: 0,
                    referralCode: 'WB-' + Math.random().toString(36).substr(2, 9).toUpperCase()
                });

                showToast('Account created! Verify your email.', 'success');
                setTimeout(() => {
                    window.location.href = 'verify-email.html';
                }, 2000);
            } catch (error) {
                showToast(error.message || 'Signup failed', 'error');
            } finally {
                FormHandler.hideLoading(signupForm);
            }
        });
    }

    /**
     * DEPOSIT FORM HANDLER
     */
    static initDepositForm() {
        const depositForm = document.querySelector('form[id*="deposit"]');
        if (!depositForm) return;

        const amountInput = depositForm.querySelector('input[placeholder*="amount" i]');
        const methodSelect = depositForm.querySelector('select');
        const totalAmount = depositForm.querySelector('[id*="total"]');

        // Fee calculation
        const updateFee = () => {
            if (!amountInput || !methodSelect || !totalAmount) return;

            const amount = parseFloat(amountInput.value) || 0;
            const method = methodSelect.value;

            const fees = {
                'bank': amount * 0.01,      // 1%
                'card': amount * 0.025,     // 2.5%
                'crypto': amount * 0.02,    // 2%
                'wallet': amount * 0.015    // 1.5%
            };

            const total = amount + (fees[method] || 0);
            totalAmount.textContent = '$' + total.toFixed(2);
        };

        amountInput?.addEventListener('input', updateFee);
        methodSelect?.addEventListener('change', updateFee);

        depositForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = parseFloat(amountInput.value);
            const method = methodSelect.value;

            // Validation
            if (!amount || amount < 100) {
                showToast('Minimum deposit is $100', 'error');
                return;
            }

            if (!method) {
                showToast('Select a payment method', 'error');
                return;
            }

            try {
                FormHandler.showLoading(depositForm);

                const user = await apiService.getLoggedInUser();
                user.balance += amount;
                user.transactions.push({
                    id: 'DEP-' + Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    type: 'Deposit',
                    amount: amount,
                    method: method,
                    status: 'Completed'
                });

                await apiService.updateUser(user);
                showToast(`Deposit of $${amount} successful!`, 'success');
                
                depositForm.reset();
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                showToast('Deposit failed: ' + error.message, 'error');
            } finally {
                FormHandler.hideLoading(depositForm);
            }
        });
    }

    /**
     * WITHDRAWAL FORM HANDLER
     */
    static initWithdrawalForm() {
        const withdrawForm = document.querySelector('form[id*="withdraw"]');
        if (!withdrawForm) return;

        const amountInput = withdrawForm.querySelector('input[placeholder*="amount" i]');
        const methodSelect = withdrawForm.querySelector('select');
        const netAmount = withdrawForm.querySelector('[id*="net"]');
        const confirmCheckbox = withdrawForm.querySelector('input[type="checkbox"]');

        // Calculate net amount after fee
        const updateNetAmount = () => {
            if (!amountInput || !methodSelect || !netAmount) return;

            const amount = parseFloat(amountInput.value) || 0;
            const method = methodSelect.value;

            const fees = {
                'bank': amount * 0.01,      // 1%
                'card': amount * 0.025,     // 2.5%
                'crypto': amount * 0.02,    // 2%
                'wallet': amount * 0.015    // 1.5%
            };

            const net = amount - (fees[method] || 0);
            netAmount.textContent = '$' + net.toFixed(2);
        };

        amountInput?.addEventListener('input', updateNetAmount);
        methodSelect?.addEventListener('change', updateNetAmount);

        withdrawForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = parseFloat(amountInput.value);
            const method = methodSelect.value;

            // Validation
            if (!amount || amount < 50) {
                showToast('Minimum withdrawal is $50', 'error');
                return;
            }

            if (!method) {
                showToast('Select withdrawal method', 'error');
                return;
            }

            if (!confirmCheckbox.checked) {
                showToast('Please confirm the withdrawal details', 'error');
                return;
            }

            try {
                FormHandler.showLoading(withdrawForm);

                const user = await apiService.getLoggedInUser();
                
                if (user.balance < amount) {
                    showToast('Insufficient balance', 'error');
                    return;
                }

                user.balance -= amount;
                user.transactions.push({
                    id: 'WTH-' + Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    type: 'Withdrawal',
                    amount: amount,
                    method: method,
                    status: 'Pending'
                });

                await apiService.updateUser(user);
                showToast(`Withdrawal of $${amount} submitted! Processing 1-2 business days.`, 'success');
                
                withdrawForm.reset();
                setTimeout(() => {
                    window.location.href = 'transactions.html';
                }, 1500);
            } catch (error) {
                showToast('Withdrawal failed: ' + error.message, 'error');
            } finally {
                FormHandler.hideLoading(withdrawForm);
            }
        });
    }

    /**
     * PROFILE UPDATE FORM HANDLER
     */
    static initProfileForm() {
        const profileForm = document.querySelector('form[id*="profile"]');
        if (!profileForm) return;

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = await apiService.getLoggedInUser();
            const fullName = profileForm.querySelector('input[name="fullName"]')?.value.trim();
            const phone = profileForm.querySelector('input[name="phone"]')?.value.trim();
            const country = profileForm.querySelector('select[name="country"]')?.value;
            const bio = profileForm.querySelector('textarea[name="bio"]')?.value.trim();

            // Validation
            if (!fullName) {
                showToast('Full name is required', 'error');
                return;
            }

            if (phone && !this.validate.phone(phone)) {
                showToast('Invalid phone number', 'error');
                return;
            }

            try {
                FormHandler.showLoading(profileForm);

                user.fullName = fullName;
                if (phone) user.phone = phone;
                if (country) user.country = country;
                if (bio) user.bio = bio;

                await apiService.updateUser(user);
                showToast('Profile updated successfully!', 'success');
                
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (error) {
                showToast('Update failed: ' + error.message, 'error');
            } finally {
                FormHandler.hideLoading(profileForm);
            }
        });
    }

    /**
     * PASSWORD CHANGE FORM HANDLER
     */
    static initPasswordChangeForm() {
        const passForm = document.querySelector('form[id*="password"]');
        if (!passForm) return;

        passForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPass = passForm.querySelector('input[name*="current"]')?.value;
            const newPass = passForm.querySelector('input[name*="new"]')?.value;
            const confirmPass = passForm.querySelector('input[name*="confirm"]')?.value;

            const user = await apiService.getLoggedInUser();

            // Validation
            if (currentPass !== user.password) {
                showToast('Current password is incorrect', 'error');
                return;
            }

            if (!this.validate.password(newPass)) {
                showToast('New password must be stronger', 'error');
                return;
            }

            if (newPass !== confirmPass) {
                showToast('Passwords do not match', 'error');
                return;
            }

            try {
                FormHandler.showLoading(passForm);

                user.password = newPass;
                await apiService.updateUser(user);
                
                showToast('Password changed successfully!', 'success');
                passForm.reset();
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                showToast('Password change failed', 'error');
            } finally {
                FormHandler.hideLoading(passForm);
            }
        });
    }

    /**
     * CONTACT FORM HANDLER
     */
    static initContactForm() {
        const contactForm = document.querySelector('form[id*="contact"]');
        if (!contactForm) return;

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('input[name="name"]')?.value.trim();
            const email = contactForm.querySelector('input[type="email"]')?.value.trim();
            const subject = contactForm.querySelector('input[name="subject"]')?.value.trim();
            const message = contactForm.querySelector('textarea[name="message"]')?.value.trim();

            // Validation
            if (!name || !email || !subject || !message) {
                showToast('Please fill all fields', 'error');
                return;
            }

            if (!this.validate.email(email)) {
                showToast('Invalid email address', 'error');
                return;
            }

            try {
                FormHandler.showLoading(contactForm);

                // Store contact message
                const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
                contacts.push({
                    id: Date.now(),
                    name, email, subject, message,
                    date: new Date().toISOString()
                });
                localStorage.setItem('contacts', JSON.stringify(contacts));

                showToast('Message sent successfully! We\'ll respond within 24 hours.', 'success');
                contactForm.reset();
            } catch (error) {
                showToast('Failed to send message', 'error');
            } finally {
                FormHandler.hideLoading(contactForm);
            }
        });
    }

    /**
     * SUPPORT TICKET FORM HANDLER
     */
    static initSupportTicketForm() {
        const ticketForm = document.querySelector('form[id*="ticket"]') || 
                          document.querySelector('form[class*="ticket"]');
        if (!ticketForm) return;

        ticketForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const category = ticketForm.querySelector('select[name*="category"]')?.value;
            const subject = ticketForm.querySelector('input[name*="subject"]')?.value.trim();
            const message = ticketForm.querySelector('textarea[name*="message"]')?.value.trim();

            if (!category || !subject || !message) {
                showToast('Please fill all fields', 'error');
                return;
            }

            try {
                FormHandler.showLoading(ticketForm);

                const user = await apiService.getLoggedInUser();
                const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
                
                tickets.push({
                    id: 'TKT-' + Date.now(),
                    userId: user.id,
                    category,
                    subject,
                    message,
                    status: 'Open',
                    createdAt: new Date().toISOString(),
                    replies: []
                });

                localStorage.setItem('supportTickets', JSON.stringify(tickets));
                showToast('Support ticket created successfully!', 'success');
                ticketForm.reset();
            } catch (error) {
                showToast('Failed to create ticket', 'error');
            } finally {
                FormHandler.hideLoading(ticketForm);
            }
        });
    }

    /**
     * HELPER FUNCTIONS
     */
    static showLoading(form) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Processing...';
        }
    }

    static hideLoading(form) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || 'Submit';
        }
    }

    /**
     * INITIALIZE ALL FORMS
     */
    static initAll() {
        this.initLoginForm();
        this.initSignupForm();
        this.initDepositForm();
        this.initWithdrawalForm();
        this.initProfileForm();
        this.initPasswordChangeForm();
        this.initContactForm();
        this.initSupportTicketForm();
    }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FormHandler.initAll());
} else {
    FormHandler.initAll();
}
