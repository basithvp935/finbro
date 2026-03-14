
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../store';
import logo from '../components/@logo2.webp';
import GlobalSearch from '../features/search/components/GlobalSearch';
import { GeminiService, SearchResult } from '../services/GeminiService';

interface NavItem {
  label: string;
  icon: string;
  id: string;
}

interface LayoutProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  canGoBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, canGoBack, onBack, children }) => {
  const store = useApp();
  const { user, company, logout, theme, toggleTheme } = store;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '📝' },
    { id: 'accounts', label: 'Accounts', icon: '📂' },
    { id: 'reconciliation', label: 'Reconciliation', icon: '⚖️' },
    { id: 'invoices', label: 'Invoicing', icon: '📄' },
    { id: 'payroll', label: 'Payroll', icon: '💳' },
    { id: 'statements', label: 'Financials', icon: '📈' },
    { id: 'create_file', label: 'Codo Storage', icon: '📁' },
    { id: 'settings', label: 'CoA & Settings', icon: '⚙️' },
  ];

  const handleTabClick = (id: string) => {
    onTabChange(id);
    setIsSidebarOpen(false);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
    setIsSearching(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await GeminiService.search(query, store);
      setSearchResults(results);
      setIsSearching(false);
    }, 800);
  }, [store]);

  const handleSearchResultSelect = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (result.tab) {
      onTabChange(result.tab);
    }
  };

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative border-l-4 border-slate-900 dark:border-indigo-600 transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[60] lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop and Mobile (Responsive) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="Codofin Logo" className="h-10 w-auto object-contain" />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2">
            ✕
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center space-x-3 px-3 py-4 bg-white/5 rounded-2xl mb-3 border border-white/5">
            <div className={`w-10 h-10 rounded-full ${activeTab === 'dashboard' ? 'bg-indigo-500' : 'bg-indigo-600'} flex items-center justify-center font-black text-slate-900 flex-shrink-0 italic`}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white truncate uppercase italic">{user.name}</p>
              <p className="text-[9px] text-indigo-400 truncate uppercase font-bold tracking-widest">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full text-center px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors"
          >
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between px-6 lg:px-10 z-10 shrink-0 transition-colors duration-300">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            
            {canGoBack && onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
                title="Go Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <div className="flex flex-col min-w-0">
               <h2 className="text-[10px] lg:text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] italic leading-none mb-1 truncate">
                 Codofin OS
               </h2>
                <h3 className="text-xs lg:text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none truncate">
                  {menuItems.find(m => m.id === activeTab)?.label}
                </h3>
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-8">
            <div className="relative group/search" ref={searchContainerRef}>
              <div className="flex items-center">
                <div className={`absolute left-4 transition-all duration-500 ${isSearching ? 'rotate-180 text-indigo-500' : 'text-slate-400 group-focus-within/search:text-indigo-500'}`}>
                    {isSearching ? '⭐' : '🔍'}
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Registry Intelligence Scan..." 
                  className="bg-white/40 dark:bg-white/5 backdrop-blur-md border-2 border-slate-200/30 dark:border-white/10 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-[12px] focus:ring-indigo-500/10 rounded-2xl pl-11 pr-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-500 w-24 sm:w-48 lg:w-72 xl:w-[480px] outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm focus:shadow-[0_0_40px_-10px_rgba(79,70,229,0.3)]"
                />
              </div>
              <GlobalSearch 
                isOpen={isSearchOpen}
                onClose={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                query={searchQuery}
                results={searchResults}
                isLoading={isSearching}
                onSelect={handleSearchResultSelect}
              />
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2 lg:p-3 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl lg:rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:border-indigo-500 shadow-sm active:scale-95 group"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm lg:text-base group-hover:rotate-12 transition-transform">🌙</span>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Dark Mode</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-white">
                  <span className="text-sm lg:text-base group-hover:rotate-12 transition-transform">☀️</span>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Light Mode</span>
                </div>
              )}
            </button>

            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <div className="flex items-center space-x-2 lg:space-x-3">
                 <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Net Live</span>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-12 custom-scrollbar bg-slate-50/30 dark:bg-black/20">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout;
