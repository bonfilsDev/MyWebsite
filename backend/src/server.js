require('dotenv').config();

const express = require('express');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const insuranceRoutes = require('./routes/insurance');
const adminRoutes = require('./routes/admin');
const cashierRoutes = require('./routes/cashiers');
const cashoutRoutes = require('./routes/cashouts');
const expenseRoutes = require('./routes/expenses');
const purchaseRoutes = require('./routes/purchases');
const reportRoutes = require('./routes/reports');
const statsRoutes = require('./routes/stats');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://my-website-git-main-benylin.vercel.app',
  'https://my-website-ee4p9ycnl-benylin.vercel.app',
  'https://my-website-aklpjm0vz-benylin.vercel.app',
  'https://my-website-eta-gilt-28.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error('Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Stream Pharmacy API is running'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cashiers', cashierRoutes);
app.use('/api/cashouts', cashoutRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stream Pharmacy API running on port ${PORT}`);
});