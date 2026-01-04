export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add styles dynamically if not in CSS
    toast.style.padding = '1rem';
    toast.style.marginBottom = '1rem';
    toast.style.borderRadius = '4px';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    
    if (type === 'success') toast.style.backgroundColor = '#2ecc71';
    else if (type === 'error') toast.style.backgroundColor = '#e74c3c';
    else toast.style.backgroundColor = '#3498db';

    container.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
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