import { Response } from "express";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/errorHandler";

export const getUserRepos = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const github_token = req.cookies.access_token;

  if (!github_token || !user)
    throw new AppError("Unauthorized: please sign in again", 401);

  const allRepos: any[] = [];
  let page = 1;

  while (true) {
    const url = `${user.repos_url}?per_page=100&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Authorization: "Bearer " + github_token,
        "User-Agent": "DevPilot",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          "GitHub authorization expired. Please sign in again",
          401,
        );
      }
      if (response.status === 429) {
        throw new AppError("GitHub rate limit reached. Try again later", 429);
      }
      throw new AppError(
        `GitHub API error (${response.status}). Try again later`,
        502,
      );
    }

    const fetched = await response.json();

    if (!Array.isArray(fetched) || fetched.length === 0) break;

    allRepos.push(...fetched);
    if (fetched.length < 100) break;
    page++;
  }

  res
    .status(200)
    .json({ data: allRepos, message: "Getting user repos successfully", success: true });
};
