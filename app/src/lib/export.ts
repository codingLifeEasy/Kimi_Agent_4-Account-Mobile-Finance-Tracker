import * as XLSX from 'xlsx';
import type { Transaction } from '@/types';
import { accountById, categoryById } from '@/types';

function toRows(transactions: Transaction[]) {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  return sorted.map((t) => ({
    ID: t.id.slice(0, 8),
    Date: t.date,
    Account: accountById(t.account).name,
    Category: categoryById(t.category).name,
    'Amount (₹)': t.amount,
    Note: t.note || '',
  }));
}

function filename(ext: string) {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
  return `expenses-${stamp}.${ext}`;
}

export function exportToExcel(transactions: Transaction[]) {
  const rows = toRows(transactions);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

  // Summary sheet
  const byAccount = new Map<string, number>();
  const byCategory = new Map<string, number>();
  transactions.forEach((t) => {
    byAccount.set(t.account, (byAccount.get(t.account) ?? 0) + t.amount);
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
  });
  const summary = [
    { 'Summary By': 'Account', Name: '', 'Total (₹)': '' },
    ...[...byAccount.entries()].map(([k, v]) => ({
      'Summary By': '',
      Name: accountById(k as Transaction['account']).name,
      'Total (₹)': v,
    })),
    { 'Summary By': 'Category', Name: '', 'Total (₹)': '' },
    ...[...byCategory.entries()].map(([k, v]) => ({
      'Summary By': '',
      Name: categoryById(k as Transaction['category']).name,
      'Total (₹)': v,
    })),
  ];
  const ws2 = XLSX.utils.json_to_sheet(summary);
  ws2['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  XLSX.writeFile(wb, filename('xlsx'));
}

export function exportToCSV(transactions: Transaction[]) {
  const rows = toRows(transactions);
  const header = ['ID', 'Date', 'Account', 'Category', 'Amount (₹)', 'Note'];
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows.map((r) => Object.values(r))]
    .map((r) => r.map(escape).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename('csv');
  a.click();
  URL.revokeObjectURL(url);
}
