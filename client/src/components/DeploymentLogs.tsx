import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  LayoutDashboard,
  ChevronDown,
  Terminal,
  Check,
  Rocket,
  ChevronRight,
} from "lucide-react";
import type { DeploymentLogsProps, DeploymentResult } from "@/types";
import { Button } from "@/components/ui/button";

const DeploymentLogs: React.FC<DeploymentLogsProps> = ({
  logs,
  isDeploying,
  projectName = "my-awesome-app",
  result,
  onReset,
}) => {
  const navigate = useNavigate();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (isDeploying) {
      setIsExpanded(true);
    }
  }, [isDeploying]);

  useEffect(() => {
    if (result) {
      setIsExpanded(true);
    }
  }, [result]);

  const confettiFiredRef = useRef<DeploymentResult | null>(null);

  useEffect(() => {
    if (result?.status === "success" && confettiFiredRef.current !== result) {
      confettiFiredRef.current = result;
      confetti({
        particleCount: 140,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.7 },
          zIndex: 9999,
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.7 },
          zIndex: 9999,
        });
      }, 250);
    }
    if (!result) {
      confettiFiredRef.current = null;
    }
  }, [result]);

  const getLogIcon = (line: string) => {
    if (
      line.includes("successfully") ||
      line.includes("completed") ||
      line.includes("✓")
    ) {
      return <Check size={14} />;
    }
    if (line.includes("Deployed") || line.includes("🚀")) {
      return <Rocket size={14} />;
    }
    return <ChevronRight size={14} />;
  };

  const getLogColor = (line: string) => {
    if (line.includes("successfully") || line.includes("completed")) {
      return "text-green-600";
    }
    if (line.includes("Deployed")) {
      return "text-purple-600";
    }
    return "text-emerald-600";
  };

  const isEmptyLine = (line: string) => line.trim().length === 0;

  return (
    <div className="w-full rounded-lg border border-muted overflow-hidden bg-card">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
          isDeploying
            ? "bg-violet-500/5 hover:bg-violet-500/10"
            : "hover:bg-accent/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <Terminal size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Deployment Logs</span>
          {isDeploying && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-400 px-1.5 py-0.5 rounded animate-pulse">
              Live
            </span>
          )}
          {isDeploying && (
            <Loader2 className="animate-spin text-violet-500" size={14} />
          )}
          {result?.status === "success" && (
            <CheckCircle2 size={14} className="text-green-500" />
          )}
          {result?.status === "error" && (
            <XCircle size={14} className="text-red-500" />
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-muted-foreground transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 space-y-4">
            {logs.length > 0 && (
              <div className="font-mono text-sm bg-muted/30 rounded-b-lg p-4 max-h-[50vh] overflow-y-auto">
                <div className="mb-3 flex items-center gap-2 text-green-600">
                  <span>$</span>
                  <span className="text-blue-500">vibe deploy</span>
                  <span>{projectName}</span>
                </div>
                <div className="space-y-1">
                  {logs.map((line, i) =>
                    isEmptyLine(line) ? (
                      <div key={i} className="h-3" />
                    ) : (
                      <div key={i} className="flex items-start gap-3 py-0.5">
                        <span className={`flex-shrink-0 ${getLogColor(line)}`}>
                          {getLogIcon(line)}
                        </span>
                        <span className={getLogColor(line)}>{line}</span>
                      </div>
                    ),
                  )}
                  {isDeploying && !result && (
                    <div className="flex items-center gap-3 py-0.5 text-violet-500">
                      <Loader2
                        className="animate-spin flex-shrink-0"
                        size={14}
                      />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
                <div ref={logsEndRef} />
              </div>
            )}

            {result?.status === "success" && (
              <div className="border-l-4 border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/40 rounded-r-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-2 flex-shrink-0">
                    <CheckCircle2
                      className="text-green-600 dark:text-green-400"
                      size={24}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-green-800 dark:text-green-300">
                      Deployed Successfully
                    </h3>
                    {result.url && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1 break-all">
                        {result.url}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {result.projectId && (
                        <Button
                          onClick={() =>
                            navigate(`/deployments/${result.projectId}`)
                          }
                          className="gap-2 cursor-pointer"
                          size="sm"
                        >
                          <ExternalLink size={15} />
                          View Deployment
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate("/projects")}
                        className="gap-2 cursor-pointer dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        size="sm"
                      >
                        <LayoutDashboard size={15} />
                        Visit Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result?.status === "error" && (
              <div className=" border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 dark:bg-red-900/50 rounded-full p-2 flex-shrink-0">
                    <XCircle
                      className="text-red-600 dark:text-red-400"
                      size={24}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-red-800 dark:text-red-300">
                      Deployment Failed
                    </h3>
                    {result.error_step && (
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mt-1">
                        Step: {result.error_step}
                      </p>
                    )}
                    {result.message && (
                      <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/60 rounded text-sm text-red-800 dark:text-red-300 font-mono whitespace-pre-wrap">
                        {result.message}
                      </div>
                    )}
                    {onReset && (
                      <Button
                        variant="destructive"
                        onClick={onReset}
                        className="gap-2 cursor-pointer mt-3"
                        size="sm"
                      >
                        <XCircle size={15} />
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!logs.length && !isDeploying && !result && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Logs will appear here when you start a deployment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentLogs;
