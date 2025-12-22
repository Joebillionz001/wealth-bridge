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
        { name: "Aliko D.", role: "Industrialist", quote: "WealthBridge provides the stability I look for in diversified assets.", profit: 500000 },
        { name: "Ngozi O.", role: "Global Economist", quote: "A transparent platform that empowers the next generation of investors.", profit: 120000 },
        { name: "Tony E.", role: "Tech Entrepreneur", quote: "The ROI on the Tech Growth fund is unmatched in the current market.", profit: 340000 },
        { name: "Folorunsho A.", role: "Oil Tycoon", quote: "Efficient, secure, and highly profitable. Highly recommended.", profit: 890000 }
    ];

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

    if (filter === 'week') {
        leaders = [
            { name: "Tunde B.", profit: 12500, verified: true, trending: true },
            { name: "Grace L.", profit: 10200 },
            { name: "Chinedu K.", profit: 9800, verified: true, trending: true },
            { name: "Sarah J.", profit: 8500 },
            { name: "Ibrahim M.", profit: 7200 }
        ];
    } else if (filter === 'month') {
        leaders = [
            { name: "Sarah J.", profit: 45000, verified: true, trending: true },
            { name: "Chinedu K.", profit: 42000, verified: true },
            { name: "Ibrahim M.", profit: 38000, trending: true },
            { name: "David W.", profit: 31000, verified: true },
            { name: "Fatima S.", profit: 28000 }
        ];
    } else {
        leaders = [
            { name: "Chinedu K.", profit: 154000, verified: true },
            { name: "Sarah J.", profit: 142500, verified: true, trending: true },
            { name: "Ibrahim M.", profit: 128000 },
            { name: "David W.", profit: 98000, verified: true, trending: true },
            { name: "Fatima S.", profit: 87500 },
            { name: "Emeka R.", profit: 76000, verified: true },
            { name: "Grace L.", profit: 65000, trending: true },
            { name: "Tunde B.", profit: 54000 },
            { name: "Zainab A.", profit: 43000, verified: true },
            { name: "Kofi A.", profit: 32000 }
        ];
    }

    if (search) {
        leaders = leaders.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
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
    
    const loadMoreBtn = document.getElementById('load-more-feed-btn');
    let maxItems = 8;

    const names = ["John", "Mary", "Ahmed", "Chioma", "Peter", "Aisha", "Samuel", "Esther", "Musa", "Blessing", "Yusuf", "Funke"];
    const actions = ["withdrew", "earned profit of", "invested"];

    function createEntry(isOld = false) {
        const name = names[Math.floor(Math.random() * names.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const amount = Math.floor(Math.random() * 5000) + 100;
        
        const entry = document.createElement('div');
        entry.className = 'feed-item';
        
        let timeLabel = "Just now";
        if (isOld) {
            const mins = Math.floor(Math.random() * 50) + 2;
            timeLabel = `${mins} mins ago`;
        }

        entry.innerHTML = `
            <span class="feed-icon">💸</span>
            <p><strong>${name}</strong> just ${action} <span class="text-success">${formatCurrency(amount)}</span></p>
            <span class="feed-time">${timeLabel}</span>
        `;
        return entry;
    }

    function addLiveEntry() {
        const entry = createEntry();
        feed.prepend(entry);

        while (feed.children.length > maxItems) {
            feed.lastElementChild.remove();
        }
    }

    addLiveEntry(); // Initial entry
    setInterval(addLiveEntry, 5000); // Add new entry every 5 seconds

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            maxItems += 5; // Increase capacity
            for (let i = 0; i < 5; i++) {
                const entry = createEntry(true);
                feed.appendChild(entry);
            }
        });
    }
}