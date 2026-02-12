import type {ProjectContextType}
from "@/types";
import {createContext, useContext} from "react";


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
