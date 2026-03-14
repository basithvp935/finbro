import React, { useState, useMemo, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    triggerClassName?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, label, triggerClassName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse initial date (avoiding UTC offset issues)
    const selectedDate = useMemo(() => {
        if (!value) return new Date();
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }, [value]);

    // UI State for the calendar view (might be different from selected date)
    const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    // Generate days for the current month view
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        // Previous month's padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }

        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }

        // Next month's padding
        const remaining = 42 - days.length; // 6 rows of 7 days
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }

        return days;
    }, [viewDate]);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDateLabel = (dateStr: string) => {
        if (!dateStr) return 'Select Date';
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={triggerClassName || "flex items-center space-x-2 sm:space-x-3 bg-white/40 dark:bg-white/5 backdrop-blur-md hover:bg-white/60 dark:hover:bg-white/10 px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl border border-white/20 dark:border-white/10 transition-all shadow-sm group active:scale-95 ring-1 ring-black/5"}
            >
                {label && <span className="text-[8px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">{label}</span>}
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] sm:text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-[0.15em] italic whitespace-nowrap">{formatDateLabel(value)}</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 transition-all duration-300">
                        <svg className={`w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 group-hover:text-white transition-transform duration-500 ${isOpen ? 'rotate-180 scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+20px)] left-0 z-[150] animate-in fade-in slide-in-from-top-6 duration-500 origin-top">
                    <div className="relative">
                        <div className="bg-white/80 dark:bg-slate-950/90 backdrop-blur-3xl p-7 rounded-[48px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] border border-white/40 dark:border-white/5 w-[330px] ring-1 ring-black/5 overflow-hidden">
                            {/* Decorative Background Elements */}
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>

                            <div className="relative flex items-center justify-between mb-8">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.4em]">CODIFIN OS</span>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                                        {monthNames[viewDate.getMonth()]} <span className="text-indigo-600/30 dark:text-indigo-500/20">{viewDate.getFullYear()}</span>
                                    </h4>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="w-10 h-10 flex items-center justify-center rounded-[18px] bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-sm border border-slate-100 dark:border-white/5"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="w-10 h-10 flex items-center justify-center rounded-[18px] bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-sm border border-slate-100 dark:border-white/5"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="relative grid grid-cols-7 gap-1.5 mb-6">
                                {daysOfWeek.map(d => (
                                    <div key={d} className="text-center text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] py-3">
                                        {d}
                                    </div>
                                ))}
                                {calendarDays.map((d, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleDateSelect(d.date)}
                                        className={`
                                            h-9 w-9 rounded-[14px] flex items-center justify-center text-[10px] font-black transition-all relative group/day
                                            ${!d.currentMonth ? 'text-slate-200 dark:text-slate-800 opacity-50' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:scale-110 hover:text-indigo-600 dark:hover:text-indigo-400'}
                                            ${isSelected(d.date) ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xl shadow-slate-900/40 dark:shadow-indigo-500/20 scale-110 !text-white z-10' : ''}
                                            ${isToday(d.date) && !isSelected(d.date) ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10' : ''}
                                        `}
                                    >
                                        {d.day}
                                        {isToday(d.date) && !isSelected(d.date) && (
                                            <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></div>
                                        )}
                                        {isSelected(d.date) && (
                                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 ring-2 ring-emerald-500/10 animate-pulse"></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="relative pt-7 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => { setViewDate(new Date()); handleDateSelect(new Date()); }}
                                    className="px-6 py-3 rounded-[16px] bg-indigo-50 dark:bg-indigo-500/10 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] hover:bg-indigo-600 dark:hover:bg-indigo-700 hover:text-white transition-all active:scale-95 shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                                >
                                    Jump to Sequence
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] hover:text-rose-500 dark:hover:text-rose-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                        {/* Premium Structural Caret */}
                        <div className="w-5 h-5 bg-white dark:bg-slate-950 rotate-45 absolute -top-2.5 left-10 border-l border-t border-white dark:border-white/5 shadow-[-5px_-5px_10px_rgba(0,0,0,0.02)] z-[-1]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
