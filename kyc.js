import { apiService } from './api-service.js';
import { showToast, showSpinner, hideSpinner } from './ui.js';
import { getLoggedInUser } from './utils.js';

export function initKycPage() {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    if (user.kycStatus === 'verified') {
        document.querySelector('.form-container').innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h1 style="color: var(--primary-color);">Verified ✓</h1>
                <p>Your identity has been verified. You have full access to WealthBridge.</p>
                <a href="dashboard.html" class="btn btn-primary">Go to Dashboard</a>
            </div>
        `;
        return;
    } else if (user.kycStatus === 'pending') {
        document.querySelector('.form-container').innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h1>Pending Review ⏳</h1>
                <p>Your documents have been submitted and are currently under review.</p>
                <a href="dashboard.html" class="btn btn-secondary">Back to Dashboard</a>
            </div>
        `;
        return;
    }

    const form = document.getElementById('kyc-form');
    if (form) {
        // Pre-fill name
        document.getElementById('full-name').value = user.name;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            showSpinner();

            try {
                // In a real app, we would upload the file to a server.
                // Here we just simulate the submission state update.
                await apiService.submitKyc({ status: 'pending' });
                showToast("KYC submitted successfully!", "success");
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                showToast("Failed to submit KYC.", "error");
            } finally {
                hideSpinner();
            }
        });
    }
}