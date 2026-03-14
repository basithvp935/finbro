
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Transaction, Invoice, Company, User, BankStatementEntry, Employee, PayrollEntry } from '../types';
import { DEFAULT_CHART_OF_ACCOUNTS, MOCK_COMPANY } from '../constants';

interface DeletionAudit {
  timestamp: string;
  transactionId: string;
  reference: string;
  user: string;
  reason?: string;
}

interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  invoices: Invoice[];
  bankEntries: BankStatementEntry[];
  employees: Employee[];
  payrollEntries: PayrollEntry[];
  company: Company;
  user: User | null;
  auditLog: DeletionAudit[];
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  addTransaction: (tx: Transaction) => void;
  addTransactions: (txs: Transaction[]) => void;
  deleteTransaction: (id: string, reason?: string) => void;
  reverseTransaction: (id: string, reason?: string) => void;
  addInvoice: (inv: Invoice) => void;
  addEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  addPayrollEntry: (entry: PayrollEntry) => void;
  deletePayrollEntry: (id: string) => void;
  updateOpeningBalance: (accountId: string, amount: number) => void;
  setBankEntries: React.Dispatch<React.SetStateAction<BankStatementEntry[]>>;
  updateBankEntry: (id: string, updates: Partial<BankStatementEntry>) => void;
  login: (email: string) => void;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Professional Bank Statement Simulation
