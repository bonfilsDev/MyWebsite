const express = require('express');
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

function getWeekRange(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => {
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const dd = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  return { start: fmt(monday), end: fmt(sunday) };
}

router.get('/', async (req, res) => {
  try {
    const type = req.query.type || 'weekly';

    if (type === 'daily') {
      const date = req.query.date || new Date().toISOString().slice(0, 10);
      const cashierId = req.query.cashier_id || 'all';
      let query =
        'SELECT COALESCE(SUM(r.cash),0) as cash, COALESCE(SUM(r.momo),0) as momo, ' +
        'COALESCE(SUM(r.credit),0) as credit, COALESCE(SUM(r.pos),0) as pos, ' +
        'COALESCE(SUM(r.ekashi),0) as ekashi, ' +
        'COALESCE(SUM(r.total),0) as total, COALESCE(SUM(r.balance),0) as balance, ' +
        'COUNT(DISTINCT r.cashier_id) as cashiers_active, COUNT(r.id) as report_count ' +
        'FROM daily_reports r WHERE r.report_date = ?';
      const params = [date];
      if (cashierId !== 'all') {
        query += ' AND r.cashier_id = ?';
        params.push(cashierId);
      }
      const [rows] = await pool.query(query, params);
      return res.json(rows[0]);
    }

    if (type === 'weekly') {
      const range = getWeekRange(req.query.date || new Date().toISOString().slice(0, 10));
      const cashierId = req.query.cashier_id || 'all';
      const query =
        'SELECT COALESCE(SUM(r.cash),0) as cash, COALESCE(SUM(r.momo),0) as momo, ' +
        'COALESCE(SUM(r.credit),0) as credit, COALESCE(SUM(r.pos),0) as pos, ' +
        'COALESCE(SUM(r.ekashi),0) as ekashi, ' +
        'COALESCE(SUM(r.total),0) as total, COALESCE(SUM(r.balance),0) as balance, ' +
        "(SELECT COUNT(DISTINCT report_date) FROM daily_reports WHERE report_date BETWEEN ? AND ? AND (? = 'all' OR cashier_id = ?)) as days_count " +
        'FROM daily_reports r WHERE r.report_date BETWEEN ? AND ? AND (? = \'all\' OR r.cashier_id = ?)';
      const params = [
        range.start, range.end, cashierId, cashierId,
        range.start, range.end, cashierId, cashierId
      ];
      const [rows] = await pool.query(query, params);
      const result = rows[0];
      result.start = range.start;
      result.end = range.end;
      return res.json(result);
    }

    if (type === 'trend') {
      const cashierId = req.query.cashier_id || 'all';
      const days = 7;
      const date = req.query.date
        ? new Date(req.query.date + 'T00:00:00')
        : new Date();
      const end = date.toISOString().slice(0, 10);
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - (days - 1));
      const start = startDate.toISOString().slice(0, 10);

      const groupQuery =
        'WITH RECURSIVE dates AS (' +
        '  SELECT DATE(?) AS d ' +
        '  UNION ALL ' +
        '  SELECT DATE_SUB(d, INTERVAL 1 DAY) FROM dates WHERE d > DATE(?)' +
        ') ' +
        'SELECT dates.d, ' +
        '  COALESCE(SUM(r.cash),0) as cash, COALESCE(SUM(r.momo),0) as momo, ' +
        '  COALESCE(SUM(r.credit),0) as credit, COALESCE(SUM(r.pos),0) as pos, ' +
        '  COALESCE(SUM(r.ekashi),0) as ekashi, ' +
        '  COALESCE(SUM(r.total),0) as total, COALESCE(SUM(r.balance),0) as balance, ' +
        '  COUNT(r.id) as count ' +
        'FROM dates ' +
        'LEFT JOIN daily_reports r ' +
        '  ON r.report_date = dates.d AND (? = \'all\' OR r.cashier_id = ?) ' +
        'GROUP BY dates.d ORDER BY dates.d';
      const [rows] = await pool.query(groupQuery, [end, start, cashierId, cashierId]);
      const trend = rows.map((r) => ({
        date: r.d,
        cash: Number(r.cash),
        momo: Number(r.momo),
        credit: Number(r.credit),
        pos: Number(r.pos),
        ekashi: Number(r.ekashi),
        total: Number(r.total),
        balance: Number(r.balance),
        count: Number(r.count)
      }));
      return res.json({ start, end, trend });
    }

    return res.status(400).json({ error: 'Invalid type' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
