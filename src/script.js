// Core state
let allGames = [];
let filteredGames = [];
let activeCategory = null;
let searchQuery = '';
let currentView = 'home'; // 'home', 'recent'
let isGridView = false; // Toggle for home featured view
let recentlyPlayedIds = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
let userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');

// DOM Elements
const lobbyEl = document.getElementById('lobby');
const playerEl = document.getElementById('player');
const gameGridEl = document.getElementById('game-grid');
const sidebarCategoriesEl = document.getElementById('sidebar-categories');
const searchInput = document.getElementById('search-input');
const noResultsEl = document.getElementById('no-results');
const backButton = document.getElementById('back-button');
const logo = document.getElementById('logo');
const navHome = document.getElementById('nav-home');
const navRecent = document.getElementById('nav-recent');
const activeViewTitle = document.getElementById('active-view-title');
const activeViewDesc = document.getElementById('active-view-desc');
const viewAllBtn = document.getElementById('view-all-btn');
const heroSection = document.getElementById('hero-section');
const continuePlayingSection = document.getElementById('continue-playing-section');
const continuePlayingGrid = document.getElementById('continue-playing-grid');
const topPicksSection = document.getElementById('top-picks-section');
const topPicksGrid = document.getElementById('top-picks-grid');

// Player Elements
const gameIframe = document.getElementById('game-iframe');
const gameTitle = document.getElementById('game-title');
const gameCategoryTag = document.getElementById('game-category-tag');
const gameDescription = document.getElementById('game-description');
const externalLink = document.getElementById('external-link');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const ratingStarsContainer = document.getElementById('rating-stars');
const averageRatingText = document.getElementById('average-rating');

// Initialize the app
async function init() {
    try {
        const response = await fetch('src/data/games.json');
        allGames = await response.json();
        
        applyFilters();
        renderCategories();
        renderGames();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to load games:', error);
    }
}

function renderCategories() {
    // Render Sidebar Games (Alphabetical)
    const sortedGames = [...allGames].sort((a, b) => a.title.localeCompare(b.title));
    sidebarCategoriesEl.innerHTML = sortedGames.map(game => {
        return `
            <button 
                data-game-id="${game.id}"
                class="sidebar-game-item w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors text-gray-400 hover:text-brand-primary hover:bg-brand-card/50 group"
                title="${game.title}"
            >
                <div class="w-1 h-1 rounded-full bg-gray-700 group-hover:bg-brand-primary transition-colors"></div>
                <span class="truncate">${game.title}</span>
            </button>
        `;
    }).join('');

    // Add click listeners to sidebar game buttons
    sidebarCategoriesEl.querySelectorAll('.sidebar-game-item').forEach(btn => {
        btn.addEventListener('click', () => {
            playGame(btn.dataset.gameId);
        });
    });
}

function updateActiveNav() {
    // Reset all
    navHome.classList.remove('bg-brand-primary/10', 'text-brand-primary');
    navHome.classList.add('text-gray-400');
    navRecent.classList.remove('bg-brand-primary/10', 'text-brand-primary');
    navRecent.classList.add('text-gray-400');

    if (currentView === 'home' && !activeCategory) {
        navHome.classList.add('bg-brand-primary/10', 'text-brand-primary');
        navHome.classList.remove('text-gray-400');
    } else if (currentView === 'recent') {
        navRecent.classList.add('bg-brand-primary/10', 'text-brand-primary');
        navRecent.classList.remove('text-gray-400');
    }
}

function updateViewMeta() {
    if (searchQuery) {
        activeViewTitle.innerHTML = `
            <div class="w-1.5 h-6 bg-brand-primary rounded-full"></div>
            Search Results
        `;
        activeViewDesc.textContent = `Showing games matching "${searchQuery}"`;
    } else if (currentView === 'recent') {
        activeViewTitle.innerHTML = `
            <div class="w-1.5 h-6 bg-brand-primary rounded-full"></div>
            Recently Played
        `;
        activeViewDesc.textContent = "Jump back into your favorites.";
    } else {
        activeViewTitle.innerHTML = `
            <div class="w-1.5 h-6 bg-brand-primary rounded-full"></div>
            Featured games
        `;
        activeViewDesc.textContent = "Discover your next favorite unblocked experience.";
    }
}

