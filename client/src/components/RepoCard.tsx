import type { RepositoryCardData } from "@/types/repository";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  GitFork,
  Star,
  Code2,
  Scale,
  HardDrive,
  ExternalLink,
  GitBranch,
  Lock,
  HardDriveUpload,
  ClipboardCheck,
  Copy,
} from "lucide-react";
import { useState } from "react";
import { useProject } from "@/context/projects/ProjectsContext";
import type { ProjectData } from "./ProjectMonitor";


interface RepoCardProps {
  repo: RepositoryCardData;
  onDeploy?: (repo: RepositoryCardData) => void;
  showDeployButton?: boolean;
}

export function RepoCard({ repo }: RepoCardProps) {
  const navigate = useNavigate();
  const { projects } = useProject();

  const [copied, setCopied] = useState<boolean>(false);
  const [isDeployed] = useState<ProjectData | undefined>(projects.find((project) => project.name.toLocaleLowerCase().trim() === repo.name?.toLocaleLowerCase().trim()));



  const formatSize = (sizeInKB: number): string => {
    if (sizeInKB < 1024) return `${sizeInKB} KB`;
    if (sizeInKB < 1024 * 1024) return `${(sizeInKB / 1024).toFixed(2)} MB`;
    return `${(sizeInKB / (1024 * 1024)).toFixed(2)} GB`;
  };

  const handleCopyRepoUrl = () => {
    navigator.clipboard.writeText(repo.clone_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border border-secondary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">{repo.name}</CardTitle>
              {repo.private && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
            </div>
            {repo.full_name && (
              <CardDescription className="text-sm text-muted-foreground">
                {repo.full_name}
              </CardDescription>
            )}
          </div>
          {repo.html_url && (
            <Button variant="ghost" size="icon" asChild>
              <Link
                to={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {repo.description || "No description provided"}
        </p>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 p-2 rounded-md bg-accent/20  border border-muted w-fit">
            <GitBranch className="w-3 h-3 text-muted-foreground" />
            <code className="text-xs flex-1 truncate">{repo.default_branch}</code>
          </div>

          {repo.language && (
            <div className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              <span>{repo.language}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4" />
            <span>{formatSize(repo.size)}</span>
          </div>

          {repo.license && (
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              <span>{repo.license.name}</span>
            </div>
          )}

          {repo.stargazers_count !== undefined && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              <span>{repo.stargazers_count}</span>
            </div>
          )}

          {repo.forks_count !== undefined && (
            <div className="flex items-center gap-1.5">
              <GitFork className="w-4 h-4" />
              <span>{repo.forks_count}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-2 bg-accent/90 hover:text-foreground rounded-md">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          <code className="text-xs flex-1 truncate">{repo.clone_url}</code>
          <Button onClick={handleCopyRepoUrl} variant="ghost">
            {copied ? <ClipboardCheck size={15} /> : <Copy size={15} />}
          </Button>
        </div>

        <>
          {
            isDeployed ? (
              <Button onClick={() => navigate(`/deployments/${isDeployed._id}`)} variant={"outline"} className="w-full py-2 px-4 rounedd-md border border-muted cursor-pointer hover:opacity-65 duration-300 flex items-center gap-2 justify-center"><HardDrive size={25} /> Manage Deployment</Button>
            ) : (
              <Button
                variant={"outline"}
                onClick={() =>
                  navigate(`/deploy/${repo.name?.toLocaleLowerCase().trim()}`)
                }
                className="w-full py-2 px-4 rounedd-md border border-muted cursor-pointer hover:opacity-65 duration-300 flex items-center gap-2 justify-center"
              >
                <span className="flex items-center gap-2"><HardDriveUpload size={25} /> Deploy Repo</span>        </Button>
            )
          }
        </>
      </CardContent>
    </Card>
  );
}
