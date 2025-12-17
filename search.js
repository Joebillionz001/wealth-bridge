export const handleSiteSearch = async () => {
    const searchResultsList = document.getElementById('search-results-list');
    if (!searchResultsList) return;

    const searchTitle = document.getElementById('search-results-title');
    const noResultsMessage = document.getElementById('no-results-message');
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q')?.toLowerCase().trim();

    if (!query) {
        searchTitle.textContent = 'Please enter a search term.';
        return;
    }

    searchTitle.textContent = `Search Results for: "${query}"`;

    try {
        const response = await fetch('search-index.json');
        const index = await response.json();

        const results = index.filter(item => 
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.keywords.toLowerCase().includes(query)
        );

        if (results.length > 0) {
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `<h3><a href="${result.url}">${result.title}</a></h3><p>${result.description}</p>`;
                searchResultsList.appendChild(item);
            });
        } else {
            noResultsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching search index:', error);
        noResultsMessage.textContent = 'Could not perform search. Please try again later.';
        noResultsMessage.style.display = 'block';
    }
};