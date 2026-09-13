import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatMoney } from '../../utils/format';
import DownloadButton from '../../components/DownloadButton';

export default function AdminInsurance() {
  const [cashiers, setCashiers] = useState([]);
  const [cashierId, setCashierId] = useState('all');
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  const load = async () => {
    try {
      const sumParams = { action: 'daily_summary', date };
      if (cashierId !== 'all') {
        sumParams.cashier_id = cashierId;
      }
      const [summaryRes, cashRes] = await Promise.all([
        api.get('/insurance', { params: sumParams }),
        api.get('/cashiers')
      ]);
      setSummary(summaryRes.data.summary || []);
      setGrandTotal(Number(summaryRes.data.grand_total) || 0);
      setCashiers(cashRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const pdfTables = [
    {
      caption: 'Insurance Credit Summary',
      columns: ['Company', 'Clients', 'Total'],
      rows: [
        ...summary.map((r) => [r.company || '-', r.client_count || 0, formatMoney(r.total_amount)]),
        ['GRAND TOTAL', '', formatMoney(grandTotal)]
      ]
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cashier Insurance Credits</h1>
        <DownloadButton
          title="Insurance Report"
          subtitle={`Stream Pharmacy — insurance credit summary${date ? ` for ${date}` : ''}`}
          filename="insurance-report.pdf"
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
        <button onClick={load} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg">
          Search
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Credit Summary {date ? `for ${date}` : ''}</h2>
          <span className="text-sm font-bold text-teal-700">Grand Total: {formatMoney(grandTotal)}</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Company</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Clients</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 && (
              <tr><td colSpan="3" className="px-3 py-6 text-center text-gray-500">No insurance credits found</td></tr>
            )}
            {summary.map((r) => (
              <tr key={r.company} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-sm font-semibold text-gray-800">{r.company}</td>
                <td className="px-3 py-3 text-right text-sm text-gray-700">{r.client_count}</td>
                <td className="px-3 py-3 text-right text-sm font-bold text-teal-700">{formatMoney(r.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}