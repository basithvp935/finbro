
const API_KEY = "AIzaSyBo_TJfimv3-ykkwm8Nuj7WB9LqUi8yfq4";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export interface SearchResult {
    type: 'Account' | 'Transaction' | 'Invoice' | 'Employee' | 'Insight';
    title: string;
    description: string;
    id?: string;
    link?: string;
    tab?: string;
}

export const GeminiService = {
    async search(query: string, store: any): Promise<SearchResult[]> {
        try {
            // Calculate some real-time metrics for context
            const totalCash = store.accounts
                .filter((a: any) => a.id === '1001' || a.id === '1006')
                .reduce((sum: number, a: any) => sum + (a.openingBalance || 0), 0);
            
            const totalInvoices = store.invoices.reduce((sum: number, i: any) => sum + i.total, 0);
            const totalEmployees = store.employees.length;
            const companyName = store.company?.name || 'Codofin Client';
            
            const prompt = `
                You are a financial assistant for Codofin OS. 
                Search through the following application data and answer the user query: "${query}".
                
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
                - Audit Log (History): ${JSON.stringify(store.auditLog.slice(0, 15).map((a: any) => ({ timestamp: a.timestamp, ref: a.reference, reason: a.reason, user: a.user })))}
                - Navigation: ["Dashboard", "Transactions", "Accounts", "Reconciliation", "Invoicing", "Payroll", "Financial Statements", "Codo Storage", "CoA & Settings"]

                Instructions:
                1. If the user asks about a BROAD SECTION (e.g. "Accounts", "Payroll", "Invoices"), provide a comprehensive "Insight" result that summarizes the status of that entire section (e.g. list key accounts/balances, list recent invoices/totals).
                2. If the user asks a SPECIFIC question (how much?, who?, what?), provide a direct "Insight" result with the exact answer in 'description'.
                3. If the query matches a feature name, provide a "Feature" result with the correct 'tab'.
                4. For "history" or "actions", use the Audit Log.
                5. For specific records, return them as their respective types (Account, Transaction, etc.).
                
                Tab Mappings:
                - Dashboard -> 'dashboard'
                - Transactions -> 'transactions'
                - Accounts -> 'accounts'
                - Reconciliation -> 'reconciliation'
                - Invoicing -> 'invoices'
                - Payroll -> 'payroll'
                - Financial Statements -> 'statements'
                - Codo Storage -> 'create_file'
                - CoA & Settings -> 'settings'

                Return ONLY a JSON array of SearchResult objects. Max 10 results.
                interface SearchResult {
                    type: 'Insight' | 'Feature' | 'Account' | 'Transaction' | 'Invoice' | 'Employee' | 'History';
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
            
            // Clean the response text to ensure it's valid JSON
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return [];
        } catch (error) {
            console.error("Gemini search failed:", error);
            return [];
        }
    }
};
