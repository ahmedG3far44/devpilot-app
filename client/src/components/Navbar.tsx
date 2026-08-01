import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext";

import Logo from "./Logo";

const Navbar = () => {
  const { user, isAuthenticated, loading } = useAuth();

  console.log("auth user from navbar", user);
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur bg-background/80 border-b border-border">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          <>
            {loading ? (
              <UserSkeleton themeStatus={false} />
            ) : (
              <>
                {isAuthenticated ? (
                  <Link
                    to="/user"
                    className="
    group
    flex items-center
    gap-3
    rounded-xl
    px-2 py-2
    transition-all
    duration-300
    hover:bg-accent/70
  "
                  >
                    <div className="relative">
                      <img
                        src={user?.avatar_url}
                        alt={user?.username}
                        loading="lazy"
                        className="
        h-10
        w-10
        rounded-full
        object-cover
        ring-2
        ring-background
        shadow-md
        transition-all
        duration-300
        group-hover:scale-105
      "
                      />

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                    </div>

                    <div className="hidden lg:block">
                      <p className="max-w-[140px] truncate text-sm font-semibold text-foreground">
                        @{user?.username}
                      </p>

                      <p className="text-xs text-muted-foreground">Developer</p>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

export function UserSkeleton({ themeStatus }: { themeStatus: boolean }) {
  return (
    <>
      {themeStatus ? (
        <div className="flex items-center gap-3 md:gap-6 bg-card/80 px-3 py-2 rounded-md">
          <div className="relative w-8 h-8 rounded-full overflow-hidden transition-all">
            <div className="w-full h-full bg-accent animate-pulse"></div>
          </div>
          <div className="hidden group-hover:text-accent-foreground font-semibold lg:block text-sm text-foreground transition-colors max-w-[120px] truncate">
            <div className="w-24 h-4 bg-accent animate-pulse"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 md:gap-6 bg-secondary/80 px-3 py-2 rounded-md">
          <div className="relative w-8 h-8 rounded-full overflow-hidden transition-all">
            <div className="w-full h-full bg-muted animate-pulse"></div>
          </div>
          <div className="hidden group-hover:text-foreground font-semibold lg:block text-sm text-muted-foreground transition-colors max-w-[120px] truncate">
            <div className="w-24 h-4 bg-muted animate-pulse"></div>
          </div>
        </div>
      )}
    </>
  );
}
