
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../store';
import TransactionForm from './TransactionForm';
import TransactionImport from './TransactionImport';
import { Transaction, Attachment } from '../../../types';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const TransactionsList: React.FC = () => {
  const {
    transactions, accounts, company, logout,
    deleteTransaction, reverseTransaction,
    startDate, endDate, setStartDate, setEndDate
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [initialFormMode, setInitialFormMode] = useState<'Journal' | 'Receipt' | 'Payment'>('Journal');
  const [filterType, setFilterType] = useState<'All' | 'General' | 'Receipt' | 'Payment' | 'Invoice'>('All');
  const [viewAttachment, setViewAttachment] = useState<string | Attachment | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown Account';

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter(tx => {
        const txDate = new Date(tx.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateMatch = txDate >= start && txDate <= end;
        const typeMatch = filterType === 'All' ? true : tx.type === filterType;
        return dateMatch && typeMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate, filterType]);

  const openForm = (mode: 'Journal' | 'Receipt' | 'Payment') => {
    setInitialFormMode(mode);
    setShowModal(true);
  };

  const handleFinalDelete = () => {
    if (!confirmDelete) return;
    deleteTransaction(confirmDelete.id);
    setConfirmDelete(null);
  };

  const handleReverse = () => {
    if (!confirmDelete) return;
    reverseTransaction(confirmDelete.id, 'User requested reversal');
    setConfirmDelete(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Reference', 'Narrative', 'Remarks', 'Account', 'Line Remarks', 'Debit', 'Credit'];
    const rows = filteredTransactions.flatMap(tx =>
      tx.lines.map((line, idx) => [
        idx === 0 ? tx.date : '',
        idx === 0 ? tx.reference : '',
        idx === 0 ? tx.description : '',
        idx === 0 ? (tx.remarks || '') : '',
        getAccountName(line.accountId),
        line.remarks || '',
        line.debit || '',
        line.credit || ''
      ])
    );


    const csvContent = [headers, ...rows].map(e => e.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const data = filteredTransactions.flatMap(tx =>
      tx.lines.map((line, idx) => ({
        'Date': idx === 0 ? tx.date : '',
        'Reference': idx === 0 ? tx.reference : '',
        'Narrative': idx === 0 ? tx.description : '',
        'Remarks': idx === 0 ? (tx.remarks || '') : '',
        'Account': getAccountName(line.accountId),
        'Line Remarks': line.remarks || '',
        'Debit': line.debit || 0,
        'Credit': line.credit || 0
      }))
    );


    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
    XLSX.writeFile(workbook, `ledger_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableData = filteredTransactions.flatMap(tx =>
      tx.lines.map((line, idx) => [
        idx === 0 ? tx.date : '',
        idx === 0 ? (tx.reference || tx.id.slice(-6)) : '',
        idx === 0 ? tx.description + (tx.remarks ? `\nNote: ${tx.remarks}` : '') : '',
        getAccountName(line.accountId) + (line.remarks ? `\n(${line.remarks})` : ''),
        line.debit ? `₹${line.debit.toLocaleString()}` : '',
        line.credit ? `₹${line.credit.toLocaleString()}` : ''
      ])
    );


    (doc as any).autoTable({
      head: [['Date', 'Reference', 'Narrative', 'Account', 'Debit', 'Credit']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    });

    doc.save(`ledger_export_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 lg:pb-10 shadow-sm border border-slate-200/60 dark:border-white/5 transition-colors duration-300">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-slate-400 truncate max-w-[150px] sm:max-w-none">{company.name}</span>
              <span className="mx-2 lg:mx-3 text-slate-300">•</span>
              <span className="text-emerald-600">Ledger Activity</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-4">
                <CustomDatePicker
                  label="F"
                  value={startDate}
                  onChange={setStartDate}
                />
                <span className="text-slate-200 font-bold hidden sm:inline">—</span>
                <CustomDatePicker
                  label="T"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic uppercase">Journal Entries</h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setShowImport(true)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex items-center space-x-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <span className="hidden sm:inline">Import</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center space-x-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)}></div>
                      <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={exportToExcel} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center space-x-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span>Excel Spreadsheet</span>
                        </button>
                        <button onClick={exportToCSV} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center space-x-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          <span>CSV Format</span>
                        </button>
                        <button onClick={exportToPDF} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center space-x-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          <span>PDF Document</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                <button onClick={() => openForm('Receipt')} className="px-3 py-2 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all">Receipt</button>
                <button onClick={() => openForm('Payment')} className="px-3 py-2 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">Payment</button>
                <button onClick={() => openForm('Journal')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">+ Entry</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white/50 dark:bg-white/5 backdrop-blur-sm p-1 rounded-xl lg:rounded-2xl w-full sm:w-fit border border-slate-200/50 dark:border-white/5 overflow-x-auto no-scrollbar">
        {(['All', 'General', 'Receipt', 'Payment', 'Invoice'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`whitespace-nowrap flex-1 sm:flex-none px-4 lg:px-8 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm lg:shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
          >
            {type === 'All' ? 'All' : type + 's'}
          </button>
        ))}
      </div>

      {/* Table Section - Desktop Only */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Date</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-44">Reference</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narrative</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-36">Debit</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-36">Credit</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-10 py-48 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest text-sm italic">No entries found for this period.</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <React.Fragment key={tx.id}>
                    {tx.lines.map((line, idx) => (
                      <tr key={`${tx.id}-${idx}`} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                        <td className="px-10 py-4 text-xs font-bold text-slate-400">
                          {idx === 0 ? tx.date : ''}
                        </td>
                        <td className="px-10 py-4">
                          {idx === 0 && (
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest italic">
                              {tx.reference || tx.id.slice(-6).toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-10 py-4 text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px] uppercase italic tracking-tight">
                          {idx === 0 ? (
                            <div className="flex flex-col">
                              <span>{tx.description}</span>
                              {tx.remarks && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 normal-case italic mt-1 font-serif tracking-normal">"{tx.remarks}"</span>}
                            </div>
                          ) : ''}
                        </td>
                        <td className={`px-10 py-4 text-xs ${line.credit > 0 ? 'pl-20 text-slate-500 dark:text-slate-400 italic' : 'font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight'}`}>
                          <div className="flex flex-col">
                            <span>{getAccountName(line.accountId)}</span>
                            {line.remarks && <span className="text-[10px] font-bold text-indigo-500/60 dark:text-indigo-400/40 normal-case italic mt-0.5 tracking-normal">↳ {line.remarks}</span>}
                          </div>
                        </td>

                        <td className="px-10 py-4 text-right text-sm tabular-nums font-black text-emerald-600">
                          {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''}
                        </td>
                        <td className="px-10 py-4 text-right text-sm tabular-nums font-black text-rose-600">
                          {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''}
                        </td>
                        <td className="px-10 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            {idx === 0 && tx.attachments && tx.attachments.length > 0 && (
                              <button
                                onClick={() => setViewAttachment(tx.attachments![0])}
                                className="w-10 h-10 flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-sm"
                                title="View Attachment"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              </button>
                            )}
                            {idx === 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfirmDelete(tx);
                                }}
                                className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all group/del active:scale-95 shadow-sm border border-transparent hover:border-rose-100"
                                aria-label="Delete Ledger Entry"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/20 dark:bg-white/5 h-0.5"><td colSpan={7}></td></tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card List Section - Mobile Only */}
      <div className="lg:hidden space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-12 text-center border border-slate-200/60 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">No matching entries.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-200/60 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400">{tx.date}</span>
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest">
                  {tx.reference || tx.id.slice(-6).toUpperCase()}
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{tx.description}</h4>
                <p className="text-[9px] text-indigo-500 font-bold mt-0.5 tracking-widest uppercase">{tx.type} ENTRY</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-white/5">
                {tx.lines.map((line, lIdx) => (
                  <div key={lIdx} className="flex items-center justify-between text-[11px]">
                    <div className="flex flex-col">
                      <span className={`truncate max-w-[180px] ${line.credit > 0 ? 'text-slate-500 pl-4 italic' : 'font-black text-slate-800 dark:text-slate-200 uppercase'}`}>
                        {getAccountName(line.accountId)}
                      </span>
                      {line.remarks && <span className="text-[9px] font-bold text-indigo-400/60 italic lowercase ml-4">↳ {line.remarks}</span>}
                    </div>

                    <span className={`font-black tabular-nums ${line.debit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{(line.debit || line.credit).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {tx.attachments && tx.attachments.length > 0 && (
                  <button onClick={() => setViewAttachment(tx.attachments![0])} className="p-2.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                )}
                <button onClick={() => setConfirmDelete(tx)} className="p-2.5 text-slate-300 hover:text-rose-600 bg-slate-50 dark:bg-white/5 rounded-xl">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-6">
          <TransactionForm initialMode={initialFormMode} onClose={() => setShowModal(false)} />
        </div>,
        document.body
      )}

      {showImport && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-6">
          <TransactionImport onClose={() => setShowImport(false)} />
        </div>,
        document.body
      )}

      {viewAttachment && createPortal(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[1000] p-10" onClick={() => setViewAttachment(null)}>
          <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {typeof viewAttachment === 'string' ? (
              <img src={viewAttachment} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" alt="Attachment Preview" />
            ) : viewAttachment.type.startsWith('image/') ? (
              <img src={viewAttachment.url} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" alt={viewAttachment.name} />
            ) : (
              <div className="bg-white rounded-[48px] p-12 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-200 shadow-2xl border border-slate-100">
                <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-500">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{viewAttachment.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Format: {viewAttachment.type || 'Unknown'}</p>
                </div>
                <a 
                  href={viewAttachment.url} 
                  download={viewAttachment.name}
                  className="px-10 py-5 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                  onClick={e => e.stopPropagation()}
                >
                  Download Document
                </a>
              </div>
            )}
            <button 
              onClick={() => setViewAttachment(null)}
              className="mt-8 text-white/50 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all bg-white/10 px-6 py-3 rounded-full backdrop-blur-md"
            >
              Close Preview
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TransactionsList;
