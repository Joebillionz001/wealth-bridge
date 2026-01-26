import { showToast } from './ui.js';
import { apiService } from './api-service.js';
import { INVESTMENT_PLANS, PAYSTACK_PUBLIC_KEY } from './config.js';
import { getLoggedInUser, updateUser, formatCurrency, getStorageItem, setStorageItem, EXCHANGE_RATE } from './utils.js';

// --- DATA & CONFIG ---

let pendingWithdrawalAmount = 0;
// --- CHART INSTANCES ---
let balanceChartInstance = null;
let portfolioChartInstance = null;

// --- PAGINATION STATE ---
let transactionCurrentPage = 1;
const transactionsPerPage = 5; // Show 5 transactions per page

// --- SORTING STATE ---
let transactionSortColumn = 'date'; // Default sort column
let transactionSortDirection = 'desc'; // 'asc' or 'desc'

// --- FEES CONFIG ---
const DEPOSIT_FEE_PERCENT = 1.5;
const WITHDRAWAL_FEE_PERCENT = 1.0;

// --- RENDER FUNCTIONS ---

/**
 * Displays the user's name and key financial metrics.
 */
function renderAccountOverview() {
    const user = getLoggedInUser();
    if (!user) return;

    // KYC Warning
    const kycBanner = document.getElementById('kyc-warning');
    if (user.kycStatus === 'none' || user.kycStatus === 'rejected') {
        if (!kycBanner) {
            const banner = document.createElement('div');
            banner.id = 'kyc-warning';
            banner.innerHTML = `<div style="background: #fff3cd; color: #856404; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border: 1px solid #ffeeba; display: flex; justify-content: space-between; align-items: center;"><span>⚠️ Your identity is not verified. Please complete KYC to enable withdrawals.</span> <a href="kyc.html" class="btn btn-sm btn-primary">Verify Now</a></div>`;
            document.getElementById('welcome-message').after(banner);
        }
    }

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

        const categoryIcons = {
            "Real Estate": "🏠",
            "Technology": "💻",
            "Cryptocurrency": "₿",
            "Gemini Fund": "🤖",
            "Sustainable": "🌱"
        };

        plans.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            planCard.style.cursor = 'pointer';
            planCard.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${categoryIcons[plan.category] || '💰'}</div>
                <span class="badge badge-${plan.riskLevel ? plan.riskLevel.toLowerCase() : 'medium'}" style="position: absolute; top: 15px; right: 15px; font-size: 0.7rem;">${plan.riskLevel || 'Medium'} Risk</span>
                <h4>${plan.name}</h4>
                <p class="plan-desc">${plan.description}</p>
                <div class="plan-details">
                    <p><strong>Price:</strong> ${formatCurrency(plan.min)}</p>
                    <p><strong>Return:</strong> ${plan.roi}% weekly</p>
                    <p class="urgency">Closing in: <span class="timer">02:14:59</span></p>
                </div>
                <p style="font-size: 0.8rem; color: #666; margin-bottom: 10px;">Click card to view full details</p>
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
        let time = 86400; // 24 hours cycle
        
        const interval = setInterval(() => {
            time--;
            if (time < 0) time = 86400; // Reset cycle
            
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

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.ceil(amount * EXCHANGE_RATE * 100), // Convert USD to NGN Kobo
        currency: 'NGN',
        ref: 'wltbrg-' + Date.now(),
        onClose: function() {
            showToast("Investment cancelled.", "info");
        },
        callback: function(response) {
            showToast("Payment successful! Finalizing investment...", "success");
            (async () => {
                try {
                    // Use the apiService to handle the data logic
                    await apiService.verifyInvestment(response.reference, plan.name, amount);
                    renderAll();
                } catch (err) {
                    showToast(err.message || "Failed to finalize investment.", "error");
                }
            })();
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
    const fee = amount * (DEPOSIT_FEE_PERCENT / 100);
    const totalCharge = amount + fee;

    if (isNaN(amount) || amount <= 0) {
        showToast("Please enter a valid positive amount to deposit.", "error");
        return;
    }

    const user = getLoggedInUser();

    // --- PAYSTACK INTEGRATION FOR DEPOSIT ---
    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.ceil(totalCharge * EXCHANGE_RATE * 100), // Convert USD to NGN Kobo (Amount + Fee)
        currency: 'NGN',
        ref: 'wltbrg-dep-' + Date.now(),
        onClose: function() {
            showToast("Deposit cancelled.", "info");
        },
        callback: function(response) {
            // On successful payment, credit the user's balance
            apiService.deposit(amount).then(() => {
                showToast(`${formatCurrency(amount)} has been successfully deposited.`, "success");
                amountInput.value = ''; // Clear the input
                document.getElementById('deposit-fee-info').style.display = 'none';
                renderAll();
            }).catch(err => {
                showToast("Failed to process deposit.", "error");
            });
        }
    });
    handler.openIframe();
}

/**
 * Handles a withdrawal request from the form.
 * @param {Event} e The form submission event.
 */
function handleWithdraw(e) {
    e.preventDefault();
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

    // Open Modal instead of immediate withdrawal
    pendingWithdrawalAmount = amount;
    const modalAmountInput = document.getElementById('modal-withdraw-amount');
    if (modalAmountInput) modalAmountInput.value = formatCurrency(amount);
    
    const modal = document.getElementById('withdrawal-modal');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Handles the confirmation of withdrawal from the modal.
 */
async function handleWithdrawalConfirmation(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;

    try {
        // Simulate network/bank processing delay
        await new Promise(r => setTimeout(r, 2000));
        
        await apiService.withdraw(pendingWithdrawalAmount);
        
        showToast(`Withdrawal of ${formatCurrency(pendingWithdrawalAmount)} initiated successfully.`, "success");
        
        // Reset and close
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-fee-info').style.display = 'none';
        document.getElementById('withdrawal-details-form').reset();
        document.getElementById('withdrawal-modal').classList.add('hidden');
        
        transactionCurrentPage = 1;
        renderAll();
    } catch (err) {
        showToast(err.message || "Withdrawal failed.", "error");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
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
 * Processes weekly profit generation for active investments.
 */
function processEarnings() {
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
 * Initializes Pull-to-Refresh functionality for mobile users.
 */
function initPullToRefresh() {
    const ptrElement = document.getElementById('pull-to-refresh');
    if (!ptrElement) return;

    const ptrIcon = ptrElement.querySelector('.ptr-icon');
    const ptrText = ptrElement.querySelector('.ptr-text');
    
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let isRefreshing = false;
    const threshold = 150; // Pull distance required to trigger refresh

    window.addEventListener('touchstart', (e) => {
        // Only enable if at the very top of the page
        if (window.scrollY <= 10 && !isRefreshing) {
            startY = e.touches[0].clientY;
            isPulling = true;
            ptrElement.classList.remove('releasing');
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isPulling || isRefreshing) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Calculate opacity and position based on pull distance
            const opacity = Math.min(diff / 100, 1);
            const translateY = Math.min(diff * 0.4, 60) - 20;
            
            ptrElement.style.opacity = opacity;
            ptrElement.style.transform = `translateY(${translateY}px)`;

            if (diff > threshold) {
                ptrIcon.style.transform = 'rotate(180deg)';
                ptrText.textContent = 'Release to refresh';
            } else {
                ptrIcon.style.transform = 'rotate(0deg)';
                ptrText.textContent = 'Pull to refresh';
            }
        }
    }, { passive: true });

    window.addEventListener('touchend', async () => {
        if (!isPulling || isRefreshing) return;
        isPulling = false;
        const diff = currentY - startY;

        ptrElement.classList.add('releasing');

        if (diff > threshold && window.scrollY <= 10) {
            isRefreshing = true;
            ptrElement.style.opacity = '1';
            ptrElement.style.transform = 'translateY(0px)';
            ptrIcon.classList.add('spinner'); // Reuse existing spinner class or style
            ptrIcon.style.border = 'none'; // Reset border if spinner class adds it differently
            ptrIcon.innerHTML = '↻'; 
            ptrIcon.style.animation = 'spin 1s linear infinite';
            ptrText.textContent = 'Refreshing...';

            // Refresh Action
            processEarnings();
            renderAll();
            await new Promise(r => setTimeout(r, 1500)); // Simulate network delay
            showToast("Dashboard updated", "success");

            // Reset UI
            isRefreshing = false;
            ptrIcon.style.animation = '';
            ptrIcon.innerHTML = '↓';
            ptrIcon.style.transform = '';
            ptrText.textContent = 'Pull to refresh';
            ptrElement.style.opacity = '';
            ptrElement.style.transform = '';
        } else {
            // Snap back if threshold not met
            ptrElement.style.opacity = '';
            ptrElement.style.transform = '';
        }
    });
}

/**
 * Initializes fee calculation listeners for deposit and withdrawal forms.
 */
function initFeeCalculators() {
    const depositInput = document.getElementById('deposit-amount');
    const withdrawInput = document.getElementById('withdraw-amount');

    if (depositInput) {
        depositInput.addEventListener('input', () => {
            const amount = parseFloat(depositInput.value) || 0;
            const fee = amount * (DEPOSIT_FEE_PERCENT / 100);
            const total = amount + fee;
            
            document.getElementById('deposit-fee').textContent = formatCurrency(fee);
            document.getElementById('deposit-total').textContent = formatCurrency(total);
            document.getElementById('deposit-fee-info').style.display = amount > 0 ? 'block' : 'none';
        });
    }

    if (withdrawInput) {
        withdrawInput.addEventListener('input', () => {
            const amount = parseFloat(withdrawInput.value) || 0;
            const fee = amount * (WITHDRAWAL_FEE_PERCENT / 100);
            const net = amount - fee;
            
            document.getElementById('withdraw-fee').textContent = formatCurrency(fee);
            document.getElementById('withdraw-net').textContent = formatCurrency(net);
            document.getElementById('withdraw-fee-info').style.display = amount > 0 ? 'block' : 'none';
        });
    }
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

    initPullToRefresh();
    initFeeCalculators();

    // Handle Skeleton Loading
    const skeleton = document.getElementById('dashboard-skeleton');
    const content = document.getElementById('dashboard-content');

    try {
        // Show content immediately, with minimal delay for render
        setTimeout(() => {
            if (skeleton) skeleton.classList.add('hidden');
            if (content) content.classList.remove('hidden');

            try {
                processEarnings();
                renderInvestmentPlans();
                renderAll();
            } catch (error) {
                console.error('Error rendering dashboard content:', error);
                // Still show content even if there are errors
                if (content) content.classList.remove('hidden');
            }
        }, 300); // Reduced from 1500ms to 300ms for faster display
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Ensure content is shown even on error
        if (skeleton) skeleton.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }

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

    // Withdrawal Modal Listeners
    const withdrawalForm = document.getElementById('withdrawal-details-form');
    if (withdrawalForm) withdrawalForm.addEventListener('submit', handleWithdrawalConfirmation);

    const closeWithdrawalBtn = document.getElementById('close-withdrawal-modal');
    if (closeWithdrawalBtn) closeWithdrawalBtn.addEventListener('click', () => {
        document.getElementById('withdrawal-modal').classList.add('hidden');
    });

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