import { showToast } from '../notifications.js';

export const handlePortfolioPage = () => {
    const portfolioSummary = document.getElementById('portfolio-summary');
    if (!portfolioSummary) return;

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        showToast('You must be logged in to view your portfolio.', 'error');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    const noPortfolioMessage = document.getElementById('no-portfolio-message');
    const planNameEl = document.getElementById('portfolio-plan-name');
    const currentValueEl = document.getElementById('portfolio-current-value');
    const gainLossEl = document.getElementById('portfolio-gain-loss');
    const initialInvestmentEl = document.getElementById('portfolio-initial-investment');

    const selectedPlan = localStorage.getItem('selectedInvestmentPlan');
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const investmentTransactions = transactions.filter(tx => tx.description.startsWith('Investment:'));
    const latestInvestment = investmentTransactions.length > 0 ? investmentTransactions[investmentTransactions.length - 1] : null;

    if (selectedPlan && latestInvestment) {
        portfolioSummary.style.display = 'block';
        noPortfolioMessage.style.display = 'none';

        const initialInvestment = latestInvestment.amount;
        const currentValue = initialInvestment * (1 + (Math.random() - 0.4) * 0.2);
        const gainLoss = currentValue - initialInvestment;

        planNameEl.textContent = selectedPlan;
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        currentValueEl.textContent = formatter.format(currentValue);
        gainLossEl.textContent = formatter.format(gainLoss);
        initialInvestmentEl.textContent = formatter.format(initialInvestment);

        if (gainLoss < 0) {
            gainLossEl.style.color = 'var(--danger-color, #dc3545)';
        } else {
            gainLossEl.style.color = 'var(--success-color, #28a745)';
        }

        const ctx = document.getElementById('portfolio-performance-chart').getContext('2d');
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = [];
        let runningValue = initialInvestment;
        for (let i = 0; i < 12; i++) {
            runningValue *= (1 + (Math.random() - 0.45) * 0.1);
            data.push(runningValue.toFixed(2));
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: data,
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: { ticks: { callback: value => formatter.format(value) } }
                }
            }
        });
    } else {
        portfolioSummary.style.display = 'none';
        noPortfolioMessage.style.display = 'block';
    }
};