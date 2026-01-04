document.addEventListener('DOMContentLoaded', () => {
    // 1. Populate Navigation Links
    const navLinksContainer = document.getElementById('main-nav-links');
    if (navLinksContainer) {
        const links = [
            { text: 'Home', href: 'index.html' },
            { text: 'Features', href: '#features' },
            { text: 'Login', href: 'login.html' },
            { text: 'Sign Up', href: 'signup.html', className: 'btn btn-primary' }
        ];

        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.text;
            if (link.className) {
                a.className = link.className;
            }
            li.appendChild(a);
            navLinksContainer.appendChild(li);
        });
    }

    // 2. Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
        });
    }

    // 3. Mobile Menu Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
});