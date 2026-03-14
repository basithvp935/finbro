
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../store';
import { AccountType, Account, NormalBalance, StatementType } from '../../../types';
import { AccountingEngine } from '../../../services/AccountingEngine';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import PremiumDropdown from '../../../components/ui/PremiumDropdown';

const AccountManagement: React.FC = () => {
  const { accounts, company, logout, transactions, startDate, endDate, setStartDate, setEndDate, addAccount, updateAccount, deleteAccount } = useApp();
  const [activeFilter, setActiveFilter] = useState<'ALL' | AccountType | 'REVENUE'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showActionPopup, setShowActionPopup] = useState<string | null>(null);

  // New Account State
  const [newAcc, setNewAcc] = useState({
    name: '',
    code: '',
    type: 'Expense' as AccountType,
    openingBalance: 0
  });

  const handleOpenEdit = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (acc) {
      setNewAcc({
        name: acc.name,
        code: acc.code,
        type: acc.type,
        openingBalance: acc.openingBalance || 0
      });
      setEditingAccountId(accId);
      setShowAddModal(true);
      setShowActionPopup(null);
    }
  };

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

    if (editingAccountId) {
      updateAccount(editingAccountId, {
        code: newAcc.code,
        name: newAcc.name.toUpperCase(),
        type: newAcc.type,
        normalBalance,
        targetStatement,
        openingBalance: newAcc.openingBalance
      });
    } else {
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
    }

    setShowAddModal(false);
    setEditingAccountId(null);
    setNewAcc({ name: '', code: '', type: 'Expense', openingBalance: 0 });
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    setShowDeleteConfirm(null);
    setShowActionPopup(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 lg:pb-10 shadow-sm border border-slate-200/60 transition-colors duration-300">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-slate-400 truncate max-w-[150px] sm:max-w-none uppercase">{company.name}</span>
              <span className="mx-2 lg:mx-3 text-slate-300">•</span>
              <span className="text-indigo-600 uppercase">Chart of Accounts</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Ledger Map</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 lg:px-10 py-3.5 lg:py-4 rounded-xl lg:rounded-[20px] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center space-x-3 active:scale-95 w-full md:w-auto"
            >
              <span className="text-xl leading-none">+</span>
              <span>Architect New Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Date Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 lg:gap-6 px-1 pb-2">
        <div className="flex items-center space-x-2 lg:space-x-3 overflow-x-auto no-scrollbar py-1 w-full xl:w-fit">
          {filters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.value)}
              className={`whitespace-nowrap flex-1 sm:flex-none px-5 lg:px-8 py-2.5 lg:py-3 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest border transition-all ${(activeFilter === filter.value || (activeFilter === 'Income' && filter.value === 'Income'))
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Premium Custom Date Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-4 shrink-0 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 w-full lg:w-fit">
          <CustomDatePicker
            label="F"
            value={startDate}
            onChange={setStartDate}
          />
          <span className="text-slate-300 font-bold hidden sm:inline">—</span>
          <CustomDatePicker
            label="T"
            value={endDate}
            onChange={setEndDate}
          />
        </div>
      </div>

      {/* Accounts Table - Desktop Only */}
      <div className="hidden lg:block bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Code</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-40">Debit</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-40">Credit</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-44">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-widest italic">No accounts found in this category.</td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr 
                    key={acc.accountId} 
                    onClick={() => setShowActionPopup(showActionPopup === acc.accountId ? null : acc.accountId)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer relative"
                  >
                    <td className="px-10 py-6 text-sm font-mono font-bold text-slate-400 italic">
                      #{acc.accountId}
                    </td>
                    <td className="px-10 py-6 relative">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase italic">
                          {acc.accountName}
                        </span>
                        <span className={`w-fit mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getTypeColor(acc.accountType)}`}>
                          {acc.accountType}
                        </span>
                      </div>

                      {/* Floating Action Menu */}
                      {showActionPopup === acc.accountId && (
                        <div className="absolute left-1/2 -top-4 -translate-x-1/2 -translate-y-full z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="relative">
                            <div className="bg-indigo-950/95 backdrop-blur-xl rounded-[24px] shadow-2xl p-1.5 flex items-center gap-1 border border-white/10 ring-1 ring-black/20">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(acc.accountId); }}
                                className="px-4 py-2.5 hover:bg-white/10 rounded-xl flex items-center gap-3 transition-all group/btn active:scale-95"
                              >
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover/btn:bg-indigo-500 transition-colors">
                                  <svg className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Edit</span>
                              </button>
                              
                              <div className="w-[1px] h-6 bg-white/10 mx-0.5"></div>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(acc.accountId); setShowActionPopup(null); }}
                                className="px-4 py-2.5 hover:bg-rose-500/20 rounded-xl flex items-center gap-3 transition-all group/del active:scale-95"
                              >
                                <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover/del:bg-rose-500 transition-colors">
                                  <svg className="w-3.5 h-3.5 text-rose-500 group-hover/del:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </div>
                                <span className="text-[9px] font-black text-rose-400 group-hover/del:text-rose-500 uppercase tracking-[0.2em]">Remove</span>
                              </button>
                            </div>
                            <div className="w-3 h-3 bg-indigo-950/95 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-white/10 z-[-1]"></div>
                          </div>
                        </div>
                      )}
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
      </div>

      {/* Card View - Mobile Only */}
      <div className="lg:hidden space-y-4">
        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-slate-200/60 shadow-sm">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No accounts mapping in this scope.</p>
          </div>
        ) : (
          filteredAccounts.map((acc) => (
            <div 
              key={acc.accountId}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60 transition-all active:bg-slate-50"
              onClick={() => setShowActionPopup(showActionPopup === acc.accountId ? null : acc.accountId)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 italic">#{acc.accountId}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getTypeColor(acc.accountType)}`}>
                  {acc.accountType}
                </span>
              </div>

              <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight mb-4">{acc.accountName}</h4>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                  <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Debit Flow</p>
                  <p className="text-[11px] font-black text-emerald-600 tabular-nums">
                    ₹{acc.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/50">
                  <p className="text-[8px] font-black text-rose-600/60 uppercase tracking-widest mb-1">Credit Flow</p>
                  <p className="text-[11px] font-black text-rose-600 tabular-nums">
                    ₹{acc.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Position</span>
                <span className="text-sm font-black text-slate-900 italic">
                  ₹{acc.rawNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Mobile Action Bar */}
              {showActionPopup === acc.accountId && (
                <div className="mt-4 flex animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-slate-900 rounded-2xl p-1.5 flex items-center gap-1 w-full border border-slate-800">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(acc.accountId); }}
                      className="flex-1 py-3 hover:bg-white/5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Edit</span>
                    </button>
                    <div className="w-[1px] h-6 bg-white/10"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(acc.accountId); setShowActionPopup(null); }}
                      className="flex-1 py-3 hover:bg-rose-500/20 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Manual Ledger Creation Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4 lg:p-6">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl p-8 lg:p-14 max-w-xl w-full animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start mb-8 lg:mb-12">
              <div>
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none mb-2">
                  {editingAccountId ? 'Edit Ledger' : 'Architect Ledger'}
                </h3>
                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {editingAccountId ? 'Update existing ledger details' : 'Manually extend the chart of accounts'}
                </p>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingAccountId(null); setNewAcc({ name: '', code: '', type: 'Expense', openingBalance: 0 }); }} className="text-slate-300 hover:text-slate-900 transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 5022"
                    required
                    value={newAcc.code}
                    onChange={e => setNewAcc({ ...newAcc, code: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 lg:p-5 text-sm lg:text-base font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Type</label>
                  <PremiumDropdown
                    value={newAcc.type}
                    onChange={(val) => setNewAcc({ ...newAcc, type: val as AccountType })}
                    options={[
                      { value: 'Asset', label: 'Asset' },
                      { value: 'Liability', label: 'Liability' },
                      { value: 'Equity', label: 'Equity' },
                      { value: 'Income', label: 'Income' },
                      { value: 'Expense', label: 'Expense' },
                    ]}
                  />
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

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Inferred Balance</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${(newAcc.type === 'Asset' || newAcc.type === 'Expense') ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {(newAcc.type === 'Asset' || newAcc.type === 'Expense') ? 'Normal Debit' : 'Normal Credit'}
                  </span>
                </div>
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-10 lg:px-12 py-4 lg:py-5 rounded-[20px] lg:rounded-[24px] text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 w-full sm:w-auto"
                >
                  {editingAccountId ? 'Update Protocol' : 'Commit Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Deletion Confirmation Modal - Redesigned for Beauty */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 lg:p-14 max-w-md w-full animate-in zoom-in-95 duration-500 border border-white/20 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="mb-10 text-center relative z-10">
              <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-rose-200/50">
                <div className="w-16 h-16 bg-rose-500 rounded-[24px] flex items-center justify-center shadow-2xl shadow-rose-500/40 animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 leading-none">Security Protocol</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto">
                Are you sure you want to delete this ledger? This action is <span className="text-rose-500 italic">irreversible</span> and will archive all associated data.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-5 relative z-10">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="py-5 rounded-[20px] bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all border border-slate-100 hover:text-slate-600 active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="py-5 rounded-[20px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AccountManagement;
