import { formatDate } from './format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Builds a CSV from already-loaded transaction rows and triggers a browser
 * download - no backend involved, since the data's already in memory.
 */
export function exportTransactionsToCsv(transactions, currency = 'NGN') {
  if (!transactions || transactions.length === 0) return;

  const header = ['Date', 'Type', 'Category', 'Description', `Amount (${currency})`];
  const rows = transactions.map((t) => [
    formatDate(t.occurred_on),
    t.type,
    t.category_name || 'Uncategorized',
    t.description || '',
    Number(t.amount).toFixed(2),
  ]);

  const escapeCell = (cell) => {
    const str = String(cell ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const csv = [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `budgetiq-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds an actual PDF file (not a browser print dialog) from already-loaded
 * transaction rows, with a simple income/expense/net summary up top.
 */
export function exportTransactionsToPdf(transactions, currency = 'NGN') {
  if (!transactions || transactions.length === 0) return;

  const doc = new jsPDF();
  const today = new Date().toISOString().slice(0, 10);

  doc.setFontSize(16);
  doc.text('BudgetIQ - Transactions', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${today}`, 14, 24);

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  doc.setTextColor(30);
  doc.setFontSize(11);
  doc.text(
    `Income: ${currency} ${income.toFixed(2)}   Expense: ${currency} ${expense.toFixed(2)}   Net: ${currency} ${(income - expense).toFixed(2)}`,
    14,
    32
  );

  autoTable(doc, {
    startY: 38,
    head: [['Date', 'Type', 'Category', 'Description', `Amount (${currency})`]],
    body: transactions.map((t) => [
      formatDate(t.occurred_on),
      t.type === 'income' ? 'Income' : 'Expense',
      t.category_name || 'Uncategorized',
      t.description || '—',
      `${t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}`,
    ]),
    headStyles: { fillColor: [15, 113, 180] },
    styles: { fontSize: 9 },
    columnStyles: { 4: { halign: 'right' } },
  });

  doc.save(`budgetiq-transactions-${today}.pdf`);
}
