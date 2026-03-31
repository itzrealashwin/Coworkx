import React, { useEffect, useMemo, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { CheckCheck, Inbox, MessageSquareText, SendHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateComment,
  useIssue,
  useIssueHistory,
  useIssues,
  useIssueStatuses,
  useUpdateIssue,
} from '@/hooks/useIssues';
import { useProjectMembers } from '@/hooks/useProjects';

const POLL_INTERVAL_MS = 15000;

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'assigned', label: 'Assigned to me' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'created', label: 'Created by me' },
];

const PRIORITY_BAR_COLOR = {
  urgent: '#DE350B',
  high: '#FF8B00',
  medium: '#0052CC',
  low: '#6B778C',
};

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_BADGE_CLASS_BY_CATEGORY = {
  todo: 'bg-[#DFE1E6] text-[#42526E]',
  in_progress: 'bg-[#DEEBFF] text-[#0052CC]',
  done: 'bg-[#E3FCEF] text-[#006644]',
};

const toRelativeTime = (inputDate) => {
  if (!inputDate) return 'just now';

  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) return 'just now';

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return date.toLocaleDateString();
};

const toDueDateLabel = (dateInput) => {
  if (!dateInput) return 'No due date';

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'No due date';

  return `Due ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const getIssueKey = (issue, projectKey) => {
  if (!issue) return '';
  if (issue.issueKey) return issue.issueKey;
  if (issue.number && projectKey) return `${projectKey}-${issue.number}`;
  return '';
};

const getUserInitials = (value) => {
  const source = String(value || '').trim();
  if (!source) return 'UN';

  if (source.includes('@')) {
    return source.slice(0, 2).toUpperCase();
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const ListSkeleton = () => (
  <div className="space-y-3 p-3">
    {Array.from({ length: 7 }).map((_, index) => (
      <div
        key={`list-skeleton-${index}`}
        className="rounded-md border border-[#DFE1E6] bg-white p-3 shadow-[0_1px_3px_rgba(9,30,66,0.08)]"
      >
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="mb-2 h-4 w-[90%]" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

const DetailSkeleton = () => (
  <div className="h-full p-6">
    <Skeleton className="mb-3 h-5 w-1/3" />
    <Skeleton className="mb-6 h-8 w-2/3" />
    <div className="mb-6 flex gap-3">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-44" />
      <Skeleton className="h-9 w-28" />
    </div>
    <Skeleton className="mb-3 h-4 w-36" />
    <Skeleton className="mb-2 h-4 w-full" />
    <Skeleton className="mb-2 h-4 w-[92%]" />
    <Skeleton className="mb-6 h-4 w-[80%]" />
    <Skeleton className="mb-2 h-8 w-48" />
    <Skeleton className="mb-2 h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
);

export default function IssueInboxPage() {
  const { orgSlug, projectSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { project: projectContext } = useOutletContext();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [localCommentsByIssue, setLocalCommentsByIssue] = useState({});
  const [readMap, setReadMap] = useState({});

  const selectedIssueParam = searchParams.get('issue');

  const {
    data: issuesData,
    isLoading: isIssuesLoading,
  } = useIssues(orgSlug, projectSlug, {}, {
    enabled: Boolean(orgSlug && projectSlug),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const {
    data: statusesData,
  } = useIssueStatuses(orgSlug, projectSlug, {
    enabled: Boolean(orgSlug && projectSlug),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const {
    data: membersData,
  } = useProjectMembers(orgSlug, projectSlug);

  const {
    data: issueDetailData,
    isLoading: isIssueDetailLoading,
  } = useIssue(orgSlug, projectSlug, selectedIssueParam, {
    enabled: Boolean(orgSlug && projectSlug && selectedIssueParam),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const {
    data: historyData,
    isLoading: isHistoryLoading,
  } = useIssueHistory(orgSlug, projectSlug, selectedIssueParam, {
    enabled: Boolean(orgSlug && projectSlug && selectedIssueParam),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const { mutateAsync: updateIssue, isPending: isUpdatingIssue } = useUpdateIssue();
  const { mutateAsync: createComment, isPending: isSendingComment } = useCreateComment();

  const project = issueDetailData?.issue?.project || projectContext || null;
  const projectKey = project?.key || projectContext?.key;
  const issues = issuesData?.issues ?? [];
  const statuses = statusesData?.statuses ?? [];
  const members = membersData?.members ?? [];

  useEffect(() => {
    if (!issues.length) return;

    setReadMap((prev) => {
      const next = { ...prev };
      for (const issue of issues) {
        const key = getIssueKey(issue, projectKey);
        if (key && typeof next[key] === 'undefined') {
          next[key] = false;
        }
      }
      return next;
    });
  }, [issues, projectKey]);

  useEffect(() => {
    if (!selectedIssueParam) return;

    setReadMap((prev) => ({
      ...prev,
      [selectedIssueParam]: true,
    }));
  }, [selectedIssueParam]);

  const mentionTokens = useMemo(() => {
    const raw = [
      user?.username,
      user?.displayName,
      user?.email?.split('@')[0],
      user?.email,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return [...new Set(raw)];
  }, [user]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (activeFilter === 'all') return true;

      if (activeFilter === 'assigned') {
        return issue?.assignee?.id === user?.id;
      }

      if (activeFilter === 'created') {
        return issue?.reporter?.id === user?.id;
      }

      if (activeFilter === 'mentions') {
        const haystack = `${issue?.title || ''} ${issue?.description || ''}`.toLowerCase();
        return mentionTokens.some((token) => haystack.includes(`@${token}`));
      }

      return true;
    });
  }, [activeFilter, issues, mentionTokens, user?.id]);

  const unreadCount = useMemo(() => {
    return issues.filter((issue) => {
      const key = getIssueKey(issue, projectKey);
      return key && !readMap[key];
    }).length;
  }, [issues, projectKey, readMap]);

  const selectedIssueFromList = useMemo(() => {
    if (!selectedIssueParam) return null;
    return (
      issues.find((issue) => getIssueKey(issue, projectKey) === selectedIssueParam) || null
    );
  }, [issues, projectKey, selectedIssueParam]);

  const selectedIssue = issueDetailData?.issue || selectedIssueFromList;

  useEffect(() => {
    setTitleDraft(selectedIssue?.title || '');
  }, [selectedIssue?.title]);

  const activity = historyData?.history ?? [];

  const selectedIssueComments = useMemo(() => {
    const serverComments = selectedIssue?.comments ?? [];
    const localComments = selectedIssueParam
      ? localCommentsByIssue[selectedIssueParam] || []
      : [];

    const merged = [...serverComments, ...localComments];
    const dedupedMap = new Map();
    for (const item of merged) {
      if (!item?.id) continue;
      dedupedMap.set(item.id, item);
    }

    return [...dedupedMap.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [localCommentsByIssue, selectedIssue?.comments, selectedIssueParam]);

  const openIssue = (issueKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('issue', issueKey);

    navigate(
      {
        pathname: location.pathname,
        search: `?${next.toString()}`,
      },
      { replace: false },
    );
  };

  const closeIssue = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('issue');

    navigate(
      {
        pathname: location.pathname,
        search: next.toString() ? `?${next.toString()}` : '',
      },
      { replace: true },
    );

    setIsEditingTitle(false);
    setCommentDraft('');
  };

  const markAllRead = () => {
    setReadMap((prev) => {
      const next = { ...prev };
      for (const issue of issues) {
        const key = getIssueKey(issue, projectKey);
        if (key) next[key] = true;
      }
      return next;
    });
  };

  const updateIssueField = async (payload, successMessage) => {
    if (!selectedIssueParam) return;

    try {
      await updateIssue({
        orgSlug,
        projectSlug,
        issueNumber: selectedIssueParam,
        payload,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleTitleSave = async () => {
    const nextTitle = titleDraft.trim();

    if (!selectedIssue || !nextTitle || nextTitle === selectedIssue.title) {
      setIsEditingTitle(false);
      return;
    }

    await updateIssueField({ title: nextTitle }, 'Issue title updated');
    setIsEditingTitle(false);
  };

  const handleSendComment = async () => {
    const content = commentDraft.trim();
    if (!selectedIssueParam || !content) return;

    try {
      const response = await createComment({
        orgSlug,
        projectSlug,
        issueNumber: selectedIssueParam,
        payload: { content },
      });

      if (response?.comment) {
        setLocalCommentsByIssue((prev) => {
          const existing = prev[selectedIssueParam] || [];
          return {
            ...prev,
            [selectedIssueParam]: [...existing, response.comment],
          };
        });
      }

      setCommentDraft('');
      toast.success('Comment sent');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send comment');
    }
  };

  const selectedStatusValue = selectedIssue?.status?.id || '';
  const selectedPriorityValue = selectedIssue?.priority || 'medium';
  const selectedAssigneeValue = selectedIssue?.assignee?.id || 'unassigned';

  return (
    <div className="flex h-full bg-[#F4F5F7] text-[#172B4D]">
      <aside className="w-80 shrink-0 border-r border-[#DFE1E6] bg-white">
        <div className="border-b border-[#DFE1E6] px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-extrabold leading-none text-[#172B4D]">Inbox</h1>
              <Badge className="rounded-full border-0 bg-[#0052CC] px-2 py-0.5 text-[11px] font-semibold text-white">
                {unreadCount}
              </Badge>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={markAllRead}
              className="h-8 px-2 text-[#5E6C84] hover:bg-[#F4F5F7] hover:text-[#172B4D]"
            >
              <CheckCheck className="mr-1 size-4" />
              Mark all read
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0052CC] text-white'
                      : 'bg-[#EBECF0] text-[#5E6C84] hover:bg-[#DFE1E6]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-109px)]">
          {isIssuesLoading ? (
            <ListSkeleton />
          ) : filteredIssues.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Inbox className="mx-auto mb-3 size-8 text-[#5E6C84]/70" />
              <p className="text-sm font-semibold text-[#172B4D]">No issues in this view</p>
              <p className="mt-1 text-xs text-[#5E6C84]">Try another filter tab.</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {filteredIssues.map((issue) => {
                const issueKey = getIssueKey(issue, projectKey);
                const isSelected = issueKey === selectedIssueParam;
                const priorityColor = PRIORITY_BAR_COLOR[issue?.priority] || PRIORITY_BAR_COLOR.low;
                const isUnread = issueKey && !readMap[issueKey];

                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => openIssue(issueKey)}
                    className={`relative w-full rounded-md border border-[#DFE1E6] bg-white text-left shadow-[0_1px_3px_rgba(9,30,66,0.08)] transition-colors hover:bg-[#F4F5F7] ${
                      isSelected ? 'bg-[#DEEBFF]' : ''
                    }`}
                  >
                    <span
                      className="absolute left-0 top-0 h-full w-0.75 rounded-l-md"
                      style={{ backgroundColor: isSelected ? '#0052CC' : priorityColor }}
                    />

                    <div className="p-3 pl-4">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] text-[#5E6C84]">{issueKey}</span>
                        <div className="flex items-center gap-2">
                          {isUnread && <span className="size-2 rounded-full bg-[#0052CC]" />}
                          <span className="text-[11px] text-[#5E6C84]">
                            {toRelativeTime(issue?.updatedAt || issue?.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p className="truncate text-[14px] font-semibold text-[#172B4D]">{issue.title}</p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[12px] text-[#5E6C84]">
                            {projectContext?.name || project?.name || 'Project'}
                          </span>
                          <Avatar className="size-5 border border-[#DFE1E6]">
                            <AvatarImage src={issue?.assignee?.avatarUrl || ''} alt={issue?.assignee?.displayName || 'Assignee'} />
                            <AvatarFallback className="text-[9px]">
                              {getUserInitials(issue?.assignee?.displayName || issue?.assignee?.email)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <Badge
                          className={`border-0 text-[10px] font-semibold ${
                            STATUS_BADGE_CLASS_BY_CATEGORY[issue?.status?.category] || 'bg-[#DFE1E6] text-[#42526E]'
                          }`}
                        >
                          {issue?.status?.name || 'No status'}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col">
        {!selectedIssueParam ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(9,30,66,0.08)]">
              <Inbox className="size-9 text-[#0052CC]" />
            </div>
            <h2 className="text-xl font-semibold text-[#172B4D]">Select an issue to get started</h2>
            <p className="mt-2 max-w-md text-sm text-[#5E6C84]">
              Pick an item from the inbox to view details, update status, and collaborate in comments.
            </p>
          </div>
        ) : isIssueDetailLoading ? (
          <DetailSkeleton />
        ) : !selectedIssue ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <p className="text-sm text-[#5E6C84]">Issue not found. Choose another one from the list.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-[#DFE1E6] bg-white px-6 py-4">
              <div className="min-w-0">
                <p className="mb-1 font-mono text-xs text-[#5E6C84]">{getIssueKey(selectedIssue, projectKey)}</p>

                {isEditingTitle ? (
                  <input
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleTitleSave();
                      }

                      if (event.key === 'Escape') {
                        setTitleDraft(selectedIssue.title || '');
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1 text-[20px] font-bold text-[#172B4D] outline-none focus:border-[#0052CC]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="truncate text-left text-[20px] font-bold text-[#172B4D]"
                  >
                    {selectedIssue.title}
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={closeIssue}
                className="h-8 w-8 p-0 text-[#5E6C84] hover:bg-[#F4F5F7] hover:text-[#172B4D]"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="border-b border-[#DFE1E6] bg-white px-6 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedStatusValue || undefined}
                  onValueChange={(statusId) => {
                    void updateIssueField({ statusId }, 'Status updated');
                  }}
                >
                  <SelectTrigger className="h-9 min-w-42.5 border-[#DFE1E6] bg-white text-xs">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedPriorityValue}
                  onValueChange={(priority) => {
                    void updateIssueField({ priority }, 'Priority updated');
                  }}
                >
                  <SelectTrigger className="h-9 min-w-35 border-[#DFE1E6] bg-white text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedAssigneeValue}
                  onValueChange={(assigneeId) => {
                    const normalized = assigneeId === 'unassigned' ? null : assigneeId;
                    void updateIssueField({ assigneeId: normalized }, 'Assignee updated');
                  }}
                >
                  <SelectTrigger className="h-9 min-w-50 border-[#DFE1E6] bg-white text-xs">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.displayName || member.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Badge className="h-9 border border-[#DFE1E6] bg-white px-3 text-xs font-semibold text-[#5E6C84]">
                  {toDueDateLabel(selectedIssue?.dueDate)}
                </Badge>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
              <div className="mb-4 rounded-md border border-[#DFE1E6] bg-white p-4 shadow-[0_1px_3px_rgba(9,30,66,0.08)]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5E6C84]">Description</p>
                {selectedIssue?.description ? (
                  <div className="whitespace-pre-wrap text-sm leading-6 text-[#172B4D]">
                    {selectedIssue.description}
                  </div>
                ) : (
                  <p className="text-sm text-[#5E6C84]">No description</p>
                )}
              </div>

              <Tabs defaultValue="comments" className="min-h-0 flex-1">
                <TabsList className="mb-3 bg-[#EBECF0]">
                  <TabsTrigger value="comments" className="data-[state=active]:bg-white">
                    <MessageSquareText className="size-4" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-white">
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="min-h-0 flex-1">
                  <ScrollArea className="h-[calc(100%-96px)] rounded-md border border-[#DFE1E6] bg-white p-4">
                    {!selectedIssueComments.length ? (
                      <p className="text-sm text-[#5E6C84]">No comments yet</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedIssueComments.map((comment) => (
                          <div key={comment.id} className="rounded-md border border-[#DFE1E6] bg-[#FAFBFC] p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <Avatar className="size-6 border border-[#DFE1E6]">
                                <AvatarImage src={comment?.user?.avatarUrl || ''} alt={comment?.user?.displayName || 'User'} />
                                <AvatarFallback className="text-[10px]">
                                  {getUserInitials(comment?.user?.displayName || comment?.user?.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold text-[#172B4D]">
                                {comment?.user?.displayName || 'Unknown user'}
                              </span>
                              <span className="text-[11px] text-[#5E6C84]">{toRelativeTime(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-[#172B4D]">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="mt-3 flex items-end gap-2">
                    <Textarea
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Write a comment"
                      className="min-h-18 border-[#DFE1E6] bg-white text-sm"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        void handleSendComment();
                      }}
                      disabled={!commentDraft.trim() || isSendingComment}
                      className="h-10 bg-[#0052CC] px-4 hover:bg-[#0065FF]"
                    >
                      <SendHorizontal className="mr-1 size-4" />
                      Send
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="min-h-0 flex-1">
                  <ScrollArea className="h-[calc(100%-8px)] rounded-md border border-[#DFE1E6] bg-white p-4">
                    {isHistoryLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[70%]" />
                        <Skeleton className="h-4 w-[65%]" />
                        <Skeleton className="h-4 w-[60%]" />
                      </div>
                    ) : !activity.length ? (
                      <p className="text-sm text-[#5E6C84]">No activity yet</p>
                    ) : (
                      <ul className="space-y-2">
                        {activity.map((entry) => (
                          <li key={entry.id} className="text-sm text-[#172B4D]">
                            <span className="font-semibold">{entry?.changer?.displayName || 'Someone'}</span>{' '}
                            {entry.field === 'status' ? 'moved status' : `updated ${entry.field}`}{' '}
                            <span className="text-[#5E6C84]">{toRelativeTime(entry.createdAt)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}

        {isUpdatingIssue && (
          <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-[#172B4D] px-3 py-1 text-xs font-semibold text-white shadow-lg">
            Updating issue...
          </div>
        )}
      </section>
    </div>
  );
}
