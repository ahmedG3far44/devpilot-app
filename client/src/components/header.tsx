import { cn } from "@/lib/utils";
import { UserSkeleton } from "./Navbar";
import { ModeToggle } from "./mode-toggle";
import { Link, useLocation } from "react-router-dom";
import { FolderOpenDot, GitBranch } from "lucide-react";

import { useAuth } from "@/context/auth/AuthContext";

import Logo from "./Logo";
import LogoutButton from "./LogoutButton";
import LoginButton from "./LoginButton";

export const Header = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

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

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur border-border py-4 shadow-sm ">
      <Logo />
      {isAuthenticated && (
        <nav className="hidden md:flex items-center">
          <ul className="flex items-center gap-1">
            {navigations.map((link) => {
              const isActive = isActivePath(link.path);
              return (
                <li key={link.id}>
                  <Link
                    to={link.path}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-primary bg-accent/30 hover:bg-accent/40 "
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/10",
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
      <div className="flex items-center gap-4">
        {loading ? (
          <UserSkeleton themeStatus={false} />
        ) : isAuthenticated ? (
          <>
            <ModeToggle />
            <User
              picture={user?.avatar_url || ""}
              name={user?.username || ""}
            />
            <LogoutButton />
          </>
        ) : (
          <LoginButton>Login</LoginButton>
        )}
      </div>
    </header>
  );
};

export const User = ({ picture, name }: { picture: string; name: string }) => {
  return (
    <Link
      to="/user"
      className="
        group
        flex
        items-center
        gap-3
        rounded-full
        border
        border-border/60
        bg-card/50
        px-2
        py-1.5
        transition-all
        duration-300
        hover:border-primary/30
        hover:bg-accent
        hover:shadow-md
    "
    >
      <img
        src={picture}
        alt={name}
        className="
            h-9
            w-9
            rounded-full
            object-cover
            ring-2
            ring-background
            transition-transform
            duration-300
            group-hover:scale-105
        "
      />

      <div className="hidden lg:block">
        <p className="max-w-[140px] truncate text-sm font-semibold">@{name}</p>

        <p className="text-xs text-muted-foreground">View profile</p>
      </div>
    </Link>
  );
};
