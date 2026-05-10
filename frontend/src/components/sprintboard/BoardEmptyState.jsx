import React from 'react';
import { Button } from '@/components/ui/button';

const BoardEmptyState = React.memo(({ icon: Icon, title, description, onBacklog }) => {
	return (
		<div className="flex h-full w-full items-center justify-center px-6">
			<div className="max-w-md text-center">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
					<Icon className="size-12" />
				</div>
				<h3 className="text-base font-semibold">{title}</h3>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
				<Button variant="outline" className="mt-4" onClick={onBacklog}>
					Go to Backlog
				</Button>
			</div>
		</div>
	);
});

BoardEmptyState.displayName = 'BoardEmptyState';

export default BoardEmptyState;
