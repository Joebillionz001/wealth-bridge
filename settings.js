import { showToast } from '../notifications.js';
import { showError, clearError } from '../auth.js';

export const handleSettingsPage = () => {
    const updateEmailForm = document.getElementById('update-email-form');
    if (!updateEmailForm) return;

    const updatePasswordForm = document.getElementById('update-password-form');
    const currentEmailInput = document.getElementById('current-email');
    const loggedInUser = localStorage.getItem('loggedInUser');
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!loggedInUser || !storedUser) {
        window.location.href = 'login.html';
        return;
    }

    currentEmailInput.value = storedUser.email;

    updateEmailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEmailInput = e.target['new-email'];
        clearError(newEmailInput);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailInput.value)) {
            showError(newEmailInput, 'Please enter a valid email address.');
            return;
        }

        storedUser.email = newEmailInput.value;
        localStorage.setItem('user', JSON.stringify(storedUser));
        showToast('Email updated successfully!', 'success');
        currentEmailInput.value = newEmailInput.value;
        newEmailInput.value = '';
    });

    updatePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPassword = e.target['current-password'].value;
        const newPassword = e.target['new-password'].value;
        const confirmNewPassword = e.target['confirm-new-password'].value;
        const currentPasswordInput = e.target['current-password'];
        const newPasswordInput = e.target['new-password'];
        const confirmNewPasswordInput = e.target['confirm-new-password'];
        let isValid = true;

        [currentPasswordInput, newPasswordInput, confirmNewPasswordInput].forEach(clearError);

        if (currentPassword !== storedUser.password) {
            showError(currentPasswordInput, 'Current password does not match.');
            isValid = false;
        }
        if (newPassword.length < 8) {
            showError(newPasswordInput, 'New password must be at least 8 characters long.');
            isValid = false;
        }
        if (newPassword !== confirmNewPassword) {
            showError(confirmNewPasswordInput, 'Passwords do not match.');
            isValid = false;
        }

        if (!isValid) return;

        storedUser.password = newPassword;
        localStorage.setItem('user', JSON.stringify(storedUser));

        showToast('Password updated successfully!', 'success');
        e.target.reset();
    });

    const deleteAccountForm = document.getElementById('delete-account-form');
    if (deleteAccountForm) {
        deleteAccountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
                const deleteButton = e.target.querySelector('.submit-button');
                deleteButton.classList.add('loading');
                deleteButton.disabled = true;

                setTimeout(() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('loggedInUser');
                    localStorage.removeItem('selectedInvestmentPlan');
                    localStorage.removeItem('rememberedEmail');
                    showToast('Your account has been permanently deleted.', 'info');
                    setTimeout(() => window.location.href = 'index.html', 2000);
                }, 1500);
            }
        });
    }
};

export const handleLogoutEverywhere = () => {
     const logoutEverywhereForm = document.getElementById('logout-everywhere-form');
     if (logoutEverywhereForm) {
         logoutEverywhereForm.addEventListener('submit', (e) => {
             e.preventDefault();
             if (confirm('Are you sure you want to log out of all devices?')) {
                 const logoutButton = e.target.querySelector('.submit-button');
                 logoutButton.classList.add('loading');
                 logoutButton.disabled = true;
 
                 setTimeout(() => {
                     localStorage.removeItem('loggedInUser');
                     localStorage.removeItem('selectedInvestmentPlan');
                     localStorage.removeItem('transactions');
                     showToast('You have been logged out everywhere.', 'info');
                     setTimeout(() => window.location.href = 'login.html', 2000);
                 }, 1500);
             }
         });
     }
};