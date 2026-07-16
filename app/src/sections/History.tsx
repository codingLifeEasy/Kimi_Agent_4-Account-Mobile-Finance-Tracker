import { useMemo, useState } from 'react';
import { ACCOUNTS, CATEGORIES, accountById, categoryById, formatINR } from '@/types';
import type { AccountId, CategoryId } from '@/types';
import { txStore, useTransactions } from '@/lib/store';
import { Button } from '@/components/ui/button';

function prettyDate(d: string) {
  const today = new Date();
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const y = new Date(today.getTime() - 86400000);
  const ys = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(
    y.getDate()
  ).padStart(2, '0')}`;
  if (d === t) return 'Today';
  if (d === ys) return 'Yesterday';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function History() {
  const transactions = useTransactions();
  const [accountFilter, setAccountFilter] = useState<'all' | AccountId>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryId>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (accountFilter === 'all' || t.account === accountFilter) &&
          (categoryFilter === 'all' || t.category === categoryFilter)
      ),
    [transactions, accountFilter, categoryFilter]
  );

  const groups = useMemo(() => {
    const g = new Map<string, typeof filtered>();
    filtered.forEach((t) => {
      const arr = g.get(t.date) ?? [];
      arr.push(t);
      g.set(t.date, arr);
    });
    return [...g.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip active={accountFilter === 'all'} onClick={() => setAccountFilter('all')}>
          All accounts
        </FilterChip>
        {ACCOUNTS.map((a) => (
          <FilterChip
            key={a.id}
            active={accountFilter === a.id}
            onClick={() => setAccountFilter(a.id)}
          >
            {a.short}
          </FilterChip>
        ))}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
          All categories
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.id}
            active={categoryFilter === c.id}
            onClick={() => setCategoryFilter(c.id)}
          >
            {c.icon} {c.name}
          </FilterChip>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filtered.length} entries · <span className="font-semibold text-slate-800">{formatINR(total)}</span>
        </p>
        {transactions.length > 0 &&
          (confirmClear ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  txStore.clearAll();
                  setConfirmClear(false);
                }}
              >
                Sure?
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                No
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs font-medium text-red-500 underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          ))}
      </div>

      {/* List */}
      {groups.length === 0 ? (
        <div className="mt-16 text-center text-slate-400">
          <div className="text-5xl">🧾</div>
          <p className="mt-3 text-sm">No expenses yet. Add your first one!</p>
        </div>
      ) : (
        groups.map(([date, items]) => (
          <div key={date} className="mt-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {prettyDate(date)}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {formatINR(items.reduce((s, t) => s + t.amount, 0))}
              </p>
            </div>
            <div className="mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {items.map((t, i) => {
                const c = categoryById(t.category);
                const a = accountById(t.account);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-3.5 py-3 ${
                      i > 0 ? 'border-t border-slate-100' : ''
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ backgroundColor: c.color + '1a' }}
                    >
                      {c.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {c.name}
                        {t.note ? <span className="font-normal text-slate-400"> · {t.note}</span> : null}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${a.bg}`} />
                        {a.name} · #{t.id.slice(0, 8)}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-slate-800">
                      {formatINR(t.amount)}
                    </span>
                    <button
                      onClick={() => txStore.remove(t.id)}
                      aria-label="Delete entry"
                      className="ml-1 rounded-full p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 active:scale-90"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
