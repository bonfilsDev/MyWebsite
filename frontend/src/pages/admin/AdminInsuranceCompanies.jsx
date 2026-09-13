import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { inputCls, btnPrimary, btnDanger } from '../../components/ui';
import DownloadButton from '../../components/DownloadButton';

export default function AdminInsuranceCompanies() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/insurance', { params: { action: 'companies' } });
      setCompanies(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const pdfTables = [
    {
      caption: 'Insurance Companies',
      columns: ['#', 'Company Name'],
      rows: companies.map((c, i) => [i + 1, c.name || '-'])
    }
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Company name is required');
      return;
    }
    try {
      await api.post('/insurance/companies', { name: name.trim() });
      setSuccess('Insurance company added');
      setName('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this insurance company?')) return;
    try {
      await api.delete(`/insurance/companies/${id}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting company');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Insurance Companies</h1>
        <DownloadButton
          title="Insurance Companies"
          subtitle="Stream Pharmacy — registered insurance companies"
          filename="insurance-companies.pdf"
          tables={pdfTables}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Insurance Company</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SONARWA, MMIL..."
            />
          </div>
          <button type="submit" className={btnPrimary}>+ Add Company</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">#</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600">Company Name</th>
              <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr><td colSpan="3" className="px-3 py-6 text-center text-gray-500">No insurance companies yet</td></tr>
            )}
            {companies.map((c, i) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-sm text-gray-500">{i + 1}</td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-800">{c.name}</td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => handleDelete(c.id)} className={btnDanger}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}