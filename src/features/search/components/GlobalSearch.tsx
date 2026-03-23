
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SearchResult } from '../../../services/GeminiService';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
    results: SearchResult[];
    isLoading: boolean;
    onSelect: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, query, results, isLoading, onSelect }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            }
            if (e.key === 'ArrowUp') {
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }
            if (e.key === 'Enter' && results[selectedIndex]) {
                onSelect(results[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onClose, onSelect]);

    if (!isOpen) return null;

    return (
        <div 
            ref={containerRef}
            className="absolute top-full mt-4 left-0 right-0 z-[200] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[32px] shadow-[0_48px_160px_-15px_rgba(0,0,0,0.5)] border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[550px] animate-in slide-in-from-top-4 fade-in duration-500 ring-1 ring-black/5"
            onClick={e => e.stopPropagation()}
        >
            {/* Header (Intelligence Protocols) */}
            <div className="p-4 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 gap-2">
                <div className="flex items-center space-x-2 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500 text-[10px]'}`}></div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic truncate hidden sm:block">
                        {isLoading ? 'Decrypting...' : 'INTELLIGENCE'}
                    </p>
                </div>

                <div className="flex items-center space-x-2 lg:space-x-3">
                    <button 
                        onClick={() => onSelect({ type: 'Feature', title: 'Intelligence Alpha', description: 'Resetting intelligence protocols...', tab: 'dashboard' })}
                        className="group/new relative flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-[10px] font-black uppercase tracking-widest hover:from-indigo-700 hover:to-indigo-900 transition-all shadow-xl shadow-indigo-500/30 active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/new:translate-y-0 transition-transform duration-500"></div>
                        <span className="text-base group-hover/new:rotate-12 transition-transform">✨</span>
                        <span>NEW CHAT</span>
                    </button>

                    <button 
                        onClick={() => onSelect({ type: 'Feature', title: 'Registry Root', description: 'Returning to core view...', tab: 'dashboard' })}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200/50 dark:border-white/10 group/back relative active:scale-95"
                        title="Back to Root"
                    >
                        <svg className="w-5 h-5 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>

                    <button 
                        onClick={() => {
                            const insight = results.find(r => r.type === 'Insight');
                            if (!insight) return;
                            const text = `REGISTRY INTELLIGENCE SCAN\nSource: Codofin OS AI\nDate: ${new Date().toLocaleString()}\n\n-- INSIGHT --\n${insight.description}`;
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Registry_Insight_${Date.now()}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:from-emerald-600 hover:to-teal-600 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-95 group/dl relative overflow-hidden ${results.some(r => r.type === 'Insight') ? 'animate-pulse' : 'opacity-30 cursor-not-allowed grayscale'}`}
                        disabled={!results.some(r => r.type === 'Insight')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/dl:translate-x-full duration-1000 transition-transform"></div>
                        <span className="text-base group-hover/dl:translate-y-0.5 transition-transform">⬇️</span>
                        <span>DOWNLOAD</span>
                    </button>

                    {isLoading && (
                        <div className="w-5 h-5 border-3 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin ml-2"></div>
                    )}
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {results.length === 0 && !isLoading ? (
                    <div className="px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-8 text-center">
                            <div className="w-16 h-16 bg-indigo-600/10 rounded-[24px] flex items-center justify-center text-3xl mx-auto mb-4 border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">✨</div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Intelligence Readiness Active</h3>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-widest opacity-60">How may I assist with your registry today?</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] mb-2 ml-4">Recommended Vectors</p>
                            {[
                                { title: 'Financial Overview', desc: 'Generate a real-time status report of all accounts', tab: 'dashboard', icon: '📊' },
                                { title: 'Recent Transactions', desc: 'Scan the latest journal entries and ledgers', tab: 'transactions', icon: '📝' },
                                { title: 'Outstanding Invoices', desc: 'Audit pending payments and client balances', tab: 'invoices', icon: '📄' },
                                { title: 'Payroll Analysis', desc: 'Review employee disbursements and salary trends', tab: 'payroll', icon: '💳' },
                                { title: 'System Settings', desc: 'Configure Chart of Accounts and OS preferences', tab: 'settings', icon: '⚙️' }
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSelect({ type: 'Feature', title: suggestion.title, description: suggestion.desc, tab: suggestion.tab })}
                                    className="flex items-center space-x-4 p-4 rounded-[20px] bg-slate-50/50 dark:bg-white/5 border border-transparent hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all text-left group/suggestion"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-lg shadow-sm border border-slate-100 dark:border-white/5 group-hover/suggestion:scale-110 transition-transform">{suggestion.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{suggestion.title}</h4>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate opacity-70">{suggestion.desc}</p>
                                    </div>
                                    <div className="text-[8px] font-black text-indigo-500 opacity-0 group-hover/suggestion:opacity-100 transition-opacity">GO →</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 pb-2">
                        {results.map((result, index) => {
                            const isInsight = result.type === 'Insight';
                            return (
                                <button
                                    key={index}
                                    onClick={() => onSelect(result)}
                                    className={`w-full text-left transition-all flex flex-col gap-3 group/result ${
                                        isInsight 
                                            ? 'p-7 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/30 border-none rounded-[32px] scale-[0.99] hover:scale-[1] mt-2 mb-2 relative overflow-hidden' 
                                            : `p-5 flex-row items-center border border-transparent rounded-[24px] ${selectedIndex === index ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-100/50 dark:border-indigo-500/20 shadow-sm' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'}`
                                    }`}
                                >
                                    {isInsight ? (
                                        <>
                                            {/* Decorative Background Elements */}
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
                                            
                                            <div className="flex items-center justify-between w-full mb-2 relative z-10">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner">✨</div>
                                                    <div>
                                                        <h4 className="font-black uppercase italic tracking-tighter text-xl leading-none">{result.title}</h4>
                                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Intelligence Response Protocol</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 shadow-lg">LIVE INSIGHT</span>
                                                </div>
                                            </div>
                                            <p className="text-base font-bold leading-relaxed opacity-95 relative z-10 pl-1">{result.description}</p>
                                            <div className="flex items-center justify-between mt-4 pt-5 border-t border-white/20 relative z-10">
                                                <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-[0.2em]">
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                        Verified Result
                                                    </span>
                                                    <span className="opacity-30">•</span>
                                                    <span>Real-time Context Bound</span>
                                                </div>
                                                <div className="text-[9px] font-black uppercase tracking-widest bg-white text-indigo-600 px-4 py-2 rounded-xl shadow-lg group-hover/result:translate-x-1 transition-transform">
                                                    Detailed Analysis →
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover/result:scale-110 duration-500 shadow-sm ${
                                                result.type === 'Account' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                                result.type === 'Transaction' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' :
                                                result.type === 'Invoice' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' :
                                                result.type === 'Feature' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' :
                                                result.type === 'Payroll' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-500' :
                                                result.type === 'History' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-500' :
                                                'bg-slate-100 dark:bg-white/10 text-slate-500'
                                            }`}>
                                                {result.type === 'Account' ? '📂' :
                                                result.type === 'Transaction' ? '📝' :
                                                result.type === 'Invoice' ? '📄' : 
                                                result.type === 'Feature' ? '⚡' : 
                                                result.type === 'Payroll' ? '💳' : 
                                                result.type === 'History' ? '🕒' : 
                                                result.type === 'BankEntry' ? '🏦' : '👤'}
                                            </div>
                                            <div className="flex-1 min-w-0 px-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate text-sm">
                                                        {result.title}
                                                    </h4>
                                                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider ${
                                                        result.type === 'Account' ? 'bg-emerald-100 text-emerald-700' :
                                                        result.type === 'Transaction' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {result.type}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-tight truncate opacity-80">{result.description}</p>
                                            </div>
                                            {selectedIndex === index && (
                                                <div className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-right-2 duration-300">
                                                    Select →
                                                </div>
                                            )}
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/50 dark:bg-black/40 backdrop-blur-md border-t border-slate-100 dark:border-white/5 flex justify-between items-center relative z-20">
                <div className="flex gap-5">
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 rounded shadow-sm text-[8px] font-black border border-slate-200 dark:border-white/10">↑↓</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Navigate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-1.5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 rounded shadow-sm text-[8px] font-black border border-slate-200 dark:border-white/10">ENTER</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Execute</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></div>
                    <p className="text-[9px] font-black text-indigo-500/50 uppercase tracking-[0.2em] font-mono">FIN-OS CORE v4.0</p>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
