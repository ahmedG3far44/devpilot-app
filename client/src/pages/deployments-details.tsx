import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import Seo from "@/components/Seo";
import {
  GitBranch,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Settings,
  Plus,
  Edit2,
  Save,
  X,
  Terminal,
  ChevronDown,
  ChevronUp,
  CalendarSyncIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDuration, formatTimestamp } from "@/lib/utils";
import { useProject } from "@/context/projects/ProjectsContext";
import { useNavigate, useParams } from "react-router-dom";
import DeploymentLogs from "@/components/DeploymentLogs";
import { ThemeImage } from "@/components/DeploymentProjectForm";
import type {
  Deployment,
  DeploymentResult,
  DeploymentStatus,
  EnvVariable,
  ProjectDetailsData,
  ProjectStatus,
} from "@/types";
import { useDeploymentLogs } from "@/hooks/useDeploymentLogs";

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

export default function DeploymentDetails() {
  const { projectId } = useParams();
  const { deleteProject, getProjectDetailsById, deleting } = useProject();
  const [projectData, setProjectData] = useState<ProjectDetailsData | null>(
    null,
  );
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [showEnvDialog, setShowEnvDialog] = useState(false);
  const [mustRedeploy, setMustRedeploy] = useState(false);
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([]);
  const [editedConfig, setEditedConfig] = useState<
    Partial<ProjectDetailsData> | null
  >(null);
  const [redeployLogs, setRedeployLogs] = useState<string[]>([]);
  const [redeployResult, setRedeployResult] = useState<DeploymentResult | null>(
    null,
  );
  const [isRedeploying, setIsRedeploying] = useState(false);

  const [newEnvKey, setNewEnvKey] = useState("");

  async function fetchProjectDetails() {
    try {
      const data = await getProjectDetailsById(projectId!);
      if (data) {
        setProjectData(data.project);
        setDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteProject(projectId!);
      setShowDeleteDialog(false);
      navigate("/projects");
    } catch {
      setShowDeleteDialog(true);
    } finally {
      setDeleteConfirmName("");
      setShowDeleteDialog(false);
    }
  };

  const handleRedeploy = async (projectId: string) => {
    if (!projectData) return;
    setIsRedeploying(true);
    setRedeployLogs(["> Initializing redeploy..."]);
    setRedeployResult(null);

    try {
      const response = await fetch(
        `${BASE_URL}/deployment/${projectId}/redeploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            branch: "main",
            main_dir: editedConfig?.main_dir ?? projectData.main_dir,
            build_script:
              editedConfig?.build_script ?? projectData.build_script,
            run_script: editedConfig?.run_script ?? projectData.run_script,
            package_manager:
              editedConfig?.package_manager ?? projectData.package_manager,
            typescript: editedConfig?.typescript ?? projectData.typescript,
            environments: envVariables,
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errText}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setRedeployLogs((prev) => [...prev, "> Connection closed."]);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        if (lines.length > 0) {
          setRedeployLogs((prev) => [...prev, ...lines]);
        }
      }

      if (fullText.includes("DEPLOY_STATUS:SUCCESS")) {
        setRedeployResult({ status: "success", projectId });
        setMustRedeploy(false);
        setEditedConfig(null);
      } else if (fullText.includes("DEPLOY_STATUS:FAILED")) {
        setRedeployResult({
          status: "error",
          message: "Redeploy failed. Check the logs above for details.",
        });
      } else {
        setRedeployResult({
          status: "error",
          message:
            "Redeploy ended without success confirmation. Check the logs above.",
        });
      }

      await fetchProjectDetails();
    } catch (err: any) {
      setRedeployResult({ status: "error", message: err.message });
      setRedeployLogs((prev) => [...prev, `> Error: ${err.message}`]);
    } finally {
      setIsRedeploying(false);
    }
  };

  const canShowLogs = () => {
    return (
      projectData && ["next", "nest", "express"].includes(projectData.type)
    );
  };

  const calculateUptime = (createdAt: string | Date) => {
    const start = new Date(createdAt).getTime();
    const now = Date.now();

    if (isNaN(start)) {
      throw new Error("Invalid project creation datetime");
    }

    const diffMs = now - start;

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  const calculateDeploymentDuration = () => {
    if (deployments.length === 0) return 0;
    const latest = deployments[0];
    const created = new Date(latest.createdAt);
    const updated = new Date(latest.updatedAt);
    return Math.floor((updated.getTime() - created.getTime()) / 1000); // seconds
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  if (!projectData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  const { days, hours, minutes } = calculateUptime(projectData?.createdAt);

  const uptimeString = `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m` : ""}`;
  const displayUptime = uptimeString || "N/A";

  if (deleting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-destructive" />
          <p className="text-sm text-muted-foreground">Deleting project...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DeploymentsAction
        envVariables={envVariables}
        projectData={projectData}
        setShowDeleteDialog={setShowDeleteDialog}
        setDeleteConfirmName={setDeleteConfirmName}
        setShowEnvDialog={setShowEnvDialog}
        mustRedeploy={mustRedeploy}
        isRedeploying={isRedeploying}
        onRedeploy={handleRedeploy}
        fetchProjectDetails={fetchProjectDetails}
      />

      {(isRedeploying || redeployResult || redeployLogs.length > 0) && (
        <div className="container mx-auto py-8">
          <DeploymentLogs
            logs={redeployLogs}
            isDeploying={isRedeploying}
            projectName={projectData?.name}
            result={redeployResult}
          />
        </div>
      )}

      <main className="container mx-auto py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <DeploymentsInsights
              projectData={projectData}
              uptime={displayUptime}
              deploymentDuration={calculateDeploymentDuration()}
              totalDeployments={deployments.length}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Deployment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeploymentHistory
                  deployments={deployments}
                  getStatusColor={getStatusColor}
                />
              </CardContent>
            </Card>

            {canShowLogs() && <RuntimeLogs projectId={projectId!} />}
          </div>

          <div className="space-y-6">
            <ProjectConfiguration
              projectData={projectData}
              onConfigEdit={(config) => {
                setEditedConfig(config);
                setMustRedeploy(true);
              }}
            />
            <EnvironmentVariables
              envVariables={envVariables}
              setEnvVariables={setEnvVariables}
              setMustRedeploy={setMustRedeploy}
              projectData={projectData}
              showEnvDialog={showEnvDialog}
              newEnvKey={newEnvKey}
              setNewEnvKey={setNewEnvKey}
              setShowEnvDialog={setShowEnvDialog}
            />
          </div>
        </div>
      </main>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmName("");
            setShowDeleteDialog(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="pt-2">
              This action cannot be undone. All data, deployments, and
              configurations will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="confirm-name">
                Type{" "}
                <span className="font-semibold">"{projectData?.name}"</span> to
                confirm deletion:
              </Label>
              <Input
                id="confirm-name"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={projectData?.name}
                className="border-red-300 focus-visible:rose-red-700"
              />
            </div>
          </div>
          <DialogFooter className="space-x-1">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmName("");
                setShowDeleteDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmName !== projectData?.name}
              onClick={confirmDelete}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeploymentsInsights({
  projectData,
  uptime,
  deploymentDuration,
  totalDeployments,
}: {
  projectData: ProjectDetailsData;
  uptime: string;
  deploymentDuration: number;
  totalDeployments: number;
}) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {uptime === "N/A" ? uptime : (
              <span className="tabular-nums">{uptime}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Last Updated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">
            {formatTimestamp(new Date(projectData.updatedAt))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Deploy Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">
            {formatDuration(deploymentDuration)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Deploys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{totalDeployments}</div>
        </CardContent>
      </Card>

    </div>
  );
}

const getStatusColor = (status: ProjectStatus | DeploymentStatus) => {
  switch (status) {
    case "active":
    case "success":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "failed":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "stopped":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    default:
      return "";
  }
};

const PROJECT_TYPE_IMAGES: Record<string, string> = {
  react: "/images/reactjs.png",
  nest: "/images/nestjs.png",
  express: "/images/expressjs.png",
  static: "/images/static.png",
};

const PACKAGE_MANAGER_IMAGES: Record<string, string> = {
  npm: "/images/npm.svg",
  pnpm: "/images/pnpm.svg",
  yarn: "/images/yarn.svg",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  active:
    "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/10",
  success:
    "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/10",
  failed: "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/10",
  stopped: "bg-gray-500/10 text-gray-500 border-gray-500/30 hover:bg-gray-500/10",
  pending:
    "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/10",
};

const STATUS_DOT_STYLES: Record<string, string> = {
  active: "bg-green-500",
  success: "bg-green-500",
  failed: "bg-red-500",
  stopped: "bg-gray-400",
  pending: "bg-amber-500",
};

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge
      className={cn(
        "gap-1.5 border px-2.5 py-1 capitalize",
        STATUS_BADGE_STYLES[status] ??
          "bg-muted text-muted-foreground border-border",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          STATUS_DOT_STYLES[status] ?? "bg-gray-400",
          isActive && "animate-pulse",
        )}
      />
      {status}
    </Badge>
  );
}

function ProjectTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-border bg-card px-2.5 py-1 font-medium"
    >
      {type === "next" ? (
        <ThemeImage size={16} />
      ) : (
        <img
          src={PROJECT_TYPE_IMAGES[type]}
          alt=""
          width={16}
          height={16}
          className="object-contain"
        />
      )}
      <span className="capitalize">{type}</span>
    </Badge>
  );
}

function ProjectConfiguration({
  projectData,
  onConfigEdit,
}: {
  projectData: ProjectDetailsData;
  onConfigEdit: (config: Partial<ProjectDetailsData>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ProjectDetailsData>>({});

  const startEdit = () => {
    setDraft({
      main_dir: projectData.main_dir,
      build_script: projectData.build_script,
      run_script: projectData.run_script,
      package_manager: projectData.package_manager,
      typescript: projectData.typescript,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    onConfigEdit(draft);
    setEditing(false);
  };

  const updateField = (field: keyof ProjectDetailsData, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const isStatic = projectData.type === "static";

  const repoUrl = projectData.clone_url.replace(/\.git$/, "");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Project Configuration
          </CardTitle>
          {!editing && (
            <Button onClick={startEdit} size="sm" variant="outline">
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Clone URL</Label>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open repository in new tab"
              title="Open repository in new tab"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          <p className="text-sm break-all text-muted-foreground">{projectData.clone_url}</p>
        </div>
        <Separator />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Input
            value="main"
            readOnly
            className="cursor-not-allowed"
            aria-readonly="true"
            aria-label="Branch (locked to main)"
          />
        </div>
        <Separator />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Main Directory
          </Label>
          {editing ? (
            <Input
              value={draft.main_dir ?? ""}
              onChange={(e) => updateField("main_dir", e.target.value)}
            />
          ) : (
            <p className="text-sm font-mono">{projectData.main_dir}</p>
          )}
        </div>
        <Separator />
        {!isStatic && (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Build Script
              </Label>
              {editing ? (
                <Input
                  value={draft.build_script ?? ""}
                  onChange={(e) => updateField("build_script", e.target.value)}
                />
              ) : (
                <p className="text-sm font-mono">{projectData.build_script}</p>
              )}
            </div>
            <Separator />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Run Script
              </Label>
              {editing ? (
                <Input
                  value={draft.run_script ?? ""}
                  onChange={(e) => updateField("run_script", e.target.value)}
                />
              ) : (
                <p className="text-sm font-mono">
                  {projectData.run_script || "N/A"}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Package Manager
              </Label>
              {editing ? (
                <Select
                  value={draft.package_manager ?? "npm"}
                  onValueChange={(value) =>
                    updateField("package_manager", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["npm", "pnpm", "yarn", "n/a"].map((pkg) => (
                      <SelectItem key={pkg} value={pkg}>
                        {pkg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-mono">
                  {projectData.package_manager}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                TypeScript
              </Label>
              {editing ? (
                <Switch
                  checked={draft.typescript ?? false}
                  onCheckedChange={(checked) =>
                    setDraft((prev) => ({ ...prev, typescript: checked }))
                  }
                />
              ) : (
                <p className="text-sm font-mono">
                  {projectData.typescript ? "Yes" : "No"}
                </p>
              )}
            </div>
          </>
        )}
        {editing && (
          <>
            {!isStatic && <Separator />}
            <div className="flex gap-2">
              <Button onClick={saveEdit} size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                onClick={() => setEditing(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EnvironmentVariables({
  projectData,
  showEnvDialog,
  setShowEnvDialog,
  newEnvKey,
  envVariables,
  setNewEnvKey,
  setMustRedeploy,
  setEnvVariables,
}: {
  projectData: ProjectDetailsData;
  showEnvDialog: boolean;
  setShowEnvDialog: (open: boolean) => void;
  newEnvKey: string;
  setNewEnvKey: (key: string) => void;
  setMustRedeploy: (value: boolean) => void;
  envVariables: EnvVariable[];
  setEnvVariables: Dispatch<SetStateAction<EnvVariable[]>>;
}) {
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [tempEnvValues, setTempEnvValues] = useState<Record<string, string>>(
    {},
  );
  const [newEnvValue, setNewEnvValue] = useState("");

  useEffect(() => {
    setEnvVariables(projectData.environments || []);
  }, [projectData.environments]);

  const addEnvVariable = () => {
    if (!newEnvKey.trim()) return;

    const isDuplicate = envVariables.some((v) => v.key === newEnvKey);
    if (isDuplicate) {
      alert("Duplicate key not allowed");
      return;
    }

    const newEnv: EnvVariable = {
      id: Date.now().toString(),
      key: newEnvKey,
      value: newEnvValue,
    };

    setEnvVariables((prev) => [...prev, newEnv]);
    setNewEnvKey("");
    setNewEnvValue("");
    setShowEnvDialog(false);
    setMustRedeploy(true);
  };

  const startEditEnv = (id: string) => {
    setEditingEnvId(id);
    setTempEnvValues((prev) => ({ ...prev, [id]: "" }));
  };

  const saveEnvEdit = (id: string) => {
    setEnvVariables((prev) =>
      prev.map((v) =>
        v.id === id && tempEnvValues[id]?.trim()
          ? { ...v, value: tempEnvValues[id] }
          : v,
      ),
    );
    setEditingEnvId(null);
    setMustRedeploy(true);
  };

  const cancelEnvEdit = (id: string) => {
    setEditingEnvId(null);
    setTempEnvValues((prev) => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const deleteEnvVariable = (id: string) => {
    setEnvVariables((prev) => prev.filter((v) => v.id !== id));
    setMustRedeploy(true);
  };

  return (
    <Card>      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <Button
            onClick={() => setShowEnvDialog(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {envVariables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Terminal className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No environment variables configured
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {envVariables.map((envVar) => (
                <div
                  key={envVar.id}
                  className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {envVar.key}
                    </Label>
                    <div className="flex gap-1">
                      {editingEnvId === envVar.id ? (
                        <>
                          <Button
                            onClick={() => saveEnvEdit(envVar.id as string)}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                          >
                            <Save className="h-3.5 w-3.5 text-green-500" />
                          </Button>
                          <Button
                            onClick={() => cancelEnvEdit(envVar.id as string)}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => startEditEnv(envVar.id as string)}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() =>
                              deleteEnvVariable(envVar.id as string)
                            }
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingEnvId === envVar.id ? (
                    <Input
                      value={tempEnvValues[envVar.id] || ""}
                      onChange={(e) =>
                        setTempEnvValues((prev) => ({
                          ...prev,
                          [envVar.id as string]: e.target.value,
                        }))
                      }
                      placeholder="Enter new value"
                      className="font-mono text-xs"
                    />
                  ) : (
                    <p className="text-xs font-mono break-all text-muted-foreground">
                      ••••••••••••••••••••
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <Dialog open={showEnvDialog} onOpenChange={setShowEnvDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Environment Variable</DialogTitle>
            <DialogDescription>
              Add a new environment variable. Changes will trigger a redeploy if
              required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="env-key">Key</Label>
              <Input
                id="env-key"
                placeholder="API_KEY"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-value">Value</Label>
              <Input
                id="env-value"
                placeholder="your-secret-value"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
              />
            </div>
            {/TOKEN|SECRET|KEY|PASSWORD|API/i.test(newEnvKey) && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p className="text-xs text-yellow-500">
                  This appears to be a sensitive value and will stay hidden
                  after saving.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnvDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addEnvVariable}>Add Variable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function RuntimeLogs({ projectId }: { projectId: string }) {
  const {
    logs: sseLogs,
    isConnected,
    error: logsError,
  } = useDeploymentLogs(projectId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Runtime Logs
          {isConnected && (
            <span className="text-xs text-green-500 ml-2">● Live</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 font-mono text-sm">
            {logsError && <div className="text-red-500 p-2">{logsError}</div>}
            {sseLogs.length === 0 ? (
              <div className="text-muted-foreground">No logs available</div>
            ) : (
              sseLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded border border-border bg-muted/30 p-2"
                >
                  <span className="text-muted-foreground whitespace-nowrap">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString()
                      : ""}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function DeploymentHistory({
  deployments,
  getStatusColor,
}: {
  deployments: Deployment[];
  getStatusColor: (status: DeploymentStatus) => string;
}) {
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(
    null,
  );

  const getStatusIcon = (status: ProjectStatus | DeploymentStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const calculateDuration = (deployment: Deployment) => {
    const created = new Date(deployment.createdAt);
    const updated = new Date(deployment.updatedAt);
    return Math.floor((updated.getTime() - created.getTime()) / 1000);
  };

  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No deployment history available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {deployments.map((deployment, index) => (
          <div key={deployment._id} className="relative">
            {index < deployments.length - 1 && (
              <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
            )}
            <div
              className={cn(
                "relative flex gap-4 rounded-lg border p-4 transition-colors cursor-pointer",
                selectedDeployment === deployment._id
                  ? "border bg-card"
                  : "hover:bg-accent/50",
              )}
              onClick={() =>
                setSelectedDeployment(
                  selectedDeployment === deployment._id ? null : deployment._id,
                )
              }
            >
              <div className="relative">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                    getStatusColor(deployment.status),
                  )}
                >
                  {getStatusIcon(deployment.status)}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{deployment.version}</span>
                    {deployment.last_commit && (
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">
                        {deployment.last_commit.sha.substring(0, 7)}
                      </code>
                    )}
                  </div>
                  <Badge className={cn("border", getStatusColor(deployment.status))}>
                    {deployment.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(new Date(deployment.createdAt))}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {formatDuration(calculateDuration(deployment))}
                  </span>
                  {deployment.last_commit && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      Git push
                    </span>
                  )}
                </div>

                {selectedDeployment === deployment._id &&
                  deployment.last_commit && (
                    <div className="mt-4 space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Deploy ID:
                        </span>{" "}
                        <code className="ml-2">{deployment._id}</code>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Full Timestamp:
                        </span>{" "}
                        <span className="ml-2">
                          {new Date(deployment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Commit:</span>{" "}
                        <span className="ml-2">
                          {deployment.last_commit.message}
                        </span>
                      </div>
                      <div className="text-sm flex justify-start items-center gap-2">
                        <span className="text-muted-foreground ">Author:</span>{" "}
                        {deployment.last_commit.author?.avatar_url && (
                          <img
                            src={deployment.last_commit.author?.avatar_url}
                            alt=""
                            className="h-4 w-4 rounded-full"
                          />
                        )}
                        <span>
                          {deployment.last_commit.author?.name} (
                          {deployment.last_commit.author?.email})
                        </span>
                      </div>
                    </div>
                  )}
              </div>

              <div>
                {selectedDeployment === deployment._id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function DeploymentsAction({
  projectData,
  envVariables,
  setShowDeleteDialog,
  setDeleteConfirmName,
  setShowEnvDialog,
  mustRedeploy,
  isRedeploying,
  onRedeploy,
  fetchProjectDetails,
}: {
  projectData: ProjectDetailsData;
  envVariables: EnvVariable[];
  setShowDeleteDialog: (show: boolean) => void;
  setDeleteConfirmName: (name: string) => void;
  setShowEnvDialog: (show: boolean) => void;
  mustRedeploy: boolean;
  isRedeploying: boolean;
  onRedeploy: (projectId: string) => Promise<void>;
  fetchProjectDetails: () => Promise<void>;
}) {
  const handleDelete = () => {
    setDeleteConfirmName("");
    setShowDeleteDialog(true);
  };
  const syncEnv = async (environments: EnvVariable[]) => {
    try {
      const response = await fetch(
        `${BASE_URL}/deployment/${projectData._id}/sync-env`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            environments,
          }),
        },
      );
      const data = await response.json();
      console.log(data);
      await fetchProjectDetails();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Seo
        title="Deployment Details"
        description="Live deployment logs and configuration for your project."
        noindex
      />
      <header className="border-b border-border ">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <h1 className="text-2xl font-bold">{projectData.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={projectData.status} />
              <ProjectTypeBadge type={projectData.type} />
              {projectData.type !== "static" &&
                projectData.package_manager && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-border bg-card px-2.5 py-1 font-medium"
                  >
                    {PACKAGE_MANAGER_IMAGES[projectData.package_manager] && (
                      <img
                        src={PACKAGE_MANAGER_IMAGES[projectData.package_manager]}
                        alt={projectData.package_manager}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    )}
                    <span className="capitalize">
                      {projectData.package_manager}
                    </span>
                  </Badge>
                )}
            </div>
          </div>
          {projectData.status === "active" && projectData.production_url && (
            <a
              href={projectData.production_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Site
            </a>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {(projectData.status === "active" ||
            projectData.status === "failed") && (
            <Button
              disabled={!mustRedeploy || isRedeploying}
              onClick={() => onRedeploy(projectData._id)}
              variant={mustRedeploy ? "default" : "outline"}
              size="sm"
            >
              {isRedeploying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="animated-pulse  inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-3 h-3 rounded-full bg-amber-500/20 animate-pulse backdrop-brightness-100">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                  </span>
                  Redeploy
                </span>
              )}
            </Button>
          )}
          <Button
            onClick={() => setShowEnvDialog(true)}
            variant="outline"
            size="sm"
          >
            <Settings className="mr-2 h-4 w-4" />
            Add Env
          </Button>
          <Button
            disabled={
              JSON.stringify(projectData.environments) ===
              JSON.stringify(envVariables)
            }
            onClick={() => syncEnv(envVariables)}
            variant="outline"
            size="sm"
          >
            <CalendarSyncIcon className="mr-2 h-4 w-4" />
            Sync Env
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="text-destructive bg-transparent"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </header>
    </>
  );
}
