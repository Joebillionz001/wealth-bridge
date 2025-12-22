import { showToast } from './ui.js';
import { apiService } from './api-service.js';
import { INVESTMENT_PLANS } from './config.js';
import { getLoggedInUser, updateUser, formatCurrency, getStorageItem, setStorageItem } from './utils.js';

// --- DATA & CONFIG ---

// --- CHART INSTANCES ---
let balanceChartInstance = null;
let portfolioChartInstance = null;

// --- PAGINATION STATE ---
let transactionCurrentPage = 1;
const transactionsPerPage = 5; // Show 5 transactions per page

// --- SORTING STATE ---
let transactionSortColumn = 'date'; // Default sort column
let transactionSortDirection = 'desc'; // 'asc' or 'desc'

// --- RENDER FUNCTIONS ---

/**
 * Displays the user's name and key financial metrics.
 */
function renderAccountOverview() {
    const user = getLoggedInUser();
    if (!user) return;

    document.getElementById('welcome-message').textContent = `Welcome, ${user.name}!`;
    document.getElementById('total-balance').textContent = formatCurrency(user.balance);

    // Calculate totals from investments
    const totalInvested = user.investments.reduce((sum, inv) => inv.status === 'Active' ? sum + inv.amount : sum, 0);
    const totalProfit = user.investments.reduce((sum, inv) => sum + (inv.profit || 0), 0);

    document.getElementById('total-invested').textContent = formatCurrency(totalInvested);
    document.getElementById('total-profit').textContent = formatCurrency(totalProfit);
}

/**
 * Renders the available investment plans as cards.
 */
function renderInvestmentPlans() {
    const plansContainer = document.getElementById('investment-plans');
    plansContainer.innerHTML = ''; // Clear existing content

    // Group plans by category
    const categories = {};
    INVESTMENT_PLANS.forEach(plan => {
        if (!categories[plan.category]) {
            categories[plan.category] = [];
        }
        categories[plan.category].push(plan);
    });

    for (const [category, plans] of Object.entries(categories)) {
        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category;
        plansContainer.appendChild(categoryHeader);

        const grid = document.createElement('div');
        grid.className = 'plans-grid';

        plans.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            planCard.innerHTML = `
                <h4>${plan.name}</h4>
                <p class="plan-desc">${plan.description}</p>
                <div class="plan-details">
                    <p><strong>Price:</strong> ${formatCurrency(plan.min)}</p>
                    <p><strong>Return:</strong> ${plan.roi}% weekly</p>
                    <p class="urgency">Closing in: <span class="timer">02:14:59</span></p>
                </div>
                <button class="btn btn-primary invest-btn" data-plan-name="${plan.name}">Invest Now</button>
            `;
            grid.appendChild(planCard);
        });
        plansContainer.appendChild(grid);
    }
    startUrgencyTimers();
}

/**
 * Starts the countdown timers for investment plans.
 */
