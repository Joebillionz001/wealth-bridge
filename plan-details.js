import { INVESTMENT_PLANS, PAYSTACK_PUBLIC_KEY } from './config.js';
import { formatCurrency, getLoggedInUser, EXCHANGE_RATE, showToast } from './utils.js';
import { apiService } from './api-service.js';

// Global function for inline onclick handler
window.handleInvestmentClick = function() {
    const params = new URLSearchParams(window.location.search);
    const planName = params.get('plan');
    const plan = INVESTMENT_PLANS.find(p => p.name === planName);
    
    if (plan) {
        const amount = parseFloat(document.getElementById('investment-amount').value);
        if (isNaN(amount) || amount < plan.min || amount > plan.max) {
            showToast(`Please enter an amount between $${plan.min} and $${plan.max}`, "error");
            return;
        }
        handleDetailInvestment(plan, amount);
    }
};

export function initPlanDetailsPage() {
    const params = new URLSearchParams(window.location.search);
    const planName = params.get('plan');

    if (!planName) return;

    const plan = INVESTMENT_PLANS.find(p => p.name === planName);

    if (!plan) {
        document.body.innerHTML = '<div class="container" style="text-align: center; padding: 4rem 2rem;"><h1>Plan not found.</h1><p><a href="index.html" class="btn btn-primary">Back to Home</a></p></div>';
        return;
    }

    // Populate hero section
    const categoryEl = document.getElementById('plan-category');
    const titleEl = document.getElementById('plan-title');
    const descriptionEl = document.getElementById('plan-description');
    const riskEl = document.getElementById('plan-risk');
    const benefitsEl = document.getElementById('plan-benefits');
    const featuresEl = document.getElementById('features-list');
    const minEl = document.getElementById('min-amount');
    const maxEl = document.getElementById('max-amount');
    const statRoiEl = document.getElementById('stat-roi');
    const statDurationEl = document.getElementById('stat-duration');
    const amountRangeEl = document.getElementById('amount-range');

    if (categoryEl) categoryEl.textContent = plan.category;
    if (titleEl) titleEl.textContent = plan.name;
    if (descriptionEl) descriptionEl.textContent = plan.description;
    if (benefitsEl) benefitsEl.textContent = plan.benefits || "This plan offers a balanced approach to growth, securing your capital while providing competitive returns.";
    if (minEl) minEl.textContent = plan.min;
    if (maxEl) maxEl.textContent = plan.max;
    if (statRoiEl) statRoiEl.textContent = plan.roi + '%';
    if (statDurationEl) statDurationEl.textContent = plan.duration;
    
    // Set amount range text
    if (amountRangeEl) {
        amountRangeEl.textContent = `Min: $${plan.min.toLocaleString()} | Max: $${plan.max.toLocaleString()}`;
    }

    // Populate risk badge
    if (riskEl) {
        riskEl.innerHTML = `<span class="badge badge-${plan.riskLevel ? plan.riskLevel.toLowerCase() : 'medium'}" style="font-size: 0.9rem; padding: 0.25rem 0.75rem; border-radius: 20px;">Risk: ${plan.riskLevel || 'Medium'}</span>`;
    }

    // Populate features list
    if (featuresEl && plan.features) {
        featuresEl.innerHTML = plan.features.map(f => `
            <li style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <span style="color: var(--primary-color); margin-right: 8px; font-weight:bold;">✓</span>${f}
            </li>
        `).join('');
    }

    // Set investment amount input range
    const investmentAmountEl = document.getElementById('investment-amount');
    if (investmentAmountEl) {
        investmentAmountEl.min = plan.min;
        investmentAmountEl.max = plan.max;
        investmentAmountEl.value = plan.min;
        investmentAmountEl.placeholder = `$${plan.min} - $${plan.max}`;
    }

    // Attach handlers
    const investBtn = document.querySelector('.invest-btn-large');
    if (investBtn) {
        investBtn.addEventListener('click', () => {
            const amount = parseFloat(investmentAmountEl.value);
            if (isNaN(amount) || amount < plan.min || amount > plan.max) {
                showToast(`Please enter an amount between $${plan.min} and $${plan.max}`, "error");
                return;
            }
            handleDetailInvestment(plan, amount);
        });
    }

    setupCalculator(plan);
    renderSimilarPlans(plan);
    renderComparisonTable(plan);
    renderReviews(plan);
}

