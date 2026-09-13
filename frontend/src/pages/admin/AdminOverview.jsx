import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { formatMoney, today } from '../../utils/format';
import DownloadButton from '../../components/DownloadButton';
import { useAuth } from '../../context/AuthContext';

const COLORS = { cash: '#059669', momo: '#7c3aed', credit: '#d97706', pos: '#2563eb', ekashi: '#0d9488' };
const PALETTE = ['#059669', '#7c3aed', '#d97706', '#2563eb', '#0d9488'];

function AreaChart({ data }) {
  if (!data || data.length === 0) return <div className="py-16 text-center text-sm text-gray-400">No trend data</div>;
  const w = 640, h = 240, pad = 36;
  const max = Math.max(...data.map((d) => Number(d.total || 0)), 1);
  const stepX = (w - pad * 2) / (data.length - 1 || 1);
  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (Number(d.total || 0) / max) * (h - pad * 2);
    return { x, y, d };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-52">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = pad + f * (h - pad * 2);
        const val = max - max * f;
        return (
          <g key={i}>
            <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700" />
            <text x={pad - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{formatMoney(val)}</text>
          </g>
        );
      })}
      <polygon points={area} fill="url(#areaGrad)" />
      <polyline points={line} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#0d9488" stroke="#fff" strokeWidth="1.5" className="dark:stroke-gray-800" />
          <text x={p.x} y={h - 14} textAnchor="middle" fontSize="9" fill="#9ca3af">{String(p.d.date || '').slice(5)}</text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ data }) {
  const segs = [
    ['Cash', data?.cash, COLORS.cash],
    ['Momo', data?.momo, COLORS.momo],
    ['Credit', data?.credit, COLORS.credit],
    ['POS', data?.pos, COLORS.pos],
    ['E-Kashi', data?.ekashi, COLORS.ekashi]
  ];
  const total = segs.reduce((s, [, v]) => s + Number(v || 0), 0);
  if (!total) return <div className="py-16 text-center text-sm text-gray-400">No data</div>;
  const r = 46, c = 2 * Math.PI * r;
  const rendered = segs
    .filter(([, v]) => Number(v || 0) > 0)
    .map(([label, v, color]) => {
      const dash = (Number(v) / total) * c;
      return { label, color, dash, pct: Math.round((Number(v) / total) * 100) };
    });
  let offset = 0;
  const circles = rendered.map((s) => {
    const item = { ...s, offset };
    offset -= s.dash;
    return item;
  });
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" className="dark:stroke-gray-700" />
          {circles.map((s, i) => (
            <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth="18"
              strokeDasharray={`${s.dash} ${c - s.dash}`} strokeDashoffset={s.offset} />
          ))}
          <g transform="rotate(90 60 60)">
            <text x="60" y="57" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#111827" className="dark:fill-gray-100">{formatMoney(total)}</text>
            <text x="60" y="72" textAnchor="middle" fontSize="7" fill="#6b7280">Total</text>
          </g>
        </svg>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
        {circles.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.label}
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color }) {
  const solid = Number(value || 0) || 0;
  const pct = max && Number(solid) ? Math.round((solid / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="text-gray-600 dark:text-gray-300 truncate pr-2">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-100">{formatMoney(solid)}</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 ${className}`}>
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, bg }) {
  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
        <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${bg}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3 truncate" title={value}>{value}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{sub}</div>
    </div>
  );
}

