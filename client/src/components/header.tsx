import { ModeToggle } from "./mode-toggle";
import { Link, useLocation } from "react-router-dom";
import { FolderOpenDot, GitBranch } from "lucide-react";

import { useAuth } from "@/context/auth/AuthContext";
import { UserSkeleton } from "./Navbar";

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
    }
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          <Logo />




          {loading ? (
            <UserSkeleton themeStatus={true} />
          ) : (
            <>
              {
                isAuthenticated ? (
                  <div className="flex items-center gap-3 md:gap-6">

                    <nav className="hidden md:flex items-center">
                      <ul className="flex items-center gap-1">
                        {navigations.map((link) => {
                          const isActive = isActivePath(link.path);
                          return (
                            <li key={link.id}>
                              <Link
                                to={link.path}
                                className={`flex items-center gap-2 px-3 py-2  rounded-md text-sm font-medium transition-colors
                              ${isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                                  }`}
                              >
                                <span className="shrink-0">{link.icon}</span>
                                <span>{link.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </nav>


                    <User
                      picture={user?.avatar_url as string}
                      name={user?.username as string}
                    />

                    <div className="hidden md:flex items-center gap-2">
                      <ModeToggle />
                      <LogoutButton className="bg-transparent border text-primary border-accent/70 hover:bg-accent/80 hover:text-foreground" />
                    </div>
                  </div>
                ) : (
                  <LoginButton>Login with GitHub</LoginButton>
                )
              }
            </>
          )}

        </div>
      </div>
    </header>
  );
};

export const User = ({ picture, name }: { picture: string; name: string }) => {
  return (
    <Link
      to="/user"
      className="flex items-center backdrop-blur-sm gap-2 px-2 py-1.5 rounded-md hover:bg-accent/20 transition-colors group"
    >
      <div className="relative w-8 h-8 rounded-full flex row-reverse overflow-hidden transition-all">
        <img
          className="w-full h-full object-cover"
          src={picture}
          alt={name}
          loading="lazy"
        />
      </div>
      <h4 className="hidden lg:block text-xs font-medium text-foreground transition-colors max-w-[120px] truncate">
        @{name}
      </h4>
    </Link>
  );
};
