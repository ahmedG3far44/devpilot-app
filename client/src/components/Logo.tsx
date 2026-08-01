import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "lg";
}

const Logo = ({ size = "lg" }: LogoProps) => {
  return (
    <Link
      to="/"
      aria-label="DevPilot — home"
      className="group inline-flex items-center justify-center gap-2.5 rounded-lg transition-opacity duration-300 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <img
        src="/icon.svg"
        alt="DevPilot Logo"
        className={cn(
          "h-10 w-10 rounded-full object-cover transition-all duration-300",
          size === "sm" ? "h-8 w-8" : "h-10 w-10",
        )}
      />

      <span
        className={cn(
          "flex items-baseline font-black tracking-tight",
          size === "sm" ? "text-xl" : "text-3xl",
        )}
      >
        <span className="text-muted-foreground">Dev</span>
        <span className="text-foreground">Pilot</span>
      </span>
    </Link>
  );
};

export default Logo;
