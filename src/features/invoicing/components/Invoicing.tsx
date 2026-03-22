
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../store';
import { Invoice, InvoiceLineItem } from '../../../types';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import PremiumSelect from '../../../components/ui/PremiumSelect';
import PremiumDropdown from '../../../components/ui/PremiumDropdown';
import PremiumModal from '../../../components/ui/PremiumModal';

type TabType = 'details' | 'items' | 'payments';

interface PaymentLine {
  id: string;
  amount: number;
  date: string;
  method: 'Bank' | 'Cash';
}

const Invoicing: React.FC = () => {
  const { invoices, addInvoice, company, addTransaction, accounts } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

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

  const [modalData, setModalData] = useState<{
    amount?: number;
    client?: string;
    reference?: string;
    date?: string;
  } | undefined>(undefined);

  const showAlert = (title: string, message: string, type: 'alert' | 'success' | 'error' = 'alert', data?: typeof modalData) => {
    setModalData(data);
    setModalConfig({ isOpen: true, title, message, type, onConfirm: undefined });
  };

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
    if (!clientName) return showAlert('Validation Error', 'Please enter client name', 'error');
    if (items.length === 0) return showAlert('Missing Data', 'Please add at least one item', 'error');

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

    setIsTransmitting(true);

    // Simulated Cinematic Transmission Protocol
    setTimeout(() => {
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

      setIsTransmitting(false);
      setShowForm(false);
      setActiveTab('details');
      setItems([]);
      setPayments([]);
      setClientName('');
      setClientWebsite('');
      
      showAlert(
        "Transmission Successful", 
        "Intelligence Protocol confirmed. Transaction successfully committed to the global ledger.", 
        "success",
        {
          amount: inv.total,
          client: inv.clientName,
          reference: inv.invoiceNumber,
          date: inv.date
        }
      );
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="text-center sm:text-left">
          <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Outstanding Revenue</p>
          <h3 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">
            ₹{invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 lg:px-10 rounded-xl lg:rounded-[20px] shadow-xl shadow-indigo-600/20 transition-all transform hover:-translate-y-1 active:scale-95 text-[10px] lg:text-xs uppercase tracking-widest whitespace-nowrap w-full sm:w-auto"
        >
          Create Invoice
        </button>
      </div>

      {/* Modern Multi-Tab Invoice Form Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-black/80 backdrop-blur-[20px] flex items-center justify-center z-[1000] p-4 lg:p-6 animate-in fade-in duration-700">
          <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-[40px] rounded-[64px] shadow-[0_80px_160px_-30px_rgba(0,0,0,0.7)] w-full max-w-4xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-1000 flex flex-col border border-white/40 dark:border-white/10 relative">
            {/* Holographic Background Elements */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-indigo-500/20 to-blue-500/0 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
            
            {/* Transmission Shield Holographic Overlay */}
            {isTransmitting && (
              <div className="absolute inset-0 z-[1001] bg-slate-950/60 backdrop-blur-[4px] flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
                   <div className="relative w-40 h-40 border-2 border-indigo-500/30 rounded-full flex items-center justify-center">
                     <div className="w-32 h-32 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-[200%] -top-full animate-[scanline_4s_linear_infinite] pointer-events-none rounded-full"></div>
                   </div>
                </div>
                <p className="mt-10 text-[12px] font-black text-white uppercase tracking-[0.5em] animate-pulse italic">Synchronizing Logic Ledger...</p>
              </div>
            )}

            {/* Modal Header */}
            <div className="px-10 pt-10 pb-4 flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">Draft Protocol</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Architecting New Billing Record</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shadow-sm border border-slate-100 dark:border-white/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="px-10 mt-6 relative z-10 overflow-x-auto no-scrollbar">
              <div className="flex bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-[24px] w-fit sm:w-full border border-white/20 dark:border-white/5 shadow-inner">
                {(['details', 'items', 'payments'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[100px] sm:min-w-0 px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/10' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content - Dynamic Tabs */}
            <div className="flex-1 p-10 overflow-y-auto min-h-[350px] relative z-10 no-scrollbar">
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Type</label>
                    <PremiumDropdown
                      value={invoiceType}
                      options={['Invoice', 'Proforma', 'Credit Note']}
                      onChange={(val) => setInvoiceType(val)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      readOnly
                      className="w-full h-14 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-5 font-black text-indigo-600 dark:text-indigo-400 outline-none italic"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Date</label>
                    <CustomDatePicker
                      value={date}
                      onChange={setDate}
                      triggerClassName="w-full h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-5 font-black text-slate-800 dark:text-white flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Client Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-5 font-black text-slate-800 dark:text-white focus:ring-8 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Client Website (Optional)</label>
                    <input
                      type="text"
                      placeholder="www.example.com"
                      value={clientWebsite}
                      onChange={(e) => setClientWebsite(e.target.value)}
                      className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-5 font-black text-slate-800 dark:text-white focus:ring-8 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 gap-4 items-end bg-white dark:bg-slate-800 p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="space-y-2">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Description</label>
                            <input
                              type="text"
                              placeholder="Service description..."
                              value={currentItem.description}
                              onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                              className="w-full h-12 lg:h-14 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl lg:rounded-2xl px-5 font-black text-slate-800 dark:text-white transition-all outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Amount (₹)</label>
                            <input
                              type="number"
                              value={currentItem.amount}
                              onChange={(e) => setCurrentItem({ ...currentItem, amount: Number(e.target.value) })}
                              className="w-full h-12 lg:h-14 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl lg:rounded-2xl px-5 font-black text-slate-800 dark:text-white transition-all outline-none"
                            />
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Due Date</label>
                        <CustomDatePicker
                          value={currentItem.dueDate}
                          onChange={(d) => setCurrentItem({ ...currentItem, dueDate: d })}
                          triggerClassName="w-full h-12 lg:h-14 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl lg:rounded-2xl px-5 font-black text-slate-800 dark:text-white flex items-center justify-between transition-all outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full h-12 lg:h-14 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all transform active:scale-95"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-[24px] lg:rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/50 dark:border-white/5">
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-right">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">No items added yet</td>
                            </tr>
                          ) : (
                            items.map(item => (
                              <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                                <td className="px-6 py-4 font-bold text-xs">{item.description}</td>
                                <td className="px-6 py-4 text-right font-bold text-xs">₹{item.unitPrice.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-medium text-[10px]">{date}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 gap-4 items-end bg-white dark:bg-slate-800 p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Amount (₹)</label>
                        <input
                          type="number"
                          value={currentPayment.amount}
                          onChange={(e) => setCurrentPayment({ ...currentPayment, amount: Number(e.target.value) })}
                          className="w-full h-12 lg:h-14 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl lg:rounded-2xl px-5 font-black text-slate-800 dark:text-white transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Payment Date</label>
                        <CustomDatePicker
                          value={currentPayment.date}
                          onChange={(d) => setCurrentPayment({ ...currentPayment, date: d })}
                          triggerClassName="w-full h-12 lg:h-14 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl lg:rounded-2xl px-5 font-black text-slate-800 dark:text-white flex items-center justify-between transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Method</label>
                        <PremiumDropdown
                          value={currentPayment.method}
                          options={['Bank', 'Cash']}
                          onChange={(val) => setCurrentPayment({ ...currentPayment, method: val as any })}
                          triggerClassName="w-full h-12 lg:h-14 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl lg:rounded-2xl px-5 font-black text-slate-800 dark:text-white flex items-center justify-between transition-all outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPayment}
                        className="w-full h-12 lg:h-14 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all transform active:scale-95"
                      >
                        Record
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-[24px] lg:rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/50 dark:border-white/5">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-right">Method</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">No payments recorded yet</td>
                            </tr>
                          ) : (
                            payments.map(p => (
                              <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                                <td className="px-6 py-4 font-bold text-xs">{p.date}</td>
                                <td className="px-6 py-4 text-right font-bold text-xs">₹{p.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-medium text-[10px]">{p.method}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 bg-white/30 dark:bg-slate-900/40 backdrop-blur-md border-t border-white/20 dark:border-white/5 flex justify-between items-center gap-4 relative z-10">
               <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap italic">Awaiting Transmission</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all border border-slate-200 dark:border-white/10 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInvoice}
                    disabled={isTransmitting}
                    className={`relative overflow-hidden px-14 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all transform active:scale-95 flex items-center gap-3 min-w-[180px] justify-center ${isTransmitting ? 'bg-slate-800 text-indigo-400 cursor-not-allowed border border-indigo-500/20' : 'bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-500 text-white shadow-slate-900/40 dark:shadow-indigo-500/40 border border-white/10'}`}
                  >
                    {isTransmitting && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 animate-progress z-0"></div>
                    )}
                    <span className="relative z-10">
                      {isTransmitting ? "Syncing..." : "Transmit Protocol"}
                    </span>
                  </button>
               </div>
            </div>
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
        data={modalData}
      />

      {/* Invoice Preview Modal */}
      {previewInvoice && createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[1000] p-6 overflow-y-auto">
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
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-12 md:p-20 shadow-2xl print:shadow-none print:p-0 min-h-screen sm:min-h-0">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-10 mb-12 lg:mb-20">
                <div className="space-y-6">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-500 flex items-center justify-center text-slate-900 text-3xl lg:text-4xl font-black italic">C</div>
                  <div className="space-y-1">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{company.legalName}</h3>
                    <p className="text-[8px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.25em] leading-relaxed">
                      MALAPPURAM, KERALA, INDIA<br />
                      GSTIN: 32AAAAA0000A1Z5 | T: +91 98765 43210
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <h2 className="text-4xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-6">Tax Invoice</h2>
                  <div className="grid grid-cols-2 gap-x-6 lg:gap-x-8 gap-y-2 text-left sm:text-right">
                    <span className="text-[8px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Number</span>
                    <span className="text-xs lg:text-sm font-black text-slate-900 dark:text-white uppercase italic">#{previewInvoice.invoiceNumber}</span>
                    <span className="text-[8px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bill Date</span>
                    <span className="text-xs lg:text-sm font-black text-slate-900 dark:text-white italic">{previewInvoice.date}</span>
                    <span className="text-[8px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Due Date</span>
                    <span className="text-xs lg:text-sm font-black text-slate-900 dark:text-white italic">{previewInvoice.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-12 lg:mb-20">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Client Detail / Bill To</p>
                <h4 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{previewInvoice.clientName}</h4>
                <p className="text-[10px] lg:text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Client ID: {previewInvoice.clientId.toUpperCase()}<br />
                  Payment Method: Net-30 Transfer
                </p>
              </div>

              {/* Items Table */}
              <div className="mb-12 lg:mb-20">
                <div className="hidden sm:grid grid-cols-12 pb-4 border-b-2 border-slate-900 dark:border-white mb-6">
                  <div className="col-span-7 text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Item Description</div>
                  <div className="col-span-1 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</div>
                  <div className="col-span-2 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Rate</div>
                  <div className="col-span-2 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Line Total</div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {previewInvoice.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 py-5 gap-4 sm:gap-0">
                      <div className="col-span-12 sm:col-span-7">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{item.description}</p>
                        <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Professional service fee for current period.</p>
                      </div>
                      <div className="col-span-4 sm:col-span-1 text-left sm:text-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                        <span className="sm:hidden text-[8px] text-slate-400 block uppercase mb-1">Qty</span>
                        {item.quantity}
                      </div>
                      <div className="col-span-4 sm:col-span-2 text-left sm:text-right text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                        <span className="sm:hidden text-[8px] text-slate-400 block uppercase mb-1">Rate</span>
                        ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-4 sm:col-span-2 text-right text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums">
                        <span className="sm:hidden text-[8px] text-slate-400 block uppercase mb-1 text-right">Total</span>
                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end pt-10 border-t-2 border-slate-900 dark:border-white">
                <div className="w-full sm:w-80 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">₹{previewInvoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax (Exempt)</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5 px-1">
                    <span className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Amount Payable</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">₹{previewInvoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-24 lg:mt-40 pt-16 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12">
                <div className="max-w-xs space-y-4 lg:space-y-6">
                  <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Notes & Policy</p>
                  <p className="text-[9px] lg:text-[10px] text-slate-400 leading-relaxed font-medium italic">
                    Please quote invoice number on all bank transfers. Payments late by more than 15 days from due date will incur 2% monthly interest.
                  </p>
                </div>
                <div className="text-left sm:text-right space-y-8 w-full sm:w-auto">
                  <div className="w-48 border-b-2 border-slate-900 dark:border-white pb-3 sm:ml-auto">
                    <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Authorized Signature</p>
                  </div>
                  <p className="text-[8px] lg:text-[9px] text-emerald-500 font-black uppercase tracking-[0.4em]">CODO AI Digital Ledger Verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Invoice List Table - Desktop Only */}
      <div className="hidden lg:block bg-white dark:bg-slate-800/50 rounded-[48px] border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <th className="px-10 py-6">Reference ID</th>
                <th className="px-10 py-6">Billable Entity</th>
                <th className="px-10 py-6">Status Flow</th>
                <th className="px-10 py-6">Due Timeline</th>
                <th className="px-10 py-6 text-right">Aggregate</th>
                <th className="px-10 py-6 text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5 text-slate-700 dark:text-slate-300">
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
                      <p className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase italic">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dated {inv.date}</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{inv.clientName}</p>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${inv.status === 'Paid' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                        }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                      Exp. {inv.dueDate}
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-900 dark:text-white text-lg tabular-nums">
                      ₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center space-x-2 font-black text-xs uppercase tracking-widest"
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

      {/* Card View - Mobile Only */}
      <div className="lg:hidden space-y-4">
        {invoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-200 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">No billing artifacts found.</p>
          </div>
        ) : (
          [...invoices].sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber)).map((inv) => (
            <div key={inv.id} className="bg-white dark:bg-slate-800 rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${inv.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'}`}>
                  {inv.status}
                </span>
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-white/5 uppercase tracking-widest italic">
                  {inv.invoiceNumber}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{inv.clientName}</h4>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Dated {inv.date}</p>
                   <span className="text-slate-200">•</span>
                   <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase italic">Due {inv.dueDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
                 <button 
                   onClick={() => setPreviewInvoice(inv)}
                   className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5"
                 >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download PDF
                 </button>
                 <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter italic">
                    ₹{inv.total.toLocaleString('en-IN')}
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Invoicing;
