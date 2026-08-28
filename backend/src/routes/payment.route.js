import express from "express";

import {
  getAllPayments,
  getPayment,
  getPaymentsByInvoice,
  createPayment,
  updatePayment,
  deletePayment,
} from "../controllers/payment.controller.js";

import { authenticateTenant } from "../middleware/auth.middleware.js";

const router = express.Router();


// GET all payments
router.get(
  "/",
  authenticateTenant,
  getAllPayments
);


// GET payments for an invoice
router.get(
  "/invoice/:invoiceId",
  authenticateTenant,
  getPaymentsByInvoice
);


// GET single payment
router.get(
  "/:id",
  authenticateTenant,
  getPayment
);


// CREATE payment
router.post(
  "/",
  authenticateTenant,
  createPayment
);


// UPDATE payment
router.put(
  "/:id",
  authenticateTenant,
  updatePayment
);


// DELETE payment
router.delete(
  "/:id",
  authenticateTenant,
  deletePayment
);


export default router;