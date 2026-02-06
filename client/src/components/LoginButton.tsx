import type { ReactNode } from "react";
import { Button } from "./ui/button";

const BASE_URL = import.meta.env.VITE_BASE_URL as string;
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string;

const LoginButton = ({
  children,
  className,
  variant,
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
}) => {
  const redirectUri = `${BASE_URL}/auth/github/callback`;
  return (
    <Button
      variant={variant ? variant : "outline"}
      className={`${className} text-sm hover:bg-accent/80 duration-300 rounded-md shadow-sm text-center`}
      onClick={() =>
        window.location.assign(
          `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}`
        )
      }
    >
      {children}
    </Button>
  );
};

export default LoginButton;
