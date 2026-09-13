import React, { useEffect, useState } from 'react';
import api from '../../../api/client';
import { formatMoney, today } from '../../../utils/format';
import { inputCls } from '../../../components/ui';

const shiftColors = {
  Morning: 'bg-amber-100 text-amber-700',
  Evening: 'bg-blue-100 text-blue-700',
  Night: 'bg-indigo-100 text-indigo-700'
};

export default function ReportModule() {
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    reports: [],
    expenses: [],
    insurance: { records: [], total: 0 },
    purchases: [],
    cashouts: []
  });

  const load = async () => {
    setLoading(true);
    try {
      const [reportsRes, expRes, insRes, cashRes, purRes] = await Promise.all([
        api.get('/reports', { params: { date_from: date, date_to: date } }),
        api.get('/expenses', { params: { date } }),
        api.get('/insurance', { params: { action: 'by_date', date } }),
        api.get('/cashouts', { params: { date } }),
        api.get('/purchases', { params: { date } })
      ]);
      setData({
        reports: reportsRes.data || [],
        expenses: expRes.data || [],
        insurance: insRes.data || { records: [], total: 0 },
        purchases: purRes.data || [],
        cashouts: cashRes.data || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const sumExpenses = data.expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const sumCashouts = data.cashouts.reduce((s, x) => s + Number(x.amount || 0), 0);
  const sumPurchases = data.purchases.reduce((s, x) => s + Number(x.amount || 0), 0);
  const sumPurchasesPaid = data.purchases.reduce((s, x) => s + Number(x.amount_paid || 0), 0);
  const sumPurchasesRemaining = Math.max(0, sumPurchases - sumPurchasesPaid);

  const SummaryCard = ({ label, value, color }) => (
    <div className="bg-white rounded-lg shadow px-4 py-3 border-l-4" style={{ borderLeftColor: color }}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-800">{formatMoney(value)}</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Daily Report</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Search Date</label>
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Sales Total" value={data.reports.reduce((s, r) => s + Number(r.total || 0), 0)} color="#059669" />
        <SummaryCard label="Expenses" value={sumExpenses} color="#dc2626" />
        <SummaryCard label="Insurance Credit" value={Number(data.insurance.total) || 0} color="#db2777" />
        <SummaryCard label="Cashouts" value={sumCashouts} color="#d97706" />
        <SummaryCard label="Purchases" value={sumPurchases} color="#2563eb" />
        <SummaryCard label="Purchases Paid" value={sumPurchasesPaid} color="#059669" />
        <SummaryCard label="Purchase Debt" value={sumPurchasesRemaining} color="#dc2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-700">Sales Report</div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Shift</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Cash</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Momo</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">POS</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">E-Kashi</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Credit</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Total</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="px-3 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : data.reports.length === 0 ? (
                <tr><td colSpan="8" className="px-3 py-6 text-center text-gray-500">No sales report for this date</td></tr>
              ) : (
                data.reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${shiftColors[r.shift_name] || 'bg-gray-100 text-gray-700'}`}>{r.shift_name}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm">{formatMoney(r.cash)}</td>
                    <td className="px-3 py-3 text-right text-sm">{formatMoney(r.momo)}</td>
                    <td className="px-3 py-3 text-right text-sm">{formatMoney(r.pos)}</td>
                    <td className="px-3 py-3 text-right text-sm">{formatMoney(r.ekashi)}</td>
                    <td className="px-3 py-3 text-right text-sm text-amber-600">{formatMoney(r.credit)}</td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-teal-700">{formatMoney(r.total)}</td>
                    <td className="px-3 py-3 text-right text-sm text-red-600">{formatMoney(r.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-700">Expenses</div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Number</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Reason</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Way</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : data.expenses.length === 0 ? (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-gray-500">No expenses for this date</td></tr>
              ) : (
                data.expenses.map((x) => (
                  <tr key={x.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-700">{x.expense_number || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-800">{x.reason}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-red-600">{formatMoney(x.amount)}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{x.way || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-700">Insurance Credit</div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Company</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Client</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Beneficiary %</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Shift</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : data.insurance.records.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-gray-500">No insurance records for this date</td></tr>
              ) : (
                data.insurance.records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-800">{r.company}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{r.client_name}</td>
                    <td className="px-3 py-3 text-right text-sm text-gray-700">{r.beneficiary_percent != null ? `${Number(r.beneficiary_percent)}%` : '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{r.shift_name || '-'}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-teal-700">{formatMoney(r.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-700">Purchases</div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Date</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Shift</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Payment</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Paid</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Remaining</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-3 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : data.purchases.length === 0 ? (
                <tr><td colSpan="7" className="px-3 py-6 text-center text-gray-500">No purchases for this date</td></tr>
              ) : (
                data.purchases.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-700">{r.purchase_date}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.shift_name ? shiftColors[r.shift_name] : 'bg-gray-100 text-gray-700'}`}>
                        {r.shift_name || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.payment_type === 'credit' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {r.payment_type === 'credit' ? 'Credit' : 'Cash'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-gray-800">{formatMoney(r.amount)}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-green-600">{formatMoney(r.amount_paid)}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-red-600">{formatMoney(Math.max(0, Number(r.amount) - Number(r.amount_paid || 0)))}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{r.supplier_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-700">Cashouts</div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Date</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Account</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Person / Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : data.cashouts.length === 0 ? (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-gray-500">No cashouts for this date</td></tr>
              ) : (
                data.cashouts.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-700">{r.cashout_date}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-red-600">{formatMoney(r.amount)}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{r.account || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-800">{r.person_or_reason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}