import dotenv from "dotenv";
import {Request, Response} from "express";

import jwt from "jsonwebtoken";
import User from "../models/User";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV as string;
const CLIENT_URL = process.env.CLIENT_URL as string;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID as string;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET as string;
const JWT_SECRET = process.env.JWT_SECRET as string;

export const githubCallback = async (req : Request, res : Response) => {
    try {
        const code = req.query.code as string;

        if (! code) {
            return res.status(400).json({error: "Missing GitHub code"});
        }

        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code}
            )
        });

        const tokenData = await tokenResponse.json();

        const access_token = tokenData.access_token;

        if (! access_token) {
            return res.status(400).json({error: "Failed to retrieve GitHub access token"});
        }

        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "User-Agent": "node-fetch"
            }
        });
        const githubUser = await userResponse.json();

        const user = await User.findOne({username: githubUser.login})

        const {
            id,
            name,
            login,
            avatar_url,
            repos_url,
            location,
            bio,
            email
        } = githubUser;

        if (! user) {
            await User.create({
                githubId: id,
                username: login,
                email:email || "",
                avatar_url,
                repos_url,
                location,
                bio
            })
        }


        const jwtToken = jwt.sign({
            id,
            name,
            username: login,
            avatar_url,
            repos_url,
            location,
            bio
        }, JWT_SECRET, {expiresIn: "7d"});

        res.cookie("session", jwtToken, {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        return res.redirect(`${CLIENT_URL}/user`);
    } catch (error) {
        console.error("GitHub auth error:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
};

export const getUserSessionData = async (req : Request, res : Response) => {
    try {
        const token = req.cookies.access_token;
        if (! token) {
            return res.status(401).json({authenticated: false});
        }
        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await userRes.json()
        const user = await User.findOne({username: data.login})
        return res.json({authenticated: true, user});
    } catch (error) {
        console.error("GitHub auth error:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}


export const logout = async (req : Request, res : Response) => {
    try {
        res.clearCookie("access_token", {path: "/"});
        res.clearCookie("session", {path: "/"});
        res.json({success: true});
    } catch (error) {
        console.error("GitHub auth error:", error);
        res.status(500).json({error: "Internal Server Error"})
    };
}
