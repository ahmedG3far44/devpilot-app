import { useAuth } from "@/context/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { LucideLogOut } from "lucide-react";
import { cn } from "@/lib/utils";

import type { LogoutButtonProps } from "@/types";

const LogoutButton = ({ className }: LogoutButtonProps) => {
  const { logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout()
      .then(() => {
        return navigate("/");
      })
      .catch((error) => {
        console.log(error);
      });
  };
  return (
    <Button
      disabled={loading}
      onClick={handleLogout}
      className={cn(className, "cursor-pointer hover:opacity-70 duration-300")}    >
      <span>
        <LucideLogOut size={15} />{" "}
      </span>
      {loading ? "logging out..." : "logout"}
    </Button>
  );
};

export default LogoutButton;
