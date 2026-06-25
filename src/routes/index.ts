import { Router } from "express";
import { router as v1Router } from "./v1";

const router = Router();

// API v1 routes
router.use("/v1", v1Router);

export { router };

