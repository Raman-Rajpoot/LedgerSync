import express from "express";

import {
  saveEmailIntegration,
  saveTwilioIntegration,
  testEmailIntegration,
  testTwilioIntegration,
  getIntegrations,
  deleteIntegration,
} from "../controllers/integration.controller.js";
import authenticateTenant from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/email", authenticateTenant, saveEmailIntegration);
router.post("/email/test", authenticateTenant, testEmailIntegration);
router.post("/twilio", authenticateTenant, saveTwilioIntegration);
router.post("/twilio/test", authenticateTenant, testTwilioIntegration);
router.get("/", authenticateTenant, getIntegrations);
router.delete("/:type", authenticateTenant, deleteIntegration);

export default router;