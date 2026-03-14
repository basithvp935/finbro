import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    value: string;
    label: string;
}

interface PremiumDropdownProps {
    value: string;
    options: (string | DropdownOption)[];
    onChange: (value: string) => void;
    label?: string;
    triggerClassName?: string;
}

const PremiumDropdown: React.FC<PremiumDropdownProps> = ({ value, options, onChange, label, triggerClassName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Normalize options to DropdownOption format
    const normalizedOptions: DropdownOption[] = options.map(opt => 
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value) || { value, label: value };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={triggerClassName || "w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 font-black text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-all outline-none border-2 focus:border-indigo-500/50 shadow-sm"}
            >
                <div className="flex flex-col items-start">
                    {label && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>}
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{selectedOption.label}</span>
                </div>
                <svg className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[150] animate-in fade-in zoom-in-95 duration-200 origin-top">
                    <div className="space-y-1">
                        {normalizedOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all flex items-center justify-between group ${
                                    value === option.value 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                    : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{option.label}</span>
                                {value === option.value && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumDropdown;
