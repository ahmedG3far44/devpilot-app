import {Response} from "express";
import {AuthRequest} from "../types";

export const getUserRepos = async (req : AuthRequest, res : Response) => {
    try {

        const user = req.user;
        const github_token = req.cookies.access_token;

        if (! github_token) 
            throw new Error("not authorized user!!")


        


        if (! user) 
            throw new Error("your not allowed to do this action!!");
        


        const response = await fetch(`${
            user?.repos_url
        }`, {
            headers: {
                "Authorization": "Bearer " + github_token,
                "User-Agent": "DevPilot"
            }
        })

        const repos = await response.json();

        res.status(200).json({data: repos, message: "getting user repos success", success: true})
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: (error as Error).message,
            data: "[Error]: Internal server error"
        });
    }
}
