import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIssues } from "@/hooks/useIssues";
import { useSprints } from "@/hooks/useSprints";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Inbox,
  List,
  Kanban,
  Users,
  BarChart2,
  Clock,
  ChevronLeft,
} from "lucide-react";

const formatSprintStatus = (status) => {
  if (!status) return "Idle";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getDaysLabel = (endDate) => {
  if (!endDate) return "No due date";

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return "No due date";

  const diffDays = Math.ceil(
    (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  return `${diffDays} days left`;
};

export default function ProjectSidebar({ project, orgSlug }) {
  const projectSlug = project?.slug;
  const [progressWidth, setProgressWidth] = useState(0);
  const navigate = useNavigate();
  const { data: issuesData } = useIssues(
    orgSlug,
    projectSlug,
    {},
    {
      enabled: Boolean(orgSlug && projectSlug),
    },
  );

  const { data: sprintsData } = useSprints(
    orgSlug,
    projectSlug,
    {},
    {
      enabled: Boolean(orgSlug && projectSlug),
    },
  );

  const issues = issuesData?.issues ?? [];
  const sprints = sprintsData?.sprints ?? [];

  const activeSprint = useMemo(
    () => sprints.find((sprint) => sprint.status === "active") ?? null,
    [sprints],
  );

  const inboxCount = issues.length;

  const backlogCount = useMemo(
    () => issues.filter((issue) => !issue?.sprint && !issue?.sprintId).length,
    [issues],
  );

  const sprintIssues = useMemo(() => {
    if (!activeSprint) return [];

    return issues.filter(
      (issue) =>
        issue?.sprint?.id === activeSprint.id ||
        issue?.sprintId === activeSprint.id,
    );
  }, [issues, activeSprint]);

  const tasksCompleted = useMemo(
    () =>
      sprintIssues.filter((issue) => issue?.status?.category === "done").length,
    [sprintIssues],
  );

  const tasksTotal = sprintIssues.length;
  const sprintProgress =
    tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const daysLabel = getDaysLabel(activeSprint?.endDate);
  const sprintName = activeSprint?.name ?? "No Active Sprint";
  const sprintStatus = formatSprintStatus(activeSprint?.status);

  useEffect(() => {
    const timerId = setTimeout(() => setProgressWidth(sprintProgress), 100);
    return () => clearTimeout(timerId);
  }, [sprintProgress]);

  const navItems = [
    {
      key: "overview",
      to: "overview",
      icon: LayoutDashboard,
      label: "Overview",
    },
    {
      key: "inbox",
      to: "inbox",
      icon: Inbox,
      label: "Issues Inbox",
      badge: inboxCount,
    },
    {
      key: "backlog",
      to: "backlog",
      icon: List,
      label: "Backlog",
      badge: backlogCount,
    },
    { key: "sprint", to: "sprint", icon: Kanban, label: "Sprint Board" },
    { key: "workload", to: "workload", icon: Users, label: "Workload" },
    { key: "analytics", to: "analytics", icon: BarChart2, label: "Analytics" },
    { key: "activity", to: "activity", icon: Clock, label: "Activity" },
  ];

  return (
    <div className="w-60 h-full flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Top Header Section */}
      <div className="flex flex-col px-4 pt-5 pb-4 space-y-4">
        {/* Back Link */}
        <Link
          onClick={() => navigate(-1)}
          className="group flex items-center gap-1.5 text-xs font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Projects
        </Link>

        {/* Project Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-primary shadow-sm">
            <span className="text-primary-foreground text-xs font-bold">
              {project?.name?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {project?.name || "Software Project"}
            </div>
            <div className="text-xs text-sidebar-foreground/60 leading-tight mt-0.5 truncate">
              Classic Project
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border/60 mx-4 w-auto" />

      {/* Navigation Area */}
      <ScrollArea className="flex-1 py-4">
        <div className="px-2 space-y-1 flex flex-col justify-center items-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 px-3 pb-1">
            Project
          </div>

          {/* delayDuration prevents annoying flashes when moving mouse vertically */}
          <TooltipProvider delayDuration={700}>
            {navItems.map(({ key, to, icon: Icon, label, badge }) => (
              <Tooltip key={key}>
              <TooltipTrigger asChild>
  <div className="w-full">
    <NavLink
      to={to}
      end={key === "overview"}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-md text-sm w-full ${
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
        }`
      }
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
      </div>

      {Number.isInteger(badge) && badge > 0 && (
        <Badge className="ml-2 shrink-0 text-[10px] h-4 px-1.5 flex items-center justify-center">
          {badge}
        </Badge>
      )}
    </NavLink>
  </div>
</TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">
                  {label}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </ScrollArea>

      {/* Footer / Sprint Widget */}
      <div className="p-4 mt-auto">
        <div className="bg-sidebar-accent/40 rounded-lg p-3.5 border border-sidebar-border/50 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-sidebar-foreground truncate">
              {sprintName}
            </span>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20 text-[9px] uppercase font-bold border-0 px-1.5 py-0 h-4 shrink-0"
            >
              {sprintStatus}
            </Badge>
          </div>

          <div className="space-y-1.5">
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-sidebar-border/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-in-out"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-[11px] font-medium text-sidebar-foreground/60">
              <span>
                {tasksCompleted} / {tasksTotal} tasks
              </span>
              <span>{daysLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