export default function AdminOverview() {
  const { user } = useAuth();
  const [weekly, setWeekly] = useState(null);
  const [daily, setDaily] = useState(null);
  const [trend, setTrend] = useState([]);
  const [reports, setReports] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [cashierId, setCashierId] = useState('all');
  const [date, setDate] = useState(today());
  const [deleting, setDeleting] = useState(false);

  const d7 = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);

  const load = async () => {
    try {
      const params = {};
      if (cashierId !== 'all') params.cashier_id = cashierId;
      const [weekRes, dayRes, trendRes, reportsRes, cashRes] = await Promise.all([
        api.get('/stats', { params: { type: 'weekly', ...params } }),
        api.get('/stats', { params: { type: 'daily', date, ...params } }),
        api.get('/stats', { params: { type: 'trend', date, ...params } }),
        api.get('/reports', { params: { date_from: d7, date_to: date, ...(cashierId !== 'all' ? { cashier_id: cashierId } : {}) } }),
        api.get('/cashiers')
      ]);
      setWeekly(weekRes.data);
      setDaily(dayRes.data);
      setTrend(trendRes.data.trend || []);
      setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
      setCashiers(cashRes.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => { load(); }, [cashierId]);

  const perCashier = () => {
    const map = {};
    reports.forEach((r) => {
      const name = r.fullname || `Cashier #${r.cashier_id}`;
      map[name] = (map[name] || 0) + Number(r.total || 0);
    });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL reports, expenses, purchases, cashouts and insurance records? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.post('/admin/clear-records');
      toast.success('All records deleted successfully');
      load();
    } catch (e) {
      toast.error('Error deleting records');
    } finally {
      setDeleting(false);
    }
  };

  const summaryTables = [
    {
      caption: 'Weekly Statistics',
      columns: ['Metric', 'Value'],
      rows: weekly
        ? [
            ['Range', `${weekly.start} to ${weekly.end}`],
            ['Cash', formatMoney(weekly.cash)],
            ['Momo', formatMoney(weekly.momo)],
            ['Credit', formatMoney(weekly.credit)],
            ['POS', formatMoney(weekly.pos)],
            ['E-Kashi', formatMoney(weekly.ekashi)],
            ['Total', formatMoney(weekly.total)],
            ['Balance', formatMoney(weekly.balance)]
          ]
        : []
    },
    {
      caption: `Daily Summary (${date})`,
      columns: ['Metric', 'Value'],
      rows: daily
        ? [
            ['Cash', formatMoney(daily.cash)],
            ['Momo', formatMoney(daily.momo)],
            ['Credit', formatMoney(daily.credit)],
            ['POS', formatMoney(daily.pos)],
            ['E-Kashi', formatMoney(daily.ekashi)],
            ['Total', formatMoney(daily.total)],
            ['Balance', formatMoney(daily.balance)]
          ]
        : []
    },
    {
      caption: 'Money Flow Trend (last 7 days)',
      columns: ['Date', 'Total'],
      rows: trend.map((t) => [t.date, formatMoney(t.total)])
    },
    {
      caption: 'Cashier Traffic',
      columns: ['Cashier', 'Total'],
      rows: perCashier().map((t) => [t.name, formatMoney(t.total)])
    }
  ];

  const traffic = perCashier();
  const trafficMax = Math.max(...traffic.map((t) => t.total), 1);
  const campaigns = [
    { name: 'Momo Cashback Drive', value: weekly?.momo, max: weekly?.total, color: '#7c3aed', icon: '📱' },
    { name: 'Insurance Credit Campaign', value: weekly?.credit, max: weekly?.total, color: '#d97706', icon: '🛡️' },
    { name: 'Cash Loyalty Program', value: weekly?.cash, max: weekly?.total, color: '#059669', icon: '💵' },
    { name: 'POS Happy Hour', value: weekly?.pos, max: weekly?.total, color: '#2563eb', icon: '💳' },
    { name: 'E-Kashi Week', value: weekly?.ekashi, max: weekly?.total, color: '#0d9488', icon: '🌱' }
  ];

  const kpis = [
    { label: 'Weekly Total', value: formatMoney(weekly?.total), sub: weekly ? `${weekly.start} – ${weekly.end}` : 'This week', icon: '💰', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    { label: 'Weekly Balance', value: formatMoney(weekly?.balance), sub: 'Cash remaining this week', icon: '🏦', bg: 'bg-purple-100 dark:bg-purple-900/40' },
    { label: 'Daily Total', value: formatMoney(daily?.total), sub: date, icon: '📈', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { label: 'Daily Balance', value: formatMoney(daily?.balance), sub: date, icon: '🎯', bg: 'bg-red-100 dark:bg-red-900/40' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-20 w-56 h-56 bg-cyan-300/20 rounded-full blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-teal-100">Welcome back, {user?.fullname}</div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Dashboard Overview</h1>
            <p className="text-teal-100 text-sm mt-1">Revenue flow, payment mix and cashier performance at a glance</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DownloadButton
              title="Overview Report"
              subtitle="Stream Pharmacy — dashboard overview"
              filename="overview-report.pdf"
              tables={summaryTables}
            />
          </div>
        </div>
        <div className="relative flex flex-wrap gap-2 mt-4 text-xs text-teal-100">
          <span className="px-2.5 py-1 bg-white/15 rounded-lg">📅 {date}</span>
          <span className="px-2.5 py-1 bg-white/15 rounded-lg">👥 {cashiers.length} cashiers</span>
          {weekly && <span className="px-2.5 py-1 bg-white/15 rounded-lg">📆 {weekly.start} → {weekly.end}</span>}
          <span className="px-2.5 py-1 bg-white/15 rounded-lg">🧾 {reports.length} records</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Cashier</label>
          <select value={cashierId} onChange={(e) => setCashierId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100">
            <option value="all">All Cashiers</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullname}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
        </div>
        <button onClick={() => load()} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition">
          ↻ Refresh
        </button>
        <button
          onClick={handleDeleteAll}
          disabled={deleting}
          className="ml-auto px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-sm font-semibold rounded-lg transition disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : '🗑 Delete All Records'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Money Flow" subtitle="Total sales per day — last 7 days" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-200">7 days</span>
          </div>
          <AreaChart data={trend} />
        </Card>

        <Card title="Payment Mix" subtitle="Weekly breakdown" className="lg:col-span-1">
          <Donut data={weekly} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Cashier Traffic" subtitle="Who brings in the money (last 7 days)" className="lg:col-span-1">
          <div className="space-y-3">
            {traffic.slice(0, 5).map((t, i) => (
              <ProgressBar key={t.name} label={t.name} value={t.total} max={trafficMax} color={PALETTE[i % 5]} />
            ))}
            {traffic.length === 0 && <div className="py-8 text-center text-sm text-gray-400">No sales recorded</div>}
          </div>
        </Card>

        <Card title="Recent Transactions" subtitle="Latest sales records" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Cashier</th>
                  <th className="pb-2 font-medium">Shift</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 7).map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-2.5 text-gray-600 dark:text-gray-300">{r.report_date}</td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-300">{r.fullname}</td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-300">{r.shift_name}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-800 dark:text-gray-100">{formatMoney(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && <div className="py-6 text-center text-sm text-gray-400">No transactions yet</div>}
          </div>
        </Card>
      </div>

      <Card title="Campaigns" subtitle="Share of total revenue this week">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {campaigns.map((c, i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-900/40 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-lg">{c.icon}</span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {weekly?.total ? Math.round((c.value / c.max) * 100) : 0}%
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{c.name}</div>
              <div className="mt-3">
                <ProgressBar label="" value={c.value} max={c.max} color={c.color} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}