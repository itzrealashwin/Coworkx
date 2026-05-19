import React, { useEffect, useMemo, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  CheckCheck,
  Inbox,
  X,
  ChevronDown,
  Circle,
  AlertCircle,
  Zap,
  Minus,
  ArrowDown,
  Clock,
  User,
  Tag,
  CalendarDays,
  MessageSquare,
  Activity,
  Send,
  Pencil,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateComment,
  useIssue,
  useIssueHistory,
  useIssues,
  useIssueStatuses,
  useUpdateIssue,
} from '@/hooks/useIssues';
import { useSprints } from '@/hooks/useSprints';
import { useProjectMembers } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'created', label: 'Created' },
];

const PRIORITY_CONFIG = {
  critical: {
    label: 'Critical',
    icon: AlertCircle,
    class: 'text-red-500',
    bg: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900',
  },
  high: {
    label: 'High',
    icon: Zap,
    class: 'text-orange-500',
    bg: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900',
  },
  medium: {
    label: 'Medium',
    icon: Minus,
    class: 'text-blue-500',
    bg: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900',
  },
  low: {
    label: 'Low',
    icon: ArrowDown,
    class: 'text-slate-400',
    bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toRelativeTime = (inputDate) => {
  if (!inputDate) return '—';
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const m = 60 * 1000, h = 60 * m, d = 24 * h;
  if (diff < m) return 'now';
  if (diff < h) return `${Math.floor(diff / m)}m ago`;
  if (diff < d) return `${Math.floor(diff / h)}h ago`;
  if (diff < 7 * d) return `${Math.floor(diff / d)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getIssueKey = (issue, projectKey) => {
  if (!issue) return '';
  if (issue.issueKey) return issue.issueKey;
  if (issue.number && projectKey) return `${projectKey}-${issue.number}`;
  return '';
};

const getUserInitials = (value) => {
  const src = String(value || '').trim();
  if (!src) return 'UN';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityIcon({ priority, className }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = cfg.icon;
  return <Icon className={cn('size-3.5', cfg.class, className)} />;
}

function StatusDot({ status }) {
  return (
    <span
      className="inline-block size-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: status?.color || '#94a3b8' }}
    />
  );
}

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5 group">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="text-xs font-medium text-foreground">{children}</div>
    </div>
  );
}

function IssueCard({ issue, issueKey, isSelected, onClick }) {
  const priority = issue?.priority || 'medium';
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3.5 transition-all duration-150 relative group',
        'hover:bg-accent/50',
        isSelected
          ? 'bg-accent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary before:rounded-r'
          : 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-transparent'
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <PriorityIcon priority={priority} />
          <span className="text-[11px] font-mono font-medium text-muted-foreground tracking-wide">
            {issueKey}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/70">
          {toRelativeTime(issue?.createdAt)}
        </span>
      </div>

      <p className="text-sm font-medium line-clamp-2 leading-snug mb-2.5 text-foreground/90">
        {issue.title}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StatusDot status={issue?.status} />
          <span className="text-[11px] text-muted-foreground">{issue?.status?.name || 'Todo'}</span>
        </div>
        {issue?.assignee ? (
          <Avatar className="size-5 ring-1 ring-border">
            <AvatarImage src={issue.assignee.avatarUrl} />
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
              {getUserInitials(issue.assignee.displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-5 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center">
            <User className="size-2.5 text-muted-foreground/40" />
          </div>
        )}
      </div>
    </button>
  );
}

function EditableTitle({ value, onSave, isLoading }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== value) onSave(draft.trim());
  };

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); } if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          rows={2}
          className="flex-1 text-xl font-semibold bg-transparent outline-none resize-none border-b-2 border-primary pb-1 leading-snug"
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 mt-0.5 text-primary" onClick={commit}>
          <Check className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group/title">
      <h1 className="flex-1 text-xl font-semibold leading-snug cursor-text text-foreground">
        {value}
      </h1>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover/title:opacity-100 transition-opacity mt-1 p-1 rounded hover:bg-muted text-muted-foreground"
      >
        <Pencil className="size-3" />
      </button>
    </div>
  );
}

function EditableDescription({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmedDraft = draft.trim();
    if (trimmedDraft !== (value || '').trim()) {
      onSave(trimmedDraft || null);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full text-sm bg-transparent outline-none resize-y border rounded-md border-primary/50 p-3 leading-relaxed focus:bg-background"
          placeholder="Add a description..."
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => { setDraft(value || ''); setEditing(false); }}>
            Cancel
          </Button>
          <Button size="sm" onClick={commit}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/desc relative">
      <div className={cn(
        'rounded-lg border border-border px-4 py-3.5 text-sm leading-relaxed',
        value ? 'text-foreground/90' : 'text-muted-foreground italic bg-muted/20'
      )}>
        {value || 'No description provided.'}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="absolute top-2 right-2 opacity-0 group-hover/desc:opacity-100 transition-opacity p-1.5 rounded bg-muted/80 hover:bg-muted text-muted-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IssueInboxPage() {
  const { orgSlug, projectSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { project: projectContext } = useOutletContext();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all');
  const [commentDraft, setCommentDraft] = useState('');

  const selectedIssueParam = searchParams.get('issue');

  const { data: issuesData, isLoading: isIssuesLoading } = useIssues(orgSlug, projectSlug, {}, {
    enabled: Boolean(orgSlug && projectSlug),
  });
  const { data: statusesData } = useIssueStatuses(orgSlug, projectSlug, {
    enabled: Boolean(orgSlug && projectSlug),
  });
  const { data: membersData } = useProjectMembers(orgSlug, projectSlug);
  const { data: sprintsData } = useSprints(orgSlug, projectSlug);
  const { data: issueDetailData, isLoading: isIssueDetailLoading } = useIssue(
    orgSlug, projectSlug, selectedIssueParam,
    { enabled: Boolean(orgSlug && projectSlug && selectedIssueParam) }
  );
  const { data: issueHistoryData, isLoading: isIssueHistoryLoading } = useIssueHistory(
    orgSlug, projectSlug, selectedIssueParam,
    { enabled: Boolean(orgSlug && projectSlug && selectedIssueParam) }
  );
  const { mutateAsync: updateIssue } = useUpdateIssue();
  const { mutateAsync: createComment, isPending: isSendingComment } = useCreateComment();

  const projectKey = projectContext?.key;
  const issues = issuesData?.issues ?? [];
  const statuses = statusesData?.statuses ?? [];
  const members = membersData?.members ?? [];
  const sprints = sprintsData?.sprints ?? [];
  const selectedIssue =
    issueDetailData?.issue || issues.find((i) => getIssueKey(i, projectKey) === selectedIssueParam);
  const history = issueHistoryData?.history ?? [];

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'assigned') return issue?.assignee?.id === user?.id;
      if (activeFilter === 'created') return issue?.reporter?.id === user?.id;
      return true;
    });
  }, [activeFilter, issues, user?.id]);

  const openIssue = (issueKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('issue', issueKey);
    navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: false });
  };

  const closeIssue = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('issue');
    navigate(
      { pathname: location.pathname, search: next.toString() ? `?${next.toString()}` : '' },
      { replace: true }
    );
  };

  const updateField = async (payload, msg = 'Updated') => {
    if (!selectedIssueParam) return;
    try {
      await updateIssue({ orgSlug, projectSlug, issueNumber: selectedIssueParam, ...payload });
      toast.success(msg);
    } catch {
      toast.error('Update failed');
    }
  };

  const sendComment = async () => {
    if (!commentDraft.trim()) return;
    try {
      await createComment({ orgSlug, projectSlug, issueNumber: selectedIssueParam, content: commentDraft });
      setCommentDraft('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to send comment');
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full overflow-hidden bg-background text-foreground">

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-[300px] xl:w-[340px] shrink-0 flex flex-col border-r border-border bg-background">

          {/* Sidebar Header */}
          <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="size-4 text-muted-foreground" />
                <h1 className="text-sm font-semibold tracking-tight">Inbox</h1>
                {!isIssuesLoading && (
                  <span className="text-[11px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {filteredIssues.length}
                  </span>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <CheckCheck className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark all as read</TooltipContent>
              </Tooltip>
            </div>

            {/* Filter chips */}
            <div className="flex gap-1 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                    activeFilter === tab.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue List */}
          <ScrollArea className="flex-1">
            {isIssuesLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Inbox className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">All clear</p>
                <p className="text-xs text-muted-foreground mt-1">No issues match this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredIssues.map((issue) => {
                  const issueKey = getIssueKey(issue, projectKey);
                  return (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      issueKey={issueKey}
                      isSelected={issueKey === selectedIssueParam}
                      onClick={() => openIssue(issueKey)}
                    />
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* ── Detail Panel ─────────────────────────────────────────────── */}
        <main className="flex-1 flex min-w-0 overflow-hidden">
          {!selectedIssueParam ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Inbox className="size-6 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">No issue selected</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Pick an issue from the list to view its details, comments, and activity.
              </p>
            </div>
          ) : isIssueDetailLoading ? (
            <div className="flex-1 p-8 space-y-6 max-w-3xl">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : (
            <>
              {/* Main content column */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* Issue Header */}
                <header className="flex-shrink-0 px-8 py-5 border-b border-border">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <PriorityIcon priority={selectedIssue?.priority} />
                      <span className="text-xs font-mono font-medium text-muted-foreground tracking-wider uppercase">
                        {getIssueKey(selectedIssue, projectKey)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-medium border ml-1', PRIORITY_CONFIG[selectedIssue?.priority || 'medium']?.bg)}
                      >
                        {PRIORITY_CONFIG[selectedIssue?.priority || 'medium']?.label}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeIssue}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  <EditableTitle
                    value={selectedIssue?.title || ''}
                    onSave={(t) => updateField({ title: t }, 'Title updated')}
                  />

                  {/* Quick action selects */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Select
                      value={selectedIssue?.status?.id || ''}
                      onValueChange={(id) => updateField({ statusId: id }, 'Status updated')}
                    >
                      <SelectTrigger className="h-7 text-xs border-border bg-muted/40 hover:bg-muted gap-1.5 w-auto pr-2 font-medium">
                        <StatusDot status={selectedIssue?.status} />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <StatusDot status={s} />
                              {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedIssue?.assignee?.id || 'unassigned'}
                      onValueChange={(id) =>
                        updateField({ assigneeId: id === 'unassigned' ? null : id }, 'Assignee updated')
                      }
                    >
                      <SelectTrigger className="h-7 text-xs border-border bg-muted/40 hover:bg-muted gap-1.5 w-auto pr-2 font-medium">
                        {selectedIssue?.assignee ? (
                          <Avatar className="size-4">
                            <AvatarImage src={selectedIssue.assignee.avatarUrl} />
                            <AvatarFallback className="text-[8px]">
                              {getUserInitials(selectedIssue.assignee.displayName)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <User className="size-3.5 text-muted-foreground" />
                        )}
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="size-3.5" />
                            Unassigned
                          </div>
                        </SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.user.id} value={m.user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-4">
                                <AvatarImage src={m.user.avatarUrl} />
                                <AvatarFallback className="text-[8px]">
                                  {getUserInitials(m.user.displayName)}
                                </AvatarFallback>
                              </Avatar>
                              {m.user.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </header>

                {/* Body */}
                <ScrollArea className="flex-1">
                  <div className="px-8 py-6 max-w-3xl space-y-6">

                    {/* Description */}
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Description
                      </h3>
                      <EditableDescription
                        value={selectedIssue?.description}
                        onSave={(desc) => updateField({ description: desc }, 'Description updated')}
                      />
                    </section>

                    <Separator />

                    {/* Tabs */}
                    <Tabs defaultValue="comments" className="w-full">
                      <TabsList className="bg-muted/50 h-8 p-0.5 w-fit rounded-md">
                        <TabsTrigger
                          value="comments"
                          className="h-7 px-3 text-xs rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5"
                        >
                          <MessageSquare className="size-3" />
                          Comments
                          {selectedIssue?.comments?.length ? (
                            <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                              {selectedIssue.comments.length}
                            </span>
                          ) : null}
                        </TabsTrigger>
                        <TabsTrigger
                          value="activity"
                          className="h-7 px-3 text-xs rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5"
                        >
                          <Activity className="size-3" />
                          Activity
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="comments" className="mt-5 space-y-4">
                        {/* Existing comments */}
                        {selectedIssue?.comments?.length > 0 && (
                          <div className="space-y-4">
                            {selectedIssue.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="size-7 mt-0.5 shrink-0">
                                  <AvatarImage src={comment.user?.avatarUrl} />
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                    {getUserInitials(comment.user?.displayName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-foreground">
                                      {comment.user?.displayName || 'Unknown'}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {toRelativeTime(comment.createdAt)}
                                    </span>
                                  </div>
                                  <div className="text-sm text-foreground/80 bg-muted/30 rounded-lg px-3 py-2 border border-border/60">
                                    {comment.content}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New comment box */}
                        <div className="flex gap-3 pt-2">
                          <Avatar className="size-7 mt-0.5 shrink-0">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                              {getUserInitials(user?.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Textarea
                              placeholder="Add a comment..."
                              className="min-h-[80px] resize-none text-sm focus-visible:ring-1 bg-muted/20 border-border/80"
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendComment();
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground">⌘ + Enter to send</span>
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1.5"
                                disabled={!commentDraft.trim() || isSendingComment}
                                onClick={sendComment}
                              >
                                <Send className="size-3" />
                                Comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="activity" className="mt-5">
                        {isIssueHistoryLoading ? (
                          <div className="space-y-4 py-4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        ) : history.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Activity className="size-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">Activity log is empty.</p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[300px] xl:h-[400px] w-full pr-4">
                            <div className="space-y-4">
                              {history.map((event) => (
                                <div key={event.id} className="flex gap-3 text-sm">
                                  <Avatar className="size-7 mt-0.5 shrink-0 border border-border">
                                    <AvatarImage src={event.changer?.avatarUrl} />
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                      {getUserInitials(event.changer?.displayName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-1.5 text-xs text-foreground/90">
                                      <span className="font-semibold text-foreground">
                                        {event.changer?.displayName || 'Unknown'}
                                      </span>
                                      <span className="text-muted-foreground">
                                        updated
                                      </span>
                                      {event.field && (
                                        <span className="font-medium text-foreground">
                                          {event.field}
                                        </span>
                                      )}
                                      {event.oldValue && event.newValue && (
                                        <span className="text-muted-foreground ml-1">
                                          from <span className="line-through">{
                                            event.field === 'status' 
                                            ? statuses.find(s => s.id === event.oldValue)?.name || event.oldValue 
                                            : event.field === 'assignee' 
                                            ? members.find(m => m.user.id === event.oldValue)?.user.displayName || event.oldValue
                                            : event.oldValue
                                          }</span> to <span className="font-medium text-foreground">{
                                            event.field === 'status' 
                                            ? statuses.find(s => s.id === event.newValue)?.name || event.newValue 
                                            : event.field === 'assignee' 
                                            ? members.find(m => m.user.id === event.newValue)?.user.displayName || event.newValue
                                            : event.newValue
                                          }</span>
                                        </span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground ml-auto">
                                        {toRelativeTime(event.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </div>

              {/* ── Metadata Sidebar ─────────────────────────────────────── */}
              <aside className="w-[220px] xl:w-[240px] shrink-0 border-l border-border bg-muted/10 overflow-y-auto">
                <div className="px-4 py-5 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Details
                  </p>

                  <div className="divide-y divide-border/60">
                    {/* Priority */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="size-3.5 shrink-0" />
                        <span>Priority</span>
                      </div>
                      <Select
                        value={selectedIssue?.priority || 'medium'}
                        onValueChange={(p) => updateField({ priority: p }, 'Priority updated')}
                      >
                        <SelectTrigger className="h-6 text-[11px] border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1 w-auto font-medium text-foreground hover:text-primary [&>svg]:hidden">
                          <PriorityIcon priority={selectedIssue?.priority || 'medium'} />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                              <SelectItem key={val} value={val}>
                                <div className="flex items-center gap-2">
                                  <Icon className={cn('size-3.5', cfg.class)} />
                                  {cfg.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Circle className="size-3.5 shrink-0" />
                        <span>Status</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={selectedIssue?.status} />
                        <span className="text-[11px] font-medium text-foreground">
                          {selectedIssue?.status?.name || 'Todo'}
                        </span>
                      </div>
                    </div>

                    {/* Assignee */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="size-3.5 shrink-0" />
                        <span>Assignee</span>
                      </div>
                      {selectedIssue?.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-4">
                            <AvatarImage src={selectedIssue.assignee.avatarUrl} />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {getUserInitials(selectedIssue.assignee.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] font-medium text-foreground max-w-[80px] truncate">
                            {selectedIssue.assignee.displayName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">None</span>
                      )}
                    </div>

                    {/* Sprint */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span>Sprint</span>
                      </div>
                      <Select
                        value={selectedIssue?.sprint?.id || 'backlog'}
                        onValueChange={(id) =>
                          updateField({ sprintId: id === 'backlog' ? null : id }, 'Sprint updated')
                        }
                      >
                        <SelectTrigger className="h-6 text-[11px] border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1 w-auto font-medium text-foreground hover:text-primary [&>svg]:hidden text-right justify-end max-w-[80px] truncate">
                          {/* <span>{selectedIssue?.sprint?.name || 'Backlog'}</span> */}
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="backlog">
                            <span className="font-medium text-muted-foreground">Backlog</span>
                          </SelectItem>
                          {sprints.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} {s.status === 'active' && '(Active)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reporter */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="size-3.5 shrink-0" />
                        <span>Reporter</span>
                      </div>
                      {selectedIssue?.reporter ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-4">
                            <AvatarImage src={selectedIssue.reporter.avatarUrl} />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {getUserInitials(selectedIssue.reporter.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] font-medium text-foreground max-w-[80px] truncate">
                            {selectedIssue.reporter.displayName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Unknown</span>
                      )}
                    </div>

                    {/* Created */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span>Created</span>
                      </div>
                      <span className="text-[11px] font-medium text-foreground">
                        {selectedIssue?.createdAt
                          ? new Date(selectedIssue.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>

                    {/* Updated */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3.5 shrink-0" />
                        <span>Updated</span>
                      </div>
                      <span className="text-[11px] font-medium text-foreground">
                        {toRelativeTime(selectedIssue?.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}