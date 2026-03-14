
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from 'xlsx';
import { useApp } from '../../../store';
import { Transaction, Account } from '../../../types';

interface TransactionImportProps {
  onClose: () => void;
}

const TransactionImport: React.FC<TransactionImportProps> = ({ onClose }) => {
  const { accounts, addTransactions } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drafts, setDrafts] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'reading' | 'analyzing'>('idle');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('reading');
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          if (Array.isArray(content)) {
            // Assume it's a direct Transaction array export
            const importedDrafts = content.map((d: any, i: number) => ({
              ...d,
              id: `draft-${Date.now()}-${i}`,
              status: 'Draft' as const
            }));
            setDrafts(importedDrafts);
          }
          setUploadStatus('idle');
        } catch (err) {
          setError("Failed to parse JSON file.");
          setUploadStatus('idle');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        setInputText(csv);
        handleAIAnalyze(csv);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInputText(content);
        handleAIAnalyze(content);
      };
      reader.readAsText(file);
    }
  };

  const handleAIAnalyze = async (manualContent?: string) => {
    const contentToAnalyze = manualContent || inputText;
    if (!contentToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setUploadStatus('analyzing');
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        ACT AS A SENIOR CHARTERED ACCOUNTANT AND AUDITOR.
        Task: Convert raw bank statement data or transaction logs into professional DOUBLE-ENTRY ledger records.

        CONTEXT:
        We are using the following Chart of Accounts (CoA). You MUST map every transaction to these specific IDs.
        ${accounts.map(a => `- ID: ${a.id}, Code: ${a.code}, Name: ${a.name}, Type: ${a.type}, Normal: ${a.normalBalance}`).join('\n')}

        ACCOUNTING RULES:
        1. STRICT DOUBLE-ENTRY: Every transaction MUST have at least one Debit and one Credit line.
        2. BALANCE CHECK: Sum of Debits MUST EXACTLY equal Sum of Credits for every single transaction.
        3. INTELLIGENT MAPPING: 
           - Payments to vendors -> Debit Expense/Asset, Credit BANK (1001).
           - Receipts from clients -> Debit BANK (1001), Credit Income (4001) or Debtors (1002).
           - Salaries -> Debit SALARY (5003), Credit BANK (1001).
           - Rent -> Debit RENT (5002), Credit BANK (1001).
           - If narrative mentions "Transfer to" or "Withdrawal", identify if it's Drawings (3002) or internal movement.
        4. DATE FORMAT: Standardize all dates to YYYY-MM-DD.
        5. OUTPUT: Return a JSON array of Transaction objects.

        DATA TO PROCESS (Could be CSV or raw text):
        ${contentToAnalyze}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                reference: { type: Type.STRING },
                type: { type: Type.STRING },
                status: { type: Type.STRING },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      accountId: { type: Type.STRING },
                      debit: { type: Type.NUMBER },
                      credit: { type: Type.NUMBER }
                    },
                    required: ["accountId", "debit", "credit"]
                  }
                }
              },
              required: ["date", "description", "lines", "type", "status"]
            }
          }
        }
      });

      const parsedDrafts = JSON.parse(response.text || "[]") as Transaction[];

      // Inject IDs and ensure balance
      const finalDrafts = parsedDrafts.filter(d => {
        const dSum = d.lines.reduce((s, l) => s + l.debit, 0);
        const cSum = d.lines.reduce((s, l) => s + l.credit, 0);
        return Math.abs(dSum - cSum) < 0.01 && dSum > 0;
      }).map((d, i) => ({
        ...d,
        id: `draft-${Date.now()}-${i}`,
        status: 'Draft' as const,
        type: 'General' as const
      }));

      if (finalDrafts.length === 0) {
        setError("AI could not extract valid balanced transactions. Please check your data format.");
      } else {
        setDrafts(finalDrafts);
      }
    } catch (err) {
      console.error(err);
      setError("Accounting Intelligence Engine failed. Ensure your API key is active and data is readable.");
    } finally {
      setIsAnalyzing(false);
      setUploadStatus('idle');
    }
  };

  const handleCommit = () => {
    const finalized = drafts.map(d => ({
      ...d,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'Posted' as const
    }));
    addTransactions(finalized);
    onClose();
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown Ledger';

  return (
    <div className="bg-white rounded-[48px] shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 h-[90vh] border border-slate-200">
      {/* Header */}
      <div className="px-12 pt-10 pb-6 border-b border-slate-50 shrink-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 ring-4 ring-indigo-50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-1 uppercase italic">Audit-Ready Import</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Powered by Gemini 3 Pro • Advanced CoA Mapping</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-300 hover:text-slate-900 transition-all hover:bg-slate-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/20">
        {drafts.length === 0 ? (
          <div className="max-w-3xl mx-auto space-y-10 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* File Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-200 rounded-[40px] bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer shadow-sm hover:shadow-xl"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.txt,.json,.xlsx,.xls" className="hidden" />
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase italic mb-2">Import Statement</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">Select .CSV, .XL, or .JSON file</p>
              </div>

              {/* Text Area Box */}
              <div className="flex flex-col space-y-4">
                <div className="flex-1 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm focus-within:ring-8 focus-within:ring-indigo-500/10 transition-all">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Or Paste Data Manually</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="2024-03-25  Rent Payment... 25,000.00&#10;2024-03-26  Client Receipt... 1,50,000.00"
                    className="w-full h-40 bg-transparent border-none font-mono text-xs focus:ring-0 placeholder:text-slate-200 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={() => handleAIAnalyze()}
                  disabled={isAnalyzing || !inputText.trim()}
                  className={`py-6 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all shadow-xl ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black active:scale-95'
                    }`}
                >
                  {isAnalyzing ? 'Processing Engine...' : 'Scan Manual Entries'}
                </button>
              </div>
            </div>

            {uploadStatus === 'reading' && (
              <div className="bg-indigo-600 text-white p-6 rounded-[24px] flex items-center justify-center space-x-4 animate-pulse">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Reading Local File Stream...</span>
              </div>
            )}

            {isAnalyzing && (
              <div className="bg-white p-12 rounded-[40px] border border-indigo-100 shadow-2xl flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-black italic">AI</div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 italic uppercase mb-2">Analyzing Accounting Rules</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
                    Gemini is parsing your narratives and mapping them to your specific ledger IDs according to IFRS/GAAP standards.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-8 rounded-[32px] flex items-start space-x-4 animate-in slide-in-from-top-4">
                <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div className="space-y-1">
                  <p className="font-black text-sm uppercase italic">Extraction Failure</p>
                  <p className="text-xs font-medium leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none mb-1">Audit Preview</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify the double-entry records detected by the AI Engine</p>
              </div>
              <button onClick={() => setDrafts([])} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50 transition-all">Clear & Rescan</button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {drafts.map((d, idx) => (
                <div key={idx} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group hover:border-indigo-200 transition-all">
                  <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-6">
                      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 text-center min-w-[100px]">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Post Date</p>
                        <p className="text-sm font-black text-slate-800 tabular-nums leading-none italic">{d.date}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">Voucher Narrative</p>
                        <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none">{d.description}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl">Balanced</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 px-4 py-2 rounded-xl">Verified</span>
                    </div>
                  </div>

                  <div className="p-10 space-y-1">
                    <div className="grid grid-cols-12 mb-4 pb-2 border-b border-slate-50">
                      <div className="col-span-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Details</div>
                      <div className="col-span-2 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Debit (Dr)</div>
                      <div className="col-span-2 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Credit (Cr)</div>
                    </div>
                    {d.lines.map((l, lIdx) => (
                      <div key={lIdx} className={`grid grid-cols-12 py-3 rounded-xl px-4 ${l.credit > 0 ? 'bg-rose-50/10' : 'bg-emerald-50/10'}`}>
                        <div className="col-span-8 flex items-center space-x-4">
                          <span className="text-[10px] font-mono font-bold text-slate-300">ID {l.accountId}</span>
                          <span className={`text-xs font-black uppercase italic ${l.credit > 0 ? 'text-slate-500 pl-8' : 'text-slate-800'}`}>
                            {getAccountName(l.accountId)}
                          </span>
                        </div>
                        <div className="col-span-2 text-right text-[13px] font-black text-emerald-600 tabular-nums">
                          {l.debit > 0 ? `₹${l.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                        </div>
                        <div className="col-span-2 text-right text-[13px] font-black text-rose-500 tabular-nums">
                          {l.credit > 0 ? `₹${l.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {drafts.length > 0 && (
        <div className="px-12 py-10 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Import Value</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">
                ₹{drafts.reduce((sum, d) => sum + d.lines.reduce((ls, l) => ls + l.debit, 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <p className="text-[10px] text-slate-400 font-bold max-w-xs leading-relaxed uppercase">
              {drafts.length} transactions successfully matched to Chart of Accounts. Ready for permanent ledger posting.
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => setDrafts([])} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">Discard All</button>
            <button
              onClick={handleCommit}
              className="px-20 py-7 bg-indigo-600 text-white rounded-[28px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Commit to General Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionImport;
