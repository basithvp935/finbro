
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { Invoice, InvoiceLineItem } from '../types';

type TabType = 'details' | 'items' | 'payments';

interface PaymentLine {
  id: string;
  amount: number;
  date: string;
  method: 'Bank' | 'Cash';
}

const Invoicing: React.FC = () => {
  const { invoices, addInvoice, company, addTransaction } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Details Tab State
  const [invoiceType, setInvoiceType] = useState('Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientWebsite, setClientWebsite] = useState('');

  // Items Tab State
  const [currentItem, setCurrentItem] = useState({ description: 'SASS', amount: 0, dueDate: '' });
  const [items, setItems] = useState<InvoiceLineItem[]>([]);

  // Payments Tab State
  const [currentPayment, setCurrentPayment] = useState({ amount: 0, date: '', method: 'Bank' as const });
  const [payments, setPayments] = useState<PaymentLine[]>([]);

  // Automatic Numbering Logic
  useEffect(() => {
    if (showForm) {
      const prefix = 'CODO/PKL';
      let maxNum = 0;
      invoices.forEach(inv => {
        if (inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)) {
          const parts = inv.invoiceNumber.split('/');
          const numPart = parseInt(parts[parts.length - 1]);
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        }
      });
      const startNum = maxNum === 0 ? 127 : maxNum;
      setInvoiceNumber(`${prefix}/${startNum + 1}`);
    }
  }, [showForm, invoices]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [items]);

  const handleAddItem = () => {
    if (!currentItem.description || currentItem.amount <= 0) return;
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: currentItem.description,
      quantity: 1,
      unitPrice: currentItem.amount,
      taxRate: 0
    };
    setItems([...items, newItem]);
    setCurrentItem({ description: '', amount: 0, dueDate: '' });
  };

  const handleAddPayment = () => {
    if (currentPayment.amount <= 0 || !currentPayment.date) return;
    const newPayment: PaymentLine = {
      id: Date.now().toString(),
      ...currentPayment
    };
    setPayments([...payments, newPayment]);
    setCurrentPayment({ amount: 0, date: '', method: 'Bank' });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return alert('Please enter client name');
    if (items.length === 0) return alert('Please add at least one item');

    const inv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber,
      clientId: 'c-demo',
      clientName,
      date,
      dueDate: items[0]?.description ? items[0].description : date, // Simplified for mock
      items,
      status: payments.length > 0 ? 'Paid' : 'Sent',
      subtotal: subtotal,
      taxTotal: 0,
      total: subtotal,
    };

    addInvoice(inv);

    // If payments exist, record the ledger entries for them
    payments.forEach(p => {
      addTransaction({
        id: `tx-pay-${p.id}`,
        date: p.date,
        description: `Payment for Invoice #${inv.invoiceNumber}`,
        reference: inv.invoiceNumber,
        type: 'Payment',
        status: 'Posted',
        lines: [
          { accountId: '1001', debit: p.amount, credit: 0 }, // Bank Dr
          { accountId: '1002', debit: 0, credit: p.amount }, // Debtors Cr
        ]
      });
    });

    // Reset and close
    setShowForm(false);
    setActiveTab('details');
    setItems([]);
    setPayments([]);
    setClientName('');
    setClientWebsite('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding Revenue</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
            ₹{invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-[20px] shadow-2xl shadow-indigo-600/20 transition-all transform hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest"
        >
          Create New Invoice
        </button>
      </div>

      {/* Modern Multi-Tab Invoice Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 lg:p-6">
          <div className="bg-[#f3f0f7] rounded-[24px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Modal Header */}
            <div className="px-8 pt-6 pb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-700">Create Invoice</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-900 text-xl transition-colors"
              >✕</button>
            </div>

            {/* Tabs Navigation */}
            <div className="px-8 mt-4">
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                {(['details', 'items', 'payments'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content - Dynamic Tabs */}
            <div className="flex-1 p-8 overflow-y-auto min-h-[400px]">
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Type</label>
                    <select
                      value={invoiceType}
                      onChange={(e) => setInvoiceType(e.target.value)}
                      className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                      <option>Invoice</option>
                      <option>Proforma</option>
                      <option>Credit Note</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Client Name *</label>
                    <input
                      type="text"
                      placeholder="Client company name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Client Website (Optional)</label>
                    <input
                      type="text"
                      placeholder="www.example.com"
                      value={clientWebsite}
                      onChange={(e) => setClientWebsite(e.target.value)}
                      className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5 space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Description</label>
                      <input
                        type="text"
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                        className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Amount (₹)</label>
                      <input
                        type="number"
                        value={currentItem.amount}
                        onChange={(e) => setCurrentItem({ ...currentItem, amount: Number(e.target.value) })}
                        className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Due Date</label>
                      <input
                        type="date"
                        value={currentItem.dueDate}
                        onChange={(e) => setCurrentItem({ ...currentItem, dueDate: e.target.value })}
                        className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full h-[52px] bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#ede9f3]/40 rounded-2xl overflow-hidden border border-slate-200/50">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                          <th className="px-6 py-4 text-right">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">No items added yet</td>
                          </tr>
                        ) : (
                          items.map(item => (
                            <tr key={item.id} className="border-b border-slate-200/50 text-slate-700">
                              <td className="px-6 py-4 font-bold">{item.description}</td>
                              <td className="px-6 py-4 text-right font-bold">₹{item.unitPrice.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-medium">{date}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Amount (₹)</label>
                      <input
                        type="number"
                        value={currentPayment.amount}
                        onChange={(e) => setCurrentPayment({ ...currentPayment, amount: Number(e.target.value) })}
                        className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Date</label>
                      <input
                        type="date"
                        value={currentPayment.date}
                        onChange={(e) => setCurrentPayment({ ...currentPayment, date: e.target.value })}
                        className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Method</label>
                      <select
                        value={currentPayment.method}
                        onChange={(e) => setCurrentPayment({ ...currentPayment, method: e.target.value as any })}
                        className="w-full bg-[#ede9f3] border-none rounded-xl p-3.5 text-slate-700"
                      >
                        <option>Bank</option>
                        <option>Cash</option>
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddPayment}
                        className="w-full h-[52px] bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#ede9f3]/40 rounded-2xl overflow-hidden border border-slate-200/50">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                          <th className="px-6 py-4 text-right">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">No payments recorded yet</td>
                          </tr>
                        ) : (
                          payments.map(p => (
                            <tr key={p.id} className="border-b border-slate-200/50 text-slate-700">
                              <td className="px-6 py-4 font-bold">{p.date}</td>
                              <td className="px-6 py-4 text-right font-bold">₹{p.amount.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-medium">{p.method}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-white/50 border-t border-slate-200/50 flex justify-end items-center gap-4">
              <button
                onClick={() => setShowForm(false)}
                className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all border border-slate-200/50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[200] p-6 overflow-y-auto">
          <div className="w-full max-w-4xl min-h-screen my-10 animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between mb-4 print:hidden">
              <button onClick={() => setPreviewInvoice(null)} className="text-white/50 hover:text-white flex items-center space-x-2 text-xs font-black uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span>Back to List</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-emerald-500 text-slate-900 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center space-x-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span>Download as PDF</span>
              </button>
            </div>

            {/* The Document Block */}
            <div className="bg-white p-12 md:p-24 shadow-2xl print:shadow-none print:p-0">
              {/* Document Header */}
              <div className="flex justify-between items-start mb-20">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-emerald-500 flex items-center justify-center text-slate-900 text-4xl font-black italic">C</div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">{company.legalName}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] leading-relaxed">
                      MALAPPURAM, KERALA, INDIA<br />
                      GSTIN: 32AAAAA0000A1Z5 | T: +91 98765 43210
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-6xl font-light text-slate-900 tracking-tighter uppercase italic leading-none mb-6">Tax Invoice</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</span>
                    <span className="text-sm font-black text-slate-900 uppercase italic">#{previewInvoice.invoiceNumber}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Date</span>
                    <span className="text-sm font-black text-slate-900 italic">{previewInvoice.date}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</span>
                    <span className="text-sm font-black text-slate-900 italic">{previewInvoice.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-20">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Client Detail / Bill To</p>
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{previewInvoice.clientName}</h4>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Client ID: {previewInvoice.clientId.toUpperCase()}<br />
                  Payment Method: Net-30 Transfer
                </p>
              </div>

              {/* Items Table */}
              <div className="mb-20">
                <div className="grid grid-cols-12 pb-4 border-b-2 border-slate-900 mb-6">
                  <div className="col-span-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Item Description</div>
                  <div className="col-span-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</div>
                  <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</div>
                  <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Total</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {previewInvoice.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 py-5">
                      <div className="col-span-7">
                        <p className="text-sm font-black text-slate-900 uppercase italic">{item.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Professional service fee for current period.</p>
                      </div>
                      <div className="col-span-1 text-center text-sm font-bold text-slate-600 tabular-nums">{item.quantity}</div>
                      <div className="col-span-2 text-right text-sm font-bold text-slate-600 tabular-nums">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="col-span-2 text-right text-sm font-black text-slate-900 tabular-nums">₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end pt-10 border-t-2 border-slate-900">
                <div className="w-80 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                    <span className="text-sm font-bold text-slate-800 tabular-nums">₹{previewInvoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax (Exempt)</span>
                    <span className="text-sm font-bold text-slate-800 tabular-nums">₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Amount Payable</span>
                    <span className="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">₹{previewInvoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-40 pt-16 border-t border-slate-100 flex justify-between items-end">
                <div className="max-w-xs space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Notes & Policy</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                    Please quote invoice number on all bank transfers. Payments late by more than 15 days from due date will incur 2% monthly interest.
                  </p>
                </div>
                <div className="text-right space-y-8">
                  <div className="w-48 border-b-2 border-slate-900 pb-3 ml-auto">
                    <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Authorized Signature</p>
                  </div>
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.4em]">CODO AI Digital Ledger Verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice List Table */}
      <div className="bg-white rounded-[48px] border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">Reference ID</th>
              <th className="px-10 py-6">Billable Entity</th>
              <th className="px-10 py-6">Status Flow</th>
              <th className="px-10 py-6">Due Timeline</th>
              <th className="px-10 py-6 text-right">Aggregate</th>
              <th className="px-10 py-6 text-center">Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-10 py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm italic">
                  No billing history recorded yet.
                </td>
              </tr>
            ) : (
              [...invoices].sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber)).map((inv) => (
                <tr key={inv.id} className="hover:bg-emerald-50/20 transition-all group">
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic">{inv.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dated {inv.date}</p>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-700 uppercase tracking-tight">{inv.clientName}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                    Exp. {inv.dueDate}
                  </td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 text-lg tabular-nums">
                    ₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="px-4 py-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center space-x-2 font-black text-xs uppercase tracking-widest"
                        title="View & Download PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>Download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoicing;
