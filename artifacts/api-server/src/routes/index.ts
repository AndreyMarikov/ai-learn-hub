import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import imageRouter from "./image";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(imageRouter);

export default router;
