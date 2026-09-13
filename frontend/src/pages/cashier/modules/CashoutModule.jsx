import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api/client';
import { formatMoney, today } from '../../../utils/format';
import { inputCls, btnPrimary, btnDanger } from '../../../components/ui';

const emptyForm = { cashout_date: today(), amount: '', account: '', person_or_reason: '' };

export default function CashoutModule() {
  const [cashouts, setCashouts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/cashouts');
      setCashouts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }
    try {
      await api.post('/cashouts', form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this cashout?')) return;
    try {
      await api.delete(`/cashouts/${id}`);
      load();
    } catch (e) {
      toast.error('Error deleting cashout');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cashout</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className={inputCls} value={form.cashout_date} onChange={(e) => setForm({ ...form, cashout_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cashout Amount</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cashout Account</label>
            <input type="text" className={inputCls} value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Person / Reason</label>
            <input type="text" className={inputCls} value={form.person_or_reason} onChange={(e) => setForm({ ...form, person_or_reason: e.target.value })} />
          </div>
          <div className="md:col-span-4">
            <button type="submit" className={btnPrimary}>+ Add Cashout</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Date</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Account</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Person / Reason</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cashouts.length === 0 && (
              <tr><td colSpan="5" className="px-3 py-6 text-center text-gray-500">No cashouts yet</td></tr>
            )}
            {cashouts.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-sm text-gray-700">{r.cashout_date}</td>
                <td className="px-3 py-3 text-right text-sm font-semibold text-red-600">{formatMoney(r.amount)}</td>
                <td className="px-3 py-3 text-sm text-gray-700">{r.account || '-'}</td>
                <td className="px-3 py-3 text-sm text-gray-800">{r.person_or_reason || '-'}</td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => handleDelete(r.id)} className={btnDanger}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}