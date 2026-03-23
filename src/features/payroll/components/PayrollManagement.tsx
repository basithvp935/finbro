
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../store';
import { Employee, PayrollEntry } from '../../../types';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import PremiumSelect from '../../../components/ui/PremiumSelect';
import PremiumModal from '../../../components/ui/PremiumModal';

const PayrollManagement: React.FC = () => {
  const { employees, payrollEntries, addEmployee, deleteEmployee, addPayrollEntry, deletePayrollEntry, company, startDate, endDate } = useApp();

  const [view, setView] = useState<'run' | 'employees' | 'history'>('run');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  // New Employee State
  const [newEmp, setNewEmp] = useState({ name: '', designation: '', rate: 0 });

  // New Payroll Run State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [hoursWorked, setHoursWorked] = useState(0);
  const [currentRate, setCurrentRate] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'success' | 'error';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showAlert = (title: string, message: string, type: 'alert' | 'success' | 'error' = 'alert') => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm: undefined });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };

  const filteredHistory = useMemo(() => {
    return payrollEntries.filter(entry => {
      const d = new Date(entry.date);
      const start = historyStartDate ? new Date(historyStartDate) : new Date('2000-01-01');
      const end = historyEndDate ? new Date(historyEndDate) : new Date('2100-01-01');
      return d >= start && d <= end;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payrollEntries, historyStartDate, historyEndDate]);

  const grossAmount = hoursWorked * currentRate;
  const netAmount = Math.max(0, grossAmount - advance);

  const handleAddEmployee = () => {
    if (!newEmp.name || newEmp.rate <= 0) return showAlert("Validation Error", "Please fill all fields", "error");
    addEmployee({
      id: `emp-${Date.now()}`,
      name: newEmp.name,
      designation: newEmp.designation,
      defaultHourlyRate: newEmp.rate,
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setNewEmp({ name: '', designation: '', rate: 0 });
    setShowEmployeeForm(false);
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return showAlert("Export Failed", "No data to export", "error");

    const headers = ['Reference Date', 'Employee', 'Designation', 'Hours Worked', 'Hourly Rate', 'Gross Amount', 'Advance Deduction', 'Net Amount', 'Status', 'Remarks'];
    const rows = filteredHistory.map(entry => {
      const emp = employees.find(e => e.id === entry.employeeId);
      return [
        entry.date,
        emp?.name || 'Unknown',
        emp?.designation || 'Unknown',
        entry.hoursWorked,
        entry.hourlyRate,
        entry.grossAmount,
        entry.advanceDeduction,
        entry.netAmount,
        entry.status,
        entry.remarks || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `payroll_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessPayroll = () => {
    if (!selectedEmployeeId || hoursWorked <= 0 || currentRate <= 0) {
      return showAlert("Verify all fields", "Please ensure employee is selected and hours/rate are valid.", "error");
    }

    addPayrollEntry({
      id: `pr-${Date.now()}`,
      employeeId: selectedEmployeeId,
      date: payDate,
      hoursWorked,
      hourlyRate: currentRate,
      grossAmount,
      advanceDeduction: advance,
      netAmount,
      remarks,
      status: 'Paid'
    });

    showAlert("Success", "Payroll has been successfully committed to the ledger and disbursed.", "success");

    // Reset
    setSelectedEmployeeId('');
    setHoursWorked(0);
    setAdvance(0);
    setRemarks('');
  };

  const onEmployeeSelect = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) setCurrentRate(emp.defaultHourlyRate);
  };

  const handleDeleteEntry = (id: string) => {
    showConfirm(
      "Confirm Deletion",
      "Permanently delete this payroll record and its associated ledger transaction?",
      () => deletePayrollEntry(id)
    );
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    showConfirm(
      "Confirm Removal",
      `Are you sure you want to remove ${name} from the Resource Directory? This action cannot be undone.`,
      () => deleteEmployee(id)
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-[24px] lg:rounded-[40px] p-6 lg:p-12 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase mb-2">Payroll Protocol</h2>
          <p className="text-[10px] lg:text-base text-slate-500 dark:text-slate-400 font-medium">Manage human capital ledger and hourly compensation.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <div className="flex shrink-0 w-full sm:w-auto">
            {[
              { id: 'run', label: 'Process', icon: '⚡' },
              { id: 'employees', label: 'Team', icon: '👥' },
              { id: 'history', label: 'History', icon: '📜' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setView(t.id as any)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${view === t.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <span className="mr-1.5 sm:mr-2">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'run' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[48px] border border-slate-200 dark:border-white/5 p-6 lg:p-10 shadow-xl space-y-8 lg:space-y-10 transition-colors duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Resource</label>
                <PremiumSelect
                  value={selectedEmployeeId}
                  options={employees.map(e => ({ id: e.id, name: e.name, type: e.designation }))}
                  onChange={onEmployeeSelect}
                  placeholder="Choose Employee..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Date</label>
                <CustomDatePicker
                  value={payDate}
                  onChange={setPayDate}
                  triggerClassName="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl lg:rounded-2xl p-4 lg:p-5 font-black text-slate-900 dark:text-white flex items-center justify-between"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hours Worked</label>
                <input
                  type="number"
                  value={hoursWorked || ''}
                  onChange={(e) => setHoursWorked(Number(e.target.value))}
                  placeholder="0.0"
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl lg:rounded-2xl p-4 lg:p-5 font-black text-slate-900 dark:text-white text-right outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rate (₹)</label>
                <input
                  type="number"
                  value={currentRate || ''}
                  onChange={(e) => setCurrentRate(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl lg:rounded-2xl p-4 lg:p-5 font-black text-slate-900 dark:text-white text-right outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-rose-500">Advance (Deduction)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-300 dark:text-rose-500/50 font-bold">₹</span>
                  <input
                    type="number"
                    value={advance || ''}
                    onChange={(e) => setAdvance(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-rose-50/30 dark:bg-rose-500/5 border-2 border-rose-100 dark:border-rose-500/20 rounded-xl lg:rounded-2xl p-4 lg:p-5 pl-12 font-black text-rose-600 dark:text-rose-400 text-right focus:bg-white dark:focus:bg-slate-800 focus:border-rose-400 dark:focus:border-rose-500 transition-all outline-none placeholder:text-rose-200 dark:placeholder:text-rose-500/30"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Festival bonus"
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl lg:rounded-2xl p-4 lg:p-5 font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
              </div>
            </div>

            <button
              onClick={handleProcessPayroll}
              className="w-full py-5 lg:py-8 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white rounded-[24px] lg:rounded-[32px] text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] shadow-2xl shadow-indigo-600/30 dark:shadow-indigo-500/10 transition-all active:scale-95"
            >
              Commit & Disburse
            </button>
          </div>

          <div className="lg:col-span-5 space-y-6 lg:space-y-8">
            <div className="bg-slate-900 dark:bg-slate-950 rounded-[32px] lg:rounded-[48px] p-6 lg:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full"></div>
              <p className="text-[9px] lg:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 lg:mb-10 italic">Summary Calculation</p>

              <div className="space-y-4 lg:space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3 lg:pb-4">
                  <span className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest">Gross Pay</span>
                  <span className="text-lg lg:text-xl font-black italic">₹{grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3 lg:pb-4">
                  <span className="text-rose-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest">Advances</span>
                  <span className="text-lg lg:text-xl font-black text-rose-400 italic">- ₹{advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-3 lg:pt-4">
                  <span className="text-white text-[10px] lg:text-xs font-black uppercase tracking-widest">Net Disbursable</span>
                  <span className="text-3xl lg:text-4xl font-black text-emerald-400 italic tracking-tighter">₹{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-[24px] lg:rounded-[40px] border border-slate-200 dark:border-white/5 p-6 lg:p-8 backdrop-blur-sm">
              <h4 className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 lg:mb-4">Integrity Notes</h4>
              <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
                Processing run generates double-entry: Debit to Salary (5003), Credit to Bank (1001) / Advance (1007).
              </p>
            </div>
          </div>
        </div>
      )}

      {view === 'employees' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Resource Directory</h3>
            <button
              onClick={() => setShowEmployeeForm(true)}
              className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
            >
              + Add Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.length === 0 ? (
              <div className="col-span-full py-20 bg-white dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-white/5 text-center">
                <p className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest">No resources onboarded yet.</p>
              </div>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="bg-white dark:bg-slate-800/50 p-8 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      {emp.name.charAt(0)}
                    </div>
                    <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="text-slate-200 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 p-2 transition-colors">✕</button>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter leading-none mb-2">{emp.name}</h4>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{emp.designation}</p>
                  <div className="pt-6 border-t border-slate-50 dark:border-white/5 flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1">Standard Rate</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight italic">₹{emp.defaultHourlyRate}/hr</p>
                    </div>
                    <button onClick={() => { onEmployeeSelect(emp.id); setView('run'); }} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline italic">Initialize Run</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-white/5 p-4 lg:p-6 shadow-sm gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center bg-slate-50 dark:bg-white/5 p-1.5 rounded-[22px] border border-slate-100 dark:border-white/5 shadow-sm w-full lg:w-auto gap-2 sm:gap-0">
              <CustomDatePicker
                label="From"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                triggerClassName="flex items-center space-x-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-[18px] border border-slate-100 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 w-full sm:w-auto"
              />
              <div className="w-10 sm:w-4 h-[2px] bg-slate-200 dark:bg-slate-700 mx-auto sm:mx-1 rounded-full shrink-0"></div>
              <CustomDatePicker
                label="To"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                triggerClassName="flex items-center space-x-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-[18px] border border-slate-100 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 w-full sm:w-auto"
              />
              {(historyStartDate || historyEndDate) && (
                <button
                  onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); }}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-2"
                  title="Reset Filter"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[48px] border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="px-10 py-6">Reference Date</th>
                    <th className="px-10 py-6">Employee</th>
                    <th className="px-10 py-6">Hours / Rate</th>
                    <th className="px-10 py-6 text-right">Gross Amount</th>
                    <th className="px-10 py-6 text-right">Recovery</th>
                    <th className="px-10 py-6 text-right">Net Payout</th>
                    <th className="px-10 py-6 text-center">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan={7} className="px-10 py-32 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest italic">No historical pay runs in this period.</td></tr>
                  ) : (
                    filteredHistory.map(entry => {
                      const emp = employees.find(e => e.id === entry.employeeId);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group">
                          <td className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-600 italic uppercase tracking-widest">{entry.date}</td>
                          <td className="px-10 py-6">
                            <p className="font-black text-slate-900 dark:text-white uppercase italic leading-none mb-1">{emp?.name || 'Unknown'}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{emp?.designation}</p>
                          </td>
                          <td className="px-10 py-6">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tabular-nums">{entry.hoursWorked} hrs</span>
                            <span className="text-slate-300 dark:text-slate-700 mx-2">@</span>
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600">₹{entry.hourlyRate}</span>
                          </td>
                          <td className="px-10 py-6 text-right font-black text-slate-800 dark:text-slate-200 text-sm tabular-nums">
                            ₹{entry.grossAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-10 py-6 text-right font-black text-rose-500 dark:text-rose-400 text-sm tabular-nums">
                            {entry.advanceDeduction > 0 ? `(₹${entry.advanceDeduction.toLocaleString('en-IN')})` : '—'}
                          </td>
                          <td className="px-10 py-6 text-right font-black text-emerald-600 dark:text-emerald-400 text-lg tabular-nums">
                            ₹{entry.netAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-10 py-6 text-center">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="w-10 h-10 inline-flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-white/5">
              {filteredHistory.length === 0 ? (
                <div className="px-6 py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest italic text-xs">No historical pay runs.</div>
              ) : (
                filteredHistory.map(entry => {
                  const emp = employees.find(e => e.id === entry.employeeId);
                  return (
                    <div key={entry.id} className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{entry.date}</p>
                          <h4 className="font-black text-slate-900 dark:text-white uppercase italic leading-none">{emp?.name || 'Unknown'}</h4>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{emp?.designation}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Rate details</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{entry.hoursWorked}h @ ₹{entry.hourlyRate}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Net Payout</p>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 italic">₹{entry.netAmount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      {showEmployeeForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[1001] p-4 lg:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[40px] shadow-2xl p-8 lg:p-12 max-w-lg w-full animate-in zoom-in-95 duration-300 space-y-8 lg:space-y-10 border border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">Onboard Member</h3>
              <button 
                onClick={() => setShowEmployeeForm(false)} 
                className="text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all bg-transparent border-none p-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 lg:space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Legal Name</label>
                <input type="text" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl lg:rounded-2xl p-4 lg:p-5 font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Designation</label>
                <input type="text" value={newEmp.designation} onChange={e => setNewEmp({ ...newEmp, designation: e.target.value })} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl lg:rounded-2xl p-4 lg:p-5 font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300" placeholder="e.g. Architect" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hourly Rate (₹)</label>
                <input type="number" value={newEmp.rate || ''} onChange={e => setNewEmp({ ...newEmp, rate: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl lg:rounded-2xl p-4 lg:p-5 font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300" placeholder="0.00" />
              </div>
            </div>
            <button
              onClick={handleAddEmployee}
              className="w-full py-5 lg:py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl lg:rounded-[24px] text-[10px] lg:text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black dark:hover:bg-slate-200 transition-all font-black"
            >
              Register Member
            </button>
          </div>
        </div>,
        document.body
      )}

      <PremiumModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default PayrollManagement;
