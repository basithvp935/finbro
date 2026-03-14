
import React, { useMemo } from 'react';
import { useApp } from '../../../store';
import { AccountingEngine } from '../../../services/AccountingEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import AIDashboardInsights from './AIDashboardInsights';

const Dashboard: React.FC = () => {
  const { accounts, transactions, startDate, endDate, setStartDate, setEndDate } = useApp();

  const trialBalance = useMemo(() =>
    AccountingEngine.getTrialBalance(accounts, transactions, { startDate, endDate }),
    [accounts, transactions, startDate, endDate]);

  const { netIncome } = useMemo(() => AccountingEngine.getProfitLoss(trialBalance), [trialBalance]);

  // Calculate metrics based on Filtered Trial Balance
  const totalRevenue = useMemo(() => trialBalance
    .filter(b => b.accountType === 'Income')
    .reduce((sum, b) => sum + b.rawNet, 0), [trialBalance]);

  const totalExpenses = useMemo(() => trialBalance
    .filter(b => b.accountType === 'Expense')
    .reduce((sum, b) => sum + b.rawNet, 0), [trialBalance]);

  const bankBalance = useMemo(() => trialBalance
    .filter(b => b.accountId === '1001' || b.accountName.includes('BANK'))
    .reduce((sum, b) => sum + b.rawNet, 0), [trialBalance]);

  const arBalance = trialBalance.find(b => b.accountId === '1002')?.rawNet || 0;

  const performanceTrend = useMemo(() =>
    AccountingEngine.getPerformanceTrend(transactions, { startDate, endDate }),
    [transactions, startDate, endDate]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const expenseComposition = useMemo(() => {
    return trialBalance
      .filter(b => b.accountType === 'Expense' && b.rawNet > 0)
      .map(b => ({ name: b.accountName, value: b.rawNet }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [trialBalance]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Date Context Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white dark:bg-slate-900 px-5 lg:px-8 py-4 lg:py-5 rounded-[24px] lg:rounded-[32px] border border-slate-200/60 dark:border-white/5 shadow-sm gap-4 lg:gap-6 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap leading-none">Global Feed Period</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-3">
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
        <div className="text-[9px] lg:text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg uppercase tracking-widest w-fit">Live Ledger Feed</div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Operating Revenue', value: totalRevenue, icon: '📈', color: 'emerald', trend: '+12.5%' },
          { label: 'Operating Expenses', value: totalExpenses, icon: '📉', color: 'rose', trend: '-2.1%' },
          { label: 'Bank Liquidity', value: bankBalance, icon: '🏦', color: 'indigo', trend: 'Stable' },
          { label: 'Net Period Income', value: netIncome, icon: '💰', color: 'emerald', trend: '+5.4%' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 dark:hover:shadow-indigo-500/10 transition-all group">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center text-lg lg:text-xl ${
                kpi.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                kpi.color === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' :
                'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
              } group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
                {kpi.icon}
              </div>
              <span className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">{kpi.trend}</span>
            </div>
            <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
              ₹{kpi.value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* AI Insights Section */}
      <AIDashboardInsights
        totalRevenue={totalRevenue}
        totalExpenses={totalExpenses}
        netIncome={netIncome}
        bankBalance={bankBalance}
        startDate={startDate}
        endDate={endDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Graph */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden transition-colors duration-300">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 lg:mb-12">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Performance Vector</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Cash Flow vs Burn Analysis</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
              <div className="flex items-center bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                <div className="flex shrink-0">
                  {[
                    { label: '7D', days: 7 },
                    { label: '30D', days: 30 },
                    { label: '90D', days: 90 },
                    { label: 'YTD', special: 'ytd' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        const end = new Date();
                        let start = new Date();
                        if (preset.special === 'ytd') {
                          start = new Date(end.getFullYear(), 0, 1);
                        } else {
                          start.setDate(end.getDate() - (preset.days || 0));
                        }
                        setStartDate(start.toISOString().split('T')[0]);
                        setEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 text-slate-400 whitespace-nowrap"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1 rounded-xl lg:rounded-[1.25rem] border border-slate-100/50 dark:border-white/5 shadow-sm shrink-0">
                <CustomDatePicker
                  label="F"
                  value={startDate}
                  onChange={setStartDate}
                  triggerClassName="flex items-center space-x-2 bg-white dark:bg-slate-800/50 px-3 py-2 rounded-lg lg:rounded-xl border border-slate-100 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                />
                <span className="text-slate-200 font-bold hidden xs:inline">—</span>
                <CustomDatePicker
                  label="T"
                  value={endDate}
                  onChange={setEndDate}
                  triggerClassName="flex items-center space-x-2 bg-white dark:bg-slate-800/50 px-3 py-2 rounded-lg lg:rounded-xl border border-slate-100 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                />
              </div>

              <div className="flex space-x-4 lg:space-x-6 shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/20"></div>
                  <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest">Inflow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest">Outflow</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '20px' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={20} />
                <Bar dataKey="expense" fill="#e2e8f0" radius={[8, 8, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Composition Chart */}
        <div className="lg:col-span-4 bg-slate-900 p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[80px]"></div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Burn Composition</h3>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-6 lg:mb-10">Primary Expense Allocation</p>

          <div className="h-40 lg:h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseComposition} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                  {expenseComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">Total Burn</p>
              <p className="text-base lg:text-xl font-black text-white italic">₹{(totalExpenses / 1000).toFixed(1)}k</p>
            </div>
          </div>

          <div className="space-y-4 mt-8 lg:mt-12">
            {expenseComposition.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-xl lg:rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors truncate max-w-[100px] sm:max-w-none">{item.name}</span>
                </div>
                <span className="text-[10px] lg:text-xs font-black text-white italic whitespace-nowrap ml-2">
                  ₹{item.value.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border border-slate-200 dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Recent Activity Stream</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">latest auditable ledger commits</p>
          </div>
          <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 italic font-black text-[9px] lg:text-[10px] text-slate-400 uppercase tracking-widest w-fit">
            Automatic Sync Enabled
          </div>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No activity detected in local storage</p>
            </div>
          ) : (
            recentTransactions.map(tx => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-slate-50/50 dark:bg-white/5 rounded-2xl lg:rounded-3xl border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all group gap-4">
                <div className="flex items-center space-x-4 lg:space-x-6">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-[10px] lg:text-sm font-black shrink-0 ${
                    tx.type === 'Receipt' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' :
                    tx.type === 'Payment' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600' :
                    'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600'
                  }`}>
                    {tx.type === 'Receipt' ? 'RC' : tx.type === 'Payment' ? 'PY' : 'JV'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xs lg:text-base text-slate-900 dark:text-white uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors truncate">{tx.description}</p>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3 mt-1">
                      <span className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.date}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="text-[8px] lg:text-[10px] font-black text-indigo-400 uppercase tracking-widest truncate">{tx.reference}</span>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tighter italic">
                    ₹{tx.lines.reduce((sum, l) => sum + l.debit, 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
