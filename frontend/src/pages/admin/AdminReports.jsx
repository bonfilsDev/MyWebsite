import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatMoney } from '../../utils/format';
import DownloadButton from '../../components/DownloadButton';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [cashierId, setCashierId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (cashierId !== 'all') params.cashier_id = cashierId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const [reportsRes, cashRes] = await Promise.all([
        api.get('/reports', { params }),
        api.get('/cashiers')
      ]);
      setReports(reportsRes.data);
      setCashiers(cashRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = reports.reduce(
    (acc, r) => {
      acc.cash += Number(r.cash);
      acc.momo += Number(r.momo);
      acc.credit += Number(r.credit);
      acc.pos += Number(r.pos);
      acc.ekashi += Number(r.ekashi);
      acc.total += Number(r.total);
      acc.balance += Number(r.balance);
      return acc;
    },
    { cash: 0, momo: 0, credit: 0, pos: 0, ekashi: 0, total: 0, balance: 0 }
  );

  const pdfTables = [
    {
      caption: 'Daily Reports',
      columns: ['Date', 'Cashier', 'Shift', 'Cash', 'Momo', 'POS', 'E-Kashi', 'Credit', 'Total', 'Balance'],
      rows: reports.map((r) => [
        r.report_date,
        r.fullname || '-',
        r.shift_name || '-',
        formatMoney(r.cash),
        formatMoney(r.momo),
        formatMoney(r.pos),
        formatMoney(r.ekashi),
        formatMoney(r.credit),
        formatMoney(r.total),
        formatMoney(r.balance)
      ])
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Reports</h1>
        <DownloadButton
          title="Daily Reports"
          subtitle="Stream Pharmacy — daily sales reports"
          filename="daily-reports.pdf"
          tables={pdfTables}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Cashier</label>
          <select
            value={cashierId}
            onChange={(e) => setCashierId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Cashiers</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullname}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg">
          Search
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          ['Cash', totals.cash], ['Momo', totals.momo], ['Credit', totals.credit], ['POS', totals.pos],
          ['E-Kashi', totals.ekashi], ['Total', totals.total], ['Balance', totals.balance]
        ].map(([label, val]) => (
          <div key={label} className="bg-white rounded-lg shadow px-4 py-3">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-base font-bold text-gray-800">{formatMoney(val)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}