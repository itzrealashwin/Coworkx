import { Outlet, useParams, Navigate } from "react-router-dom"
import WorkspaceSidebar from "@/components/WorkspaceSidebar"
import { useOrganization } from "@/hooks/useOrganizations"

export default function OrgLayout() {
  const { orgSlug } = useParams();
  const { data: orgData, isLoading, isError } = useOrganization(orgSlug);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If organization not found or user has no access, maybe redirect to home
  if (isError || !orgData) {
     return <Navigate to="/" replace />;
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
