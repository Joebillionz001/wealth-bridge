import { getStorageItem, setStorageItem, showToast } from './utils.js';

export function initSettingsPage() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const emailToggle = document.getElementById('email-notifications-toggle');
    const body = document.body;

    // 1. Sync Dark Mode Toggle
    if (darkModeToggle) {
        // Set initial state based on current body class or storage
        const isDarkMode = body.classList.contains('dark-mode') || getStorageItem('theme') === 'dark';
        darkModeToggle.checked = isDarkMode;

        darkModeToggle.addEventListener('change', () => {
            // Trigger the global theme toggle button click to reuse logic in main.js
            const globalThemeBtn = document.getElementById('theme-toggle');
            if (globalThemeBtn) globalThemeBtn.click();
        });
    }

    // 2. Handle Email Notifications (Mock preference)
    if (emailToggle) {
        const emailPref = getStorageItem('emailNotifications');
        emailToggle.checked = emailPref === null ? true : emailPref === 'true';

        emailToggle.addEventListener('change', () => {
            setStorageItem('emailNotifications', emailToggle.checked);
            const status = emailToggle.checked ? "enabled" : "disabled";
            showToast(`Email notifications ${status}.`, "info");
        });
    }
}