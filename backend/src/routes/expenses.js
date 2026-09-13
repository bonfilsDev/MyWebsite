const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let query = 'SELECT e.*, u.fullname AS cashier_name FROM expenses e JOIN users u ON u.id = e.cashier_id WHERE 1=1';
    const params = [];
    if (!isAdmin) {
      query += ' AND e.cashier_id = ?';
      params.push(req.user.id);
    } else if (req.query.cashier_id) {
      query += ' AND e.cashier_id = ?';
      params.push(req.query.cashier_id);
    }
    if (req.query.date) {
      query += ' AND e.expense_date = ?';
      params.push(req.query.date);
    }
    if (req.query.date_from) {
      query += ' AND e.expense_date >= ?';
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      query += ' AND e.expense_date <= ?';
      params.push(req.query.date_to);
    }
    query += ' ORDER BY e.expense_date DESC, e.id DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const cashierId = req.user.id;
    const {
      expense_number = '',
      expense_date = new Date().toISOString().slice(0, 10),
      reason,
      amount,
      way = ''
    } = req.body || {};
    if (!reason || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Reason and valid amount are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO expenses (cashier_id, expense_number, expense_date, reason, amount, way) VALUES (?, ?, ?, ?, ?, ?)',
      [cashierId, expense_number, expense_date, reason, amount, way]
    );
    res.json({ success: true, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cashierId = req.user.id;
    const { expense_number = '', reason, amount, way = '' } = req.body || {};
    if (!id || !reason || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Reason and valid amount are required' });
    }
    await pool.query(
      'UPDATE expenses SET expense_number = ?, reason = ?, amount = ?, way = ? WHERE id = ? AND cashier_id = ?',
      [expense_number, reason, amount, way, id, cashierId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cashierId = req.user.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    await pool.query('DELETE FROM expenses WHERE id = ? AND cashier_id = ?', [id, cashierId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
