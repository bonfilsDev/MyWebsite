const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, fullname, email, username, role, is_active, created_at FROM users WHERE role = 'cashier' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body || {};
    if (!fullname || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const emailVal = email ? String(email).trim().toLowerCase() : null;
    if (emailVal) {
      const [dup] = await pool.query('SELECT id FROM users WHERE email = ?', [emailVal]);
      if (dup.length) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (fullname, email, username, password, role) VALUES (?, ?, ?, ?, 'cashier')",
      [fullname, emailVal, username, hashed]
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
    const { fullname, email, password } = req.body || {};
    if (!id || !fullname) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const emailVal = email ? String(email).trim().toLowerCase() : null;
    if (emailVal) {
      const [dup] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [emailVal, id]);
      if (dup.length) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET fullname = ?, email = ?, password = ? WHERE id = ? AND role = 'cashier'",
        [fullname, emailVal, hashed, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET fullname = ?, email = ? WHERE id = ? AND role = 'cashier'",
        [fullname, emailVal, id]
      );
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
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'cashier'", [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
