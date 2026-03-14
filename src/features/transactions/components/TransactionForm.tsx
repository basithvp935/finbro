
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../store';
import { JournalEntryLine, Transaction, Account, Attachment } from '../../../types';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import PremiumSelect from '../../../components/ui/PremiumSelect';

type EntryMode = 'Journal' | 'Receipt' | 'Payment';

const TransactionForm: React.FC<{ onClose: () => void; initialMode?: EntryMode }> = ({ onClose, initialMode = 'Journal' }) => {
  const { accounts, transactions, addTransaction } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<EntryMode>(initialMode);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD in local time
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [journalLines, setJournalLines] = useState<{ accountId: string; side: 'Dr' | 'Cr'; amount: string; receipt: string; }[]>([
    { accountId: '', side: 'Dr', amount: '', receipt: '' },
    { accountId: '', side: 'Cr', amount: '', receipt: '' },
  ]);

  const [bankAccountId, setBankAccountId] = useState('1001'); // Default to BANK (id: 1001)
  const [guidedLines, setGuidedLines] = useState<{ accountId: string; amount: string; receipt: string; }[]>([
    { accountId: '', amount: '', receipt: '' }
  ]);

  const [lineToDelete, setLineToDelete] = useState<{ type: 'Journal' | 'Guided'; index: number } | null>(null);

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
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          url: reader.result as string
        }]);
      };
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
        <div key={idx} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-5 lg:p-6 rounded-[32px] group transition-all relative shadow-sm">
          <div className="w-full lg:col-span-5">
            <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ledger Target</label>
            <PremiumSelect
              value={line.accountId}
              options={allocationAccounts}
              onChange={val => { const nl = [...guidedLines]; nl[idx].accountId = val; setGuidedLines(nl); }}
              placeholder={`Select ${mode === 'Payment' ? 'Expense' : 'Income'} Account...`}
            />
          </div>
          <div className="w-full lg:col-span-5">
            <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Value</label>
            <input 
              type="number" 
              step="0.01" 
              value={line.amount} 
              onChange={e => { const nl = [...guidedLines]; nl[idx].amount = e.target.value; setGuidedLines(nl); }} 
              placeholder="0.00" 
              className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-[20px] p-4 text-right font-black text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700" 
            />
          </div>
          <div className="absolute top-2 right-2 lg:relative lg:top-0 lg:right-0 lg:col-span-2 text-center">
            <button type="button" onClick={() => setLineToDelete({ type: 'Guided', index: idx })} className="text-slate-200 hover:text-rose-500 p-2 transition-colors">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setGuidedLines([...guidedLines, { accountId: '', amount: '', receipt: '' }])} className="w-full py-5 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[32px] text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-200 dark:hover:border-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">+ Add Allocation Row</button>
    </div>
  );

  const renderBankSection = (type: 'Debit' | 'Credit') => (
    <div className={`p-8 lg:p-10 rounded-[48px] border-2 transition-all shadow-lg ${type === 'Debit' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'}`}>
      <div className="flex items-center justify-between mb-6">
        <label className={`text-[11px] font-black uppercase tracking-widest block ${type === 'Debit' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {type === 'Debit' ? 'BANK / CASH RECEIPT TARGET' : 'BANK / CASH DISBURSEMENT SOURCE'}
        </label>
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${type === 'Debit' ? 'bg-emerald-200/50 text-emerald-700' : 'bg-rose-200/50 text-rose-700'}`}>
          {type} Protocol
        </span>
      </div>
      <PremiumSelect
        value={bankAccountId}
        options={bankAccounts}
        onChange={setBankAccountId}
        placeholder="Select Bank/Cash Account..."
      />
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 lg:rounded-[64px] shadow-2xl max-w-[1000px] w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 h-screen lg:h-[95vh] border border-slate-200 dark:border-white/5">
      {/* Dynamic Header */}
      <div className="px-6 lg:px-14 pt-8 lg:pt-14 pb-8 border-b border-slate-50 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div className="flex items-center space-x-6">
            <button
              onClick={onClose}
              className="group flex items-center justify-center w-14 h-14 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white hover:border-slate-900 dark:hover:border-indigo-600 transition-all shadow-sm"
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
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1 uppercase italic">Post {mode}</h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Real-Time Ledger Commit Protocol</p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 p-2 rounded-3xl">
            {(['Journal', 'Receipt', 'Payment'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} id="ledger-form" className="flex-1 min-h-0 overflow-y-auto px-6 lg:px-14 pt-10 pb-48 custom-scrollbar space-y-12 bg-slate-50/20 dark:bg-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Posting Date</label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
              triggerClassName="w-full h-[76px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[24px] p-6 font-black text-slate-800 dark:text-white flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-all outline-none"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Sequential Reference</label>
            <div className="w-full h-[76px] bg-slate-100 dark:bg-white/5 border-none rounded-[24px] p-6 font-black text-indigo-600 dark:text-indigo-400 flex items-center italic text-xl">
              {reference}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Entry Narrative</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="e.g. Office Rent Mar 2024..." 
              required 
              className="w-full h-[76px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[24px] p-6 font-black text-slate-800 dark:text-white focus:ring-8 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700" 
            />
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
              <div key={idx} className={`flex flex-col lg:grid lg:grid-cols-12 gap-6 items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-8 rounded-[48px] group transition-all relative shadow-sm ${line.side === 'Cr' ? 'lg:ml-16 border-rose-100 dark:border-rose-500/20' : 'border-emerald-100 dark:border-emerald-500/20'}`}>
                <div className="w-full lg:col-span-5">
                  <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ledger Account</label>
                  <PremiumSelect
                    value={line.accountId}
                    options={accounts}
                    onChange={val => { const nl = [...journalLines]; nl[idx].accountId = val; setJournalLines(nl); }}
                    placeholder="Select Ledger Account..."
                  />
                </div>
                <div className="w-full lg:col-span-2">
                  <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Modality</label>
                  <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl">
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
                <div className="w-full lg:col-span-4">
                  <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Value (INR)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={line.amount} 
                    onChange={e => { const nl = [...journalLines]; nl[idx].amount = e.target.value; setJournalLines(nl); }} 
                    placeholder="0.00" 
                    className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-[20px] p-4 text-right font-black text-slate-900 dark:text-white outline-none transition-all focus:bg-white dark:focus:bg-slate-700 placeholder:text-slate-200 dark:placeholder:text-slate-700" 
                  />
                </div>
                <div className="absolute top-4 right-4 lg:relative lg:top-0 lg:right-0 lg:col-span-1 text-center">
                  <button type="button" onClick={() => setLineToDelete({ type: 'Journal', index: idx })} className="text-slate-200 hover:text-rose-500 p-2 transition-colors">✕</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setJournalLines([...journalLines, { accountId: '', side: journalLines[journalLines.length - 1].side === 'Dr' ? 'Cr' : 'Dr', amount: '', receipt: '' }])} className="w-full py-6 border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[48px] text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-200 dark:hover:border-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">+ Add Journal Sequence</button>
          </div>
        )}

        <div className="pt-12 border-t border-slate-50">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-6">Auditable Evidence (Receipts/Docs)</label>
          <div className="flex flex-wrap gap-6">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative w-32 h-32 rounded-[32px] overflow-hidden group shadow-xl ring-4 ring-white bg-slate-50 flex items-center justify-center">
                {att.type.startsWith('image/') ? (
                  <img src={att.url} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight break-all line-clamp-2 px-2">{att.name}</span>
                  </div>
                )}
                <button type="button" onClick={() => removeAttachment(idx)} className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-black uppercase text-xs">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-[32px] border-4 border-dashed border-slate-100 dark:border-white/10 flex flex-col items-center justify-center space-y-3 hover:border-indigo-400 dark:hover:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all group">
              <svg className="w-8 h-8 text-slate-200 dark:text-slate-800 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              <span className="text-[9px] font-black uppercase text-slate-300 dark:text-slate-600 group-hover:text-indigo-400">Attach</span>
            </button>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </div>
        </div>
      </form>

      {/* Persistence Bar */}
      <div className="px-6 lg:px-14 py-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-10 shrink-0 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)] z-20 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-12 w-full lg:flex-1 lg:min-w-0 flex-wrap gap-y-3 lg:gap-y-6">
          <div className="mb-1 lg:mb-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Aggregate Totals</p>
            <div className="flex items-baseline space-x-4 lg:space-x-8 lg:min-w-0 flex-wrap gap-y-2">
               <p className={`font-black text-slate-900 dark:text-white tracking-tighter italic transition-all duration-300 ${
                totals.dr.toLocaleString().length > 30 ? 'text-xs' :
                totals.dr.toLocaleString().length > 25 ? 'text-sm' :
                totals.dr.toLocaleString().length > 20 ? 'text-lg' :
                totals.dr.toLocaleString().length > 15 ? 'text-xl' :
                totals.dr.toLocaleString().length > 10 ? 'text-2xl' : 'text-3xl'
              }`}>
                Dr. ₹{totals.dr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className="w-px h-8 bg-slate-200 hidden lg:block shrink-0"></div>
              <p className={`font-black text-slate-400 tracking-tighter italic transition-all duration-300 ${
                totals.cr.toLocaleString().length > 30 ? 'text-xs' :
                totals.cr.toLocaleString().length > 25 ? 'text-sm' :
                totals.cr.toLocaleString().length > 20 ? 'text-lg' :
                totals.cr.toLocaleString().length > 15 ? 'text-xl' :
                totals.cr.toLocaleString().length > 10 ? 'text-2xl' : 'text-3xl'
              }`}>
                Cr. ₹{totals.cr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 lg:space-x-0">
            <div className={`px-5 py-2.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'}`}>
              <div className={`w-2 h-2 rounded-full ${isBalanced ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              <span>{isBalanced ? 'Balanced' : 'Imbalance'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 lg:space-x-8 w-full lg:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Abort
          </button>
          <button
            type="submit"
            form="ledger-form"
            disabled={!isBalanced}
            className={`min-w-[220px] px-8 py-6 rounded-[28px] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${isBalanced
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-slate-900/30 dark:shadow-indigo-500/20 hover:bg-black dark:hover:bg-indigo-700'
                : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-white/5 shadow-none'
              }`}
          >
            Commit Ledger
          </button>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      {lineToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 lg:p-12 max-w-md w-full shadow-2xl border border-slate-100 dark:border-white/5 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-[32px] flex items-center justify-center text-rose-500 mb-8 mx-auto">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="text-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-3">Confirm Removal?</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
                You are about to remove this transaction line. This action cannot be undone. Are you sure?
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <button
                type="button"
                onClick={() => {
                  if (lineToDelete.type === 'Journal') {
                    setJournalLines(journalLines.filter((_, i) => i !== lineToDelete.index));
                  } else {
                    setGuidedLines(guidedLines.filter((_, i) => i !== lineToDelete.index));
                  }
                  setLineToDelete(null);
                }}
                className="w-full py-5 bg-rose-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95"
              >
                Yes, Remove Line
              </button>
              <button
                type="button"
                onClick={() => setLineToDelete(null)}
                className="w-full py-5 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
              >
                Cancel Action
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TransactionForm;
