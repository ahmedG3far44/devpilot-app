import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = lazy(() => import("./pages/home"));
const UserPage = lazy(() => import("./pages/user"));
const Success = lazy(() => import("./pages/success"));
const NotFoundPage = lazy(() => import("./pages/error"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const ProjectsPage = lazy(() => import("./pages/projects"));
const DeploymentDetails = lazy(() => import("./pages/deployments-details"));
const DeploymentProjectForm = lazy(
  () => import("./components/DeploymentProjectForm"),
);
const Login = lazy(() => import("./pages/login"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Analytics />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route index path="/" element={<HomePage />} />
          <Route index path="/login" element={<Login />} />

          {/* Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />

          {/* User Protected Routes */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route path="user" element={<UserPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route
              path="deploy/:repoName"
              element={<DeploymentProjectForm />}
            />
            <Route
              path="deployments/:projectId"
              element={<DeploymentDetails />}
            />
            <Route path="success" element={<Success />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="dashboard" element={<Dashboard />}>
            <Route path="insights" element={<h1>Admin Insights Page </h1>} />
            <Route path="users" element={<h1>Manage Users Page </h1>} />
            <Route path="settings" element={<h1>Settings Page </h1>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
