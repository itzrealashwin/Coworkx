import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import IssueCard from './IssueCard';
import { buildDroppableId } from './utils/helpers';

const StatusColumn = React.memo(({ status, issues, laneId, projectKey }) => {
	const droppableId = buildDroppableId(laneId, status.id);

	return (
		<section className="w-72 shrink-0 h-full flex flex-col bg-muted/30 rounded-xl">
			<header className="px-3 py-2.5 flex items-center justify-between border-b border-border/70">
				<div className="flex items-center gap-2 min-w-0">
					<span
						className="size-2 rounded-full shrink-0"
						style={{ backgroundColor: status.color || '#94a3b8' }}
					/>
					<h3 className="text-sm font-semibold truncate">{status.name}</h3>
				</div>
				<span className="rounded-full bg-muted text-muted-foreground text-xs px-1.5 py-0.5">
					{issues.length}
				</span>
			</header>

			<Droppable droppableId={droppableId}>
				{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						className={cn(
							'flex-1 overflow-y-auto px-2 py-2 space-y-2',
							snapshot.isDraggingOver && 'bg-primary/5 rounded-b-xl',
						)}
					>
						{issues.map((issue, index) => (
							<IssueCard
								key={issue.id}
								issue={issue}
								index={index}
								droppableId={droppableId}
								projectKey={projectKey}
							/>
						))}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</section>
	);
});

StatusColumn.displayName = 'StatusColumn';

export default StatusColumn;
