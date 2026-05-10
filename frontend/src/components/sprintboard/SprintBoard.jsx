import React, { useCallback, useMemo, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock3, LayoutDashboard, Rocket, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import PriorityIcon from './PriorityIcon';
import StatusColumn from './StatusColumn';
import BoardEmptyState from './BoardEmptyState';
import SprintCompleteDialog from './SprintCompleteDialog';

import {
	CATEGORY_ORDER,
	GROUP_BY_OPTIONS,
	PRIORITY_CONFIG,
	PRIORITY_ORDER,
} from './utils/constants';
import {
	formatDateRange,
	formatSprintStatus,
	getCountdownConfig,
	getInitials,
	getStatusBadgeClass,
	parseDroppableId,
} from './utils/helpers';

import { cn } from '@/lib/utils';
import { useIssueStatuses, useIssues } from '@/hooks/useIssues';
import { queryKeys } from '@/hooks/queryKeys';
import { useCompleteSprint, useSprints } from '@/hooks/useSprints';
import { issueService } from '@/services/api/issue.service';

const SprintBoard = ({ orgSlug, projectSlug, project, navigate }) => {
	const queryClient = useQueryClient();

	const [selectedAssigneeId, setSelectedAssigneeId] = useState('all');
	const [search, setSearch] = useState('');
	const [groupBy, setGroupBy] = useState('none');
	const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
	const [moveUnfinishedTo, setMoveUnfinishedTo] = useState('backlog');

	const { data: sprintsData, isLoading: isSprintsLoading, isError: isSprintsError } = useSprints(
		orgSlug,
		projectSlug,
		{},
		{ enabled: Boolean(orgSlug && projectSlug) }
	);

	const sprints = useMemo(() => sprintsData?.sprints ?? [], [sprintsData]);

	const activeSprint = useMemo(
		() => sprints.find((sprint) => String(sprint.status || '').toLowerCase() === 'active') || null,
		[sprints]
	);

	const activeSprintId = activeSprint?.id || null;

	const nextSprint = useMemo(() => {
		if (!activeSprintId) return null;
		return (
			sprints
				.filter(
					(sprint) =>
						sprint.id !== activeSprintId &&
						String(sprint.status || '').toLowerCase() !== 'completed'
				)
				.sort((a, b) => {
					const aDate = new Date(a.startDate || 0).getTime();
					const bDate = new Date(b.startDate || 0).getTime();
					return aDate - bDate;
				})[0] || null
		);
	}, [activeSprintId, sprints]);

	const issueFilters = useMemo(
		() => (activeSprintId ? { sprint: activeSprintId } : {}),
		[activeSprintId]
	);

	const boardIssuesQueryKey = useMemo(
		() => queryKeys.issues.list(orgSlug, projectSlug, issueFilters),
		[orgSlug, projectSlug, issueFilters]
	);

	const { data: issuesData, isLoading: isIssuesLoading, isError: isIssuesError } = useIssues(
		orgSlug,
		projectSlug,
		issueFilters,
		{ enabled: Boolean(orgSlug && projectSlug && activeSprintId) }
	);

	const { data: statusesData, isLoading: isStatusesLoading, isError: isStatusesError } = useIssueStatuses(
		orgSlug,
		projectSlug,
		{ enabled: Boolean(orgSlug && projectSlug && activeSprintId) }
	);

	const { mutateAsync: patchIssue } = useMutation({
		mutationFn: issueService.update,
	});

	const completeSprint = useCompleteSprint();

	const statuses = useMemo(() => {
		const source = statusesData?.statuses ?? [];
		return [...source].sort((a, b) => {
			const categoryDelta = (CATEGORY_ORDER[a.category] || 99) - (CATEGORY_ORDER[b.category] || 99);
			if (categoryDelta !== 0) return categoryDelta;
			return (a.position ?? 0) - (b.position ?? 0);
		});
	}, [statusesData]);

	const issues = useMemo(() => issuesData?.issues ?? [], [issuesData]);

	const assigneeOptions = useMemo(() => {
		const map = new Map();
		for (const issue of issues) {
			if (!issue.assignee?.id) continue;
			if (!map.has(issue.assignee.id)) {
				map.set(issue.assignee.id, issue.assignee);
			}
		}
		return Array.from(map.values()).sort((a, b) =>
			String(a.displayName || a.email || '').localeCompare(String(b.displayName || b.email || ''))
		);
	}, [issues]);

	const filteredIssues = useMemo(() => {
		const query = search.trim().toLowerCase();
		return issues.filter((issue) => {
			if (selectedAssigneeId !== 'all' && issue.assignee?.id !== selectedAssigneeId) {
				return false;
			}
			if (!query) return true;
			// Use local helper if toIssueKey is needed, but for simplicity here we keep inline
			// or import from helpers
			const issueKey = String(issue.issueKey || issue.key || '').toLowerCase();
			const issueTitle = String(issue.title || '').toLowerCase();
			return issueTitle.includes(query) || issueKey.includes(query);
		});
	}, [issues, selectedAssigneeId, search]);

	const lanes = useMemo(() => {
		if (groupBy === 'none') {
			return [{ id: 'all', label: 'All', issues: filteredIssues, type: 'none' }];
		}

		if (groupBy === 'assignee') {
			const grouped = new Map();
			for (const issue of filteredIssues) {
				const assigneeId = issue.assignee?.id || 'unassigned';
				const laneId = `assignee:${assigneeId}`;
				if (!grouped.has(laneId)) {
					grouped.set(laneId, {
						id: laneId,
						type: 'assignee',
						assignee: issue.assignee || null,
						label: issue.assignee?.displayName || issue.assignee?.email || 'Unassigned',
						issues: [],
					});
				}
				grouped.get(laneId).issues.push(issue);
			}
			return Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label));
		}

		// Group by priority
		const grouped = new Map();
		for (const priority of PRIORITY_ORDER) {
			grouped.set(priority, {
				id: `priority:${priority}`,
				type: 'priority',
				priority,
				label: PRIORITY_CONFIG[priority].label,
				issues: [],
			});
		}
		for (const issue of filteredIssues) {
			const priority = String(issue.priority || '').toLowerCase();
			const normalized = PRIORITY_CONFIG[priority] ? priority : 'medium';
			grouped.get(normalized).issues.push(issue);
		}
		return PRIORITY_ORDER.map((p) => grouped.get(p)).filter((l) => l.issues.length > 0);
	}, [filteredIssues, groupBy]);

	const laneColumns = useMemo(() => {
		const groupedByLane = {};
		for (const lane of lanes) {
			groupedByLane[lane.id] = statuses.reduce((acc, status) => {
				acc[status.id] = [];
				return acc;
			}, {});
			for (const issue of lane.issues) {
				const statusId = issue.status?.id;
				if (statusId && groupedByLane[lane.id][statusId]) {
					groupedByLane[lane.id][statusId].push(issue);
				}
			}
		}
		return groupedByLane;
	}, [lanes, statuses]);

	const doneCount = useMemo(
		() => issues.filter((issue) => issue.status?.category === 'done').length,
		[issues]
	);
	const openCount = Math.max(issues.length - doneCount, 0);

	const countdown = useMemo(() => getCountdownConfig(activeSprint?.endDate), [activeSprint?.endDate]);

	const navigateToBacklog = useCallback(() => {
		navigate(`/${orgSlug}/projects/${projectSlug}/backlog`);
	}, [navigate, orgSlug, projectSlug]);

	const onDragEnd = useCallback(
		async (result) => {
			const { destination, source } = result;
			if (!destination) return;

			const sourceDrop = parseDroppableId(source.droppableId);
			const destinationDrop = parseDroppableId(destination.droppableId);

			if (!sourceDrop.statusId || !destinationDrop.statusId) return;

			if (groupBy !== 'none' && sourceDrop.laneId !== destinationDrop.laneId) {
				toast.error('Drag between swimlanes is disabled for grouped view.');
				return;
			}

			if (sourceDrop.statusId === destinationDrop.statusId && source.index === destination.index) {
				return;
			}

			const sourceLaneIssues = laneColumns[sourceDrop.laneId]?.[sourceDrop.statusId] ?? [];
			const movedIssue = sourceLaneIssues[source.index];
			const destinationStatus = statuses.find((status) => status.id === destinationDrop.statusId);

			if (!movedIssue || !destinationStatus) return;

			const issueIdentifier = movedIssue.number ?? movedIssue.issueKey ?? movedIssue.key;
			if (!issueIdentifier) {
				toast.error('Unable to move issue: missing issue identifier.');
				return;
			}

			// Optimistic UI Update
			await queryClient.cancelQueries({ queryKey: boardIssuesQueryKey });
			const previousIssues = queryClient.getQueryData(boardIssuesQueryKey);

			queryClient.setQueryData(boardIssuesQueryKey, (current) => {
				if (!current?.issues) return current;
				return {
					...current,
					issues: current.issues.map((i) =>
						i.id === movedIssue.id
							? {
									...i,
									status: {
										...i.status,
										id: destinationStatus.id,
										name: destinationStatus.name,
										category: destinationStatus.category,
										color: destinationStatus.color,
									},
							  }
							: i
					),
				};
			});

			try {
				const response = await patchIssue({
					orgSlug,
					projectSlug,
					issueNumber: issueIdentifier,
					statusId: destinationStatus.id,
				});

				const confirmedIssue = response?.issue;
				if (confirmedIssue) {
					queryClient.setQueryData(boardIssuesQueryKey, (current) => {
						if (!current?.issues) return current;
						return {
							...current,
							issues: current.issues.map((i) => (i.id === movedIssue.id ? { ...i, ...confirmedIssue } : i)),
						};
					});
				}
			} catch (error) {
				if (previousIssues) {
					queryClient.setQueryData(boardIssuesQueryKey, previousIssues);
				}
				toast.error(error?.response?.data?.message || 'Failed to move issue.');
			}
		},
		[boardIssuesQueryKey, groupBy, laneColumns, orgSlug, patchIssue, projectSlug, queryClient, statuses]
	);

	const handleCompleteSprint = useCallback(() => {
		if (!activeSprintId) return;
		const destination = moveUnfinishedTo === 'no-next' ? 'backlog' : moveUnfinishedTo;

		completeSprint.mutate(
			{
				orgSlug,
				projectSlug,
				sprintId: activeSprintId,
				moveUnfinishedTo: destination,
			},
			{
				onSuccess: () => {
					toast.success('Sprint completed successfully.');
					setIsCompleteDialogOpen(false);
					queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(orgSlug, projectSlug) });
					queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(orgSlug, projectSlug) });
				},
				onError: (error) => {
					toast.error(error?.response?.data?.message || 'Failed to complete sprint.');
				},
			}
		);
	}, [activeSprintId, moveUnfinishedTo, orgSlug, projectSlug, completeSprint, queryClient]);

	if (isSprintsLoading || (activeSprintId && (isIssuesLoading || isStatusesLoading))) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-background">
				<div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
			</div>
		);
	}

	if (isSprintsError || isIssuesError || isStatusesError) {
		return (
			<div className="flex h-full w-full items-center justify-center px-6">
				<div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
					Unable to load sprint board right now. Please refresh.
				</div>
			</div>
		);
	}

	const hasActiveSprint = Boolean(activeSprint);
	const hasActiveSprintIssues = hasActiveSprint && issues.length > 0;

	return (
		<div className="h-full flex flex-col bg-background">
			{/* Zone 1: Header */}
			<div className="h-20 shrink-0 border-b px-6 py-4 flex items-start justify-between gap-4">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-2">
						<h1 className="text-base font-semibold truncate">{activeSprint?.name || 'No Active Sprint'}</h1>
						<Badge
							variant="outline"
							className={cn('text-[10px] uppercase tracking-wide font-semibold', getStatusBadgeClass(activeSprint?.status))}
						>
							{formatSprintStatus(activeSprint?.status || 'inactive')}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground truncate max-w-lg">
						{activeSprint?.goal || 'Start a sprint to track and deliver planned work.'}
					</p>
					<p className="text-xs text-muted-foreground">
						{formatDateRange(activeSprint?.startDate, activeSprint?.endDate)}
					</p>
				</div>
				<div className="flex items-center gap-3 shrink-0">
					<span className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium', countdown.className)}>
						<Clock3 className="size-3.5" />
						{countdown.text}
					</span>
					<Button size="sm" className="h-8" onClick={() => setIsCompleteDialogOpen(true)} disabled={!hasActiveSprint || completeSprint.isPending}>
						Complete Sprint
					</Button>
				</div>
			</div>

			{/* Zone 2: Toolbar */}
			<div className="h-[52px] shrink-0 border-b bg-muted/20 px-6 py-2 flex items-center gap-3">
				<span className="text-xs text-muted-foreground">Assignees:</span>
				<Button size="sm" variant={selectedAssigneeId === 'all' ? 'default' : 'outline'} className="h-7 px-2 text-xs" onClick={() => setSelectedAssigneeId('all')}>
					All
				</Button>
				<div className="flex items-center">
					{assigneeOptions.map((assignee, index) => (
						<button
							key={assignee.id}
							type="button"
							onClick={() => setSelectedAssigneeId(assignee.id)}
							className={cn('relative rounded-full transition-transform hover:-translate-y-0.5', index > 0 && '-ml-2', assignee.id === selectedAssigneeId && 'z-10')}
							title={assignee.displayName || assignee.email}
						>
							<Avatar className={cn('size-7 ring-2 ring-background border border-border', assignee.id === selectedAssigneeId && 'ring-primary')}>
								<AvatarImage src={assignee.avatarUrl} alt={assignee.displayName || assignee.email} />
								<AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
									{getInitials(assignee.displayName || assignee.email)}
								</AvatarFallback>
							</Avatar>
						</button>
					))}
				</div>
				<div className="relative ml-3">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues" className="h-8 w-56 pl-8 text-sm" />
				</div>
				<div className="ml-auto flex items-center gap-2">
					<span className="text-xs text-muted-foreground">Group By:</span>
					<Select value={groupBy} onValueChange={setGroupBy}>
						<SelectTrigger className="h-8 w-[140px]" size="sm">
							<SelectValue placeholder="None" />
						</SelectTrigger>
						<SelectContent>
							{GROUP_BY_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Zone 3: Board */}
			<div className="flex-1 overflow-x-auto overflow-y-hidden">
				{!hasActiveSprint ? (
					<BoardEmptyState icon={Rocket} title="No Active Sprint" description="Start a sprint from your backlog to begin tracking work." onBacklog={navigateToBacklog} />
				) : !hasActiveSprintIssues ? (
					<BoardEmptyState icon={CheckCircle} title="Sprint has no issues" description="Add issues from the Backlog to this sprint." onBacklog={navigateToBacklog} />
				) : !statuses.length ? (
					<BoardEmptyState icon={LayoutDashboard} title="No board columns" description="Create issue statuses to start organizing sprint work." onBacklog={navigateToBacklog} />
				) : filteredIssues.length === 0 ? (
					<div className="flex h-full items-center justify-center px-6">
						<div className="text-center">
							<p className="text-sm font-medium">No issues match your current filters.</p>
							<p className="text-xs text-muted-foreground mt-1">Try clearing assignee or search filters.</p>
						</div>
					</div>
				) : (
					<DragDropContext onDragEnd={onDragEnd}>
						{groupBy === 'none' ? (
							<div className="flex flex-row gap-4 px-6 py-4 h-full min-w-max">
								{statuses.map((status) => (
									<StatusColumn key={status.id} status={status} issues={laneColumns.all?.[status.id] ?? []} laneId="all" projectKey={project?.key} />
								))}
							</div>
						) : (
							<div className="h-full min-w-max overflow-y-auto">
								{lanes.map((lane, index) => (
									<div key={lane.id} className={cn('flex flex-col', index > 0 && 'border-t border-border')}>
										<div className="w-full bg-muted/50 px-6 py-2 border-b border-border/70">
											{lane.type === 'assignee' ? (
												<div className="flex items-center gap-2 text-sm font-medium">
													{lane.assignee ? (
														<Avatar className="size-7 ring-1 ring-border">
															<AvatarImage src={lane.assignee.avatarUrl} alt={lane.assignee.displayName || lane.assignee.email} />
															<AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
																{getInitials(lane.assignee.displayName || lane.assignee.email)}
															</AvatarFallback>
														</Avatar>
													) : (
														<div className="size-7 rounded-full border border-dashed border-muted-foreground/40" />
													)}
													<span>{lane.label}</span>
												</div>
											) : (
												<div className="flex items-center gap-2 text-sm font-medium">
													<PriorityIcon priority={lane.priority} />
													<span>{lane.label}</span>
												</div>
											)}
										</div>
										<div className="flex flex-row gap-4 px-6 py-4 min-w-max">
											{statuses.map((status) => (
												<StatusColumn key={`${lane.id}-${status.id}`} status={status} issues={laneColumns[lane.id]?.[status.id] ?? []} laneId={lane.id} projectKey={project?.key} />
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</DragDropContext>
				)}
			</div>

			<SprintCompleteDialog
				open={isCompleteDialogOpen}
				onOpenChange={setIsCompleteDialogOpen}
				sprintName={activeSprint?.name || 'Sprint'}
				doneCount={doneCount}
				openCount={openCount}
				nextSprint={nextSprint}
				moveUnfinishedTo={moveUnfinishedTo}
				onMoveUnfinishedToChange={setMoveUnfinishedTo}
				onComplete={handleCompleteSprint}
				isPending={completeSprint.isPending}
			/>
		</div>
	);
};

export default React.memo(SprintBoard);
