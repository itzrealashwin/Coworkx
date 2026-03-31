import { useState } from "react";
import { useParams } from "react-router-dom";
import { useIssues } from "@/hooks/useIssues";
import { useSprints } from "@/hooks/useSprints";
import { useProject } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BacklogToolbar,
  SprintGroup,
  BacklogGroup,
  BacklogEmptyState,
} from "./components/BacklogComponent.jsx";

export default function BacklogPage() {
  const { orgSlug, projectSlug } = useParams();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ priority: [], assignee: [] });
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const { data: issuesData, isLoading: issuesLoading } = useIssues(orgSlug, projectSlug);
  const { data: sprintsData, isLoading: sprintsLoading } = useSprints(orgSlug, projectSlug);

  const allIssues = issuesData?.issues ?? [];
  const sprints = sprintsData?.sprints ?? [];

  if (issuesLoading || sprintsLoading) return <BacklogSkeleton />;

  const filterIssue = (issue) => {
    if (search && !issue.title.toLowerCase().includes(search.toLowerCase()) &&
        !issue.key?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.priority.length && !filters.priority.includes(issue.priority)) return false;
    if (filters.assignee.length && !filters.assignee.includes(issue.assigneeId)) return false;
    return true;
  };

  const sprintIssueIds = new Set(sprints.flatMap((s) => (s.issues ?? []).map((i) => i.id)));
  const backlogIssues = allIssues.filter((i) => !sprintIssueIds.has(i.id) && filterIssue(i));
  const toggleGroup = (id) => setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  if (sprints.length === 0 && allIssues.length === 0) {
    return <BacklogEmptyState orgSlug={orgSlug} projectSlug={projectSlug} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F5F7]">
      <div className="px-8 pt-7 pb-4">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#172B4D]">Backlog</h1>
        <p className="text-[13px] font-medium text-[#5E6C84] mt-0.5">Plan and prioritize work across sprints</p>
      </div>

      <BacklogToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        orgSlug={orgSlug}
        projectSlug={projectSlug}
      />

      <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-3 mt-2">
        {sprints.map((sprint) => {
          const sprintIssues = (sprint.issues ?? [])
            .map((si) => allIssues.find((i) => i.id === si.id) ?? si)
            .filter(filterIssue);
          return (
            <SprintGroup
              key={sprint.id}
              sprint={sprint}
              issues={sprintIssues}
              collapsed={!!collapsedGroups[sprint.id]}
              onToggle={() => toggleGroup(sprint.id)}
              orgSlug={orgSlug}
              projectSlug={projectSlug}
            />
          );
        })}
        <BacklogGroup
          issues={backlogIssues}
          collapsed={!!collapsedGroups["__backlog__"]}
          onToggle={() => toggleGroup("__backlog__")}
          orgSlug={orgSlug}
          projectSlug={projectSlug}
        />
      </div>
    </div>
  );
}

function BacklogSkeleton() {
  return (
    <div className="px-8 pt-7 space-y-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-9 w-full" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-10 w-full rounded-[6px]" />
          {[1, 2].map((j) => <Skeleton key={j} className="h-[52px] w-full rounded-[6px]" />)}
        </div>
      ))}
    </div>
  );
}