const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "AIzaSyCbJmQ9htro7NpD2b6wvbYlvhxuT6V4BtY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export interface SearchResult {
    type: 'Account' | 'Transaction' | 'Invoice' | 'Employee' | 'Insight' | 'Feature' | 'History' | 'BankEntry' | 'Payroll';
    title: string;
    description: string;
    id?: string;
    link?: string;
    tab?: string;
}

export const GeminiService = {
    async search(query: string, store: any): Promise<SearchResult[]> {
        if (!API_KEY) {
            console.error("Gemini API Key missing");
            return [];
        }

        try {
            // Calculate some real-time metrics for context
            const totalCash = store.accounts
                .filter((a: any) => a.id === '1001' || a.id === '1006')
                .reduce((sum: number, a: any) => sum + (a.openingBalance || 0), 0);
            
            const totalInvoices = store.invoices.reduce((sum: number, i: any) => sum + i.total, 0);
            const totalEmployees = store.employees.length;
            const companyName = store.company?.name || 'Codofin Client';
            
            const prompt = `
                You are a sophisticated financial intelligence assistant for Codofin OS. 
                Answer the user query: "${query}" based ONLY on the provided application state.
                
                TONE AND STYLE (CHATGPT-STYLE):
                - Maintain an EXTREMELY POSITIVE, ENCOURAGING, and highly intelligent persona. 
                - Be detailed, professional, and celebrate the user's financial progress (e.g., "Excellent work on this revenue spike!" or "Your expenses are perfectly optimized!").
                - Explain insights thoroughly, highlighting trends and opportunities.
                
                STRICT SCOPE POLICY:
                - WHATEVER the user asks about this web application, its features, its data, or financial processes, you MUST provide a detailed, positive, and proactive response as the resident financial expert.
                - If they ask HOW to do something (e.g., "how to add a client"), direct them to the appropriate section (e.g., "You can easily manage your clients and billing in the Invoicing section!").
                - Only if the question is TOTALLY UNRELATED to this ecosystem (e.g., "What is the best pizza toppings?"), return a 'Registry Boundary' result stating your intelligence is currently specialized for their financial excellence here.

                CRITICAL INSTRUCTIONS:
                1. For ANY query about a feature or section (e.g., "Payroll", "Bank", "Invoices", "Cash", "Storage"), you MUST:
                   - Return the corresponding 'Feature' result.
                   - Provide a detailed 'Insight' summary of the current status of that area.
                2. Be as DETAILED, helpful, and celebratory as ChatGPT.
                3. Return a valid JSON array of SearchResult objects. Max 10.
                
                Environment:
                - Company: ${companyName}
                - Real-Time Context:
                - Total Cash/Bank: ₹${totalCash.toLocaleString()}
                - Total Invoiced: ₹${totalInvoices.toLocaleString()}
                - Active Employees: ${totalEmployees}
                - Accounts: ${JSON.stringify(store.accounts.map((a: any) => ({ code: a.code, name: a.name, type: a.type, balance: a.openingBalance })))}
                - Transactions: ${JSON.stringify(store.transactions.slice(0, 40).map((t: any) => ({ ref: t.reference, desc: t.description, date: t.date, total: t.lines?.[0]?.debit || t.lines?.[1]?.credit })))}
                - Invoices: ${JSON.stringify(store.invoices.map((i: any) => ({ num: i.invoiceNumber, client: i.clientName, total: i.total, status: i.status })))}
                - Employees: ${JSON.stringify(store.employees.map((e: any) => ({ name: e.name, role: e.role, salary: e.baseSalary })))}
                - Payroll: ${JSON.stringify(store.payrollEntries.slice(0, 5).map((p: any) => ({ date: p.date, net: p.netAmount })))}
                
                Tab Mappings (Label/Alias -> ID):
                - Dashboard (Home, Overview) -> 'dashboard'
                - Transactions (Journal, Ledger, Entries) -> 'transactions'
                - Accounts (Chart of Accounts, CoA) -> 'accounts'
                - Reconciliation (Bank Matching) -> 'reconciliation'
                - Invoicing (Bills, Sales) -> 'invoices'
                - Payroll (Salaries, HR) -> 'payroll'
                - Financials (Statements, Reports, Trial Balance, P&L) -> 'statements'
                - Codo Storage (Files, Documents) -> 'create_file'
                - Settings (Configuration, Setup) -> 'settings'

                Return ONLY a JSON array. 
                interface SearchResult {
                    type: 'Insight' | 'Feature' | 'Account' | 'Transaction' | 'Invoice' | 'Employee' | 'History' | 'BankEntry' | 'Payroll';
                    title: string;
                    description: string;
                    tab?: string;
                    id?: string;
                }
            `;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Extract JSON array robustly
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']') + 1;
            if (start !== -1 && end !== -1) {
                return JSON.parse(text.substring(start, end));
            }
            
            return [];
        } catch (error) {
            console.error("Gemini search failed:", error);
            return [];
        }
    }
};