function startUrgencyTimers() {
    // Clear any existing intervals to prevent memory leaks on re-render
    window.activeTimers = window.activeTimers || [];
    window.activeTimers.forEach(clearInterval);
    window.activeTimers = [];

    const timers = document.querySelectorAll('.timer');
    timers.forEach(timer => {
        // Random start time between 1 and 4 hours for demo purposes
        let time = 3600 + Math.random() * 10800; 
        
        const interval = setInterval(() => {
            time--;
            if (time < 0) time = 3600 + Math.random() * 10800; // Reset if hits zero
            
            const hours = Math.floor(time / 3600);
            const minutes = Math.floor((time % 3600) / 60);
            const seconds = Math.floor(time % 60);
            
            timer.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
        window.activeTimers.push(interval);
    });
}

/**
 * Renders the user's investment portfolio in a table.
 */
function renderPortfolio() {
    const user = getLoggedInUser();
    const portfolioBody = document.querySelector('#portfolio-table tbody');
    portfolioBody.innerHTML = ''; // Clear

    if (!user.investments || user.investments.length === 0) {
        portfolioBody.innerHTML = '<tr><td colspan="4">You have no active investments.</td></tr>';
        return;
    }

    user.investments.forEach(inv => {
        const row = portfolioBody.insertRow();
        row.innerHTML = `
            <td>${inv.planName}</td>
            <td>${formatCurrency(inv.amount)}</td>
            <td>${formatCurrency(inv.profit || 0)}</td>
            <td>${inv.status}</td>
        `;
    });
}

/**
 * Renders the user's transaction history in a table.
 */
function renderTransactions() {
    const user = getLoggedInUser();
    const transactionsBody = document.querySelector('#transactions-table tbody');
    const paginationContainer = document.getElementById('pagination-container');
    transactionsBody.innerHTML = ''; // Clear

    if (!user.transactions || user.transactions.length === 0) {
        transactionsBody.innerHTML = '<tr><td colspan="4">No transactions found.</td></tr>';
        paginationContainer.style.display = 'none';
        return;
    }

    // --- NEW: Date Filtering Logic ---
    const startDateFilter = document.getElementById('filter-start-date').value;
    const endDateFilter = document.getElementById('filter-end-date').value;
    const typeFilter = document.getElementById('filter-type').value;

    let filteredTransactions = user.transactions;

    if (startDateFilter || endDateFilter || typeFilter) {
        const start = startDateFilter ? new Date(startDateFilter) : null;
        const end = endDateFilter ? new Date(endDateFilter) : null;

        // To make the end date inclusive, set it to the end of the day.
        if (end) end.setHours(23, 59, 59, 999);

        filteredTransactions = user.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const isAfterStart = start ? txDate >= start : true;
            const isBeforeEnd = end ? txDate <= end : true;
            const isTypeMatch = typeFilter ? tx.type === typeFilter : true;
            return isAfterStart && isBeforeEnd && isTypeMatch;
        });
    }

    // --- Sorting Logic ---
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const valA = a[transactionSortColumn];
        const valB = b[transactionSortColumn];

        let comparison = 0;
        if (valA > valB) {
            comparison = 1;
        } else if (valA < valB) {
            comparison = -1;
        }

        return transactionSortDirection === 'desc' ? comparison * -1 : comparison;
    });

    // Update header classes for sort indicators
    document.querySelectorAll('#transactions-table th[data-sort]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === transactionSortColumn) {
            th.classList.add(`sort-${transactionSortDirection}`);
        }
    });

    // Paginate the transactions
    const startIndex = (transactionCurrentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

    if (paginatedTransactions.length === 0) {
        transactionsBody.innerHTML = '<tr><td colspan="4">No transactions match the current filter.</td></tr>';
        paginationContainer.style.display = 'none';
        return;
    }
    paginationContainer.style.display = 'flex';

    paginatedTransactions.forEach(tx => {
        const row = transactionsBody.insertRow();
        // Generate a pseudo-ID if missing for the receipt (for old transactions)
        const txId = tx.id || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        row.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.type}</td>
            <td class="${tx.type === 'Deposit' || tx.type === 'Profit' ? 'text-success' : 'text-danger'}">${formatCurrency(tx.amount)}</td>
            <td>${tx.status}</td>
            <td>
                ${tx.status === 'Completed' ? `
                    <button class="btn btn-sm btn-secondary download-receipt-btn" 
                        data-id="${txId}"
                        data-date="${tx.date}"
                        data-type="${tx.type}"
                        data-amount="${tx.amount}"
                        data-status="${tx.status}">
                        Receipt
                    </button>` : '-'
                }
            </td>
        `;
    });

    renderPaginationControls(filteredTransactions.length);
}

/**
 * Renders and updates the pagination controls for the transaction table.
 * @param {number} totalTransactions The total number of transactions.
 */
function renderPaginationControls(totalTransactions) {
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

    if (totalPages <= 1) {
        document.getElementById('pagination-container').style.display = 'none';
        return;
    }

    pageInfo.textContent = `Page ${transactionCurrentPage} of ${totalPages}`;

    prevBtn.disabled = transactionCurrentPage === 1;
    nextBtn.disabled = transactionCurrentPage >= totalPages;
}

/**
 * Renders a line chart showing the user's balance over time.
 */
function renderBalanceChart() {
    const user = getLoggedInUser();
    const ctx = document.getElementById('balance-chart').getContext('2d');

    // Destroy previous chart instance to prevent duplicates
    if (balanceChartInstance) {
        balanceChartInstance.destroy();
    }

    // Process transactions to build a history of balance
    const sortedTransactions = [...user.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = [];
    const data = [];
    
    // 1. Calculate the full running balance history first
    let currentBalance = 0;
    const balanceHistory = sortedTransactions.map(tx => {
        if (['Deposit', 'Profit', 'Principal Return', 'Cancellation Refund'].includes(tx.type)) {
            currentBalance += tx.amount;
        } else {
            // Withdrawal, Investment
            currentBalance -= tx.amount;
        }
        return {
            date: tx.date,
            balance: currentBalance,
            type: tx.type
        };
    });

    // 2. Apply filters to the history points
    const startDateFilter = document.getElementById('filter-start-date').value;
    const endDateFilter = document.getElementById('filter-end-date').value;
    const typeFilter = document.getElementById('filter-type').value;

    const filteredHistory = balanceHistory.filter(point => {
        const pointDate = new Date(point.date);
        const start = startDateFilter ? new Date(startDateFilter) : null;
        const end = endDateFilter ? new Date(endDateFilter) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const isAfterStart = start ? pointDate >= start : true;
        const isBeforeEnd = end ? pointDate <= end : true;
        const isTypeMatch = typeFilter ? point.type === typeFilter : true;
        return isAfterStart && isBeforeEnd && isTypeMatch;
    });

    filteredHistory.forEach(point => {
        labels.push(point.date);
        data.push(point.balance);
    });

    balanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Balance',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) { return formatCurrency(value); }
                    }
                }
            }
        }
    });
}

/**
 * Renders a doughnut chart showing the distribution of investments.
 */
function renderPortfolioChart() {
    const user = getLoggedInUser();
    const ctx = document.getElementById('portfolio-chart').getContext('2d');

    if (portfolioChartInstance) {
        portfolioChartInstance.destroy();
    }

    const portfolioData = user.investments
        .filter(inv => inv.status === 'Active')
        .reduce((acc, inv) => {
            acc[inv.planName] = (acc[inv.planName] || 0) + inv.amount;
            return acc;
        }, {});

    const labels = Object.keys(portfolioData);
    const data = Object.values(portfolioData);

    if (labels.length === 0) {
        // Handle case with no active investments
        document.querySelector('#portfolio-chart').style.display = 'none';
        return;
    }
     document.querySelector('#portfolio-chart').style.display = 'block';

    portfolioChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio',
                data: data,
                backgroundColor: ['#28a745', '#17a2b8', '#ffc107'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

/**
 * Renders referral information.
 */
function renderReferrals() {
    const user = getLoggedInUser();
    if (!user) return;

    const refCountEl = document.getElementById('referral-count');
    const refEarnEl = document.getElementById('referral-earnings');
    const refLinkEl = document.getElementById('referral-link');

    if (refCountEl) refCountEl.textContent = user.referrals || 0;
    if (refEarnEl) refEarnEl.textContent = formatCurrency(user.referralEarnings || 0);
    if (refLinkEl) refLinkEl.value = `https://wealthbridge.com/ref/${user.referralCode || 'WB-USER'}`;
}

// --- EVENT HANDLERS ---

/**
 * Handles the investment process when a user clicks "Invest Now".
 * @param {Event} e The click event.
 */
function handleInvestment(e) {
    const planName = e.target.dataset.planName;
    const plan = INVESTMENT_PLANS.find(p => p.name === planName);
    const user = getLoggedInUser();
    const amount = plan.min; // Fixed price based on plan minimum

    // --- PAYSTACK INTEGRATION ---
    const PAYSTACK_PUBLIC_KEY = "pk_live_fbf001f175602c4223a1a576070b9c422eb874e1";

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: amount * 100, // Paystack amount is in kobo (or smallest currency unit)
        ref: 'wltbrg-' + Date.now(),
        onClose: function() {
            showToast("Investment cancelled.", "info");
        },
        callback: async function(response) {
            showToast("Payment successful! Finalizing investment...", "success");
            try {
                // Use the apiService to handle the data logic
                await apiService.verifyInvestment(response.reference, plan.name, amount);
                renderAll();
            } catch (err) {
                showToast(err.message || "Failed to finalize investment.", "error");
            }
        }
    });
    handler.openIframe();
}

