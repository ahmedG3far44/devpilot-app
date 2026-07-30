import { useState, type FC, type PropsWithChildren } from "react";
import { DeployContext } from "./DeployContext";
import type { DeployBodyType, DeploymentResult } from "@/types";

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

const DeployProvider: FC<PropsWithChildren> = ({ children }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);

  const resetDeploy = () => {
    setLogs([]);
    setError(null);
    setDeploymentResult(null);
    setIsDeploying(false);
  };

  const tryParseReport = (text: string): DeploymentResult | null => {
    const jsonMatch = text.match(/\{[^]*?"project"[^]*?"status"[^]*?\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.status === "success" || parsed.status === "error") {
        return {
          status: parsed.status,
          url: parsed.url || undefined,
          error_step: parsed.error_step || undefined,
          message: parsed.message || undefined,
        };
      }
    } catch {
      // not valid JSON, ignore
    }
    return null;
  };

  const handleDeploy = async (deployedProjectData: DeployBodyType) => {
    setIsDeploying(true);
    setError(null);
    setDeploymentResult(null);
    setLogs(["> Initializing deployment connection..."]);

    try {
      const response = await fetch(`${BASE_URL}/deployment/deploy`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deployedProjectData),
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullText = "";
      let projectId = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setLogs((prev) => [...prev, "> Connection closed."]);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        if (lines.length > 0) {
          setLogs((prev) => [...prev, ...lines]);
        }
      }

      // After stream ends, parse the full text for PROJECT_ID and JSON report
      const projectIdMatch = fullText.match(/PROJECT_ID:([^\n]+)/);
      if (projectIdMatch) {
        projectId = projectIdMatch[1].trim();
      }

      const report = tryParseReport(fullText);
      if (report) {
        if (projectId) {
          report.projectId = projectId;
        }
        setDeploymentResult(report);
      } else if (projectId) {
        // No JSON report from script, but we got PROJECT_ID from backend
        const prefix =
          deployedProjectData.type === "express" || deployedProjectData.type === "nest"
            ? "api."
            : "";
        setDeploymentResult({
          status: "success",
          projectId,
          url: deployedProjectData.name
            ? `https://${prefix}${deployedProjectData.name.toLowerCase().trim()}.stacktest.space`
            : undefined,
        });
      } else if (fullText.includes("DEPLOY_STATUS:FAILED") || fullText.includes("DEPLOY_STATUS:SSH_ERROR") || fullText.includes("DEPLOY_STATUS:DB_ERROR")) {
        setDeploymentResult({
          status: "error",
          message: "Deployment failed. Check the logs above for details.",
        });
      }
    } catch (err: any) {
      setError(err.message);
      setLogs((prev) => [...prev, `> Error: ${err.message}`]);
      setDeploymentResult({
        status: "error",
        message: err.message,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <DeployContext.Provider value={{ logs, handleDeploy, isDeploying, error, deploymentResult, resetDeploy }}>
      {children}
    </DeployContext.Provider>
  );
};

export default DeployProvider;
