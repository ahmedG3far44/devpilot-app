import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {

  const { setTheme, theme } = useTheme();

  const style = theme === "dark" ? "bg-transparent  hover:bg-accent/80 border border-accent/80 text-foreground hover:text-foreground" : "bg-transparent  hover:bg-accent/80 text-foreground border border-accent/80 hover:text-foreground"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn(style, className)} size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-card shadow p-1" align="center">
        <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