/**
 * Handles a deposit request from the form.
 * @param {Event} e The form submission event.
 */
function handleDeposit(e) {
    e.preventDefault();
    transactionCurrentPage = 1; // Reset to first page to show new transaction
    const amountInput = document.getElementById('deposit-amount');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        showToast("Please enter a valid positive amount to deposit.", "error");
        return;
    }

    const user = getLoggedInUser();
    user.balance += amount;
    user.transactions.push({
        id: 'DEP-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'Deposit',
        amount: amount,
        status: 'Completed'
    });

    updateUser(user);
    showToast(`${formatCurrency(amount)} has been successfully deposited.`, "success");
    amountInput.value = ''; // Clear the input
    renderAll();
}

/**
 * Handles a withdrawal request from the form.
 * @param {Event} e The form submission event.
 */
function handleWithdraw(e) {
    e.preventDefault();
    transactionCurrentPage = 1; // Reset to first page to show new transaction
    const amountInput = document.getElementById('withdraw-amount');
    const amount = parseFloat(amountInput.value);
    const user = getLoggedInUser();

    if (isNaN(amount) || amount <= 0) {
        showToast("Please enter a valid positive amount to withdraw.", "error");
        return;
    }

    if (amount > user.balance) {
        showToast("Insufficient balance. You cannot withdraw more than you have.", "error");
        return;
    }

    user.balance -= amount;
    user.transactions.push({
        id: 'WTH-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'Withdrawal',
        amount: amount,
        status: 'Completed'
    });

    updateUser(user);
    showToast(`You have successfully withdrawn ${formatCurrency(amount)}.`, "success");
    amountInput.value = ''; // Clear the input
    renderAll();
}

