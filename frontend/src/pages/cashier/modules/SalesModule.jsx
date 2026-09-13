import React, { useEffect, useState } from 'react';
import api from '../../../api/client';
import { formatMoney, today } from '../../../utils/format';
import { inputCls, btnPrimary } from '../../../components/ui';

const shifts = [
  { id: 1, name: 'Morning' },
  { id: 2, name: 'Evening' },
  { id: 3, name: 'Night' }
];

export default function SalesModule() {
  const [date, setDate] = useState(today());
  const [shiftId, setShiftId] = useState('');
  const [values, setValues] = useState({
    cash: '', momo: '', pos: '', ekashi: '', credit: '', balance: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const total = [
    Number(values.cash) || 0,
    Number(values.momo) || 0,
    Number(values.pos) || 0,
    Number(values.ekashi) || 0,
    Number(values.credit) || 0
  ].reduce((a, b) => a + b, 0);

  const set = (key) => (e) => {
    const val = e.target.value;
    setValues((v) => ({ ...v, [key]: val }));
  };

  useEffect(() => {
    if (!shiftId) return;
    const loadCredit = async () => {
      try {
        const { data } = await api.get('/insurance', { params: { action: 'by_date', date, shift_id: shiftId } });
        setValues((v) => ({ ...v, credit: String(Number(data.total) || 0) }));
      } catch (e) {
        setValues((v) => ({ ...v, credit: '0' }));
      }
    };
    loadCredit();
  }, [date, shiftId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!shiftId) {
      setError('Please select a shift');
      return;
    }
    try {
      const payload = {
        report_date: date,
        shift_id: shiftId,
        cash: values.cash || 0,
        momo: values.momo || 0,
        pos: values.pos || 0,
        ekashi: values.ekashi || 0,
        credit: values.credit || 0,
        balance: values.balance || 0
      };
      const { data } = await api.post('/reports', payload);
      setSuccess(`Sales report saved! Total: ${formatMoney(data.total)}`);
      setValues({ cash: '', momo: '', pos: '', ekashi: '', credit: '', balance: '' });
      setShiftId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales Report</h1>

      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className={inputCls}>
                <option value="">-- Select Shift --</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash</label>
              <input type="number" step="0.01" min="0" value={values.cash} onChange={set('cash')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Momo</label>
              <input type="number" step="0.01" min="0" value={values.momo} onChange={set('momo')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">POS</label>
              <input type="number" step="0.01" min="0" value={values.pos} onChange={set('pos')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Kashi</label>
              <input type="number" step="0.01" min="0" value={values.ekashi} onChange={set('ekashi')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit (insurance auto)</label>
              <input type="number" step="0.01" min="0" value={values.credit} onChange={set('credit')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance Remaining</label>
              <input type="number" step="0.01" min="0" value={values.balance} onChange={set('balance')} className={inputCls} />
            </div>
          </div>

          <div className="bg-teal-50 rounded-lg p-5 border border-teal-200 flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-teal-800">Total (automatic)</span>
            <span className="text-2xl font-bold text-teal-700">{formatMoney(total)}</span>
          </div>

          <button type="submit" className={btnPrimary}>
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}