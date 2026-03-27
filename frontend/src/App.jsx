import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import MinimalLayout from "./layouts/MinimalLayout";
import OrgLayout from "./layouts/OrgLayout";

// Auth Pages
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";

// Org Pages
import CreateOrgPage from "./pages/orgs/CreateOrgPage";
import OrgDashboardPage from "./pages/orgs/OrgDashboardPage";
import OrgMembersPage from "./pages/orgs/OrgMembersPage";

import RequireAuth from "./components/RequireAuth";
import HomeRedirect from "./components/HomeRedirect";

// Layout Placeholders
const AppLayout = () => <div>AppLayout <Outlet /></div>;

// Auth Pages Placeholders
const VerifyOtpPage = () => <div>VerifyOtpPage</div>;
const ForgotPasswordPage = () => <div>ForgotPasswordPage</div>;
const ResetPasswordPage = () => <div>ResetPasswordPage</div>;
import AcceptInvitePage from "./pages/orgs/AcceptInvitePage";

// Projects
import ProjectLayout from "./layouts/ProjectLayout";
import ProjectBoardPage from "./pages/projects/ProjectBoardPage";
import CoWorkxLanding from "./pages/Landing.jsx";

// App Pages Placeholders
const ProfilePage = () => <div>ProfilePage</div>;

// Org Pages Placeholders
const OrgRolesPage = () => <div>OrgRolesPage</div>;
const OrgInvitationsPage = () => <div>OrgInvitationsPage</div>;
const OrgSettingsPage = () => <div>OrgSettingsPage</div>;
const ProjectsListPage = () => <div>ProjectsListPage</div>;

// Project Pages Placeholders
const ProjectMembersPage = () => <div>ProjectMembersPage</div>;
const ProjectSettingsPage = () => <div>ProjectSettingsPage</div>;

function App() {
  return (
    <Routes>
      {/* Public — redirect to /:orgSlug if already logged in */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Semi-public — needs auth to accept */}
      <Route path="/invitations/:token" element={<AcceptInvitePage />} />

      {/* Root path, handles both unauthenticated (redirect to login) and authenticated routing */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/landing" element={<CoWorkxLanding />} />
      {/* Protected routes — wraps all authenticated pages */}
      <Route element={<RequireAuth />}>
        
        {/* Minimal layout for onboarding/settings before org context exists */}
        <Route element={<MinimalLayout />}>
          <Route path="/orgs/new" element={<CreateOrgPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        
        {/* Org shell — loads org context, org sidebar */}
        <Route path="/:orgSlug" element={<OrgLayout />}>
          <Route index element={<OrgDashboardPage />} />
          <Route path="members" element={<OrgMembersPage />} />
          <Route path="roles" element={<OrgRolesPage />} />
          <Route path="invitations" element={<OrgInvitationsPage />} />
          <Route path="settings" element={<OrgSettingsPage />} />
          <Route path="projects" element={<ProjectsListPage />} />

          {/* Project shell — loads project context, project subnav */}
          <Route path="projects/:projectSlug" element={<ProjectLayout />}>
            <Route index element={<ProjectBoardPage />} />
            <Route path="members" element={<ProjectMembersPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
