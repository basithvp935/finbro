
import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import TransactionForm from './TransactionForm';
import TransactionImport from './TransactionImport';
import { Transaction } from '../../types';
import CustomDatePicker from './CustomDatePicker';
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
  const [viewAttachment, setViewAttachment] = useState<string | null>(null);

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
    const headers = ['Date', 'Reference', 'Narrative', 'Account', 'Debit', 'Credit'];
    const rows = filteredTransactions.flatMap(tx =>
      tx.lines.map((line, idx) => [
        idx === 0 ? tx.date : '',
        idx === 0 ? tx.reference : '',
        idx === 0 ? tx.description : '',
        getAccountName(line.accountId),
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
        'Account': getAccountName(line.accountId),
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
        idx === 0 ? tx.reference : '',
        idx === 0 ? tx.description : '',
        getAccountName(line.accountId),
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
      <div className="bg-white rounded-[32px] p-8 pb-10 shadow-sm border border-slate-200/60">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-slate-400">{company.name}</span>
              <span className="mx-3 text-slate-300">•</span>
              <span className="text-emerald-600">Ledger Activity</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Premium Custom Date Filters */}
              <div className="flex items-center space-x-4">
                <CustomDatePicker
                  label="From"
                  value={startDate}
                  onChange={setStartDate}
                />
                <span className="text-slate-200 font-bold">—</span>
                <CustomDatePicker
                  label="To"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <button
                onClick={logout}
                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 bg-slate-50 px-5 py-2.5 rounded-xl transition-all border border-slate-100"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Journal Entries</h1>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowImport(true)}
                className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <span>Import</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span>Export</span>
                </button>

                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)}></div>
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
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

              <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
                <button onClick={() => openForm('Receipt')} className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-50 transition-all">Receipt</button>
                <button onClick={() => openForm('Payment')} className="px-4 py-2 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-50 transition-all">Payment</button>
                <button onClick={() => openForm('Journal')} className="px-5 py-3 bg-emerald-600 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">+ Entry</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl w-fit border border-slate-200/50 overflow-x-auto">
        {(['All', 'General', 'Receipt', 'Payment', 'Invoice'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`whitespace-nowrap px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            {type === 'All' ? 'All Ledger' : type + 's'}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Date</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-44">Reference</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narrative</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-36">Debit</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-36">Credit</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-10 py-48 text-center text-slate-300 font-black uppercase tracking-widest text-sm italic">No entries found for this period.</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <React.Fragment key={tx.id}>
                    {tx.lines.map((line, idx) => (
                      <tr key={`${tx.id}-${idx}`} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-10 py-4 text-xs font-bold text-slate-400">
                          {idx === 0 ? tx.date : ''}
                        </td>
                        <td className="px-10 py-4">
                          {idx === 0 && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest italic">
                              {tx.reference || tx.id.slice(-6).toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-10 py-4 text-xs font-black text-slate-900 truncate max-w-[200px] uppercase italic tracking-tight">
                          {idx === 0 ? tx.description : ''}
                        </td>
                        <td className={`px-10 py-4 text-xs ${line.credit > 0 ? 'pl-20 text-slate-500 italic' : 'font-black text-slate-800 uppercase tracking-tight'}`}>
                          {getAccountName(line.accountId)}
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
                                className="w-10 h-10 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
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
                    <tr className="bg-slate-50/20 h-0.5"><td colSpan={7}></td></tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <TransactionForm initialMode={initialFormMode} onClose={() => setShowModal(false)} />
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <TransactionImport onClose={() => setShowImport(false)} />
        </div>
      )}

      {viewAttachment && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-10" onClick={() => setViewAttachment(null)}>
          <img src={viewAttachment} className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" alt="Attachment Preview" />
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-[10px] font-black uppercase tracking-widest italic">Click anywhere to close</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
