require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const cashierRoutes = require('./routes/cashiers');
const reportRoutes = require('./routes/reports');
const statsRoutes = require('./routes/stats');
const expenseRoutes = require('./routes/expenses');
const purchaseRoutes = require('./routes/purchases');
const cashoutRoutes = require('./routes/cashouts');
const insuranceRoutes = require('./routes/insurance');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
    origin: [
      "http://localhost:5173",
      "https://my-website-e7hnlbqr-benyln.vercel.app",
    ],
    credentials: true,
  }));
  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ name: 'Stream Pharmacy API', status: 'running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cashiers', cashierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/cashouts', cashoutRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Stream Pharmacy API running on http://localhost:${PORT}`);
});
