import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { inputCls, btnPrimary, btnEdit, btnDanger } from '../../components/ui';
import DownloadButton from '../../components/DownloadButton';

export default function AdminCashiers() {
  const [cashiers, setCashiers] = useState([]);
  const [form, setForm] = useState({ id: '', fullname: '', email: '', username: '', password: '' });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/cashiers');
      setCashiers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const pdfTables = [
    {
      caption: 'Cashier Accounts',
      columns: ['Full Name', 'Email', 'Username', 'Created'],
      rows: cashiers.map((c) => [c.fullname || '-', c.email || '-', c.username || '-', c.created_at ? String(c.created_at).slice(0, 10) : '-'])
    }
  ];

  const resetForm = () => {
    setForm({ id: '', fullname: '', email: '', username: '', password: '' });
    setEditing(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editing) {
        await api.put(`/cashiers/${form.id}`, {
          fullname: form.fullname,
          email: form.email,
          password: form.password
        });
        setSuccess('Cashier updated successfully');
      } else {
        await api.post('/cashiers', {
          fullname: form.fullname,
          email: form.email,
          username: form.username,
          password: form.password
        });
        setSuccess('Cashier created successfully');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (c) => {
    setForm({ id: c.id, fullname: c.fullname, email: c.email || '', username: c.username, password: '' });
    setEditing(true);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete cashier "${c.fullname}"?`)) return;
    try {
      await api.delete(`/cashiers/${c.id}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Cashiers</h1>
        <DownloadButton
          title="Cashiers Report"
          subtitle="Stream Pharmacy — cashier accounts"
          filename="cashiers-report.pdf"
          tables={pdfTables}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">{editing ? 'Edit Cashier' : 'Add New Cashier'}</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className={inputCls}
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="for email login"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              className={inputCls}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={editing}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editing && <span className="text-gray-400">(leave blank to keep)</span>}
            </label>
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className={btnPrimary}>
              {editing ? 'Update' : 'Add Cashier'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white text-sm font-semibold rounded-lg">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-3 py-3 text-sm font-semibold text-gray-600">Full Name</th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600">Email</th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600">Username</th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600">Created</th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.length === 0 && (
              <tr><td colSpan="5" className="px-3 py-6 text-center text-gray-500">No cashiers yet</td></tr>
            )}
            {cashiers.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-sm text-gray-800">{c.fullname}</td>
                <td className="px-3 py-3 text-sm text-gray-600">{c.email || '-'}</td>
                <td className="px-3 py-3 text-sm text-gray-600">{c.username}</td>
                <td className="px-3 py-3 text-sm text-gray-600">{c.created_at?.slice(0, 10)}</td>
                <td className="px-3 py-3 text-right space-x-3">
                  <button onClick={() => handleEdit(c)} className={btnEdit}>Edit</button>
                  <button onClick={() => handleDelete(c)} className={btnDanger}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}