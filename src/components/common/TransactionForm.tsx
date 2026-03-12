
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../store';
import { JournalEntryLine, Transaction, Account } from '../../types';
import CustomDatePicker from './CustomDatePicker';

type EntryMode = 'Journal' | 'Receipt' | 'Payment';

const TransactionForm: React.FC<{ onClose: () => void; initialMode?: EntryMode }> = ({ onClose, initialMode = 'Journal' }) => {
  const { accounts, transactions, addTransaction } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<EntryMode>(initialMode);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachments, setAttachments] = useState<string[]>([]);

  const [journalLines, setJournalLines] = useState<{ accountId: string; side: 'Dr' | 'Cr'; amount: string; receipt: string; }[]>([
    { accountId: '', side: 'Dr', amount: '', receipt: '' },
    { accountId: '', side: 'Cr', amount: '', receipt: '' },
  ]);

  const [bankAccountId, setBankAccountId] = useState('1001'); // Default to BANK (id: 1001)
  const [guidedLines, setGuidedLines] = useState<{ accountId: string; amount: string; receipt: string; }[]>([
    { accountId: '', amount: '', receipt: '' }
  ]);

  /**
   * Filtered Accounts for Guided Modes
   * Payment: Only Expenses
   * Receipt: Only Income
   * Journal: Everything
   */
  const allocationAccounts = useMemo(() => {
    if (mode === 'Payment') {
      return accounts.filter(acc => acc.type === 'Expense');
    }
    if (mode === 'Receipt') {
      return accounts.filter(acc => acc.type === 'Income');
    }
    return accounts; // Fallback, though guided lines are only for Receipt/Payment
  }, [mode, accounts]);

  /**
   * Sequential Voucher Generation Engine
   */
  useEffect(() => {
    const prefix = mode === 'Journal' ? 'JV' : mode === 'Receipt' ? 'RV' : 'PV';

    const relevantTxs = transactions.filter(t => t.reference && t.reference.startsWith(`${prefix}-`));
    let maxNum = 0;

    relevantTxs.forEach(t => {
      const parts = t.reference!.split('-');
      if (parts.length === 2) {
        const numPart = parseInt(parts[1]);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });

    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    setReference(`${prefix}-${nextNum}`);
  }, [mode, transactions]);

  const bankAccounts = useMemo(() =>
    accounts.filter(a =>
      a.id === '1001' ||
      a.id === '1006' ||
      a.name.toUpperCase().includes('BANK') ||
      a.name.toUpperCase().includes('CASH')
    ),
    [accounts]);

  const totals = useMemo(() => {
    if (mode === 'Journal') {
      const dr = journalLines.filter(l => l.side === 'Dr').reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
      const cr = journalLines.filter(l => l.side === 'Cr').reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
      return { dr, cr };
    } else {
      const lineTotal = guidedLines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
      return { dr: lineTotal, cr: lineTotal };
    }
  }, [mode, journalLines, guidedLines]);

  const isBalanced = totals.dr > 0 && Math.abs(totals.dr - totals.cr) < 0.01;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => setAttachments(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    let finalLines: JournalEntryLine[] = [];
    if (mode === 'Journal') {
      finalLines = journalLines.filter(l => l.accountId && parseFloat(l.amount) > 0).map(l => ({
        accountId: l.accountId,
        debit: l.side === 'Dr' ? parseFloat(l.amount) : 0,
        credit: l.side === 'Cr' ? parseFloat(l.amount) : 0,
        receipt: l.receipt
      }));
    } else if (mode === 'Receipt') {
      if (bankAccountId) {
        finalLines.push({ accountId: bankAccountId, debit: totals.dr, credit: 0 });
      }
      guidedLines.forEach(l => {
        if (l.accountId && parseFloat(l.amount) > 0)
          finalLines.push({ accountId: l.accountId, debit: 0, credit: parseFloat(l.amount), receipt: l.receipt });
      });
    } else if (mode === 'Payment') {
      guidedLines.forEach(l => {
        if (l.accountId && parseFloat(l.amount) > 0)
          finalLines.push({ accountId: l.accountId, debit: parseFloat(l.amount), credit: 0, receipt: l.receipt });
      });
      if (bankAccountId) {
        finalLines.push({ accountId: bankAccountId, debit: 0, credit: totals.cr });
      }
    }

    addTransaction({
      id: `tx-${Date.now()}`,
      date,
      description: description || `${mode} Entry`,
      reference: reference,
      lines: finalLines,
      type: mode === 'Journal' ? 'General' : (mode as any),
      status: 'Posted',
      attachments: attachments.length > 0 ? attachments : undefined
    });
    onClose();
  };

  const renderGuidedLines = () => (
    <div className="space-y-4">
      <div className="hidden lg:grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <div className="col-span-7">{mode === 'Payment' ? 'Target Expense Account' : 'Source Income Account'}</div>
        <div className="col-span-4 text-right">Amount (₹)</div>
      </div>
      {guidedLines.map((line, idx) => (
        <div key={idx} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center bg-white border border-slate-100 p-5 lg:p-6 rounded-[32px] group transition-all relative shadow-sm">
          <div className="w-full lg:col-span-7">
            <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ledger Target</label>
            <select required value={line.accountId} onChange={e => { const nl = [...guidedLines]; nl[idx].accountId = e.target.value; setGuidedLines(nl); }} className="w-full bg-slate-50 lg:bg-transparent border-none rounded-xl lg:rounded-none p-3 lg:p-0 font-black text-slate-800 focus:ring-0">
              <option value="">Select {mode === 'Payment' ? 'Expense' : 'Income'} Account...</option>
              {allocationAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
          <div className="w-full lg:col-span-4">
            <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Value</label>
            <input type="number" step="0.01" value={line.amount} onChange={e => { const nl = [...guidedLines]; nl[idx].amount = e.target.value; setGuidedLines(nl); }} placeholder="0.00" className="w-full bg-slate-50 border-none rounded-xl p-3 text-right font-black text-slate-900" />
          </div>
          <div className="absolute top-2 right-2 lg:relative lg:top-0 lg:right-0 lg:col-span-1 text-center">
            <button type="button" onClick={() => setGuidedLines(guidedLines.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-rose-500 p-2 transition-colors">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setGuidedLines([...guidedLines, { accountId: '', amount: '', receipt: '' }])} className="w-full py-5 border-2 border-dashed border-slate-100 rounded-[32px] text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-600 transition-all">+ Add Allocation Row</button>
    </div>
  );

  const renderBankSection = (type: 'Debit' | 'Credit') => (
    <div className={`p-8 lg:p-10 rounded-[48px] border-2 transition-all shadow-lg ${type === 'Debit' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
      <div className="flex items-center justify-between mb-6">
        <label className={`text-[11px] font-black uppercase tracking-widest block ${type === 'Debit' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {type === 'Debit' ? 'BANK / CASH RECEIPT TARGET' : 'BANK / CASH DISBURSEMENT SOURCE'}
        </label>
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${type === 'Debit' ? 'bg-emerald-200/50 text-emerald-700' : 'bg-rose-200/50 text-rose-700'}`}>
          {type} Protocol
        </span>
      </div>
      <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className="w-full bg-white border-none rounded-[24px] p-6 lg:p-8 font-black text-slate-900 shadow-sm focus:ring-8 focus:ring-indigo-500/10 transition-all text-lg cursor-pointer">
        {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-white lg:rounded-[64px] shadow-2xl max-w-[1000px] w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 h-screen lg:h-[95vh] border border-slate-200">
      {/* Dynamic Header */}
      <div className="px-6 lg:px-14 pt-8 lg:pt-14 pb-8 border-b border-slate-50 bg-white shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div className="flex items-center space-x-6">
            <button
              onClick={onClose}
              className="group flex items-center justify-center w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
              title="Abort Transaction"
            >
              <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex items-center space-x-5">
              <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center text-white shadow-xl transition-all ${mode === 'Payment' ? 'bg-rose-500 shadow-rose-500/20' : mode === 'Receipt' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}>
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-1 uppercase italic">Post {mode}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Real-Time Ledger Commit Protocol</p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 p-2 rounded-3xl">
            {(['Journal', 'Receipt', 'Payment'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} id="ledger-form" className="flex-1 overflow-y-auto px-6 lg:px-14 py-10 custom-scrollbar space-y-12 bg-slate-50/20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Posting Date</label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Sequential Reference</label>
            <input type="text" value={reference} readOnly className="w-full bg-slate-100 border-none rounded-[24px] p-6 font-black text-indigo-600 cursor-not-allowed italic text-lg" />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Entry Narrative</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Office Rent Mar 2024..." required className="w-full bg-white border border-slate-100 rounded-[24px] p-6 font-black text-slate-800 focus:ring-8 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-200" />
          </div>
        </div>

        {mode === 'Receipt' && (
          <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
            {renderBankSection('Debit')}
            {renderGuidedLines()}
          </div>
        )}

        {mode === 'Payment' && (
          <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
            {renderGuidedLines()}
            {renderBankSection('Credit')}
          </div>
        )}

        {mode === 'Journal' && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            {journalLines.map((line, idx) => (
              <div key={idx} className={`flex flex-col lg:grid lg:grid-cols-12 gap-6 items-center bg-white border border-slate-100 p-8 rounded-[48px] group transition-all relative shadow-sm ${line.side === 'Cr' ? 'lg:ml-16 border-rose-100' : 'border-emerald-100'}`}>
                <div className="w-full lg:col-span-6">
                  <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ledger Account</label>
                  <select required value={line.accountId} onChange={e => { const nl = [...journalLines]; nl[idx].accountId = e.target.value; setJournalLines(nl); }} className="w-full bg-slate-50 lg:bg-transparent border-none rounded-xl lg:rounded-none p-3 lg:p-0 font-black text-slate-800 focus:ring-0">
                    <option value="">Select Ledger Account...</option>
                    {/* Journal allows all accounts */}
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
                <div className="w-full lg:col-span-2">
                  <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Modality</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    {(['Dr', 'Cr'] as const).map(side => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => { const nl = [...journalLines]; nl[idx].side = side; setJournalLines(nl); }}
                        className={`flex-1 text-[10px] font-black py-2.5 rounded-xl transition-all ${line.side === side ? (side === 'Dr' ? 'bg-emerald-600 text-white shadow-md' : 'bg-rose-600 text-white shadow-md') : 'text-slate-400'}`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full lg:col-span-3">
                  <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Value (INR)</label>
                  <input type="number" step="0.01" value={line.amount} onChange={e => { const nl = [...journalLines]; nl[idx].amount = e.target.value; setJournalLines(nl); }} placeholder="0.00" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-right font-black text-slate-900 focus:bg-white transition-all" />
                </div>
                <div className="absolute top-4 right-4 lg:relative lg:top-0 lg:right-0 lg:col-span-1 text-center">
                  <button type="button" onClick={() => setJournalLines(journalLines.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-rose-500 p-2 transition-colors">✕</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setJournalLines([...journalLines, { accountId: '', side: journalLines[journalLines.length - 1].side === 'Dr' ? 'Cr' : 'Dr', amount: '', receipt: '' }])} className="w-full py-6 border-2 border-dashed border-slate-100 rounded-[48px] text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-600 transition-all">+ Add Journal Sequence</button>
          </div>
        )}

        <div className="pt-12 border-t border-slate-50">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-6">Auditable Evidence (Receipts/Docs)</label>
          <div className="flex flex-wrap gap-6">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative w-32 h-32 rounded-[32px] overflow-hidden group shadow-xl ring-4 ring-white">
                <img src={att} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeAttachment(idx)} className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-black uppercase text-xs">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-[32px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-3 hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
              <svg className="w-8 h-8 text-slate-200 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              <span className="text-[9px] font-black uppercase text-slate-300 group-hover:text-indigo-400">Attach</span>
            </button>
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </div>
        </div>
      </form>

      {/* Persistence Bar */}
      <div className="px-6 lg:px-14 py-8 lg:py-12 bg-white border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-10 shrink-0 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-16 w-full lg:w-auto">
          <div className="mb-6 lg:mb-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Aggregate Totals</p>
            <div className="flex items-baseline space-x-6">
              <p className="text-3xl font-black text-slate-900 tracking-tighter italic">
                Dr. ₹{totals.dr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className="w-px h-10 bg-slate-200 hidden lg:block"></div>
              <p className="text-3xl font-black text-slate-400 tracking-tighter italic">
                Cr. ₹{totals.cr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className={`px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 ${isBalanced ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <div className={`w-2 h-2 rounded-full ${isBalanced ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span>{isBalanced ? 'Protocol Balanced' : 'Trial Imbalance Detected'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-12 w-full lg:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            Abort Entry
          </button>
          <button
            type="submit"
            form="ledger-form"
            disabled={!isBalanced}
            className={`min-w-[280px] px-12 py-6 rounded-[28px] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${isBalanced
                ? 'bg-slate-900 text-white shadow-slate-900/30 hover:bg-black'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200 shadow-none'
              }`}
          >
            Commit Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
