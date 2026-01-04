import { showToast as uiShowToast } from './ui.js';

export const EXCHANGE_RATE = 1500; // Example USD to NGN rate

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

export function getLoggedInUser() {
    const userStr = localStorage.getItem('loggedInUser');
    return userStr ? JSON.parse(userStr) : null;
}

export function updateUser(user) {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
}

export function getStorageItem(key) {
    return localStorage.getItem(key);
}

export function setStorageItem(key, value) {
    localStorage.setItem(key, value);
}

// Re-export showToast for convenience
export function showToast(message, type, duration) {
    uiShowToast(message, type, duration);
}