import type { ReactNode } from "react";

// ============================================================================
// USER TYPES
// ============================================================================

export interface IUser {
    _id: string;
    githubId: string;
    name: string;
    username: string;
    avatar_url: string;
    bio: string;
    repos_url: string;
    location: string;
    isAdmin: boolean;
    blocked: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export type UserRole = 'admin' | 'user';

// ============================================================================
// REPOSITORY TYPES
// ============================================================================

export interface RepositoryOwner {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    type: 'User' | 'Organization';
}

export interface RepositoryLicense {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
    node_id: string;
}

export interface Repository {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    private: boolean;
    owner: RepositoryOwner;
    html_url: string;
    description: string | null;
    fork: boolean;
    url: string;
    clone_url: string;
    git_url: string;
    ssh_url: string;
    svn_url: string;
    homepage: string | null;
    size: number; // Size in KB
    stargazers_count: number;
    watchers_count: number;
    language: string | null;
    has_issues: boolean;
    has_projects: boolean;
    has_downloads: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    has_discussions: boolean;
    forks_count: number;
    archived: boolean;
    disabled: boolean;
    open_issues_count: number;
    license: RepositoryLicense | null;
    topics: string[];
    visibility: 'public' | 'private' | 'internal';
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
}

export interface RepositoryCardData {
    id: number;
    name: string;
    clone_url: string;
    size: number;
    description: string | null;
    language: string | null;
    license: {
        name: string;
    } | null;
    full_name?: string;
    html_url?: string;
    private?: boolean;
    stargazers_count?: number;
    forks_count?: number;
    updated_at?: Date;
    created_at?: Date;
    default_branch?: string;
    owner?: {
        login: string;
        avatar_url: string;
    };
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export type ProjectType = "next" | "react" | "static" | "express" | "nest";
export type ProjectStatus = "active" | "failed" | "stopped";
export type PackageManagerEnumType = 'n/a' | 'npm' | 'pnpm' | 'yarn';

export interface IEnvironment {
    id: string;
    key: string;
    value: string;
    isVisible: boolean;
}

export interface EnvVariable {
    id?: string;
    key: string;
    value: string;
    visible?: boolean;
}

export interface ProjectFormData {
    _id?: string;
    name: string;
    description: string;
    clone_url: string;
    branch: string;
    port?: number;
    typescript: boolean;
    type: ProjectType;
    build_script: string;
    package_manager: PackageManagerEnumType;
    run_script: string;
    main_dir: string;
    status?: 'active' | 'failed' | 'stopped';
    is_deployed: boolean;
    environments: IEnvironment[];
    production_url?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ProjectData {
    _id?: string;
    name: string;
    clone_url: string;
    run_script: string;
    build_script: string;
    port: number | string;
    main_dir: string;
    type: "next" | "express" | "nest" | "static" | "react";
    typescript: boolean;
    envVars: Record<string, string>;
    status: "active" | "stopped" | "failed";
    url?: string;
    username?: string;
    pkg?: string;
}

export interface ProjectDetailsData {
    _id: string;
    name: string;
    username: string;
    clone_url: string;
    branch: string;
    main_dir: string;
    build_script: string;
    run_script: string;
    command: string;
    package_manager: string;
    port: number;
    type: ProjectType;
    typescript: boolean;
    status: ProjectStatus;
    is_deployed: boolean;
    production_url: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    environments: EnvVariable[];
}

export interface ProjectTypeConfig {
    image: string;
    value: ProjectType;
    label: string;
    description: string;
    requiresRunScript: boolean;
    requiresBuildScript: boolean;
    defaultRunScript: string;
    defaultBuildScript: string;
}

export interface PackageManager {
    value: string;
    label: string;
    runCmd: string;
    buildCmd: string;
    installCmd: string;
}

// ============================================================================
// DEPLOYMENT TYPES
// ============================================================================

export type DeploymentStatus = "success" | "failed";

export interface DeploymentStep {
    type: string;
    text?: string;
    delay: number;
}

export interface DeployBodyType {
    name: string;
    repo: string;
    type: string;
    branch: string;
    typescript: boolean;
    run_script: string;
    build_script?: string;
    main_dir: string;
    environments: IEnvironment[];
    port?: number;
    package_manager?: string;
    command?: string;
}

export interface Author {
    name: string;
    email: string;
    date: string;
    avatar_url?: string;
}

export interface LastCommit {
    sha: string;
    commit_date: string;
    message: string;
    author: Author;
}

export interface Deployment {
    _id: string;
    project_name: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    last_commit: LastCommit;
}

export interface DeploymentLogsProps {
    logs: string[];
    isDeploying: boolean;
    projectName?: string;
}

// ============================================================================
// LOGS & MONITORING TYPES
// ============================================================================

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
    id: string;
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
}

export interface LogsEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    message: string;
}

export interface TrafficData {
    time: string;
    requests: number;
    responseTime: number;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface AuthContextType {
    user: IUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    repos: RepositoryCardData[];
    logout: () => Promise<void>;
}

export interface DeployContextType {
    logs: string[];
    isDeploying: boolean;
    error: string | null;
    handleDeploy: (data: DeployBodyType) => Promise<void>;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface RepoCardProps {
    repo: RepositoryCardData;
    onDeploy?: (repo: RepositoryCardData) => void;
    showDeployButton?: boolean;
}

export interface RepoListProps {
    repositories: RepositoryCardData[];
    onDeploy?: (repo: RepositoryCardData) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

export interface LogoutButtonProps {
    children?: ReactNode;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
}

// ============================================================================
// THEME TYPES
// ============================================================================

export type Theme = "dark" | "light" | "system";

export type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

export type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ProjectDetailsResponse {
    project: ProjectDetailsData;
    deployments: Deployment[];
}

// ============================================================================
// MISC TYPES
// ============================================================================

export type Page = 'dashboard' | 'insights' | 'users' | 'settings';



export interface ProjectContextType {
    projects: ProjectData[];
    project: ProjectData | null;
    logs: string[];
    setLogs: (log : string) => void;
    getProjectsList: () => void;
    startServer: (projectId : string) => Promise<void>
    redeploy: (projectId : string) => Promise<void>
    stopServer: (projectId : string) => Promise<void>
    streamLogs: (projectId : string) => Promise<void>
    deleteProject: (projectId : string) => Promise<void>
    getProjectDetailsById: (projectId : string) => Promise<ProjectDetailsResponse | undefined>
    loading: boolean;
    stopping: boolean;
    redeploying: boolean;
    starting: boolean;
    deleting: boolean;
    error: string | null;
}

export interface DeploymentStep {
  type: string | 'command' | 'success' | 'deploy' | 'reset';
  text?: string;
  delay: number;
}