import React from 'react';

export function StatCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border-l-4" style={{ borderLeftColor: color }}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-800 mt-1">
        {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : value}
      </div>
    </div>
  );
}

export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm';

export const btnPrimary =
  'px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition';

export const btnDanger =
  'text-red-600 hover:text-red-800 text-sm font-semibold';

export const btnEdit = 'text-blue-600 hover:text-blue-800 text-sm font-semibold';
