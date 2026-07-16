export type AccountId = 'card1' | 'card2' | 'bank' | 'flexy';

export interface Account {
  id: AccountId;
  name: string;
  short: string;
  color: string; // hex for charts
  bg: string; // tailwind class
}

export const ACCOUNTS: Account[] = [
  { id: 'card1', name: 'Card 1 (Main)', short: 'Card 1', color: '#10b981', bg: 'bg-emerald-500' },
  { id: 'card2', name: 'Card 2', short: 'Card 2', color: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'bank', name: 'Bank Account', short: 'Bank', color: '#f59e0b', bg: 'bg-amber-500' },
  { id: 'flexy', name: 'Flexy (Cash Shortage)', short: 'Flexy', color: '#a855f7', bg: 'bg-purple-500' },
];

export type CategoryId =
  | 'baba'
  | 'maa'
  | 'bhai'
  | 'recharge'
  | 'food'
  | 'habit'
  | 'transport'
  | 'waste';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string; // emoji
  color: string; // hex for charts
}

export const CATEGORIES: Category[] = [
  { id: 'baba', name: 'Baba', icon: '👴', color: '#f97316' },
  { id: 'maa', name: 'Maa', icon: '👩', color: '#ec4899' },
  { id: 'bhai', name: 'Bhai', icon: '👦', color: '#06b6d4' },
  { id: 'recharge', name: 'Recharge', icon: '📱', color: '#8b5cf6' },
  { id: 'food', name: 'Food', icon: '🍛', color: '#ef4444' },
  { id: 'habit', name: 'Habit', icon: '🚬', color: '#78716c' },
  { id: 'transport', name: 'Transport', icon: '🚌', color: '#3b82f6' },
  { id: 'waste', name: 'Waste Money', icon: '🗑️', color: '#64748b' },
];

export const DENOMINATIONS = [500, 1000, 200, 100, 50, 10, 1] as const;

export interface Transaction {
  id: string; // unique id (uuid)
  date: string; // YYYY-MM-DD
  account: AccountId;
  category: CategoryId;
  amount: number;
  note: string;
  createdAt: number;
}

export const accountById = (id: AccountId): Account =>
  ACCOUNTS.find((a) => a.id === id) ?? ACCOUNTS[0];

export const categoryById = (id: CategoryId): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export const formatINR = (n: number): string =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
