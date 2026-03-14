import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Account } from '../../types';

interface SelectOption {
    id: string;
    name: string;
    code?: string;
    type?: string;
}

interface PremiumSelectProps {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const PremiumSelect: React.FC<PremiumSelectProps> = ({ value, options, onChange, placeholder = "Select...", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(() => 
        options.find(opt => opt.id === value),
    [value, options]);

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(opt => 
            opt.name.toLowerCase().includes(query) ||
            opt.code?.toLowerCase().includes(query) ||
            opt.type?.toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    const groupedOptions = useMemo(() => {
        const groups: Record<string, SelectOption[]> = {};
        filteredOptions.forEach(opt => {
            const group = opt.type || 'General';
            if (!groups[group]) groups[group] = [];
            groups[group].push(opt);
        });
        return groups;
    }, [filteredOptions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 rounded-[24px] p-5 font-black text-slate-800 dark:text-white transition-all outline-none flex items-center justify-between group/select shadow-sm ring-1 ring-black/5"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${selectedOption ? 'bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                    <span className={selectedOption ? "text-[14px] font-black uppercase tracking-tight italic" : "text-[13px] font-bold text-slate-400 capitalize tracking-normal"}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-slate-900 dark:bg-indigo-600 text-white rotate-180 scale-110 shadow-lg shadow-slate-900/20' : 'bg-slate-900/5 dark:bg-white/10 text-slate-400 dark:text-slate-500 group-hover/select:bg-slate-900 group-hover/select:text-white'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+20px)] left-0 w-full z-[150] animate-in fade-in slide-in-from-top-6 duration-500 origin-top">
                    <div className="relative">
                        <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[48px] shadow-[0_60px_120px_-25px_rgba(0,0,0,0.18)] border border-white/40 dark:border-white/5 p-8 ring-1 ring-black/5 overflow-hidden">
                            {/* Decorative Background Elements */}
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                            
                            {/* Header / Search */}
                            <div className="relative mb-8">
                                <div className="flex items-center gap-2.5 mb-4 px-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.5em]">CODIFIN INTERFACE</span>
                                </div>
                                <div className="relative">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Identify Resource Parameter..."
                                        className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/10 hover:border-slate-900/10 dark:hover:border-white/20 rounded-[22px] p-5 pl-14 font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-[0.1em] transition-all outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-[12px] focus:ring-indigo-500/5"
                                    />
                                    <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Options List */}
                            <div className="relative max-h-[400px] overflow-y-auto custom-scrollbar space-y-8 pr-3">
                                {Object.keys(groupedOptions).length === 0 ? (
                                    <div className="p-10 text-center bg-slate-50/50 dark:bg-white/5 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-white/10">
                                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Zero Result Output</p>
                                    </div>
                                ) : (
                                    (Object.entries(groupedOptions) as [string, SelectOption[]][]).map(([type, opts]) => (
                                        <div key={type} className="space-y-3">
                                            {type !== 'General' && (
                                                <div className="px-5 py-2">
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono italic opacity-60">{type} SECTOR</p>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                {opts.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => {
                                                            onChange(opt.id);
                                                            setIsOpen(false);
                                                            setSearchQuery('');
                                                        }}
                                                        className={`w-full text-left p-5 rounded-[22px] transition-all flex items-center justify-between group/opt ${
                                                            value === opt.id 
                                                            ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-3xl shadow-slate-900/30 scale-[1.03] z-10' 
                                                            : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-white/60 dark:hover:border-white/10'
                                                        }`}
                                                    >
                                                        <div>
                                                            <p className="font-black text-[13px] leading-tight mb-2 uppercase italic tracking-tight">{opt.name}</p>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${value === opt.id ? 'text-slate-400' : 'text-slate-300'}`}>UID: {opt.id.slice(0, 8)}</span>
                                                                {opt.code && <span className={`text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 ${value === opt.id ? 'text-slate-400' : 'text-slate-300'}`}>| SERIAL: {opt.code}</span>}
                                                            </div>
                                                        </div>
                                                        {value === opt.id ? (
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover/opt:opacity-100 transition-all duration-300 transform translate-x-2 group-hover/opt:translate-x-0">
                                                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        {/* High-Fidelity Structural Caret */}
                        <div className="w-6 h-6 bg-white dark:bg-slate-900 rotate-45 absolute -top-3 left-12 border-l border-t border-white dark:border-white/10 shadow-[-8px_-8px_15px_rgba(0,0,0,0.03)] z-[-1]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumSelect;
