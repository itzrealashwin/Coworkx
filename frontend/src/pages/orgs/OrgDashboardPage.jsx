import { useState, useMemo, useEffect } from "react";
import {
  FolderOpen,
  CheckSquare,
  CheckCircle,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useOutletContext, Link, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { useOrganizationMembers } from "@/hooks/useOrganizations";
import { useIssues } from "@/hooks/useIssues";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const projectColors = ["#0052CC", "#FF5630", "#36B37E", "#FFAB00", "#6554C0"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function priorityBadgeClass(priority) {
  if (priority === "HIGH") return "bg-[#FFEBE6] text-[#FF5630]";
  if (priority === "MEDIUM") return "bg-[#FFFAE6] text-[#FFAB00]";
  return "bg-[#E3FCEF] text-[#36B37E]";
}

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (["done", "completed", "complete"].includes(value)) return "DONE";
  if (["in_progress", "in progress", "progress", "doing"].includes(value))
    return "IN_PROGRESS";
  if (["todo", "to_do", "to do", "backlog", "open"].includes(value))
    return "TODO";

  return "TODO";
}

function statusBadgeClass(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "TODO") return "bg-[#F4F5F7] text-[#42526E]";
  if (normalized === "IN_PROGRESS") return "bg-[#DEEBFF] text-[#0052CC]";
  if (normalized === "DONE") return "bg-[#E3FCEF] text-[#36B37E]";
  return "bg-[#F4F5F7] text-[#42526E]";
}

function statusLabel(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "TODO") return "To Do";
  if (normalized === "IN_PROGRESS") return "In Progress";
  if (normalized === "DONE") return "Done";
  return "To Do";
}

function progressBarColor(progress) {
  if (progress >= 60) return "#36B37E";
  if (progress >= 30) return "#FFAB00";
  return "#FF5630";
}

const EMPTY_FORM = { name: "", key: "", slug: "", description: "" };

