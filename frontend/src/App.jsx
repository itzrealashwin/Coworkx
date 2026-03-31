import React, { Suspense } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import MinimalLayout from "./layouts/MinimalLayout";
import OrgLayout from "./layouts/OrgLayout";
import ProjectLayout from "./layouts/ProjectLayout";

import RequireAuth from "./components/RequireAuth";
import HomeRedirect from "./components/HomeRedirect";
import SettingsPage from "./pages/Settings.jsx";
import BacklogPage from "./pages/projects/Backlog.jsx";

// Lazy Loaded Pages
const LoginPage = React.lazy(() => import("./pages/Login"));
const RegisterPage = React.lazy(() => import("./pages/Register"));
const CreateOrgPage = React.lazy(() => import("./pages/orgs/CreateOrgPage"));
const OrgDashboardPage = React.lazy(
  () => import("./pages/orgs/OrgDashboardPage"),
);
const OrgMembersPage = React.lazy(() => import("./pages/orgs/OrgMembersPage"));
const AcceptInvitePage = React.lazy(
  () => import("./pages/orgs/AcceptInvitePage"),
);
const ProjectBoardPage = React.lazy(
  () => import("./pages/projects/ProjectBoardPage"),
);
const IssueInboxPage = React.lazy(
  () => import("./pages/projects/IssueInboxPage"),
);
const CoWorkxLanding = React.lazy(() => import("./pages/Landing.jsx"));

// Loader Component matching the theme
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="w-8 h-8 flex items-center justify-center border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Layout Placeholders
const AppLayout = () => (
  <div>
    AppLayout <Outlet />
  </div>
);

// Auth Pages Placeholders
const VerifyOtpPage = () => <div>VerifyOtpPage</div>;
const ForgotPasswordPage = () => <div>ForgotPasswordPage</div>;
const ResetPasswordPage = () => <div>ResetPasswordPage</div>;

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
    <Suspense fallback={<PageLoader />}>
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
            <Route path="projects" element={<ProjectsListPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Project shell — loads project context, project subnav */}
            <Route path="projects/:projectSlug" element={<ProjectLayout />}>
              {/* Default → redirect to overview */}
              <Route index element={<Navigate to="overview" replace />} />

              <Route path="overview" element={<ProjectBoardPage />} />
              <Route path="inbox" element={<IssueInboxPage />} />
              <Route path="backlog" element={<BacklogPage/>} />
              <Route path="sprint" element={<div>Sprint Board</div>} />
              <Route path="workload" element={<div>Workload Page</div>} />
              <Route path="analytics" element={<div>Analytics Page</div>} />
              <Route path="activity" element={<div>Activity Page</div>} />

              <Route path="members" element={<ProjectMembersPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
