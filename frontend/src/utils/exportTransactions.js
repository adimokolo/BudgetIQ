import { formatDate } from './format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SLOGAN = 'BudgetIQ — Spend with insight, not guesswork.';

const COLOR = {
  brand: [15, 113, 180],
  credit: [22, 163, 74],
  debit: [220, 38, 38],
  dark: [30, 41, 59],
  muted: [148, 163, 184],
  rowEven: [248, 250, 252],
};

function escapeCell(cell) {
  const str = String(cell ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

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

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');

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

export function exportTransactionsToPdf(transactions, currency = 'NGN') {
  if (!transactions || transactions.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date().toISOString().slice(0, 10);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const net = income - expense;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.dark);
  doc.text('BudgetIQ — Transactions', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.muted);
  doc.text(`Exported on ${today}`, 14, 26);

  const summaryY = 34;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  doc.setTextColor(...COLOR.dark);
  doc.text('Income:', 14, summaryY);
  doc.setTextColor(...COLOR.credit);
  doc.text(`${currency} ${income.toFixed(2)}`, 35, summaryY);

  doc.setTextColor(...COLOR.dark);
  doc.text('Expense:', 80, summaryY);
  doc.setTextColor(...COLOR.debit);
  doc.text(`${currency} ${expense.toFixed(2)}`, 103, summaryY);

  doc.setTextColor(...COLOR.dark);
  doc.text('Net:', 148, summaryY);
  doc.setTextColor(...(net >= 0 ? COLOR.credit : COLOR.debit));
  doc.text(`${currency} ${net.toFixed(2)}`, 160, summaryY);

  autoTable(doc, {
    startY: summaryY + 6,

    head: [['Date', 'Type', 'Category', 'Description', `Amount (${currency})`]],

    body: transactions.map((t) => [
      formatDate(t.occurred_on),
      t.type === 'income' ? 'Credit' : 'Debit',
      t.category_name || 'Uncategorized',
      t.description || '—',
      `${t.type === 'income' ? '+' : '-'}${Number(t.amount || 0).toFixed(2)}`,
    ]),

    headStyles: {
      fillColor: COLOR.brand,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },

    bodyStyles: {
      fontSize: 9,
      textColor: COLOR.dark,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
    },

    alternateRowStyles: {
      fillColor: COLOR.rowEven,
    },

    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 18 },
      2: { cellWidth: 34 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },

    didParseCell(data) {
      console.log('didParseCell fired:', data.section, data.column.index);
      if (data.section !== 'body' || data.column.index !== 4) return;

      const isCredit = data.row.raw[1] === 'Credit';
      data.cell.styles.textColor = isCredit ? COLOR.credit : COLOR.debit;
    },

    didDrawPage() {
      const footerY = pageH - 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLOR.muted);
      doc.text(SLOGAN, pageW / 2, footerY, { align: 'center' });

      doc.setDrawColor(...COLOR.muted);
      doc.setLineWidth(0.2);
      doc.line(14, footerY - 4, pageW - 14, footerY - 4);
    },
  });

  doc.save(`budgetiq-transactions-${today}.pdf`);
}