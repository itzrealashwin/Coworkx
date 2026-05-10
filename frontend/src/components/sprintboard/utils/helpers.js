import { differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns';

export const parseDate = (value) => {
	if (!value) return null;
	const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
	return isValid(parsed) ? parsed : null;
};

export const toIssueKey = (issue, projectKey) => {
	if (!issue) return '';
	if (issue.issueKey) return issue.issueKey;
	if (issue.key) return issue.key;
	if (issue.number && projectKey) return `${projectKey}-${issue.number}`;
	return `#${issue.id?.slice(0, 6) || 'ISSUE'}`;
};

export const getInitials = (value) => {
	const source = String(value || '').trim();
	if (!source) return 'UN';
	if (source.includes('@')) return source.slice(0, 2).toUpperCase();
	const parts = source.split(/\s+/).filter(Boolean);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

export const formatDateRange = (startDate, endDate) => {
	const start = parseDate(startDate);
	const end = parseDate(endDate);
	if (!start && !end) return 'No dates set';
	const startLabel = start ? format(start, 'MMM d') : '?';
	const endLabel = end ? format(end, 'MMM d') : '?';
	return `${startLabel} → ${endLabel}`;
};

export const formatSprintStatus = (status) => {
	if (!status) return 'Inactive';
	return String(status)
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
};

export const getStatusBadgeClass = (status) => {
	const normalized = String(status || '').toLowerCase();
	if (normalized === 'active') return 'bg-green-100 text-green-700 border-green-200';
	if (normalized === 'planned') return 'bg-blue-100 text-blue-700 border-blue-200';
	if (normalized === 'completed') return 'bg-slate-200 text-slate-700 border-slate-300';
	return 'bg-muted text-muted-foreground border-border';
};

export const getCountdownConfig = (endDate) => {
	const end = parseDate(endDate);
	if (!end) {
		return {
			text: 'No due date',
			className: 'border-slate-300 bg-slate-100 text-slate-700',
		};
	}
	const diffDays = differenceInCalendarDays(startOfDay(end), startOfDay(new Date()));
	if (diffDays < 0) {
		return {
			text: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`,
			className: 'border-red-200 bg-red-100 text-red-700',
		};
	}
	if (diffDays <= 3) {
		return {
			text: diffDays === 0 ? 'Due today' : `${diffDays} day${diffDays === 1 ? '' : 's'} left`,
			className: 'border-amber-200 bg-amber-100 text-amber-700',
		};
	}
	return {
		text: `${diffDays} day${diffDays === 1 ? '' : 's'} left`,
		className: 'border-green-200 bg-green-100 text-green-700',
	};
};

export const buildDroppableId = (laneId, statusId) => `${laneId}::${statusId}`;

export const parseDroppableId = (droppableId) => {
	const split = String(droppableId || '').split('::');
	return {
		laneId: split[0] || 'all',
		statusId: split[1] || '',
	};
};
