// ─────────────────────────────────────────────
// Shared atoms & sub-components for BacklogPage
// ─────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, isPast } from "date-fns";
import {
  ChevronRight,
  Plus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Play,
  Search,
  SlidersHorizontal,
  AlertCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useCreateIssue, useDeleteIssue } from "@/hooks/useIssues";
import { useCreateSprint, useUpdateSprint } from "@/hooks/useSprints";
import { toast } from "sonner";

// ── Priority Icon ────────────────────────────────────────────────────────────

const PRIORITY_MAP = {
  URGENT: { icon: AlertCircle, color: "#DE350B", bg: "#FFEBE6" },
  HIGH: { icon: ArrowUp, color: "#FF5630", bg: "#FFEBE6" },
  MEDIUM: { icon: ArrowRight, color: "#FFAB00", bg: "#FFFAE6" },
  LOW: { icon: ArrowDown, color: "#5E6C84", bg: "#F4F5F7" },
};

export function PriorityIcon({ priority }) {
  const cfg = PRIORITY_MAP[priority] ?? PRIORITY_MAP.MEDIUM;
  const Icon = cfg.icon;
  return (
    <span
      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: cfg.bg }}
      title={priority}
    >
      <Icon style={{ color: cfg.color }} className="w-3 h-3" />
    </span>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP = {
  TODO: { label: "To Do", cls: "bg-[#F4F5F7] text-[#42526E]" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-[#DEEBFF] text-[#0052CC]" },
  IN_REVIEW: { label: "In Review", cls: "bg-[#EAE6FF] text-[#403294]" },
  DONE: { label: "Done", cls: "bg-[#E3FCEF] text-[#006644]" },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-[#F4F5F7] text-[#8993A4] line-through",
  },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.TODO;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.04em] flex-shrink-0 ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Sprint Date Range ─────────────────────────────────────────────────────────

export function SprintDateRange({ sprint }) {
  if (!sprint.startDate && !sprint.endDate) return null;
  const overdue =
    sprint.endDate &&
    sprint.status !== "COMPLETED" &&
    isPast(new Date(sprint.endDate));
  return (
    <span
      className={`text-[12px] font-medium ${overdue ? "text-[#DE350B]" : "text-[#5E6C84]"}`}
    >
      {sprint.startDate ? format(new Date(sprint.startDate), "MMM d") : "?"}
      {" – "}
      {sprint.endDate ? format(new Date(sprint.endDate), "MMM d") : "?"}
      {overdue && " · Overdue"}
    </span>
  );
}

// ── Issue Row ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#0052CC",
  "#FF5630",
  "#36B37E",
  "#FFAB00",
  "#6554C0",
  "#00B8D9",
];
function stringToColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function IssueRow({ issue, isLast }) {
  const navigate = useNavigate();
  const { orgSlug, projectSlug } = useParams();
  const deleteIssue = useDeleteIssue();

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteIssue.mutate(
      { issueId: issue.id },
      {
        onSuccess: () => toast.success("Issue deleted"),
        onError: (err) =>
          toast.error(err.response?.data?.message ?? "Failed to delete issue"),
      },
    );
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-[#F4F5F7] transition-colors cursor-pointer ${!isLast ? "border-b border-[#DFE1E6]" : ""}`}
      onClick={() =>
        navigate(`/org/${orgSlug}/projects/${projectSlug}/issues/${issue.id}`)
      }
    >
      <GripVertical className="w-3.5 h-3.5 text-[#DFE1E6] opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-grab" />
      <PriorityIcon priority={issue.priority} />
      <span className="font-mono text-[11px] text-[#5E6C84] w-[72px] flex-shrink-0">
        {issue.key}
      </span>
      <span className="flex-1 text-[13px] font-medium text-[#172B4D] truncate">
        {issue.title}
      </span>
      <StatusBadge status={issue.status} />
      {issue.assignee ? (
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white"
          style={{ backgroundColor: stringToColor(issue.assignee.name) }}
          title={issue.assignee.name}
        >
          {issue.assignee.name?.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full flex-shrink-0 bg-[#DFE1E6] border border-dashed border-[#8993A4]" />
      )}
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-[#5E6C84] hover:bg-[#DFE1E6]"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="text-[13px] gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit issue
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] gap-2">
              <ArrowUpDown className="w-3.5 h-3.5" /> Move to sprint
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[13px] text-[#DE350B] gap-2 focus:bg-[#FFEBE6] focus:text-[#DE350B]"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Create Issue Inline ───────────────────────────────────────────────────────

export function CreateIssueInline({ orgSlug, projectSlug, sprintId, onDone }) {
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);
  const createIssue = useCreateIssue();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      onDone();
      return;
    }
    createIssue.mutate(
      { orgSlug, projectSlug, title: trimmed, sprintId: sprintId ?? null },
      {
        onSuccess: () => {
          toast.success("Issue created");
          onDone();
        },
        onError: (err) =>
          toast.error(err.response?.data?.message ?? "Failed to create issue"),
      },
    );
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#DEEBFF] border-b border-[#DFE1E6]">
      <div className="w-3.5 h-3.5 flex-shrink-0" />
      <div className="w-4 h-4 rounded-[3px] border-2 border-[#8993A4] flex-shrink-0" />
      <span className="font-mono text-[11px] text-[#8993A4] w-[72px] flex-shrink-0">
        —
      </span>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onDone();
        }}
        onBlur={handleSubmit}
        placeholder="What needs to be done?"
        className="flex-1 bg-transparent text-[13px] font-medium text-[#172B4D] placeholder:text-[#8993A4] outline-none"
        disabled={createIssue.isPending}
      />
      <span className="text-[11px] text-[#5E6C84]">↵ save · Esc cancel</span>
    </div>
  );
}

// ── Backlog Toolbar ───────────────────────────────────────────────────────────

const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export function BacklogToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  orgSlug,
  projectSlug,
}) {
  const createSprint = useCreateSprint();
  const activeCount = filters.priority.length + filters.assignee.length;

  const toggleFilter = (key, value) =>
    onFiltersChange((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  const handleCreateSprint = () =>
    createSprint.mutate(
      { orgSlug, projectSlug, name: "New Sprint" },
      {
        onSuccess: () => toast.success("Sprint created"),
        onError: (err) =>
          toast.error(err.response?.data?.message ?? "Failed to create sprint"),
      },
    );

  return (
    <div className="px-8 pb-3 flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8993A4]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search issues…"
          className="pl-8 h-8 text-[13px] bg-white border-[#DFE1E6] placeholder:text-[#8993A4] focus-visible:ring-[#0052CC]"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 text-[13px] border-[#DFE1E6] gap-1.5 ${activeCount > 0 ? "bg-[#DEEBFF] border-[#0052CC] text-[#0052CC]" : "bg-white text-[#172B4D]"}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {activeCount > 0 && (
              <span className="ml-0.5 bg-[#0052CC] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8993A4]">
            Priority
          </DropdownMenuLabel>
          {PRIORITIES.map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={filters.priority.includes(p)}
              onCheckedChange={() => toggleFilter("priority", p)}
              className="text-[13px]"
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </DropdownMenuCheckboxItem>
          ))}
          {activeCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <button
                onClick={() => onFiltersChange({ priority: [], assignee: [] })}
                className="w-full text-left px-2 py-1.5 text-[12px] text-[#DE350B] hover:bg-[#FFEBE6] rounded"
              >
                Clear filters
              </button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1" />
      <Button
        size="sm"
        onClick={handleCreateSprint}
        disabled={createSprint.isPending}
        className="h-8 text-[13px] bg-[#0052CC] hover:bg-[#0065FF] gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" /> Create Sprint
      </Button>
    </div>
  );
}

// ── Sprint Group ──────────────────────────────────────────────────────────────

export function SprintGroup({
  sprint,
  issues,
  collapsed,
  onToggle,
  orgSlug,
  projectSlug,
}) {
  const [addingIssue, setAddingIssue] = useState(false);
  const updateSprint = useUpdateSprint();
  const doneCnt = issues.filter((i) => i.status === "DONE").length;
  const total = issues.length;
  const isActive = sprint.status === "ACTIVE";
  const isCompleted = sprint.status === "COMPLETED";

  const handleUpdateStatus = (status) =>
    updateSprint.mutate(
      { sprintId: sprint.id, status },
      {
        onSuccess: () =>
          toast.success(
            `Sprint "${sprint.name}" ${status === "ACTIVE" ? "started" : "completed"}`,
          ),
        onError: (err) =>
          toast.error(err.response?.data?.message ?? "Failed to update sprint"),
      },
    );

  return (
    <div className="bg-white rounded-[6px] border border-[#DFE1E6] shadow-[0_1px_3px_rgba(9,30,66,0.08),0_0_1px_rgba(9,30,66,0.06)] overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#F4F5F7] transition-colors select-none group"
        onClick={onToggle}
      >
        <ChevronRight
          className={`w-4 h-4 text-[#5E6C84] flex-shrink-0 transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
        />
        <span className="text-[15px] font-extrabold tracking-tight text-[#172B4D]">
          {sprint.name}
        </span>
        {isActive && (
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-[#DEEBFF] text-[#0052CC] px-1.5 py-0.5 rounded-full">
            Active
          </span>
        )}
        {isCompleted && (
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-[#E3FCEF] text-[#006644] px-1.5 py-0.5 rounded-full">
            Completed
          </span>
        )}
        <SprintDateRange sprint={sprint} />
        <span className="text-[12px] font-medium text-[#5E6C84]">
          {doneCnt}/{total} done
        </span>
        {total > 0 && (
          <div className="flex-1 max-w-[80px] h-1.5 bg-[#DFE1E6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#36B37E] rounded-full transition-all"
              style={{ width: `${Math.round((doneCnt / total) * 100)}%` }}
            />
          </div>
        )}
        <div className="flex-1" />
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {!isActive && !isCompleted && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[12px] text-[#0052CC] hover:bg-[#DEEBFF] gap-1"
              onClick={() => handleUpdateStatus("ACTIVE")}
              disabled={updateSprint.isPending}
            >
              <Play className="w-3 h-3" /> Start
            </Button>
          )}
          {isActive && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[12px] text-[#36B37E] hover:bg-[#E3FCEF]"
              onClick={() => handleUpdateStatus("COMPLETED")}
              disabled={updateSprint.isPending}
            >
              Complete
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-[#5E6C84] hover:bg-[#F4F5F7]"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-[13px] gap-2">
                <Pencil className="w-3.5 h-3.5" /> Edit sprint
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[13px] text-[#DE350B] gap-2 focus:bg-[#FFEBE6] focus:text-[#DE350B]">
                <Trash2 className="w-3.5 h-3.5" /> Delete sprint
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {!collapsed && (
        <div className="border-t border-[#DFE1E6]">
          {issues.length === 0 && !addingIssue && (
            <p className="px-6 py-4 text-[13px] text-[#8993A4] italic">
              No issues in this sprint
            </p>
          )}
          {issues.map((issue, idx) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              isLast={idx === issues.length - 1 && !addingIssue}
            />
          ))}
          {addingIssue && (
            <CreateIssueInline
              orgSlug={orgSlug}
              projectSlug={projectSlug}
              sprintId={sprint.id}
              onDone={() => setAddingIssue(false)}
            />
          )}
          {!addingIssue && (
            <button
              onClick={() => setAddingIssue(true)}
              className="w-full flex items-center gap-2 px-6 py-2.5 text-[13px] text-[#5E6C84] hover:bg-[#F4F5F7] hover:text-[#172B4D] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create issue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Backlog Group ─────────────────────────────────────────────────────────────

export function BacklogGroup({
  issues,
  collapsed,
  onToggle,
  orgSlug,
  projectSlug,
}) {
  const [addingIssue, setAddingIssue] = useState(false);
  return (
    <div className="bg-white rounded-[6px] border border-[#DFE1E6] shadow-[0_1px_3px_rgba(9,30,66,0.08),0_0_1px_rgba(9,30,66,0.06)] overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#F4F5F7] transition-colors select-none"
        onClick={onToggle}
      >
        <ChevronRight
          className={`w-4 h-4 text-[#5E6C84] flex-shrink-0 transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
        />
        <span className="text-[15px] font-extrabold tracking-tight text-[#172B4D]">
          Backlog
        </span>
        <span className="text-[12px] font-medium text-[#5E6C84]">
          {issues.length} {issues.length === 1 ? "issue" : "issues"}
        </span>
      </div>
      {!collapsed && (
        <div className="border-t border-[#DFE1E6]">
          {issues.length === 0 && !addingIssue && (
            <p className="px-6 py-4 text-[13px] text-[#8993A4] italic">
              No issues in the backlog
            </p>
          )}
          {issues.map((issue, idx) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              isLast={idx === issues.length - 1 && !addingIssue}
            />
          ))}
          {addingIssue && (
            <CreateIssueInline
              orgSlug={orgSlug}
              projectSlug={projectSlug}
              onDone={() => setAddingIssue(false)}
            />
          )}
          {!addingIssue && (
            <button
              onClick={() => setAddingIssue(true)}
              className="w-full flex items-center gap-2 px-6 py-2.5 text-[13px] text-[#5E6C84] hover:bg-[#F4F5F7] hover:text-[#172B4D] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create issue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

export function BacklogEmptyState({ orgSlug, projectSlug }) {
  const createSprint = useCreateSprint();
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#DEEBFF] flex items-center justify-center mb-5">
        <LayoutList className="w-7 h-7 text-[#0052CC]" />
      </div>
      <h2 className="text-[15px] font-extrabold tracking-tight text-[#172B4D] mb-1">
        Your backlog is empty
      </h2>
      <p className="text-[13px] text-[#5E6C84] max-w-xs mb-6">
        Create a sprint to start planning work, then add issues to get the team
        moving.
      </p>
      <Button
        onClick={() =>
          createSprint.mutate(
            {
              orgSlug,
              projectSlug,
              payload: { name: "Sprint 1" },
            },
            {
              onSuccess: () => toast.success("Sprint 1 created"),
              onError: (err) =>
                toast.error(
                  err.response?.data?.message ?? "Failed to create sprint",
                ),
            },
          )
        }
        disabled={createSprint.isPending}
        className="bg-[#0052CC] hover:bg-[#0065FF] gap-2 text-[13px]"
      >
        <Plus className="w-4 h-4" /> Create first sprint
      </Button>
    </div>
  );
}
