import { Suspense, lazy, useState } from 'react';
import AddExpense from '@/sections/AddExpense';
import History from '@/sections/History';
import { useTransactions } from '@/lib/store';

// xlsx is heavy — load it only when the user actually downloads
const downloadExcel = async (tx: Parameters<typeof import('@/lib/export').exportToExcel>[0]) => {
  const { exportToExcel } = await import('@/lib/export');
  exportToExcel(tx);
};
const downloadCSV = async (tx: Parameters<typeof import('@/lib/export').exportToCSV>[0]) => {
  const { exportToCSV } = await import('@/lib/export');
  exportToCSV(tx);
};

// Lazy-load the dashboard (recharts is heavy) so the app opens fast
const Dashboard = lazy(() => import('@/sections/Dashboard'));

type Tab = 'add' | 'history' | 'dashboard';

export default function App() {
  const [tab, setTab] = useState<Tab>('add');
  const transactions = useTransactions();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 md:max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base font-black text-white">
              ₹
            </span>
            <h1 className="text-lg font-extrabold tracking-tight text-emerald-900">
              Paisa Track
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => transactions.length && downloadExcel(transactions)}
              disabled={transactions.length === 0}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
              title="Download Excel file"
            >
              ⬇ Excel
            </button>
            <button
              onClick={() => transactions.length && downloadCSV(transactions)}
              disabled={transactions.length === 0}
              className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 active:scale-95 disabled:opacity-40"
              title="Download CSV file"
            >
              ⬇ CSV
            </button>
          </div>
        </div>
      </header>

      {/* Pages */}
      <main>
        {tab === 'add' && <AddExpense />}
        {tab === 'history' && <History />}
        {tab === 'dashboard' && (
          <Suspense
            fallback={
              <div className="mx-auto mt-20 max-w-lg text-center text-sm text-slate-400">
                Loading dashboard…
              </div>
            }
          >
            <Dashboard />
          </Suspense>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          <NavButton
            active={tab === 'add'}
            onClick={() => setTab('add')}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            }
            label="Add"
          />
          <NavButton
            active={tab === 'history'}
            onClick={() => setTab('history')}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13" />
                <path d="M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            }
            label="History"
          />
          <NavButton
            active={tab === 'dashboard'}
            onClick={() => setTab('dashboard')}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 15l4-6 4 3 5-8" />
              </svg>
            }
            label="Dashboard"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition active:scale-95 ${
        active ? 'text-emerald-600' : 'text-slate-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
