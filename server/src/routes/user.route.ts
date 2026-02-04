import {Response, Router} from "express";
import {getUserRepos} from "../controllers/user.controller";
import {authMiddleware} from "../middlewares/auth";
import {AuthRequest} from "../types";
import {getCommitsList, getLastCommit} from "../utils/getUser";


const router = Router();

router.get("/user/repos", authMiddleware, getUserRepos);

router.get("/commits/:repo_name", authMiddleware, async (req : AuthRequest, res : Response) => {
    try {
        const user = req.user;
        const token = req.cookies.access_token;

        const {repo_name} = req.params;
        if (! user) {
            return res.status(401).json({message: "Unauthorized"})
        }
        const commits = await getCommitsList(token, repo_name, user.username)
        if (! commits) {
            return res.status(404).json({message: "No commits found"})
        }
        res.status(200).json(commits)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Internal Server Error"})
    }
});

router.get("/last-commit/:repo_name", authMiddleware, async (req : AuthRequest, res : Response) => {
    try {
        const user = req.user;
        const token = req.cookies.access_token;

        const {repo_name} = req.params;
        if (! user) {
            return res.status(401).json({message: "Unauthorized"})
        }
        const commits = await getLastCommit(token, repo_name, user.username)
        if (! commits) {
            return res.status(404).json({message: "No commits found"})
        }
        res.status(200).json(commits)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Internal Server Error"})
    }
});


export default router;