export default function OrgDashboardPage() {
  const { orgSlug } = useParams(); // ← source of truth for slug
  const { orgData } = useOutletContext(); // ← still used for name, plan etc.
  const { user } = useAuth();

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const greeting = useMemo(() => getGreeting(), []);

  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    refetch: refetchProjects,
  } = useProjects(orgSlug);
  const { data: membersData, refetch: refetchMembers } =
    useOrganizationMembers(orgSlug);
  const { mutate: createProject, isPending: isCreatingProject } =
    useCreateProject();

  // Fetch org-level issues for dashboard stats/project cards/my tasks
  const { data: allIssuesData, refetch: refetchIssues } = useIssues(
    orgSlug,
    null,
    {},
    { enabled: !!orgSlug },
  );

  useEffect(() => {
    if (!orgSlug) return undefined;

    const interval = setInterval(() => {
      refetchProjects();
      refetchMembers();
      refetchIssues();
    }, 15000);

    return () => clearInterval(interval);
  }, [orgSlug, refetchProjects, refetchMembers, refetchIssues]);

  const projectsList = projectsData?.projects || [];
  const membersList = membersData?.members || [];
  const allIssues = allIssuesData?.issues || [];

  const projectIssueStats = useMemo(() => {
    const stats = new Map();

    allIssues.forEach((issue) => {
      const projectId = issue.project?.id || issue.projectId;
      if (!projectId) return;

      const current = stats.get(projectId) || { total: 0, open: 0, done: 0 };
      const normalized = normalizeStatus(
        issue.status?.category || issue.status?.name,
      );

      current.total += 1;
      if (normalized === "DONE") current.done += 1;
      else current.open += 1;

      stats.set(projectId, current);
    });

    return stats;
  }, [allIssues]);

  // Map assigned issues to task cards
  const myTasks = useMemo(() => {
    return (
      allIssues
        // .filter(...) <-- REMOVED THIS LINE
        // .slice(0, 5) <-- REMOVED THIS LINE
        .map((issue) => ({
          id: issue.id,
          title: issue.title,
          priority: issue.priority,
          status: normalizeStatus(issue.status?.category || issue.status?.name),
          project: issue.project?.name,
          dueLabel: issue.dueDate
            ? new Date(issue.dueDate).toLocaleDateString()
            : "No deadline",
          isOverdue: issue.dueDate && new Date(issue.dueDate) < new Date(),
        }))
    );
  }, [allIssues]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleDialogChange = (open) => {
    setIsDialogOpen(open);
    if (!open) setFormData(EMPTY_FORM);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const key =
      name
        .replace(/[^a-zA-Z]+/g, "")
        .toUpperCase()
        .substring(0, 5) || (name.length ? "PROJ" : "");
    setFormData((prev) => ({ ...prev, name, slug, key }));
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    createProject(
      { orgSlug, payload: formData }, // ← param, not orgData.slug
      {
        onSuccess: () => {
          toast.success("Project created successfully");
          handleDialogChange(false);
        },
        onError: (err) => {
          toast.error(
            err.response?.data?.message || "Failed to create project",
          );
        },
      },
    );
  };

  const stats = useMemo(
    () => [
      {
        label: "Active Projects",
        value: projectsList.length,
        icon: FolderOpen,
      },
      {
        label: "Open Tasks",
        value: allIssues.filter(
          (i) =>
            normalizeStatus(i.status?.category || i.status?.name) !== "DONE",
        ).length,
        icon: CheckSquare,
      },
      {
        label: "Completed Tasks",
        value: allIssues.filter(
          (i) =>
            normalizeStatus(i.status?.category || i.status?.name) === "DONE",
        ).length,
        icon: CheckCircle,
      },
      { label: "Team Members", value: membersList.length || 1, icon: Users },
    ],
    [projectsList.length, allIssues, membersList.length],
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7] p-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#172B4D]">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-[14px] font-medium text-[#5E6C84] mt-1">
            Here's what's happening with {orgData?.name || "your team"} today.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <button className="bg-[#0052CC] hover:bg-[#0065FF] text-white font-bold text-[13px] px-4 py-2 rounded-[4px] transition-colors flex items-center gap-2">
              <Plus size={14} />
              New Project
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to {orgData?.name || orgSlug} workspace.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="proj-name">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="proj-name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Website Redesign"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proj-key">
                    Project Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="proj-key"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        key: e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z]/g, "")
                          .substring(0, 10),
                      }))
                    }
                    placeholder="e.g. WEB"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-slug">
                    Project Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="proj-slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      }))
                    }
                    placeholder="e.g. web-redesign"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-desc">Description (Optional)</Label>
                <Textarea
                  id="proj-desc"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe your project"
                  rows={3}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingProject}
                  className="bg-[#0052CC] hover:bg-[#0065FF] text-white"
                >
                  {isCreatingProject ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-[6px] border border-[#DFE1E6] shadow-[0_1px_3px_rgba(9,30,66,0.08),0_0_1px_rgba(9,30,66,0.06)] hover:shadow-[0_4px_16px_rgba(9,30,66,0.1)] transition-shadow duration-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[32px] font-extrabold text-[#172B4D] leading-none">
                    {stat.value}
                  </div>
                  <div className="text-[13px] font-medium text-[#5E6C84] mt-2">
                    {stat.label}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-[6px] bg-[#DEEBFF] flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-[#0052CC]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Active Projects */}
          <div className="bg-white rounded-[6px] border border-[#DFE1E6] shadow-[0_1px_3px_rgba(9,30,66,0.08),0_0_1px_rgba(9,30,66,0.06)] hover:shadow-[0_4px_16px_rgba(9,30,66,0.1)] transition-shadow duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE1E6]">
              <h2 className="text-[15px] font-extrabold tracking-tight text-[#172B4D]">
                Active Projects
              </h2>
              <Link
                to={`/${orgSlug}/projects`} // ← param
                className="flex items-center gap-1 text-[13px] text-[#0052CC] font-semibold hover:underline"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-[#DFE1E6]">
              {isProjectsLoading ? (
                <div className="px-5 py-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-2 bg-gray-200 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : projectsList.length === 0 ? (
                <div className="px-5 py-8 text-center text-[#5E6C84]">
                  <p className="text-[14px] font-medium">No projects yet</p>
                  <p className="text-[13px] mt-1">Create one to get started</p>
                </div>
              ) : (
                projectsList.slice(0, 5).map((project, pi) => {
                  const issueStats = projectIssueStats.get(project.id) || {
                    total: 0,
                    open: 0,
                    done: 0,
                  };
                  const progress =
                    issueStats.total > 0
                      ? Math.round((issueStats.done / issueStats.total) * 100)
                      : 0;
                  const daysLeft = 14;
                  const members = project.members
                    ? project.members.map(
                        (m) =>
                          m.user?.displayName?.substring(0, 2).toUpperCase() ||
                          "U",
                      )
                    : [];
                  if (members.length === 0 && project.lead)
                    members.push(
                      project.lead.displayName?.substring(0, 2).toUpperCase() ||
                        "U",
                    );

                  return (
                    <Link
                      to={`/${orgSlug}/projects/${project.slug}`} // ← param
                      key={project.id}
                      className="block px-5 py-4 hover:bg-[#FAFBFC] transition-colors border-l-2 border-transparent hover:border-[#0052CC]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold text-[#172B4D]">
                            {project.name}
                          </div>
                          <div className="text-[13px] text-[#5E6C84] mt-0.5 truncate max-w-sm">
                            {project.description || "No description provided"}
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-[3px] whitespace-nowrap shrink-0 ${
                            daysLeft <= 3
                              ? "bg-[#FFFAE6] text-[#FFAB00]"
                              : "bg-[#DEEBFF] text-[#0052CC]"
                          }`}
                        >
                          Sprint · {daysLeft}d left
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-1.5 bg-[#DFE1E6] rounded-full overflow-hidden">
                          {progress > 0 && (
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: progressBarColor(progress),
                              }}
                            />
                          )}
                        </div>
                        {progress > 0 && (
                          <span className="text-[12px] font-semibold text-[#42526E] w-8 text-right shrink-0">
                            {progress}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center">
                          {members.slice(0, 3).map((initials, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-[1.5px] border-white"
                              style={{
                                marginLeft: i === 0 ? 0 : "-6px",
                                backgroundColor:
                                  projectColors[
                                    (pi + i) % projectColors.length
                                  ],
                              }}
                            >
                              {initials}
                            </div>
                          ))}
                          {members.length > 3 && (
                            <div
                              className="w-6 h-6 rounded-full bg-[#DFE1E6] text-[#172B4D] text-[10px] font-bold flex items-center justify-center border-[1.5px] border-white"
                              style={{ marginLeft: "-6px" }}
                            >
                              +{members.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-[12px] font-medium text-[#5E6C84]">
                          {issueStats.open} open tasks
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* My Tasks */}
          <div className="bg-white rounded-[6px] border border-[#DFE1E6] shadow-[0_1px_3px_rgba(9,30,66,0.08),0_0_1px_rgba(9,30,66,0.06)] hover:shadow-[0_4px_16px_rgba(9,30,66,0.1)] transition-shadow duration-200">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DFE1E6]">
              <h2 className="text-[15px] font-extrabold tracking-tight text-[#172B4D]">
                My Tasks
              </h2>
              <span className="w-5 h-5 rounded-full bg-[#DEEBFF] text-[#0052CC] text-[11px] font-bold flex items-center justify-center">
                {myTasks.length}
              </span>
            </div>
            <div className="divide-y divide-[#DFE1E6]">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toast.info(`Task clicked: ${task.title}`)}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFBFC] transition-colors cursor-pointer"
                >
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-[3px] shrink-0 ${priorityBadgeClass(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[14px] font-medium truncate ${task.status === "DONE" ? "line-through text-[#8993A4]" : "text-[#172B4D]"}`}
                    >
                      {task.title}
                    </div>
                    <div className="text-[12px] text-[#8993A4]">
                      {task.project}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-[3px] shrink-0 ${statusBadgeClass(task.status)}`}
                  >
                    {statusLabel(task.status)}
                  </span>
                  <span
                    className={`text-[12px] shrink-0 ${task.isOverdue ? "text-[#FF5630] font-bold" : "text-[#5E6C84] font-medium"}`}
                  >
                    {task.dueLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Activity */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-[6px] border border-[#DFE1E6] shadow-[0_1px_3px_rgba(9,30,66,0.08),0_0_1px_rgba(9,30,66,0.06)] hover:shadow-[0_4px_16px_rgba(9,30,66,0.1)] transition-shadow duration-200">
            <div className="px-5 py-4 border-b border-[#DFE1E6]">
              <h2 className="text-[15px] font-extrabold tracking-tight text-[#172B4D]">
                Team Activity
              </h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#DEEBFF] text-[#0052CC] text-[11px] font-bold flex items-center justify-center shrink-0">
                    AI
                  </div>
                </div>
                <div className="pb-5 pt-0.5 min-w-0">
                  <p className="text-[13px] leading-snug text-[#5E6C84]">
                    Stay tuned for real-time updates from your team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
