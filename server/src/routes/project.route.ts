import {Router} from "express";
import {authMiddleware} from "../middlewares/auth";
import {getProjectById, getProjectsList} from "../controllers/project.controller";


const router = Router();


router.get("/", authMiddleware, getProjectsList);
router.get("/:project_id", getProjectById);

export default router;
