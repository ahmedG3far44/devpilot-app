import { useEffect, useState, type FC, type PropsWithChildren } from "react";
import { ProjectsContext } from "./ProjectsContext";
import type { ProjectData, ProjectDetailsResponse } from "@/types";

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

const ProjectsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjectsList] = useState<ProjectData[]>([]);
  const [project] = useState<ProjectData | null>(null);
  const [logs] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [redeploying, setRedeploying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // const [updatingEnv, setUpdatingEnv] = useState(false);

  const getProjectsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/project`, {
        credentials: "include",
      });
      const results = await response.json();
      setProjectsList(results.data);
      return results.data;
    } catch (err) {
      setError((err as Error).message);
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack
      );
    } finally {
      setLoading(false);
    }
  };

  const getProjectDetailsById = async (projectId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/deployment/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const results: { data: ProjectDetailsResponse } = await response.json();
      return results.data;
    } catch (err) {
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack
      );
    }
  };

  useEffect(() => {
    getProjectsList();
  }, []);

  const startServer = async (projectId: string) => {
    try {
      setStarting(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/project/${projectId}/start`, {
        method: "POST",
        credentials: "include",
      });
      const results = await response.json();

      console.log(results.data);
    } catch (err) {
      setError((err as Error).message);
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack
      );
    } finally {
      setStarting(false);
    }
  };

  const stopServer = async (projectId: string) => {
    try {
      setStopping(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/project/${projectId}/stop`, {
        method: "POST",
        credentials: "include",
      });
      const results = await response.json();

      console.log(results.data);  
    } catch (err) {
      setError((err as Error).message);
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack
      );
    } finally {
      setStopping(false);
    }
  };


  const deleteProject = async (projectId: string) => {
    try {
      setDeleting(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/deployment/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const results = await response.json();

      console.log(results.data);
    } catch (err) {
      setError((err as Error).message);
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack
      );
    } finally {
      setDeleting(false);
    }
  };

  const redeploy = async (projectId: string) => {
    try {
      setRedeploying(true);
      setError(null);
      const response = await fetch(
        `${BASE_URL}/project/${projectId}/redeploy`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const results = await response.json();

      console.log(results.data);
    } catch (err) {
      setError((err as Error).message);
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack
      );
    } finally {
      setRedeploying(false);
    }
  };

  const streamLogs = async (projectId: string) => {
    try {
      setRedeploying(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/project/${projectId}/logs`, {
        method: "POST",
        credentials: "include",
      });
      const results = await response.json();
      setProjectsList(results.data);
    } catch (err) {
      setError((err as Error).message);
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack
      );
    } finally {
      setRedeploying(false);
    }
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        project,
        getProjectsList,
        setLogs: () => { },
        getProjectDetailsById,
        logs,
        redeploying,
        starting,
        stopping,
        deleting,
        loading,
        redeploy,
        deleteProject,
        startServer,
        stopServer,
        streamLogs,
        error,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export default ProjectsProvider;
