import React from 'react';
import toast from 'react-hot-toast';
import { downloadPdf } from '../utils/pdf';

export default function DownloadButton({ title, subtitle, filename, tables, disabled }) {
  const handle = () => {
    if (!tables || tables.length === 0 || tables.every((t) => !t.rows || t.rows.length === 0)) {
      toast('No data to download');
      return;
    }
    downloadPdf({ title, subtitle, filename, tables });
  };

  return (
    <button
      onClick={handle}
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
    >
      📄 Download PDF
    </button>
  );
}