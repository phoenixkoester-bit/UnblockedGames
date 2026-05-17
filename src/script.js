// Core state
let allGames = [];
let filteredGames = [];
let activeCategory = null;
let searchQuery = '';
let currentView = 'home'; // 'home', 'recent'
let isGridView = false; // Toggle for home featured view
let recentlyPlayedIds = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');

// DOM Elements
const lobbyEl = document.getElementById('lobby');
const playerEl = document.getElementById('player');
const gameGridEl = document.getElementById('game-grid');
const categoriesEl = document.getElementById('categories');
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
const categoryRowsContainer = document.getElementById('category-rows-container');
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
    const categories = [...new Set(allGames.map(g => g.category))];
    
    // Render Mobile Horizontal Categories
    const mobileCats = ['All Games', ...categories];
    categoriesEl.innerHTML = mobileCats.map(cat => {
        const isAll = cat === 'All Games';
        const isActive = activeCategory === cat || (isAll && activeCategory === null && !searchQuery && currentView === 'home');
        return `
            <button 
                data-category="${isAll ? '' : cat}"
                class="category-btn px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-all whitespace-nowrap ${
                    isActive 
                    ? 'bg-brand-primary text-black border-brand-primary scale-105' 
                    : 'border-brand-border text-gray-400 hover:border-gray-600'
                }"
            >
                ${cat}
            </button>
        `;
    }).join('');

    // Render Sidebar Categories
    sidebarCategoriesEl.innerHTML = categories.map(cat => {
        const isActive = activeCategory === cat;
        return `
            <button 
                data-category="${cat}"
                class="sidebar-nav-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive 
                    ? 'active text-brand-primary' 
                    : 'text-gray-400'
                }"
            >
                <div class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-primary' : 'bg-gray-700'}"></div>
                ${cat}
            </button>
        `;
    }).join('');

    // Add click listeners to sidebar buttons
    sidebarCategoriesEl.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            currentView = 'home';
            activeCategory = btn.dataset.category || null;
            searchQuery = '';
            searchInput.value = '';
            updateViewMeta();
            applyFilters();
            renderCategories();
            updateActiveNav();
        });
    });

    // Mobile click listeners
    categoriesEl.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentView = 'home';
            activeCategory = btn.dataset.category || null;
            updateViewMeta();
            applyFilters();
            renderCategories();
            updateActiveNav();
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
        activeViewTitle.textContent = "Search Results";
        activeViewDesc.textContent = `Showing games matching "${searchQuery}"`;
    } else if (currentView === 'recent') {
        activeViewTitle.textContent = "Recently Played";
        activeViewDesc.textContent = "Jump back into your favorites.";
    } else if (activeCategory) {
        activeViewTitle.textContent = `${activeCategory} Games`;
        activeViewDesc.textContent = `The best ${activeCategory.toLowerCase()} unblocked games.`;
    } else {
        activeViewTitle.textContent = "Featured games";
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

    continuePlayingGrid.innerHTML = recentGames.map(game => `
        <div 
            class="group min-w-[200px] max-w-[240px] bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-all shrink-0"
            onclick="playGame('${game.id}')"
        >
            <div class="aspect-video relative overflow-hidden">
                <img 
                    src="${game.thumbnail}" 
                    alt="${game.title}"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="absolute bottom-2 left-3">
                    <h4 class="font-bold text-xs truncate group-hover:text-brand-primary transition-colors">${game.title}</h4>
                </div>
            </div>
        </div>
    `).join('');
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

    topPicksGrid.innerHTML = topPicks.map(game => `
        <div 
            class="group bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-all"
            onclick="playGame('${game.id}')"
        >
            <div class="aspect-video relative overflow-hidden">
                <img 
                    src="${game.thumbnail}" 
                    alt="${game.title}"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="absolute bottom-2 left-3">
                    <h4 class="font-bold text-xs truncate group-hover:text-brand-primary transition-colors">${game.title}</h4>
                    <p class="text-[10px] text-gray-500 font-mono uppercase tracking-wider">${game.category}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategoryRows() {
    const categories = [...new Set(allGames.map(g => g.category))];
    
    categoryRowsContainer.innerHTML = categories.map(cat => {
        const catGames = allGames.filter(g => g.category === cat);
        return `
            <section>
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold flex items-center gap-2">
                        <div class="w-2 h-6 bg-brand-primary"></div>
                        ${cat}
                    </h3>
                    <button 
                        onclick="goToCategory('${cat}')"
                        class="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors"
                    >
                        See All
                    </button>
                </div>
                <div class="game-grid-row">
                    ${catGames.map(game => `
                        <div 
                            class="group bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-all"
                            onclick="playGame('${game.id}')"
                        >
                            <div class="aspect-video relative overflow-hidden">
                                <img 
                                    src="${game.thumbnail}" 
                                    alt="${game.title}"
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div class="absolute bottom-2 left-3">
                                    <h4 class="font-bold text-xs truncate group-hover:text-brand-primary transition-colors">${game.title}</h4>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }).join('');
}

function goToCategory(cat) {
    currentView = 'home';
    activeCategory = cat;
    searchQuery = '';
    searchInput.value = '';
    updateViewMeta();
    applyFilters();
    renderCategories();
    updateActiveNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goToCategory = goToCategory;

function renderGames() {
    renderRecentSection();
    renderTopPicksSection();

    const isHomeDefault = currentView === 'home' && !activeCategory && !searchQuery;

    if (isHomeDefault && !isGridView) {
        categoryRowsContainer.classList.remove('hidden');
        renderCategoryRows();
    } else {
        categoryRowsContainer.classList.add('hidden');
    }

    heroSection.classList.remove('hidden');
    gameGridEl.classList.remove('hidden');

    const isFeaturedView = currentView === 'home' && !activeCategory && !searchQuery;
    
    // Limits for row view
    let displayGames = filteredGames;
    if (isFeaturedView && !isGridView) {
        displayGames = filteredGames.slice(0, 10);
    }

    // Toggle View All button
    if (isFeaturedView && filteredGames.length > 10) {
        viewAllBtn.classList.remove('hidden');
        viewAllBtn.innerHTML = isGridView ? `
            Minimize
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"></path></svg>
        ` : `
            View All
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
        `;
    } else {
        viewAllBtn.classList.add('hidden');
    }

    // Set Layout Class
    gameGridEl.className = (isFeaturedView && !isGridView) ? 'game-grid-row' : 'game-grid-standard';

    gameGridEl.innerHTML = displayGames.map(game => `
        <div 
            class="group bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer game-card-transition hover:border-brand-primary/50 game-card"
            onclick="playGame('${game.id}')"
        >
            <div class="aspect-video relative overflow-hidden">
                <img 
                    src="${game.thumbnail}" 
                    alt="${game.title}"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-brand-bg to-transparent opacity-60"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="bg-brand-primary p-3 rounded-full text-black shadow-lg shadow-brand-primary/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="m7 4 12 8-12 8V4z"></path></svg>
                    </div>
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
    `).join('');

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
    gameTitle.textContent = game.title;
    gameDescription.textContent = game.description;
    gameCategoryTag.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        ${game.category}
    `;
    externalLink.href = game.iframeUrl;

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
