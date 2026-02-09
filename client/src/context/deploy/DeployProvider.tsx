import { useState, type FC, type PropsWithChildren } from "react";
import { DeployContext } from "./DeployContext";
import type { DeployBodyType } from "@/types";

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

const DeployProvider: FC<PropsWithChildren> = ({ children }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = async (deployedProjectData: DeployBodyType) => {
    setIsDeploying(true);
    setError(null);
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

      // 1. Initialize the reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let projectId = "";
      let redirectUrl = "";

      // 2. Read the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setLogs((prev) => [...prev, "> Connection closed."]);
          break;
        }

        // 3. Decode the chunk
        const chunk = decoder.decode(value, { stream: true });

        // 4. Append to buffer and split by new lines
        buffer += chunk;
        const lines = buffer.split("\n");

        // The last item in 'lines' might be incomplete (no newline yet),
        // so we keep it in the buffer for the next chunk.
        buffer = lines.pop() || "";

        // 5. Update state with complete lines
        if (lines.length > 0) {
          setLogs((prev) => [...prev, ...lines]);
        }

        if (buffer.includes("DEPLOY_STATUS:SUCCESS")) {
          // Extract project ID
          const projectIdMatch = buffer.match(/PROJECT_ID:([^\n]+)/);
          if (projectIdMatch) {
            projectId = projectIdMatch[1];
          }

      
          const redirectMatch = buffer.match(/REDIRECT_URL:([^\n]+)/);
          if (redirectMatch) {
            redirectUrl = redirectMatch[1];
          }
        }
      }

      if (projectId && redirectUrl) {
        window.location.assign(redirectUrl);
      }
    } catch (err: any) {
      setError(err.message);
      setLogs((prev) => [...prev, `> Error: ${err.message}`]);
    } finally {
      setIsDeploying(false);
    }
  };
  
  return (
    <DeployContext.Provider value={{ logs, handleDeploy, isDeploying, error }}>
      {children}
    </DeployContext.Provider>
  );
};

export default DeployProvider;

