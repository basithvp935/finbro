
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AIDashboardInsightsProps {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    bankBalance: number;
    startDate: string;
    endDate: string;
}

const AIDashboardInsights: React.FC<AIDashboardInsightsProps> = ({
    totalRevenue, totalExpenses, netIncome, bankBalance, startDate, endDate
}) => {
    const [insights, setInsights] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
            // Use the API key provided by the user and the library that is actually installed
            const ai = new GoogleGenAI({ apiKey: "AIzaSyBo_TJfimv3-ykkwm8Nuj7WB9LqUi8yfq4" });

            const prompt = `
        ACT AS A SENIOR STRATEGIC FINANCIAL ANALYST.
        
        CONTEXT:
        Company Financial Summary for the period ${startDate} to ${endDate}.
        
        METRICS:
        - Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
        - Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
        - Net Income: ₹${netIncome.toLocaleString('en-IN')}
        - Bank Liquidity: ₹${bankBalance.toLocaleString('en-IN')}
        
        TASK:
        Provide exactly 3-4 concise, high-impact strategic observations about the company's performance. 
        Focus on:
        1. Profitability status.
        2. Burn rate / Expense management.
        3. Cash flow health.
        4. One specific actionable recommendation.
        
        STYLE:
        Professional, assertive, yet insightful. Use an authoritative tone. Return the results as a simple list of sentences, separated by newlines. No bolding or markdown symbols, just professional text.
      `;

            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: prompt
            });

            const text = response.text || "";
            const points = text.split('\n').filter(p => p.trim().length > 10);
            setInsights(points);
        } catch (err: any) {
            console.error(err);
            if (err.message?.includes('429')) {
                setError("AI Quota Exceeded. Please try again in 30 seconds or upgrade your Gemini plan.");
            } else {
                setError(`AI Service Unavailable: ${err.message || "Unknown connectivity issue"}`);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-indigo-100 dark:border-white/10 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-indigo-100/50 dark:group-hover:bg-indigo-500/20"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 relative z-10">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">AI Strategic Insights</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest pl-11">Powered by Gemini Executive Intelligence</p>
                </div>

                <button
                    onClick={generateAnalyze}
                    disabled={isAnalyzing}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${isAnalyzing 
                        ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600' 
                        : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-black dark:hover:bg-indigo-700 hover:shadow-indigo-500/10'
                        }`}
                >
                    {isAnalyzing ? (
                        <div className="flex items-center space-x-3">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Consulting AI...</span>
                        </div>
                    ) : 'Generate Strategic Analysis'}
                </button>
            </div>

            <div className="relative z-10 min-h-[120px] flex items-center justify-center bg-slate-50/50 dark:bg-white/5 rounded-[32px] border border-slate-100 dark:border-white/5 p-8">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center space-y-4 animate-pulse">
                        <div className="h-2 w-48 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="h-2 w-64 bg-slate-200 dark:bg-slate-700 rounded-full opacity-60"></div>
                    </div>
                ) : insights.length > 0 ? (
                    <div className="w-full space-y-6">
                        {insights.map((point, i) => (
                            <div key={i} className="flex items-start space-x-6 group/item animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-lg shadow-indigo-500/40 transition-transform group-hover/item:scale-150"></div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic uppercase tracking-tight group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                                    {point}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-6 px-10">
                        <p className="text-rose-500 font-black uppercase text-[10px] tracking-widest bg-rose-50 dark:bg-rose-500/10 px-6 py-3 rounded-2xl border border-rose-100 dark:border-rose-500/20 shadow-sm leading-relaxed">
                            {error}
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">Click generate to analyze current performance vectors</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIDashboardInsights;
