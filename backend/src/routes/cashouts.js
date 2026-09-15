const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET all cashouts
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    let query = `
      SELECT
        c.id,
        c.cashier_id,
        c.amount,
        c.account,
        c.reason AS person_or_reason,
        c.cashout_date,
        u.fullname AS cashier_name
      FROM cashouts c
      JOIN users u ON u.id = c.cashier_id
      WHERE 1=1
    `;

    const params = [];

    // Cashiers can only see their own cashouts
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
    console.error('Get cashouts error:', e);

    res.status(500).json({
      error: 'Server error',
      details: e.message
    });
  }
});

// CREATE a cashout
router.post('/', async (req, res) => {
  try {
    const cashierId = req.user.id;

    const {
      cashout_date = new Date().toISOString().slice(0, 10),
      amount,
      account = '',
      person_or_reason = '',
      reason = ''
    } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'Valid amount is required'
      });
    }

    // Use person_or_reason first, with reason as a fallback
    const finalReason = person_or_reason || reason || '';

    const [result] = await pool.query(
      `
      INSERT INTO cashouts
        (cashier_id, cashout_date, amount, account, reason)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        cashierId,
        cashout_date,
        Number(amount),
        account,
        finalReason
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cashout created successfully',
      id: result.insertId
    });
  } catch (e) {
    console.error('Create cashout error:', e);

    res.status(500).json({
      error: 'Server error',
      details: e.message
    });
  }
});

// DELETE a cashout
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cashierId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        error: 'Invalid ID'
      });
    }

    let query = 'DELETE FROM cashouts WHERE id = ?';
    const params = [id];

    // Admin can delete any cashout
    // Cashier can delete only their own cashout
    if (!isAdmin) {
      query += ' AND cashier_id = ?';
      params.push(cashierId);
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Cashout not found or not authorized'
      });
    }

    res.json({
      success: true,
      message: 'Cashout deleted successfully'
    });
  } catch (e) {
    console.error('Delete cashout error:', e);

    res.status(500).json({
      error: 'Server error',
      details: e.message
    });
  }
});

module.exports = router;