/**
 * Generates a CSV file from the user's transaction history and downloads it.
 */
function handleExportCSV() {
    const user = getLoggedInUser();
    if (!user || !user.transactions || user.transactions.length === 0) {
        showToast("No transactions to export.", "info");
        return;
    }

    // --- NEW: Apply filters before exporting ---
    const startDateFilter = document.getElementById('filter-start-date').value;
    const endDateFilter = document.getElementById('filter-end-date').value;
    const typeFilter = document.getElementById('filter-type').value;

    let transactionsToExport = user.transactions;

    if (startDateFilter || endDateFilter || typeFilter) {
        const start = startDateFilter ? new Date(startDateFilter) : null;
        const end = endDateFilter ? new Date(endDateFilter) : null;
        if (end) end.setHours(23, 59, 59, 999);

        transactionsToExport = user.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const isAfterStart = start ? txDate >= start : true;
            const isBeforeEnd = end ? txDate <= end : true;
            const isTypeMatch = typeFilter ? tx.type === typeFilter : true;
            return isAfterStart && isBeforeEnd && isTypeMatch;
        });
    }

    if (transactionsToExport.length === 0) {
        showToast("No transactions match the current filter to export.", "info");
        return;
    }

    const headers = ["Date", "Type", "Amount", "Status"];
    // Use a copy to avoid reversing the original data if it's ever used elsewhere
    const reversedTransactions = [...transactionsToExport].reverse();

    // Convert transaction data to CSV rows
    const csvRows = reversedTransactions.map(tx => {
        // Sanitize data to prevent issues with commas in fields, though unlikely here
        const date = `"${tx.date}"`;
        const type = `"${tx.type}"`;
        const amount = tx.amount; // No quotes for numbers
        const status = `"${tx.status}"`;
        return [date, type, amount, status].join(',');
    });

    // Combine headers and rows
    const csvString = [headers.join(','), ...csvRows].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");
    if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "wealthbridge-transactions.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showToast("Transaction history exported!", "success");
}

/**
 * Generates and downloads a text receipt for a transaction.
 * @param {Event} e The click event.
 */
