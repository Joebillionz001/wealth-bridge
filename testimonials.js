import { formatCurrency, showToast } from './utils.js';

export function initTestimonialsPage() {
    renderHighProfile();
    renderLeaderboard();
    startLiveFeed();

    const filterSelect = document.getElementById('leaderboard-filter');
    const searchInput = document.getElementById('leaderboard-search');

    const updateLeaderboard = () => {
        const filter = filterSelect ? filterSelect.value : 'all-time';
        const search = searchInput ? searchInput.value : '';
        renderLeaderboard(filter, search);
    };

    if (filterSelect) {
        filterSelect.addEventListener('change', updateLeaderboard);
    }
    if (searchInput) {
        searchInput.addEventListener('input', updateLeaderboard);
    }

    // Share Rank Event Delegation
    const leaderboardTable = document.getElementById('leaderboard-table');
    if (leaderboardTable) {
        leaderboardTable.addEventListener('click', handleShareRank);
    }

    // Modal Logic
    const modal = document.getElementById('share-story-modal');
    const openBtn = document.getElementById('share-story-btn');
    const closeBtn = document.getElementById('close-story-modal');
    const form = document.getElementById('share-story-form');

    if (openBtn && modal) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast("Thank you! Your story has been submitted for review.", "success");
            modal.classList.add('hidden');
            form.reset();
        });
    }
}

function renderHighProfile() {
    const container = document.getElementById('high-profile-container');
    if (!container) return;

    const profiles = [
        { name: "Elena R.", role: "Tech Entrepreneur", quote: "WealthBridge allowed me to diversify my startup profits into stable real estate assets.", profit: 15400 },
        { name: "Marcus T.", role: "Senior Architect", quote: "The sustainable funds align perfectly with my values. Returns have been stellar.", profit: 8200 },
        { name: "Sarah L.", role: "Freelance Designer", quote: "I started small with the Crypto Beginner fund. Now I'm funding my travels with the profits.", profit: 5300 }
    ];

    if (profiles.length === 0) {
        container.innerHTML = '<p>No featured investors at this time.</p>';
        return;
    }
    container.innerHTML = profiles.map(p => `
        <div class="profile-card">
            <div class="profile-avatar">${p.name.charAt(0)}</div>
            <h3>${p.name}</h3>
            <p class="role">${p.role}</p>
            <p class="quote">"${p.quote}"</p>
            <p class="profit-badge">Earned ${formatCurrency(p.profit)}</p>
        </div>
    `).join('');
}

function renderLeaderboard(filter = 'all-time', search = '') {
    const tbody = document.querySelector('#leaderboard-table tbody');
    if (!tbody) return;

    let leaders = [];

    leaders = [
        { name: "CryptoKing99", verified: true, trending: true, profit: 45200 },
        { name: "SarahJ_Invest", verified: true, trending: false, profit: 38100 },
        { name: "MikeBuilder", verified: false, trending: true, profit: 32500 },
        { name: "GreenFuture", verified: true, trending: true, profit: 29800 },
        { name: "AlexTech", verified: false, trending: false, profit: 25400 },
        { name: "QuantumLeap", verified: true, trending: true, profit: 21000 },
        { name: "HodlGang", verified: false, trending: false, profit: 18900 },
        { name: "EstateMogul", verified: true, trending: false, profit: 15600 }
    ];

    if (search) {
        leaders = leaders.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
    }

    if (leaders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Leaderboard data is not available.</td></tr>`;
        return;
    }

    tbody.innerHTML = leaders.map((l, index) => `
        <tr>
            <td><span class="rank rank-${index + 1}">${index + 1}</span></td>
            <td>
                ${l.name}
                ${l.verified ? '<span class="verified-badge" title="Verified Investor">✓</span>' : ''}
                ${l.trending ? '<span class="trending-icon" title="Trending Up">▲</span>' : ''}
            </td>
            <td class="text-success profit-counter" data-target="${l.profit}">${formatCurrency(0)}</td>
            <td><button class="share-rank-btn" data-rank="${index + 1}" data-profit="${formatCurrency(l.profit)}" title="Share Rank">🔗</button></td>
        </tr>
    `).join('');

    // Animate numbers
    const counters = tbody.querySelectorAll('.profit-counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; // 2 seconds animation
        const start = performance.now();

        const step = (timestamp) => {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quart function for smooth deceleration
            const ease = 1 - Math.pow(1 - progress, 4);
            
            const current = Math.floor(ease * target);
            counter.textContent = formatCurrency(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    });
}

function handleShareRank(e) {
    if (!e.target.classList.contains('share-rank-btn')) return;

    const btn = e.target;
    const rank = btn.dataset.rank;
    const profit = btn.dataset.profit;
    const text = `I'm ranked #${rank} on WealthBridge with a total profit of ${profit}! Join me and start earning today.`;
    const url = "https://wealthbridge.com"; // Mock URL

    if (navigator.share) {
        navigator.share({
            title: 'My WealthBridge Rank',
            text: text,
            url: url
        }).catch(console.error);
    } else {
        // Fallback to Twitter
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
    }
}

function startLiveFeed() {
    const feed = document.getElementById('live-feed');
    if (!feed) return;
    
    const activities = [
        "just invested $500 in Real Estate",
        "withdrew $200 profit",
        "started the Crypto Growth plan",
        "earned $50 referral bonus",
        "invested $1,000 in Tech Starter",
        "just joined WealthBridge"
    ];

    const names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Quinn"];

    const addEntry = () => {
        const name = names[Math.floor(Math.random() * names.length)];
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const time = new Date().toLocaleTimeString();

        const entry = document.createElement('div');
        entry.className = 'feed-item';
        entry.innerHTML = `
            <span class="feed-time">${time}</span>
            <span class="feed-text"><strong>${name}</strong> ${activity}</span>
        `;
        
        feed.prepend(entry);
        if (feed.children.length > 10) feed.lastElementChild.remove();
    };

    // Add initial entries
    for(let i=0; i<5; i++) addEntry();
    
    // Add new entry every 3-6 seconds
    setInterval(addEntry, 4000);
}