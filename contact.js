import { showToast } from './ui.js';

export function initContactPage() {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulate API call
            showToast("Message sent! We will get back to you shortly.", "success");
            contactForm.reset();
        });
    }
}