import { apiService } from './api-service.js';
import { showToast } from './ui.js';

// Re-export showToast for convenience if needed, or just import from ui.js directly
export { showToast };

export const EXCHANGE_RATE = 1650; // 1 USD = 1650 NGN

export function getLoggedInUser() {
    return apiService.getLoggedInUser();
}

export function updateUser(user) {
    apiService.updateUser(user);
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

export function getStorageItem(key) {
    return apiService.getStorageItem(key);
}

export function setStorageItem(key, value) {
    apiService.setStorageItem(key, value);
}