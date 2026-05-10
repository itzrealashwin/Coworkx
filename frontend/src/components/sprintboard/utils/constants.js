import {
	AlertCircle,
	ArrowDown,
	ArrowUp,
	Minus,
} from 'lucide-react';

export const CATEGORY_ORDER = {
	todo: 1,
	in_progress: 2,
	in_review: 3,
	done: 4,
};

export const GROUP_BY_OPTIONS = [
	{ value: 'none', label: 'None' },
	{ value: 'assignee', label: 'Assignee' },
	{ value: 'priority', label: 'Priority' },
];

export const PRIORITY_CONFIG = {
	critical: {
		label: 'Critical',
		icon: AlertCircle,
		iconClass: 'text-red-500',
	},
	high: {
		label: 'High',
		icon: ArrowUp,
		iconClass: 'text-orange-500',
	},
	medium: {
		label: 'Medium',
		icon: Minus,
		iconClass: 'text-blue-500',
	},
	low: {
		label: 'Low',
		icon: ArrowDown,
		iconClass: 'text-slate-500',
	},
};

export const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

export const TYPE_BADGE_CLASS = {
	bug: 'border-red-200 bg-red-50 text-red-700',
	task: 'border-border bg-background text-foreground/80',
	story: 'border-blue-200 bg-blue-50 text-blue-700',
};