function handleDetailInvestment(plan, amount = null) {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Use provided amount or get from input field
    if (amount === null) {
        const amountInput = document.getElementById('investment-amount');
        amount = amountInput ? parseFloat(amountInput.value) : plan.min;
    }

    if (isNaN(amount) || amount < plan.min || amount > plan.max) {
        showToast(`Please enter an amount between $${plan.min} and $${plan.max}`, "error");
        return;
    }

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.ceil(amount * EXCHANGE_RATE * 100),
        currency: 'NGN',
        ref: 'wltbrg-' + Date.now(),
        onClose: function() {
            showToast("Investment cancelled.", "info");
        },
        callback: function(response) {
            showToast("Payment successful! Finalizing investment...", "success");
            (async () => {
                try {
                    await apiService.verifyInvestment(response.reference, plan.name, amount);
                    showToast("Investment active! Redirecting to portfolio...", "success");
                    setTimeout(() => {
                        window.location.href = 'my-portfolio.html';
                    }, 2000);
                } catch (err) {
                    showToast(err.message || "Failed to finalize investment.", "error");
                }
            })();
        }
    });
    handler.openIframe();
}
                } catch (err) {
                    showToast(err.message || "Failed to finalize investment.", "error");
                }
            })();
        }
    });
    handler.openIframe();
}

function setupCalculator(plan) {
    const amountInput = document.getElementById('calc-amount');
    const weeklyEl = document.getElementById('calc-weekly');
    const totalEl = document.getElementById('calc-total');
    const returnEl = document.getElementById('calc-return');

    if (!amountInput) return;

    const calculate = () => {
        let amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount < 0) amount = 0;

        const weeklyProfit = amount * (plan.roi / 100);
        const totalProfit = weeklyProfit * plan.duration;
        const totalReturn = amount + totalProfit;

        weeklyEl.textContent = formatCurrency(weeklyProfit);
        totalEl.textContent = formatCurrency(totalProfit);
        returnEl.textContent = formatCurrency(totalReturn);
    };

    amountInput.addEventListener('input', calculate);
    calculate(); // Initial calculation
}

