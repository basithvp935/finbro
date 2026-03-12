
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { AccountType, Account, NormalBalance, StatementType } from '../types';
import { AccountingEngine } from '../services/AccountingEngine';
import CustomDatePicker from '../components/common/CustomDatePicker';

const AccountManagement: React.FC = () => {
  const { accounts, company, logout, transactions, startDate, endDate, setStartDate, setEndDate, addAccount } = useApp();
  const [activeFilter, setActiveFilter] = useState<'ALL' | AccountType | 'REVENUE'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Account State
  const [newAcc, setNewAcc] = useState({
    name: '',
    code: '',
    type: 'Expense' as AccountType,
    openingBalance: 0
  });

  const trialBalance = useMemo(() =>
    AccountingEngine.getTrialBalance(accounts, transactions, { startDate, endDate }),
    [accounts, transactions, startDate, endDate]);

  const filters: { label: string; value: 'ALL' | AccountType | 'REVENUE' }[] = [
    { label: 'ALL', value: 'ALL' },
    { label: 'ASSET', value: 'Asset' },
    { label: 'LIABILITY', value: 'Liability' },
    { label: 'EQUITY', value: 'Equity' },
    { label: 'REVENUE', value: 'Income' },
    { label: 'EXPENSE', value: 'Expense' },
  ];

  const filteredAccounts = [...trialBalance.filter(acc => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'REVENUE') return acc.accountType === 'Income';
    return acc.accountType === activeFilter;
  })].sort((a, b) => {
    const codeA = parseInt(a.accountId.replace(/\D/g, ''), 10) || 0;
    const codeB = parseInt(b.accountId.replace(/\D/g, ''), 10) || 0;
    return codeA - codeB;
  });

  const getTypeColor = (type: AccountType) => {
    switch (type) {
      case 'Asset': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Liability': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Equity': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Income': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Expense': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.name || !newAcc.code) return alert("All fields are required.");

    // Determine Normal Balance and Target Statement based on Type
    let normalBalance: NormalBalance = 'Debit';
    let targetStatement: StatementType = 'Balance Sheet';

    if (newAcc.type === 'Liability' || newAcc.type === 'Equity' || newAcc.type === 'Income') {
      normalBalance = 'Credit';
    }
    if (newAcc.type === 'Income' || newAcc.type === 'Expense') {
      targetStatement = 'Income Statement';
    }

    const createdAccount: Account = {
      id: `acc-${Date.now()}`,
      code: newAcc.code,
      name: newAcc.name.toUpperCase(),
      type: newAcc.type,
      normalBalance,
      targetStatement,
      openingBalance: newAcc.openingBalance
    };

    addAccount(createdAccount);
    setShowAddModal(false);
    setNewAcc({ name: '', code: '', type: 'Expense', openingBalance: 0 });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="bg-white rounded-[32px] p-8 pb-10 shadow-sm border border-slate-200/60">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-slate-400 uppercase">{company.name}</span>
              <span className="mx-3 text-slate-300">•</span>
              <span className="text-indigo-600 uppercase">Chart of Accounts</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 bg-slate-50 px-6 py-2.5 rounded-xl transition-all border border-slate-100"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Ledger Map</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center space-x-3 active:scale-95"
            >
              <span className="text-xl leading-none">+</span>
              <span>Architect New Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Date Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1 pb-2">
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.value)}
              className={`whitespace-nowrap px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${(activeFilter === filter.value || (activeFilter === 'Income' && filter.value === 'Income'))
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Premium Custom Date Filters */}
        <div className="flex items-center space-x-2 shrink-0">
          <CustomDatePicker
            label="From"
            value={startDate}
            onChange={setStartDate}
          />
          <span className="text-slate-300 font-bold px-1">—</span>
          <CustomDatePicker
            label="To"
            value={endDate}
            onChange={setEndDate}
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-widest italic">No accounts found in this category.</td>
              </tr>
            ) : (
              filteredAccounts.map((acc) => (
                <tr key={acc.accountId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6 text-sm font-mono font-bold text-slate-400 italic">
                    #{acc.accountId}
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase italic">
                        {acc.accountName}
                      </span>
                      <span className={`w-fit mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getTypeColor(acc.accountType)}`}>
                        {acc.accountType}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right tabular-nums text-xs font-black text-emerald-600 bg-emerald-50/30">
                    {acc.debit > 0 ? `₹${acc.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-10 py-6 text-right tabular-nums text-xs font-black text-rose-600 bg-rose-50/30">
                    {acc.credit > 0 ? `₹${acc.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      ₹{acc.rawNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Ledger Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[110] p-6">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 lg:p-14 max-w-xl w-full animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none mb-2">Architect Ledger</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manually extend the chart of accounts</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 5022"
                    required
                    value={newAcc.code}
                    onChange={e => setNewAcc({ ...newAcc, code: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Type</label>
                  <select
                    value={newAcc.type}
                    onChange={e => setNewAcc({ ...newAcc, type: e.target.value as AccountType })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. CODO OFFICE RENT"
                  required
                  value={newAcc.name}
                  onChange={e => setNewAcc({ ...newAcc, name: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAcc.openingBalance || ''}
                  onChange={e => setNewAcc({ ...newAcc, openingBalance: Number(e.target.value) })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all text-right"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Inferred Balance</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${(newAcc.type === 'Asset' || newAcc.type === 'Expense') ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {(newAcc.type === 'Asset' || newAcc.type === 'Expense') ? 'Normal Debit' : 'Normal Credit'}
                  </span>
                </div>
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-12 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95"
                >
                  Commit Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
