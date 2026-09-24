import express from "express";
import { executeCode } from "../controllers/codeController.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { codeExecutionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/execute", protectRoute, codeExecutionLimiter, executeCode);

export default router;
