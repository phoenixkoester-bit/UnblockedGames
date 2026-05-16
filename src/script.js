// Core state
let allGames = [];
let filteredGames = [];
let activeCategory = null;
let searchQuery = '';

// DOM Elements
const lobbyEl = document.getElementById('lobby');
const playerEl = document.getElementById('player');
const gameGridEl = document.getElementById('game-grid');
const categoriesEl = document.getElementById('categories');
const searchInput = document.getElementById('search-input');
const noResultsEl = document.getElementById('no-results');
const backButton = document.getElementById('back-button');
const logo = document.getElementById('logo');

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
        filteredGames = [...allGames];
        
        renderCategories();
        renderGames();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to load games:', error);
    }
}

function renderCategories() {
    const categories = ['All Games', ...new Set(allGames.map(g => g.category))];
    
    categoriesEl.innerHTML = categories.map(cat => {
        const isAll = cat === 'All Games';
        const isActive = activeCategory === cat || (isAll && activeCategory === null);
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

    // Add click listeners to buttons
    categoriesEl.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.category || null;
            applyFilters();
            renderCategories();
        });
    });
}

function renderGames() {
    gameGridEl.innerHTML = filteredGames.map(game => `
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
    filteredGames = allGames.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            game.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !activeCategory || game.category === activeCategory;
        return matchesSearch && matchesCategory;
    });
    renderGames();
}

function playGame(id) {
    const game = allGames.find(g => g.id === id);
    if (!game) return;

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

function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyFilters();
    });

    backButton.addEventListener('click', () => {
        playerEl.classList.add('hidden');
        lobbyEl.classList.remove('hidden');
        gameIframe.src = ''; // Stop game when leaving
    });

    logo.addEventListener('click', () => {
        playerEl.classList.add('hidden');
        lobbyEl.classList.remove('hidden');
        gameIframe.src = '';
        searchQuery = '';
        activeCategory = null;
        searchInput.value = '';
        renderCategories();
        applyFilters();
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
