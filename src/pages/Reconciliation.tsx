
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { AccountingEngine } from '../services/AccountingEngine';

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
      <div className="bg-white rounded-[32px] p-8 pb-10 shadow-sm border border-slate-200/60">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-slate-400 uppercase">{company.name}</span>
              <span className="mx-3 text-slate-300">•</span>
              <span className="text-indigo-600 uppercase">Automation Suite</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Auto-Match Active</span>
              </div>
              <button onClick={logout} className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-6 py-2.5 rounded-xl border border-slate-100">Sign Out</button>
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Bank Verification</h1>
        </div>
      </div>

      {/* Accuracy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Verified Ledger Balance</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight italic">₹{ledgerBankBalance.toLocaleString('en-IN')}</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-100/50 transition-all"></div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic">Statement Final Balance</p>
          <p className="text-3xl font-black text-white tracking-tight italic">₹{statementBalance.toLocaleString('en-IN')}</p>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
        </div>
        <div className={`p-8 rounded-[40px] border shadow-sm transition-all ${discrepancy === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-3 italic ${discrepancy === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {discrepancy === 0 ? 'Perfect Reconciliation' : 'Ledger Variance'}
          </p>
          <p className={`text-3xl font-black tracking-tight italic ${discrepancy === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{discrepancy.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">Audit Protocol Workspace</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-referencing Ledger vs External Statement</p>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-sm"></span>
                  {bankEntries.length - unreconciledItems} Auto-Matched
                </span>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center">
                  <span className="w-2 h-2 rounded-full bg-slate-200 mr-2"></span>
                  {unreconciledItems} Pending Audit
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {bankEntries.map(entry => {
                const isMatched = !!entry.matchedTransactionId;
                const matchedTx = transactions.find(t => t.id === entry.matchedTransactionId);

                return (
                  <div key={entry.id} className={`p-8 lg:p-10 grid grid-cols-12 items-center gap-8 group transition-all duration-500 border-b border-slate-50 ${isMatched ? 'bg-emerald-50/20' : 'hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:z-10 relative'}`}>
                    <div className="col-span-3 space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border shadow-sm transition-colors ${isMatched ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                          {isMatched ? 'Verified Ledger Link' : 'External Statement Entry'}
                        </span>
                        {entry.attachedFile && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-tight group-hover:text-indigo-600 transition-colors">{entry.description}</h4>
                        <div className="flex items-center space-x-2 mt-2">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{entry.date}</p>
                          <span className="text-slate-200">•</span>
                          <p className="text-[10px] text-slate-400 font-mono font-bold tracking-[0.2em]">{entry.reference}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100/50 relative overflow-hidden group/amount">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl -mr-12 -mt-12 group-hover/amount:bg-indigo-50/50 transition-all"></div>
                        <div className="relative z-10 flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Statement Figure</span>
                          <p className={`text-2xl font-black tracking-tighter italic ${entry.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {entry.amount > 0 ? '₹' : '-₹'}{Math.abs(entry.amount).toLocaleString('en-IN')}
                          </p>

                          {entry.adjustedAmount !== undefined && (
                            <div className="w-full mt-5 pt-5 border-t border-slate-200/60 flex flex-col items-end space-y-3 animate-in slide-in-from-right-4 duration-500">
                              <div className="flex items-center space-x-2 text-slate-400">
                                <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none">Manual Correction applied</span>
                              </div>

                              <div className="bg-indigo-600/5 border border-indigo-100 p-4 rounded-[1.5rem] w-full flex flex-col items-end space-y-2 relative group-hover/amount:bg-white transition-all shadow-sm">
                                <div className="flex items-center space-x-3">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Adjusted Figure:</span>
                                  <span className="text-sm font-black text-slate-900 italic tabular-nums tracking-tight">
                                    {entry.adjustedAmount > 0 ? '₹' : '-₹'}{Math.abs(entry.adjustedAmount).toLocaleString('en-IN')}
                                  </span>
                                </div>

                                {entry.amount - entry.adjustedAmount !== 0 && (
                                  <div className={`px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-sm border ${entry.amount - entry.adjustedAmount > 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'}`}>
                                    <span className="text-[7px] font-black uppercase tracking-widest opacity-80">Audit Delta:</span>
                                    <span className="text-[10px] font-black tabular-nums italic">
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

                    <div className="col-span-2 flex flex-col items-center justify-center space-y-3">
                      {editingAmountId === entry.id ? (
                        <div className="flex items-center bg-white border-2 border-indigo-500 rounded-[1.25rem] p-1.5 shadow-2xl shadow-indigo-500/20 animate-in zoom-in-95 duration-300 w-full max-w-[140px]">
                          <div className="flex items-center flex-1 px-3">
                            <span className="text-xs font-black text-indigo-400 mr-1">₹</span>
                            <input
                              type="number"
                              className="w-full text-sm font-black text-slate-900 border-none focus:ring-0 bg-transparent p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-black flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setTempAmount(entry.adjustedAmount?.toString() || entry.amount.toString());
                            setEditingAmountId(entry.id);
                          }}
                          className={`w-full py-3.5 rounded-2xl flex items-center justify-center space-x-2 border transition-all ${entry.adjustedAmount !== undefined ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          <span className="text-[10px] font-black uppercase tracking-widest">{entry.adjustedAmount !== undefined ? 'Adjusted' : 'Set Amount'}</span>
                        </button>
                      )}

                      <label className={`w-full py-3.5 rounded-2xl flex items-center justify-center space-x-2 border cursor-pointer transition-all ${entry.attachedFile ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]">{entry.attachedFile ? entry.attachedFile : 'Attach File'}</span>
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

                    <div className="col-span-4">
                      {isMatched ? (
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/match animate-in fade-in zoom-in-95">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover/match:bg-emerald-500/20 transition-all duration-700"></div>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic">Finalized Linkage</p>
                          <h5 className="text-sm font-black text-white uppercase italic truncate max-w-full leading-relaxed">{matchedTx?.description}</h5>
                          <div className="flex items-center space-x-4 mt-4">
                            <p className="text-[10px] text-slate-500 font-mono font-bold tracking-[0.2em] uppercase">ID: {matchedTx?.id.slice(0, 8)}</p>
                            <div className="h-3 w-px bg-white/10"></div>
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Verified</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMatchingEntryId(entry.id)}
                          className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 hover:border-indigo-400 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group/portal overflow-hidden relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover/portal:from-indigo-500/5 transition-all"></div>
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/portal:bg-indigo-600 group-hover/portal:text-white group-hover/portal:rotate-90 transition-all duration-500 shadow-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                          </div>
                          <div className="text-center relative z-10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block group-hover/portal:text-indigo-600 transition-colors">Action Protocol</span>
                            <span className="text-xs font-black text-slate-900 italic uppercase mt-1 block opacity-60 group-hover/portal:opacity-100 transition-opacity">Manual Match Override</span>
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
      {matchingEntryId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[110] p-6">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 lg:p-14 max-w-2xl w-full animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-8 shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none mb-2">Match to Ledger</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select a verified bank transaction</p>
              </div>
              <button onClick={() => setMatchingEntryId(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1 min-h-0">
              {candidateTransactions.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[24px]">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No unlinked bank transactions found</p>
                </div>
              ) : (
                candidateTransactions.map(tx => {
                  const bankLine = tx.lines.find(l => l.accountId === '1001');
                  const impact = (bankLine?.debit || 0) - (bankLine?.credit || 0);
                  return (
                    <div key={tx.id} className="p-6 border border-slate-200 rounded-[24px] flex items-center justify-between hover:border-indigo-500 transition-colors group">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 uppercase italic">{tx.description}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tx.date} • Ref: {tx.reference}</p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <p className={`text-lg font-black italic tracking-tighter ${impact > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {impact > 0 ? '+' : ''}₹{Math.abs(impact).toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => handleManualMatch(tx.id)}
                          className="bg-slate-100 text-slate-900 hover:bg-indigo-600 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
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
        </div>
      )}
    </div>
  );
};

export default Reconciliation;
