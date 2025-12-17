import { showToast } from './notifications.js';

// --- General Site UI Functions ---

const handleBackToTop = () => {
    const backToTopBtn = document.getElementById("back-to-top");
    if (backToTopBtn) {
        const scrollFunction = () => {
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };
        window.addEventListener('scroll', scrollFunction);
        backToTopBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

const handleScrollAnimation = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1
    });

    const sectionsToAnimate = document.querySelectorAll('main .section, main .article-section');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });
};

const handleDarkMode = () => {
    const themeToggle = document.getElementById('theme-switch');
    if (themeToggle) {
        // Check for saved theme in localStorage
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
};

const handleCompoundInterestCalculator = () => {
    const calculator = document.getElementById('compound-interest-calculator');
    if (!calculator) return;

    const form = document.getElementById('compound-interest-form');
    const initialInput = document.getElementById('initial-investment');
    const monthlyInput = document.getElementById('monthly-contribution');
    const yearsInput = document.getElementById('investment-years');
    const rateInput = document.getElementById('interest-rate');

    const endBalanceEl = document.getElementById('end-balance');
    const totalContributionsEl = document.getElementById('total-contributions');
    const totalInterestEl = document.getElementById('total-interest');

    let chart;
    const calculate = () => {
        const P = parseFloat(initialInput.value) || 0;
        const PMT = parseFloat(monthlyInput.value) || 0;
        const t = parseFloat(yearsInput.value) || 0;
        const r = (parseFloat(rateInput.value) || 0) / 100;
        const n = 12; // Compounded monthly

        const labels = [];
        const principalData = [];
        const interestData = [];

        // Future value of a series formula for monthly contributions
        const fvSeries = PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
        // Future value of the principal investment
        const fvPrincipal = P * Math.pow(1 + r / n, n * t);

        const total = fvPrincipal + fvSeries;
        const totalContributions = P + (PMT * t * 12);
        const totalInterest = total - totalContributions;

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        endBalanceEl.textContent = formatter.format(total);
        totalContributionsEl.textContent = formatter.format(totalContributions);
        totalInterestEl.textContent = formatter.format(totalInterest);

        // Chart Data Calculation
        for (let i = 0; i <= t; i++) {
            labels.push(`Year ${i}`);
            const fvSeriesYear = PMT * ((Math.pow(1 + r / n, n * i) - 1) / (r / n));
            const fvPrincipalYear = P * Math.pow(1 + r / n, n * i);
            const totalContributionsYear = P + (PMT * i * 12);
            principalData.push(totalContributionsYear);
            interestData.push(fvPrincipalYear + fvSeriesYear - totalContributionsYear);
        }

        if (chart) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = principalData;
            chart.data.datasets[1].data = interestData;
            chart.update();
        }
    };

    // Calculate on input change
    form.addEventListener('input', calculate);

    // Initial chart setup
    const ctx = document.getElementById('compound-interest-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Contributions',
                data: [],
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
            }, {
                label: 'Total Interest',
                data: [],
                backgroundColor: 'rgba(23, 162, 184, 0.6)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, ticks: { callback: value => `$${value / 1000}k` } }
            }
        }
    });

    // Initial calculation
    calculate();
};

const handleRetirementCalculator = () => {
    const calculator = document.getElementById('retirement-savings-calculator');
    if (!calculator) return;

    const form = document.getElementById('retirement-savings-form');
    const currentAgeInput = document.getElementById('current-age');
    const retirementAgeInput = document.getElementById('retirement-age');
    const currentSavingsInput = document.getElementById('current-savings');
    const monthlyContributionInput = document.getElementById('ret-monthly-contribution');
    const interestRateInput = document.getElementById('ret-interest-rate');

    const endBalanceEl = document.getElementById('ret-end-balance');
    const totalContributionsEl = document.getElementById('ret-total-contributions');
    const totalInterestEl = document.getElementById('ret-total-interest');

    let chart;
    const calculate = () => {
        const currentAge = parseFloat(currentAgeInput.value) || 0;
        const retirementAge = parseFloat(retirementAgeInput.value) || 0;
        const P = parseFloat(currentSavingsInput.value) || 0; // Principal (current savings)
        const PMT = parseFloat(monthlyContributionInput.value) || 0; // Monthly contribution
        const r = (parseFloat(interestRateInput.value) || 0) / 100; // Annual rate
        const n = 12; // Compounded monthly
        const t = retirementAge - currentAge; // Years to invest

        const labels = [];
        const principalData = [];
        const interestData = [];

        if (t <= 0) {
            // Handle case where retirement age is not in the future
            endBalanceEl.textContent = '$0';
            totalContributionsEl.textContent = '$0';
            totalInterestEl.textContent = '$0';
            if(chart) chart.destroy();
            return;
        }

        // Future value of a series formula for monthly contributions
        const fvSeries = PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
        // Future value of the principal investment
        const fvPrincipal = P * Math.pow(1 + r / n, n * t);

        const total = fvPrincipal + fvSeries;
        const totalContributions = P + (PMT * t * 12);
        const totalInterest = total - totalContributions;

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        endBalanceEl.textContent = formatter.format(total);
        totalContributionsEl.textContent = formatter.format(totalContributions);
        totalInterestEl.textContent = formatter.format(totalInterest);

        // Chart Data Calculation
        for (let i = 0; i <= t; i++) {
            labels.push(currentAge + i);
            const fvSeriesYear = PMT * ((Math.pow(1 + r / n, n * i) - 1) / (r / n));
            const fvPrincipalYear = P * Math.pow(1 + r / n, n * i);
            const totalContributionsYear = P + (PMT * i * 12);
            principalData.push(totalContributionsYear);
            interestData.push(fvPrincipalYear + fvSeriesYear - totalContributionsYear);
        }

        if (chart) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = principalData;
            chart.data.datasets[1].data = interestData;
            chart.update();
        }
    };

    const ctx = document.getElementById('retirement-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Contributions',
                data: [],
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
            }, {
                label: 'Total Interest',
                data: [],
                backgroundColor: 'rgba(23, 162, 184, 0.6)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, title: { display: true, text: 'Age' } },
                y: { stacked: true, ticks: { callback: value => `$${value / 1000}k` } }
            }
        }
    });
    
    form.addEventListener('input', calculate);
    calculate();
};

const handleMortgageCalculator = () => {
    const calculator = document.getElementById('mortgage-calculator');
    if (!calculator) return;

    const form = document.getElementById('mortgage-calculator-form');
    const homePriceInput = document.getElementById('home-price');
    const downPaymentInput = document.getElementById('down-payment');
    const loanTermInput = document.getElementById('loan-term');
    const interestRateInput = document.getElementById('mortgage-interest-rate');
    const monthlyPaymentEl = document.getElementById('monthly-payment');

    let chart;
    const calculate = () => {
        const homePrice = parseFloat(homePriceInput.value) || 0;
        const downPayment = parseFloat(downPaymentInput.value) || 0;
        const P = homePrice - downPayment; // Loan Principal
        const t = parseFloat(loanTermInput.value) || 0; // Loan term in years
        const annualRate = (parseFloat(interestRateInput.value) || 0) / 100;
        
        if (P <= 0 || t <= 0 || annualRate <= 0) {
            monthlyPaymentEl.textContent = '$0.00';
            return;
        }

        const r = annualRate / 12; // Monthly interest rate
        const n = t * 12; // Total number of payments

        // Monthly mortgage payment formula: M = P * [r(1+r)^n] / [(1+r)^n – 1]
        const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        monthlyPaymentEl.textContent = formatter.format(monthlyPayment);

        // Chart Data
        const totalInterest = (monthlyPayment * n) - P;
        if (chart) {
            chart.data.datasets[0].data = [P, totalInterest];
            chart.update();
        }
    };

    const ctx = document.getElementById('mortgage-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Total Interest'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(0, 123, 255, 0.7)',
                    'rgba(220, 53, 69, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 123, 255, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
    
    form.addEventListener('input', calculate);
    calculate();
};

const handleInvestmentPlans = () => {
    const selectButtons = document.querySelectorAll('.plan-card a.cta-button');
    const planMessage = document.getElementById('plan-message');
    if (!selectButtons.length && !planMessage) return;

    const loggedInUser = localStorage.getItem('loggedInUser');

    // Display a message if the user already has a plan
    if (loggedInUser && planMessage) {
        const currentPlan = localStorage.getItem('selectedInvestmentPlan');
        if (currentPlan) {
            planMessage.textContent = `You are currently invested in the "${currentPlan}". Selecting a new plan will replace your current one.`;
            planMessage.className = 'message info'; // Use a new 'info' class
            planMessage.style.display = 'block';
        }
    }

    selectButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!loggedInUser) {
                e.preventDefault(); // Prevent navigation to payment page
                showToast('Please log in to select an investment plan.', 'error');
                setTimeout(() => window.location.href = 'login.html', 1500);
            }
            // If logged in, the link proceeds as normal.
        });
    });
};

const handleCookieConsent = () => {
    const banner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('cookie-accept-btn');
    const declineBtn = document.getElementById('cookie-decline-btn');

    if (!banner || !acceptBtn || !declineBtn) return;

    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        banner.classList.add('show');
    }

    const handleConsent = (value) => {
        localStorage.setItem('cookieConsent', value);
        banner.classList.remove('show');
    };

    acceptBtn.addEventListener('click', () => handleConsent('accepted'));
    declineBtn.addEventListener('click', () => handleConsent('declined'));
};

const handleSiteSearch = async () => {
    const searchResultsList = document.getElementById('search-results-list');
    if (!searchResultsList) return;

    const searchTitle = document.getElementById('search-results-title');
    const noResultsMessage = document.getElementById('no-results-message');
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q')?.toLowerCase().trim();

    if (!query) {
        searchTitle.textContent = 'Please enter a search term.';
        return;
    }

    searchTitle.textContent = `Search Results for: "${query}"`;

    try {
        const response = await fetch('search-index.json');
        const index = await response.json();

        const results = index.filter(item => 
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.keywords.toLowerCase().includes(query)
        );

        if (results.length > 0) {
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `<h3><a href="${result.url}">${result.title}</a></h3><p>${result.description}</p>`;
                searchResultsList.appendChild(item);
            });
        } else {
            noResultsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching search index:', error);
        noResultsMessage.textContent = 'Could not perform search. Please try again later.';
        noResultsMessage.style.display = 'block';
    }
};

const handleBlogFiltering = () => {
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) return;

    const articleCards = document.querySelectorAll('.article-card');
    const categoryLinks = categoryList.querySelectorAll('a');

    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const selectedCategory = link.dataset.category;

            articleCards.forEach(card => {
                const cardCategory = card.dataset.category;
                if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
};

export function initUI() {
    handleBackToTop();
    handleScrollAnimation();
    handleDarkMode();
    handleCompoundInterestCalculator();
    handleRetirementCalculator();
    handleMortgageCalculator();
    handleInvestmentPlans();
    handleCookieConsent();
    handleSiteSearch();
    handleBlogFiltering();
}