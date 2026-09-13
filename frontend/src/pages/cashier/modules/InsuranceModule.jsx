import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api/client';
import { formatMoney, today } from '../../../utils/format';
import { inputCls, btnPrimary, btnDanger } from '../../../components/ui';

const shifts = [
  { id: 1, name: 'Morning' },
  { id: 2, name: 'Evening' },
  { id: 3, name: 'Night' }
];

export default function InsuranceModule() {
  const [companies, setCompanies] = useState([]);
  const [date, setDate] = useState(today());
  const [shiftId, setShiftId] = useState('');
  const [records, setRecords] = useState([]);
  const [recordTotal, setRecordTotal] = useState(0);
  const [summary, setSummary] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [form, setForm] = useState({ insurance_id: '', client_name: '', beneficiary_percent: '', amount: '' });
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const insParams = { action: 'by_date', date };
      if (shiftId) insParams.shift_id = shiftId;
      const [companiesRes, recordsRes, summaryRes] = await Promise.all([
        api.get('/insurance', { params: { action: 'companies' } }),
        api.get('/insurance', { params: insParams }),
        api.get('/insurance', { params: { action: 'daily_summary', date } })
      ]);
      setCompanies(companiesRes.data);
      setRecords(recordsRes.data.records || []);
      setRecordTotal(Number(recordsRes.data.total) || 0);
      setSummary(summaryRes.data.summary || []);
      setGrandTotal(Number(summaryRes.data.grand_total) || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadAll(); }, [date, shiftId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.insurance_id) { setError('Please select an insurance company'); return; }
    if (!form.client_name.trim()) { setError('Client name is required'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    try {
      await api.post('/insurance', {
        insurance_id: form.insurance_id,
        date,
        shift_id: shiftId || null,
        client_name: form.client_name,
        beneficiary_percent: form.beneficiary_percent || 0,
        amount: form.amount
      });
      setForm({ insurance_id: '', client_name: '', beneficiary_percent: '', amount: '' });
      setShiftId('');
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/insurance/${id}`);
      loadAll();
    } catch (e) {
      toast.error('Error deleting');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Insurance</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <select className={inputCls} value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
              <option value="">-- Select Shift --</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Company</label>
            <select className={inputCls} value={form.insurance_id} onChange={(e) => setForm({ ...form, insurance_id: e.target.value })}>
              <option value="">-- Select Insurance --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input type="text" className={inputCls} value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary %</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.beneficiary_percent} onChange={(e) => setForm({ ...form, beneficiary_percent: e.target.value })} placeholder="0" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="md:col-span-4">
            <button type="submit" className={btnPrimary}>+ Add Credit</button>
          </div>
        </form>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mt-4">{error}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Records for {date}</h2>
            <span className="text-sm font-bold text-teal-700">Total: {formatMoney(recordTotal)}</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Company</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Client</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Beneficiary %</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600">Shift</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan="6" className="px-3 py-6 text-center text-gray-500">No records for this date</td></tr>
              )}
              {records.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-800">{r.company}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{r.client_name}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-700">{r.beneficiary_percent != null ? `${Number(r.beneficiary_percent)}%` : '-'}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{r.shift_name || '-'}</td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-teal-700">{formatMoney(r.amount)}</td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => handleDelete(r.id)} className={btnDanger}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Credit Summary</h2>
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
                <tr><td colSpan="3" className="px-3 py-6 text-center text-gray-500">No insurance credits for this date</td></tr>
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
    </div>
  );
}