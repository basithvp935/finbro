
import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="min-h-screen bg-white font-['Inter'] selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-2xl z-[100] border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 font-black text-xl italic transition-transform group-hover:rotate-12">
                C
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Codofin</span>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              {['Platform', 'Solutions', 'Open Ledger', 'Enterprise'].map((item) => (
                <button key={item} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={onSignIn}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 hover:text-indigo-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-emerald-50/40 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-full mb-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-3"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.25em]">V2.5 Enterprise Engine Available</span>
          </div>

          <h1 className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.85] italic mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Double-Entry <br />
            <span className="text-indigo-600">Intelligence.</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl leading-relaxed font-medium mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            The automated ledger for modern startups. Enforce accounting integrity at scale with the world's first AI-native financial stack.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-indigo-600 text-white px-14 py-7 rounded-[32px] text-xs font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center group"
            >
              <span>Build My Ledger</span>
              <svg className="w-5 h-5 ml-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <button className="w-full sm:w-auto px-14 py-7 bg-white border border-slate-200 text-slate-900 rounded-[32px] text-xs font-black uppercase tracking-[0.25em] hover:bg-slate-50 transition-all shadow-sm">
              Watch Protocol
            </button>
          </div>
        </div>

        {/* Product Teaser Mockup */}
        <div className="max-w-6xl mx-auto mt-32 relative group animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
          <div className="bg-[#0F172A] rounded-[48px] p-4 lg:p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 relative z-20 overflow-hidden">
            <div className="bg-slate-800/40 rounded-[40px] border border-white/5 aspect-[16/9] flex flex-col">
              {/* Fake Dashboard Header */}
              <div className="h-16 border-b border-white/5 flex items-center px-8 justify-between">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                </div>
                <div className="w-32 h-2 bg-white/10 rounded-full"></div>
                <div className="flex space-x-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5"></div>
                  <div className="w-8 h-8 rounded-lg bg-white/5"></div>
                </div>
              </div>
              {/* Fake Dashboard Content */}
              <div className="flex-1 p-10 grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="h-32 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 p-6 flex flex-col justify-between">
                      <div className="w-12 h-2 bg-indigo-500/30 rounded-full"></div>
                      <div className="w-24 h-4 bg-white/90 rounded-full"></div>
                    </div>
                    <div className="h-32 bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-col justify-between">
                      <div className="w-12 h-2 bg-white/10 rounded-full"></div>
                      <div className="w-20 h-4 bg-white/90 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-3xl border border-white/5 p-8 space-y-4">
                    <div className="w-1/3 h-4 bg-white/10 rounded-full"></div>
                    <div className="w-full h-2 bg-white/5 rounded-full"></div>
                    <div className="w-full h-2 bg-white/5 rounded-full"></div>
                    <div className="w-3/4 h-2 bg-white/5 rounded-full"></div>
                  </div>
                </div>
                <div className="col-span-4 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-slate-900 text-2xl font-black italic">₹</div>
                  <div className="w-24 h-4 bg-white rounded-full"></div>
                  <div className="w-16 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Accents */}
          <div className="absolute -top-12 -left-12 p-8 bg-white rounded-[32px] shadow-2xl border border-slate-100 z-30 hidden xl:block animate-bounce duration-[4000ms]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Margin</p>
            <p className="text-2xl font-black text-emerald-500">+42.8%</p>
          </div>
          <div className="absolute -bottom-8 -right-8 p-8 bg-indigo-600 rounded-[32px] shadow-2xl text-white z-30 hidden xl:block animate-pulse">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Draft Invoices</p>
            <p className="text-2xl font-black">₹14,20,500</p>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 italic">Architected for Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale contrast-125">
            {['VERTEX', 'CODO AI', 'NOVA LABS', 'PULSE', 'QUANTUM'].map(brand => (
              <span key={brand} className="text-2xl font-black tracking-tighter italic">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section className="py-32 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Master Your Ledger.</h2>
            <p className="text-slate-500 text-lg font-medium">The most powerful financial primitives ever built for SaaS.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Big Box */}
            <div className="md:col-span-2 bg-white rounded-[48px] p-12 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
              <div className="relative z-10 max-w-md">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-10 shadow-inner group-hover:scale-110 transition-transform">📊</div>
                <h3 className="text-3xl font-black text-slate-900 italic uppercase mb-6 tracking-tight">Institutional Accounting</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Automated Trial Balances, multi-dimensional general ledgers, and real-time P&L reporting that satisfies the strictest audit requirements.</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-emerald-50/50 rounded-full blur-[80px] pointer-events-none transition-transform group-hover:scale-150"></div>
            </div>

            {/* Tall Box */}
            <div className="bg-indigo-600 rounded-[48px] p-12 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-10">📄</div>
              <h3 className="text-3xl font-black italic uppercase mb-6 tracking-tight">Global Invoicing</h3>
              <p className="text-indigo-100 font-medium leading-relaxed">Draft, finalize, and dispatch professional tax invoices in seconds. Integrated AR tracking and automated credit term monitoring.</p>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-[60px] group-hover:scale-150 transition-transform"></div>
            </div>

            {/* Small Box 1 */}
            <div className="bg-white rounded-[48px] p-12 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-10">🔄</div>
              <h3 className="text-2xl font-black text-slate-900 italic uppercase mb-4 tracking-tight">Bank Sync</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Direct feed integration for real-time liquidity monitoring and automated bank reconciliation protocols.</p>
            </div>

            {/* Small Box 2 */}
            <div className="bg-slate-900 rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-10">🛡️</div>
              <h3 className="text-2xl font-black italic uppercase mb-4 tracking-tight">SECURED</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Double-entry validation enforced at the hardware level. Your data is isolated, encrypted, and audit-ready.</p>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
            </div>

            {/* Mid Box */}
            <div className="bg-white rounded-[48px] p-12 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">🧠</div>
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">AI Agent Integrated</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 italic uppercase mb-4 tracking-tight">Smart Extraction</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Gemini 3 Pro powered receipt scanning. Convert raw pictures into perfect journal entries with zero manual effort.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Compliance Callout */}
      <section className="py-40 bg-[#0F172A] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-emerald-500/5"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
              <div className="w-20 h-1 bg-indigo-500"></div>
              <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">Compliance <br /> by Design.</h2>
              <p className="text-slate-400 text-xl font-medium max-w-lg leading-relaxed">
                Engineered to meet the standards of the most demanding CFOs. Our protocol ensures your books are closed, balanced, and ready for regulatory scrutiny every single day.
              </p>
              <div className="flex flex-wrap gap-10">
                <div className="space-y-2">
                  <p className="text-3xl font-black">99.9%</p>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Extraction Accuracy</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black">100%</p>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Double-Entry Validated</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black">256-bit</p>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">AES Encryption</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-3xl rounded-[64px] p-12 lg:p-20 border border-white/10 shadow-inner">
              <div className="space-y-12">
                {[
                  { label: 'SOC2 Type II Certified Pipeline', icon: '✅' },
                  { label: 'ISO 27001 Regulatory Standard', icon: '✅' },
                  { label: 'GDPR / CCPA Compliant Isolation', icon: '✅' },
                  { label: 'IFRS / GAAP Reporting Alignment', icon: '✅' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
                      {item.icon}
                    </div>
                    <span className="text-lg font-black italic uppercase tracking-tight text-slate-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-40 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Ready for Hyper-Scale?</h2>
          <p className="text-slate-500 text-xl font-medium">Join 500+ startups scaling their financials with Codofin.</p>
          <button
            onClick={onGetStarted}
            className="bg-indigo-600 text-white px-20 py-8 rounded-[40px] text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Get Started For Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm italic">C</div>
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Codofin</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs font-medium leading-relaxed">
              Institutional-grade bookkeeping for modern SaaS and service startups. Built for scale, secured by intelligence.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Architecture</h4>
            <div className="flex flex-col space-y-4">
              {['Ledger', 'Reconciliation', 'Invoicing', 'Tax Compliance'].map(l => (
                <a key={l} href="#" className="text-sm text-slate-400 hover:text-indigo-600 transition-colors font-medium">{l}</a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Company</h4>
            <div className="flex flex-col space-y-4">
              {['Open Source', 'Security', 'Billing Docs', 'Changelog'].map(l => (
                <a key={l} href="#" className="text-sm text-slate-400 hover:text-indigo-600 transition-colors font-medium">{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            © 2024 Codofin Innovations • Enterprise Standard Protocol
          </div>
          <div className="flex space-x-8">
            {['Twitter', 'GitHub', 'LinkedIn'].map(social => (
              <a key={social} href="#" className="text-slate-300 hover:text-indigo-600 transition-colors text-[10px] font-black uppercase tracking-widest">{social}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
