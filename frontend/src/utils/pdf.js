import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function toStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

export function downloadPdf({ title, subtitle, filename, tables }) {
  const wide = tables.some((t) => t.columns.length > 5);
  const doc = new jsPDF({ orientation: wide ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text(title, 14, 16);

  let startY = 22;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(subtitle, 14, 24);
    startY = 30;
  }
  doc.setTextColor(20);

  tables.forEach((t, i) => {
    if (i > 0) doc.addPage();
    let y = i === 0 ? startY : 16;
    if (t.caption) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20);
      doc.text(t.caption, 14, y + 3);
      y += 8;
    }
    const body = (t.rows || []).map((r) => r.map((cell) => toStr(cell)));
    autoTable(doc, {
      startY: y,
      head: [t.columns],
      body,
      styles: { fontSize: 9, cellPadding: 2.5, textColor: 40 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 250] }
    });
  });

  doc.save(filename);
}