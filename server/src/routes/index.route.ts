import {Router} from "express";

import authRouter from "./auth.route"
import projectRouter from "./project.route"
import deployRouter from "./deployment.route"
import userRouter from "./user.route"



const router = Router()




router.use("/", userRouter)
router.use("/auth", authRouter)
router.use("/project", projectRouter)
router.use("/deployment", deployRouter)



export default router;
