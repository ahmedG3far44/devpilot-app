import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { Link, useLocation } from "react-router-dom";
import { FolderOpenDot, GitBranch } from "lucide-react";

import { useAuth } from "@/context/auth/AuthContext";

import Logo from "./Logo";
import LogoutButton from "./LogoutButton";
import LoginButton from "./LoginButton";

const navigations = [
  {
    id: "1",
    path: "/user",
    name: "Repos",
    icon: <GitBranch size={18} />,
  },
  {
    id: "2",
    path: "/projects",
    name: "Projects",
    icon: <FolderOpenDot size={18} />,
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type HeaderVariant = "public" | "app";

interface HeaderProps {
  variant?: HeaderVariant;
}

const Header = ({ variant = "app" }: HeaderProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isPublic = variant === "public";
  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur transition-[box-shadow,background-color,border-color] duration-300",
        isPublic
          ? "border-border"
          : scrolled
            ? "border-border shadow-sm shadow-foreground/5"
            : "border-border/60",
        "px-6",
      )}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo size="sm" />

          {isAuthenticated && !isPublic && (
            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {navigations.map((link) => {
                  const isActive = isActivePath(link.path);
                  return (
                    <li key={link.id}>
                      <Link
                        to={link.path}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                          focusRing,
                          isActive
                            ? "bg-accent/50 text-foreground"
                            : "text-muted-foreground hover:bg-accent/15 hover:text-foreground",
                        )}
                      >
                        <span className="shrink-0">{link.icon}</span>
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            {loading ? (
              <UserSkeleton themeStatus={isPublic} />
            ) : isAuthenticated ? (
              isPublic ? (
                <Link
                  to="/user"
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-300 hover:bg-accent/70",
                    focusRing,
                  )}
                >
                  <div className="relative">
                    <img
                      src={user?.avatar_url}
                      alt={user?.username}
                      loading="lazy"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-background shadow-md transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="max-w-[140px] truncate text-sm font-semibold text-foreground">
                      @{user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">Developer</p>
                  </div>
                </Link>
              ) : (
                <>
                  <ModeToggle />
                  <User
                    picture={user?.avatar_url || ""}
                    name={user?.username || ""}
                  />
                  <LogoutButton />
                </>
              )
            ) : isPublic ? (
              <Link
                to="/login"
                className={cn(
                  "bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-sm transition-colors hover:bg-primary/90",
                  focusRing,
                )}
              >
                Login
              </Link>
            ) : (
              <LoginButton>Login</LoginButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const User = ({ picture, name }: { picture: string; name: string }) => {
  return (
    <Link
      to="/user"
      className={cn(
        "group flex items-center gap-3 rounded-full border border-border/60 bg-card/50 px-2 py-1.5 transition-all duration-300 hover:border-primary/30 hover:bg-accent hover:shadow-md",
        focusRing,
      )}
    >
      <img
        src={picture}
        alt={name}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-background transition-transform duration-300 group-hover:scale-105"
      />

      <div className="hidden lg:block">
        <p className="max-w-[140px] truncate text-sm font-semibold">@{name}</p>

        <p className="text-xs text-muted-foreground">View profile</p>
      </div>
    </Link>
  );
};

export function UserSkeleton({ themeStatus }: { themeStatus: boolean }) {
  return (
    <>
      {themeStatus ? (
        <div className="flex items-center gap-3 rounded-xl bg-card/80 px-3 py-2">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <div className="h-full w-full animate-pulse bg-accent"></div>
          </div>
          <div className="hidden w-24 lg:block">
            <div className="h-4 animate-pulse rounded bg-accent"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/80 px-3 py-2">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <div className="h-full w-full animate-pulse bg-muted"></div>
          </div>
          <div className="hidden w-24 lg:block">
            <div className="h-4 animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
