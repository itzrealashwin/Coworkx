import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import PriorityIcon from './PriorityIcon';
import { getInitials, toIssueKey } from './utils/helpers';
import { TYPE_BADGE_CLASS } from './utils/constants';

const IssueCard = React.memo(({ issue, index, droppableId, projectKey }) => {
	return (
		<Draggable draggableId={String(issue.id)} index={index}>
			{(provided, snapshot) => (
				<article
					ref={provided.innerRef}
					{...provided.draggableProps}
					{...provided.dragHandleProps}
					className={cn(
						'rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm cursor-grab transition-all',
						'hover:shadow-md hover:border-primary/30',
						snapshot.isDragging && 'border-primary/40 shadow-md',
					)}
					style={provided.draggableProps.style}
					data-droppable={droppableId}
				>
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1.5 min-w-0">
							<PriorityIcon priority={issue.priority} />
							<span className="font-mono text-[11px] text-muted-foreground truncate">
								{toIssueKey(issue, projectKey)}
							</span>
						</div>
						<button
							type="button"
							className="text-muted-foreground/70 hover:text-foreground transition-colors"
							aria-label="Issue actions"
						>
							<MoreHorizontal className="size-3.5" />
						</button>
					</div>

					<p className="mt-2 text-sm font-medium leading-snug line-clamp-2">{issue.title}</p>

					<div className="mt-2.5 flex items-center justify-between gap-2">
						<Badge
							variant="outline"
							className={cn(
								'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md font-semibold',
								TYPE_BADGE_CLASS[String(issue.type || '').toLowerCase()] || TYPE_BADGE_CLASS.task,
							)}
						>
							{String(issue.type || 'Task')}
						</Badge>

						{issue.assignee ? (
							<Avatar className="size-5 ring-1 ring-border">
								<AvatarImage src={issue.assignee.avatarUrl} alt={issue.assignee.displayName || issue.assignee.email} />
								<AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
									{getInitials(issue.assignee.displayName || issue.assignee.email)}
								</AvatarFallback>
							</Avatar>
						) : (
							<div className="size-5 rounded-full border border-dashed border-muted-foreground/40" />
						)}
					</div>
				</article>
			)}
		</Draggable>
	);
});

IssueCard.displayName = 'IssueCard';

export default IssueCard;
