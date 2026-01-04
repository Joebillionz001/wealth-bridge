import { apiService } from './api-service.js';
import { formatCurrency, showToast } from './utils.js';

export function initAdminPage() {
    if (!apiService.getLoggedInUser()) {
        window.location.href = 'login.html';
        return;
    }

    renderAdminStats();
    renderPendingWithdrawals();
    renderAllUsers();
    renderPendingKyc();

    // Event delegation for actions
    document.getElementById('admin-withdrawals-table').addEventListener('click', handleTransactionAction);
    document.getElementById('admin-kyc-table').addEventListener('click', handleKycAction);
}

function renderAdminStats() {
    const users = apiService.getAllUsers();
    const transactions = apiService.getAllTransactions();

    const totalDeposits = transactions
        .filter(t => t.type === 'Deposit' && t.status === 'Completed')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingWithdrawals = transactions
        .filter(t => t.type === 'Withdrawal' && t.status === 'Pending')
        .length;

    const pendingKyc = users.filter(u => u.kycStatus === 'pending').length;

    document.getElementById('admin-total-users').textContent = users.length;
    document.getElementById('admin-total-deposits').textContent = formatCurrency(totalDeposits);
    document.getElementById('admin-pending-withdrawals').textContent = pendingWithdrawals;
    document.getElementById('admin-pending-kyc').textContent = pendingKyc;
}

function renderPendingWithdrawals() {
    const tbody = document.querySelector('#admin-withdrawals-table tbody');
    const transactions = apiService.getAllTransactions();
    
    const pending = transactions
        .filter(t => t.type === 'Withdrawal' && t.status === 'Pending')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = '';
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No pending withdrawals.</td></tr>';
        return;
    }

    tbody.innerHTML = pending.map(tx => `
        <tr>
            <td>${tx.date}</td>
            <td>${tx.userName}<br><small>${tx.userEmail}</small></td>
            <td>${formatCurrency(tx.amount)}</td>
            <td><span class="badge" style="background:#f39c12; color:white;">Pending</span></td>
            <td>
                <div class="action-btn-group">
                    <button class="btn btn-sm btn-primary action-btn" data-action="Completed" data-uid="${tx.userId}" data-txid="${tx.id}">Approve</button>
                    <button class="btn btn-sm btn-danger action-btn" data-action="Rejected" data-uid="${tx.userId}" data-txid="${tx.id}">Reject</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPendingKyc() {
    const tbody = document.querySelector('#admin-kyc-table tbody');
    const users = apiService.getAllUsers();
    
    const pending = users.filter(u => u.kycStatus === 'pending');

    tbody.innerHTML = '';
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No pending KYC requests.</td></tr>';
        return;
    }

    tbody.innerHTML = pending.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="badge" style="background:#f39c12; color:white;">Pending Review</span></td>
            <td>
                <div class="action-btn-group">
                    <button class="btn btn-sm btn-primary kyc-action-btn" data-action="verified" data-uid="${u.id}">Approve</button>
                    <button class="btn btn-sm btn-danger kyc-action-btn" data-action="rejected" data-uid="${u.id}">Reject</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderAllUsers() {
    const tbody = document.querySelector('#admin-users-table tbody');
    const users = apiService.getAllUsers();

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${formatCurrency(u.balance)}</td>
            <td>${new Date(u.id.split('-')[1] || Date.now()).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

async function handleTransactionAction(e) {
    if (!e.target.classList.contains('action-btn')) return;

    const btn = e.target;
    const action = btn.dataset.action; // 'Completed' or 'Rejected'
    const userId = btn.dataset.uid;
    const txId = btn.dataset.txid;

    if (!confirm(`Are you sure you want to mark this as ${action}?`)) return;

    try {
        await apiService.updateTransactionStatus(userId, txId, action);
        showToast(`Transaction marked as ${action}`, 'success');
        renderAdminStats();
        renderPendingWithdrawals();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleKycAction(e) {
    if (!e.target.classList.contains('kyc-action-btn')) return;

    const btn = e.target;
    const action = btn.dataset.action; // 'verified' or 'rejected'
    const userId = btn.dataset.uid;

    if (!confirm(`Are you sure you want to mark this user as ${action}?`)) return;

    try {
        await apiService.updateKycStatus(userId, action);
        showToast(`User KYC updated to ${action}`, 'success');
        renderAdminStats();
        renderPendingKyc();
    } catch (err) {
        showToast(err.message, 'error');
    }
}