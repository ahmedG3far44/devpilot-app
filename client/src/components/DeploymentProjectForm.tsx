import React, { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext";
import { useDeploy } from "@/context/deploy/DeployContext";
import { Button } from "./ui/button";

import {
  Plus,
  Trash2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Loader2,
  LucideGitBranch,
} from "lucide-react";

import DeploymentLogs from "./DeploymentLogs";
import ErrorMessage from "./ui/error";
import type { DeployBodyType, IEnvironment, PackageManager, ProjectData, ProjectFormData, ProjectType, ProjectTypeConfig } from "@/types";

export const PACKAGE_MANAGERS: PackageManager[] = [
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

export const PROJECT_TYPES: ProjectTypeConfig[] = [
  {
    image: "/images/nextjs.png",
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
    requiresBuildScript: false,
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

const DeploymentProjectForm: React.FC = () => {

  // const navigate = useNavigate();
  const { repos } = useAuth();
  const { repoName } = useParams();

  const { handleDeploy, isDeploying, logs, error } = useDeploy();

  const [projects, setProjectsList] = useState<ProjectData[]>([]);

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
        (err as Error).stack
      );
    }
  };

  useEffect(() => {
    getProjectsList();
  }, []);

  const numberOfServerProjects = projects.filter(
    (project) =>
      project.type === "express" ||
      project.type === "next" ||
      project.type === "nest"
  );

  const deployedProject = repos?.find(
    (repo) =>
      repo.name.toLowerCase().trim() === repoName?.toLocaleLowerCase().trim()
  );

  if (!deployedProject) return <Navigate to={"/"} />;

  if (error) return <ErrorMessage message={error} />;

  const [formData, setFormData] = useState<ProjectFormData>({
    name: deployedProject.name,
    description: deployedProject.description as string,
    clone_url: deployedProject.clone_url,
    branch: deployedProject.default_branch as string,
    port: 3000,
    typescript: false,
    type: "react",
    build_script: "npm run build",
    package_manager: "npm",
    run_script: "npm start",
    main_dir: "./",
    is_deployed: false,
    environments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentProjectType = PROJECT_TYPES.find(
    (pt) => pt.value === formData.type
  )!;

  useEffect(() => {
    const pm = PACKAGE_MANAGERS.find(
      (p) => p.value === formData.package_manager
    );
    if (!pm) return;

    const projectType = PROJECT_TYPES.find(
      (pt) => pt.value === formData.type
    );
    if (!projectType) return;

    const runScript = projectType.requiresRunScript
      ? formData.type === "nest"
        ? `${formData.package_manager} run start:prod`
        : pm.runCmd
      : "npm start";

    const buildScript = projectType.requiresBuildScript ? pm.buildCmd : "npm run build";

    setFormData((prev) => ({
      ...prev,
      run_script: runScript,
      build_script: buildScript,
    }));
  }, [formData.package_manager, formData.type]);

  const handleInputChange = (
    field: keyof ProjectFormData,
    value: string | ProjectType | boolean
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
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      environments: prev.environments.map((env) =>
        env.id === id ? { ...env, [field]: value } : env
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
        env.id === id ? { ...env, isVisible: !env.isVisible } : env
      ),
    }));
  };

  const validateEnvKey = (key: string): boolean => {
    return /^[A-Z_][A-Z0-9_]*$/i.test(key);
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

    if (
      formData.main_dir &&
      !/^\.\/[\w\-\/]*$|^\.\/$/.test(formData.main_dir)
    ) {
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
    if (!validateForm()) return;
    try {
      const port = 4000 + numberOfServerProjects.length + 1;
      const deployPayload: DeployBodyType = {
        name: deployedProject?.name.toLowerCase().trim(),
        repo: deployedProject?.clone_url.toLowerCase().trim(),
        type: formData.type.toLowerCase().trim(),
        branch: formData.branch.toLowerCase().trim(),
        typescript: formData.typescript,
        run_script: formData.run_script.toLowerCase().trim(),
        build_script: formData.build_script.toLowerCase().trim(),
        port:
          formData?.type === "express" ||
            formData?.type === "nest" ||
            formData?.type === "next"
            ? port
            : 4000,
        main_dir: formData.main_dir.toLowerCase().trim(),
        package_manager: formData.package_manager.toLowerCase().trim(),
        environments: formData.environments,
      };

      await handleDeploy(deployPayload).then(() => {
        setIsSubmitted(true);
      }).catch(() => {
        setIsSubmitted(false);
      });

      // if (isSubmitted) {
      //   return navigate(`/deployments/${deployedProject.id}`);
      // }
    } catch (error) {
      console.error("Deployment error:", error);
      setErrors({ submit: "Failed to deploy project. Please try again." });
    }
  };

  if (isDeploying)
    return (
      <DeploymentLogs
        logs={logs}
        isDeploying={isDeploying}
        projectName={deployedProject.name}
      />
    );


  if (isSubmitted) return (<Navigate to={`/success`} />)

  if (error) return <ErrorMessage message={error} />


  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-12 px-3 sm:px-4 lg:px-6">
      <div className="max-w-5xl mx-auto">
        <div className=" rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
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
          <div className="mb-6  p-4 sm:p-5 rounded-lg border border-muted text-primary ">
            <h2 className="text-base sm:text-lg font-semibold  mb-4 flex items-center gap-2">
              <Info size={18} className="flex-shrink-0" />
              Repository Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium  mb-1">
                  Project Name
                </label>
                <p className="text-sm sm:text-base  font-medium break-words">
                  {deployedProject.name}
                </p>
              </div>
              <div>
                <label htmlFor="branch" className="block text-xs sm:text-sm font-medium  mb-1">
                  Default Branch
                </label>
                <span className="text-xs sm:text-sm  font-medium break-words flex items-center gap-2">
                  <LucideGitBranch size={12} />  {deployedProject.default_branch}
                </span>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium  mb-1">
                  Clone URL
                </label>
                <p className="text-xs sm:text-sm  font-mono break-all">
                  {deployedProject.clone_url}
                </p>
              </div>
              {deployedProject.description && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium  mb-1">
                    Description
                  </label>
                  <p className="text-sm sm:text-base  break-words">
                    {deployedProject.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold  mb-3">
                Project Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {PROJECT_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    onClick={() => handleInputChange("type", type.value)}
                    className={`p-3 h-[100px] sm:p-4 rounded-lg border-2 text-left transition-all flex items-center justify-center flex-col ${formData.type === type.value
                      ? "border-blue-500 bg-card shadow-md text-primary duration-300 hover:bg-muted cursor-pointer"
                      : " hover:bg-muted cursor-pointer duration-300  hover:shadow-sm text-primary bg-card"
                      }`}
                  >
                    <div className="flex justify-center items-center gap-2 font-semibold text-sm sm:text-base ">
                      <img
                        src={type.image}
                        width={20}
                        height={20}
                        alt={type.value}
                      />
                      <span>{type.label}</span>
                    </div>
                    <div className="text-xs sm:text-sm  mt-1 leading-snug">
                      {type.description}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            {formData.type !== "static" && (
              <>
                <div>
                  <label className="block text-sm sm:text-base font-semibold  mb-2">
                    Package Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.package_manager}
                    onChange={(e) =>
                      handleInputChange("package_manager", e.target.value)
                    }
                    className="w-full px-3 sm:px-4 py-2 appearance-none rounded-lg bg-card border border-muted hover:bg-card transition  text-sm sm:text-base cursor-pointer"
                  >
                    {PACKAGE_MANAGERS.map((pm) => (
                      <option
                        className="cursor-pointer hover:bg-card border border-muted p-2 duration-300"
                        key={pm.value}
                        value={pm.value}
                      >
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border ">
                  <input
                    type="checkbox"
                    id="typescript"
                    checked={formData.typescript}
                    onChange={(e) =>
                      handleInputChange("typescript", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor="typescript"
                    className="text-sm sm:text-base font-medium text-muted-foreground  cursor-pointer select-none"
                  >
                    This project uses TypeScript
                  </label>
                </div>
              </>
            )}

            {(currentProjectType.requiresBuildScript || formData.typescript) && (
              <div>
                <label className="block text-sm sm:text-base font-semibold  mb-2">
                  Build Script <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.build_script}
                  onChange={(e) =>
                    handleInputChange("build_script", e.target.value)
                  }
                  className={`w-full px-3 sm:px-4 py-2.5 rounded-lg border text-sm sm:text-base ${errors.build_script
                    ? "border-red-300 bg-card"
                    : "border-muted"
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
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


            {currentProjectType.requiresRunScript && (
              <div>
                <label className="block text-sm sm:text-base font-semibold  mb-2">
                  Run Script <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.run_script}
                  onChange={(e) =>
                    handleInputChange("run_script", e.target.value)
                  }
                  className={`w-full px-3 sm:px-4 py-2.5 rounded-lg border text-sm sm:text-base ${errors.run_script ? "border-red-300 bg-card" : "border-muted"
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
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

            <div>
              <label className="block text-sm sm:text-base font-semibold  mb-2">
                Main Directory <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.main_dir}
                onChange={(e) =>
                  handleInputChange("main_dir", e.target.value)
                }
                className={`w-full px-3 sm:px-4 py-2.5 rounded-lg border text-sm sm:text-base ${errors.main_dir
                  ? "border-red-300 bg-card"
                  : "border-muted"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                placeholder="./"
              />
              <p className="mt-1.5 text-xs sm:text-sm ">
                Root directory of your project example ( <span className="font-semibold text-blue-500 mx-1">./</span>  <span className="font-semibold text-blue-500 mx-1">./server</span>  <span className="font-semibold text-blue-500 mx-1">./client</span>  <span className="font-semibold text-blue-500 mx-1">./frontend</span>  <span className="font-semibold text-blue-500 mx-1">./backend</span>  <span className="font-semibold text-blue-500 mx-1">./app</span>  etc...)
              </p>
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
                <Button
                  onClick={addEnvVar}
                  disabled={!canAddEnvVar()}
                  variant={"default"}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition ${canAddEnvVar()
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
              </div>

              {formData.environments.length === 0 ? (
                <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg ">
                  <p className=" text-sm sm:text-base font-medium">
                    No environment variables added yet
                  </p>
                  <p className=" text-xs sm:text-sm mt-1">
                    Click "Add Variable" to get started
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
                          onChange={(e) =>
                            updateEnvVar(env.id, "key", e.target.value)
                          }
                          className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg border  focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base font-mono border-muted"
                          placeholder="KEY"
                        />
                        <div className="flex-1 relative">
                          <input
                            type={env.isVisible ? "text" : "password"}
                            value={env.value}
                            onChange={(e) =>
                              updateEnvVar(env.id, "value", e.target.value)
                            }
                            className="w-full px-3 sm:px-4 py-2.5 pr-10 rounded-lg border  border-muted focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base font-mono"
                            placeholder="value"
                          />
                          <Button
                            onClick={() => toggleEnvVisibility(env.id)}
                            variant={"outline"}
                            className="border border-muted absolute right-2 top-1/2 -translate-y-1/2 p-1.5  hover:opacity-65 transition duration-300 "
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
                          variant={"destructive"}
                          className="text-sm"
                          title="Remove variable"
                          aria-label="Remove environment variable"
                        >
                          <Trash2 size={18} className="mx-auto sm:mx-0" />
                        </Button>
                      </div>
                      {errors[`envKey_${index}`] && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} className="flex-shrink-0" />
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
                  Fill in both key and value to add another environment variable
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isDeploying}
                className={`w-full py-3 text-primary border border-muted bg-card hover:bg-accent  transition shadow-sm  lg:text-xs text-base flex items-center justify-center gap-2 cursor-pointer duration-300  `}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    Deploying...
                  </>
                ) : (
                  "Deploy Project"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentProjectForm;