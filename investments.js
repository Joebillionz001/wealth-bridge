import { INVESTMENT_PLANS } from './config.js';
import { formatCurrency, getLoggedInUser } from './utils.js';
import { showToast } from './ui.js';
import { apiService } from './api-service.js';

// Pagination State
let currentPage = 1;
const itemsPerPage = 6;

export function initInvestmentsPage() {
    if (!getLoggedInUser()) {
        window.location.href = 'login.html';
        return;
    }

    renderInvestments();
    renderRecommendations();

    // Event delegation for "Invest Now" buttons
    const container = document.getElementById('investments-container');
    if (container) {
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('invest-btn')) {
                handleInvestment(e);
            }
            // Handle Favorite Button Click
            if (e.target.closest('.favorite-btn')) {
                handleToggleFavorite(e);
            }
        });
    }

    // Event delegation for Recommendations "Invest Now" buttons
    const recContainer = document.getElementById('recommendations-container');
    if (recContainer) {
        recContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('invest-btn')) {
                handleInvestment(e);
            }
        });
    }

    // Search functionality
    const searchInput = document.getElementById('investment-search');
    const sortSelect = document.getElementById('investment-sort');
    const favoritesCheckbox = document.getElementById('investment-favorites');

    const renderCurrentView = () => {
        const searchValue = searchInput ? searchInput.value : '';
        const sortValue = sortSelect ? sortSelect.value : 'default';
        const showFavorites = favoritesCheckbox ? favoritesCheckbox.checked : false;
        renderInvestments(searchValue, sortValue, showFavorites);
    };

    const handleFilterChange = () => {
        currentPage = 1; // Reset to first page on filter change
        renderCurrentView();
    };

    if (searchInput) {
        searchInput.addEventListener('input', handleFilterChange);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', handleFilterChange);
    }
    if (favoritesCheckbox) {
        favoritesCheckbox.addEventListener('change', handleFilterChange);
    }

    // Load More Event Listener
    const loadMoreBtn = document.getElementById('inv-load-more-btn');

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            renderCurrentView();
        });
    }
}

function renderInvestments(filterText = '', sortValue = 'default', showFavorites = false) {
    const container = document.getElementById('investments-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear loading state

    const user = getLoggedInUser();
    const userFavorites = user ? (user.favorites || []) : [];

    let filteredPlans = INVESTMENT_PLANS.filter(plan => {
        const matchesText = plan.name.toLowerCase().includes(filterText.toLowerCase()) ||
                            plan.category.toLowerCase().includes(filterText.toLowerCase());
        const matchesFavorite = showFavorites ? userFavorites.includes(plan.name) : true;
        return matchesText && matchesFavorite;
    });

    // Apply Sorting
    if (sortValue !== 'default') {
        filteredPlans.sort((a, b) => {
            switch (sortValue) {
                case 'price-asc': return a.min - b.min;
                case 'price-desc': return b.min - a.min;
                case 'roi-asc': return a.roi - b.roi;
                case 'roi-desc': return b.roi - a.roi;
                default: return 0;
            }
        });
    }

    // --- Load More Logic ---
    const totalItems = filteredPlans.length;
    const currentLimit = currentPage * itemsPerPage;
    const paginatedPlans = filteredPlans.slice(0, currentLimit);

    updateLoadMoreButton(totalItems, currentLimit);

    if (filteredPlans.length === 0) {
        container.innerHTML = '<div class="card"><p>No investment plans found matching your search.</p></div>';
        return;
    }

    // Group the *paginated* plans by category
    // Note: This might split categories across pages, which is expected behavior for a paginated list
    const categories = {};

    paginatedPlans.forEach(plan => {
        if (!categories[plan.category]) {
            categories[plan.category] = [];
        }
        categories[plan.category].push(plan);
    });

    // Render each category in its own card
    for (const [category, plans] of Object.entries(categories)) {
        const categorySection = document.createElement('section');
        categorySection.className = 'card';
        
        const header = document.createElement('h2');
        header.textContent = category;
        categorySection.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'plans-grid';

        grid.innerHTML = plans.map(plan => createPlanCardHTML(plan)).join('');

        categorySection.appendChild(grid);
        container.appendChild(categorySection);
    }
    startUrgencyTimers();
}

/**
 * Starts the countdown timers for investment plans.
 */
function startUrgencyTimers() {
    // Clear any existing intervals to prevent memory leaks on re-render
    window.activeInvestmentTimers = window.activeInvestmentTimers || [];
    window.activeInvestmentTimers.forEach(clearInterval);
    window.activeInvestmentTimers = [];

    const timers = document.querySelectorAll('.timer');
    timers.forEach(timer => {
        let time = 3600 + Math.random() * 10800; 
        
        const interval = setInterval(() => {
            time--;
            if (time < 0) time = 3600 + Math.random() * 10800;
            
            const hours = Math.floor(time / 3600);
            const minutes = Math.floor((time % 3600) / 60);
            const seconds = Math.floor(time % 60);
            
            timer.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
        
        window.activeInvestmentTimers.push(interval);
    });
}

function updateLoadMoreButton(totalItems, currentLimit) {
    const container = document.getElementById('investments-load-more');

    if (totalItems <= currentLimit) {
        container.style.display = 'none';
    } else {
        container.style.display = 'flex';
    }
}

function renderRecommendations() {
    const user = getLoggedInUser();
    const section = document.getElementById('recommendations-section');
    const container = document.getElementById('recommendations-container');
    
    if (!user || !section || !container) return;

    // If user has no investments, hide recommendations
    if (!user.investments || user.investments.length === 0) {
        section.classList.add('hidden');
        return;
    }

    // Analyze history to find most frequent category
    const categoryCounts = {};
    user.investments.forEach(inv => {
        const planConfig = INVESTMENT_PLANS.find(p => p.name === inv.planName);
        if (planConfig) {
            categoryCounts[planConfig.category] = (categoryCounts[planConfig.category] || 0) + 1;
        }
    });

    let topCategory = null;
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topCategory = cat;
        }
    }

    if (!topCategory) {
        section.classList.add('hidden');
        return;
    }

    // Get top 3 plans from the most frequent category
    const recommendations = INVESTMENT_PLANS.filter(p => p.category === topCategory).slice(0, 3);

    if (recommendations.length > 0) {
        section.classList.remove('hidden');
        container.innerHTML = recommendations.map(plan => createPlanCardHTML(plan)).join('');
    } else {
        section.classList.add('hidden');
    }
}

function createPlanCardHTML(plan) {
    const user = getLoggedInUser();
    const isFavorite = user.favorites && user.favorites.includes(plan.name);
    const heartClass = isFavorite ? 'active' : '';
    const heartIcon = '♥'; // Simple unicode heart

    return `
        <div class="plan-card">
            <button class="favorite-btn ${heartClass}" data-plan-name="${plan.name}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">${heartIcon}</button>
            <h4>${plan.name}</h4>
            <p class="plan-desc">${plan.description}</p>
            <div class="plan-details">
                <p><strong>Price:</strong> ${formatCurrency(plan.min)}</p>
                <p><strong>Return:</strong> ${plan.roi}% weekly</p>
                <p class="urgency">Closing in: <span class="timer">02:14:59</span></p>
            </div>
            <button class="btn btn-primary invest-btn" data-plan-name="${plan.name}">Invest Now</button>
        </div>
    `;
}

function handleInvestment(e) {
    const planName = e.target.dataset.planName;
    const plan = INVESTMENT_PLANS.find(p => p.name === planName);
    const user = getLoggedInUser();
    const amount = plan.min;

    // --- PAYSTACK INTEGRATION ---
    const PAYSTACK_PUBLIC_KEY = "pk_live_fbf001f175602c4223a1a576070b9c422eb874e1";

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: amount * 100, // Paystack amount is in kobo
        ref: 'wltbrg-' + Date.now(),
        onClose: function() {
            showToast("Investment cancelled.", "info");
        },
        callback: async function(response) {
            showToast("Payment successful! Finalizing investment...", "success");
            try {
                await apiService.verifyInvestment(response.reference, plan.name, amount);
                showToast("Investment active! Redirecting to portfolio...", "success");
                setTimeout(() => {
                    window.location.href = 'my-portfolio.html';
                }, 2000);
            } catch (err) {
                showToast(err.message || "Failed to finalize investment.", "error");
            }
        }
    });
    handler.openIframe();
}

async function handleToggleFavorite(e) {
    const btn = e.target.closest('.favorite-btn');
    const planName = btn.dataset.planName;
    
    try {
        const updatedUser = await apiService.toggleFavorite(planName);
        
        // Update UI immediately
        const isNowFavorite = updatedUser.favorites.includes(planName);
        if (isNowFavorite) {
            btn.classList.add('active');
            showToast(`Added ${planName} to favorites`, 'success');
        } else {
            btn.classList.remove('active');
            showToast(`Removed ${planName} from favorites`, 'info');
        }
    } catch (err) {
        showToast("Failed to update favorites", "error");
    }
}