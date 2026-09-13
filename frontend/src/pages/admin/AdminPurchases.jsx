import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatMoney } from '../../utils/format';
import DownloadButton from '../../components/DownloadButton';

const shifts = [
  { id: 1, name: 'Morning' },
  { id: 2, name: 'Evening' },
  { id: 3, name: 'Night' }
];

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [cashierId, setCashierId] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (cashierId !== 'all') params.cashier_id = cashierId;
      if (search.trim()) params.search = search.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (shiftFilter) params.shift_id = shiftFilter;
      const [purchRes, cashRes] = await Promise.all([
        api.get('/purchases', { params }),
        api.get('/cashiers')
      ]);
      setPurchases(purchRes.data);
      setCashiers(cashRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const supplierMap = {};
  purchases.forEach((p) => {
    const name = p.supplier_name || 'Unknown';
    if (!supplierMap[name]) supplierMap[name] = { supplier: name, count: 0, amount: 0, paid: 0, remain: 0 };
    const amt = Number(p.amount || 0);
    const paid = Number(p.amount_paid || 0);
    supplierMap[name].count += 1;
    supplierMap[name].amount += amt;
    supplierMap[name].paid += paid;
    supplierMap[name].remain += Math.max(0, amt - paid);
  });
  const supplierSummary = Object.values(supplierMap).sort((a, b) => b.remain - a.remain);
  const totalRemainAll = supplierSummary.reduce((s, x) => s + x.remain, 0);

  const pdfTables = [
    {
      caption: 'Supplier Balance — Remain to Pay',
      columns: ['#', 'Supplier', 'Purchases', 'Total Amount', 'Total Paid', 'Remain to Pay'],
      rows: supplierSummary.map((s, i) => [i + 1, s.supplier, s.count, formatMoney(s.amount), formatMoney(s.paid), formatMoney(s.remain)])
    },
    {
      caption: 'Purchases',
      columns: ['Date', 'Cashier', 'Shift', 'Payment', 'Amount', 'Paid', 'Place', 'Remain', 'Invoice', 'Supplier', 'Status', 'Date Paid'],
      rows: purchases.map((r) => [
        r.purchase_date || '-',
        r.cashier_name || '-',
        r.shift_name || '-',
        r.payment_type === 'credit' ? 'Credit' : 'Cash',
        formatMoney(r.amount),
        formatMoney(r.amount_paid || 0),
        r.place || '-',
        formatMoney(Math.max(0, Number(r.amount) - Number(r.amount_paid || 0))),
        r.invoice_number || '-',
        r.supplier_name || '-',
        (r.status || '').toUpperCase(),
        r.datepaid ? new Date(r.datepaid).toLocaleString() : '-'
      ])
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Purchases</h1>
        <DownloadButton
          title="Purchases Report"
          subtitle="Stream Pharmacy — purchases & supplier balance"
          filename="purchases-report.pdf"
          tables={pdfTables}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by supplier, invoice, amount or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); load(); } }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full"
          />
        </div>
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
          <label className="block text-sm font-medium text-gray-600 mb-1">Date From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Shift</label>
          <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <button onClick={load} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg">
          Search
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto mb-6">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Supplier Balance — Remain to Pay</h2>
          <span className="text-sm font-bold text-red-600">Total Remain to Pay: {formatMoney(totalRemainAll)}</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">#</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Supplier Name</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Purchases</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Total Amount</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Total Paid</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Remain to Pay</th>
            </tr>
          </thead>
          <tbody>
            {supplierSummary.length === 0 && (
              <tr><td colSpan="6" className="px-3 py-6 text-center text-gray-500">No purchases match the filters</td></tr>
            )}
            {supplierSummary.map((s, i) => (
              <tr key={s.supplier} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-sm text-gray-500">{i + 1}</td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-800">{s.supplier}</td>
                <td className="px-3 py-3 text-right text-sm text-gray-700">{s.count}</td>
                <td className="px-3 py-3 text-right text-sm text-gray-800">{formatMoney(s.amount)}</td>
                <td className="px-3 py-3 text-right text-sm text-green-600">{formatMoney(s.paid)}</td>
                <td className="px-3 py-3 text-right text-sm font-bold text-red-600">{formatMoney(s.remain)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}