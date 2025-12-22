import { getLoggedInUser, updateUser, showToast } from './utils.js';
import { apiService } from './api-service.js';

export function initProfilePage() {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Pre-fill form data
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    
    // Load profile picture if exists
    if (user.profilePic) {
        document.getElementById('profile-picture-preview').src = user.profilePic;
    }

    setupProfileHandlers(user);
}

function setupProfileHandlers(user) {
    // 1. Handle Profile Picture Upload (Preview only for prototype)
    const pictureInput = document.getElementById('picture-upload');
    const previewImg = document.getElementById('profile-picture-preview');
    const pictureForm = document.getElementById('picture-form');

    if (pictureInput && previewImg) {
        pictureInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    // In a real app, you'd upload this. Here we save the dataURL to localStorage (careful with size)
                    user.profilePic = e.target.result;
                    updateUser(user);
                    showToast("Profile picture updated!", "success");
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if (pictureForm) {
        pictureForm.addEventListener('submit', (e) => e.preventDefault());
    }

    // 2. Handle Profile Details Update
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showSpinner();
            try {
                user.name = document.getElementById('name').value;
                user.email = document.getElementById('email').value;
                
                await updateUser(user);
                showToast("Profile details updated successfully.", "success");
            } finally {
                hideSpinner();
            }
            
            // Update welcome message if on dashboard (reload might be needed or event bus)
        });
    }

    // 3. Handle Password Change
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showSpinner();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;

            if (newPassword.length < 6) {
                showToast("New password must be at least 6 characters.", "error");
                hideSpinner();
                return;
            }

            try {
                await apiService.changePassword(currentPassword, newPassword);
                showToast("Password changed successfully.", "success");
                passwordForm.reset();
            } catch (err) {
                showToast(err.message || "Failed to change password.", "error");
            } finally {
                hideSpinner();
            }
        });
    }
}