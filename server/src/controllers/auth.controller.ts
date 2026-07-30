import dotenv from "dotenv";
import { Request, Response } from "express";

import env from "../config/env";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../types";

dotenv.config();

export const githubCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    console.log("hitting github callback....");

    if (!code) {
      return res.status(400).json({ error: "Missing GitHub code" });
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.AUTH_GITHUB_CLIENT_ID,
          client_secret: env.AUTH_GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    // console.log("token response", tokenResponse)

    const tokenData = await tokenResponse.json();
    console.log("token data", tokenData);

    const access_token = tokenData.access_token;

    // console.log("github token data", tokenData)

    if (!access_token) {
      return res.status(400).json({
        error: `Failed to retrieve GitHub access token ${tokenData.error}`,
      });
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "User-Agent": "node-fetch",
      },
    });
    const githubUser = await userResponse.json();

    const user = await User.findOne({ username: githubUser.login });

    const { id, name, login, avatar_url, repos_url, location, bio, email } =
      githubUser;

    if (!user) {
      await User.create({
        githubId: id,
        username: login,
        email: email || "",
        avatar_url,
        repos_url,
        location,
        bio,
      });
    }

    const jwtToken = jwt.sign(
      {
        id,
        name,
        username: login,
        avatar_url,
        repos_url,
        location,
        bio,
      },
      env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    const isSecure = req.secure;
    res.cookie("session", jwtToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const clientUrls = env.CLIENT_URL.split(",").map((s) => s.trim());
    const redirectUrl = clientUrls.find((url) => !/:\/\/localhost/.test(url)) || clientUrls[0] || "http://localhost:5173";

    return res.redirect(`${redirectUrl}/user`);
  } catch (error) {
    console.error("GitHub auth error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserSessionData = async (req: AuthRequest, res: Response) => {
  try {
    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.username) {
      return res.status(401).json({ authenticated: false });
    }

    const user = await User.findOne({ username: userFromToken.username });

    if (!user) {
      return res
        .status(404)
        .json({ authenticated: false, error: "User not found in database" });
    }

    return res.json({ authenticated: true, user });
  } catch (error) {
    console.error("Session data error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("session", { path: "/" });
    res.json({ success: true });
  } catch (error) {
    console.error("GitHub auth error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
