import { Response } from "express";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/errorHandler";

import Project from "../models/Project";

export const getProjectsList = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized: User not authenticated", 401);
  }
  const projectsList = await Project.find({ username: user.username });
  res
    .status(200)
    .json({ data: projectsList, message: "Getting projects list successfully", success: true });
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized: User not authenticated", 401);
  }

  const projectId = req.params.project_id;
  if (!projectId) {
    throw new AppError("Project ID is required", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  res
    .status(200)
    .json({ data: project, message: "Getting project by ID successfully", success: true });
};
