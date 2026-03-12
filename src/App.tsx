
import React, { useState, useCallback } from 'react';
import { AppProvider, useApp } from './store';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TransactionsList from './components/common/TransactionsList';
import Invoicing from './pages/Invoicing';
import FinancialStatements from './pages/FinancialStatements';
import Reconciliation from './pages/Reconciliation';
import AccountManagement from './pages/AccountManagement';
import PayrollManagement from './pages/PayrollManagement';
import LandingPage from './pages/LandingPage';
import { AccountingEngine } from './services/AccountingEngine';

const Settings: React.FC = () => {
  const { accounts, updateOpeningBalance, transactions } = useApp();
  const trialBalance = AccountingEngine.getTrialBalance(accounts, transactions);

  // Filter for Balance Sheet accounts (Assets & Liabilities) that typically carry opening balances
  const openingBalanceAccounts = accounts.filter(a => a.type === 'Asset' || a.type === 'Liability');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase italic">Opening Balances & Settings</h2>
            <p className="text-slate-500 font-medium text-sm">Configure starting balances for Assets and Liabilities for the current fiscal period.</p>
          </div>
          <div className="px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Accounting Standard</p>
            <p className="text-sm font-black text-slate-900">Double-Entry / Accrual</p>
          </div>
        </div>
        
        <div className="overflow-hidden border border-slate-100 rounded-[32px] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Opening Balance</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Closing (Calculated)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {openingBalanceAccounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-widest">No matching ledger accounts found.</td>
                </tr>
              ) : (
                openingBalanceAccounts.map((acc) => {
                  const closing = trialBalance.find(tb => tb.accountId === acc.id)?.rawNet || 0;
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-10 py-6">
                        <p className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight italic">{acc.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold tracking-widest">{acc.code}</p>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                          acc.type === 'Asset' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center justify-end relative max-w-[180px] ml-auto">
                          <span className="absolute left-4 text-slate-300 font-bold">₹</span>
                          <input 
                            type="number"
                            step="0.01"
                            defaultValue={acc.openingBalance || 0}
                            onBlur={(e) => updateOpeningBalance(acc.id, Number(e.target.value))}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 pl-10 pr-6 text-right font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                          />
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <p className="text-lg font-black text-emerald-600 tabular-nums">
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
        
        <div className="mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-lg">
              Adjusting opening balances will retrospectively update all financial statements. 
              Ensure these match your previous audited financial year end records.
            </p>
          </div>
          <button className="bg-slate-900 text-white px-10 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10">
            Export Chart of Accounts
          </button>
        </div>
      </div>
    </div>
  );
};

const Main: React.FC = () => {
  const { user, login } = useApp();
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Inter']">
        <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden flex max-w-5xl w-full h-[640px] animate-in zoom-in-95 duration-500 border border-slate-100">
          <div className="flex-1 p-16 flex flex-col justify-center">
            <div className="mb-12">
              <button 
                onClick={() => setShowLogin(false)}
                className="mb-8 text-xs font-black text-slate-400 uppercase tracking-widest flex items-center hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Landing
              </button>
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-6 shadow-2xl shadow-indigo-600/30 italic">
                C
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 italic uppercase">Codofin</h1>
              <p className="text-slate-500 font-medium text-sm">Professional bookkeeping & SaaS financials.</p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); login(email); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Email</label>
                <input 
                  type="email" 
                  placeholder="name@codofin.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-transparent rounded-2xl p-5 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 border-transparent rounded-2xl p-5 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-black transition-all transform active:scale-95 uppercase tracking-[0.2em] text-xs"
              >
                Sign Into Codofin
              </button>
            </form>

            <p className="mt-12 text-[10px] text-slate-400 text-center font-black uppercase tracking-widest">
              Secured by Enterprise Protocol <span className="text-indigo-600 ml-1">v2.5</span>
            </p>
          </div>
          <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden p-20 text-white flex-col justify-end border-l border-slate-800">
             <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
             <div className="absolute top-40 -left-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl"></div>
             
             <div className="relative z-10">
                <div className="w-12 h-1 bg-indigo-600 mb-8"></div>
                <h3 className="text-5xl font-black leading-[1.1] mb-6 italic tracking-tighter uppercase">Intelligent Ledger Architecture.</h3>
                <p className="text-slate-400 font-medium leading-relaxed">CODOFIN transforms raw transactions into audit-grade financial intelligence for global service startups.</p>
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
