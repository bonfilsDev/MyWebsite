const express = require("express");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

/*
  GET /api/reports

  Combines:
  - purchases
  - expenses
  - cashouts
  - insurance_records
  - daily_reports

  Admin sees all cashiers.
  Cashier sees only their own records.
*/
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    const params = [];

    let cashierFilter = "";

    if (isAdmin) {
      if (
        req.query.cashier_id &&
        req.query.cashier_id !== "all"
      ) {
        cashierFilter = " AND cashier_id = ?";
        params.push(req.query.cashier_id);
      }
    } else {
      cashierFilter = " AND cashier_id = ?";
      params.push(req.user.id);
    }

    let dateFilter = "";

    if (req.query.date_from) {
      dateFilter += " AND report_date >= ?";
      params.push(req.query.date_from);
    }

    if (req.query.date_to) {
      dateFilter += " AND report_date <= ?";
      params.push(req.query.date_to);
    }

    const query = `
      SELECT
        report_date,
        cashier_id,
        cashier_name,
        shift_id,
        shift_name,

        SUM(purchase_total) AS purchase_total,
        SUM(expense_total) AS expense_total,
        SUM(cashout_total) AS cashout_total,
        SUM(insurance_total) AS insurance_total,

        SUM(cash_total) AS cash,
        SUM(momo_total) AS momo,
        SUM(credit_total) AS credit,
        SUM(pos_total) AS pos,
        SUM(ekashi_total) AS ekashi,

        SUM(cash_total)
          + SUM(momo_total)
          + SUM(credit_total)
          + SUM(pos_total)
          + SUM(ekashi_total) AS total,

        MAX(balance_value) AS balance,

        COUNT(*) AS transaction_count

      FROM (

        /* =========================
           PURCHASES
        ========================= */
        SELECT
          p.purchase_date AS report_date,
          p.cashier_id,
          u.fullname AS cashier_name,
          p.shift_id,
          s.name AS shift_name,

          p.amount AS purchase_total,
          0 AS expense_total,
          0 AS cashout_total,
          0 AS insurance_total,

          0 AS cash_total,
          0 AS momo_total,
          0 AS credit_total,
          0 AS pos_total,
          0 AS ekashi_total,

          0 AS balance_value

        FROM purchases p
        JOIN users u ON u.id = p.cashier_id
        LEFT JOIN shifts s ON s.id = p.shift_id


        UNION ALL


        /* =========================
           EXPENSES
        ========================= */
        SELECT
          e.expense_date AS report_date,
          e.cashier_id,
          u.fullname AS cashier_name,
          NULL AS shift_id,
          NULL AS shift_name,

          0 AS purchase_total,
          e.amount AS expense_total,
          0 AS cashout_total,
          0 AS insurance_total,

          0 AS cash_total,
          0 AS momo_total,
          0 AS credit_total,
          0 AS pos_total,
          0 AS ekashi_total,

          0 AS balance_value

        FROM expenses e
        JOIN users u ON u.id = e.cashier_id


        UNION ALL


        /* =========================
           CASHOUTS
        ========================= */
        SELECT
          c.cashout_date AS report_date,
          c.cashier_id,
          u.fullname AS cashier_name,
          NULL AS shift_id,
          NULL AS shift_name,

          0 AS purchase_total,
          0 AS expense_total,
          c.amount AS cashout_total,
          0 AS insurance_total,

          0 AS cash_total,
          0 AS momo_total,
          0 AS credit_total,
          0 AS pos_total,
          0 AS ekashi_total,

          0 AS balance_value

        FROM cashouts c
        JOIN users u ON u.id = c.cashier_id


        UNION ALL


        /* =========================
           INSURANCE
        ========================= */
        SELECT
          ir.record_date AS report_date,
          ir.cashier_id,
          u.fullname AS cashier_name,
          ir.shift_id,
          s.name AS shift_name,

          0 AS purchase_total,
          0 AS expense_total,
          0 AS cashout_total,
          ir.amount AS insurance_total,

          0 AS cash_total,
          0 AS momo_total,
          0 AS credit_total,
          0 AS pos_total,
          0 AS ekashi_total,

          0 AS balance_value

        FROM insurance_records ir
        JOIN users u ON u.id = ir.cashier_id
        LEFT JOIN shifts s ON s.id = ir.shift_id


        UNION ALL


        /* =========================
           DAILY SALES REPORT
        ========================= */
        SELECT
          dr.report_date,
          dr.cashier_id,
          u.fullname AS cashier_name,
          dr.shift_id,
          s.name AS shift_name,

          0 AS purchase_total,
          0 AS expense_total,
          0 AS cashout_total,
          0 AS insurance_total,

          dr.cash AS cash_total,
          dr.momo AS momo_total,
          dr.credit AS credit_total,
          dr.pos AS pos_total,
          dr.ekashi AS ekashi_total,

          dr.balance AS balance_value

        FROM daily_reports dr
        JOIN users u ON u.id = dr.cashier_id
        LEFT JOIN shifts s ON s.id = dr.shift_id

      ) AS combined_records

      WHERE 1 = 1
      ${cashierFilter}
      ${dateFilter}

      GROUP BY
        report_date,
        cashier_id,
        cashier_name,
        shift_id,
        shift_name

      ORDER BY
        report_date DESC,
        cashier_id ASC,
        shift_id ASC
    `;

    const [rows] = await pool.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error("Reports error:", error);

    res.status(500).json({
      error: "Failed to load reports",
    });
  }
});


/*
  POST /api/reports

  Submit a daily report / close a shift
*/
router.post("/", async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        error: "Cashier only action",
      });
    }

    const cashierId = req.user.id;

    const {
      report_date = new Date().toISOString().slice(0, 10),
      shift_id,
      cash = 0,
      momo = 0,
      credit = 0,
      pos = 0,
      ekashi = 0,
      balance = 0,
    } = req.body || {};

    if (!shift_id) {
      return res.status(400).json({
        error: "Shift is required",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id
      FROM daily_reports
      WHERE report_date = ?
        AND shift_id = ?
        AND cashier_id = ?
      `,
      [report_date, shift_id, cashierId]
    );

    if (existing.length) {
      return res.status(400).json({
        error: "This shift has already been submitted for this date",
      });
    }

    const total =
      Number(cash) +
      Number(momo) +
      Number(credit) +
      Number(pos) +
      Number(ekashi);

    const [result] = await pool.query(
      `
      INSERT INTO daily_reports
      (
        cashier_id,
        report_date,
        shift_id,
        cash,
        momo,
        credit,
        pos,
        ekashi,
        balance
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cashierId,
        report_date,
        shift_id,
        cash,
        momo,
        credit,
        pos,
        ekashi,
        balance,
      ]
    );

    res.json({
      success: true,
      id: result.insertId,
      total,
      balance: Number(balance),
    });
  } catch (error) {
    console.error("Submit report error:", error);

    res.status(500).json({
      error: "Failed to submit report",
    });
  }
});

module.exports = router;