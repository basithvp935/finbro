
import { Account, Transaction, TrialBalanceRow, FinancialStatementRow, AccountType } from './types';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export class AccountingEngine {
  /**
   * Calculates the current balance for every account in the chart of accounts
   * following strict double-entry netting rules within a date range.
   */
  static getTrialBalance(accounts: Account[], transactions: Transaction[], range?: DateRange): TrialBalanceRow[] {
    const balances = new Map<string, { debit: number; credit: number }>();

    // Initialize
    accounts.forEach(acc => balances.set(acc.id, { debit: 0, credit: 0 }));

    // Filter transactions by date range
    const filteredTxs = transactions.filter(tx => {
      if (!range) return true;
      const txDate = new Date(tx.date);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      return txDate >= start && txDate <= end;
    });

    // Accumulate all posted transactions
    filteredTxs.forEach(tx => {
      tx.lines.forEach(line => {
        const bal = balances.get(line.accountId);
        if (bal) {
          bal.debit += line.debit;
          bal.credit += line.credit;
        }
      });
    });

    return accounts.map(acc => {
      const b = balances.get(acc.id)!;
      const ob = acc.openingBalance || 0;

      // Calculate the Net Balance based on the account's Normal Balance type
      const rawNet = acc.normalBalance === 'Debit'
        ? (ob + (b.debit - b.credit))
        : (ob + (b.credit - b.debit));

      return {
        accountId: acc.id,
        accountName: acc.name,
        accountType: acc.type,
        targetStatement: acc.targetStatement,
        openingBalance: ob,
        debit: b.debit,
        credit: b.credit,
        rawNet: rawNet
      } as TrialBalanceRow;
    });
  }

  /**
   * Derives the Profit & Loss statement. 
   */
  static getProfitLoss(trialBalance: TrialBalanceRow[]): { rows: FinancialStatementRow[], netIncome: number } {
    const isAccounts = trialBalance.filter(b => b.targetStatement === 'Income Statement');

    const revenueAccounts = isAccounts.filter(b => b.accountType === 'Income');
    const expenseAccounts = isAccounts.filter(b => b.accountType === 'Expense');

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.rawNet, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.rawNet, 0);
    const netIncome = totalRevenue - totalExpenses;

    const rows: FinancialStatementRow[] = [
      { label: 'OPERATING REVENUE', amount: 0, isTotal: true },
      ...revenueAccounts.map(a => ({ label: a.accountName, amount: a.rawNet, indent: 1 })),
      { label: 'Total Revenue', amount: totalRevenue, isTotal: true },
      { label: '', amount: 0 },
      { label: 'OPERATING EXPENSES', amount: 0, isTotal: true },
      ...expenseAccounts.map(a => ({ label: a.accountName, amount: a.rawNet, indent: 1 })),
      { label: 'Total Operating Expenses', amount: totalExpenses, isTotal: true },
      { label: '', amount: 0 },
      { label: 'NET PROFIT / (LOSS)', amount: netIncome, isTotal: true },
    ];

    return { rows, netIncome };
  }

  /**
   * Derives the Balance Sheet. 
   */
  static getBalanceSheet(trialBalance: TrialBalanceRow[], netIncome: number, accounts: Account[]): FinancialStatementRow[] {
    const bsAccounts = trialBalance.filter(b => b.targetStatement === 'Balance Sheet');

    const assets = bsAccounts.filter(b => b.accountType === 'Asset');
    const liabilities = bsAccounts.filter(b => b.accountType === 'Liability');
    const equityAccounts = bsAccounts.filter(b => b.accountType === 'Equity');

    const totalAssets = assets.reduce((sum, acc) => sum + acc.rawNet, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.rawNet, 0);

    const totalEquity = equityAccounts.reduce((sum, tbRow) => {
      const originalAcc = accounts.find(a => a.id === tbRow.accountId);
      if (originalAcc?.normalBalance === 'Credit') {
        return sum + tbRow.rawNet;
      } else {
        return sum - tbRow.rawNet;
      }
    }, 0) + netIncome;

    return [
      { label: 'ASSETS', amount: 0, isTotal: true },
      ...assets.map(a => ({ label: a.accountName, amount: a.rawNet, indent: 1 })),
      { label: 'TOTAL ASSETS', amount: totalAssets, isTotal: true },
      { label: '', amount: 0 },
      { label: 'LIABILITIES', amount: 0, isTotal: true },
      ...liabilities.map(a => ({ label: a.accountName, amount: a.rawNet, indent: 1 })),
      { label: 'Total Liabilities', amount: totalLiabilities, isTotal: true },
      { label: '', amount: 0 },
      { label: 'EQUITY', amount: 0, isTotal: true },
      ...equityAccounts.map(a => {
        const originalAcc = accounts.find(acc => acc.id === a.accountId);
        const displayAmount = originalAcc?.normalBalance === 'Debit' ? -a.rawNet : a.rawNet;
        return { label: a.accountName, amount: displayAmount, indent: 1 };
      }),
      { label: 'Retained Earnings (P&L)', amount: netIncome, indent: 1 },
      { label: 'TOTAL EQUITY', amount: totalEquity, isTotal: true },
      { label: '', amount: 0 },
      { label: 'TOTAL LIABILITIES & EQUITY', amount: totalLiabilities + totalEquity, isTotal: true },
    ];
  }

  /**
   * Cash Flow Statement (Indirect Method)
   */
  static getCashFlow(trialBalance: TrialBalanceRow[], netIncome: number): FinancialStatementRow[] {
    // 1. Operating Activities (Adjustments to Net Income)
    const arChange = trialBalance.find(b => b.accountId === '1002')?.rawNet || 0;
    const workingCapitalAdjustments = -arChange;

    // 2. Investing Activities
    const furniture = trialBalance.find(b => b.accountId === '1003')?.rawNet || 0;
    const accessories = trialBalance.find(b => b.accountId === '1004')?.rawNet || 0;
    const investingActivities = -(furniture + accessories);

    // 3. Financing Activities
    const capital = trialBalance.find(b => b.accountId === '3001')?.rawNet || 0;
    const drawings = trialBalance.find(b => b.accountId === '3002')?.rawNet || 0;
    const borrowings = trialBalance.find(b => b.accountId === '2001')?.rawNet || 0;
    const financingActivities = capital + borrowings - drawings;

    const netChange = netIncome + workingCapitalAdjustments + investingActivities + financingActivities;

    return [
      { label: 'CASH FLOW FROM OPERATING ACTIVITIES', amount: 0, isTotal: true },
      { label: 'Net Income', amount: netIncome, indent: 1 },
      { label: 'Adjustments for Working Capital (AR)', amount: workingCapitalAdjustments, indent: 1 },
      { label: 'Net Cash from Operating Activities', amount: netIncome + workingCapitalAdjustments, isTotal: true },
      { label: '', amount: 0 },
      { label: 'CASH FLOW FROM INVESTING ACTIVITIES', amount: 0, isTotal: true },
      { label: 'Asset Purchases (Furniture/Acc)', amount: investingActivities, indent: 1 },
      { label: 'Net Cash used in Investing Activities', amount: investingActivities, isTotal: true },
      { label: '', amount: 0 },
      { label: 'CASH FLOW FROM FINANCING ACTIVITIES', amount: 0, isTotal: true },
      { label: 'Capital Contributions', amount: capital, indent: 1 },
      { label: 'Loan Proceeds', amount: borrowings, indent: 1 },
      { label: 'Less: Owner Drawings', amount: -drawings, indent: 1 },
      { label: 'Net Cash from Financing Activities', amount: financingActivities, isTotal: true },
      { label: '', amount: 0 },
      { label: 'NET INCREASE / (DECREASE) IN CASH', amount: netChange, isTotal: true },
    ];
  }

  /**
   * Calculates daily/weekly performance trends for revenue and expenses.
   */
  static getPerformanceTrend(transactions: Transaction[], range: DateRange): { name: string; revenue: number; expense: number }[] {
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const days: Record<string, { revenue: number; expense: number }> = {};

    // Initialize all days in range with 0
    let curr = new Date(start);
    while (curr <= end) {
      days[curr.toISOString().split('T')[0]] = { revenue: 0, expense: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    transactions.forEach(tx => {
      const txDateStr = tx.date;
      if (days[txDateStr]) {
        tx.lines.forEach(line => {
          // Identify Revenue (4000s) and Expense (5000s) based on account IDs or type would be better
          // But since we don't have account objects here, we use a simple heuristic or we could pass accounts
          // Let's assume Income accounts start with '4' and Expense with '5' (based on constants.ts)
          if (line.accountId.startsWith('4')) {
            days[txDateStr].revenue += (line.credit - line.debit);
          } else if (line.accountId.startsWith('5')) {
            days[txDateStr].expense += (line.debit - line.credit);
          }
        });
      }
    });

    return Object.entries(days).map(([date, vals]) => ({
      name: date.split('-').slice(1).join('/'), // MM/DD
      revenue: vals.revenue,
      expense: vals.expense
    }));
  }
}
