const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let query = 'SELECT p.*, u.fullname AS cashier_name, s.name AS shift_name FROM purchases p JOIN users u ON u.id = p.cashier_id LEFT JOIN shifts s ON s.id = p.shift_id WHERE 1=1';
    const params = [];
    if (!isAdmin) {
      query += ' AND p.cashier_id = ?';
      params.push(req.user.id);
    }
    if (req.query.cashier_id && isAdmin) {
      query += ' AND p.cashier_id = ?';
      params.push(req.query.cashier_id);
    }
    if (req.query.shift_id) {
      query += ' AND p.shift_id = ?';
      params.push(req.query.shift_id);
    }
    if (req.query.date) {
      query += ' AND p.purchase_date = ?';
      params.push(req.query.date);
    }
    if (req.query.date_from) {
      query += ' AND p.purchase_date >= ?';
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      query += ' AND p.purchase_date <= ?';
      params.push(req.query.date_to);
    }
    if (req.query.search) {
      query += ' AND (p.supplier_name LIKE ? OR p.invoice_number LIKE ? OR CAST(p.amount AS CHAR) LIKE ? OR CAST(p.purchase_date AS CHAR) LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like);
    }
    if (req.query.status) {
      query += ' AND p.status = ?';
      params.push(req.query.status);
    }
    query += ' ORDER BY p.purchase_date DESC, p.id DESC';
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
      purchase_date = new Date().toISOString().slice(0, 10),
      shift_id = null,
      payment_type = 'cash',
      amount = 0,
      amount_paid = 0,
      invoice_number = '',
      supplier_name,
      place = '',
      remain = 0
    } = req.body || {};
    if (!supplier_name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    if (!shift_id) {
      return res.status(400).json({ error: 'Shift is required' });
    }
    const type = payment_type === 'credit' ? 'credit' : 'cash';
    const amountNum = Number(amount || 0);
    const isPaid = type === 'cash';
    let paid = isPaid ? amountNum : Math.min(amountNum, Number(amount_paid || 0));
    let status = 'unpaid';
    let datepaid = null;
    let remainVal = Math.max(0, Number(remain || 0));
    if (isPaid) {
      paid = amountNum;
      status = 'paid';
      datepaid = `${purchase_date} 00:00:00`;
      remainVal = 0;
    } else {
      remainVal = Math.max(0, amountNum - paid);
      status = remainVal === 0 ? 'paid' : 'unpaid';
      if (remainVal === 0) datepaid = `${purchase_date} 00:00:00`;
    }
    const [result] = await pool.query(
      'INSERT INTO purchases (cashier_id, purchase_date, shift_id, payment_type, amount, amount_paid, status, datepaid, invoice_number, supplier_name, place, remain) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [cashierId, purchase_date, shift_id, type, amount, paid, status, datepaid, invoice_number, supplier_name, place, remainVal]
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
    const { payment_type = 'cash', amount = 0, invoice_number = '', supplier_name, place = '', shift_id = null } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const [existing] = await pool.query('SELECT amount_paid, remain, purchase_date FROM purchases WHERE id = ? AND cashier_id = ?', [id, cashierId]);
    if (!existing.length) return res.status(404).json({ error: 'Purchase not found' });
    const type = payment_type === 'credit' ? 'credit' : 'cash';
    let paid = Number(existing[0].amount_paid || 0);
    let status = 'unpaid';
    let datepaid = null;
    const amountNum = Number(amount || 0);
    if (type === 'cash') {
      paid = amountNum;
      status = 'paid';
      datepaid = `${existing[0].purchase_date} 00:00:00`;
    } else {
      paid = Math.min(amountNum, paid);
    }
    const remain = Math.max(0, amountNum - paid);
    if (type === 'credit') {
      status = remain === 0 ? 'paid' : 'unpaid';
      if (remain === 0) datepaid = `${existing[0].purchase_date} 00:00:00`;
      else datepaid = null;
    }
    await pool.query(
      'UPDATE purchases SET payment_type = ?, amount = ?, amount_paid = ?, status = ?, datepaid = ?, invoice_number = ?, supplier_name = ?, place = ?, shift_id = ?, remain = ? WHERE id = ? AND cashier_id = ?',
      [type, amount, paid, status, datepaid, invoice_number, supplier_name, place, shift_id, remain, id, cashierId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/payment', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const cashierId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const amount_paid = Number(req.body.amount_paid || 0);
    if (amount_paid < 0) return res.status(400).json({ error: 'Amount paid cannot be negative' });

    const base = isAdmin
      ? 'SELECT amount, purchase_date, amount_paid FROM purchases WHERE id = ?'
      : 'SELECT amount, purchase_date, amount_paid FROM purchases WHERE id = ? AND cashier_id = ?';
    const baseParams = isAdmin ? [id] : [id, cashierId];
    const [rows] = await pool.query(base, baseParams);
    if (!rows.length) return res.status(404).json({ error: 'Purchase not found' });

    const amount = Number(rows[0].amount || 0);
    const purchaseDate = rows[0].purchase_date;
    const existingPaid = Number(rows[0].amount_paid || 0);
    const totalPaid = Math.min(amount, existingPaid + amount_paid);
    const remain = Math.max(0, amount - totalPaid);
    const status = remain === 0 ? 'paid' : 'unpaid';
    const paidInFull = totalPaid >= amount;

    const params = [totalPaid, remain, status];
    let cols = 'amount_paid = ?, remain = ?, status = ?';
    if (paidInFull) {
      cols += ', datepaid = ?';
      params.push(`${purchaseDate} 00:00:00`);
    } else if (totalPaid === 0) {
      cols += ', datepaid = NULL';
    }
    const where = isAdmin ? 'WHERE id = ?' : 'WHERE id = ? AND cashier_id = ?';
    params.push(id);
    if (!isAdmin) params.push(cashierId);
    await pool.query(`UPDATE purchases SET ${cols} ${where}`, params);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/pay', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const cashierId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    let query = 'UPDATE purchases SET status = ?, datepaid = ?, amount_paid = amount, remain = 0';
    const params = ['paid', new Date()];
    if (!isAdmin) {
      query += ' WHERE id = ? AND cashier_id = ?';
      params.push(id, cashierId);
    } else {
      query += ' WHERE id = ?';
      params.push(id);
    }
    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/unpay', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const cashierId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    let query = 'UPDATE purchases SET status = ?, datepaid = NULL, amount_paid = 0, remain = amount';
    const params = ['unpaid'];
    if (!isAdmin) {
      query += ' WHERE id = ? AND cashier_id = ?';
      params.push(id, cashierId);
    } else {
      query += ' WHERE id = ?';
      params.push(id);
    }
    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
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
    await pool.query('DELETE FROM purchases WHERE id = ? AND cashier_id = ?', [id, cashierId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
