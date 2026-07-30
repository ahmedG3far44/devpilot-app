import { Response, NextFunction } from "express";
import Jwt, { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "../types";
import env from "../config/env";

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.session;

    console.log("Auth middleware token:", token);

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = Jwt.verify(token, env.JWT_SECRET!) as JwtPayload;

    console.log("Decoded USER token:", decoded);
    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = {
      id: decoded.id,
      name: decoded.name,
      username: decoded.username,
      repos_url: decoded.repos_url,
      avatar_url: decoded.avatar_url,
    };

    next();
  } catch (error) {
    if (error instanceof Jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Session expired" });
    }
    if (error instanceof Jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
