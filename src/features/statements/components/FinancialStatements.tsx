
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../store';
import { AccountingEngine } from '../../../services/AccountingEngine';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import logo from '../../../components/@logo2.webp';

type StatementType = 'PL' | 'BS' | 'TB' | 'CF';

const FinancialStatements: React.FC = () => {
  const { accounts, transactions, company, startDate, endDate, setStartDate, setEndDate } = useApp();
  const [statementType, setStatementType] = useState<StatementType>('PL');

  const trialBalance = useMemo(() =>
    AccountingEngine.getTrialBalance(accounts, transactions, { startDate, endDate }),
    [accounts, transactions, startDate, endDate]);

  const { rows: plRows, netIncome } = useMemo(() => AccountingEngine.getProfitLoss(trialBalance), [trialBalance]);
  const bsRows = useMemo(() => AccountingEngine.getBalanceSheet(trialBalance, netIncome, accounts), [trialBalance, netIncome, accounts]);
  const cfRows = useMemo(() => AccountingEngine.getCashFlow(trialBalance, netIncome), [trialBalance, netIncome]);

  const getStatementTitle = () => {
    switch (statementType) {
      case 'PL': return 'Profit & Loss';
      case 'BS': return 'Balance Sheet';
      case 'TB': return 'Trial Balance';
      case 'CF': return 'Cash Flow Statement';
    }
  };

  const { trialBalanceTotals, trialBalanceRows } = useMemo(() => {
    let drTotal = 0;
    let crTotal = 0;

    const rows = trialBalance.map(row => {
      const acc = accounts.find(a => a.id === row.accountId);
      const isDrNormal = acc?.normalBalance === 'Debit';

      // Calculate display Dr/Cr values
      // If it's a Debit normal account, rawNet > 0 is Debit, rawNet < 0 is Credit (absolute)
      // If it's a Credit normal account, rawNet > 0 is Credit, rawNet < 0 is Debit (absolute)
      let drVal = 0;
      let crVal = 0;

      if (isDrNormal) {
        if (row.rawNet >= 0) drVal = row.rawNet;
        else crVal = Math.abs(row.rawNet);
      } else {
        if (row.rawNet >= 0) crVal = row.rawNet;
        else drVal = Math.abs(row.rawNet);
      }

      drTotal += drVal;
      crTotal += crVal;

      return { ...row, drVal, crVal };
    }).filter(row => row.drVal !== 0 || row.crVal !== 0);

    return {
      trialBalanceTotals: { dr: drTotal, cr: crTotal },
      trialBalanceRows: rows
    };
  }, [trialBalance, accounts]);

  const handleExportExcel = () => {
    let csvData: string[][] = [];
    const filename = `${company.name}_${getStatementTitle().replace(/\s+/g, '_')}_${endDate}.csv`;

    if (statementType === 'TB') {
      csvData.push(['Account Name', 'Code', 'Type', 'Debit', 'Credit']);
      trialBalanceRows.forEach(row => {
        csvData.push([row.accountName, row.accountId, row.accountType, row.drVal.toString(), row.crVal.toString()]);
      });
      csvData.push(['TOTAL', '', '', trialBalanceTotals.dr.toString(), trialBalanceTotals.cr.toString()]);
    } else {
      const activeRows = statementType === 'PL' ? plRows : statementType === 'BS' ? bsRows : cfRows;
      csvData.push(['Description', 'Amount']);
      activeRows.forEach(row => {
        if (row.label !== '') {
          csvData.push([row.label, row.amount.toString()]);
        }
      });
    }

    const csvContent = csvData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Executive Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm print:hidden transition-colors duration-300">
        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <div className="flex shrink-0 w-full sm:w-auto">
            {(['TB', 'PL', 'BS', 'CF'] as const).map(type => (
              <button
                key={type}
                onClick={() => setStatementType(type)}
                className={`flex-1 sm:flex-none px-4 lg:px-6 py-3 rounded-xl text-[9px] lg:text-[10px] font-black transition-all duration-200 uppercase tracking-widest ${statementType === type ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {type === 'TB' ? 'Trial' : type === 'PL' ? 'Profit' : type === 'BS' ? 'Sheet' : 'Cash'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-4">
            <CustomDatePicker
              label="F"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <CustomDatePicker
              label="T"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 lg:px-6 py-3.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[9px] lg:text-[10px] font-black hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest"
            >
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 lg:px-6 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] lg:text-[10px] font-black hover:bg-black dark:hover:bg-indigo-700 transition-all shadow-xl shadow-slate-900/10 dark:shadow-indigo-500/10 uppercase tracking-widest"
            >
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* The Report Document */}
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-[32px] lg:rounded-[48px] overflow-hidden border border-slate-200 dark:border-white/5 ring-1 ring-slate-900/5 print:shadow-none print:border-none print:rounded-none transition-all duration-300">
        <div className="p-6 md:p-12 lg:p-24 print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-12 lg:mb-24 gap-8">
            <div className="space-y-4 lg:space-y-6">
              <div>
                <img src={logo} alt="Codofin Logo" className="h-12 lg:h-20 w-auto object-contain mb-4 lg:mb-6" />
                <div className="text-[8px] lg:text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] lg:leading-relaxed">
                  OPERATIONS HQ: MALAPPURAM, KERALA, INDIA<br className="hidden lg:block" />
                  REG: CODO-FIN-9922 | GSTIN: 32AAAAA0000A1Z5
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="inline-block px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] lg:text-[10px] font-black uppercase tracking-widest mb-4 lg:mb-8 border border-emerald-100 dark:border-emerald-500/20">
                Audit Grade Protocol
              </div>
              <p className="text-3xl lg:text-5xl font-light text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                {getStatementTitle()}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-[9px] lg:text-[10px] font-black mt-3 lg:mt-4 uppercase tracking-widest">Period: {startDate} — {endDate}</p>
            </div>
          </div>

          {/* Statement Content */}
          <div className="relative overflow-x-auto no-scrollbar">
            {statementType === 'TB' ? (
              <div className="space-y-1 min-w-[800px]">
                <div className="grid grid-cols-12 pb-5 border-b-2 border-slate-900 dark:border-white mb-8">
                  <div className="col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Portfolio</div>
                  <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modality</div>
                  <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Debit</div>
                  <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit</div>
                </div>
                {trialBalanceRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-4 px-6 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                    <div className="col-span-6 flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{row.accountName}</span>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ref. {row.accountId}</span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.accountType}</span>
                    </div>
                    <div className="col-span-2 text-right font-black tabular-nums text-sm text-slate-800 dark:text-slate-200">
                      {row.drVal > 0 ? row.drVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </div>
                    <div className="col-span-2 text-right font-black tabular-nums text-sm text-slate-800 dark:text-slate-200">
                      {row.crVal > 0 ? row.crVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 py-10 px-6 border-t-2 border-slate-900 dark:border-white bg-slate-50/50 dark:bg-white/5 mt-12 rounded-3xl">
                  <div className="col-span-8 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">System Integrity Aggregate</div>
                  <div className="col-span-2 text-right font-black tabular-nums text-xl text-emerald-600">
                    {company.currency}{trialBalanceTotals.dr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-2 text-right font-black tabular-nums text-xl text-emerald-600">
                    {company.currency}{trialBalanceTotals.cr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 pb-5 border-b-2 border-slate-900 dark:border-white mb-10 min-w-[600px]">
                  <div className="col-span-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Detail</div>
                  <div className="col-span-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance ({company.currency})</div>
                </div>
                <div className="space-y-2 min-w-[600px]">
                  {(statementType === 'PL' ? plRows : statementType === 'BS' ? bsRows : cfRows).map((row, idx) => {
                    if (row.label === '') return <div key={idx} className="h-12" />;
                    const isSectionHeader = row.isTotal && row.amount === 0 && row.label === row.label.toUpperCase();
                    const isTotal = row.isTotal && row.label.toUpperCase().includes('TOTAL');
                    const isNet = row.isTotal && (row.label.toUpperCase().includes('NET') || row.label.toUpperCase().includes('SURPLUS'));

                    return (
                      <div key={idx} className={`grid grid-cols-12 py-4 px-6 rounded-2xl transition-all ${isSectionHeader ? 'bg-slate-50 dark:bg-white/5 mt-10 mb-5 border border-slate-100 dark:border-white/5' : isNet ? 'bg-emerald-50 dark:bg-emerald-500/10 border-t-2 border-slate-900 dark:border-white mt-10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                        <div className={`col-span-8 flex items-center ${row.indent ? 'pl-10' : ''}`}>
                          <span className={`uppercase tracking-widest ${isSectionHeader ? 'text-[11px] font-black text-slate-900 dark:text-white italic' : isNet ? 'text-xs font-black text-slate-900 dark:text-white' : 'text-xs font-bold text-slate-600 dark:text-slate-400'}`}>{row.label}</span>
                        </div>
                        <div className="col-span-4 text-right flex flex-col justify-center">
                          <span className={`tabular-nums tracking-tighter ${isSectionHeader ? 'hidden' : isNet ? 'text-2xl font-black text-emerald-600 dark:text-emerald-400' : 'text-sm font-black text-slate-800 dark:text-slate-200'}`}>
                            {row.amount < 0 ? `(${Math.abs(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })})` : row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Verification & Footnotes */}
          <div className="mt-32 pt-16 border-t border-slate-100 dark:border-white/10 flex justify-between items-end">
            <div className="text-right space-y-6 w-full">
              <div className="w-56 border-b-2 border-slate-900 dark:border-white pb-3 ml-auto">
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Corporate Secretary</p>
              </div>
              <p className="text-[9px] text-emerald-500 dark:text-emerald-400 font-black uppercase tracking-[0.3em]">Codofin Intelligent Engine v2.5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatements;
