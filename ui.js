/**
 * Shows the loading spinner overlay.
 */
export function showSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    if (spinner) {
        spinner.classList.remove('hidden');
    }
}

/**
 * Hides the loading spinner overlay.
 */
export function hideSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    if (spinner) {
        spinner.classList.add('hidden');
    }
}

/**
 * Displays a toast notification.
 * @param {string} message The message to display.
 * @param {string} type The type of notification ('success', 'error', 'info'). Defaults to 'info'.
 * @param {number} duration The duration in ms to show the notification. Defaults to 3000ms.
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove the toast after the duration
    setTimeout(() => {
        toast.remove();
    }, duration);
}