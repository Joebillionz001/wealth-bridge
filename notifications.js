const toastContainer = document.getElementById('toast-container');

/**
 * Shows a toast notification.
 * @param {string} message The message to display.
 * @param {string} type The type of toast (success, error, info).
 * @param {number} duration The duration in milliseconds.
 */
export function showToast(message, type = 'info', duration = 5000) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}