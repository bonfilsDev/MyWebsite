import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api/client';
import { formatMoney, today } from '../../../utils/format';
import { inputCls, btnPrimary, btnEdit, btnDanger } from '../../../components/ui';

const emptyForm = { id: '', expense_number: '', expense_date: today(), reason: '', amount: '', way: '' };

export default function ExpensesModule() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
  try {
    const { data } = await api.get('/expenses');
    setExpenses(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('EXPENSE LOAD ERROR:', e);
    setError(
      e.response?.data?.error ||
      e.message ||
      'Unable to load expenses from the server'
    );
  }
};

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const reason = form.reason.trim();
    const amount = form.amount;
    if (!reason || !amount || Number(amount) <= 0) {
      setError('Reason and valid amount are required');
      return;
    }
    try {
      if (form.id) {
        await api.put(`/expenses/${form.id}`, {
          expense_number: form.expense_number,
          reason,
          amount,
          way: form.way
        });
      } else {
        await api.post('/expenses', {
          expense_number: form.expense_number,
          expense_date: form.expense_date,
          reason,
          amount,
          way: form.way
        });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    }
  };

  const handleEdit = (r) => {
    setForm({
      id: r.id,
      expense_number: r.expense_number || '',
      expense_date: r.expense_date,
      reason: r.reason,
      amount: r.amount,
      way: r.way || ''
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      load();
    } catch (e) {
      toast.error('Error deleting expense');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Expenses</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">{form.id ? 'Edit Expense' : 'Add Expense'}</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
            <input type="text" className={inputCls} value={form.expense_number} onChange={(e) => setForm({ ...form, expense_number: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className={inputCls} value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input type="text" className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Way</label>
            <input type="text" className={inputCls} value={form.way} onChange={(e) => setForm({ ...form, way: e.target.value })} />
          </div>
          <div className="md:col-span-5 flex gap-2">
            <button type="submit" className={btnPrimary}>{form.id ? 'Update Expense' : '+ Add Expense'}</button>
            {form.id && (
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white text-sm font-semibold rounded-lg">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Number</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Date</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Reason</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Way</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr><td colSpan="6" className="px-3 py-6 text-center text-gray-500">No expenses yet</td></tr>
            )}
            {expenses.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-sm text-gray-700">{r.expense_number || '-'}</td>
                <td className="px-3 py-3 text-sm text-gray-700">{r.expense_date}</td>
                <td className="px-3 py-3 text-sm text-gray-800">{r.reason}</td>
                <td className="px-3 py-3 text-right text-sm font-semibold text-red-600">{formatMoney(r.amount)}</td>
                <td className="px-3 py-3 text-sm text-gray-700">{r.way || '-'}</td>
                <td className="px-3 py-3 text-right space-x-3">
                  <button onClick={() => handleEdit(r)} className={btnEdit}>Edit</button>
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