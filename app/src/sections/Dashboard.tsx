import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { ACCOUNTS, CATEGORIES, accountById, categoryById, formatINR } from '@/types';
import { useTransactions } from '@/lib/store';

type Range = '7d' | '30d' | 'month' | 'all';

const RANGE_LABELS: Record<Range, string> = {
  '7d': '7 days',
  '30d': '30 days',
  month: 'This month',
  all: 'All time',
};

export default function Dashboard() {
  const transactions = useTransactions();
  const [range, setRange] = useState<Range>('30d');

  const cutoff = useMemo(() => {
    const now = new Date();
    if (range === 'all') return '';
    if (range === 'month') {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }
    const days = range === '7d' ? 7 : 30;
    const d = new Date(now.getTime() - (days - 1) * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }, [range]);

  const filtered = useMemo(
    () => (cutoff ? transactions.filter((t) => t.date >= cutoff) : transactions),
    [transactions, cutoff]
  );

  const stats = useMemo(() => {
    const total = filtered.reduce((s, t) => s + t.amount, 0);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const today = filtered.filter((t) => t.date === todayStr).reduce((s, t) => s + t.amount, 0);
    const waste = filtered
      .filter((t) => t.category === 'waste')
      .reduce((s, t) => s + t.amount, 0);
    const days = new Set(filtered.map((t) => t.date)).size || 1;
    return { total, today, waste, avg: Math.round(total / days), count: filtered.length };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + t.amount));
    return CATEGORIES.filter((c) => m.has(c.id))
      .map((c) => ({ name: c.name, icon: c.icon, value: m.get(c.id)!, color: c.color }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byAccount = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((t) => m.set(t.account, (m.get(t.account) ?? 0) + t.amount));
    return ACCOUNTS.map((a) => ({
      name: a.short,
      value: m.get(a.id) ?? 0,
      color: a.color,
    }));
  }, [filtered]);

  const trend = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((t) => m.set(t.date, (m.get(t.date) ?? 0) + t.amount));
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
        value,
      }));
  }, [filtered]);

  const topCategory = byCategory[0];

  if (transactions.length === 0) {
    return (
      <div className="mx-auto mt-20 max-w-lg px-4 text-center text-slate-400">
        <div className="text-5xl">📊</div>
        <p className="mt-3 text-sm">Add some expenses and your dashboard will light up here.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-4 md:max-w-3xl">
      {/* Range selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              range === r
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total spent" value={formatINR(stats.total)} accent="text-emerald-700" />
        <StatCard label="Today" value={formatINR(stats.today)} accent="text-blue-600" />
        <StatCard label="Daily average" value={formatINR(stats.avg)} accent="text-amber-600" />
        <StatCard label="Waste money" value={formatINR(stats.waste)} accent="text-red-500" />
      </div>

      {topCategory && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          💡 Most money goes to <b>{topCategory.icon} {topCategory.name}</b> (
          {formatINR(topCategory.value)}) — {stats.count} entries in this period.
        </p>
      )}

      {/* Trend */}
      <ChartCard title="Spending trend">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: any) => formatINR(Number(v))} />
            <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} fill="url(#grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Category donut */}
      <ChartCard title="By category">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {byCategory.map((c) => (
                  <Cell key={c.name} fill={c.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatINR(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full space-y-1.5">
            {byCategory.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                <span className="flex-1 text-slate-600">
                  {c.icon} {c.name}
                </span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatINR(c.value)}
                </span>
                <span className="w-10 text-right text-slate-400">
                  {stats.total ? Math.round((c.value / stats.total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Account bars */}
      <ChartCard title="By account">
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={byAccount} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: any) => formatINR(Number(v))} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
              {byAccount.map((a) => (
                <Cell key={a.name} fill={a.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Top 5 biggest spends */}
      <ChartCard title="Biggest spends">
        <div className="space-y-2">
          {[...filtered]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map((t) => {
              const c = categoryById(t.category);
              const a = accountById(t.account);
              return (
                <div key={t.id} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {c.name}
                      {t.note ? <span className="font-normal text-slate-400"> · {t.note}</span> : null}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t.date} · {a.short}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums text-slate-800">{formatINR(t.amount)}</span>
                </div>
              );
            })}
        </div>
      </ChartCard>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-bold text-slate-700">{title}</p>
      {children}
    </div>
  );
}
