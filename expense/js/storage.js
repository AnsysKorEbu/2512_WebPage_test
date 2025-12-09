/**
 * Storage Module
 * Manages transactions and budget in localStorage
 */

export class Storage {
    constructor() {
        this.STORAGE_KEY = 'expenseTrackerData';
        this.BUDGET_KEY = 'expenseTrackerBudget';
    }

    // Load all data
    loadData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : { transactions: [] };
    }

    // Save all data
    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // Get all transactions
    getTransactions() {
        const data = this.loadData();
        return data.transactions || [];
    }

    // Add transaction
    addTransaction(transaction) {
        const data = this.loadData();
        data.transactions.unshift(transaction);
        this.saveData(data);
    }

    // Delete transaction
    deleteTransaction(id) {
        const data = this.loadData();
        data.transactions = data.transactions.filter(t => t.id !== id);
        this.saveData(data);
    }

    // Load budget
    loadBudget() {
        const budgets = localStorage.getItem(this.BUDGET_KEY);
        return budgets ? JSON.parse(budgets) : {};
    }

    // Save budget
    saveBudget(yearMonth, amount) {
        const budgets = this.loadBudget();
        budgets[yearMonth] = amount;
        localStorage.setItem(this.BUDGET_KEY, JSON.stringify(budgets));
    }

    // Get budget for specific month
    getBudget(yearMonth) {
        const budgets = this.loadBudget();
        return budgets[yearMonth] || 0;
    }

    // Export to JSON
    exportToJSON() {
        const data = this.loadData();
        const budgets = this.loadBudget();
        return {
            transactions: data.transactions,
            budgets: budgets,
            exportDate: new Date().toISOString()
        };
    }
}
