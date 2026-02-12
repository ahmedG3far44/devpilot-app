import LoginButton from "@/components/LoginButton";
import { useAuth } from "@/context/auth/AuthContext";
import { Github } from "lucide-react";
import { Navigate } from "react-router-dom";


const Login = () => {
  const { isAuthenticated, isAdmin } = useAuth()

  if(isAuthenticated){
    if(isAdmin){
      return <Navigate to="/dashboard" />
    }
    return <Navigate to="/user" />
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-lg shadow-lg p-8">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center justify-center gap-1 mb-8">
            <img src="/icon.svg" width={80} height={80} alt="DevPilot Logo" />
            <h1 className="text-2xl font-bold">
              <span>Dev</span>
              <span>Pilot</span>
            </h1>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in to continue to your account
            </p>
          </div>

          {/* GitHub Login Button */}
          <LoginButton className="w-full">
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </LoginButton>
        </div>
      </div >
    </div >
  );
};

export default Login;