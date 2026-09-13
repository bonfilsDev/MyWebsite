const express = require('express');
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/clear-records', async (req, res) => {
  try {
    await pool.query('DELETE FROM insurance_records');
    await pool.query('DELETE FROM daily_reports');
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM purchases');
    await pool.query('DELETE FROM cashouts');
    res.json({ success: true, message: 'All reports and records deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;