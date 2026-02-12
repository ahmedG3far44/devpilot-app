import { useState, useMemo } from "react";
import { useAuth } from "@/context/auth/AuthContext";
import { RepoCard } from "../components/RepoCard";
import Spinner from "@/components/ui/spinner";
import ErrorMessage from "@/components/ui/error";

const ITEMS_PER_PAGE = 10;

const UserPage = () => {
  const { error, repos, loading } = useAuth();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [languageFilter, setLanguageFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // all, public, private
  const [forkFilter, setForkFilter] = useState("all"); // all, forks, source
  const [sortBy, setSortBy] = useState("updated"); // updated, name, stars, created

  // Extract unique languages from repos for filter dropdown
  const availableLanguages = useMemo(() => {
    if (!repos) return [];
    const languages = repos
      .map(repo => repo.language)
      .filter(Boolean)
      .filter((lang, index, self) => self.indexOf(lang) === index)
      .sort();
    return languages;
  }, [repos]);

  // Apply all filters and sorting
  const filteredAndSortedRepos = useMemo(() => {
    if (!repos) return [];

    let result = [...repos];

    // Search filter
    if (searchQuery) {
      result = result.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Language filter
    if (languageFilter !== "all") {
      result = result.filter(repo => repo.language === languageFilter);
    }

    // Visibility filter
    if (visibilityFilter !== "all") {
      result = result.filter(repo =>
        visibilityFilter === "public" ? !repo.private : repo.private
      );
    }

    // Fork filter
    if (forkFilter === "forks") {
      result = result.filter(repo => repo?.forks_count);
    } else if (forkFilter === "source") {
      result = result.filter(repo => repo?.forks_count === 0);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stars":
          return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        case "created":
          return new Date(b.created_at as Date).getTime() - new Date(a.created_at as Date).getTime();
        case "updated":
        default:
          return new Date(b.updated_at as Date).getTime() - new Date(a.updated_at as Date).getTime();
      }
    });

    return result;
  }, [repos, searchQuery, languageFilter, visibilityFilter, forkFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedRepos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRepos = filteredAndSortedRepos.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (callback: () => void) => {
    callback();
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setLanguageFilter("all");
    setVisibilityFilter("all");
    setForkFilter("all");
    setSortBy("updated");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || languageFilter !== "all" ||
    visibilityFilter !== "all" || forkFilter !== "all" || sortBy !== "updated";

  if (loading) return <Spinner size={"xl"} />;

  if (error)
    return (
      <ErrorMessage
        message={
          error ||
          "something went wrong please reload this page, or navigate to another page!!"
        }
      />
    );

  return (
    <>
      {/* Search Bar */}
      <div className="my-10">
        <input
          type="text"
          placeholder="Search repositories by name or description..."
          value={searchQuery}
          onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
          className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 border border-accent focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={languageFilter}
              onChange={(e) => handleFilterChange(() => setLanguageFilter(e.target.value))}
              className="w-full px-3 py-2 appearance-none bg-background rounded-lg border border-accent focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            >
              <option className="bg-background p-2 cursor-pointer" value="all">All Languages</option>
              {availableLanguages.map(lang => (
                <option className="bg-background p-2 cursor-pointer" key={lang} value={lang as string}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Visibility Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <select
              value={visibilityFilter}
              onChange={(e) => handleFilterChange(() => setVisibilityFilter(e.target.value))}
              className="w-full px-3 py-2 appearance-none bg-background rounded-lg border border-accent focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            >
              <option className="bg-background p-2 cursor-pointer" value="all">All Repos</option>
              <option className="bg-background p-2 cursor-pointer" value="public">Public</option>
              <option className="bg-background p-2 cursor-pointer" value="private">Private</option>
            </select>
          </div>

          {/* Fork Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={forkFilter}
              onChange={(e) => handleFilterChange(() => setForkFilter(e.target.value))}
              className="w-full px-3 py-2 appearance-none bg-background rounded-lg border border-accent focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            >
              <option className="bg-background p-2 cursor-pointer" value="all">All</option>
              <option className="bg-background p-2 cursor-pointer" value="source">Source Repos</option>
              <option className="bg-background p-2 cursor-pointer" value="forks">Forks</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(() => setSortBy(e.target.value))}
              className="w-full px-3 py-2 appearance-none bg-background rounded-lg border border-accent focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            >
              <option className="bg-background p-2 cursor-pointer" value="updated">Last Updated</option>
              <option className="bg-background p-2 cursor-pointer" value="created">Recently Created</option>
              <option className="bg-background p-2 cursor-pointer" value="name">Name</option>
              <option className="bg-background p-2 cursor-pointer" value="stars">Stars</option>
            </select>
          </div>
        </div>

        {/* Results count and clear filters */}
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Showing {currentRepos.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredAndSortedRepos.length)} of {filteredAndSortedRepos.length}{" "}
            {filteredAndSortedRepos.length === 1 ? "repository" : "repositories"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-violet-400 hover:text-violet-300 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Repository Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-[400px]">
        {currentRepos.length > 0 ? (
          currentRepos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              showDeployButton={true}
            />
          ))
        ) : (
          <div className="col-span-2 text-center py-8">
            {hasActiveFilters ? (
              <>
                <p className="text-lg mb-2">No repositories found</p>
                <p className="text-sm opacity-75">Try adjusting your filters</p>
              </>
            ) : (
              <p className="text-lg">No repositories available</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {/* Previous Button */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 cursor-pointer rounded-lg border border-accent disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            aria-label="Previous page"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              const showEllipsis =
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2);

              if (showEllipsis) {
                return <span key={page} className="px-2">...</span>;
              }

              if (!showPage) return null;

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${currentPage === page
                    ? "bg-violet-600 hover:bg-violet-800 text-white"
                    : "border border-accent hover:bg-accent"
                    }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-accent disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default UserPage;