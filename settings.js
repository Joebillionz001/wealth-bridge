import { getStorageItem, setStorageItem, showToast, getLoggedInUser } from './utils.js';
import { apiService } from './api-service.js';

export function initSettingsPage() {
    if (!getLoggedInUser()) {
        window.location.href = 'login.html';
        return;
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const emailNotif = document.getElementById('email-notifications');
    const smsNotif = document.getElementById('sms-notifications');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    // Load saved theme state
    if (darkModeToggle) {
        darkModeToggle.checked = getStorageItem('theme') === 'dark';
        
        darkModeToggle.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            setStorageItem('theme', theme);
            
            // Apply class to body
            document.body.classList.toggle('dark-mode', theme === 'dark');
            
            // Update header toggle button text if it exists
            const headerToggle = document.getElementById('theme-toggle');
            if (headerToggle) headerToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            
            showToast(`Theme set to ${theme} mode`, 'success');
        });
    }

    // Mock saving notification preferences
    const savePrefs = () => {
        showToast('Notification preferences updated', 'success');
    };

    if (emailNotif) emailNotif.addEventListener('change', savePrefs);
    if (smsNotif) smsNotif.addEventListener('change', savePrefs);

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            // For a real app, this would delete the user from the DB.
            // Here we just show a confirmation and prevent accidental clicks.
            if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                showToast("Account deletion is disabled in this demo.", "info");
            }
        });
    }
}