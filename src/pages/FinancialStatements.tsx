
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { AccountingEngine } from '../services/AccountingEngine';
import CustomDatePicker from '../components/common/CustomDatePicker';

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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm print:hidden">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
          {(['TB', 'PL', 'BS', 'CF'] as const).map(type => (
            <button
              key={type}
              onClick={() => setStatementType(type)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all duration-200 uppercase tracking-widest ${statementType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {type === 'TB' ? 'Trial' : type === 'PL' ? 'Profit' : type === 'BS' ? 'Sheet' : 'Cash'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <CustomDatePicker
              label="From"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <CustomDatePicker
              label="To"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-6 py-3.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition-all border border-emerald-100 uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Excel (CSV)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-black transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* The Report Document */}
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-[48px] overflow-hidden border border-slate-200 ring-1 ring-slate-900/5 print:shadow-none print:border-none print:rounded-none">
        <div className="p-12 md:p-24 print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-24">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-slate-900 text-4xl font-black shadow-2xl shadow-emerald-500/20 italic">
                C
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{company.legalName}</h1>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] leading-relaxed mt-4">
                  OPERATIONS HQ: MALAPPURAM, KERALA, INDIA<br />
                  REG: CODO-FIN-9922 | GSTIN: 32AAAAA0000A1Z5
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-8 border border-emerald-100">
                Audit Grade Protocol
              </div>
              <p className="text-5xl font-light text-slate-900 tracking-tighter uppercase italic leading-none">
                {getStatementTitle()}
              </p>
              <p className="text-slate-400 text-[10px] font-black mt-4 uppercase tracking-widest">Period: {startDate} — {endDate}</p>
            </div>
          </div>

          {/* Statement Content */}
          <div className="relative">
            {statementType === 'TB' ? (
              <div className="space-y-1">
                <div className="grid grid-cols-12 pb-5 border-b-2 border-slate-900 mb-8">
                  <div className="col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Portfolio</div>
                  <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modality</div>
                  <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Debit</div>
                  <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit</div>
                </div>
                {trialBalanceRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-4 px-6 hover:bg-slate-50 rounded-2xl transition-all">
                    <div className="col-span-6 flex flex-col">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{row.accountName}</span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Ref. {row.accountId}</span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.accountType}</span>
                    </div>
                    <div className="col-span-2 text-right font-black tabular-nums text-sm text-slate-800">
                      {row.drVal > 0 ? row.drVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </div>
                    <div className="col-span-2 text-right font-black tabular-nums text-sm text-slate-800">
                      {row.crVal > 0 ? row.crVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 py-10 px-6 border-t-2 border-slate-900 bg-slate-50/50 mt-12 rounded-3xl">
                  <div className="col-span-8 text-[11px] font-black text-slate-900 uppercase tracking-widest">System Integrity Aggregate</div>
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
                <div className="grid grid-cols-12 pb-5 border-b-2 border-slate-900 mb-10">
                  <div className="col-span-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Detail</div>
                  <div className="col-span-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance ({company.currency})</div>
                </div>
                <div className="space-y-2">
                  {(statementType === 'PL' ? plRows : statementType === 'BS' ? bsRows : cfRows).map((row, idx) => {
                    if (row.label === '') return <div key={idx} className="h-12" />;
                    const isSectionHeader = row.isTotal && row.amount === 0 && row.label === row.label.toUpperCase();
                    const isTotal = row.isTotal && row.label.toUpperCase().includes('TOTAL');
                    const isNet = row.isTotal && (row.label.toUpperCase().includes('NET') || row.label.toUpperCase().includes('SURPLUS'));

                    return (
                      <div key={idx} className={`grid grid-cols-12 py-4 px-6 rounded-2xl transition-all ${isSectionHeader ? 'bg-slate-50 mt-10 mb-5 border border-slate-100' : isNet ? 'bg-emerald-50 border-t-2 border-slate-900 mt-10' : 'hover:bg-slate-50'}`}>
                        <div className={`col-span-8 flex items-center ${row.indent ? 'pl-10' : ''}`}>
                          <span className={`uppercase tracking-widest ${isSectionHeader ? 'text-[11px] font-black text-slate-900 italic' : isNet ? 'text-xs font-black text-slate-900' : 'text-xs font-bold text-slate-600'}`}>{row.label}</span>
                        </div>
                        <div className="col-span-4 text-right flex flex-col justify-center">
                          <span className={`tabular-nums tracking-tighter ${isSectionHeader ? 'hidden' : isNet ? 'text-2xl font-black text-emerald-600' : 'text-sm font-black text-slate-800'}`}>
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
          <div className="mt-32 pt-16 border-t border-slate-100 flex justify-between items-end">
            <div className="text-right space-y-6 w-full">
              <div className="w-56 border-b-2 border-slate-900 pb-3 ml-auto">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Corporate Secretary</p>
              </div>
              <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em]">Codofin Intelligent Engine v2.5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatements;
