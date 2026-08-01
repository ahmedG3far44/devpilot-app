import { useState, useEffect } from "react";
import Seo from "./Seo";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext";
import { useDeploy } from "@/context/deploy/DeployContext";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

import {
  Plus,
  Trash2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  LucideGitBranch,
  FileText,
  List,
  ExternalLink,
  Edit2,
  Save,
  Copy,
  Check,
} from "lucide-react";

import DeploymentLogs from "./DeploymentLogs";
import type {
  DeployBodyType,
  IEnvironment,
  PackageManager,
  ProjectData,
  ProjectFormData,
  ProjectType,
  ProjectTypeConfig,
} from "@/types";

const PACKAGE_MANAGERS: PackageManager[] = [
  {
    value: "npm",
    label: "npm",
    runCmd: "npm start",
    buildCmd: "npm run build",
    installCmd: "npm install",
  },
  {
    value: "yarn",
    label: "Yarn",
    runCmd: "yarn start",
    buildCmd: "yarn build",
    installCmd: "yarn install",
  },
  {
    value: "pnpm",
    label: "pnpm",
    runCmd: "pnpm start",
    buildCmd: "pnpm build",
    installCmd: "pnpm install",
  },
  {
    value: "bun",
    label: "Bun",
    runCmd: "bun start",
    buildCmd: "bun run build",
    installCmd: "bun install",
  },
];

const PACKAGE_MANAGER_IMAGES: Record<string, string> = {
  npm: "/images/npm.svg",
  pnpm: "/images/pnpm.svg",
  yarn: "/images/yarn.svg",
  bun: "/images/bun.svg",
};

const PROJECT_TYPES: ProjectTypeConfig[] = [
  {
    image: `/images/nextjs-dark.png`,
    value: "next",
    label: "Next JS",
    description: "React framework with SSR/SSG",
    requiresRunScript: true,
    requiresBuildScript: true,
    defaultRunScript: "npm start",
    defaultBuildScript: "npm run build",
  },
  {
    image: "/images/reactjs.png",
    value: "react",
    label: "React JS",
    description: "Client-side React application",
    requiresRunScript: false,
    requiresBuildScript: true,
    defaultRunScript: "n/a",
    defaultBuildScript: "npm run build",
  },
  {
    image: "/images/static.png",
    value: "static",
    label: "Static Site",
    description: "HTML/CSS/JS static files",
    requiresRunScript: false,
    requiresBuildScript: false,
    defaultRunScript: "n/a",
    defaultBuildScript: "n/a",
  },
  {
    image: "/images/expressjs.png",
    value: "express",
    label: "Express JS",
    description: "Node.js web framework",
    requiresRunScript: true,
    requiresBuildScript: true,
    defaultRunScript: "npm start",
    defaultBuildScript: "npm run build",
  },
  {
    image: "/images/nestjs.png",
    value: "nest",
    label: "Nest JS",
    description: "Progressive Node.js framework",
    requiresRunScript: true,
    requiresBuildScript: true,
    defaultRunScript: "npm run start:prod",
    defaultBuildScript: "npm run build",
  },
];

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

