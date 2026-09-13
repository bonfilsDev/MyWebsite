import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatMoney } from '../../utils/format';
import DownloadButton from '../../components/DownloadButton';

export default function AdminCashouts() {
  const [cashouts, setCashouts] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [cashierId, setCashierId] = useState('all');
  const [date, setDate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (cashierId !== 'all') params.cashier_id = cashierId;
      if (date) params.date = date;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const [cashRes, userRes] = await Promise.all([
        api.get('/cashouts', { params }),
        api.get('/cashiers')
      ]);
      setCashouts(cashRes.data);
      setCashiers(userRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const total = cashouts.reduce((s, x) => s + Number(x.amount || 0), 0);

  const pdfTables = [
    {
      caption: 'Cashier Cashouts',
      columns: ['Cashier', 'Date', 'Amount', 'Account', 'Person / Reason'],
      rows: [
        ...cashouts.map((r) => [
          r.cashier_name || '-',
          r.cashout_date || '-',
          formatMoney(r.amount),
          r.account || '-',
          r.person_or_reason || '-'
        ]),
        ['', '', formatMoney(total), '', 'TOTAL']
      ]
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cashier Cashouts</h1>
        <DownloadButton
          title="Cashouts Report"
          subtitle="Stream Pharmacy — cashier cashouts"
          filename="cashouts-report.pdf"
          tables={pdfTables}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Cashier</label>
          <select value={cashierId} onChange={(e) => setCashierId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Cashiers</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullname}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Total Cashouts</span>
        <span className="text-xl font-bold text-amber-600">{formatMoney(total)}</span>
      </div>
    </div>
  );
}