import React, { useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useOutletContext, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useIssues, useIssueStatuses, useUpdateIssue } from '@/hooks/useIssues';

const POLL_INTERVAL_MS = 15000;
const CATEGORY_ORDER = {
  todo: 1,
  in_progress: 2,
  done: 3,
};

const getInitials = (nameOrEmail) => {
  if (!nameOrEmail) return 'UN';

  const source = String(nameOrEmail).trim();
  if (!source) return 'UN';

  if (source.includes('@')) {
    return source.slice(0, 2).toUpperCase();
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

export default function ProjectBoardPage() {
  const { orgSlug, projectSlug } = useParams();
  const { project } = useOutletContext();
  const { mutateAsync: updateIssue, isPending: isUpdatingIssue } = useUpdateIssue();

  const {
    data: statusesData,
    isLoading: isLoadingStatuses,
    isError: isStatusesError,
  } = useIssueStatuses(orgSlug, projectSlug, {
    enabled: Boolean(orgSlug && projectSlug),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const {
    data: issuesData,
    isLoading: isLoadingIssues,
    isError: isIssuesError,
  } = useIssues(orgSlug, projectSlug, {}, {
    enabled: Boolean(orgSlug && projectSlug),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const statuses = useMemo(() => {
    const source = statusesData?.statuses ?? [];

    return [...source].sort((a, b) => {
      const categoryDelta = (CATEGORY_ORDER[a.category] || 99) - (CATEGORY_ORDER[b.category] || 99);
      if (categoryDelta !== 0) return categoryDelta;

      return (a.position ?? 0) - (b.position ?? 0);
    });
  }, [statusesData]);

  const issues = issuesData?.issues ?? [];

  const issuesByStatus = useMemo(() => {
    const grouped = statuses.reduce((acc, status) => {
      acc[status.id] = [];
      return acc;
    }, {});

    for (const issue of issues) {
      const statusId = issue?.status?.id;
      if (statusId && grouped[statusId]) {
        grouped[statusId].push(issue);
      }
    }

    return grouped;
  }, [issues, statuses]);

  const onDragEnd = useCallback(async (result) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceIssues = issuesByStatus[source.droppableId] ?? [];
    const movedIssue = sourceIssues[source.index];

    if (!movedIssue) return;

    // Reordering inside same status column is currently local-only, so skip API patch.
    if (source.droppableId === destination.droppableId) {
      return;
    }

    if (movedIssue.status?.id === destination.droppableId) {
      return;
    }

    try {
      await updateIssue({
        orgSlug,
        projectSlug,
        issueNumber: movedIssue.number,
        payload: {
          statusId: destination.droppableId,
        },
      });
    } catch (error) {
      console.error('Failed to move issue to a new status:', error);
    }
  }, [issuesByStatus, orgSlug, projectSlug, updateIssue]);

  if (isLoadingStatuses || isLoadingIssues) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F4F5F7]">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isStatusesError || isIssuesError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F4F5F7] px-6">
        <div className="rounded-lg border border-border bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Unable to load board data right now. Please refresh.
        </div>
      </div>
    );
  }

  if (!statuses.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F4F5F7] px-6">
        <div className="rounded-lg border border-border bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          No issue statuses found for this project.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-border bg-white flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{project?.name || 'Project'} Board</h1>
          <p className="text-sm text-slate-500 mt-1">Manage tasks and sprint progress</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">
            {issues.length} issues
          </Badge>
          <Button size="sm" className="bg-[#0747A6] hover:bg-[#0052CC]" disabled>
            <Plus className="w-4 h-4 mr-1" /> Create Task
          </Button>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-hidden bg-[#F4F5F7]">
        <DragDropContext onDragEnd={onDragEnd}>
          <ScrollArea className="h-full" type="auto">
            <div className="flex gap-6 p-6 min-w-max h-full">
              {statuses.map((status) => {
                const tasks = issuesByStatus[status.id] ?? [];

                return (
                  <div key={status.id} className="flex flex-col w-75 shrink-0 bg-[#EBECF0] rounded-[10px]">
                    <div className="px-3 md:px-4 py-3 pb-2 flex items-center justify-between sticky top-0 bg-[#EBECF0] rounded-t-[10px] z-10">
                      <h3 className="font-semibold text-sm text-[#172B4D]">
                        {status.name}
                        <span className="ml-2 text-xs font-normal text-slate-500">{tasks.length}</span>
                      </h3>
                      <button className="text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-200 p-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <Droppable droppableId={status.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 px-2 md:px-3 pb-3 min-h-37.5 transition-colors rounded-b-[10px] ${
                            snapshot.isDraggingOver ? 'bg-slate-200' : ''
                          }`}
                        >
                          <div className="space-y-2">
                            {tasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white p-3 rounded-xl shadow-sm border border-slate-200 group hover:border-[#0747A6] transition-colors ${
                                      snapshot.isDragging ? 'shadow-lg ring-1 ring-[#0747A6]' : ''
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: isUpdatingIssue ? 0.8 : 1,
                                    }}
                                  >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {task.issueKey || `${project?.key || 'CWK'}-${task.number}`}
                                      </span>
                                      <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <p className="text-sm text-[#172B4D] mb-3 leading-snug">
                                      {task.title}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                      <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0 h-5 bg-slate-100 text-slate-600 border-0">
                                        {task.type}
                                      </Badge>
                                      <Avatar className="w-6 h-6 rounded-full border border-slate-200">
                                        <AvatarFallback className="text-[10px] bg-[#0747A6] text-white">
                                          {getInitials(task.assignee?.displayName || task.assignee?.email)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DragDropContext>
      </div>
    </div>
  );
}