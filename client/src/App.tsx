import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/home";
import UserPage from "./pages/user";
import Success from "./pages/success";
import NotFoundPage from "./pages/error";
import Dashboard from "./pages/dashboard";
import ProjectsPage from "./pages/projects";
import ProtectedRoute from "./components/ProtectedRoute";
import DeploymentDetails from "./pages/deployments-details";
import DeploymentProjectForm from "./components/DeploymentProjectForm";
import Login from "./pages/login";


const App = () => {
  return (
    <BrowserRouter>
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
          <Route path="deploy/:repoName" element={<DeploymentProjectForm />} />
          <Route path="deployments/:projectId" element={<DeploymentDetails />} />
          <Route path="success" element={<Success />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route path="dashboard" element={<Dashboard />}>
          <Route path="insights" element={<h1>Admin Insights Page </h1>} />
          <Route path="users" element={<h1>Manage Users Page </h1>} />
          <Route path="settings" element={<h1>Settings Page </h1>} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default App;