const MOCK_BANK_STATEMENT: BankStatementEntry[] = [
  { id: 'bs-101', date: '2024-03-10', description: 'OFFICE RENT - MAR 2024', reference: 'RENT-TRANSFER-01', amount: -25000 },
  { id: 'bs-102', date: '2024-03-12', description: 'INVOICE SETTLEMENT - CLIENT A', reference: 'PAY-REF-128', amount: 150000 },
  { id: 'bs-103', date: '2024-03-15', description: 'ELECTRICITY BILL PKL', reference: 'UTIL-9921', amount: -4200 },
  { id: 'bs-104', date: new Date().toISOString().split('T')[0], description: 'SYSTEM PAYROLL DISBURSEMENT', reference: 'PR-AUTO-GEN', amount: -15000 },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_CHART_OF_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [bankEntries, setBankEntries] = useState<BankStatementEntry[]>(MOCK_BANK_STATEMENT);
  const [company] = useState<Company>(MOCK_COMPANY);
  const [user, setUser] = useState<User | null>(null);
  const [auditLog, setAuditLog] = useState<DeletionAudit[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const firstDay = thirtyDaysAgo.toLocaleDateString('en-CA');
  const lastDay = today.toLocaleDateString('en-CA');

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  /**
   * Real-Time Auto-Reconciliation Engine
   */
  const autoReconcile = useCallback((tx: Transaction) => {
    setBankEntries(prev => prev.map(entry => {
      if (entry.matchedTransactionId) return entry;
      const bankLine = tx.lines.find(l => l.accountId === '1001');
      if (!bankLine) return entry;
      const netBankImpact = bankLine.debit - bankLine.credit;
      if (entry.date === tx.date && Math.abs(entry.amount - netBankImpact) < 0.01) {
        return { ...entry, matchedTransactionId: tx.id };
      }
      return entry;
    }));
  }, []);

  useEffect(() => {
    const savedAccounts = localStorage.getItem('ledger_accounts');
    const savedTxs = localStorage.getItem('ledger_transactions');
    const savedEmps = localStorage.getItem('ledger_employees');
    const savedPR = localStorage.getItem('ledger_payroll');
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark' | null;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    if (savedAccounts) {
      const parsed = JSON.parse(savedAccounts) as Account[];
      // Migration: Ensure CASH IN HAND exists even for existing sessions
      if (!parsed.find(a => a.name.toUpperCase() === 'CASH IN HAND')) {
        const cashAcc = DEFAULT_CHART_OF_ACCOUNTS.find(a => a.name.toUpperCase() === 'CASH IN HAND');
        if (cashAcc) parsed.push(cashAcc);
      }
      setAccounts(parsed);
    }
    if (savedTxs) setTransactions(JSON.parse(savedTxs));
    if (savedEmps) setEmployees(JSON.parse(savedEmps));
    if (savedPR) setPayrollEntries(JSON.parse(savedPR));

    setUser({ id: 'u1', name: 'Admin Accountant', email: 'admin@codofin.com', role: 'Admin', companyId: 'c1' });
  }, []);

  useEffect(() => {
    localStorage.setItem('ledger_accounts', JSON.stringify(accounts));
    localStorage.setItem('ledger_transactions', JSON.stringify(transactions));
    localStorage.setItem('ledger_employees', JSON.stringify(employees));
    localStorage.setItem('ledger_payroll', JSON.stringify(payrollEntries));
  }, [accounts, transactions, employees, payrollEntries]);

  const addAccount = (account: Account) => {
    setAccounts(prev => [...prev, account]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const updateBankEntry = (id: string, updates: Partial<BankStatementEntry>) => {
    setBankEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry));
  };

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => [...prev, tx]);
    autoReconcile(tx);
  }, [autoReconcile]);

  const addTransactions = useCallback((txs: Transaction[]) => {
    setTransactions(prev => [...prev, ...txs]);
    txs.forEach(tx => autoReconcile(tx));
  }, [autoReconcile]);

  const updateOpeningBalance = (accountId: string, amount: number) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, openingBalance: amount } : acc));
  };

  const deleteTransaction = (id: string, reason?: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      setAuditLog(prev => [{
        timestamp: new Date().toISOString(),
        transactionId: id,
        reference: tx.reference || 'N/A',
        user: 'Admin Accountant',
        reason: reason || 'Manual Deletion'
      }, ...prev]);
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    setBankEntries(prev => prev.map(e => e.matchedTransactionId === id ? { ...e, matchedTransactionId: undefined } : e));
  };

  const reverseTransaction = (id: string, reason?: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const rev: Transaction = {
      ...tx,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `REVERSAL: ${tx.description}`,
      lines: tx.lines.map(l => ({ ...l, debit: l.credit, credit: l.debit }))
    };
    addTransaction(rev);
  };

  const addInvoice = (inv: Invoice) => {
    setInvoices(prev => [...prev, inv]);
    addTransaction({
      id: `tx-${inv.id}`,
      date: inv.date,
      description: `Invoice Service #${inv.invoiceNumber}`,
      type: 'Invoice',
      status: 'Posted',
      lines: [
        { accountId: '1002', debit: inv.total, credit: 0 },
        { accountId: '4001', debit: 0, credit: inv.total }
      ]
    });
  };

  const addEmployee = (emp: Employee) => setEmployees(prev => [...prev, emp]);
  const deleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setAuditLog(prev => [{
        timestamp: new Date().toISOString(),
        transactionId: id,
        reference: `EMP: ${emp.name}`,
        user: 'Admin Accountant',
        reason: 'Employee Termination'
      }, ...prev]);
    }
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const addPayrollEntry = (entry: PayrollEntry) => {
    setPayrollEntries(prev => [...prev, entry]);
    const employee = employees.find(e => e.id === entry.employeeId);
    addTransaction({
      id: `tx-pr-${entry.id}`,
      date: entry.date,
      description: `Payroll: ${employee?.name} (Net Payout)`,
      type: 'Payroll',
      status: 'Posted',
      lines: [
        { accountId: '5003', debit: entry.grossAmount, credit: 0 },
        ...(entry.advanceDeduction > 0 ? [{ accountId: '1007', debit: 0, credit: entry.advanceDeduction }] : []),
        { accountId: '1001', debit: 0, credit: entry.netAmount }
      ]
    });
  };

  const deletePayrollEntry = (id: string) => {
    setPayrollEntries(prev => prev.filter(e => e.id !== id));
    deleteTransaction(`tx-pr-${id}`);
  };

  const login = (email: string) => setUser({ id: 'u1', name: 'Admin Accountant', email, role: 'Admin', companyId: 'c1' });
  const logout = () => setUser(null);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('app_theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      accounts, transactions, invoices, bankEntries, employees, payrollEntries, company, user, auditLog,
      startDate, endDate, setStartDate, setEndDate,
      setAccounts, addAccount, updateAccount, deleteAccount, setTransactions, setInvoices, addTransaction, addTransactions, deleteTransaction, reverseTransaction,
      addInvoice, addEmployee, deleteEmployee, addPayrollEntry, deletePayrollEntry, updateOpeningBalance, setBankEntries, updateBankEntry,
      login, logout, theme, toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
