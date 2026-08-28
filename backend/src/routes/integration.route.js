import express from "express";

import {
  saveEmailIntegration,
  saveTwilioIntegration,
  getIntegrations,
  deleteIntegration,
} from "../controllers/integration.controller.js";


const router =
  express.Router();


/* ==========================================
   EMAIL
========================================== */

router.post(
  "/email",
  saveEmailIntegration
);


/* ==========================================
   TWILIO
========================================== */

router.post(
  "/twilio",
  saveTwilioIntegration
);


/* ==========================================
   GET ALL
========================================== */

router.get(
  "/",
  getIntegrations
);


/* ==========================================
   DELETE
========================================== */

router.delete(
  "/",
  deleteIntegration
);


export default router;