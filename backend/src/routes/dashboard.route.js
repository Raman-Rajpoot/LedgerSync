import express from "express";

import {
  getDashboard,
} from "../controllers/dashboard.controller.js";
import authenticateTenant from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  authenticateTenant,
  getDashboard
);

export default router;