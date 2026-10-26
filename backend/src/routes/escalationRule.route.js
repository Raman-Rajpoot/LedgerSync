import express from "express";

import {
  getAllRules,
  getRule,
  createRule,
  updateRule,
  toggleRule,
  deleteRule,
  getRuleStatistics,
} from "../controllers/escalationRule.controller.js";
import {
  getAllEscalations,
  getEscalationById,
  getInvoiceEscalations,
} from "../controllers/escalationLog.controller.js";

const router = express.Router();

// ===============================
// Escalation Rules
// ===============================

// Keep fixed routes before /:id so names such as "statistics" are not
// interpreted as rule identifiers.
router.get("/statistics", getRuleStatistics);
router.get("/history", getAllEscalations);
router.get("/history/:id", getEscalationById);
router.get("/invoices/:invoiceId/history", getInvoiceEscalations);

router.get("/", getAllRules);

router.get("/:id", getRule);

router.post("/", createRule);

router.patch("/:id", updateRule);

router.patch("/toggle/:id", toggleRule);

router.delete("/:id", deleteRule);

export default router;