function renderRecentSection() {
    if (currentView !== 'home' || activeCategory || searchQuery || recentlyPlayedIds.length === 0) {
        continuePlayingSection.classList.add('hidden');
        return;
    }

    continuePlayingSection.classList.remove('hidden');
    const recentGames = recentlyPlayedIds.map(id => allGames.find(g => g.id === id)).filter(Boolean);

    continuePlayingGrid.innerHTML = recentGames.map(game => {
        const ratingInfo = calculateAverageRating(game.id);
        return `
        <div 
            class="group min-w-[200px] max-w-[240px] bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-all shrink-0"
            onclick="playGame('${game.id}')"
        >
            <div class="aspect-video relative overflow-hidden">
                <img 
                    src="${game.thumbnail}" 
                    alt="${game.title}"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <h4 class="font-bold text-xs truncate group-hover:text-brand-primary transition-colors">${game.title}</h4>
                    <div class="flex items-center gap-1 text-[10px] text-brand-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="w-2.5 h-2.5"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        <span>${ratingInfo.average}</span>
                    </div>
                </div>
            </div>
        </div>
    `;}).join('');
}

function renderTopPicksSection() {
    if (currentView !== 'home' || activeCategory || searchQuery) {
        topPicksSection.classList.add('hidden');
        return;
    }

    topPicksSection.classList.remove('hidden');
    // Randomize top picks
    const shuffled = [...allGames].sort(() => 0.5 - Math.random());
    const topPicks = shuffled.slice(0, 6); 

    topPicksGrid.innerHTML = topPicks.map(game => {
        const ratingInfo = calculateAverageRating(game.id);
        return `
        <div 
            class="group min-w-[200px] max-w-[240px] bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-all shrink-0"
            onclick="playGame('${game.id}')"
        >
            <div class="aspect-video relative overflow-hidden">
                <img 
                    src="${game.thumbnail}" 
                    alt="${game.title}"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="absolute bottom-2 left-3 right-3">
                    <div class="flex items-center justify-between">
                        <h4 class="font-bold text-xs truncate group-hover:text-brand-primary transition-colors">${game.title}</h4>
                        <div class="flex items-center gap-1 text-[10px] text-brand-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="w-2.5 h-2.5"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                            <span>${ratingInfo.average}</span>
                        </div>
                    </div>
                    <p class="text-[10px] text-gray-500 font-mono uppercase tracking-wider">${game.category}</p>
                </div>
            </div>
        </div>
    `;}).join('');
}

function renderGames() {
    renderRecentSection();
    renderTopPicksSection();

    heroSection.classList.remove('hidden');
    gameGridEl.classList.remove('hidden');

    const isFeaturedView = currentView === 'home' && !activeCategory && !searchQuery;
    
    // Use all filtered games and keep standard grid layout
    let displayGames = filteredGames;

    // Hide View All button as we are showing all games in grid now
    viewAllBtn.classList.add('hidden');

    // Set Layout Class to standard grid (goes down)
    gameGridEl.className = 'game-grid-standard';

    gameGridEl.innerHTML = displayGames.map(game => {
        const ratingInfo = calculateAverageRating(game.id);
        return `
        <div 
            class="group bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer game-card-transition hover:border-brand-primary/50 game-card"
            onclick="playGame('${game.id}')"
        >
            <div class="aspect-video relative overflow-hidden">
                <img 
                    src="${game.thumbnail}" 
                    alt="${game.title}"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-brand-bg to-transparent opacity-60"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="bg-brand-primary p-3 rounded-full text-black shadow-lg shadow-brand-primary/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="m7 4 12 8-12 8V4z"></path></svg>
                    </div>
                </div>
                <div class="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-brand-primary font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="inline-block"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    ${ratingInfo.average}
                </div>
            </div>
            <div class="p-4 border-t border-brand-border">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="font-bold text-lg group-hover:text-brand-primary transition-colors">${game.title}</h3>
                    <span class="text-[10px] font-mono uppercase text-brand-primary border border-brand-primary/30 px-1.5 rounded">
                        ${game.category}
                    </span>
                </div>
                <p class="text-gray-400 text-sm line-clamp-2 leading-relaxed">${game.description}</p>
            </div>
        </div>
    `;}).join('');

    noResultsEl.classList.toggle('hidden', filteredGames.length > 0);
}

function applyFilters() {
    if (currentView === 'recent') {
        const recentGames = recentlyPlayedIds.map(id => allGames.find(g => g.id === id)).filter(Boolean);
        filteredGames = recentGames.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                game.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    } else {
        filteredGames = allGames.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                game.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !activeCategory || game.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }
    renderGames();
}

