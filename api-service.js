/**
 * API Service.
 * Uses localStorage for data persistence.
 */
class ApiService {
    constructor() {
        this.users = [];
        this.loggedInUser = null;
        try {
            const users = localStorage.getItem('users');
            this.users = users ? JSON.parse(users) : [];
            
            const loggedIn = localStorage.getItem('loggedInUser');
            this.loggedInUser = loggedIn ? JSON.parse(loggedIn) : null;
        } catch (e) {
            console.warn('LocalStorage access failed or data is corrupt:', e);
        }
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
        // Request persistent storage using the standardized API
        if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist();
        }

        // Initialize EmailJS (Replace "YOUR_PUBLIC_KEY" with your actual key from EmailJS dashboard)
        if (typeof emailjs !== 'undefined') {
            emailjs.init("YOUR_PUBLIC_KEY");
        }
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
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error("Invalid email or password");

        // Check if user is verified
        if (user.verified === false) throw new Error("Please verify your email address before logging in.");
        
        this.loggedInUser = user;
        this._save();
        return user;
    }

    async signup(userData) {
        if (this.users.some(u => u.email === userData.email)) {
            throw new Error("An account with this email already exists.");
        }

        // --- Referral Logic ---
        if (userData.usedReferralCode) {
            const referrer = this.users.find(u => u.referralCode === userData.usedReferralCode);
            if (referrer) {
                const bonus = 50; // $50 Referral Bonus
                referrer.referrals = (referrer.referrals || 0) + 1;
                referrer.referralEarnings = (referrer.referralEarnings || 0) + bonus;
                referrer.balance += bonus;
                
                referrer.transactions.push({
                    id: 'REF-' + Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    type: 'Referral Bonus',
                    amount: bonus,
                    status: 'Completed'
                });
            }
            delete userData.usedReferralCode; // Cleanup before saving
        }
        
        // Add verification status and code
        userData.verified = false;
        userData.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Send real email via EmailJS
        await this._sendVerificationEmail(userData.email, userData.name, userData.verificationCode);

        this.users.push(userData);
        this._save();
        return { ...userData };
    }

    async verifyEmail(email, code) {
        const user = this.users.find(u => u.email === email);
        if (!user) throw new Error("User not found.");
        if (user.verified) return true; // Already verified
        
        if (user.verificationCode !== code) throw new Error("Invalid verification code.");
        
        user.verified = true;
        delete user.verificationCode; // Cleanup
        this._save();
        return true;
    }

    async resendVerificationCode(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) throw new Error("User not found.");
        if (user.verified) throw new Error("Account already verified.");
        
        user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Send real email via EmailJS
        await this._sendVerificationEmail(user.email, user.name, user.verificationCode);
        
        this._save();
        return user.verificationCode;
    }

    async _sendVerificationEmail(email, name, code) {
        // Check if EmailJS is loaded
        if (typeof emailjs === 'undefined') {
            console.warn('EmailJS not loaded. Verification Code:', code);
            return;
        }

        const serviceID = "YOUR_SERVICE_ID"; // Replace with your EmailJS Service ID
        const templateID = "YOUR_TEMPLATE_ID"; // Replace with your EmailJS Template ID

        const templateParams = {
            to_name: name,
            to_email: email,
            code: code
        };

        try {
            await emailjs.send(serviceID, templateID, templateParams);
            console.log('Verification email sent successfully');
        } catch (error) {
            console.error('Failed to send email:', error);
            console.log(`Verification Code for ${email}: ${code}`);
        }
    }

    async loginWithGoogle(googleUser) {
        // Check if user exists by email
        let user = this.users.find(u => u.email === googleUser.email);
        
        if (!user) {
            // Create new user if not exists (Auto-signup)
            user = {
                ...googleUser,
                id: 'USR-' + Date.now(),
                balance: 0,
                investments: [],
                transactions: [],
                favorites: [],
                referrals: 0,
                referralEarnings: 0,
                referralCode: 'WB-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                password: 'google-auth-user',
                kycStatus: 'none',
                verified: true // Google users are automatically verified
            };
            this.users.push(user);
        }
        
        this.loggedInUser = user;
        this._save();
        return user;
    }

    async logout() {
        this.loggedInUser = null;
        localStorage.removeItem('loggedInUser');
    }

    async submitKyc(data) {
        const user = this.getLoggedInUser();
        user.kycStatus = 'pending';
        return this.updateUser(user);
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
        
        if (user.kycStatus !== 'verified') throw new Error("Identity verification required for withdrawals. Please complete KYC.");
        
        if (user.balance < amount) throw new Error("Insufficient funds");
        
        user.balance -= amount;
        user.transactions.push({
            id: 'WTH-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'Withdrawal',
            amount: amount,
            status: 'Pending'
        });
        return this.updateUser(user);
    }

    async verifyInvestment(reference, planName, amount) {
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
            
            // Generate a link
            const token = Math.random().toString(36).substr(2);
            // We pass email in URL to allow cross-device reset
            const resetLink = `${window.location.origin}/reset-password.html?email=${encodeURIComponent(email)}&token=${token}`;
            
            await this._sendPasswordResetEmail(email, user.name, resetLink);
        }
        return true;
    }

    async _sendPasswordResetEmail(email, name, link) {
        if (typeof emailjs === 'undefined') {
            console.log(`Password Reset Link for ${email}: ${link}`);
            return;
        }

        const serviceID = "YOUR_SERVICE_ID"; 
        const templateID = "YOUR_TEMPLATE_ID"; // Use your template ID

        const templateParams = {
            to_name: name,
            to_email: email,
            reset_link: link,
            message: `Click here to reset your password: ${link}`
        };

        try {
            await emailjs.send(serviceID, templateID, templateParams);
            console.log('Password reset email sent successfully');
        } catch (error) {
            console.error('Failed to send email:', error);
            console.log(`Password Reset Link for ${email}: ${link}`);
        }
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

    // --- Admin Methods ---

    getAllUsers() {
        return this.users;
    }

    getAllTransactions() {
        let allTx = [];
        this.users.forEach(user => {
            const userTx = user.transactions.map(tx => ({ ...tx, userId: user.id, userName: user.name, userEmail: user.email }));
            allTx = allTx.concat(userTx);
        });
        return allTx;
    }

    async updateTransactionStatus(userId, transactionId, status) {
        const user = this.users.find(u => u.id === userId);
        if (!user) throw new Error("User not found");

        const tx = user.transactions.find(t => t.id === transactionId);
        if (!tx) throw new Error("Transaction not found");

        // If rejecting a withdrawal, refund the balance
        if (tx.type === 'Withdrawal' && tx.status === 'Pending' && status === 'Rejected') {
            user.balance += tx.amount;
        }
        // If approving, the balance was already deducted during request, so just update status

        tx.status = status;
        
        // Save changes
        this._save();
        return true;
    }

    async updateKycStatus(userId, status) {
        const user = this.users.find(u => u.id === userId);
        if (!user) throw new Error("User not found");
        
        user.kycStatus = status;
        this._save();
        return true;
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