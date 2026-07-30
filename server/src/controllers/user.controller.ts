import {Response} from "express";
import {AuthRequest} from "../types";

export const getUserRepos = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const github_token = req.cookies.access_token;

        if (!github_token)
            throw new Error("not authorized user!!")

        if (!user)
            throw new Error("your not allowed to do this action!!");

        const allRepos: any[] = [];
        let page = 1;

        while (true) {
            const url = `${user.repos_url}?per_page=100&page=${page}`;
            const response = await fetch(url, {
                headers: {
                    "Authorization": "Bearer " + github_token,
                    "User-Agent": "DevPilot"
                }
            });
            const fetched = await response.json();

            if (!Array.isArray(fetched) || fetched.length === 0) break;

            allRepos.push(...fetched);
            if (fetched.length < 100) break;
            page++;
        }

        res.status(200).json({ data: allRepos, message: "getting user repos success", success: true })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: (error as Error).message,
            data: "[Error]: Internal server error"
        });
    }
}
