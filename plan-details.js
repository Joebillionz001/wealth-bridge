import { INVESTMENT_PLANS, PAYSTACK_PUBLIC_KEY } from './config.js';
import { formatCurrency, getLoggedInUser, EXCHANGE_RATE, showToast } from './utils.js';
import { apiService } from './api-service.js';

export function initPlanDetailsPage() {
    const params = new URLSearchParams(window.location.search);
    const planName = params.get('plan');
    const container = document.getElementById('plan-detail-container');

    if (!planName || !container) return;

    const plan = INVESTMENT_PLANS.find(p => p.name === planName);

    if (!plan) {
        container.innerHTML = '<p>Plan not found.</p>';
        return;
    }

    // Render details
    container.innerHTML = `
        <h1 style="margin-bottom: 0.5rem;">${plan.name}</h1>
        <div style="display: flex; gap: 10px; margin-bottom: 2rem; flex-wrap: wrap;">
            <span class="badge badge-active" style="font-size: 0.9rem; background-color: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px;">${plan.category}</span>
            <span class="badge badge-${plan.riskLevel ? plan.riskLevel.toLowerCase() : 'medium'}" style="font-size: 0.9rem; padding: 0.25rem 0.75rem; border-radius: 20px;">Risk: ${plan.riskLevel || 'Medium'}</span>
        </div>
        
        <div class="detail-section">
            <h3>Investment Overview</h3>
            <p style="font-size: 1.1rem;">${plan.description}</p>
            <ul style="list-style: none; padding: 0; margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                ${plan.features ? plan.features.map(f => `<li style="display: flex; align-items: center;"><span style="color: var(--primary-color); margin-right: 8px; font-weight:bold;">✓</span>${f}</li>`).join('') : ''}
            </ul>
        </div>

        <div class="detail-section" style="background: var(--bg-body); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--primary-color);">
            <h3>Why invest in this plan?</h3>
            <p style="font-size: 1.1rem; line-height: 1.6;">${plan.benefits || "This plan offers a balanced approach to growth, securing your capital while providing competitive returns."}</p>
        </div>

        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 2rem 0;">
            <div class="stat-box" style="text-align: center; padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <h4 style="font-size: 0.9rem; color: var(--text-muted);">ROI</h4>
                <p class="text-success" style="font-size: 1.5rem; font-weight: bold; margin: 0;">${plan.roi}% <span style="font-size: 0.8rem; color: #666;">weekly</span></p>
            </div>
            <div class="stat-box" style="text-align: center; padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <h4 style="font-size: 0.9rem; color: var(--text-muted);">Duration</h4>
                <p style="font-size: 1.5rem; font-weight: bold; margin: 0;">${plan.duration} <span style="font-size: 0.8rem; color: #666;">weeks</span></p>
            </div>
            <div class="stat-box" style="text-align: center; padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <h4 style="font-size: 0.9rem; color: var(--text-muted);">Min Investment</h4>
                <p style="font-size: 1.5rem; font-weight: bold; margin: 0;">${formatCurrency(plan.min)}</p>
            </div>
            <div class="stat-box" style="text-align: center; padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <h4 style="font-size: 0.9rem; color: var(--text-muted);">Max Investment</h4>
                <p style="font-size: 1.5rem; font-weight: bold; margin: 0;">${formatCurrency(plan.max)}</p>
            </div>
        </div>

        <div class="detail-section" style="background: var(--bg-body); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
            <h3>Profit Calculator</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">Enter an amount to estimate your returns.</p>
            
            <div style="margin-bottom: 1rem;">
                <label for="calc-amount" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Investment Amount ($)</label>
                <input type="number" id="calc-amount" value="${plan.min}" min="${plan.min}" max="${plan.max}" style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem;">
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: var(--card-bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="text-align: center;">
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">Weekly Profit</p>
                    <p id="calc-weekly" style="font-weight: bold; font-size: 1.1rem;">-</p>
                </div>
                <div style="text-align: center;">
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">Total Profit</p>
                    <p id="calc-total" style="font-weight: bold; font-size: 1.1rem; color: var(--primary-color);">-</p>
                </div>
                <div style="text-align: center;">
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">Total Return</p>
                    <p id="calc-return" style="font-weight: bold; font-size: 1.1rem;">-</p>
                </div>
            </div>
        </div>

        <button id="detail-invest-btn" class="btn btn-primary btn-lg" style="width: 100%; padding: 1rem; font-size: 1.2rem;">Invest Now</button>
    `;

    // Attach Invest Handler
    document.getElementById('detail-invest-btn').addEventListener('click', () => {
        handleDetailInvestment(plan);
    });

    // Attach Print Handler
    document.getElementById('print-plan-btn').addEventListener('click', () => {
        window.print();
    });

    // Attach Share Handler
    document.getElementById('share-plan-btn').addEventListener('click', async () => {
        const shareData = {
            title: `Invest in ${plan.name} - WealthBridge`,
            text: `Check out this investment plan: ${plan.name}. ROI: ${plan.roi}% weekly!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(window.location.href);
            showToast("Link copied to clipboard!", "success");
        }
    });

    setupCalculator(plan);
    renderSimilarPlans(plan);
    renderComparisonTable(plan);
    renderReviews(plan);
}

function handleDetailInvestment(plan) {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const amount = plan.min; 

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