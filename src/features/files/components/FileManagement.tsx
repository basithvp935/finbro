
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../store';

interface FileSystemItem {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'image' | 'video';
    parentId: string | null;
    createdAt: string;
    size?: string;
    url?: string; // For media assets
}

const FileManagement: React.FC = () => {
    const { setAccounts, setTransactions, setInvoices, setEmployees, setPayrollEntries } = useApp();
    const [items, setItems] = useState<FileSystemItem[]>([
        { id: 'f1', name: 'Financial Year 2023-24', type: 'folder', parentId: null, createdAt: '2023-04-01' },
        { id: 'f2', name: 'Q1 Results.codofin', type: 'file', parentId: 'f1', createdAt: '2023-07-15', size: '1.2 MB' },
        { id: 'f3', name: 'Tax Audits', type: 'folder', parentId: null, createdAt: '2024-01-10' },
    ]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);
    const [creationConfig, setCreationConfig] = useState<{ type: 'folder' | 'file'; active: boolean }>({ type: 'file', active: false });
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [previewItem, setPreviewItem] = useState<FileSystemItem | null>(null);
    const [newName, setNewName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredItems = items.filter(item => item.parentId === currentFolderId);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleCreateFinal = () => {
        if (!newName.trim()) return;
        
        const newItem: FileSystemItem = {
            id: `${creationConfig.type}-${Date.now()}`,
            name: creationConfig.type === 'file' 
                ? (newName.endsWith('.codofin') ? newName : `${newName}.codofin`)
                : newName,
            type: creationConfig.type,
            parentId: currentFolderId,
            createdAt: new Date().toISOString().split('T')[0],
            ...(creationConfig.type === 'file' ? { size: '0 KB' } : {})
        };
        
        setItems(prev => [...prev, newItem]);
        setNewName('');
        setCreationConfig(prev => ({ ...prev, active: false }));
        setNotification({ message: `${creationConfig.type === 'folder' ? 'Sector' : 'Volume'} initialization complete.`, type: 'success' });
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        setItems(prev => prev.filter(i => i.id !== itemToDelete.id && i.parentId !== itemToDelete.id));
        setNotification({ message: `Purge of "${itemToDelete.name}" successful.`, type: 'info' });
        setItemToDelete(null);
    };

    const handleExport = (item: FileSystemItem) => {
        if (item.type === 'folder') return;
        
        const link = document.createElement('a');
        if (item.url) {
            link.href = item.url;
            link.download = item.name;
        } else {
            const state = {
                accounts: JSON.parse(localStorage.getItem('ledger_accounts') || '[]'),
                transactions: JSON.parse(localStorage.getItem('ledger_transactions') || '[]'),
                employees: JSON.parse(localStorage.getItem('ledger_employees') || '[]'),
                payrollEntries: JSON.parse(localStorage.getItem('ledger_payroll') || '[]'),
            };
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            link.href = URL.createObjectURL(blob);
            link.download = item.name.endsWith('.codofin') ? item.name : `${item.name}.codofin`;
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setNotification({ message: `Export of "${item.name}" synchronized.`, type: 'success' });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        if (file.type === 'application/json' || file.name.endsWith('.codofin')) {
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (data.accounts) setAccounts(data.accounts);
                    if (data.transactions) setTransactions(data.transactions);
                    if (data.invoices) setInvoices(data.invoices);
                    if (data.employees) setEmployees(data.employees);
                    if (data.payrollEntries) setPayrollEntries(data.payrollEntries);

                    setNotification({ message: "System State Ingested. Ledger Synchronized.", type: 'success' });
                    
                    const newItem: FileSystemItem = {
                        id: `file-${Date.now()}`,
                        name: file.name,
                        type: 'file',
                        parentId: currentFolderId,
                        createdAt: new Date().toISOString().split('T')[0],
                        size: `${(file.size / 1024).toFixed(1)} KB`
                    };
                    setItems(prev => [...prev, newItem]);
                } catch (err) {
                    setNotification({ message: "Invalid Ingestion Format.", type: 'error' });
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsText(file);
        } else if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const type: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';
            const newItem: FileSystemItem = {
                id: `media-${Date.now()}`,
                name: file.name,
                type: type,
                parentId: currentFolderId,
                createdAt: new Date().toISOString().split('T')[0],
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                url: URL.createObjectURL(file)
            };
            setItems(prev => [...prev, newItem]);
            setIsUploading(false);
            setNotification({ message: `Media Resource "${file.name}" Ingested.`, type: 'success' });
        } else {
            setNotification({ message: "Unsupported File Protocol.", type: 'error' });
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 relative">
            {/* Global Registry Notifications */}
            {notification && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[250] animate-in slide-in-from-top-10 duration-500 pointer-events-none">
                    <div className={`
                        px-8 py-4 rounded-[28px] shadow-2xl border flex items-center gap-4 backdrop-blur-xl
                        ${notification.type === 'success' ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-300 shadow-emerald-600/10' : 
                          notification.type === 'error' ? 'bg-rose-50/90 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-900 dark:text-rose-300 shadow-rose-600/10' : 
                          'bg-slate-900/90 dark:bg-slate-800/90 border-slate-700 dark:border-white/10 text-white shadow-slate-900/40'}
                    `}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${
                            notification.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30' :
                            notification.type === 'error' ? 'bg-rose-100 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30' :
                            'bg-slate-800 dark:bg-slate-700 border-slate-700 dark:border-white/10 font-black tracking-widest'
                        }`}>
                            {notification.type === 'success' ? '✓' : notification.type === 'error' ? '!' : 'SYS'}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none">{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 rounded-[28px] lg:rounded-[40px] p-6 lg:p-12 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="text-center lg:text-left">
                    <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase mb-2 leading-none">Codo Storage</h2>
                    <p className="text-[10px] lg:text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">Manage ledger volumes and corporate sectors.</p>
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => setCreationConfig({ type: 'folder', active: true })}
                        className="flex-1 sm:flex-none bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 px-4 lg:px-6 py-3.5 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200/50 dark:border-white/5"
                    >
                        + Sector
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 lg:px-8 py-3.5 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 dark:shadow-indigo-500/10"
                    >
                        ↑ Ingest
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".json,.codofin,image/*,video/*"
                    />
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center space-x-3 px-4">
                <button 
                    onClick={() => setCurrentFolderId(null)}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!currentFolderId ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    ROOT://SYSTEM
                </button>
                {currentFolderId && (
                    <>
                        <span className="text-slate-300 dark:text-slate-700 text-xs">/</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                            {items.find(i => i.id === currentFolderId)?.name}
                        </span>
                    </>
                )}
            </div>

            {/* File Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* Navigation: Go Back */}
                {currentFolderId && (
                    <button 
                        onClick={() => {
                            const parent = items.find(i => i.id === currentFolderId)?.parentId;
                            setCurrentFolderId(parent || null);
                        }}
                        className="aspect-square bg-slate-50 dark:bg-white/5 rounded-[32px] lg:rounded-[48px] border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center group hover:bg-slate-100 dark:hover:bg-white/10 transition-all space-y-4"
                    >
                        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-[24px] bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:shadow-md transition-all">
                            <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </div>
                        <span className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white">Registry ROOT</span>
                    </button>
                )}

                {/* Create New File Card */}
                <button 
                    onClick={() => setCreationConfig({ type: 'file', active: true })}
                    className="aspect-square bg-slate-50 dark:bg-white/5 rounded-[32px] lg:rounded-[48px] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all space-y-4"
                >
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-[24px] bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:shadow-indigo-600/10 transition-all">
                        <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Init Volume</span>
                </button>

                {filteredItems.map(item => (
                    <div 
                        key={item.id}
                        onDoubleClick={() => item.type === 'folder' ? setCurrentFolderId(item.id) : setPreviewItem(item)}
                        className="aspect-square bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[48px] border border-slate-200 dark:border-white/5 p-6 lg:p-8 flex flex-col justify-between shadow-sm hover:shadow-2xl lg:hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start z-10">
                            <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl lg:rounded-[20px] flex items-center justify-center overflow-hidden border ${
                                item.type === 'folder' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : 
                                item.type === 'image' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                                item.type === 'video' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' :
                                'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
                            }`}>
                                {item.type === 'image' && item.url ? (
                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl lg:text-2xl">
                                        {item.type === 'folder' ? '📁' : item.type === 'video' ? '📽️' : '📄'}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                {item.type !== 'folder' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleExport(item); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-500 dark:hover:text-rose-400 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/30"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="z-10">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight mb-1 truncate">{item.name}</h4>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {item.type === 'folder' ? 'Sector Package' : 
                                 item.type === 'image' ? `${item.size} — RAW IMAGE` :
                                 item.type === 'video' ? `${item.size} — RAW MOTION` :
                                 `${item.size} — Ledger Vol`}
                            </p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-all blur-3xl z-0"></div>
                    </div>
                ))}
            </div>

            {/* Ingestion Loader */}
            {isUploading && createPortal(
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[1001] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[48px] p-8 lg:p-12 max-w-sm w-full text-center space-y-6 lg:space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl border border-white/20 dark:border-white/5">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl lg:rounded-[28px] mx-auto flex items-center justify-center">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-2">Ingesting...</h3>
                            <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Synchronizing resource with global registry. Do not disrupt connection.</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Deletion Confirmation Modal */}
            {itemToDelete && createPortal(
                <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/90 backdrop-blur-md z-[1001] flex items-center justify-center p-4 lg:p-6 animate-in fade-in duration-300" onClick={() => setItemToDelete(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[56px] p-8 lg:p-16 max-w-lg w-full text-center space-y-8 lg:space-y-10 animate-in zoom-in-95 duration-500 shadow-2xl border border-white/20 dark:border-white/5" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 lg:w-24 lg:h-24 bg-rose-50 dark:bg-rose-500/10 rounded-2xl lg:rounded-[32px] mx-auto flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-inner border border-rose-100/50 dark:border-rose-500/20">
                            <svg className="w-8 h-8 lg:w-12 lg:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-3">Irreversible Purge</h3>
                            <p className="text-[11px] lg:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">
                                You are about to purge <span className="text-slate-900 dark:text-white font-black">"{itemToDelete.name}"</span>. Protocol cannot be undone.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setItemToDelete(null)} className="py-4 lg:py-5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-slate-100 rounded-xl lg:rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all">Abort</button>
                            <button onClick={handleDelete} className="py-4 lg:py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl lg:rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all">Confirm</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Creation Modal */}
            {creationConfig.active && createPortal(
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[1001] flex items-center justify-center p-4 lg:p-6 animate-in fade-in duration-500" onClick={() => setCreationConfig(prev => ({ ...prev, active: false }))}>
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] lg:rounded-[56px] p-8 lg:p-16 max-w-xl w-full text-center space-y-8 lg:space-y-12 animate-in slide-in-from-bottom-10 duration-700 shadow-2xl border border-white/20 dark:border-white/5" onClick={e => e.stopPropagation()}>
                        <div className="space-y-4">
                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl lg:rounded-[28px] mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner border border-indigo-100/50 dark:border-indigo-500/20">
                                {creationConfig.type === 'folder' ? (
                                    <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                ) : (
                                    <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-2">Initialize {creationConfig.type === 'folder' ? 'Sector' : 'Volume'}</h3>
                                <p className="text-[9px] lg:text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Define identity for resource.</p>
                            </div>
                            <div className="space-y-6">
                                <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFinal()} placeholder={creationConfig.type === 'folder' ? "Sector Name..." : "Volume Identity..."} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent rounded-2xl lg:rounded-[24px] p-5 lg:p-8 font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 transition-all outline-none text-lg lg:text-xl placeholder:text-slate-200 dark:placeholder:text-slate-700" />
                                <div className="flex gap-3 lg:gap-4">
                                    <button onClick={() => setCreationConfig(prev => ({ ...prev, active: false }))} className="flex-1 py-4 lg:py-6 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest rounded-xl lg:rounded-[24px] text-[10px] transition-all">Cancel</button>
                                    <button onClick={handleCreateFinal} disabled={!newName.trim()} className="flex-[2] py-4 lg:py-6 bg-slate-900 dark:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl lg:rounded-[24px] text-[10px] hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-all disabled:opacity-30">Commit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* File Preview Modal */}
            {previewItem && createPortal(
                <div className="fixed inset-0 bg-slate-900/90 dark:bg-black/95 backdrop-blur-3xl z-[1001] flex flex-col animate-in fade-in duration-500">
                    {/* Header with requested icons */}
                    <div className="h-16 lg:h-20 bg-emerald-600 dark:bg-emerald-700 flex items-center justify-between px-6 lg:px-10 shadow-2xl relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg">
                                {previewItem.type === 'image' ? '🖼️' : previewItem.type === 'video' ? '📽️' : '📄'}
                            </div>
                            <div>
                                <h3 className="text-white font-black text-xs lg:text-sm uppercase tracking-widest leading-none truncate max-w-xs">{previewItem.name}</h3>
                                <p className="text-emerald-100/60 text-[8px] lg:text-[10px] font-black uppercase mt-1 tracking-widest">{previewItem.size} — RAW PROTOCOL</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6 lg:space-x-8">
                            <button onClick={() => handleExport(previewItem)} className="text-white/80 hover:text-white transition-colors" title="Download">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            <button className="text-white/80 hover:text-white transition-colors" title="Edit">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className="text-white/80 hover:text-white transition-colors" title="Maximize">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            </button>
                            <div className="w-px h-6 bg-white/20 mx-2"></div>
                            <button onClick={() => setPreviewItem(null)} className="text-white/80 hover:text-white transition-colors" title="Close">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="flex-1 overflow-hidden flex items-center justify-center p-6 lg:p-20 relative">
                        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none"></div>
                        {previewItem.type === 'image' && previewItem.url ? (
                            <img src={previewItem.url} alt={previewItem.name} className="max-w-full max-h-full object-contain rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 animate-in zoom-in-95 duration-700" />
                        ) : previewItem.type === 'video' && previewItem.url ? (
                            <video src={previewItem.url} controls className="max-w-full max-h-full rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 animate-in zoom-in-95 duration-700" />
                        ) : (
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[48px] p-12 lg:p-20 max-w-2xl w-full text-center space-y-8 relative z-10 animate-in slide-in-from-bottom-10 duration-700">
                                <div className="text-6xl lg:text-8xl">📄</div>
                                <div>
                                    <h4 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Volume Encrypted</h4>
                                    <p className="text-slate-400 text-xs lg:text-sm font-medium leading-relaxed">System protocols restrict raw access to .codofin volumes. Use the export tool to synchronize data with local registries.</p>
                                </div>
                                <button 
                                    onClick={() => handleExport(previewItem)}
                                    className="bg-emerald-600 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 mx-auto block"
                                >
                                    Decrypt & Download
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


export default FileManagement;
