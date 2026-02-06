import type { RepoListProps } from "@/types";
import { RepoCard } from "./RepoCard";


export function RepoList({
  repositories,
  onDeploy,
  isLoading = false,
  emptyMessage = "No repositories found",
}: RepoListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {repositories.map((repo) => (
        <RepoCard key={repo.id} repo={repo} onDeploy={onDeploy} />
      ))}
    </div>
  );
}
