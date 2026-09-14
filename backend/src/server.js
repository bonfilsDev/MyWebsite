require("dotenv").config();

const express = require("express");

const authRoutes = require("./routes/auth");
const cashierRoutes = require("./routes/cashiers");
const reportRoutes = require("./routes/reports");
const statsRoutes = require("./routes/stats");
const expenseRoutes = require("./routes/expenses");
const purchaseRoutes = require("./routes/purchases");
const cashoutRoutes = require("./routes/cashouts");
const insuranceRoutes = require("./routes/insurance");
const adminRoutes = require("./routes/admin");

const app = express();

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5173",
  "https://my-website-eta-gilt-28.vercel.app",
  "https://my-website-e7hnlbqr-benyln.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from Postman and other tools without an origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    name: "Stream Pharmacy API",
    status: "running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/cashiers", cashierRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/cashouts", cashoutRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use("/api/admin", adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    error: "Internal server error",
  });
});

// Railway/Render provides PORT
const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Stream Pharmacy API running on port ${PORT}`);
});