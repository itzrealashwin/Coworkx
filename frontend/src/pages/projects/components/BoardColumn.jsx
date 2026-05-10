import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import IssueCard from './IssueCard';

export default function BoardColumn({
  status,
  tasks,
  projectKey,
  isUpdatingIssue,
  onEditStatus,
  onEditIssue,
}) {
  return (
    <div className="flex flex-col w-75 shrink-0 bg-[#EBECF0] rounded-[10px]">
      <div className="px-3 md:px-4 py-3 pb-2 flex items-center justify-between sticky top-0 bg-[#EBECF0] rounded-t-[10px] z-10">
        <h3 className="font-semibold text-sm text-[#172B4D]">
          {status.name}
          <span className="ml-2 text-xs font-normal text-slate-500">{tasks.length}</span>
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-200 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEditStatus(status)}>
              Edit Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                <IssueCard
                  key={task.id}
                  task={task}
                  index={index}
                  projectKey={projectKey}
                  isUpdatingIssue={isUpdatingIssue}
                  onEdit={onEditIssue}
                />
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}
