/**
 * Main Application
 * Coordinates all modules and handles UI
 */

import { Storage } from './storage.js';
import { ChartRenderer } from './chart.js';

// Initialize
const storage = new Storage();
const chart = new ChartRenderer('categoryChart');

// Current view state
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let currentType = 'expense'; // for form
let filterType = 'all'; // for list

// DOM Elements
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthSpan = document.getElementById('currentMonth');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const totalBalance = document.getElementById('totalBalance');
const transactionForm = document.getElementById('transactionForm');
const typeBtns = document.querySelectorAll('.type-btn');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categorySelect = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const categoryLegend = document.getElementById('categoryLegend');
const budgetAmount = document.getElementById('budgetAmount');
const budgetBar = document.getElementById('budgetBar');
const budgetStatus = document.getElementById('budgetStatus');
const setBudgetBtn = document.getElementById('setBudgetBtn');
const budgetModal = document.getElementById('budgetModal');
const budgetInput = document.getElementById('budgetInput');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');
const cancelBudgetBtn = document.getElementById('cancelBudgetBtn');
const exportBtn = document.getElementById('exportBtn');

// Initialize app
function init() {
    setTodayDate();
    updateMonthDisplay();
    renderTransactions();
    updateSummary();
    updateChart();
    updateBudget();
}

// Set today's date as default
function setTodayDate() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    dateInput.value = dateStr;
}

// Update month display
function updateMonthDisplay() {
    currentMonthSpan.textContent = `${currentYear}년 ${currentMonth}월`;
}

// Get current month key
function getCurrentMonthKey() {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
}

// Month navigation
prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    updateMonthDisplay();
    renderTransactions();
    updateSummary();
    updateChart();
    updateBudget();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    updateMonthDisplay();
    renderTransactions();
    updateSummary();
    updateChart();
    updateBudget();
});

// Type selection for form
typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
    });
});

// Add transaction
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const transaction = {
        id: Date.now(),
        type: currentType,
        amount: parseFloat(amountInput.value),
        date: dateInput.value,
        category: categorySelect.value,
        description: descriptionInput.value.trim(),
        createdAt: new Date().toISOString()
    };

    storage.addTransaction(transaction);

    // Reset form
    transactionForm.reset();
    setTodayDate();

    // Update UI
    renderTransactions();
    updateSummary();
    updateChart();
    updateBudget();
});

// Filter transactions
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterType = btn.dataset.filter;
        renderTransactions();
    });
});

