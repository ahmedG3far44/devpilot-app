export interface IEnvironment {
    id?: string;
    key: string;
    value: string;
    isVisible?: boolean;
}

export type ProjectType = "next" | "react" | "static" | "express" | "nest";

export type PackageManagerEnumType = 'n/a' | 'npm' | 'pnpm' | 'yarn';

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
    status?: 'active' | 'failed';
    is_deployed?: boolean;
    environments?: IEnvironment[];
    production_url?: string;
    created_at?: Date;
    updated_at?: Date;
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
        run_script
    } = project;

    const envVars = environments ?. map(env => `${
        env.key
    }=${
        env.value
    }`).join(' \n ');

    const PROJECT_NAME = name ?. toLowerCase().trim();
    const REPO_URL = clone_url ?. toLowerCase().trim();
    const BRANCH = branch ?. toLowerCase().trim();
    const APP_TYPE = type ?. toLowerCase().trim();
    const SUB_DIR = main_dir ?. toLowerCase().trim() || ".";
    const ENV_VARS = envVars ?. trim();

    if (type === "react" || type === "static") {
        return `./client.sh "${PROJECT_NAME}" "${REPO_URL}" "${BRANCH}" "${APP_TYPE}" "${SUB_DIR}" "${ENV_VARS}"`;
    }

    if (type === "next" || type === "express" || type === "nest") {
        if (!port) {
            throw new Error("PORT is required for server applications");
        }

        const PORT = port.toString();
        const RUN_CMD = (run_script || "npm run start");

        return `./server.sh "${PROJECT_NAME}" "${REPO_URL}" "${BRANCH}" "${APP_TYPE}" "${PORT}" "${SUB_DIR}" "${ENV_VARS}" "${
            type === RUN_CMD ? "npm run start -- -p " + PORT : RUN_CMD
        }"`;
    }

    throw new Error(`Unsupported project type: ${type}`);
}
