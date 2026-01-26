/**
 * Performance Optimization Module
 * Handles faster loading and page transitions
 */
class PerformanceOptimizer {
    static init() {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            }).then((reg) => {
                console.log('Service Worker registered successfully');
            }).catch((err) => {
                console.log('Service Worker registration failed:', err);
            });
        }

        // Setup quick click handlers
        this.setupFastClickHandlers();
        
        // Prefetch resources
        this.prefetchResources();
        
        // Enable resource hints
        this.addResourceHints();
    }

    static setupFastClickHandlers() {
        // Remove 300ms click delay on mobile
        document.addEventListener('touchstart', () => {}, false);

        // Use event delegation for faster click handling
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && this.isInternalLink(link.href)) {
                e.preventDefault();
                this.loadPageFast(link.href);
            }
        }, { capture: true });
    }

    static isInternalLink(href) {
        const url = new URL(href, window.location.origin);
        return url.origin === window.location.origin && !href.includes('#');
    }

    static loadPageFast(url) {
        // Show loading spinner
        const spinner = document.getElementById('spinner-overlay');
        if (spinner) {
            spinner.classList.remove('hidden');
        }

        // Start timing
        const startTime = performance.now();

        // Prefetch the page
        fetch(url, { priority: 'high' })
            .then((response) => response.text())
            .then((html) => {
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                // If load is already fast, navigate immediately
                if (loadTime < 100) {
                    window.location.href = url;
                } else {
                    // Stagger the navigation
                    setTimeout(() => {
                        window.location.href = url;
                    }, Math.max(0, 100 - loadTime));
                }
            })
            .catch(() => {
                // Fallback to direct navigation
                window.location.href = url;
            });
    }

    static prefetchResources() {
        // Prefetch commonly used resources
        const resourcesToPrefetch = [
            '/dashboard.html',
            '/investments.html',
            '/my-portfolio.html',
            '/profile.html',
            '/settings.html'
        ];

        resourcesToPrefetch.forEach((url) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = 'document';
            document.head.appendChild(link);
        });

        // Prefetch JavaScript modules
        const modulesPrefetch = [
            '/dashboard.js',
            '/investments.js',
            '/portfolio.js',
            '/profile.js'
        ];

        modulesPrefetch.forEach((url) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = 'script';
            document.head.appendChild(link);
        });
    }

    static addResourceHints() {
        const hints = [
            { rel: 'dns-prefetch', href: '//' + window.location.hostname },
            { rel: 'preconnect', href: window.location.origin }
        ];

        hints.forEach(({ rel, href }) => {
            const link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            document.head.appendChild(link);
        });
    }

    // Hide spinner
    static hideSpinner() {
        const spinner = document.getElementById('spinner-overlay');
        if (spinner) {
            setTimeout(() => {
                spinner.classList.add('hidden');
            }, 300);
        }
    }

    // Performance metrics
    static logPerformanceMetrics() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const metrics = {
                'DNS lookup': timing.domainLookupEnd - timing.domainLookupStart,
                'TCP connection': timing.connectEnd - timing.connectStart,
                'Time to First Byte': timing.responseStart - timing.requestStart,
                'DOM Load': timing.domInteractive - timing.navigationStart,
                'Resource Load': timing.loadEventEnd - timing.navigationStart,
                'DOM Content Loaded': timing.domContentLoadedEventEnd - timing.navigationStart
            };

            console.table(metrics);
        }
    }

    // Lazy loading for images
    static enableLazyLoading() {
        if ('IntersectionObserver' in window) {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach((img) => imageObserver.observe(img));
        }
    }

    // Reduce animation on slow connections
    static detectSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;

            if (effectiveType === '2g' || effectiveType === '3g' || connection.saveData) {
                document.documentElement.classList.add('slow-connection');
            }
        }
    }

    // Request idle callback for non-critical tasks
    static scheduleIdleTask(callback) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback);
        } else {
            setTimeout(callback, 0);
        }
    }
}

// Initialize performance optimizations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PerformanceOptimizer.init();
        PerformanceOptimizer.enableLazyLoading();
        PerformanceOptimizer.detectSlowConnection();
    });
} else {
    PerformanceOptimizer.init();
    PerformanceOptimizer.enableLazyLoading();
    PerformanceOptimizer.detectSlowConnection();
}

// Hide spinner on page load complete
window.addEventListener('load', () => {
    PerformanceOptimizer.hideSpinner();
    PerformanceOptimizer.logPerformanceMetrics();
});

export { PerformanceOptimizer };
