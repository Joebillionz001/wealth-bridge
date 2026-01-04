/**
 * Displays a toast notification.
 * @param {string} message The message to display.
 * @param {string} type The type of notification ('success', 'error', 'info').
 * @param {number} duration Duration in ms.
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `notification ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger reflow to enable transition
    toast.offsetHeight;

    // Remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, duration);
}

export function showSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    if (spinner) spinner.classList.remove('hidden');
}

export function hideSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    if (spinner) spinner.classList.add('hidden');
}