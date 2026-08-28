import express from "express";

import {
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "../controllers/organization.controller.js";

const router = express.Router();

router.get("/", getOrganization);

router.post("/create", createOrganization);

router.patch("/update", updateOrganization);

router.delete("/delete", deleteOrganization);

export default router;