import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api/client';
import { formatMoney, today } from '../../../utils/format';
import { inputCls, btnPrimary, btnEdit, btnDanger } from '../../../components/ui';

const shifts = [
  { id: 1, name: 'Morning' },
  { id: 2, name: 'Evening' },
  { id: 3, name: 'Night' }
];

const shiftColors = {
  Morning: 'bg-amber-100 text-amber-700',
  Evening: 'bg-blue-100 text-blue-700',
  Night: 'bg-indigo-100 text-indigo-700'
};

const emptyForm = { id: '', purchase_date: today(), shift_id: '', payment_type: 'cash', amount: '', place: 'branch', invoice_number: '', supplier_name: '' };

export default function PurchasesModule() {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payDrafts, setPayDrafts] = useState({});

  const load = async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (dateFilter) params.date = dateFilter;
      if (shiftFilter) params.shift_id = shiftFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await api.get('/purchases', { params });
      setPurchases(data);
      setPayDrafts({});
    } catch (e) {
      console.error(e);
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
    const supplier = form.supplier_name.trim();
    if (!supplier) {
      setError('Supplier name is required');
      return;
    }
    if (!form.shift_id) {
      setError('Please select a shift');
      return;
    }
    try {
      if (form.id) {
        await api.put(`/purchases/${form.id}`, {
          payment_type: form.payment_type,
          amount: form.amount || 0,
          place: form.place,
          invoice_number: form.invoice_number,
          supplier_name: supplier,
          shift_id: form.shift_id
        });
      } else {
        await api.post('/purchases', {
          purchase_date: form.purchase_date,
          shift_id: form.shift_id,
          payment_type: form.payment_type,
          amount: form.amount || 0,
          place: form.place,
          invoice_number: form.invoice_number,
          supplier_name: supplier
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
      purchase_date: r.purchase_date,
      shift_id: r.shift_id || '',
      payment_type: r.payment_type,
      amount: r.amount,
      place: r.place || 'branch',
      invoice_number: r.invoice_number || '',
      supplier_name: r.supplier_name
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase?')) return;
    try {
      await api.delete(`/purchases/${id}`);
      load();
    } catch (e) {
      toast.error('Error deleting purchase');
    }
  };

  const handlePay = async (id) => {
    if (!window.confirm('Mark this purchase as Paid?')) return;
    try {
      await api.patch(`/purchases/${id}/pay`);
      setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'paid', amount_paid: Number(p.amount || 0), datepaid: new Date().toISOString() } : p)));
    } catch (e) {
      toast.error('Error updating purchase');
    }
  };

  const handleUnpay = async (id) => {
    if (!window.confirm('Mark this purchase as Unpaid?')) return;
    try {
      await api.patch(`/purchases/${id}/unpay`);
      setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'unpaid', amount_paid: 0, datepaid: null } : p)));
    } catch (e) {
      toast.error('Error updating purchase');
    }
  };

  const setDraft = (id, value) => {
    setPayDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const extraDraft = (r) => {
    const draft = payDrafts[r.id];
    if (draft === undefined || String(draft).trim() === '') return 0;
    const n = Number(draft);
    return isNaN(n) ? 0 : Math.max(0, n);
  };

  const savePayment = async (id) => {
    const draft = payDrafts[id];
    if (draft === undefined || String(draft).trim() === '') return;
    const amountPaid = Math.max(0, Number(draft) || 0);
    if (amountPaid === 0) return;
    try {
      await api.patch(`/purchases/${id}/payment`, { amount_paid: amountPaid });
      setPayDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
    } catch (e) {
      toast.error('Error updating amount paid');
    }
  };

  const remaining = (r) => Math.max(0, Number(r.remain || 0) - extraDraft(r));

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString();
  };

  const statusBadge = (r) => {
    const rem = remaining(r);
    if (rem === 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Paid</span>;
    }
    if (Number(r.amount_paid || 0) > 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Partial</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Unpaid</span>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Purchases</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">{form.id ? 'Edit Purchase' : 'Add Purchase'}</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className={inputCls} value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <select className={inputCls} value={form.shift_id} onChange={(e) => setForm({ ...form, shift_id: e.target.value })}>
              <option value="">-- Select Shift --</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
            <select className={inputCls} value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })}>
              <option value="cash">In Cash</option>
              <option value="credit">In Credit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
            <select className={inputCls} value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })}>
              <option value="branch">Branch</option>
              <option value="main">Main</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <input type="text" className={inputCls} value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
            <input type="text" className={inputCls} value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} required />
          </div>
          <div className="md:col-span-2 lg:col-span-5 flex gap-2 items-end">
            <button type="submit" className={btnPrimary}>{form.id ? 'Update Purchase' : '+ Add Purchase'}</button>
            {form.id && (
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white text-sm font-semibold rounded-lg">
                Cancel
              </button>
            )}
          </div>
        </form>
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
          <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Date</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Shift</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Payment</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Amount</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Paid</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Place</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Remain</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Invoice</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Supplier</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Status</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Date Paid</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 && (
              <tr><td colSpan="12" className="px-3 py-6 text-center text-gray-500">No purchases found</td></tr>
            )}
            {purchases.map((r) => {
              const rem = remaining(r);
              const currentRemain = Math.max(0, Number(r.remain || 0));
              const hasDraft = payDrafts[r.id] !== undefined && String(payDrafts[r.id]).trim() !== '';
              return (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-700">{r.purchase_date}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.shift_name ? shiftColors[r.shift_name] : 'bg-gray-100 text-gray-700'}`}>
                      {r.shift_name || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.payment_type === 'credit' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {r.payment_type === 'credit' ? 'In Credit' : 'In Cash'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-gray-800">{formatMoney(r.amount)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={currentRemain}
                          value={payDrafts[r.id] !== undefined ? payDrafts[r.id] : ''}
                          onChange={(e) => setDraft(r.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); savePayment(r.id); } }}
                          onBlur={() => savePayment(r.id)}
                          placeholder="0.00"
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        />
                        {hasDraft && (
                          <button onClick={() => savePayment(r.id)} className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition">
                            Save
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">Paid: {formatMoney(r.amount_paid || 0)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">{r.place || '-'}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-sm font-bold ${rem === 0 ? 'text-green-600' : rem < Number(r.amount) ? 'text-amber-600' : 'text-red-600'}`}>
                      {formatMoney(rem)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">{r.invoice_number || '-'}</td>
                  <td className="px-3 py-3 text-sm text-gray-800">{r.supplier_name}</td>
                  <td className="px-3 py-3">{statusBadge(r)}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{r.datepaid ? formatDate(r.datepaid) : '-'}</td>
                  <td className="px-3 py-3 text-right space-x-3 whitespace-nowrap">
                    {r.payment_type === 'credit' && (
                      r.status !== 'paid' ? (
                        <button onClick={() => handlePay(r.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition">
                          Is Paid
                        </button>
                      ) : (
                        <button onClick={() => handleUnpay(r.id)} className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition">
                          Unpay
                        </button>
                      )
                    )}
                    <button onClick={() => handleEdit(r)} className={btnEdit}>Edit</button>
                    <button onClick={() => handleDelete(r.id)} className={btnDanger}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}