// Render transactions
function renderTransactions() {
    const transactions = storage.getTransactions();
    const monthKey = getCurrentMonthKey();

    // Filter by month and type
    const filtered = transactions.filter(t => {
        const transDate = t.date.substring(0, 7); // YYYY-MM
        const matchesMonth = transDate === monthKey;
        const matchesFilter = filterType === 'all' || t.type === filterType;
        return matchesMonth && matchesFilter;
    });

    transactionList.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        transactionList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    transactionList.style.display = 'block';

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(transaction => {
        const li = document.createElement('li');
        li.className = `transaction-item ${transaction.type}`;

        const sign = transaction.type === 'income' ? '+' : '-';
        const formattedDate = new Date(transaction.date).toLocaleDateString('ko-KR');

        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-category">${transaction.category}</div>
                <div class="transaction-description">${escapeHtml(transaction.description) || '내용 없음'}</div>
                <div class="transaction-date">${formattedDate}</div>
            </div>
            <div class="transaction-right">
                <div class="transaction-amount ${transaction.type}">
                    ${sign}${formatCurrency(transaction.amount)}
                </div>
                <button class="delete-btn" data-id="${transaction.id}">×</button>
            </div>
        `;

        // Delete button
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            storage.deleteTransaction(id);
            renderTransactions();
            updateSummary();
            updateChart();
            updateBudget();
        });

        transactionList.appendChild(li);
    });
}

// Update summary
function updateSummary() {
    const transactions = storage.getTransactions();
    const monthKey = getCurrentMonthKey();

    const monthTransactions = transactions.filter(t => {
        return t.date.substring(0, 7) === monthKey;
    });

    let income = 0;
    let expense = 0;

    monthTransactions.forEach(t => {
        if (t.type === 'income') {
            income += t.amount;
        } else {
            expense += t.amount;
        }
    });

    const balance = income - expense;

    totalIncome.textContent = formatCurrency(income);
    totalExpense.textContent = formatCurrency(expense);
    totalBalance.textContent = formatCurrency(balance);
}

// Update chart
function updateChart() {
    const transactions = storage.getTransactions();
    const monthKey = getCurrentMonthKey();

    const expenses = transactions.filter(t => {
        return t.date.substring(0, 7) === monthKey && t.type === 'expense';
    });

    // Group by category
    const categoryData = {};
    expenses.forEach(t => {
        if (!categoryData[t.category]) {
            categoryData[t.category] = 0;
        }
        categoryData[t.category] += t.amount;
    });

    // Convert to array for chart
    const chartData = Object.entries(categoryData).map(([category, value]) => ({
        category,
        value
    }));

    // Sort by value
    chartData.sort((a, b) => b.value - a.value);

    // Draw chart
    chart.drawPieChart(chartData);

    // Update legend
    categoryLegend.innerHTML = '';
    chartData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `
            <div class="legend-label">
                <div class="legend-color" style="background: ${chart.getColorForIndex(index)}"></div>
                <span>${item.category}</span>
            </div>
            <span class="legend-amount">${formatCurrency(item.value)}</span>
        `;
        categoryLegend.appendChild(div);
    });
}

// Budget management
function updateBudget() {
    const monthKey = getCurrentMonthKey();
    const budget = storage.getBudget(monthKey);

    budgetAmount.textContent = formatCurrency(budget);

    if (budget === 0) {
        budgetStatus.textContent = '예산을 설정하세요';
        budgetBar.style.width = '0%';
        budgetBar.className = 'progress-fill';
        return;
    }

    const transactions = storage.getTransactions();
    const expenses = transactions
        .filter(t => t.date.substring(0, 7) === monthKey && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const percentage = (expenses / budget) * 100;
    const remaining = budget - expenses;

    budgetBar.style.width = Math.min(percentage, 100) + '%';

    // Update color
    budgetBar.className = 'progress-fill';
    if (percentage >= 100) {
        budgetBar.classList.add('danger');
        budgetStatus.textContent = `예산 초과 ${formatCurrency(Math.abs(remaining))}`;
    } else if (percentage >= 80) {
        budgetBar.classList.add('warning');
        budgetStatus.textContent = `잔여 ${formatCurrency(remaining)}`;
    } else {
        budgetStatus.textContent = `잔여 ${formatCurrency(remaining)}`;
    }
}

setBudgetBtn.addEventListener('click', () => {
    const monthKey = getCurrentMonthKey();
    const currentBudget = storage.getBudget(monthKey);
    budgetInput.value = currentBudget || '';
    budgetModal.classList.add('active');
    budgetInput.focus();
});

saveBudgetBtn.addEventListener('click', () => {
    const amount = parseFloat(budgetInput.value) || 0;
    const monthKey = getCurrentMonthKey();
    storage.saveBudget(monthKey, amount);
    budgetModal.classList.remove('active');
    updateBudget();
});

cancelBudgetBtn.addEventListener('click', () => {
    budgetModal.classList.remove('active');
});

budgetModal.addEventListener('click', (e) => {
    if (e.target === budgetModal) {
        budgetModal.classList.remove('active');
    }
});

// Export data
exportBtn.addEventListener('click', () => {
    const data = storage.exportToJSON();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
});

// Utility functions
function formatCurrency(amount) {
    return '₩' + amount.toLocaleString('ko-KR');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
init();
