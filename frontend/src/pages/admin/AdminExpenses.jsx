import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatMoney } from '../../utils/format';
import DownloadButton from '../../components/DownloadButton';

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
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
      const [expRes, cashRes] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/cashiers')
      ]);
      setExpenses(expRes.data);
      setCashiers(cashRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const total = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);

  const pdfTables = [
    {
      caption: 'Cashier Expenses',
      columns: ['Cashier', 'Number', 'Date', 'Reason', 'Amount', 'Way'],
      rows: [
        ...expenses.map((r) => [
          r.cashier_name || '-',
          r.expense_number || '-',
          r.expense_date || '-',
          r.reason || '-',
          formatMoney(r.amount),
          r.way || '-'
        ]),
        ['', '', '', 'TOTAL', formatMoney(total), '']
      ]
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cashier Expenses</h1>
        <DownloadButton
          title="Expenses Report"
          subtitle="Stream Pharmacy — cashier expenses"
          filename="expenses-report.pdf"
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
        <span className="text-sm font-medium text-gray-700">Total Expenses</span>
        <span className="text-xl font-bold text-red-600">{formatMoney(total)}</span>
      </div>
    </div>
  );
}