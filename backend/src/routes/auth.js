const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticate, signToken } = require('../middleware/auth');
const { sendMail } = require('../mailer');

const router = express.Router();

async function notifyLogin(user) {
  const when = new Date().toLocaleString('en-GB');
  const message = `You logged in to Stream Pharmacy at ${when}`;
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [user.id, 'login', message]
    );
  } catch (e) {
    console.error('[notify] store error:', e.message);
  }
  if (user.email) {
    const html = `
      <div style="font-family:Arial, sans-serif; max-width:520px; margin:0 auto; color:#1e293b;">
        <div style="background:#0f766e; border-radius:10px 10px 0 0; padding:18px 24px; color:#fff;">
          <strong style="font-size:18px;">Stream Pharmacy</strong>
        </div>
        <div style="border:1px solid #e2e8f0; border-top:0; border-radius:0 0 10px 10px; padding:24px;">
          <h2 style="margin:0 0 14px; font-size:18px;">New login to your account</h2>
          <p style="margin:0 0 8px;">Hi <strong>${user.fullname}</strong>,</p>
          <p style="margin:0 0 8px;">Your account was just used to log in on <strong>${when}</strong>.</p>
          <p style="margin:0 0 8px;">Method: <strong>Email</strong> &nbsp;·&nbsp; Username: <strong>${user.username}</strong></p>
          <p style="margin:0;">If this was you, no action is needed. If not, change your password immediately.</p>
        </div>
      </div>`;
    const sent = await sendMail(user.email, 'New login to your Stream Pharmacy account', html);
    if (sent) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
        [user.id, 'email', 'A login notification email was sent to your email address']
      );
    }
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }
    const [rows] = await pool.query(
      'SELECT id, fullname, email, username, password, role FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
      [username, username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }
    const token = signToken(user);
    const redirect = user.role === 'admin' ? '/admin' : '/cashier';
    notifyLogin(user);
    res.json({
      success: true,
      token,
      redirect,
      user: { id: user.id, fullname: user.fullname, email: user.email, username: user.username, role: user.role }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/notifications', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, type, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50',
      [req.user.id]
    );
    const unread = rows.reduce((s, r) => s + (r.is_read ? 0 : 1), 0);
    res.json({ notifications: rows, unread });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/notifications/read', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    fullname: req.user.fullname,
    email: req.user.email,
    username: req.user.username,
    role: req.user.role
  });
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    const { fullname, email, password } = req.body || {};
    if (email && (!String(email).trim() || !String(email).includes('@'))) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    const emailVal = email ? String(email).trim().toLowerCase() : null;
    if (emailVal) {
      const [dup] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [emailVal, id]);
      if (dup.length) {
        return res.status(400).json({ error: 'This email is already in use by another account' });
      }
    }
    const sets = [];
    const params = [];
    if (emailVal !== null) {
      sets.push('email = ?');
      params.push(emailVal);
    }
    if (fullname && String(fullname).trim()) {
      sets.push('fullname = ?');
      params.push(String(fullname).trim());
    }
    if (password && String(password).length >= 6) {
      sets.push('password = ?');
      params.push(await bcrypt.hash(password, 10));
    }
    if (sets.length) {
      params.push(id);
      await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    const [rows] = await pool.query('SELECT id, fullname, email, username, role FROM users WHERE id = ?', [id]);
    const user = rows[0];
    const token = signToken({ id: user.id, fullname: user.fullname, email: user.email, username: user.username, role: user.role });
    res.json({ success: true, user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
