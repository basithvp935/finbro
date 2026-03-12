import React, { useState, useMemo, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse initial date
    const selectedDate = useMemo(() => value ? new Date(value) : new Date(), [value]);

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
        onChange(date.toISOString().split('T')[0]);
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
        const d = new Date(dateStr);
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
                className="flex items-center space-x-3 bg-white/50 hover:bg-white px-4 py-2.5 rounded-2xl border border-slate-200 transition-all shadow-sm group"
            >
                {label && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}:</span>}
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{formatDateLabel(value)}</span>
                <svg className={`w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-4 left-0 lg:left-auto lg:right-0 z-[110] bg-white/95 backdrop-blur-2xl p-6 rounded-[32px] shadow-2xl border border-slate-200 w-[320px] animate-in zoom-in-95 fade-in duration-200 origin-top-right">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-slate-900 uppercase italic tracking-tight">
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </h4>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {daysOfWeek.map(d => (
                            <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest py-2">
                                {d}
                            </div>
                        ))}
                        {calendarDays.map((d, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleDateSelect(d.date)}
                                className={`
                  h-10 w-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all relative
                  ${!d.currentMonth ? 'text-slate-200' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'}
                  ${isSelected(d.date) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : ''}
                  ${isToday(d.date) && !isSelected(d.date) ? 'border-2 border-indigo-100' : ''}
                `}
                            >
                                {d.day}
                                {isToday(d.date) && !isSelected(d.date) && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => { setViewDate(new Date()); handleDateSelect(new Date()); }}
                            className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
