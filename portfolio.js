import { getLoggedInUser, formatCurrency } from './utils.js';

export function initPortfolioPage() {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    renderDetailedPortfolio(user);
}

function renderDetailedPortfolio(user) {
    const tbody = document.querySelector('#detailed-portfolio-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!user.investments || user.investments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">You have no investment history.</td></tr>';
        return;
    }

    // Sort by most recent start date
    const sortedInvestments = [...user.investments].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    sortedInvestments.forEach(inv => {
        const row = document.createElement('tr');
        
        // Calculate end date based on duration (mock logic or stored date)
        const startDate = new Date(inv.startDate).toLocaleDateString();
        const endDate = inv.endDate ? new Date(inv.endDate).toLocaleDateString() : 'Ongoing';

        row.innerHTML = `
            <td>${inv.planName}</td>
            <td>${formatCurrency(inv.amount)}</td>
            <td class="text-success">${formatCurrency(inv.profit || 0)}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
            <td><button class="btn btn-sm btn-secondary">Details</button></td>
        `;
        tbody.appendChild(row);
    });
}