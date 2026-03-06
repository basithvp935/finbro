
import { Account, Company } from './types';

export const DEFAULT_CHART_OF_ACCOUNTS: Account[] = [
  // --- ASSETS (1000s) ---
  { id: '1001', code: '1100', name: 'BANK', type: 'Asset', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },
  { id: '1006', code: '1150', name: 'CASH IN HAND', type: 'Asset', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },
  { id: '1002', code: '1200', name: 'DEBTORS', type: 'Asset', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },
  { id: '1003', code: '1300', name: 'OFFICE FURNITURE', type: 'Asset', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },
  { id: '1004', code: '1400', name: 'ACCESORIES', type: 'Asset', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },
  { id: '1005', code: '1500', name: 'LOAN PROVIDED', type: 'Asset', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },
  { id: '1007', code: '1700', name: 'SALARY ADVANCE', type: 'Asset', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },

  // --- LIABILITIES (2000s) ---
  { id: '2001', code: '2100', name: 'BORROWINGS', type: 'Liability', normalBalance: 'Credit', targetStatement: 'Balance Sheet' },
  { id: '2002', code: '2200', name: 'SALARY OUTSTANDING', type: 'Liability', normalBalance: 'Credit', targetStatement: 'Balance Sheet' },
  { id: '2003', code: '2300', name: 'WORK IN PROGRESS', type: 'Liability', normalBalance: 'Credit', targetStatement: 'Balance Sheet' },

  // --- EQUITY (3000s) ---
  { id: '3001', code: '3100', name: 'CAPITAL', type: 'Equity', normalBalance: 'Credit', targetStatement: 'Balance Sheet' },
  { id: '3002', code: '3200', name: 'DRAWINGS', type: 'Equity', normalBalance: 'Debit', targetStatement: 'Balance Sheet' },

  // --- INCOME (4000s) ---
  { id: '4001', code: '4100', name: 'CLIENT INCOME', type: 'Income', normalBalance: 'Credit', targetStatement: 'Income Statement' },
  { id: '4002', code: '4200', name: 'OTHER INCOME', type: 'Income', normalBalance: 'Credit', targetStatement: 'Income Statement' },

  // --- EXPENSES (5000s) ---
  { id: '5001', code: '5100', name: 'CLIENT EXPENSES', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5002', code: '5200', name: 'RENT', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5003', code: '5300', name: 'SALARY', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5004', code: '5400', name: 'ELECTRICITY', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5005', code: '5500', name: 'FOOD AND TA', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5006', code: '5600', name: 'REPAIR AND MAINTENCE', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5007', code: '5700', name: 'PRINTING AND STATIONARY', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5008', code: '5800', name: 'KOCHI EXPENSE', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5009', code: '5900', name: 'OFFICE EXPENSES', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5010', code: '6000', name: 'IFTAR EXPENSES', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5011', code: '6100', name: 'LEGAL FEES', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5012', code: '6200', name: 'ROOM RENT', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5013', code: '6300', name: 'EMPLOYEE ENTERTAINMENT', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5014', code: '6400', name: 'BAD DEBT', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5015', code: '6500', name: 'COMMISION PAID', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5016', code: '6600', name: 'REGISTERATION FEES', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5017', code: '6700', name: 'CHARGES AND FEES', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5018', code: '6800', name: 'CODO ADS', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5019', code: '6900', name: 'ACADEMY EXPENSE', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5020', code: '7000', name: 'PREMIUM EXPENSE', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
  { id: '5021', code: '7100', name: 'ROUND OFF', type: 'Expense', normalBalance: 'Debit', targetStatement: 'Income Statement' },
];

export const MOCK_COMPANY: Company = {
  id: 'c1',
  name: 'CODO AI',
  legalName: 'CODO AI INNOVATIONS',
  currency: 'INR',
  fiscalYearEnd: '03-31',
};
