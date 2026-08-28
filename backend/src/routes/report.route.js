import express from "express";

import {
  getReports,
} from "../controllers/report.controller.js";

const router =
  express.Router();

router.get(
  "/",
  getReports
);

export default router;