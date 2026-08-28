import express from "express";

import {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateStatus,
  markPaid,
  markPartial,
  deleteInvoice,
  getInvoiceStatistics,
} from "../controllers/invoice.controller.js";

import authenticateTenant from "../middleware/auth.middleware.js";

const router = express.Router();


// ==========================================
// INVOICE STATISTICS
// GET /api/invoices/statistics
// ==========================================

router.get(
  "/statistics",
  authenticateTenant,
  getInvoiceStatistics
);


// ==========================================
// GET ALL INVOICES
// GET /api/invoices
// ==========================================

router.get(
  "/",
  authenticateTenant,
  getAllInvoices
);


// ==========================================
// GET SINGLE INVOICE
// GET /api/invoices/:id
// ==========================================

router.get(
  "/:id",
  authenticateTenant,
  getInvoice
);


// ==========================================
// CREATE INVOICE
// POST /api/invoices
// ==========================================

router.post(
  "/",
  authenticateTenant,
  createInvoice
);


// ==========================================
// UPDATE INVOICE
// PATCH /api/invoices/:id
// ==========================================

router.patch(
  "/:id",
  authenticateTenant,
  updateInvoice
);


// ==========================================
// DELETE INVOICE
// DELETE /api/invoices/:id
// ==========================================

router.delete(
  "/:id",
  authenticateTenant,
  deleteInvoice
);


// ==========================================
// UPDATE STATUS
// PATCH /api/invoices/:id/status
// ==========================================

router.patch(
  "/:id/status",
  authenticateTenant,
  updateStatus
);


// ==========================================
// MARK PAID
// PATCH /api/invoices/:id/paid
// ==========================================

router.patch(
  "/:id/paid",
  authenticateTenant,
  markPaid
);


// ==========================================
// MARK PARTIAL
// PATCH /api/invoices/:id/partial
// ==========================================

router.patch(
  "/:id/partial",
  authenticateTenant,
  markPartial
);


export default router;