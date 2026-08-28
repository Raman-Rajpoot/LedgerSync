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

const router = express.Router();

// ===============================
// Escalation Rules
// ===============================

router.get("/", getAllRules);

router.get("/:id", getRule);

router.post("/", createRule);

router.patch("/:id", updateRule);

router.patch("/toggle/:id", toggleRule);

router.delete("/:id", deleteRule);

// ===============================
// Statistics
// ===============================

router.get("/statistics", getRuleStatistics);

export default router;