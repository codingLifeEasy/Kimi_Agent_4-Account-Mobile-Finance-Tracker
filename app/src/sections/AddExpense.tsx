import { useMemo, useState } from 'react';
import { ACCOUNTS, CATEGORIES, DENOMINATIONS, formatINR } from '@/types';
import type { AccountId, CategoryId } from '@/types';
import { txStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function AddExpense() {
  const [taps, setTaps] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const [account, setAccount] = useState<AccountId>('card1');
  const [category, setCategory] = useState<CategoryId>('food');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  const padTotal = useMemo(() => taps.reduce((s, v) => s + v, 0), [taps]);
  const amount = typed !== '' ? Math.max(0, Math.round(Number(typed) || 0)) : padTotal;

  const breakdown = useMemo(() => {
    const m = new Map<number, number>();
    taps.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  }, [taps]);

  const canSave = amount > 0;

  const reset = () => {
    setTaps([]);
    setTyped('');
    setNote('');
  };

  const save = async () => {
    if (!canSave) return;
    try {
      await txStore.add({ date, account, category, amount, note: note.trim() });
      reset();
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1600);
    } catch (error: any) {
      alert("Failed to save transaction to the cloud: " + error.message);
      console.error(error);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-4">
      {/* Amount display */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg">
        <div className="flex items-baseline justify-between">
          <span className="text-sm opacity-80">Amount</span>
          {typed === '' && taps.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {breakdown.map(([v, c]) => (
                <span
                  key={v}
                  className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium"
                >
                  ₹{v}×{c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
          {formatINR(amount)}
        </div>
      </div>

      {/* Denomination pad */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {DENOMINATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setTyped('');
              setTaps((t) => [...t, d]);
            }}
            className="rounded-xl border border-emerald-200 bg-white py-3 text-base font-semibold text-emerald-800 shadow-sm transition active:scale-95 active:bg-emerald-50"
          >
            ₹{d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setTyped('');
            setTaps((t) => t.slice(0, -1));
          }}
          disabled={taps.length === 0}
          className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 shadow-sm transition active:scale-95 disabled:opacity-40"
        >
          ⌫ Undo
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            ₹
          </span>
          <Input
            inputMode="numeric"
            placeholder="Or type exact amount"
            value={typed}
            onChange={(e) => setTyped(e.target.value.replace(/[^0-9]/g, ''))}
            className="pl-7"
          />
        </div>
        <Button variant="outline" onClick={reset} disabled={taps.length === 0 && typed === ''}>
          Clear
        </Button>
      </div>

      {/* Account selector */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-slate-700">Spend from</p>
        <div className="grid grid-cols-4 gap-2">
          {ACCOUNTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccount(a.id)}
              className={`rounded-xl border-2 px-1 py-2.5 text-xs font-semibold transition active:scale-95 ${
                account === a.id
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <span className={`mx-auto mb-1 block h-2 w-8 rounded-full ${a.bg}`} />
              {a.short}
            </button>
          ))}
        </div>
      </div>

      {/* Category selector */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-slate-700">Category</p>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-xl border-2 px-1 py-2 text-[11px] font-semibold transition active:scale-95 ${
                category === c.id
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <span className="mb-0.5 block text-xl leading-none">{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date + note */}
      <div className="mt-5 grid grid-cols-1 gap-3">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Date</p>
          <Input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </p>
          <Input
            placeholder="e.g. chai, auto to station…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={60}
          />
        </div>
      </div>

      {/* Save */}
      <div className="fixed inset-x-0 bottom-[68px] z-20 mx-auto w-full max-w-lg px-4">
        <Button
          onClick={save}
          disabled={!canSave}
          className="h-12 w-full rounded-xl bg-emerald-600 text-base font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-40"
        >
          {savedFlash ? '✓ Saved!' : `Save ${amount > 0 ? formatINR(amount) : 'Expense'}`}
        </Button>
      </div>
    </div>
  );
}
