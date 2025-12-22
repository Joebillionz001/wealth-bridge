/**
 * Mock API Service for Frontend-Only Version.
 * Uses localStorage to simulate a database.
 */
class ApiService {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || null;
    }

    _save() {
        localStorage.setItem('users', JSON.stringify(this.users));
        if (this.loggedInUser) {
            localStorage.setItem('loggedInUser', JSON.stringify(this.loggedInUser));
        } else {
            localStorage.removeItem('loggedInUser');
        }
    }

    async initialize() {
        // No-op for frontend only
        return;
    }

    getLoggedInUser() {
        // Refresh from users array to ensure latest state
        if (this.loggedInUser) {
            this.loggedInUser = this.users.find(u => u.id === this.loggedInUser.id) || this.loggedInUser;
        }
        return this.loggedInUser;
    }

    async updateUser(userData) {
        const index = this.users.findIndex(u => u.id === userData.id);
        if (index !== -1) {
            this.users[index] = userData;
            this.loggedInUser = userData;
            this._save();
        }
        return userData;
    }

    async login(email, password) {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 500));
        
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error("Invalid email or password");
        
        this.loggedInUser = user;
        this._save();
        return user;
    }

    async signup(userData) {
        await new Promise(r => setTimeout(r, 500));
        
        if (this.users.some(u => u.email === userData.email)) {
            throw new Error("An account with this email already exists.");
        }
        
        this.users.push(userData);
        this._save();
        return userData;
    }

    async logout() {
        this.loggedInUser = null;
        localStorage.removeItem('loggedInUser');
    }

    // --- Transaction Methods ---
    
    async deposit(amount) {
        const user = this.getLoggedInUser();
        user.balance += amount;
        user.transactions.push({
            id: 'DEP-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'Deposit',
            amount: amount,
            status: 'Completed'
        });
        return this.updateUser(user);
    }

    async withdraw(amount) {
        const user = this.getLoggedInUser();
        if (user.balance < amount) throw new Error("Insufficient funds");
        
        user.balance -= amount;
        user.transactions.push({
            id: 'WTH-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'Withdrawal',
            amount: amount,
            status: 'Completed'
        });
        return this.updateUser(user);
    }

    async verifyInvestment(reference, planName, amount) {
        // In frontend-only mode, we trust the client and update state directly
        const user = this.getLoggedInUser();
        
        // 1. Record Deposit (from Paystack)
        user.balance += amount;
        user.transactions.push({ 
            id: 'DEP-' + Date.now(),
            date: new Date().toISOString().split('T')[0], 
            type: 'Deposit', 
            amount, 
            status: 'Completed' 
        });
        
        // 2. Record Investment (deduct from balance)
        user.balance -= amount;
        user.transactions.push({ 
            id: 'INV-' + Date.now(),
            date: new Date().toISOString().split('T')[0], 
            type: 'Investment', 
            amount, 
            status: 'Completed' 
        });
        
        // 3. Add Investment
        user.investments.push({
            id: Date.now(),
            planName,
            amount,
            startDate: new Date().toISOString(),
            lastProfitDate: new Date().toISOString(),
            status: 'Active',
            profit: 0
        });
        
        await this.updateUser(user);
        return { user };
    }

    // --- Password Reset ---
    
    async requestPasswordReset(email) {
        const user = this.users.find(u => u.email === email);
        if (user) {
            // Store a flag in localStorage to allow reset on the next page
            localStorage.setItem('resetEmail', email);
        }
        return true;
    }

    async updateUserPassword(token, newPassword) {
        // Ignore token, use stored resetEmail
        const email = localStorage.getItem('resetEmail');
        if (!email) throw new Error("No reset request found");
        
        const user = this.users.find(u => u.email === email);
        if (user) {
            user.password = newPassword;
            this._save();
            localStorage.removeItem('resetEmail');
        }
        return true;
    }

    async changePassword(currentPassword, newPassword) {
        const user = this.getLoggedInUser();
        if (user.password !== currentPassword) throw new Error("Incorrect current password");
        user.password = newPassword;
        return this.updateUser(user);
    }

    async toggleFavorite(planName) {
        const user = this.getLoggedInUser();
        if (!user.favorites) user.favorites = [];
        
        const index = user.favorites.indexOf(planName);
        if (index === -1) {
            user.favorites.push(planName);
        } else {
            user.favorites.splice(index, 1);
        }
        return this.updateUser(user);
    }

    // --- Generic Storage Helpers ---

    getStorageItem(key) {
        return localStorage.getItem(key);
    }

    setStorageItem(key, value) {
        localStorage.setItem(key, value);
    }
}

export const apiService = new ApiService();