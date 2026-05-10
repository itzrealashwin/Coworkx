import { Outlet, useParams, Navigate } from "react-router-dom"
import WorkspaceSidebar from "@/components/WorkspaceSidebar"
import { useOrganization, useOrganizations } from "@/hooks/useOrganizations"

export default function OrgLayout() {
  const { orgSlug } = useParams();
  const { data: orgData, isLoading, isError } = useOrganization(orgSlug);
  const { data: organizationsData, isLoading: isOrganizationsLoading } = useOrganizations();

  const organization = orgData?.organization ?? orgData;
  const organizations = Array.isArray(organizationsData?.organizations)
    ? organizationsData.organizations
    : Array.isArray(organizationsData)
      ? organizationsData
      : [];

  if (isLoading || isOrganizationsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If org is missing/inaccessible, navigate to a safe fallback instead of root to avoid redirect loops.
  if (isError || !organization) {
    const fallbackOrganization = organizations.find((org) => org?.slug && org.slug !== orgSlug);

    if (fallbackOrganization?.slug) {
      return <Navigate to={`/${fallbackOrganization.slug}`} replace />;
    }

    return <Navigate to="/orgs/new" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F5F7]">
      {/* We can pass org data to sidebar later if needed. For now, we render it as is */}
      <WorkspaceSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet context={{ orgData }} />
      </div>
    </div>
  )
}
