import express from "express";

import {
  getAllReminders,
  getClientReminders,
  getReminder,
  sendEmail,
  sendSMS,
  sendWhatsApp,
  updateReminder,
} from "../controllers/reminder.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


// ==========================================
// REMINDER CONFIGURATION
// ==========================================

// GET /v1/api/reminders
router.get(
  "/",
  authMiddleware,
  getAllReminders
);

router.get(
  "/client/:clientId",
  authMiddleware,
  getClientReminders
);


// GET /v1/api/reminders/:id
router.get(
  "/:id",
  authMiddleware,
  getReminder
);

router.patch(
  "/:id",
  authMiddleware,
  updateReminder
);


// ==========================================
// SEND EMAIL REMINDER
// POST /v1/api/reminders/:invoiceId/email
// ==========================================

router.post(
  "/:invoiceId/email",
  authMiddleware,
  sendEmail
);


// ==========================================
// SEND SMS REMINDER
// POST /v1/api/reminders/:invoiceId/sms
// ==========================================

router.post(
  "/:invoiceId/sms",
  authMiddleware,
  sendSMS
);


// ==========================================
// SEND WHATSAPP REMINDER
// POST /v1/api/reminders/:invoiceId/whatsapp
// ==========================================

router.post(
  "/:invoiceId/whatsapp",
  authMiddleware,
  sendWhatsApp
);


export default router;