function renderSimilarPlans(currentPlan) {
    const section = document.getElementById('similar-plans-section');
    const container = document.getElementById('similar-plans-container');
    
    if (!section || !container) return;

    // Find plans in the same category, excluding the current one
    const similarPlans = INVESTMENT_PLANS.filter(p => 
        p.category === currentPlan.category && p.name !== currentPlan.name
    ).slice(0, 3); // Limit to 3 plans

    if (similarPlans.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = similarPlans.map(plan => `
        <div class="plan-card" data-plan-name="${plan.name}" style="cursor: pointer;">
            <h4>${plan.name}</h4>
            <p class="plan-desc">${plan.description}</p>
            <div class="plan-details">
                <p><strong>Price:</strong> ${formatCurrency(plan.min)}</p>
                <p><strong>Return:</strong> ${plan.roi}% weekly</p>
            </div>
            <button class="btn btn-primary btn-sm" style="margin-top: 10px; width: 100%;">View Details</button>
        </div>
    `).join('');

    // Add click listeners to navigate to the clicked plan
    container.querySelectorAll('.plan-card').forEach(card => {
        card.addEventListener('click', () => {
            const planName = card.dataset.planName;
            window.location.href = `plan-details.html?plan=${encodeURIComponent(planName)}`;
        });
    });
}

function renderComparisonTable(currentPlan) {
    const section = document.getElementById('comparison-section');
    const container = document.getElementById('comparison-container');
    if (!section || !container) return;

    // Select plans to compare (same category preferred)
    let others = INVESTMENT_PLANS.filter(p => p.name !== currentPlan.name && p.category === currentPlan.category);
    
    // If not enough in category, fill with others
    if (others.length < 2) {
        const rest = INVESTMENT_PLANS.filter(p => p.name !== currentPlan.name && p.category !== currentPlan.category);
        others = others.concat(rest);
    }
    
    // Take top 2 for comparison
    const comparisonPlans = others.slice(0, 2);
    
    if (comparisonPlans.length === 0) return;

    section.classList.remove('hidden');

    const allPlans = [currentPlan, ...comparisonPlans];

    let html = `
        <div class="table-container">
            <table class="comparison-table" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left; padding:10px; background:var(--secondary-color);">Feature</th>
                        ${allPlans.map(p => `<th style="text-align:center; padding:10px; background:var(--secondary-color); ${p.name === currentPlan.name ? 'border-bottom: 3px solid var(--primary-color);' : ''}">${p.name} ${p.name === currentPlan.name ? '(Current)' : ''}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:10px; border-bottom:1px solid var(--border-color);"><strong>ROI (Weekly)</strong></td>
                        ${allPlans.map(p => `<td style="text-align:center; padding:10px; border-bottom:1px solid var(--border-color); color:var(--primary-color); font-weight:bold;">${p.roi}%</td>`).join('')}
                    </tr>
                    <tr>
                        <td style="padding:10px; border-bottom:1px solid var(--border-color);"><strong>Duration</strong></td>
                        ${allPlans.map(p => `<td style="text-align:center; padding:10px; border-bottom:1px solid var(--border-color);">${p.duration} Weeks</td>`).join('')}
                    </tr>
                    <tr>
                        <td style="padding:10px; border-bottom:1px solid var(--border-color);"><strong>Min Investment</strong></td>
                        ${allPlans.map(p => `<td style="text-align:center; padding:10px; border-bottom:1px solid var(--border-color);">${formatCurrency(p.min)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td style="padding:10px; border-bottom:1px solid var(--border-color);"><strong>Risk Level</strong></td>
                        ${allPlans.map(p => `<td style="text-align:center; padding:10px; border-bottom:1px solid var(--border-color);"><span class="badge badge-${p.riskLevel ? p.riskLevel.toLowerCase() : 'medium'}">${p.riskLevel || 'Medium'}</span></td>`).join('')}
                    </tr>
                     <tr>
                        <td style="padding:10px; border-bottom:1px solid var(--border-color);"></td>
                        ${allPlans.map(p => `
                            <td style="text-align:center; padding:10px; border-bottom:1px solid var(--border-color);">
                                ${p.name !== currentPlan.name ? `<a href="plan-details.html?plan=${encodeURIComponent(p.name)}" class="btn btn-sm btn-secondary">View</a>` : ''}
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function renderReviews(plan) {
    const section = document.getElementById('reviews-section');
    const container = document.getElementById('reviews-container');
    if (!section || !container) return;

    section.classList.remove('hidden');

    // Mock reviews data
    const reviews = [
        { name: "Alex M.", rating: 5, text: "Excellent returns, exactly as promised. The withdrawal process was smooth." },
        { name: "Sarah K.", rating: 5, text: "I was skeptical at first, but the weekly payouts are consistent. Highly recommend this plan." },
        { name: "Michael B.", rating: 4, text: "Great plan for diversification. Support is helpful when I had questions." },
        { name: "Jessica T.", rating: 5, text: "Best investment decision I've made this year. The risk profile fits my needs perfectly." }
    ];

    // Randomly pick 2-3 reviews to display
    const selectedReviews = reviews.sort(() => 0.5 - Math.random()).slice(0, 3);

    container.innerHTML = selectedReviews.map(r => `
        <div class="review-item" style="border-bottom: 1px solid var(--border-color); padding: 1.5rem 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: center;">
                <strong style="font-size: 1.1rem;">${r.name}</strong>
                <span style="color: #f1c40f; font-size: 1.2rem;">${'★'.repeat(r.rating)}<span style="color: #ddd;">${'★'.repeat(5 - r.rating)}</span></span>
            </div>
            <p style="color: var(--text-muted); margin: 0; font-style: italic;">"${r.text}"</p>
        </div>
    `).join('');
}