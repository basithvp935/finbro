
import React, { useState, useCallback } from 'react';
import { AppProvider, useApp } from './store';
import Layout from './layouts/MainLayout';
import logo from './components/@logo2.webp';
import Dashboard from './features/dashboard/components/Dashboard';
import TransactionsList from './features/transactions/components/TransactionsList';
import Invoicing from './features/invoicing/components/Invoicing';
import FinancialStatements from './features/statements/components/FinancialStatements';
import Reconciliation from './features/reconciliation/components/Reconciliation';
import AccountManagement from './features/accounts/components/AccountManagement';
import PayrollManagement from './features/payroll/components/PayrollManagement';
import FileManagement from './features/files/components/FileManagement';
import LandingPage from './features/landing/components/LandingPage';
import { AccountingEngine } from './services/AccountingEngine';

const Settings: React.FC = () => {
  const { accounts, updateOpeningBalance, transactions, theme, toggleTheme } = useApp();
  const trialBalance = AccountingEngine.getTrialBalance(accounts, transactions);

  const handleExportCOA = () => {
    const headers = ['ID', 'Code', 'Name', 'Type', 'Normal Balance', 'Statement', 'Opening Balance'];
    const rows = accounts.map(acc => [
      acc.id,
      acc.code,
      acc.name,
      acc.type,
      acc.normalBalance,
      acc.targetStatement,
      acc.openingBalance
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CODOFIN_Chart_of_Accounts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter for Balance Sheet accounts (Assets & Liabilities) that typically carry opening balances
  const openingBalanceAccounts = accounts.filter(a => a.type === 'Asset' || a.type === 'Liability');

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-slate-200 dark:border-white/5 shadow-xl transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 lg:gap-8 mb-8 lg:mb-12">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase italic">Environment</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs lg:text-sm leading-relaxed">Theme controls are located globally in the application header for quick access from any page.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 pt-6 lg:pt-8 border-t border-slate-50 dark:border-white/5 gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase italic">Opening Balances</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs lg:text-sm">Configure starting balances for Assets and Liabilities.</p>
          </div>
          <div className="px-4 lg:px-6 py-2.5 lg:py-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl lg:rounded-2xl border border-emerald-100 dark:border-emerald-500/20 w-fit">
            <p className="text-[8px] lg:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Accounting Standard</p>
            <p className="text-xs lg:text-sm font-black text-slate-900 dark:text-white">Double-Entry / Accrual</p>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar border border-slate-100 dark:border-white/5 rounded-[24px] lg:rounded-[32px] shadow-sm">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Opening Balance</th>
                <th className="px-6 lg:px-10 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {openingBalanceAccounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">No matching registry entries found.</td>
                </tr>
              ) : (
                openingBalanceAccounts.map((acc) => {
                  const closing = trialBalance.find(tb => tb.accountId === acc.id)?.rawNet || 0;
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group">
                      <td className="px-6 lg:px-10 py-4 lg:py-6">
                        <p className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase tracking-tight italic text-sm">{acc.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono font-bold tracking-widest">{acc.code}</p>
                      </td>
                      <td className="px-6 lg:px-10 py-4 lg:py-6">
                        <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg border ${
                          acc.type === 'Asset' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20'
                        }`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-6 lg:px-10 py-4 lg:py-6">
                        <div className="flex items-center justify-end relative min-w-[120px] lg:min-w-[180px] ml-auto">
                          <span className="absolute left-4 text-slate-300 dark:text-slate-600 font-bold text-xs">₹</span>
                          <input 
                            key={`ob-${acc.id}`}
                            type="number"
                            step="0.01"
                            defaultValue={acc.openingBalance || 0}
                            onBlur={(e) => updateOpeningBalance(acc.id, Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-10 pr-4 lg:pr-6 text-right font-black text-slate-900 dark:text-white group-hover:bg-white dark:group-hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 transition-all text-xs lg:text-base outline-none shrink-0"
                          />
                        </div>
                      </td>
                      <td className="px-6 lg:px-10 py-4 lg:py-6 text-right">
                        <p className="text-base lg:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums break-all leading-tight">
                          ₹{closing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 lg:mt-12 p-6 lg:p-8 bg-slate-50 dark:bg-white/5 rounded-[28px] lg:rounded-[32px] border border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="shrink-0 w-10 h-10 lg:w-12 lg:h-12 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-sm flex items-center justify-center text-emerald-500">
               <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg">
              Adjusting opening balances updates financial history. 
              Ensure data integrity matches certified records.
            </p>
          </div>
          <button 
            onClick={handleExportCOA}
            className="w-full md:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 lg:px-10 py-4 rounded-xl lg:rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-slate-200 transition-all shadow-xl active:scale-95"
          >
            Export Ledger Map
          </button>
        </div>
      </div>
    </div>
  );
};

const Main: React.FC = () => {
  const { user, login, theme, toggleTheme } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [tabHistory, setTabHistory] = useState<string[]>(['dashboard']);
  const [email, setEmail] = useState('');

  const activeTab = tabHistory[tabHistory.length - 1];

  const handleTabChange = useCallback((id: string) => {
    if (id !== activeTab) {
      setTabHistory(prev => [...prev, id]);
    }
  }, [activeTab]);

  const handleBack = useCallback(() => {
    if (tabHistory.length > 1) {
      setTabHistory(prev => prev.slice(0, -1));
    }
  }, [tabHistory]);

  if (!user) {
    if (!showLogin) {
      return (
        <LandingPage 
          onGetStarted={() => setShowLogin(true)} 
          onSignIn={() => setShowLogin(true)} 
        />
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 lg:p-6 font-['Inter'] transition-colors duration-500">
        <div className="absolute top-6 lg:top-10 right-6 lg:right-10">
          <button 
            onClick={toggleTheme}
            className="p-3.5 lg:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl lg:rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xl shadow-slate-900/5 active:scale-95 group"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[48px] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-w-5xl w-full lg:h-[640px] animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-white/5">
          <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center">
            <div className="mb-8 lg:mb-12">
              <button 
                onClick={() => setShowLogin(false)}
                className="mb-6 lg:mb-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-2 decoration-transparent hover:decoration-indigo-600 w-fit"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Registry
              </button>
              <div className="mb-4 lg:mb-6">
                <img src={logo} alt="Codofin Logo" className="h-12 lg:h-16 w-auto object-contain" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs lg:text-sm">Professional bookkeeping & SaaS financials.</p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); login(email); }} className="space-y-4 lg:space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Email</label>
                <input 
                  type="email" 
                  placeholder="name@codofin.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border-transparent rounded-xl lg:rounded-2xl p-4 lg:p-5 font-bold focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 dark:bg-white/5 border-transparent rounded-xl lg:rounded-2xl p-4 lg:p-5 font-bold focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-4 lg:py-5 rounded-xl lg:rounded-2xl shadow-xl hover:bg-black dark:hover:bg-indigo-700 transition-all transform active:scale-95 uppercase tracking-[0.2em] text-[10px] lg:text-xs"
              >
                Sign Into Ledger
              </button>
            </form>

            <p className="mt-8 lg:mt-12 text-[9px] lg:text-[10px] text-slate-400 text-center font-black uppercase tracking-widest">
              Secured by Enterprise Protocol <span className="text-indigo-600 dark:text-indigo-400 ml-1">v2.5</span>
            </p>
          </div>
          <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden p-12 xl:p-20 text-white flex-col justify-end border-l border-slate-800">
             <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full"></div>
             <div className="absolute top-40 -left-20 w-60 h-60 bg-indigo-500/5 rounded-full"></div>
             
             <div className="relative z-10">
                <div className="w-12 h-1 bg-indigo-600 mb-8"></div>
                <h3 className="text-4xl xl:text-5xl font-black leading-[1.1] mb-6 italic tracking-tighter uppercase">Intelligent Ledger Architecture.</h3>
                <p className="text-slate-400 font-medium leading-relaxed text-sm xl:text-base">CODOFIN transforms raw transactions into audit-grade financial intelligence for global service startups.</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      canGoBack={tabHistory.length > 1}
      onBack={handleBack}
    >
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'transactions' && <TransactionsList />}
      {activeTab === 'accounts' && <AccountManagement />}
      {activeTab === 'reconciliation' && <Reconciliation />}
      {activeTab === 'invoices' && <Invoicing />}
      {activeTab === 'payroll' && <PayrollManagement />}
      {activeTab === 'statements' && <FinancialStatements />}
      {activeTab === 'create_file' && <FileManagement />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
};

export default App;
