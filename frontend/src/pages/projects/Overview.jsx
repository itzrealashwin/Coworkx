import React, { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { Bar, BarChart, Cell, Pie, PieChart } from 'recharts';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useIssueStatuses, useIssues } from '@/hooks/useIssues';
import { useProjectMembers } from '@/hooks/useProjects';
import { queryKeys } from '@/hooks/queryKeys.js';
import { useSprints } from '@/hooks/useSprints';
import { issueService } from '@/services/api/issue.service.js';
import { getCountdownConfig } from '@/components/sprintboard/utils/helpers.js';

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

const PRIORITY_META = {
  critical: { label: 'Critical', color: '#DC2626' },
  high: { label: 'High', color: '#F97316' },
  medium: { label: 'Medium', color: '#2563EB' },
  low: { label: 'Low', color: '#64748B' },
};

function getInitials(value) {
  const source = String(value || '').trim();
  if (!source) return 'UN';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function toIssueKey(issue, projectKey) {
  if (!issue) return '';
  if (issue.issueKey) return issue.issueKey;
  if (issue.number && projectKey) return `${projectKey}-${issue.number}`;
  return issue.key || '';
}

function toRelativeTime(inputDate) {
  if (!inputDate) return '—';
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(inputDate) {
  if (!inputDate) return '—';
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatCard({ title, value, hint, icon }) {
  return (
    <Card className="gap-3 bg-white">
      <CardHeader className="px-5 pt-5 pb-0">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">{title}</CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
            {icon ? React.createElement(icon, { className: 'size-4' }) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-5 p-6 lg:p-8">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <div className="grid gap-5 xl:grid-cols-5">
        <Skeleton className="h-56 w-full rounded-xl xl:col-span-3" />
        <Skeleton className="h-56 w-full rounded-xl xl:col-span-2" />
      </div>
      <div className="grid gap-5 xl:grid-cols-5">
        <Skeleton className="h-72 w-full rounded-xl xl:col-span-3" />
        <Skeleton className="h-72 w-full rounded-xl xl:col-span-2" />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { orgSlug, projectSlug } = useParams();
  const { project } = useOutletContext();

  const {
    data: issuesData,
    isLoading: isLoadingIssues,
    isError: isIssuesError,
  } = useIssues(orgSlug, projectSlug, {}, {
    enabled: Boolean(orgSlug && projectSlug),
  });

  const {
    data: statusesData,
    isLoading: isLoadingStatuses,
    isError: isStatusesError,
  } = useIssueStatuses(orgSlug, projectSlug, {
    enabled: Boolean(orgSlug && projectSlug),
  });

  const {
    data: sprintsData,
    isLoading: isLoadingSprints,
    isError: isSprintsError,
  } = useSprints(orgSlug, projectSlug, {}, {
    enabled: Boolean(orgSlug && projectSlug),
  });

  const {
    data: membersData,
    isLoading: isLoadingMembers,
    isError: isMembersError,
  } = useProjectMembers(orgSlug, projectSlug);

  const issues = useMemo(() => issuesData?.issues ?? [], [issuesData?.issues]);
  const statuses = useMemo(() => statusesData?.statuses ?? [], [statusesData?.statuses]);
  const sprints = useMemo(() => sprintsData?.sprints ?? [], [sprintsData?.sprints]);
  const members = useMemo(() => membersData?.members ?? [], [membersData?.members]);

  const issueCandidatesForActivity = useMemo(() => {
    return [...issues]
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [issues]);

  const issueDetailQueries = useQueries({
    queries: issueCandidatesForActivity.map((issue) => ({
      queryKey: queryKeys.issues.detail(orgSlug, projectSlug, issue.number || issue.issueKey || issue.key),
      queryFn: () =>
        issueService.getByNumber({
          orgSlug,
          projectSlug,
          issueNumber: issue.number || issue.issueKey || issue.key,
        }),
      enabled: Boolean(orgSlug && projectSlug && (issue.number || issue.issueKey || issue.key)),
      staleTime: 30 * 1000,
    })),
  });

  const issueHistoryQueries = useQueries({
    queries: issueCandidatesForActivity.map((issue) => ({
      queryKey: queryKeys.issues.history(orgSlug, projectSlug, issue.number || issue.issueKey || issue.key),
      queryFn: () =>
        issueService.getHistory({
          orgSlug,
          projectSlug,
          issueNumber: issue.number || issue.issueKey || issue.key,
        }),
      enabled: Boolean(orgSlug && projectSlug && (issue.number || issue.issueKey || issue.key)),
      staleTime: 30 * 1000,
    })),
  });

  const statusById = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});
  }, [statuses]);

  const totalIssues = issues.length;
  const completedIssues = issues.filter((issue) => issue?.status?.category === 'done').length;
  const inProgressIssues = issues.filter((issue) => issue?.status?.category === 'in_progress').length;
  const openIssues = issues.filter((issue) => issue?.status?.category !== 'done').length;

  const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  const activeSprint = useMemo(() => {
    return sprints.find((sprint) => String(sprint?.status).toLowerCase() === 'active') ?? null;
  }, [sprints]);

  const activeSprintIssues = useMemo(() => {
    if (!activeSprint) return [];
    return issues.filter(
      (issue) => issue?.sprint?.id === activeSprint.id || issue?.sprintId === activeSprint.id,
    );
  }, [issues, activeSprint]);

  const activeSprintDoneIssues = activeSprintIssues.filter((issue) => issue?.status?.category === 'done').length;
  const activeSprintProgress = activeSprintIssues.length
    ? Math.round((activeSprintDoneIssues / activeSprintIssues.length) * 100)
    : 0;

  const countdown = getCountdownConfig(activeSprint?.endDate);

  const detailedIssues = useMemo(() => {
    return issueDetailQueries
      .map((query) => query.data?.issue)
      .filter(Boolean);
  }, [issueDetailQueries]);

  const historyEvents = useMemo(() => {
    return issueHistoryQueries.flatMap((query, idx) => {
      const issue = issueCandidatesForActivity[idx];
      const issueKey = toIssueKey(issue, project?.key);
      const events = query.data?.history ?? [];

      return events
        .filter((event) => ['status', 'assignee', 'priority', 'sprint', 'title'].includes(event.field))
        .map((event) => {
          let actionText = `${event?.changer?.displayName || 'Someone'} updated ${issueKey}`;

          if (event.field === 'status') {
            const resolvedStatus = statusById[event.newValue]?.name || event.newValue;
            actionText = `${event?.changer?.displayName || 'Someone'} moved ${issueKey} to ${resolvedStatus || 'a new status'}`;
          } else if (event.field === 'assignee') {
            actionText = `${event?.changer?.displayName || 'Someone'} changed assignee on ${issueKey}`;
          } else if (event.field === 'priority') {
            actionText = `${event?.changer?.displayName || 'Someone'} updated priority on ${issueKey}`;
          } else if (event.field === 'sprint') {
            actionText = `${event?.changer?.displayName || 'Someone'} changed sprint for ${issueKey}`;
          }

          return {
            id: event.id,
            issueKey,
            actorName: event?.changer?.displayName || 'Someone',
            actorAvatar: event?.changer?.avatarUrl,
            actionText,
            createdAt: event.createdAt,
          };
        });
    });
  }, [issueHistoryQueries, issueCandidatesForActivity, project?.key, statusById]);

  const commentEvents = useMemo(() => {
    return detailedIssues.flatMap((issue) => {
      const issueKey = toIssueKey(issue, project?.key);
      const comments = issue?.comments ?? [];

      return comments.map((comment) => ({
        id: `comment-${comment.id}`,
        issueKey,
        actorName: comment?.user?.displayName || 'Someone',
        actorAvatar: comment?.user?.avatarUrl,
        actionText: `${comment?.user?.displayName || 'Someone'} commented on ${issueKey}`,
        createdAt: comment.createdAt,
      }));
    });
  }, [detailedIssues, project?.key]);

  const issueCreatedEvents = useMemo(() => {
    return issues.map((issue) => {
      const issueKey = toIssueKey(issue, project?.key);
      return {
        id: `created-${issue.id}`,
        issueKey,
        actorName: issue?.reporter?.displayName || 'Someone',
        actorAvatar: issue?.reporter?.avatarUrl,
        actionText: `${issue?.reporter?.displayName || 'Someone'} created ${issueKey}`,
        createdAt: issue.createdAt,
      };
    });
  }, [issues, project?.key]);

  const recentActivity = useMemo(() => {
    const merged = [...historyEvents, ...commentEvents, ...issueCreatedEvents]
      .filter((event) => event.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const deduped = [];
    const seen = new Set();

    for (const event of merged) {
      const key = `${event.id}-${event.createdAt}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(event);
      }
      if (deduped.length >= 10) break;
    }

    return deduped;
  }, [historyEvents, commentEvents, issueCreatedEvents]);

  const statusChartData = useMemo(() => {
    if (statuses.length) {
      return statuses
        .map((status) => ({
          statusId: status.id,
          label: status.name,
          value: issues.filter((issue) => issue?.status?.id === status.id).length,
          fill: status.color || '#94A3B8',
        }))
        .filter((entry) => entry.value > 0);
    }

    const grouped = {};

    for (const issue of issues) {
      const statusName = issue?.status?.name || 'Unassigned';
      if (!grouped[statusName]) {
        grouped[statusName] = {
          statusId: statusName,
          label: statusName,
          value: 0,
          fill: issue?.status?.color || '#94A3B8',
        };
      }
      grouped[statusName].value += 1;
    }

    return Object.values(grouped);
  }, [issues, statuses]);

  const priorityChartData = useMemo(() => {
    const counts = PRIORITY_ORDER.reduce((acc, priority) => {
      acc[priority] = 0;
      return acc;
    }, {});

    for (const issue of issues) {
      const normalized = String(issue?.priority || 'medium').toLowerCase();
      if (counts[normalized] !== undefined) {
        counts[normalized] += 1;
      }
    }

    return PRIORITY_ORDER.map((priority) => ({
      key: priority,
      label: PRIORITY_META[priority].label,
      value: counts[priority],
      fill: PRIORITY_META[priority].color,
    }));
  }, [issues]);

  const isLoading = isLoadingIssues || isLoadingStatuses || isLoadingSprints || isLoadingMembers;
  const isError = isIssuesError || isStatusesError || isSprintsError || isMembersError;

  if (isLoading) {
    return <SectionSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          Unable to load overview data right now. Please refresh.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7FB]">
      <div className="space-y-6 p-6 lg:p-8">

        <Card className="gap-4 rounded-2xl border-slate-200 bg-white/95 backdrop-blur">
          <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 pt-6 pb-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200">{project?.key || 'PRJ'}</Badge>
                <span className="text-xs text-slate-500">Project Overview</span>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                {project?.name || 'Project'}
              </CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                {project?.description || 'No project description provided yet.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Avatar className="size-7 ring-1 ring-slate-200">
                    <AvatarImage src={project?.lead?.avatarUrl} />
                    <AvatarFallback className="bg-slate-100 text-slate-700 text-[11px]">
                      {getInitials(project?.lead?.displayName || project?.lead?.email || 'Lead')}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Lead: <span className="font-semibold text-slate-800">{project?.lead?.displayName || 'Unassigned'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-slate-500" />
                  <span>Created {formatDate(project?.createdAt)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-slate-500" />
                  <span>{project?.metrics?.memberCount || members.length} members</span>
                </div>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to="../settings">
                <Settings className="size-4" />
                Edit Project
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0" />
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Issues"
            value={totalIssues}
            hint="All issues in this project"
            icon={FolderKanban}
          />
          <StatCard
            title="Open Issues"
            value={openIssues}
            hint="Not in done status"
            icon={Clock3}
          />
          <StatCard
            title="In Progress"
            value={inProgressIssues}
            hint="Actively being worked on"
            icon={TrendingUp}
          />
          <StatCard
            title="Completed"
            value={completedIssues}
            hint={`${completionRate}% of total complete`}
            icon={CheckCircle2}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-5">
          <Card className="gap-4 rounded-xl bg-white xl:col-span-3">
            <CardHeader className="px-6 pt-6 pb-0">
              <CardTitle className="text-lg font-semibold">Active Sprint Summary</CardTitle>
              <CardDescription>Current sprint progress and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-0">
              {activeSprint ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{activeSprint.name}</h3>
                      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                        ACTIVE
                      </Badge>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${countdown.className}`}>
                      {countdown.text}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Progress</span>
                      <span className="font-medium text-slate-800">
                        {activeSprintDoneIssues}/{activeSprintIssues.length} issues
                      </span>
                    </div>
                    <Progress value={activeSprintProgress} className="h-2.5" />
                  </div>

                  <div className="pt-1">
                    <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                      <Link to="../sprint">
                        View Board
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No active sprint. Start one from Backlog.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gap-4 rounded-xl bg-white xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-6 pt-6 pb-0">
              <div>
                <CardTitle className="text-lg font-semibold">Members</CardTitle>
                <CardDescription>Project team and access roles</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="../members">+ Invite Member</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 pt-0">
              {members.length ? (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar className="size-7 ring-1 ring-slate-200">
                        <AvatarImage src={member?.user?.avatarUrl} />
                        <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700">
                          {getInitials(member?.user?.displayName || member?.user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-sm font-medium text-slate-800">
                        {member?.user?.displayName || member?.user?.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-slate-300 bg-white text-[11px] text-slate-600">
                      {member?.role?.name || 'Member'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No members found for this project yet.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-5">
          <Card className="gap-4 rounded-xl bg-white xl:col-span-3">
            <CardHeader className="px-6 pt-6 pb-0">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest issue and collaboration events</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {recentActivity.length ? (
                <div className="space-y-3">
                  {recentActivity.map((event, index) => (
                    <Link
                      key={`${event.id}-${event.createdAt}`}
                      to={`../inbox?issue=${encodeURIComponent(event.issueKey)}`}
                      className="group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                    >
                      <div className="relative mt-0.5">
                        <Avatar className="size-8 ring-1 ring-slate-200">
                          <AvatarImage src={event.actorAvatar} />
                          <AvatarFallback className="text-[10px] bg-slate-100 text-slate-700">
                            {getInitials(event.actorName)}
                          </AvatarFallback>
                        </Avatar>
                        {index !== recentActivity.length - 1 && (
                          <span className="absolute left-1/2 top-8 h-8 w-px -translate-x-1/2 bg-slate-200" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-700 group-hover:text-slate-900">
                          {event.actionText}
                          <span className="text-slate-400"> · {toRelativeTime(event.createdAt)}</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Activity className="size-4" />
                    No recent activity yet.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gap-4 rounded-xl bg-white xl:col-span-2">
            <CardHeader className="px-6 pt-6 pb-0">
              <CardTitle className="text-lg font-semibold">Issue Breakdown</CardTitle>
              <CardDescription>Status and priority distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6 pt-0">

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Issues by Status</p>
                {statusChartData.length ? (
                  <ChartContainer
                    className="h-48 w-full"
                    config={statusChartData.reduce((acc, item) => {
                      acc[item.label] = {
                        label: item.label,
                        color: item.fill,
                      };
                      return acc;
                    }, {})}
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {statusChartData.map((entry) => (
                          <Cell key={entry.statusId} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-slate-500">No status data available.</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Issues by Priority</p>
                <ChartContainer
                  className="h-48 w-full"
                  config={priorityChartData.reduce((acc, item) => {
                    acc[item.key] = {
                      label: item.label,
                      color: item.fill,
                    };
                    return acc;
                  }, {})}
                >
                  <BarChart data={priorityChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {priorityChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
