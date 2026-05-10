import React from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const SprintCompleteDialog = React.memo(({
	open,
	onOpenChange,
	sprintName,
	doneCount,
	openCount,
	nextSprint,
	moveUnfinishedTo,
	onMoveUnfinishedToChange,
	onComplete,
	isPending,
}) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Complete Sprint — {sprintName}</DialogTitle>
					<DialogDescription>
						{doneCount} issues are done. {openCount} issues are still open. Where should the unfinished issues go?
					</DialogDescription>
				</DialogHeader>

				<RadioGroup value={moveUnfinishedTo} onValueChange={onMoveUnfinishedToChange} className="gap-3">
					<label className="flex items-start gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/40">
						<RadioGroupItem value="backlog" id="move-backlog" className="mt-0.5" />
						<div className="space-y-0.5">
							<Label htmlFor="move-backlog" className="cursor-pointer font-medium">
								Move to Backlog
							</Label>
							<p className="text-xs text-muted-foreground">Unfinished issues are removed from this sprint.</p>
						</div>
					</label>

					<label
						className={cn(
							'flex items-start gap-2 rounded-md border px-3 py-2',
							nextSprint
								? 'border-border cursor-pointer hover:bg-muted/40'
								: 'border-border/60 opacity-50 cursor-not-allowed',
						)}
					>
						<RadioGroupItem
							value={nextSprint?.id || 'no-next'}
							id="move-next"
							className="mt-0.5"
							disabled={!nextSprint}
						/>
						<div className="space-y-0.5">
							<Label htmlFor="move-next" className={cn('font-medium', nextSprint ? 'cursor-pointer' : 'cursor-not-allowed')}>
								Move to next sprint
							</Label>
							<p className="text-xs text-muted-foreground">
								{nextSprint ? `Move unfinished issues to ${nextSprint.name}.` : 'No next sprint is available.'}
							</p>
						</div>
					</label>
				</RadioGroup>

				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onComplete} disabled={isPending}>
						{isPending ? 'Completing...' : 'Complete Sprint'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});

SprintCompleteDialog.displayName = 'SprintCompleteDialog';

export default SprintCompleteDialog;