const DeploymentProjectForm = () => {
  const { repos } = useAuth();
  const { repoName } = useParams();
  const { handleDeploy, isDeploying, logs, deploymentResult, resetDeploy } =
    useDeploy();

  const [projects, setProjectsList] = useState<ProjectData[]>([]);
  const [envInputMode, setEnvInputMode] = useState<"individual" | "bulk">(
    "individual",
  );
  const [bulkEnvText, setBulkEnvText] = useState("");
  const [bulkEnvError, setBulkEnvError] = useState("");

  const getProjectsList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/project`, {
        credentials: "include",
      });
      const results = await response.json();
      setProjectsList(results?.data);
      return results.data;
    } catch (err) {
      console.log(
        (err as Error).name,
        (err as Error).message,
        (err as Error).stack,
      );
    }
  };

  const deployedBefore = projects.find(
    (project) =>
      project.name.toLowerCase().trim() ===
      repoName?.toLocaleLowerCase().trim(),
  );

  const deployedProject = repos?.find(
    (repo) =>
      repo.name.toLowerCase().trim() === repoName?.toLocaleLowerCase().trim(),
  );

  const getAvailablePortNumber = (deployedProjects: ProjectData[]) => {
    const totalProjects = deployedProjects.length;
    return 4000 + totalProjects + 1;
  };

  const initialFormData = (): ProjectFormData => ({
    name: deployedProject?.name ?? "",
    description: deployedProject?.description ?? "",
    clone_url: deployedProject?.clone_url ?? "",
    branch: deployedProject?.default_branch ?? "",
    port: getAvailablePortNumber(projects),
    typescript: false,
    type: "react",
    build_script: "npm run build",
    package_manager: "npm",
    run_script: "npm start",
    main_dir: "./",
    is_deployed: false,
    environments: [],
  });

  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [editConfig, setEditConfig] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    resetDeploy();
    setErrors({});
    setBulkEnvText("");
    setBulkEnvError("");
    setEnvInputMode("individual");
    setFormData(initialFormData());
    getProjectsList();
  }, [repoName]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentProjectType = PROJECT_TYPES.find(
    (pt) => pt.value === formData.type,
  )!;

  useEffect(() => {
    const pm = PACKAGE_MANAGERS.find(
      (p) => p.value === formData.package_manager,
    );
    if (!pm) return;

    const projectType = PROJECT_TYPES.find((pt) => pt.value === formData.type);
    if (!projectType) return;

    const runScript = projectType.requiresRunScript
      ? formData.type === "nest"
        ? `${formData.package_manager} run start:prod`
        : pm.runCmd
      : "npm start";

    const buildScript = projectType.requiresBuildScript
      ? pm.buildCmd
      : "npm run build";

    setFormData((prev) => ({
      ...prev,
      run_script: runScript,
      build_script: buildScript,
    }));
  }, [formData.package_manager, formData.type]);

  const handleInputChange = (
    field: keyof ProjectFormData,
    value: string | ProjectType | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const canAddEnvVar = () => {
    if (formData.environments.length === 0) return true;
    const lastEnvVar = formData.environments[formData.environments.length - 1];
    return lastEnvVar.key.trim() !== "" && lastEnvVar.value.trim() !== "";
  };

  const addEnvVar = () => {
    if (!canAddEnvVar()) return;

    const newEnvVar: IEnvironment = {
      id: Date.now().toString(),
      key: "",
      value: "",
      isVisible: false,
    };
    setFormData((prev) => ({
      ...prev,
      environments: [...prev.environments, newEnvVar],
    }));
  };

  const updateEnvVar = (
    id: string,
    field: keyof IEnvironment,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      environments: prev.environments.map((env) =>
        env.id === id ? { ...env, [field]: value } : env,
      ),
    }));
  };

  const removeEnvVar = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      environments: prev.environments.filter((env) => env.id !== id),
    }));
  };

  const toggleEnvVisibility = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      environments: prev.environments.map((env) =>
        env.id === id ? { ...env, isVisible: !env.isVisible } : env,
      ),
    }));
  };

  const validateEnvKey = (key: string): boolean => {
    return /^[A-Z_][A-Z0-9_]*$/i.test(key);
  };

  const parseBulkEnv = (text: string): IEnvironment[] => {
    const lines = text.split("\n");
    const parsedEnvs: IEnvironment[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      // Find the first = sign
      const equalIndex = trimmedLine.indexOf("=");

      if (equalIndex === -1) {
        errors.push(`Line ${index + 1}: Missing '=' separator`);
        return;
      }

      let key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();

      // Remove export keyword if present
      if (key.startsWith("export ")) {
        key = key.substring(7).trim();
      }

      // Handle quoted values
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.substring(1, value.length - 1);
      }

      if (!key) {
        errors.push(`Line ${index + 1}: Empty key`);
        return;
      }

      if (!validateEnvKey(key)) {
        errors.push(`Line ${index + 1}: Invalid key format "${key}"`);
        return;
      }

      parsedEnvs.push({
        id: `${Date.now()}-${index}`,
        key,
        value,
        isVisible: false,
      });
    });

    if (errors.length > 0) {
      setBulkEnvError(errors.join("\n"));
      return [];
    }

    setBulkEnvError("");
    return parsedEnvs;
  };

  const handleBulkEnvChange = (text: string) => {
    setBulkEnvText(text);
    setBulkEnvError("");
  };

  const applyBulkEnv = () => {
    const parsedEnvs = parseBulkEnv(bulkEnvText);

    if (parsedEnvs.length > 0) {
      setFormData((prev) => ({
        ...prev,
        environments: parsedEnvs,
      }));
      // Optionally switch back to individual view to show the parsed variables
      // setEnvInputMode("individual");
    }
  };

  const switchToIndividualMode = () => {
    // Convert current environments to bulk text for preservation
    const bulkText = formData.environments
      .map((env) => `${env.key}=${env.value}`)
      .join("\n");
    setBulkEnvText(bulkText);
    setEnvInputMode("individual");
  };

  const switchToBulkMode = () => {
    // Convert current environments to bulk text
    const bulkText = formData.environments
      .map((env) => `${env.key}=${env.value}`)
      .join("\n");
    setBulkEnvText(bulkText);
    setEnvInputMode("bulk");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentProjectType.requiresRunScript && !formData.run_script.trim()) {
      newErrors.run_script = "Run script is required for this project type";
    }

    if (
      currentProjectType.requiresBuildScript &&
      !formData.build_script.trim()
    ) {
      newErrors.build_script = "Build script is required for this project type";
    }

    if (!formData.main_dir.trim()) {
      newErrors.main_dir = "Main directory is required";
    }

    if (formData.main_dir && !/^\.\/[\w/-]*$|^\.\/$/.test(formData.main_dir)) {
      newErrors.main_dir =
        "Directory must start with ./ and contain valid characters";
    }

    formData.environments.forEach((env, index) => {
      if (env.key.trim() && !validateEnvKey(env.key)) {
        newErrors[`envKey_${index}`] =
          "Invalid key format. Use only letters, numbers, and underscores";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (envInputMode === "bulk" && bulkEnvText.trim()) {
      const parsedEnvs = parseBulkEnv(bulkEnvText);
      if (parsedEnvs.length === 0 && bulkEnvError) {
        return;
      }
      if (parsedEnvs.length > 0) {
        setFormData((prev) => ({
          ...prev,
          environments: parsedEnvs,
        }));
      }
    }

    if (!validateForm()) return;

    if (!deployedProject) {
      throw new Error("Repository not found.");
    }

    try {
      const deployPayload: DeployBodyType = {
        name: (formData.name || deployedProject?.name || "")
          .toLowerCase()
          .trim(),
        repo: (formData.clone_url || deployedProject?.clone_url || "")
          .toLowerCase()
          .trim(),
        type: formData.type.toLowerCase().trim(),
        branch: (formData.branch || deployedProject?.default_branch || "")
          .toLowerCase()
          .trim(),
        typescript: formData.typescript,
        run_script: formData.run_script.toLowerCase().trim(),
        build_script: formData.build_script.toLowerCase().trim(),
        port: getAvailablePortNumber(projects as ProjectData[]),
        main_dir: formData.main_dir.toLowerCase().trim(),
        package_manager: formData.package_manager.toLowerCase().trim(),
        environments: formData.environments,
      };

      console.log(deployPayload);

      await handleDeploy(deployPayload);
    } catch (error) {
      setErrors({
        submit:
          "Failed to deploy project. Please try again." +
          (error as Error).message,
      });
    }
  };

  if (!repoName) return <Navigate to={"/"} />;

  if (deployedBefore)
    return <Navigate to={`/deployments/${deployedBefore._id}`} />;

  // if (isSubmitted) return (<Navigate to={`/success`} />)

  // if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-12 px-3 sm:px-4 lg:px-6 ">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className=" rounded-xl ">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold  mb-2">
              Deploy New Project
            </h1>
            <p className="text-sm sm:text-base ">
              Configure your deployment settings
            </p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <span className="text-sm sm:text-base text-red-800 font-medium">
                {errors.submit}
              </span>
            </div>
          )}
          <div className="mb-6 p-4 rounded-lg border border-muted">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Info size={16} className="flex-shrink-0" />
                Repository
              </h2>
              {deployedProject?.html_url && (
                <a
                  href={deployedProject.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open repository in new tab"
                  title="Open repository in new tab"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="min-w-0">
                <label className="block text-xs text-muted-foreground mb-0.5">
                  Name
                </label>
                <p className="text-sm font-medium truncate">
                  {deployedProject?.name as string}
                </p>
              </div>
              <div className="min-w-0">
                <label className="block text-xs text-muted-foreground mb-0.5">
                  Branch
                </label>
                <p className="text-sm font-medium flex items-center gap-1">
                  <LucideGitBranch size={12} className="flex-shrink-0" />
                  <span className="truncate">
                    {deployedProject?.default_branch as string}
                  </span>
                </p>
              </div>
              <div className="min-w-0 sm:col-span-1">
                <label className="block text-xs text-muted-foreground mb-0.5">
                  Clone URL
                </label>
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-xs font-mono truncate text-muted-foreground">
                    {deployedProject?.clone_url as string}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const url = deployedProject?.clone_url;
                      if (!url) return;
                      try {
                        await navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        // clipboard unavailable
                      }
                    }}
                    aria-label="Copy clone URL"
                    title="Copy clone URL"
                    className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {copied ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
              {deployedProject?.description && (
                <div className="sm:col-span-3 min-w-0">
                  <label className="block text-xs text-muted-foreground mb-0.5">
                    Description
                  </label>
                  <p className="text-sm truncate">
                    {deployedProject?.description as string}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-muted">
            <div>
              <label className="block text-sm sm:text-base font-semibold  mb-3">
                Project Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {PROJECT_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    disabled={isDeploying}
                    onClick={() => handleInputChange("type", type.value)}
                    className={`p-3 h-[100px] sm:p-4 rounded-lg border-2 text-left transition-all flex items-center justify-center flex-col ${
                      formData.type === type.value
                        ? "border-blue-500 bg-card shadow-md text-primary duration-300 hover:bg-muted"
                        : " hover:bg-muted duration-300  hover:shadow-sm text-primary bg-card"
                    } ${isDeploying ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                  >
                    <div className="flex justify-center items-center gap-2 font-semibold text-sm sm:text-base ">
                      {type.value === "next" ? (
                        <ThemeImage size={20} />
                      ) : (
                        <img
                          src={type.image}
                          width={20}
                          height={20}
                          alt={type.value}
                        />
                      )}
                      <span>{type.label}</span>
                    </div>
                    <div className="text-xs sm:text-sm  mt-1 leading-snug">
                      {type.description}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4 self-end">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/images/typescript.png"
                  alt="TypeScript logo"
                  width={28}
                  height={28}
                  className="object-contain flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold leading-tight">
                    TypeScript
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
                    Enable if your project uses{" "}
                    <span className="font-mono">.ts</span> /{" "}
                    <span className="font-mono">.tsx</span> files. DevPilot will
                    build it with the TypeScript compiler.
                  </p>
                </div>
              </div>
              <Switch
                id="typescript"
                disabled={isDeploying}
                checked={formData.typescript}
                onCheckedChange={(checked) =>
                  handleInputChange("typescript", checked)
                }
                className={`flex-shrink-0 ${isDeploying ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                aria-label="Toggle TypeScript"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex-shrink-0 rounded-md p-1.5 transition-colors ${editConfig ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"}`}
                >
                  <Edit2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold leading-tight">
                    Edit Configuration
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
                    {editConfig
                      ? "You can modify the package manager, build and run scripts."
                      : "Locked — the package manager and scripts below are read-only."}
                  </p>
                </div>
              </div>
              <Button
                disabled={isDeploying}
                onClick={() => setEditConfig((prev) => !prev)}
                size="sm"
                variant={editConfig ? "default" : "outline"}
                className={`flex-shrink-0 gap-1.5 ${isDeploying ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {editConfig ? (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className=" col-span-1">
                {formData.type !== "static" && (
                  <div>
                    <label className="block text-sm sm:text-base font-semibold mb-2">
                      Package Manager <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.package_manager}
                      onValueChange={(value) =>
                        handleInputChange("package_manager", value)
                      }
                      disabled={isDeploying || !editConfig}
                    >
                      <SelectTrigger
                        className={`w-full h-11 px-3 sm:px-4 rounded-lg text-sm sm:text-base shadow-none transition ${
                          editConfig
                            ? "border-muted focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent cursor-pointer"
                            : "border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
                        } ${isDeploying ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <SelectValue placeholder="Select package manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGE_MANAGERS.map((pm) => (
                          <SelectItem
                            key={pm.value}
                            value={pm.value}
                            className="cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              {PACKAGE_MANAGER_IMAGES[pm.value] && (
                                <img
                                  src={PACKAGE_MANAGER_IMAGES[pm.value]}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="object-contain"
                                />
                              )}
                              {pm.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="col-span-1">
                {(currentProjectType.requiresBuildScript ||
                  formData.typescript) && (
                  <div className="sm:col-span-2 col-span-1">
                    <label className="block text-sm sm:text-base font-semibold mb-2">
                      Build Script <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.build_script}
                      readOnly={isDeploying || !editConfig}
                      onChange={(e) =>
                        handleInputChange("build_script", e.target.value)
                      }
                      className={`w-full h-11 px-3 sm:px-4 rounded-lg border text-sm sm:text-base transition ${
                        !editConfig
                          ? "border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
                          : errors.build_script
                            ? "border-red-300 bg-card"
                            : "border-muted"
                      } ${isDeploying ? "opacity-50" : ""} ${editConfig ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" : ""}`}
                      placeholder="npm run build"
                    />
                    {errors.build_script && (
                      <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        {errors.build_script}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-1">
                {currentProjectType.requiresRunScript && (
                  <div className="sm:col-span-2 col-span-1">
                    <label className="block text-sm sm:text-base font-semibold mb-2">
                      Run Script <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.run_script}
                      readOnly={isDeploying || !editConfig}
                      onChange={(e) =>
                        handleInputChange("run_script", e.target.value)
                      }
                      className={`w-full h-11 px-3 sm:px-4 rounded-lg border text-sm sm:text-base transition ${
                        !editConfig
                          ? "border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
                          : errors.run_script
                            ? "border-red-300 bg-card"
                            : "border-muted"
                      } ${isDeploying ? "opacity-50" : ""} ${editConfig ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" : ""}`}
                      placeholder="npm start"
                    />
                    {errors.runScript && (
                      <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        {errors.runScript}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold  mb-2">
                Main Directory <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.main_dir}
                readOnly={isDeploying}
                onChange={(e) => handleInputChange("main_dir", e.target.value)}
                className={`w-full px-3 sm:px-4 py-2.5 rounded-lg border text-sm sm:text-base ${
                  errors.main_dir ? "border-red-300 bg-card" : "border-muted"
                } ${isDeploying ? "opacity-50" : ""} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                placeholder="./"
              />
              <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-muted bg-muted/30 px-3 py-2.5">
                <Info
                  className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"
                  size={14}
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Path to the folder that holds your app's source code,
                    relative to the repo root. Use{" "}
                    <span className="font-mono font-semibold text-foreground">
                      ./
                    </span>{" "}
                    when your project sits at the root of the repository.
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Examples:
                    </span>
                    {["./", "./server", "./client", "./frontend", "./backend", "./app"].map(
                      (example) => (
                        <code
                          key={example}
                          className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] text-blue-600 dark:text-blue-400"
                        >
                          {example}
                        </code>
                      ),
                    )}
                  </div>
                </div>
              </div>
              {errors.main_dir && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {errors.main_dir}
                </p>
              )}
            </div>

            {/* Environment Variables */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <label className="block text-sm sm:text-base font-semibold ">
                  Environment Variables
                </label>
                <div className="flex gap-2">
                  <Button
                    disabled={isDeploying}
                    onClick={() =>
                      envInputMode === "individual"
                        ? switchToBulkMode()
                        : switchToIndividualMode()
                    }
                    variant={"outline"}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition border hover:opacity-65 duration-300 ${isDeploying ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {envInputMode === "individual" ? (
                      <>
                        <FileText size={16} />
                        Bulk Edit
                      </>
                    ) : (
                      <>
                        <List size={16} />
                        Individual Edit
                      </>
                    )}
                  </Button>
                  {envInputMode === "individual" && (
                    <Button
                      onClick={addEnvVar}
                      disabled={!canAddEnvVar() || isDeploying}
                      variant={"default"}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition ${
                        canAddEnvVar() && !isDeploying
                          ? " border hover:opacity-65 duration-300 cursor-pointer"
                          : "  border  cursor-not-allowed"
                      }`}
                      title={
                        !canAddEnvVar()
                          ? "Fill in the current environment variable before adding a new one"
                          : ""
                      }
                    >
                      <Plus size={16} />
                      Add Variable
                    </Button>
                  )}
                </div>
              </div>

              {envInputMode === "bulk" ? (
                <div className="space-y-3">
                  <div>
                    <textarea
                      value={bulkEnvText}
                      readOnly={isDeploying}
                      onChange={(e) => handleBulkEnvChange(e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2.5 rounded-lg border border-muted focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base font-mono min-h-[200px] ${isDeploying ? "opacity-50" : ""}`}
                      placeholder={`Paste your environment variables here:

API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/db
NODE_ENV=production
PORT=3000

# Comments are ignored
export NEXT_PUBLIC_API_URL="https://api.example.com"`}
                    />
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                      Paste your .env file content. Each line should be in
                      KEY=value format. Comments (#) and empty lines are
                      ignored.
                    </p>
                  </div>

                  {bulkEnvError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-600 whitespace-pre-line flex items-start gap-2">
                        <AlertCircle
                          size={14}
                          className="flex-shrink-0 mt-0.5"
                        />
                        <span>{bulkEnvError}</span>
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={applyBulkEnv}
                    disabled={isDeploying}
                    variant={"default"}
                    className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg transition border hover:opacity-65 duration-300 ${isDeploying ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Parse & Apply Variables
                  </Button>

                  {formData.environments.length > 0 && (
                    <div className="mt-4 p-3 bg-card border border-muted rounded-lg">
                      <p className="text-xs sm:text-sm font-medium mb-2">
                        Currently loaded: {formData.environments.length}{" "}
                        variable(s)
                      </p>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        {formData.environments.map((env) => (
                          <div key={env.id} className="font-mono">
                            {env.key}=***
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {formData.environments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg ">
                      <p className=" text-sm sm:text-base font-medium">
                        No environment variables added yet
                      </p>
                      <p className=" text-xs sm:text-sm mt-1">
                        Click "Add Variable" or "Bulk Edit" to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.environments.map((env, index) => (
                        <div key={env.id}>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={env.key}
                              readOnly={isDeploying}
                              onChange={(e) =>
                                updateEnvVar(env.id, "key", e.target.value)
                              }
                              className={`flex-1 px-3 sm:px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base font-mono border-muted ${isDeploying ? "opacity-50" : ""}`}
                              placeholder="KEY"
                            />
                            <div className="flex-1 relative">
                              <input
                                type={env.isVisible ? "text" : "password"}
                                value={env.value}
                                readOnly={isDeploying}
                                onChange={(e) =>
                                  updateEnvVar(env.id, "value", e.target.value)
                                }
                                className={`w-full px-3 sm:px-4 py-2.5 pr-10 rounded-lg border border-muted focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base font-mono ${isDeploying ? "opacity-50" : ""}`}
                                placeholder="value"
                              />
                              <Button
                                disabled={isDeploying}
                                onClick={() => toggleEnvVisibility(env.id)}
                                variant={"outline"}
                                className={`border border-muted absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition duration-300 ${isDeploying ? "opacity-50" : "hover:opacity-65"}`}
                                aria-label={
                                  env.isVisible ? "Hide value" : "Show value"
                                }
                              >
                                {env.isVisible ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() => removeEnvVar(env.id)}
                              disabled={isDeploying}
                              variant={"destructive"}
                              className={`text-sm ${isDeploying ? "opacity-50" : ""}`}
                              title="Remove variable"
                              aria-label="Remove environment variable"
                            >
                              <Trash2 size={18} className="mx-auto sm:mx-0" />
                            </Button>
                          </div>
                          {errors[`envKey_${index}`] && (
                            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle
                                size={12}
                                className="flex-shrink-0"
                              />
                              {errors[`envKey_${index}`]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.environments.length > 0 && !canAddEnvVar() && (
                    <p className="mt-2 text-xs sm:text-sm text-amber-600 flex items-center gap-1 bg-card my-2 p-3 rounded-lg border border-amber-200">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      Fill in both key and value to add another environment
                      variable
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isDeploying}
                className={`w-full py-3 text-primary border border-muted bg-card hover:bg-accent  transition shadow-sm  lg:text-xs text-base flex items-center justify-center gap-2 cursor-pointer duration-300  `}
              >
                {isDeploying ? <>Processing Deployment...</> : "Deploy Project"}
              </Button>
            </div>
          </div>
        </div>

        {(logs.length > 0 || isDeploying || deploymentResult) && (
          <DeploymentLogs
            logs={logs}
            isDeploying={isDeploying}
            projectName={deployedProject?.name as string}
            result={deploymentResult}
            onReset={resetDeploy}
          />
        )}
      </div>
    </div>
  );
};

export default DeploymentProjectForm;

export function ThemeImage({ size }: { size: number }) {
  return (
    <div className="relative">
      <Seo
        title="Deploy Project"
        description="Configure and deploy your project with DevPilot."
        noindex
      />
      {/* This image shows ONLY in Light mode */}
      <img
        src="/images/nextjs-dark.png"
        alt="Dark version"
        width={size}
        height={size}
        className="block dark:hidden"
      />

      {/* This image shows ONLY in Dark mode */}
      <img
        src="/images/nextjs-light.png"
        alt="Light version"
        width={size}
        height={size}
        className="hidden dark:block"
      />
    </div>
  );
}
