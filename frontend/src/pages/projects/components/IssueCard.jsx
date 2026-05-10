import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

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

export default function IssueCard({ task, index, projectKey, isUpdatingIssue, onEdit }) {
  return (
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
              {task.issueKey || `${projectKey || 'CWK'}-${task.number}`}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-[#172B4D] mb-3 leading-snug">{task.title}</p>
          <div className="flex items-center justify-between mt-auto">
            <Badge
              variant="secondary"
              className="text-[10px] font-medium px-2 py-0 h-5 bg-slate-100 text-slate-600 border-0"
            >
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
  );
}
