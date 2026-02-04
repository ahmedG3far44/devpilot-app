import {Response} from "express"
import {AuthRequest} from "../types"

import Project from "../models/Project"

export const getProjectsList = async (req : AuthRequest, res : Response) => {
    try {
        const user = req.user;
        if (! user) {
            throw new Error("user not found !!")
        }
        const projectsList = await Project.find({username: user.username});
        res.status(200).json({data: projectsList, message: "getting projects list successfully", success: true})
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: (error as Error).message,
            data: "[Error]: Internal server error"
        });
    }
}

export const getProjectById = async (req : AuthRequest, res : Response) => {
    try {
        const projectId = req.params.project_id;
        if (! projectId) {
            throw new Error("the project ID is required!!")
        }
        const project = await Project.findById(projectId);
        res.status(200).json({data: project, message: "getting project by ID successfully", success: true})
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: (error as Error).message,
            data: "[Error]: Internal server error"
        });
    }
}
