import { showToast } from '../notifications.js';

export const handleProfilePage = () => {
    const welcomeMessage = document.getElementById('welcome-message');
    if (!welcomeMessage) return;

    const planDisplay = document.getElementById('current-plan-display');
    const cancelPlanBtn = document.getElementById('cancel-plan-btn');
    const transactionHistoryBody = document.getElementById('transaction-history-body');
    const noTransactionsMsg = document.getElementById('no-transactions-msg');

    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        welcomeMessage.textContent = `Welcome, ${loggedInUser}!`;

        const updatePlanDisplay = () => {
            if (!planDisplay || !cancelPlanBtn) return;
            const selectedPlan = localStorage.getItem('selectedInvestmentPlan');
            if (selectedPlan) {
                planDisplay.textContent = selectedPlan;
                planDisplay.classList.remove('no-plan');
                planDisplay.classList.add('plan-name');
                cancelPlanBtn.style.display = 'flex';
            } else {
                planDisplay.textContent = 'You have not selected an investment plan yet.';
                planDisplay.classList.add('no-plan');
                planDisplay.classList.remove('plan-name');
                cancelPlanBtn.style.display = 'none';
            }
        };

        if(cancelPlanBtn) {
            cancelPlanBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel your investment plan?')) {
                    cancelPlanBtn.classList.add('loading');
                    cancelPlanBtn.disabled = true;

                    setTimeout(() => {
                        localStorage.removeItem('selectedInvestmentPlan');
                        showToast('Investment plan cancelled.', 'info');
                        updatePlanDisplay();
                        cancelPlanBtn.classList.remove('loading');
                        cancelPlanBtn.disabled = false;
                    }, 1000);
                }
            });
        }

        updatePlanDisplay();

        if (transactionHistoryBody && noTransactionsMsg) {
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            if (transactions.length > 0) {
                noTransactionsMsg.style.display = 'none';
                transactionHistoryBody.innerHTML = '';
                const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

                transactions.forEach(tx => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${tx.date}</td><td>${tx.description}</td><td>${formatter.format(tx.amount)}</td><td><span class="status-completed">${tx.status}</span></td>`;
                    transactionHistoryBody.appendChild(row);
                });
            } else {
                noTransactionsMsg.style.display = 'block';
            }
        }

    } else {
        window.location.href = 'login.html';
    }
};