function playGame(id) {
    const game = allGames.find(g => g.id === id);
    if (!game) return;

    // Track recently played
    recordPlayed(id);

    // Update UI elements
    gameIframe.src = game.iframeUrl;
    
    // Set allow permissions - use custom ones if provided, otherwise default
    const defaultAllow = "accelerometer *; autoplay *; camera *; clipboard-read *; clipboard-write *; encrypted-media *; fullscreen *; geolocation *; gyroscope *; microphone *; midi *; picture-in-picture *; web-share *";
    gameIframe.allow = game.allow || defaultAllow;

    // Set sandbox attribute if provided
    if (game.sandbox) {
        gameIframe.setAttribute('sandbox', game.sandbox);
    } else {
        gameIframe.removeAttribute('sandbox');
    }

    gameTitle.textContent = game.title;
    gameDescription.textContent = game.description;
    gameCategoryTag.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        ${game.category}
    `;
    externalLink.href = game.iframeUrl;

    // Render Player Rating
    updatePlayerRatingUI(id);

    // Switch views
    lobbyEl.classList.add('hidden');
    playerEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function recordPlayed(id) {
    recentlyPlayedIds = [id, ...recentlyPlayedIds.filter(pid => pid !== id)].slice(0, 12);
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayedIds));
    renderRecentSection();
}

function calculateAverageRating(id) {
    const game = allGames.find(g => g.id === id);
    if (!game) return { average: 0, count: 0 };

    const baseRating = game.rating || 0;
    const baseCount = game.ratingCount || 0;
    const userRating = userRatings[id];

    if (userRating) {
        const totalPoints = (baseRating * baseCount) + userRating;
        const totalCount = baseCount + 1;
        return {
            average: (totalPoints / totalCount).toFixed(1),
            count: totalCount
        };
    }

    return {
        average: baseRating.toFixed(1),
        count: baseCount
    };
}

function updatePlayerRatingUI(id) {
    const ratingInfo = calculateAverageRating(id);
    const userRating = userRatings[id] || 0;

    averageRatingText.innerHTML = `
        <span class="text-brand-primary font-bold">${ratingInfo.average}</span>
        <span class="text-gray-500">/ 5 (${ratingInfo.count} reviews)</span>
    `;

    ratingStarsContainer.innerHTML = [1, 2, 3, 4, 5].map(star => {
        const isFilled = star <= userRating;
        return `
            <button 
                onclick="rateGame('${id}', ${star})"
                class="transition-transform hover:scale-125 focus:outline-none"
                title="Rate ${star} stars"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isFilled ? '#00ffa3' : 'none'}" stroke="${isFilled ? '#00ffa3' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 ${isFilled ? 'drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]' : 'text-gray-600 hover:text-brand-primary'}">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            </button>
        `;
    }).join('');
}

function rateGame(id, rating) {
    userRatings[id] = rating;
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
    updatePlayerRatingUI(id);
    renderGames(); // Refresh cards to show new average
}

window.rateGame = rateGame;

function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        updateViewMeta();
        applyFilters();
    });

    backButton.addEventListener('click', () => {
        playerEl.classList.add('hidden');
        lobbyEl.classList.remove('hidden');
        gameIframe.src = ''; 
    });

    navHome.addEventListener('click', () => {
        currentView = 'home';
        activeCategory = null;
        searchQuery = '';
        searchInput.value = '';
        updateViewMeta();
        applyFilters();
        renderCategories();
        updateActiveNav();
        playerEl.classList.add('hidden');
        lobbyEl.classList.remove('hidden');
        gameIframe.src = '';
    });

    navRecent.addEventListener('click', () => {
        currentView = 'recent';
        activeCategory = null;
        searchQuery = '';
        searchInput.value = '';
        updateViewMeta();
        applyFilters();
        renderCategories();
        updateActiveNav();
        playerEl.classList.add('hidden');
        lobbyEl.classList.remove('hidden');
        gameIframe.src = '';
    });

    logo.addEventListener('click', () => {
        navHome.click();
    });

    viewAllBtn.addEventListener('click', () => {
        isGridView = !isGridView;
        renderGames();
    });

    fullscreenBtn.addEventListener('click', () => {
        if (gameIframe.requestFullscreen) {
            gameIframe.requestFullscreen();
        } else if (gameIframe.webkitRequestFullscreen) {
            gameIframe.webkitRequestFullscreen();
        } else if (gameIframe.msRequestFullscreen) {
            gameIframe.msRequestFullscreen();
        }
    });
}

// Global scope access for click handlers in HTML strings
window.playGame = playGame;

init();
