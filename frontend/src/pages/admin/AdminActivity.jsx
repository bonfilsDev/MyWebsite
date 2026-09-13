import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatMoney, today } from '../../utils/format';
import DownloadButton from '../../components/DownloadButton';

export default function AdminActivity() {
  const [date, setDate] = useState(today());
  const [cashiers, setCashiers] = useState([]);
  const [cashierId, setCashierId] = useState('all');
  const [data, setData] = useState({
    reports: [],
    expenses: [],
    insurance: { records: [], total: 0 },
    purchases: [],
    cashouts: []
  });

  const load = async () => {
    try {
      const cashierQ = cashierId !== 'all' ? { cashier_id: cashierId } : {};
      const [reportsRes, expRes, insRes, cashRes, purRes, cashUsers] = await Promise.all([
        api.get('/reports', { params: { date_from: date, date_to: date, ...cashierQ } }),
        api.get('/expenses', { params: { date, ...cashierQ } }),
        api.get('/insurance', { params: { action: 'by_date', date, ...cashierQ } }),
        api.get('/cashouts', { params: { date, ...cashierQ } }),
        api.get('/purchases', { params: { date, ...cashierQ } }),
        api.get('/cashiers')
      ]);
      setData({
        reports: reportsRes.data || [],
        expenses: expRes.data || [],
        insurance: insRes.data || { records: [], total: 0 },
        purchases: purRes.data || [],
        cashouts: cashRes.data || []
      });
      setCashiers(cashUsers.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, [date, cashierId]);

  const sumExpenses = data.expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const sumCashouts = data.cashouts.reduce((s, x) => s + Number(x.amount || 0), 0);
  const sumPurchases = data.purchases.reduce((s, x) => s + Number(x.amount || 0), 0);
  const sumPurchasesPaid = data.purchases.reduce((s, x) => s + Number(x.amount_paid || 0), 0);
  const sumPurchasesRemaining = Math.max(0, sumPurchases - sumPurchasesPaid);
  const salesTotal = data.reports.reduce((s, r) => s + Number(r.total || 0), 0);

  const SummaryCard = ({ label, value, color }) => (
    <div className="bg-white rounded-lg shadow px-4 py-3 border-l-4" style={{ borderLeftColor: color }}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-800">{formatMoney(value)}</div>
    </div>
  );

  const pdfTables = [
    {
      caption: 'Sales Report',
      columns: ['Cashier', 'Shift', 'Cash', 'Momo', 'POS', 'E-Kashi', 'Credit', 'Total', 'Balance'],
      rows: data.reports.map((r) => [
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
    },
    {
      caption: 'Expenses',
      columns: ['Cashier', 'Number', 'Reason', 'Amount', 'Way'],
      rows: data.expenses.map((x) => [x.cashier_name || '-', x.expense_number || '-', x.reason || '-', formatMoney(x.amount), x.way || '-'])
    },
    {
      caption: 'Insurance Credit',
      columns: ['Cashier', 'Company', 'Client', 'Beneficiary %', 'Shift', 'Amount'],
      rows: (data.insurance.records || []).map((r) => [
        r.cashier_name || '-',
        r.company || '-',
        r.client_name || '-',
        r.beneficiary_percent != null ? `${Number(r.beneficiary_percent)}%` : '-',
        r.shift_name || '-',
        formatMoney(r.amount)
      ])
    },
    {
      caption: 'Purchases',
      columns: ['Cashier', 'Payment', 'Amount', 'Paid', 'Remaining', 'Supplier'],
      rows: data.purchases.map((r) => [
        r.cashier_name || '-',
        (r.payment_type || '').toUpperCase(),
        formatMoney(r.amount),
        formatMoney(r.amount_paid || 0),
        formatMoney(Math.max(0, Number(r.amount) - Number(r.amount_paid || 0))),
        r.supplier_name || '-'
      ])
    },
    {
      caption: 'Cashouts',
      columns: ['Cashier', 'Amount', 'Account', 'Person / Reason'],
      rows: data.cashouts.map((r) => [
        r.cashier_name || '-',
        formatMoney(r.amount),
        r.account || '-',
        r.person_or_reason || '-'
      ])
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Activity</h1>
        <DownloadButton
          title="Daily Activity Report"
          subtitle={`Stream Pharmacy — ${date}${cashierId !== 'all' ? ' (selected cashier)' : ''}`}
          filename="daily-activity.pdf"
          tables={pdfTables}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
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
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Sales Total" value={salesTotal} color="#059669" />
        <SummaryCard label="Expenses" value={sumExpenses} color="#dc2626" />
        <SummaryCard label="Insurance Credit" value={Number(data.insurance.total) || 0} color="#db2777" />
        <SummaryCard label="Cashouts" value={sumCashouts} color="#d97706" />
        <SummaryCard label="Purchases" value={sumPurchases} color="#2563eb" />
        <SummaryCard label="Purchases Paid" value={sumPurchasesPaid} color="#059669" />
        <SummaryCard label="Purchase Debt" value={sumPurchasesRemaining} color="#dc2626" />
      </div>
    </div>
  );
}