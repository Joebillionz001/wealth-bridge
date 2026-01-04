import { getLoggedInUser, formatCurrency } from './utils.js';
import { INVESTMENT_PLANS } from './config.js';

export function initPortfolioPage() {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    renderPortfolioTable(user);
    renderProfitGrowthChart(user);
}

function renderPortfolioTable(user) {
    const tbody = document.querySelector('#detailed-portfolio-table tbody');
    if (!tbody) return;

    if (!user.investments || user.investments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">You have no active investments. <a href="investments.html" style="color: var(--primary-color); font-weight: bold;">Start Investing</a></td></tr>';
        return;
    }

    // Sort investments by date (newest first)
    const sortedInvestments = [...user.investments].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    tbody.innerHTML = sortedInvestments.map(inv => {
        const plan = INVESTMENT_PLANS.find(p => p.name === inv.planName);
        // Default to 0 if plan config changed/removed
        const durationWeeks = plan ? plan.duration : 0;
        
        const startDate = new Date(inv.startDate);
        const endDate = new Date(startDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
        
        const statusClass = inv.status === 'Active' ? 'badge-active' : 'badge-completed';

        return `
            <tr>
                <td><strong>${inv.planName}</strong></td>
                <td>${formatCurrency(inv.amount)}</td>
                <td class="text-success">${formatCurrency(inv.profit || 0)}</td>
                <td>${startDate.toLocaleDateString()}</td>
                <td>${endDate.toLocaleDateString()}</td>
                <td><span class="badge ${statusClass}">${inv.status}</span></td>
                <td>
                    <a href="plan-details.html?plan=${encodeURIComponent(inv.planName)}" class="btn btn-sm btn-secondary">View Plan</a>
                </td>
            </tr>
        `;
    }).join('');
}

function renderProfitGrowthChart(user) {
    const ctx = document.getElementById('profit-growth-chart');
    if (!ctx) return;

    // Filter transactions for profits
    const profitTransactions = (user.transactions || [])
        .filter(t => t.type === 'Profit')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumulativeProfit = 0;
    const labels = [];
    const data = [];

    if (profitTransactions.length > 0) {
        profitTransactions.forEach(tx => {
            cumulativeProfit += tx.amount;
            labels.push(tx.date);
            data.push(cumulativeProfit);
        });
    } else {
        // Show at least a starting point if no profits yet
        const today = new Date().toISOString().split('T')[0];
        labels.push(today);
        data.push(0);
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Profit',
                data: data,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return formatCurrency(value); }
                    }
                }
            }
        }
    });
}