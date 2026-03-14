
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../store';
import { AccountingEngine } from '../../../services/AccountingEngine';

const Reconciliation: React.FC = () => {
  const { bankEntries, transactions, accounts, company, logout, setBankEntries, updateBankEntry } = useApp();
  const [matchingEntryId, setMatchingEntryId] = useState<string | null>(null);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');

  const trialBalance = AccountingEngine.getTrialBalance(accounts, transactions);
  const ledgerBankBalance = trialBalance.find(b => b.accountId === '1001')?.rawNet || 0;

  const statementBalance = bankEntries.reduce((sum, e) => sum + e.amount, 47500); // 47.5k is opening statement balance
  const unreconciledItems = bankEntries.filter(e => !e.matchedTransactionId).length;
  const discrepancy = statementBalance - ledgerBankBalance;

  const candidateTransactions = transactions.filter(t =>
    t.status === 'Posted' && t.lines.some(l => l.accountId === '1001')
  );

  const handleManualMatch = (txId: string) => {
    if (!matchingEntryId) return;
    setBankEntries(prev => prev.map(e =>
      e.id === matchingEntryId ? { ...e, matchedTransactionId: txId } : e
    ));
    setMatchingEntryId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 lg:pb-10 shadow-sm border border-slate-200/60 dark:border-white/5 transition-colors duration-300">
        <div className="flex flex-col space-y-4 lg:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-slate-400 dark:text-slate-500 truncate max-w-[100px] sm:max-w-none uppercase">{company.name}</span>
              <span className="mx-2 lg:mx-3 text-slate-300 dark:text-slate-700">•</span>
              <span className="text-indigo-600 dark:text-indigo-400 uppercase">Automation Suite</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-2 lg:space-x-3 bg-emerald-50 dark:bg-emerald-500/10 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] lg:text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">Auto-Match</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">Bank Verification</h1>
        </div>
      </div>

      {/* Accuracy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group transition-all">
          <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 italic">Verified Ledger Balance</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">₹{ledgerBankBalance.toLocaleString('en-IN')}</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-100/50 dark:group-hover:bg-indigo-500/20 transition-all"></div>
        </div>
        <div className="bg-slate-900 dark:bg-black p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] shadow-2xl relative overflow-hidden border dark:border-white/5 transition-all">
          <p className="text-[9px] lg:text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mb-3 italic">Statement Final Balance</p>
          <p className="text-2xl lg:text-3xl font-black text-white tracking-tight italic">₹{statementBalance.toLocaleString('en-IN')}</p>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
        </div>
        <div className={`p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border shadow-sm transition-all sm:col-span-2 lg:col-span-1 ${discrepancy === 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'}`}>
          <p className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-3 italic ${discrepancy === 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {discrepancy === 0 ? 'Perfect Reconciliation' : 'Ledger Variance'}
          </p>
          <p className={`text-2xl lg:text-3xl font-black tracking-tight italic ${discrepancy === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            ₹{discrepancy.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="px-6 lg:px-10 py-6 lg:py-8 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[13px] lg:text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white italic">Audit Protocol Workspace</h3>
                <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Cross-referencing Ledger vs External Statement</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                <span className="text-emerald-500 text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center">
                  <span className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-emerald-500 mr-2 shadow-sm"></span>
                  {bankEntries.length - unreconciledItems} Auto-Matched
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center">
                  <span className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-slate-200 dark:bg-slate-700 mr-2"></span>
                  {unreconciledItems} Pending Audit
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {bankEntries.map(entry => {
                const isMatched = !!entry.matchedTransactionId;
                const matchedTx = transactions.find(t => t.id === entry.matchedTransactionId);

                return (
                  <div key={entry.id} className={`p-6 lg:p-10 flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-6 lg:gap-8 group transition-all duration-500 border-b border-slate-50 dark:border-white/5 ${isMatched ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : 'hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:z-10 relative'}`}>
                    <div className="lg:col-span-3 space-y-3 lg:space-y-4">
                      <div className="flex items-center justify-between lg:justify-start lg:space-x-2">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border shadow-sm transition-colors ${isMatched ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5'}`}>
                          {isMatched ? 'Verified Link' : 'External Entry'}
                        </span>
                        {entry.attachedFile && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        <span className="lg:hidden text-[10px] font-black text-slate-400 dark:text-slate-500 font-mono tracking-widest">{entry.date}</span>
                      </div>
                      <div>
                        <h4 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{entry.description}</h4>
                        <div className="flex items-center space-x-2 mt-2">
                          <p className="hidden lg:block text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{entry.date}</p>
                          <span className="hidden lg:block text-slate-200 dark:text-slate-800">•</span>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold tracking-[0.2em]">{entry.reference}</p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      <div className="bg-slate-50/50 dark:bg-white/5 rounded-[1.5rem] lg:rounded-[2rem] p-4 lg:p-6 border border-slate-100/50 dark:border-white/5 relative overflow-hidden group/amount">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 dark:bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover/amount:bg-indigo-50/50 dark:group-hover/amount:bg-indigo-500/10 transition-all"></div>
                        <div className="relative z-10 flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest mb-1">Statement Figure</span>
                          <p className={`text-xl lg:text-2xl font-black tracking-tighter italic ${entry.amount > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {entry.amount > 0 ? '₹' : '-₹'}{Math.abs(entry.amount).toLocaleString('en-IN')}
                          </p>

                          {entry.adjustedAmount !== undefined && (
                            <div className="w-full mt-4 lg:mt-5 pt-4 lg:pt-5 border-t border-slate-200/60 dark:border-white/5 flex flex-col items-end space-y-2 lg:space-y-3 animate-in slide-in-from-right-4 duration-500">
                              <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
                                <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none">Correction applied</span>
                              </div>

                              <div className="bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-3 lg:p-4 rounded-xl lg:rounded-[1.5rem] w-full flex flex-col items-end space-y-2 relative group-hover/amount:bg-white dark:group-hover/amount:bg-slate-900 transition-all shadow-sm">
                                <div className="flex items-center space-x-3 text-right">
                                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Adjusted:</span>
                                  <span className="text-xs lg:text-sm font-black text-slate-900 dark:text-white italic tabular-nums tracking-tight">
                                    {entry.adjustedAmount > 0 ? '₹' : '-₹'}{Math.abs(entry.adjustedAmount).toLocaleString('en-IN')}
                                  </span>
                                </div>

                                {entry.amount - entry.adjustedAmount !== 0 && (
                                  <div className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl flex items-center space-x-2 shadow-sm border ${entry.amount - entry.adjustedAmount > 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'}`}>
                                    <span className="text-[6px] lg:text-[7px] font-black uppercase tracking-widest opacity-80 whitespace-nowrap">Audit Delta:</span>
                                    <span className="text-[9px] lg:text-[10px] font-black tabular-nums italic">
                                      {entry.amount - entry.adjustedAmount > 0 ? '+' : ''}₹{(entry.amount - entry.adjustedAmount).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 flex lg:flex-col items-center justify-center gap-3 lg:space-y-3 lg:gap-0">
                      {editingAmountId === entry.id ? (
                        <div className="flex items-center bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-xl lg:rounded-[1.25rem] p-1 lg:p-1.5 shadow-2xl shadow-indigo-500/20 animate-in zoom-in-95 duration-300 w-full lg:max-w-none">
                          <div className="flex items-center flex-1 px-3">
                            <span className="text-xs font-black text-indigo-400 mr-1">₹</span>
                            <input
                              type="number"
                              className="w-full text-sm font-black text-slate-900 dark:text-white border-none focus:ring-0 bg-transparent p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={tempAmount}
                              onChange={(e) => setTempAmount(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateBankEntry(entry.id, { adjustedAmount: parseFloat(tempAmount) || 0 });
                                  setEditingAmountId(null);
                                }
                                if (e.key === 'Escape') {
                                  setEditingAmountId(null);
                                }
                              }}
                            />
                          </div>
                          <button
                            onClick={() => {
                              updateBankEntry(entry.id, { adjustedAmount: parseFloat(tempAmount) || 0 });
                              setEditingAmountId(null);
                            }}
                            className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl bg-indigo-600 hover:bg-black text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setTempAmount(entry.adjustedAmount?.toString() || entry.amount.toString());
                            setEditingAmountId(entry.id);
                          }}
                          className={`flex-1 lg:f-none w-full py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl flex items-center justify-center space-x-2 border transition-all ${entry.adjustedAmount !== undefined ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:border-indigo-500 hover:text-indigo-600'}`}
                        >
                          <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">{entry.adjustedAmount !== undefined ? 'Adjusted' : 'Amount'}</span>
                        </button>
                      )}

                      <label className={`flex-1 lg:flex-none w-full py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl flex items-center justify-center space-x-2 border cursor-pointer transition-all ${entry.attachedFile ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:border-emerald-500 hover:text-emerald-600'}`}>
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest truncate max-w-[60px] lg:max-w-[80px]">{entry.attachedFile ? entry.attachedFile : 'File'}</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              updateBankEntry(entry.id, { attachedFile: e.target.files[0].name });
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="lg:col-span-4 mt-2 lg:mt-0">
                      {isMatched ? (
                        <div className="bg-slate-900 dark:bg-black p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl relative overflow-hidden group/match animate-in fade-in zoom-in-95 border dark:border-white/5">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover/match:bg-emerald-500/20 transition-all duration-700"></div>
                          <p className="text-[9px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mb-3 italic">Finalized Linkage</p>
                          <h5 className="text-xs lg:text-sm font-black text-white uppercase italic truncate max-w-full leading-relaxed">{matchedTx?.description}</h5>
                          <div className="flex items-center space-x-4 mt-4">
                            <p className="text-[9px] lg:text-[10px] text-slate-500 dark:text-slate-600 font-mono font-bold tracking-[0.2em] uppercase">ID: {matchedTx?.id.slice(0, 8)}</p>
                            <div className="h-3 w-px bg-white/10 dark:bg-white/5"></div>
                            <p className="text-[10px] text-emerald-400 dark:text-emerald-500 font-black uppercase tracking-widest">Verified</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMatchingEntryId(entry.id)}
                          className="w-full py-8 lg:py-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[1.5rem] lg:rounded-[2.5rem] flex flex-col items-center justify-center space-y-3 lg:space-y-4 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group/portal overflow-hidden relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover/portal:from-indigo-500/5 transition-all"></div>
                          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover/portal:bg-indigo-600 group-hover/portal:text-white group-hover/portal:rotate-90 transition-all duration-500 shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                          </div>
                          <div className="text-center relative z-10">
                            <span className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block group-hover/portal:text-indigo-600 dark:group-hover/portal:text-indigo-400 transition-colors">Action Protocol</span>
                            <span className="text-[10px] lg:text-xs font-black text-slate-900 dark:text-white italic uppercase mt-1 block opacity-60 group-hover/portal:opacity-100 transition-opacity">Manual Match Override</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Match Modal */}
      {matchingEntryId && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[1001] p-4 lg:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[40px] shadow-2xl p-8 lg:p-14 max-w-2xl w-full animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border dark:border-white/5">
            <div className="flex justify-between items-start mb-8 shrink-0">
              <div>
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none mb-2">Match Ledger</h3>
                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select bank transaction</p>
              </div>
              <button onClick={() => setMatchingEntryId(null)} className="text-slate-300 dark:text-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-3 no-scrollbar flex-1 min-h-0">
              {candidateTransactions.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[24px]">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No unlinked transactions</p>
                </div>
              ) : (
                candidateTransactions.map(tx => {
                  const bankLine = tx.lines.find(l => l.accountId === '1001');
                  const impact = (bankLine?.debit || 0) - (bankLine?.credit || 0);
                  return (
                    <div key={tx.id} className="p-5 lg:p-6 border border-slate-200 dark:border-white/5 rounded-[20px] lg:rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-white/5 transition-colors group gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic leading-tight">{tx.description}</p>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{tx.date} • {tx.reference}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:space-x-6">
                        <p className={`text-base lg:text-lg font-black italic tracking-tighter ${impact > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {impact > 0 ? '+' : ''}₹{Math.abs(impact).toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => handleManualMatch(tx.id)}
                          className="bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white px-5 lg:px-6 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 active:scale-95"
                        >
                          Link
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Reconciliation;
