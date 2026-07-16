import { useSyncExternalStore } from 'react';
import type { Transaction } from '@/types';

const STORAGE_KEY = 'paisa-track-transactions-v1';

function load(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache: Transaction[] = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // storage full — keep app running
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export const txStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot(): Transaction[] {
    return cache;
  },
  add(t: Omit<Transaction, 'id' | 'createdAt'>) {
    const tx: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    cache = [tx, ...cache];
    persist();
    emit();
    return tx;
  },
  remove(id: string) {
    cache = cache.filter((t) => t.id !== id);
    persist();
    emit();
  },
  clearAll() {
    cache = [];
    persist();
    emit();
  },
};

export function useTransactions(): Transaction[] {
  return useSyncExternalStore(txStore.subscribe, txStore.getSnapshot);
}
