import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext";

import Header from "./Header";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to={"/"} />;

  return (
    <div className="min-h-screen scroll-smooth overflow-x-clip mx-auto">
      <Header />
      <div className="w-full px-6">
        <div className="mx-auto max-w-7xl min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
