import express from "express";

import {
  getAllTemplates,
  getTemplate,
  createNewTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/template.controller.js";
import authenticateTenant from "../middleware/auth.middleware.js";

const router = express.Router();


router.get("/", authenticateTenant, getAllTemplates);

router.get("/getTemplate/:id",authenticateTenant, getTemplate);

router.post("/", authenticateTenant, createNewTemplate);

router.patch("/:id", authenticateTenant, updateTemplate);

router.delete("/:id", authenticateTenant, deleteTemplate);


export default router;