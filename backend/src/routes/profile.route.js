import express from "express";

import {
  getProfile,
  updateProfile,
} from "../controllers/profile.controller.js";

import authenticateTenant from "../middleware/auth.middleware.js";


const router = express.Router();


router.get(
  "/",
  authenticateTenant,
  getProfile
);


router.put(
  "/",
  authenticateTenant,
  updateProfile
);


export default router;