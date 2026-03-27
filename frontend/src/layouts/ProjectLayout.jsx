import { Outlet, useParams, Navigate, useOutletContext } from "react-router-dom"
import ProjectSidebar from "@/components/ProjectSidebar"
import { useProject } from "@/hooks/useProjects"

export default function ProjectLayout() {
  const { orgSlug, projectSlug } = useParams();
  const { orgData } = useOutletContext();
  const { data: projectData, isLoading, isError } = useProject(orgSlug, projectSlug);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If project not found or no access, navigate back to org dashboard
  if (isError || !projectData) {
     return <Navigate to={`/${orgSlug}`} replace />;
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* We can enrich the sidebar with real data now by passing it as props */}
      <ProjectSidebar project={projectData?.project} orgSlug={orgSlug} />
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <Outlet context={{ orgData, project: projectData?.project }} />
      </div>
    </div>
  );
}