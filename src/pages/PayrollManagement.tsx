
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { Employee, PayrollEntry } from '../types';
import CustomDatePicker from '../components/common/CustomDatePicker';

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
    if (!newEmp.name || newEmp.rate <= 0) return alert("Please fill all fields");
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
    if (filteredHistory.length === 0) return alert('No data to export');

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
    if (!selectedEmployeeId || hoursWorked <= 0 || currentRate <= 0) return alert("Verify all fields");

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
    if (window.confirm("Permanently delete this payroll record and its associated ledger transaction?")) {
      deletePayrollEntry(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Banner */}
      <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">Payroll Protocol</h2>
          <p className="text-slate-500 font-medium">Manage human capital ledger and hourly compensation.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
          {[
            { id: 'run', label: 'Process Run', icon: '⚡' },
            { id: 'employees', label: 'Team', icon: '👥' },
            { id: 'history', label: 'History', icon: '📜' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id as any)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'run' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-[48px] border border-slate-200 p-10 shadow-xl space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Resource</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => onEmployeeSelect(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.designation}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours Worked</label>
                <input
                  type="number"
                  value={hoursWorked || ''}
                  onChange={(e) => setHoursWorked(Number(e.target.value))}
                  placeholder="0.0"
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={currentRate || ''}
                  onChange={(e) => setCurrentRate(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 text-right"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Advance Recovery (Deduction)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-300 font-bold">₹</span>
                  <input
                    type="number"
                    value={advance || ''}
                    onChange={(e) => setAdvance(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-rose-50/30 border-2 border-rose-100 rounded-2xl p-5 pl-12 font-black text-rose-600 text-right focus:bg-white focus:border-rose-400 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks (Optional)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Festival bonus included"
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <button
              onClick={handleProcessPayroll}
              className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95"
            >
              Commit To Ledger & Disburse
            </button>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-10 italic">Summary Calculation</p>

              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gross Pay</span>
                  <span className="text-xl font-black italic">₹{grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">Advances</span>
                  <span className="text-xl font-black text-rose-400 italic">- ₹{advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-white text-xs font-black uppercase tracking-widest">Net Disbursable</span>
                  <span className="text-4xl font-black text-emerald-400 italic tracking-tighter">₹{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 p-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Integrity Notes</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                Processing this run will automatically generate a double-entry transaction: Debit to Salary Expense (5003) and Credit to Bank (1001) / Advance Recovery (1007).
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
              <div className="col-span-full py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100 text-center">
                <p className="text-slate-300 font-black uppercase tracking-widest">No resources onboarded yet.</p>
              </div>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {emp.name.charAt(0)}
                    </div>
                    <button onClick={() => deleteEmployee(emp.id)} className="text-slate-200 hover:text-rose-500 p-2">✕</button>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter leading-none mb-2">{emp.name}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">{emp.designation}</p>
                  <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Standard Rate</p>
                      <p className="text-lg font-black text-slate-900 tracking-tight italic">₹{emp.defaultHourlyRate}/hr</p>
                    </div>
                    <button onClick={() => { onEmployeeSelect(emp.id); setView('run'); }} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline italic">Initialize Run</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm gap-4">
            <div className="flex items-center space-x-4">
              <CustomDatePicker
                label="From"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
              />
              <CustomDatePicker
                label="To"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
              />
              {(historyStartDate || historyEndDate) && (
                <button
                  onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); }}
                  className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors ml-2"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-[48px] border border-slate-200 shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-10 py-6">Reference Date</th>
                  <th className="px-10 py-6">Employee</th>
                  <th className="px-10 py-6">Hours / Rate</th>
                  <th className="px-10 py-6 text-right">Gross Amount</th>
                  <th className="px-10 py-6 text-right">Recovery</th>
                  <th className="px-10 py-6 text-right">Net Payout</th>
                  <th className="px-10 py-6 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredHistory.length === 0 ? (
                  <tr><td colSpan={7} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-widest italic">No historical pay runs in this period.</td></tr>
                ) : (
                  filteredHistory.map(entry => {
                    const emp = employees.find(e => e.id === entry.employeeId);
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-6 text-xs font-black text-slate-400 italic uppercase tracking-widest">{entry.date}</td>
                        <td className="px-10 py-6">
                          <p className="font-black text-slate-900 uppercase italic leading-none mb-1">{emp?.name || 'Unknown'}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{emp?.designation}</p>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-xs font-black text-slate-800 tabular-nums">{entry.hoursWorked} hrs</span>
                          <span className="text-slate-300 mx-2">@</span>
                          <span className="text-[11px] font-bold text-slate-400">₹{entry.hourlyRate}</span>
                        </td>
                        <td className="px-10 py-6 text-right font-black text-slate-800 text-sm tabular-nums">
                          ₹{entry.grossAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-10 py-6 text-right font-black text-rose-500 text-sm tabular-nums">
                          {entry.advanceDeduction > 0 ? `(₹${entry.advanceDeduction.toLocaleString('en-IN')})` : '—'}
                        </td>
                        <td className="px-10 py-6 text-right font-black text-emerald-600 text-lg tabular-nums">
                          ₹{entry.netAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm group-hover:border-rose-100 border border-transparent"
                              title="Delete Payroll Record"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[110] p-6">
          <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-lg w-full animate-in zoom-in-95 duration-300 space-y-10">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Onboard Member</h3>
              <button onClick={() => setShowEmployeeForm(false)} className="text-slate-300 hover:text-slate-900">✕</button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                <input type="text" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
                <input type="text" value={newEmp.designation} onChange={e => setNewEmp({ ...newEmp, designation: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Hourly Rate (₹)</label>
                <input type="number" value={newEmp.rate || ''} onChange={e => setNewEmp({ ...newEmp, rate: Number(e.target.value) })} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-slate-900" />
              </div>
            </div>
            <button
              onClick={handleAddEmployee}
              className="w-full py-6 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all"
            >
              Register Member
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
