import { useState, useMemo } from 'react';
import { Search, Gamepad2, Play, ArrowLeft, Maximize2, ExternalLink, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './data/games.json';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = useMemo(() => {
    const cats = gamesData.map(g => g.category);
    return Array.from(new Set(cats));
  }, []);

  const filteredGames = useMemo(() => {
    return gamesData.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || game.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleBack = () => {
    setActiveGame(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-brand-border bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              setActiveGame(null);
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          >
            <div className="bg-brand-primary/10 p-2 rounded-lg border border-brand-primary/20 group-hover:border-brand-primary transition-colors">
              <Gamepad2 className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="font-mono font-bold text-xl tracking-tighter glow-text">NEXUS<span className="text-brand-primary">GAMES</span></span>
          </div>

          {!activeGame && (
            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search catalog..."
                className="w-full bg-brand-card border border-brand-border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-brand-primary/50 text-sm transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <button className="text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-colors">
              About
            </button>
            <button className="text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-colors">
              Submit
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-all whitespace-nowrap ${
                    !selectedCategory 
                      ? 'bg-brand-primary text-black border-brand-primary scale-105' 
                      : 'border-brand-border text-gray-400 hover:border-gray-600'
                  }`}
                >
                  All Games
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-all whitespace-nowrap ${
                      selectedCategory === cat 
                        ? 'bg-brand-primary text-black border-brand-primary scale-105' 
                        : 'border-brand-border text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredGames.map((game) => (
                  <motion.div
                    key={game.id}
                    layoutId={`game-${game.id}`}
                    whileHover={{ y: -4 }}
                    className="group bg-brand-card border border-brand-border rounded-xl overflow-hidden cursor-pointer game-card-transition hover:border-brand-primary/50"
                    onClick={() => setActiveGame(game)}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={game.thumbnail} 
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-bg to-transparent opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-brand-primary p-3 rounded-full text-black shadow-lg shadow-brand-primary/20">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-brand-border">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg group-hover:text-brand-primary transition-colors">{game.title}</h3>
                        <span className="text-[10px] font-mono uppercase text-brand-primary border border-brand-primary/30 px-1.5 rounded">
                          {game.category}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{game.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredGames.length === 0 && (
                <div className="py-20 text-center">
                  <div className="bg-brand-card/50 border border-dashed border-brand-border rounded-2xl p-12 max-w-sm mx-auto">
                    <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No results found</h3>
                    <p className="text-gray-500">Try searching for something else or browse another category.</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="player"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleBack}
                  className="flex items-center gap-2 group text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-mono uppercase tracking-widest text-xs">Return to Lobby</span>
                </button>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 border border-brand-border rounded-lg hover:bg-brand-card transition-colors text-gray-400 hover:text-white">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <a 
                    href={activeGame.iframeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-brand-border rounded-lg hover:bg-brand-card transition-colors text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="iframe-container shadow-2xl shadow-brand-primary/5">
                <iframe 
                  src={activeGame.iframeUrl} 
                  title={activeGame.title}
                  allowFullScreen
                  loading="lazy"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-8 py-4 border-t border-brand-border">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2 border-l-4 border-brand-primary pl-4">{activeGame.title}</h1>
                  <div className="flex items-center gap-2 mb-4 pl-4 text-sm font-mono uppercase text-brand-primary opacity-80">
                    <Filter className="w-3 h-3" />
                    {activeGame.category}
                  </div>
                  <p className="text-gray-400 leading-relaxed max-w-3xl pl-4">
                    {activeGame.description}
                  </p>
                </div>
                
                <div className="md:w-64 space-y-4">
                  <div className="bg-brand-card border border-brand-border rounded-xl p-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3 border-b border-brand-border pb-2">Controls</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Movement</span>
                        <span className="font-mono text-brand-primary">WASD / Keys</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Interaction</span>
                        <span className="font-mono text-brand-primary">SPACE</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Pause</span>
                        <span className="font-mono text-brand-primary">ESC</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-brand-border py-8 mt-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-mono font-bold tracking-tighter glow-text text-sm uppercase">NEXUS<span className="text-brand-primary">GAMES</span></span>
            <p className="text-gray-600 text-xs text-center md:text-left">Unblocked education-friendly game portal. &copy; 2026</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Privacy</a>
            <a href="#" className="text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Terms</a>
            <a href="#" className="text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
