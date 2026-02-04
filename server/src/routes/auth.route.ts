import {Router} from "express";
import {getUserSessionData, githubCallback, logout} from "../controllers/auth.controller";
import {authMiddleware} from "../middlewares/auth";

const router = Router();


router.get("/me", authMiddleware, getUserSessionData)
router.get("/github/callback", githubCallback)
router.post("/logout", authMiddleware, logout)

export default router;
