
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type NormalBalance = 'Debit' | 'Credit';
export type StatementType = 'Income Statement' | 'Balance Sheet';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  targetStatement: StatementType;
  openingBalance?: number; // Initial balance at start of period
  description?: string;
}

export interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  receipt?: string; // Reference text
}

export interface Attachment {
  name: string;
  type: string;
  url: string; // Base64 or Blob URL
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalEntryLine[];
  type: 'General' | 'Invoice' | 'Payment' | 'Receipt' | 'Payroll';
  status: 'Posted' | 'Draft';
  attachments?: (string | Attachment)[]; // Base64, URLs, or Rich Metadata
}

export interface BankStatementEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
  matchedTransactionId?: string;
  adjustedAmount?: number;
  attachedFile?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceLineItem[];
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  subtotal: number;
  taxTotal: number;
  total: number;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  defaultHourlyRate: number;
  joiningDate: string;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  date: string;
  hoursWorked: number;
  hourlyRate: number;
  grossAmount: number;
  advanceDeduction: number;
  netAmount: number;
  remarks?: string;
  status: 'Draft' | 'Paid';
}

export interface TrialBalanceRow {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  targetStatement: StatementType;
  openingBalance: number;
  debit: number;
  credit: number;
  rawNet: number; // Final Closing Balance
}

export interface FinancialStatementRow {
  label: string;
  amount: number;
  isTotal?: boolean;
  indent?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Accountant' | 'Client';
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  legalName: string;
  currency: string;
  fiscalYearEnd: string;
  logo?: string;
}
