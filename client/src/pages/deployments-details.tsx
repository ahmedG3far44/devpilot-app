import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import {
    Globe,
    GitBranch,
    Activity,
    Clock,
    Zap,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Trash2,
    Play,
    Square,
    RotateCw,
    Settings,
    Plus,
    Eye,
    EyeOff,
    Edit2,
    Save,
    X,
    Terminal,
    ChevronDown,
    ChevronUp,
    FolderSync,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn, formatDuration, formatTimestamp } from "@/lib/utils"
import { useProject } from "@/context/projects/ProjectsContext"
import { useNavigate, useParams } from "react-router-dom"
import type { Deployment, DeploymentStatus, EnvVariable, LogLevel, LogsEntry, ProjectDetailsData, ProjectStatus } from "@/types"


const BASE_URL = import.meta.env.VITE_BASE_URL as string;

export default function DeploymentDetails() {
    const { projectId } = useParams();
    const { deleteProject, getProjectDetailsById } = useProject();
    const [projectData, setProjectData] = useState<ProjectDetailsData | null>(null)
    const [deployments, setDeployments] = useState<Deployment[]>([])
    const [logs] = useState<LogsEntry[]>([
        {
            id: "1",
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            level: "info",
            message: "Server started on port 3001",
        },
        {
            id: "2",
            timestamp: new Date(Date.now() - 3 * 60 * 1000),
            level: "info",
            message: "API endpoint /api/users called successfully",
        },
        {
            id: "3",
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            level: "warn",
            message: "High memory usage detected: 85%",
        },
        {
            id: "4",
            timestamp: new Date(Date.now() - 1 * 60 * 1000),
            level: "error",
            message: "Failed to connect to external API: timeout",
        },
    ])

    const navigate = useNavigate()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showStopDialog, setShowStopDialog] = useState(false)
    const [showEnvDialog, setShowEnvDialog] = useState(false)
    const [mustRedeploy, setMustRedeploy] = useState(false)

    const [newEnvKey, setNewEnvKey] = useState("")

    const confirmDelete = async () => {
        console.log("Confirming Delete project...")
        try {
            const data = await deleteProject(projectId!)
            console.log(data)
            setShowDeleteDialog(false)
            navigate("/projects")
        } catch (error) {
            console.log(error)
            setShowDeleteDialog(true)
        } finally {
            setShowDeleteDialog(false)
        }
    }

    const confirmStop = () => {
        console.log("Confirming Stop project...")
    }

    const canShowLogs = () => {
        return projectData && ["next", "nest", "express"].includes(projectData.type)
    }

    const calculateUptime = (createdAt: string | Date) => {
        const start = new Date(createdAt).getTime()
        const now = Date.now()

        if (isNaN(start)) {
            throw new Error("Invalid project creation datetime")
        }

        const diffMs = now - start

        const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
        const days = Math.floor(totalHours / 24)
        const hours = totalHours % 24
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

        return { days, hours, minutes }
    }




    const calculateDeploymentDuration = () => {
        if (deployments.length === 0) return 0
        const latest = deployments[0]
        const created = new Date(latest.createdAt)
        const updated = new Date(latest.updatedAt)
        return Math.floor((updated.getTime() - created.getTime()) / 1000) // seconds
    }

    useEffect(() => {
        async function fetchProjectDetails() {
            try {
                const data = await getProjectDetailsById(projectId!)
                if (data) {
                    setProjectData(data.project)
                    setDeployments(data.deployments || [])
                }
            } catch (error) {
                console.error("Failed to fetch project details:", error)
            }
        }
        fetchProjectDetails()
    }, [projectId])

    if (!projectData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const { days, hours, minutes } = calculateUptime(projectData?.createdAt)

    const uptimeString = `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`

    return (
        <div className="min-h-screen bg-background text-foreground">
            <DeploymentsAction
                projectData={projectData}
                setShowDeleteDialog={setShowDeleteDialog}
                setShowStopDialog={setShowStopDialog}
                setShowEnvDialog={setShowEnvDialog}
                newEnvKey={newEnvKey}
                setNewEnvKey={setNewEnvKey}
                setDeployments={setDeployments}
                mustRedeploy={mustRedeploy}
                setMustRedeploy={setMustRedeploy}
            />

            <main className="container mx-auto py-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <DeploymentsInsights
                            projectData={projectData}
                            uptime={uptimeString}
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
                                <DeploymentHistory deployments={deployments} getStatusColor={getStatusColor} />
                            </CardContent>
                        </Card>

                        {!canShowLogs() && (
                            <RuntimeLogs logs={logs as LogsEntry[]} />
                        )}
                    </div>

                    <div className="space-y-6">
                        <ProjectConfiguration projectData={projectData} />
                        <EnvironmentVariables
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

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{projectData.name}"? This action cannot be undone and will result in
                            permanent data loss and immediate downtime.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Stop Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to stop "{projectData.name}"? This will cause immediate downtime until you start it
                            again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmStop}>Stop</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function DeploymentsInsights({
    projectData,
    uptime,
    deploymentDuration,
    totalDeployments
}: {
    projectData: ProjectDetailsData
    uptime: string
    deploymentDuration: number
    totalDeployments: number
}) {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold text-green-500">{uptime}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{formatTimestamp(new Date(projectData.updatedAt))}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Deploy Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{formatDuration(deploymentDuration)}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Deploys</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{totalDeployments}</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const getStatusColor = (status: ProjectStatus | DeploymentStatus) => {
    switch (status) {
        case "active":
        case "success":
            return "bg-green-500/10 text-green-500 border-green-500/20"
        case "failed":
            return "bg-red-500/10 text-red-500 border-red-500/20"
        case "stopped":
            return "bg-gray-500/10 text-gray-500 border-gray-500/20"
        default:
            return ""
    }
}

function ProjectConfiguration({ projectData }: { projectData: ProjectDetailsData }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Project Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Clone URL</Label>
                    <p className="text-sm break-all">{projectData.clone_url}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Branch</Label>
                    <p className="text-sm font-mono">{projectData.branch}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Main Directory</Label>
                    <p className="text-sm font-mono">{projectData.main_dir}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Build Script</Label>
                    <p className="text-sm font-mono">{projectData.build_script}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Run Script</Label>
                    <p className="text-sm font-mono">{projectData.run_script || "N/A"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">TypeScript</Label>
                    <p className="text-sm">{projectData.typescript ? "Yes" : "No"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="text-sm">{projectData.type}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function EnvironmentVariables({
    projectData,
    showEnvDialog,
    setShowEnvDialog,
    newEnvKey,
    setNewEnvKey,
    setMustRedeploy
}: {
    projectData: ProjectDetailsData
    showEnvDialog: boolean
    setShowEnvDialog: (open: boolean) => void
    newEnvKey: string
    setNewEnvKey: (key: string) => void
    setMustRedeploy: (value: boolean) => void
}) {
    const [envVariables, setEnvVariables] = useState<EnvVariable[]>(projectData.environments || [])
    const [editingEnvId, setEditingEnvId] = useState<string | null>(null)
    const [maskedValues, setMaskedValues] = useState<Record<string, boolean>>({})
    const [tempEnvValues, setTempEnvValues] = useState<Record<string, string>>({})
    const [newEnvValue, setNewEnvValue] = useState("")

    useEffect(() => {
        setEnvVariables(projectData.environments || [])
        if (projectData.environments !== envVariables) {
            setMustRedeploy(true)
        }
    }, [projectData.environments])

    const toggleMask = (id: string) => {
        setMaskedValues((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    const addEnvVariable = () => {
        if (!newEnvKey.trim()) return

        const isDuplicate = envVariables.some((v) => v.key === newEnvKey)
        if (isDuplicate) {
            alert("Duplicate key not allowed")
            return
        }

        const newEnv: EnvVariable = {
            id: Date.now().toString(),
            key: newEnvKey,
            value: newEnvValue,
        }

        setEnvVariables((prev) => [...prev, newEnv])
        setNewEnvKey("")
        setNewEnvValue("")
        setShowEnvDialog(false)
    }

    const startEditEnv = (id: string) => {
        const envVar = envVariables.find((v) => v.id === id)
        if (envVar) {
            setEditingEnvId(id)
            setTempEnvValues((prev) => ({ ...prev, [id]: envVar.value }))
        }
    }

    const saveEnvEdit = (id: string) => {
        setEnvVariables((prev) => prev.map((v) => (v.id === id ? { ...v, value: tempEnvValues[id] || v.value } : v)))
        setEditingEnvId(null)
    }

    const cancelEnvEdit = (id: string) => {
        setEditingEnvId(null)
        setTempEnvValues((prev) => {
            const newValues = { ...prev }
            delete newValues[id]
            return newValues
        })
    }

    const deleteEnvVariable = (id: string) => {
        setEnvVariables((prev) => prev.filter((v) => v.id !== id))
    }

    const isSensitive = (key: string) => {
        return /TOKEN|SECRET|KEY|PASSWORD|API/i.test(key)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" />
                        Environment Variables
                    </CardTitle>
                    <Button onClick={() => setShowEnvDialog(true)} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {envVariables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Terminal className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No environment variables configured</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                            {envVariables.map((envVar) => (
                                <div key={envVar.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">{envVar.key}</Label>
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
                                                    {isSensitive(envVar.key) && (
                                                        <Button
                                                            onClick={() => toggleMask(envVar.id as string)}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            {maskedValues[envVar.id as string] ? (
                                                                <Eye className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <EyeOff className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => startEditEnv(envVar.id as string)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => deleteEnvVariable(envVar.id as string)}
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
                                            className="font-mono text-xs"
                                        />
                                    ) : (
                                        <p className="text-xs font-mono break-all text-muted-foreground">
                                            {isSensitive(envVar.key) && !maskedValues[envVar.id as string]
                                                ? "•".repeat(20)
                                                : envVar.value}
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
                            Add a new environment variable. Changes will trigger a redeploy if required.
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
                                    This appears to be a sensitive value and will be masked by default.
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
    )
}

function RuntimeLogs({ logs }: { logs: LogsEntry[] }) {
    const getLogLevelColor = (level: LogLevel) => {
        switch (level) {
            case "info":
                return "text-blue-500"
            case "warn":
                return "text-yellow-500"
            case "error":
                return "text-red-500"
            default:
                return ""
        }
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Runtime Logs
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px]">
                    <div className="space-y-2 font-mono text-sm">
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-3 rounded border border-border bg-muted/30 p-2">
                                <span className="text-muted-foreground whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={cn("font-semibold uppercase", getLogLevelColor(log.level as LogLevel))}>
                                    [{log.level}]
                                </span>
                                <span className="flex-1">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function DeploymentHistory({
    deployments,
    getStatusColor
}: {
    deployments: Deployment[]
    getStatusColor: (status: DeploymentStatus) => string
}) {
    const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null)

    const getStatusIcon = (status: ProjectStatus | DeploymentStatus) => {
        switch (status) {
            case "active":
            case "success":
                return <CheckCircle2 className="h-4 w-4" />
            case "failed":
                return <XCircle className="h-4 w-4" />
            case "stopped":
                return <Square className="h-4 w-4" />
            default:
                return null
        }
    }

    const calculateDuration = (deployment: Deployment) => {
        const created = new Date(deployment.createdAt)
        const updated = new Date(deployment.updatedAt)
        return Math.floor((updated.getTime() - created.getTime()) / 1000)
    }

    if (deployments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No deployment history available</p>
            </div>
        )
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
                                selectedDeployment === deployment._id ? "border bg-card" : "hover:bg-accent/50",
                            )}
                            onClick={() =>
                                setSelectedDeployment(selectedDeployment === deployment._id ? null : deployment._id)
                            }
                        >
                            <div className="relative">
                                <div
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full border-2",
                                        "border-green-500 bg-green-500/10"
                                    )}
                                >
                                    {getStatusIcon("success")}
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
                                    <Badge className={cn("border", getStatusColor("success"))}>
                                        success
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

                                {selectedDeployment === deployment._id && deployment.last_commit && (
                                    <div className="mt-4 rounded-md border bg-muted/50 p-4 space-y-2">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Deploy ID:</span>{" "}
                                            <code className="ml-2">{deployment._id}</code>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Full Timestamp:</span>{" "}
                                            <span className="ml-2">{new Date(deployment.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Commit:</span>{" "}
                                            <span className="ml-2">{deployment.last_commit.message}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Author:</span>{" "}
                                            <span className="ml-2">{deployment.last_commit.author.name} ({deployment.last_commit.author.email})</span>
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
    )
}



function DeploymentsAction({
    projectData,
    setShowDeleteDialog,
    setShowStopDialog,
    setShowEnvDialog,
    setDeployments,
    mustRedeploy,
    setMustRedeploy
}: {
    projectData: ProjectDetailsData
    setShowDeleteDialog: (show: boolean) => void
    setShowStopDialog: (show: boolean) => void
    setShowEnvDialog: (show: boolean) => void
    setDeployments: Dispatch<SetStateAction<Deployment[]>>
    newEnvKey: string
    setNewEnvKey: (key: string) => void
    mustRedeploy: boolean
    setMustRedeploy: (mustRedeploy: boolean) => void
}) {

    const [loading, setLoading] = useState(false)
    const handleRedeploy = async (projectId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`${BASE_URL}/deployment/${projectId}/redeploy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
            })
            const data = await response.json()
            console.log(data)
            if (data.success) {
                setDeployments((prevDeployments: Deployment[]) => [...prevDeployments, data.deployment])
                setMustRedeploy(false)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const handleStop = () => {
        setShowStopDialog(true)
    }

    const handleStart = () => {
        console.log("Starting project...")
    }

    const handleDelete = () => {
        setShowDeleteDialog(true)
    }
    const syncEnv = () => {

    }

    return (
        <header className="border-b border-border ">
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            <h1 className="text-2xl font-bold">{projectData.name}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={cn("border", getStatusColor(projectData.status))}>
                                {projectData.status.toLowerCase()}
                            </Badge>
                            <Badge variant="outline">{projectData.type.toLowerCase()}</Badge>
                        </div>
                    </div>

                    {projectData.status === "active" && (
                        <Badge className="bg-green-500 text-white border-green-500">
                            <Activity className="mr-1 h-3 w-3" />
                            Live
                        </Badge>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Port: {projectData.port}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        <span>Package: {projectData.package_manager}</span>
                    </div>
                    {projectData.production_url && (
                        <a
                            href={projectData.production_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-500 hover:underline"
                        >
                            <Globe className="h-4 w-4" />
                            Visit Site
                        </a>
                    )}
                </div>

                <div className="mt-4 flex gap-2">
                    {(projectData.status === "active" || projectData.status === "failed") && (
                        <Button disabled={loading || !mustRedeploy} onClick={() => handleRedeploy(projectData._id)} variant={mustRedeploy ? "default" : "outline"} size="sm">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}
                            Redeploy
                        </Button>
                    )}
                    {
                        (projectData.type !== "static" && projectData.type !== "react") && (
                            <>
                                {projectData.status === "active" && (
                                    <Button onClick={handleStop} variant="outline" size="sm">
                                        <Square className="mr-2 h-4 w-4" />
                                        Stop
                                    </Button>
                                )}
                                {projectData.status === "stopped" && (
                                    <Button onClick={handleStart} variant="outline" size="sm">
                                        <Play className="mr-2 h-4 w-4" />
                                        Start
                                    </Button>
                                )}
                            </>
                        )
                    }
                    <Button onClick={() => setShowEnvDialog(true)} variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Env
                    </Button>
                    <Button onClick={syncEnv} variant="outline" size="sm">
                        <FolderSync className="mr-2 h-4 w-4" />
                        Sync Env
                    </Button>
                    <Button onClick={handleDelete} variant="outline" size="sm" className="text-destructive bg-transparent">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>
        </header>
    )
}