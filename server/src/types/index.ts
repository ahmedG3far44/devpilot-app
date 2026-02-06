import {z} from "zod";
import { Request } from 'express';



export const ProjectTypeSchema = z.enum([
    "static",
    "react",
    "express",
    "next",
    "nest",
]);

const DeployEnvironmentSchema = z.object({
    id: z.string().optional(),
    key: z.string().min(1, 'Environment key is required').trim(),
    value: z.string().min(1, 'Environment value is required').trim()
});

export const ProjectStatus = z.enum(['active', 'failed', 'pending']);

export const deploySchema = z.object({
    name: z.string(),
    repo: z.string(),
    branch: z.string().optional(),
    description: z.string().optional(),
    type: ProjectTypeSchema,
    package_manager: z.enum(
        ['n/a', 'npm', 'pnpm', 'yarn']
    ).default('n/a'),
    main_dir: z.string().optional(),
    environments: z.array(DeployEnvironmentSchema).optional(),
    port: z.number().optional(),
    run_script: z.string().optional(),
    typescript: z.boolean().optional(),
    is_deployed: z.boolean().optional(),
    status: ProjectStatus.default('failed'),
    build_script: z.string().optional(),
    production_url: z.string().url().optional()
});



export interface IEnvVar {
  key: string;
  value: string;
}

export interface IUser {
  id: string;
  name:string;
  avatar_url:string;
  repos_url:string;
  username:string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface CreateDeploymentDTO {
  project_name: string;
  clone_url: string;
  description?: string;
  package_manager: 'npm' | 'yarn' | 'pnpm';
  envVars: IEnvVar[];
  run_script: string;
  build_script?: string;
  entry_file: string;
  main_directory: string;
  port?: number;
}

export interface UpdateDeploymentDTO {
  description?: string;
  entry_file?: string;
  main_directory?: string;
  envVars?: IEnvVar[];
  build_script?: string;
  run_script?: string;
}

export type DeploymentStatus = 'pending' | 'deployed' | 'failed' | 'redeploying';
