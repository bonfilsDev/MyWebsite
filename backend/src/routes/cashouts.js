const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let query = 'SELECT c.*, u.fullname AS cashier_name FROM cashouts c JOIN users u ON u.id = c.cashier_id WHERE 1=1';
    const params = [];
    if (!isAdmin) {
      query += ' AND c.cashier_id = ?';
      params.push(req.user.id);
    } else if (req.query.cashier_id) {
      query += ' AND c.cashier_id = ?';
      params.push(req.query.cashier_id);
    }
    if (req.query.date) {
      query += ' AND c.cashout_date = ?';
      params.push(req.query.date);
    }
    if (req.query.date_from) {
      query += ' AND c.cashout_date >= ?';
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      query += ' AND c.cashout_date <= ?';
      params.push(req.query.date_to);
    }
    query += ' ORDER BY c.cashout_date DESC, c.id DESC';
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
      cashout_date = new Date().toISOString().slice(0, 10),
      amount,
      account = '',
      person_or_reason = ''
    } = req.body || {};
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO cashouts (cashier_id, cashout_date, amount, account, person_or_reason) VALUES (?, ?, ?, ?, ?)',
      [cashierId, cashout_date, amount, account, person_or_reason]
    );
    res.json({ success: true, id: result.insertId });
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
    await pool.query('DELETE FROM cashouts WHERE id = ? AND cashier_id = ?', [id, cashierId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
