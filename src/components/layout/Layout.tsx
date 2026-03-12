
import React, { useState } from 'react';
import { useApp } from '../../store';

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
  const { user, company, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '📝' },
    { id: 'accounts', label: 'Accounts', icon: '📂' },
    { id: 'reconciliation', label: 'Reconciliation', icon: '⚖️' },
    { id: 'invoices', label: 'Invoicing', icon: '📄' },
    { id: 'payroll', label: 'Payroll', icon: '💳' },
    { id: 'statements', label: 'Financials', icon: '📈' },
    { id: 'settings', label: 'CoA & Settings', icon: '⚙️' },
  ];

  const handleTabClick = (id: string) => {
    onTabChange(id);
    setIsSidebarOpen(false);
  };

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative border-l-4 border-slate-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-indigo-500/20 font-black text-xl italic">
              C
            </div>
            <h1 className="text-white font-black text-2xl tracking-tighter uppercase italic">Codofin</h1>
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
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-slate-900 flex-shrink-0 italic">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white truncate uppercase italic">{user.name}</p>
              <p className="text-[9px] text-indigo-400 truncate uppercase font-bold tracking-widest">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full text-center px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-400 transition-colors"
          >
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-10 z-10 shrink-0">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 lg:hidden text-slate-400 hover:text-slate-900 transition-all"
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
            <div className="flex flex-col">
               <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] italic leading-none mb-1">
                 Codofin OS
               </h2>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
                 {menuItems.find(m => m.id === activeTab)?.label}
               </h3>
            </div>
          </div>
          <div className="flex items-center space-x-4 lg:space-x-8">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Global Search Protocol..." 
                className="bg-slate-100/50 border-slate-200/50 focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all w-64 xl:w-80 outline-none"
              />
            </div>
            <div className="flex items-center space-x-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Live</span>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar bg-slate-50/30">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout;
