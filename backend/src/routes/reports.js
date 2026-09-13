const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let query =
      'SELECT r.*, u.fullname, s.name AS shift_name FROM daily_reports r ' +
      'JOIN users u ON u.id = r.cashier_id JOIN shifts s ON s.id = r.shift_id WHERE 1=1';
    const params = [];

    if (!isAdmin) {
      query += ' AND r.cashier_id = ?';
      params.push(req.user.id);
    } else if (req.query.cashier_id && req.query.cashier_id !== 'all') {
      query += ' AND r.cashier_id = ?';
      params.push(req.query.cashier_id);
    }

    if (req.query.date_from) {
      query += ' AND r.report_date >= ?';
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      query += ' AND r.report_date <= ?';
      params.push(req.query.date_to);
    }

    query += ' ORDER BY r.report_date DESC, r.shift_id';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Cashier only action' });
    }
    const cashierId = req.user.id;
    const {
      report_date = new Date().toISOString().slice(0, 10),
      shift_id,
      cash = 0,
      momo = 0,
      credit = 0,
      pos = 0,
      ekashi = 0,
      balance = 0
    } = req.body || {};

    if (!shift_id) {
      return res.status(400).json({ error: 'Shift is required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM daily_reports WHERE report_date = ? AND shift_id = ?',
      [report_date, shift_id]
    );
    if (existing.length) {
      return res.status(400).json({ error: 'This shift has already ended and was submitted for this date' });
    }

    const total = Number(cash) + Number(momo) + Number(credit) + Number(pos) + Number(ekashi);

    const [result] = await pool.query(
      `INSERT INTO daily_reports
        (cashier_id, report_date, shift_id, cash, momo, credit, pos, ekashi, balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cashierId, report_date, shift_id, cash, momo, credit, pos, ekashi, balance]
    );
    res.json({ success: true, id: result.insertId, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
