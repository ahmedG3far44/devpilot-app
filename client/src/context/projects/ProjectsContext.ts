import type {ProjectData}
from "@/components/ProjectMonitor";
import type {ProjectDetailsResponse}
from "@/pages/deployments-details";
import {createContext, useContext} from "react";

export interface ProjectContextType {
    projects: ProjectData[];
    project: ProjectData | null;
    logs: string[];
    setLogs: (log : string) => void;
    getProjectsList: () => void;
    startServer: (projectId : string) => Promise<void> redeploy: (projectId : string) => Promise<void> stopServer: (projectId : string) => Promise<void> streamLogs: (projectId : string) => Promise<void> deleteProject: (projectId : string) => Promise<void> getProjectDetailsById: (projectId : string) => Promise<ProjectDetailsResponse | undefined> loading: boolean;
    stopping: boolean;
    redeploying: boolean;
    starting: boolean;
    deleting: boolean;
    error: string | null;
}

export const ProjectsContext = createContext < ProjectContextType > ({
    projects: [],
    project: null,
    logs: [],
    setLogs: () => {},
    getProjectsList: () => Promise.resolve(),
    redeploy: () => Promise.resolve(),
    startServer: () => Promise.resolve(),
    stopServer: () => Promise.resolve(),
    streamLogs: () => Promise.resolve(),
    deleteProject: () => Promise.resolve(),
    getProjectDetailsById: (_ : string) => Promise.resolve(undefined),
    loading: false,
    starting: false,
    redeploying: false,
    stopping: false,
    deleting: false,
    error: null
});

export const useProject = () => useContext(ProjectsContext);
