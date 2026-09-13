const express = require('express');
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/companies', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    const companyName = String(name).trim();
    const [existing] = await pool.query('SELECT id FROM insurance_companies WHERE name = ?', [companyName]);
    if (existing.length) {
      return res.status(400).json({ error: 'This insurance company already exists' });
    }
    const [result] = await pool.query('INSERT INTO insurance_companies (name) VALUES (?)', [companyName]);
    res.json({ success: true, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/companies/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const [used] = await pool.query('SELECT id FROM insurance_records WHERE insurance_id = ? LIMIT 1', [id]);
    if (used.length) {
      return res.status(400).json({ error: 'Cannot delete: this insurance company already has records' });
    }
    await pool.query('DELETE FROM insurance_companies WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const cashierId = req.user.id;
    const action = req.query.action || 'list';

    if (action === 'companies') {
      const [rows] = await pool.query('SELECT id, name FROM insurance_companies ORDER BY name');
      return res.json(rows);
    }

    if (action === 'by_date') {
      const date = req.query.date || new Date().toISOString().slice(0, 10);
      const isAdmin = req.user.role === 'admin';
      let query =
        'SELECT ir.id, ir.cashier_id, u.fullname AS cashier_name, ir.insurance_id, ic.name AS company, ir.client_name, ir.beneficiary_percent, ir.amount, ir.shift_id, s.name AS shift_name ' +
        'FROM insurance_records ir JOIN insurance_companies ic ON ic.id = ir.insurance_id ' +
        'JOIN users u ON u.id = ir.cashier_id ' +
        'LEFT JOIN shifts s ON s.id = ir.shift_id ' +
        'WHERE ir.record_date = ?';
      const params = [date];
      if (!isAdmin) {
        query += ' AND ir.cashier_id = ?';
        params.push(req.user.id);
      } else if (req.query.cashier_id) {
        query += ' AND ir.cashier_id = ?';
        params.push(req.query.cashier_id);
      }
      if (req.query.shift_id) {
        query += ' AND ir.shift_id = ?';
        params.push(req.query.shift_id);
      }
      query += ' ORDER BY ic.name, ir.client_name';
      const [records] = await pool.query(query, params);
      const total = records.reduce((s, r) => s + Number(r.amount), 0);
      return res.json({ records, total });
    }

    if (action === 'daily_summary') {
      const date = req.query.date || new Date().toISOString().slice(0, 10);
      const isAdmin = req.user.role === 'admin';
      let query =
        'SELECT ic.name AS company, SUM(ir.amount) AS total_amount, COUNT(ir.id) AS client_count ' +
        'FROM insurance_records ir JOIN insurance_companies ic ON ic.id = ir.insurance_id ' +
        'WHERE ir.record_date = ?';
      const params = [date];
      if (!isAdmin) {
        query += ' AND ir.cashier_id = ?';
        params.push(req.user.id);
      } else if (req.query.cashier_id) {
        query += ' AND ir.cashier_id = ?';
        params.push(req.query.cashier_id);
      }
      query += ' GROUP BY ir.insurance_id, ic.name ORDER BY ic.name';
      const [summary] = await pool.query(query, params);
      const grandTotal = summary.reduce((s, r) => s + Number(r.total_amount), 0);
      return res.json({ summary, grand_total: grandTotal });
    }

    return res.json([]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const cashierId = req.user.id;
    const { insurance_id, date, client_name, amount, shift_id, beneficiary_percent } = req.body || {};
    if (!insurance_id || !client_name || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Insurance company, client name, and valid amount are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO insurance_records (cashier_id, insurance_id, record_date, shift_id, client_name, beneficiary_percent, amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cashierId, insurance_id, date, shift_id || null, client_name, beneficiary_percent || 0, amount]
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
    const { client_name, amount, beneficiary_percent } = req.body || {};
    if (!id || !client_name || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Client name and valid amount are required' });
    }
    await pool.query(
      'UPDATE insurance_records SET client_name = ?, amount = ?, beneficiary_percent = ? WHERE id = ? AND cashier_id = ?',
      [client_name, amount, beneficiary_percent || 0, id, cashierId]
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
    await pool.query('DELETE FROM insurance_records WHERE id = ? AND cashier_id = ?', [id, cashierId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