function handleDownloadReceipt(e) {
    if (!e.target.classList.contains('download-receipt-btn')) return;
    
    const btn = e.target;
    const data = btn.dataset;
    
    const receiptContent = `
WEALTHBRIDGE TRANSACTION RECEIPT
--------------------------------
Transaction ID: ${data.id}
Date:           ${data.date}
Type:           ${data.type}
Amount:         ${formatCurrency(parseFloat(data.amount))}
Status:         ${data.status}
--------------------------------
Thank you for investing with WealthBridge.
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${data.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- SIMULATION ---

/**
 * Simulates weekly profit generation for active investments.
 * This is a simplified simulation that runs on page load.
 */
function simulateWeeklyProfits() {
    const user = getLoggedInUser();
    if (!user) return;

    const now = new Date();
    let notifications = [];

    user.investments.forEach(inv => {
        if (inv.status !== 'Active') return;

        const plan = INVESTMENT_PLANS.find(p => p.name === inv.planName);
        const startDate = new Date(inv.startDate);
        const lastProfitDate = new Date(inv.lastProfitDate);

        // Calculate how many weeks have passed since the last profit was given
        const msInAWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksPassed = Math.floor((now - lastProfitDate) / msInAWeek);

        if (weeksPassed > 0) {
            const weeklyProfit = inv.amount * (plan.roi / 100);
            for (let i = 0; i < weeksPassed; i++) {
                // Add profit
                inv.profit += weeklyProfit;
                user.balance += weeklyProfit;

                // Create a transaction record for the profit
                const profitDate = new Date(lastProfitDate.getTime() + (i + 1) * msInAWeek);
                user.transactions.push({
                    id: 'PRF-' + Date.now() + i,
                    date: profitDate.toISOString().split('T')[0],
                    type: 'Profit',
                    amount: weeklyProfit,
                    status: 'Completed'
                });
            }
            // Update the last profit date to prevent re-calculation
            inv.lastProfitDate = now.toISOString();
            notifications.push(`You earned ${formatCurrency(weeklyProfit * weeksPassed)} profit from your ${plan.name} plan.`);
        }

        // Check if the investment has completed its term
        const endDate = new Date(startDate.getTime() + plan.duration * msInAWeek);
        if (now >= endDate) {
            inv.status = 'Completed';
            user.balance += inv.amount; // Return principal to balance
            user.transactions.push({
                id: 'RET-' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                type: 'Principal Return',
                amount: inv.amount,
                status: 'Completed'
            });
            notifications.push(`Your ${plan.name} investment of ${formatCurrency(inv.amount)} has matured and the principal has been returned to your balance.`);
        }
    });

    if (notifications.length > 0) {
        updateUser(user);
        // Use showToast for a better user experience than alert()
        showToast(notifications.join('\n'), 'info', 5000);
    }
}

/**
 * Rerenders all dynamic components on the dashboard.
 */
function renderAll() {
    renderAccountOverview();
    renderPortfolio();
    renderTransactions();
    renderBalanceChart();
    renderPortfolioChart();
    renderReferrals();
}

/**
 * Initializes all dashboard functionality.
 */
export function initDashboard() {
    // Ensure user is logged in (redundant check, but good practice)
    if (!getLoggedInUser()) {
        window.location.href = 'login.html';
        return;
    }

    // Simulate profits first, so they are included in the initial render
    simulateWeeklyProfits();

    // Initial render
    renderInvestmentPlans();
    renderAll();

    // Add event delegation for investment plans (More efficient than individual listeners)
    const plansContainer = document.getElementById('investment-plans');
    if (plansContainer) {
        plansContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('invest-btn')) {
                handleInvestment(e);
            }
        });
    }

    // Add event listeners for fund management
    document.getElementById('deposit-form').addEventListener('submit', handleDeposit);
    document.getElementById('withdraw-form').addEventListener('submit', handleWithdraw);
    document.getElementById('export-csv-btn').addEventListener('click', handleExportCSV);

    // Add event delegation for transaction table actions (Download Receipt)
    const transactionsTable = document.getElementById('transactions-table');
    if (transactionsTable) {
        transactionsTable.addEventListener('click', handleDownloadReceipt);
    }

    // Referral Copy Button
    const copyRefBtn = document.getElementById('copy-ref-btn');
    if (copyRefBtn) {
        copyRefBtn.addEventListener('click', () => {
            const copyText = document.getElementById("referral-link");
            copyText.select();
            navigator.clipboard.writeText(copyText.value);
            showToast("Referral link copied!", "success");
        });
    }

    // Add event listeners for Quick Actions
    const quickDepositBtn = document.getElementById('quick-deposit-btn');
    if (quickDepositBtn) {
        quickDepositBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const depositForm = document.getElementById('deposit-form');
            depositForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById('deposit-amount').focus();
        });
        document.getElementById('quick-invest-btn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('investment-plans').closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    
    // Add event listeners for date filtering
    document.getElementById('filter-btn').addEventListener('click', () => {
        transactionCurrentPage = 1; // Reset to first page on new filter
        renderTransactions();
        renderBalanceChart(); // Update chart based on filter
    });

    document.getElementById('clear-filter-btn').addEventListener('click', () => {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        document.getElementById('filter-type').value = '';
        transactionCurrentPage = 1; // Reset to first page
        renderTransactions();
        renderBalanceChart(); // Reset chart
    });

    // Add event listener for dismissing announcements
    const announcementsCard = document.getElementById('announcements-card');
    const dismissBtn = document.getElementById('dismiss-announcements-btn');

    // Check if user has already dismissed this
    if (getStorageItem('announcementsDismissed') === 'true') {
        announcementsCard.style.display = 'none';
    }

    dismissBtn.addEventListener('click', () => {
        announcementsCard.style.display = 'none';
        setStorageItem('announcementsDismissed', 'true');
    });


    // Add event listeners for pagination
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (transactionCurrentPage > 1) {
            transactionCurrentPage--;
            renderTransactions();
        }
    });
    document.getElementById('next-page-btn').addEventListener('click', () => {
        transactionCurrentPage++;
        renderTransactions();
    });

    // Add event listeners for table sorting
    document.querySelectorAll('#transactions-table th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort;

            if (transactionSortColumn === sortKey) {
                // If same column, toggle direction
                transactionSortDirection = transactionSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // If new column, set it and default to descending
                transactionSortColumn = sortKey;
                transactionSortDirection = 'desc';
            }
            renderTransactions();
        });
    });
}