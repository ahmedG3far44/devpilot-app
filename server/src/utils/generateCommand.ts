import env from "../config/env";

export interface IEnvironment {
  id?: string;
  key: string;
  value: string;
  isVisible?: boolean;
}

export type ProjectType = "next" | "react" | "static" | "express" | "nest";

export type PackageManagerEnumType = "n/a" | "npm" | "pnpm" | "yarn";

export interface ProjectFormData {
  _id?: string;
  name?: string;
  description?: string;
  clone_url?: string;
  branch?: string;
  port?: number;
  typescript?: boolean;
  type?: ProjectType;
  build_script?: string;
  package_manager?: PackageManagerEnumType;
  run_script?: string;
  main_dir?: string;
  status?: "active" | "failed";
  is_deployed?: boolean;
  environments?: IEnvironment[];
  production_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

function quote(val: string | undefined): string {
  return `"${val ?? ""}"`;
}

export function buildDeployCommand(project: ProjectFormData): string {
  const {
    name,
    clone_url,
    branch,
    type,
    port,
    main_dir,
    environments,
    run_script,
  } = project;

  const envVars = environments
    ?.map((env) => `${env.key}=${env.value}`)
    .join(" \\n ");

  const PROJECT_NAME = name?.toLowerCase().trim();
  const REPO_URL = clone_url?.toLowerCase().trim();
  const BRANCH = branch?.toLowerCase().trim();
  const APP_TYPE = type?.toLowerCase().trim();
  const SUB_DIR = main_dir?.toLowerCase().trim() || ".";
  const ENV_VARS = envVars?.trim() || "";

  const baseFlags = [
    `--project ${quote(PROJECT_NAME)}`,
    `--git_url ${quote(REPO_URL)}`,
    `--branch ${quote(BRANCH)}`,
    `--type ${quote(APP_TYPE)}`,
    `--sub_dir ${quote(SUB_DIR)}`,
    `--env ${quote(ENV_VARS)}`,
    `--domain ${quote(env.DOMAIN || "")}`,
    `--cf_zone_id ${quote(env.CF_ZONE_ID || "")}`,
    `--cf_token ${quote(env.CF_API_TOKEN || "")}`,
    `--host_ip ${quote(env.EC2_HOST_IP || "")}`,
    `--email ${quote(env.EMAIL || "ahmedjaafarbadri@gmail.com")}`,
  ];

  if (type === "react" || type === "static") {
    return `sudo bash ./client.sh \\\n  ${baseFlags.join(" \\\n  ")}`;
  }

  if (type === "next" || type === "express" || type === "nest") {
    if (!port) {
      throw new Error("PORT is required for server applications");
    }

    const PORT = port.toString();
    const RUN_CMD = run_script || "npm run start";

    const serverFlags = [
      ...baseFlags.slice(0, 4),
      `--port ${quote(PORT)}`,
      ...baseFlags.slice(4),
      `--run_cmd ${quote(RUN_CMD)}`,
    ];

    return `sudo bash ./server.sh \\\n  ${serverFlags.join(" \\\n  ")}`;
  }

  throw new Error(`Unsupported project type: ${type}`);
}
