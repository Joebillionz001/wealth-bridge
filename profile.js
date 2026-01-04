import { getLoggedInUser, updateUser, showToast } from './utils.js';
import { apiService } from './api-service.js';

export function initProfilePage() {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // 1. Populate User Data
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const profileImg = document.getElementById('profile-picture-preview');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    
    // Prioritize custom upload, then Google picture, then default placeholder
    if (profileImg) {
        if (user.profileImage) {
            profileImg.src = user.profileImage;
        } else if (user.picture) {
            profileImg.src = user.picture;
        }
    }

    // 2. Handle Profile Picture Upload
    const fileInput = document.getElementById('picture-upload');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Basic validation (Max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showToast("Image size must be less than 2MB.", "error");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target.result;
                
                // Update UI
                if (profileImg) profileImg.src = base64String;
                
                // Save to User Object
                user.profileImage = base64String;
                updateUser(user);
                showToast("Profile picture updated!", "success");
            };
            reader.readAsDataURL(file);
        });
    }

    // 3. Handle Profile Details Update
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            user.name = nameInput.value.trim();
            user.email = emailInput.value.trim();
            
            try {
                await updateUser(user);
                showToast("Profile details saved successfully.", "success");
            } catch (err) {
                showToast("Failed to update profile.", "error");
            }
        });
    }

    // 4. Handle Password Change
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;

            try {
                await apiService.changePassword(currentPassword, newPassword);
                showToast("Password changed successfully.", "success");
                passwordForm.reset();
            } catch (err) {
                showToast(err.message || "Failed to change password.", "error");
            }
        });
    }
}